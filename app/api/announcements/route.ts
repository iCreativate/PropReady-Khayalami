import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    WELCOME_ANNOUNCEMENT_TITLE,
    deactivateWelcomePortalAnnouncement,
} from '@/lib/welcome-announcement';

/** Active announcements for the signed-in account's audience (excludes Messages-only welcome). */
export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ announcements: [] });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ announcements: [] });
    }

    await deactivateWelcomePortalAnnouncement();

    const accountType = session.user.accountType;
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('admin_announcements')
        .select('id, title, body, audience, published_at')
        .eq('active', true)
        .or(`audience.eq.all,audience.eq.${accountType}`)
        .order('published_at', { ascending: false })
        .limit(10);

    if (error) {
        return jsonWithSession({ announcements: [] }, session);
    }

    const announcements = (data || [])
        .filter((row) => String(row.title || '') !== WELCOME_ANNOUNCEMENT_TITLE)
        .map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            audience: row.audience,
            publishedAt: row.published_at,
        }));

    return jsonWithSession({ announcements, fetchedAt: now }, session);
}
