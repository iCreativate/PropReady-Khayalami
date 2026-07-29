import { createServiceClient } from '@/lib/supabase-admin';

export const WELCOME_ANNOUNCEMENT_TITLE = 'Welcome to PropReady';

export const WELCOME_ANNOUNCEMENT_BODY = `PropReady helps South Africans buy and sell homes with clarity and confidence.

Here's what you can do on the platform:
• Get a free soft pre-qualification and understand your buying power
• Browse listings and book property viewings with verified agents
• Message agents, originators, and PropReady staff in one inbox
• Upload FICA documents and optionally complete a full bond prequalification
• Sellers can add properties, request valuations, and connect with agents
• Learn through guides and tools that demystify the property journey

Explore your dashboard, complete your profile, and reach out anytime — we're here to help you get home-ready.`;

/** Idempotently ensure the platform welcome announcement exists and is active. */
export async function ensureWelcomeAnnouncement() {
    const supabase = createServiceClient();
    if (!supabase) return;

    try {
        const { data: existing } = await supabase
            .from('admin_announcements')
            .select('id, active')
            .eq('title', WELCOME_ANNOUNCEMENT_TITLE)
            .eq('audience', 'all')
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existing?.id) {
            if (!existing.active) {
                await supabase
                    .from('admin_announcements')
                    .update({
                        active: true,
                        body: WELCOME_ANNOUNCEMENT_BODY,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);
            }
            return;
        }

        await supabase.from('admin_announcements').insert({
            title: WELCOME_ANNOUNCEMENT_TITLE,
            body: WELCOME_ANNOUNCEMENT_BODY,
            audience: 'all',
            active: true,
            created_by_email: 'system@propready.local',
            published_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('ensureWelcomeAnnouncement:', err);
    }
}
