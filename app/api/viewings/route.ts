import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function toViewingRow(v: Record<string, unknown>) {
    const buyerEmail = v.buyerEmail ?? v.buyer_email;
    const sellerEmail = v.sellerEmail ?? v.seller_email;
    const contactType = (v.contactType ?? v.contact_type ?? 'buyer') as string;
    const contactEmail = v.contactEmail ?? v.contact_email ?? '';
    return {
        id: v.id,
        property_id: v.propertyId ?? v.property_id,
        property_title: v.propertyTitle ?? v.property_title ?? '',
        property_address: v.propertyAddress ?? v.property_address ?? null,
        property_price: v.propertyPrice ?? v.property_price ?? null,
        agent_id: v.agentId ?? v.agent_id ?? null,
        contact_name: v.contactName ?? v.contact_name ?? v.buyerName ?? v.buyer_name ?? '',
        contact_email: contactEmail || buyerEmail || sellerEmail || '',
        contact_phone: v.contactPhone ?? v.contact_phone ?? v.buyerPhone ?? v.buyer_phone ?? null,
        contact_type: contactType,
        buyer_lead_id: v.buyerLeadId ?? v.buyer_lead_id ?? null,
        seller_lead_id: v.sellerLeadId ?? v.seller_lead_id ?? null,
        buyer_name: v.buyerName ?? v.buyer_name ?? null,
        buyer_email: buyerEmail ?? (contactType === 'buyer' ? contactEmail : null),
        buyer_phone: v.buyerPhone ?? v.buyer_phone ?? null,
        seller_name: v.sellerName ?? v.seller_name ?? null,
        seller_email: sellerEmail ?? (contactType === 'seller' ? contactEmail : null),
        seller_phone: v.sellerPhone ?? v.seller_phone ?? null,
        buyer_confirmed_at: v.buyerConfirmedAt ?? v.buyer_confirmed_at ?? null,
        seller_confirmed_at: v.sellerConfirmedAt ?? v.seller_confirmed_at ?? null,
        viewing_date: v.date ?? v.viewing_date ?? '',
        viewing_time: v.time ?? v.viewing_time ?? '',
        status: v.status ?? 'scheduled',
        notes: v.notes ?? null,
    };
}

function fromViewingRow(row: Record<string, unknown>) {
    const contactType = (row.contact_type ?? 'buyer') as string;
    const contactEmail = row.contact_email as string | undefined;
    return {
        id: row.id,
        propertyId: row.property_id,
        propertyTitle: row.property_title,
        propertyAddress: row.property_address ?? '',
        propertyPrice: row.property_price != null ? Number(row.property_price) : 0,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone ?? '',
        contactType: contactType,
        buyerLeadId: row.buyer_lead_id ?? null,
        sellerLeadId: row.seller_lead_id ?? null,
        buyerName: row.buyer_name ?? null,
        buyerEmail: row.buyer_email ?? (contactType === 'buyer' ? contactEmail : null),
        buyerPhone: row.buyer_phone ?? null,
        sellerName: row.seller_name ?? null,
        sellerEmail: row.seller_email ?? (contactType === 'seller' ? contactEmail : null),
        sellerPhone: row.seller_phone ?? null,
        buyerConfirmedAt: row.buyer_confirmed_at ?? null,
        sellerConfirmedAt: row.seller_confirmed_at ?? null,
        date: row.viewing_date,
        time: row.viewing_time,
        status: row.status ?? 'scheduled',
        notes: row.notes ?? '',
        chatMessages: Array.isArray(row.chat_messages) ? row.chat_messages : [],
        timestamp: row.created_at ?? row.updated_at,
        agentId: row.agent_id ?? null,
    };
}

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ viewings: [] }, { status: 200 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const contactEmail = searchParams.get('contactEmail');

        let query = supabase
            .from('viewing_appointments')
            .select('*')
            .order('viewing_date', { ascending: true })
            .order('viewing_time', { ascending: true });

        if (agentId) {
            query = query.eq('agent_id', agentId);
        }
        if (contactEmail) {
            query = query.eq('contact_email', contactEmail);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ viewings: [] }, { status: 200 });
            }
            console.error('Supabase viewings GET error:', error);
            return NextResponse.json({ viewings: [] }, { status: 200 });
        }

        const viewings = (data || []).map(fromViewingRow);
        return NextResponse.json(
            { viewings },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('API viewings GET error:', err);
        return NextResponse.json({ viewings: [] }, { status: 200 });
    }
}

export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const row = toViewingRow(body);

        if (!row.id || !row.contact_email || !row.contact_name || !row.property_id || !row.property_title) {
            return NextResponse.json(
                { success: false, error: 'Invalid viewing data' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('viewing_appointments')
            .upsert([{ ...row, updated_at: new Date().toISOString() }], { onConflict: 'id' });

        if (error) {
            console.error('Supabase viewings POST error:', error);
            const hint = error.code === '42P01'
                ? ' Run supabase-migration-viewings.sql in Supabase SQL Editor.'
                : '';
            return NextResponse.json(
                { success: false, error: error.message + hint, code: error.code },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API viewings POST error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) {
            return NextResponse.json({ success: false, error: 'Viewing id required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const dbUpdates: Record<string, unknown> = {};
        if (updates.status != null) dbUpdates.status = updates.status;
        if (updates.notes != null) dbUpdates.notes = updates.notes;
        if (updates.date != null) dbUpdates.viewing_date = updates.date;
        if (updates.time != null) dbUpdates.viewing_time = updates.time;
        if (updates.buyerConfirmedAt != null) dbUpdates.buyer_confirmed_at = updates.buyerConfirmedAt;
        if (updates.sellerConfirmedAt != null) dbUpdates.seller_confirmed_at = updates.sellerConfirmedAt;
        dbUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('viewing_appointments')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Supabase viewings PATCH error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API viewings PATCH error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Viewing id required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('viewing_appointments').delete().eq('id', id);

        if (error) {
            console.error('Supabase viewings DELETE error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API viewings DELETE error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
