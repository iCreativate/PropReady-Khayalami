import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasDualPartyViewing } from '@/lib/lead-verification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function normEmail(email?: string | null): string {
    return (email || '').trim().toLowerCase();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { viewingId, party, email } = body as {
            viewingId?: string;
            party?: 'buyer' | 'seller';
            email?: string;
        };

        if (!viewingId || !party || !email) {
            return NextResponse.json(
                { success: false, error: 'viewingId, party, and email are required' },
                { status: 400 }
            );
        }

        const userEmail = normEmail(email);
        const now = new Date().toISOString();

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: true,
                localOnly: true,
                party,
                confirmedAt: now,
                fullyVerified: false,
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: viewing, error: fetchError } = await supabase
            .from('viewing_appointments')
            .select('*')
            .eq('id', viewingId)
            .single();

        if (fetchError || !viewing) {
            return NextResponse.json({ success: false, error: 'Viewing not found' }, { status: 404 });
        }

        const buyerEmail = normEmail(viewing.buyer_email || (viewing.contact_type === 'buyer' ? viewing.contact_email : ''));
        const sellerEmail = normEmail(viewing.seller_email || (viewing.contact_type === 'seller' ? viewing.contact_email : ''));

        if (party === 'buyer' && userEmail !== buyerEmail) {
            return NextResponse.json({ success: false, error: 'Email does not match buyer on this appointment' }, { status: 403 });
        }
        if (party === 'seller' && userEmail !== sellerEmail) {
            return NextResponse.json({ success: false, error: 'Email does not match seller on this appointment' }, { status: 403 });
        }

        const updates: Record<string, unknown> = { updated_at: now };
        if (party === 'buyer') updates.buyer_confirmed_at = now;
        else updates.seller_confirmed_at = now;

        const { data: updated, error: updateError } = await supabase
            .from('viewing_appointments')
            .update(updates)
            .eq('id', viewingId)
            .select()
            .single();

        if (updateError) {
            console.error('Viewing confirm error:', updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        const vData = {
            buyerEmail: updated.buyer_email,
            sellerEmail: updated.seller_email,
            buyerConfirmedAt: updated.buyer_confirmed_at,
            sellerConfirmedAt: updated.seller_confirmed_at,
            contactEmail: updated.contact_email,
            contactType: updated.contact_type,
        };

        const fullyVerified =
            hasDualPartyViewing(vData) &&
            !!updated.buyer_confirmed_at &&
            !!updated.seller_confirmed_at;

        if (fullyVerified) {
            const leadIds = [updated.buyer_lead_id, updated.seller_lead_id].filter(Boolean) as string[];
            if (leadIds.length > 0) {
                await supabase
                    .from('leads')
                    .update({
                        appointment_verified: true,
                        verified_viewing_id: viewingId,
                        updated_at: now,
                    })
                    .in('id', leadIds);
            }
        }

        return NextResponse.json({
            success: true,
            party,
            confirmedAt: now,
            buyerConfirmed: !!updated.buyer_confirmed_at,
            sellerConfirmed: !!updated.seller_confirmed_at,
            fullyVerified,
        });
    } catch (err) {
        console.error('API viewings/confirm error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
