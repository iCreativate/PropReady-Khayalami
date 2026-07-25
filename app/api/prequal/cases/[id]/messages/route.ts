import { NextRequest, NextResponse } from 'next/server';
import { canAccessCase, resolvePrequalActor } from '@/lib/prequal-auth';
import type { PrequalCaseRow, PrequalMessageRow } from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const actor = await resolvePrequalActor(request);
        const userIdParam = request.nextUrl.searchParams.get('userId')?.trim();
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
        const allowed =
            (actor && canAccessCase(actor, row)) ||
            (userIdParam && row.buyer_user_id === userIdParam);
        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { data: messages, error } = await supabase
            .from('prequal_messages')
            .select('*')
            .eq('case_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            messages: ((messages ?? []) as PrequalMessageRow[]).map((m) => ({
                id: m.id,
                senderRole: m.sender_role,
                senderProfileId: m.sender_profile_id,
                senderName: m.sender_name,
                body: m.body,
                createdAt: m.created_at,
            })),
        });
    } catch (err) {
        console.error('GET messages:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const text = String(body.body || '').trim();
        if (!text) {
            return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
        }

        const actor = await resolvePrequalActor(request);
        const userIdParam = String(body.userId || '').trim();
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

        let senderRole: 'buyer' | 'originator' | null = null;
        let senderProfileId = '';
        let senderName: string | null = null;

        if (actor && canAccessCase(actor, row)) {
            senderRole = actor.role;
            senderProfileId = actor.profileId;
            senderName = actor.fullName || null;
        } else if (userIdParam && row.buyer_user_id === userIdParam) {
            senderRole = 'buyer';
            senderProfileId = userIdParam;
            senderName = String(body.senderName || '') || null;
        }

        if (!senderRole || !senderProfileId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { data: message, error } = await supabase
            .from('prequal_messages')
            .insert({
                case_id: id,
                sender_role: senderRole,
                sender_profile_id: senderProfileId,
                sender_name: senderName,
                body: text.slice(0, 4000),
            })
            .select('*')
            .single();

        if (error || !message) {
            return NextResponse.json({ success: false, error: error?.message || 'Could not send' }, { status: 500 });
        }

        await supabase
            .from('prequal_cases')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id);

        const m = message as PrequalMessageRow;
        return NextResponse.json({
            success: true,
            message: {
                id: m.id,
                senderRole: m.sender_role,
                senderProfileId: m.sender_profile_id,
                senderName: m.sender_name,
                body: m.body,
                createdAt: m.created_at,
            },
        });
    } catch (err) {
        console.error('POST messages:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
