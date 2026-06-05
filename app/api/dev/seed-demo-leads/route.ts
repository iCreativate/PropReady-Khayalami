import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDemoLeadsApiPayload } from '@/lib/demo-leads';
import { createServiceClient } from '@/lib/supabase-admin';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config';

function isDevSeedAllowed(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_SEED === 'true';
}

function toLeadRow(lead: Record<string, unknown>) {
    const type = (lead.leadType ?? 'buyer') as string;
    return {
        id: lead.id,
        agent_id: null,
        lead_type: type === 'seller' ? 'seller' : 'buyer',
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone ?? null,
        monthly_income: lead.monthlyIncome ?? null,
        deposit_saved: lead.depositSaved ?? null,
        employment_status: lead.employmentStatus ?? null,
        credit_score: lead.creditScore ?? null,
        score: lead.score ?? null,
        pre_qual_amount: lead.preQualAmount ?? null,
        property_address: lead.propertyAddress ?? null,
        property_type: lead.propertyType ?? null,
        current_value: lead.currentValue ?? null,
        timeline: lead.timeline ?? null,
        status: lead.status ?? 'new',
        city: lead.city ?? null,
        bond_originator: lead.bondOriginator ?? null,
        prequalified_with_originator: lead.prequalifiedWithOriginator ?? false,
        appointment_verified: lead.appointmentVerified ?? false,
    };
}

export async function POST() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const payload = getDemoLeadsApiPayload();
    const supabase =
        createServiceClient() ||
        (getSupabaseUrl().startsWith('https://') && getSupabaseAnonKey()
            ? createClient(getSupabaseUrl(), getSupabaseAnonKey())
            : null);

    const errors: string[] = [];

    if (supabase) {
        for (const lead of [...payload.buyers, ...payload.sellers]) {
            const row = toLeadRow(lead as Record<string, unknown>);
            const { error } = await supabase.from('leads').upsert(row, { onConflict: 'id' });
            if (error) errors.push(`lead ${row.id}: ${error.message}`);
        }

        for (const v of payload.viewings) {
            const { error } = await supabase.from('viewing_appointments').upsert(
                {
                    id: v.id,
                    property_id: v.propertyId,
                    property_title: v.propertyTitle,
                    property_address: v.propertyAddress,
                    property_price: v.propertyPrice,
                    agent_id: v.agentId,
                    buyer_lead_id: v.buyerLeadId,
                    seller_lead_id: v.sellerLeadId,
                    buyer_name: v.buyerName,
                    buyer_email: v.buyerEmail,
                    buyer_phone: v.buyerPhone,
                    seller_name: v.sellerName,
                    seller_email: v.sellerEmail,
                    seller_phone: v.sellerPhone,
                    buyer_confirmed_at: v.buyerConfirmedAt,
                    seller_confirmed_at: v.sellerConfirmedAt,
                    contact_name: v.contactName,
                    contact_email: v.contactEmail,
                    contact_phone: v.contactPhone,
                    contact_type: v.contactType,
                    viewing_date: v.date,
                    viewing_time: v.time,
                    status: v.status,
                    notes: v.notes,
                },
                { onConflict: 'id' }
            );
            if (error) errors.push(`viewing ${v.id}: ${error.message}`);
        }
    }

    return NextResponse.json({
        success: errors.length === 0,
        seeded: true,
        counts: {
            buyers: payload.buyers.length,
            sellers: payload.sellers.length,
            viewings: payload.viewings.length,
        },
        payload,
        errors: errors.length ? errors : undefined,
        note: 'Also call mergeDemoLeadsIntoStorage() in the browser when logged in as the demo agent.',
    });
}
