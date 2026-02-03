import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function toViewingRow(v: Record<string, unknown>) {
    return {
        id: v.id,
        property_id: v.propertyId ?? v.property_id,
        property_title: v.propertyTitle ?? v.property_title ?? '',
        property_address: v.propertyAddress ?? v.property_address ?? null,
        agent_id: v.agentId ?? v.agent_id ?? null,
        contact_name: v.contactName ?? v.contact_name ?? '',
        contact_email: v.contactEmail ?? v.contact_email ?? '',
        contact_phone: v.contactPhone ?? v.contact_phone ?? null,
        contact_type: v.contactType ?? v.contact_type ?? 'buyer',
        viewing_date: v.date ?? v.viewing_date ?? '',
        viewing_time: v.time ?? v.viewing_time ?? '',
        status: v.status ?? 'scheduled',
        notes: v.notes ?? null,
    };
}

function fromViewingRow(row: Record<string, unknown>) {
    return {
        id: row.id,
        propertyId: row.property_id,
        propertyTitle: row.property_title,
        propertyAddress: row.property_address ?? '',
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone ?? '',
        contactType: row.contact_type ?? 'buyer',
        date: row.viewing_date,
        time: row.viewing_time,
        status: row.status ?? 'scheduled',
        notes: row.notes ?? '',
        timestamp: row.created_at ?? row.updated_at,
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
