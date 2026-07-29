import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';
import { broadcastAdminMessage, type BroadcastAudience } from '@/lib/admin-broadcast';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);

    if (error) {
        return NextResponse.json(
            {
                error:
                    /relation|does not exist|schema cache/i.test(error.message)
                        ? 'Run supabase/migrations/20260728_admin_announcements_impersonation.sql in Supabase.'
                        : error.message,
            },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        announcements: (data || []).map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            audience: row.audience,
            active: row.active,
            createdByEmail: row.created_by_email,
            publishedAt: row.published_at,
            expiresAt: row.expires_at,
        })),
    });
}

export async function POST(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const title = String(body.title || '').trim();
        const text = String(body.body || '').trim();
        const audience = String(body.audience || 'all').trim();
        const alsoMessage = body.alsoMessage === true;
        const isWelcomeBanner =
            title.toLowerCase() === 'welcome to propready' ||
            title.toLowerCase().startsWith('welcome to propready');

        if (!title || !text) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }
        if (!['all', 'user', 'agent', 'originator'].includes(audience)) {
            return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('admin_announcements')
            .insert({
                title,
                body: text,
                audience,
                active: true,
                created_by_email: auth.email,
                published_at: new Date().toISOString(),
            })
            .select('*')
            .single();

        if (error || !data) {
            return NextResponse.json(
                {
                    error:
                        error?.message?.includes('admin_announcements') ||
                        /relation|does not exist/i.test(error?.message || '')
                            ? 'Run supabase/migrations/20260728_admin_announcements_impersonation.sql in Supabase.'
                            : error?.message || 'Could not publish',
                },
                { status: 500 }
            );
        }

        let broadcast: { sent?: number; recipientCount?: number; errorCount?: number } | null = null;
        // Welcome is a portal banner for users — never fan-out as inbox threads (floods admin).
        if (alsoMessage && !isWelcomeBanner) {
            const result = await broadcastAdminMessage({
                adminEmail: auth.email,
                audience: audience as BroadcastAudience,
                subject: title,
                body: text,
            });
            broadcast = {
                sent: result.sent,
                recipientCount: result.recipientCount,
                errorCount: result.errors.length,
            };
        }

        return NextResponse.json({
            success: true,
            announcement: {
                id: data.id,
                title: data.title,
                body: data.body,
                audience: data.audience,
                active: data.active,
                publishedAt: data.published_at,
            },
            broadcast,
        });
    } catch (err) {
        console.error('admin announcements POST:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.active === 'boolean') updates.active = body.active;
    if (body.title) updates.title = String(body.title).trim();
    if (body.body) updates.body = String(body.body).trim();

    const { error } = await supabase.from('admin_announcements').update(updates).eq('id', id);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
