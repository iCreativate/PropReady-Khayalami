import { NextRequest, NextResponse } from 'next/server';
import { BUYER_DOCUMENT_MAX_BYTES, BUYER_DOCUMENT_MIME_TYPES } from '@/lib/buyer-documents';
import { canAccessCase, resolvePrequalActor } from '@/lib/prequal-auth';
import type { PrequalCaseRow } from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

const BUCKET = 'prequal-letters';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const actor = await resolvePrequalActor(request);
        if (!actor || actor.role !== 'originator') {
            return NextResponse.json({ success: false, error: 'Originator access required' }, { status: 403 });
        }

        const formData = await request.formData();
        const officialAmount = Number(formData.get('officialAmount') || 0);
        const notes = String(formData.get('notes') || '').trim();
        const rawFile = formData.get('file');

        if (!Number.isFinite(officialAmount) || officialAmount < 50000) {
            return NextResponse.json(
                { success: false, error: 'Official amount must be at least R50,000' },
                { status: 400 }
            );
        }

        const file: File | null =
            rawFile instanceof File
                ? rawFile
                : rawFile && typeof rawFile === 'object' && 'size' in rawFile
                  ? new File([rawFile as Blob], 'letter.pdf', {
                        type: (rawFile as Blob).type || 'application/pdf',
                    })
                  : null;

        if (!file || file.size === 0) {
            return NextResponse.json({ success: false, error: 'Letter file required' }, { status: 400 });
        }
        if (file.size > BUYER_DOCUMENT_MAX_BYTES) {
            return NextResponse.json({ success: false, error: 'File must be 3MB or smaller' }, { status: 400 });
        }
        const mime = file.type || 'application/pdf';
        if (!BUYER_DOCUMENT_MIME_TYPES.includes(mime as (typeof BUYER_DOCUMENT_MIME_TYPES)[number])) {
            return NextResponse.json({ success: false, error: 'Use PDF, JPG, or PNG' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const { data: caseRow } = await supabase
            .from('prequal_cases')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (!caseRow) {
            return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
        }
        const row = caseRow as PrequalCaseRow;
        if (!canAccessCase(actor, row)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
        const storagePath = `${row.organization_id}/${id}/prequal-letter.${ext}`;

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
            contentType: mime,
            upsert: true,
        });

        if (uploadError) {
            const hint = uploadError.message?.includes('Bucket not found')
                ? ' Run supabase/migrations/20260719_originator_portal.sql'
                : '';
            return NextResponse.json(
                { success: false, error: uploadError.message + hint },
                { status: 500 }
            );
        }

        const now = new Date().toISOString();
        const { data: updated, error } = await supabase
            .from('prequal_cases')
            .update({
                status: 'result_ready',
                official_amount: officialAmount,
                result_letter_path: storagePath,
                result_notes: notes || null,
                assigned_originator_id: actor.profileId,
                updated_at: now,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error || !updated) {
            return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
        }

        await supabase.from('prequal_messages').insert({
            case_id: id,
            sender_role: 'originator',
            sender_profile_id: actor.profileId,
            sender_name: actor.fullName || 'Originator',
            body: `Full pre-qualification result uploaded for R${officialAmount.toLocaleString('en-ZA')}.${notes ? `\n\n${notes}` : ''}`,
        });

        await supabase
            .from('leads')
            .update({
                bond_originator: row.organization_id,
                prequalified_with_originator: true,
                updated_at: now,
            })
            .eq('user_id', row.buyer_user_id);

        return NextResponse.json({
            success: true,
            case: {
                id: updated.id,
                status: updated.status,
                officialAmount: Number(updated.official_amount),
                resultLetterPath: updated.result_letter_path,
            },
        });
    } catch (err) {
        console.error('POST result:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
