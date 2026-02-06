import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function toPropertyRow(p: Record<string, unknown>) {
    return {
        id: p.id,
        agent_id: p.agentId ?? p.agent_id ?? null,
        title: p.title ?? '',
        address: p.address ?? '',
        type: p.type ?? '',
        price: Number(p.price ?? 0),
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        size: p.size ?? null,
        description: p.description ?? null,
        images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
        features: Array.isArray(p.features) ? p.features : (p.features ? [p.features] : []),
        video_url: p.videoUrl ?? p.video_url ?? null,
        published: p.published !== false,
        listing_score: p.listingScore ?? p.listing_score ?? null,
    };
}

function fromPropertyRow(row: Record<string, unknown>) {
    return {
        id: row.id,
        agentId: row.agent_id,
        title: row.title,
        address: row.address,
        type: row.type,
        price: Number(row.price ?? 0),
        bedrooms: row.bedrooms ?? 0,
        bathrooms: row.bathrooms ?? 0,
        size: row.size ?? 0,
        description: row.description ?? '',
        images: Array.isArray(row.images) ? row.images : [],
        features: Array.isArray(row.features) ? row.features : [],
        videoUrl: row.video_url ?? '',
        published: row.published !== false,
        listingScore: row.listing_score ?? null,
        timestamp: row.created_at ?? row.updated_at,
    };
}

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ properties: [] }, { status: 200 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const id = searchParams.get('id');
        const publishedOnly = searchParams.get('published') !== 'false';

        let query = supabase
            .from('listed_properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (agentId) {
            query = query.eq('agent_id', agentId);
        }
        if (id) {
            query = query.eq('id', id);
        }
        if (publishedOnly) {
            query = query.eq('published', true);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ properties: [] }, { status: 200 });
            }
            console.error('Supabase properties GET error:', error);
            return NextResponse.json({ properties: [] }, { status: 200 });
        }

        const properties = (data || []).map(fromPropertyRow);
        return NextResponse.json(
            { properties },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('API properties GET error:', err);
        return NextResponse.json({ properties: [] }, { status: 200 });
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
        const row = toPropertyRow(body);

        if (!row.id || !row.title || !row.address || !row.type) {
            return NextResponse.json(
                { success: false, error: 'Invalid property data' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('listed_properties')
            .upsert([{ ...row, updated_at: new Date().toISOString() }], { onConflict: 'id' });

        if (error) {
            console.error('Supabase properties POST error:', error);
            const hint = error.code === '42P01'
                ? ' Run supabase-migration-properties.sql in Supabase SQL Editor.'
                : '';
            return NextResponse.json(
                { success: false, error: error.message + hint, code: error.code },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API properties POST error:', err);
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
            return NextResponse.json({ success: false, error: 'Property id required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const dbUpdates: Record<string, unknown> = {};
        if (updates.published != null) dbUpdates.published = updates.published;
        if (updates.title != null) dbUpdates.title = updates.title;
        if (updates.address != null) dbUpdates.address = updates.address;
        if (updates.type != null) dbUpdates.type = updates.type;
        if (updates.price != null) dbUpdates.price = updates.price;
        if (updates.bedrooms != null) dbUpdates.bedrooms = updates.bedrooms;
        if (updates.bathrooms != null) dbUpdates.bathrooms = updates.bathrooms;
        if (updates.size != null) dbUpdates.size = updates.size;
        if (updates.description != null) dbUpdates.description = updates.description;
        if (updates.images != null) dbUpdates.images = updates.images;
        if (updates.features != null) dbUpdates.features = updates.features;
        if (updates.videoUrl != null) dbUpdates.video_url = updates.videoUrl;
        dbUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('listed_properties')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Supabase properties PATCH error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API properties PATCH error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
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
            return NextResponse.json({ success: false, error: 'Property id required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('listed_properties').delete().eq('id', id);

        if (error) {
            console.error('Supabase properties DELETE error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API properties DELETE error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
