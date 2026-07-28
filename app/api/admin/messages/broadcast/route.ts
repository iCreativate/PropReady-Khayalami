import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { broadcastAdminMessage, type BroadcastAudience } from '@/lib/admin-broadcast';

/** Broadcast a direct message to everyone (or an audience). */
export async function POST(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const audience = String(body.audience || 'all') as BroadcastAudience;
        const subject = String(body.subject || 'PropReady update').trim() || 'PropReady update';
        const text = String(body.body || '').trim();

        if (!text) {
            return NextResponse.json({ error: 'Message body required' }, { status: 400 });
        }
        if (!['all', 'user', 'agent', 'originator'].includes(audience)) {
            return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
        }

        const result = await broadcastAdminMessage({
            adminEmail: auth.email,
            audience,
            subject,
            body: text,
        });

        if (result.recipientCount === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            ...result,
            errorCount: result.errors.length,
            errors: result.errors.slice(0, 10),
        });
    } catch (err) {
        console.error('admin broadcast:', err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error && /admin|check|constraint|announcement/i.test(err.message)
                        ? 'Run supabase/migrations/20260728_admin_announcements_impersonation.sql (and admin messages migration).'
                        : 'Server error',
            },
            { status: 500 }
        );
    }
}
