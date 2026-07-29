import type { AccountType } from '@/lib/auth-enterprise/config';
import { createServiceClient } from '@/lib/supabase-admin';
import { messagesDb } from '@/lib/messages';

export const WELCOME_ANNOUNCEMENT_TITLE = 'Welcome to PropReady';

export const PROPREADY_SYSTEM_PROFILE_ID = 'system_propready';
export const PROPREADY_SYSTEM_NAME = 'PropReady';

export const WELCOME_ANNOUNCEMENT_BODY = `PropReady helps South Africans buy and sell homes with clarity and confidence.

Here's what you can do on the platform:
• Get a free soft pre-qualification and understand your buying power
• Browse listings and book property viewings with verified agents
• Message agents, originators, and PropReady staff in one inbox
• Upload FICA documents and optionally complete a full bond prequalification
• Sellers can add properties, request valuations, and connect with agents
• Learn through guides and tools that demystify the property journey

Explore your dashboard, complete your profile, and reach out anytime — we're here to help you get home-ready.`;

function welcomeInboxBody(accountType: AccountType): string {
    const intro = `Welcome to PropReady — Your Home. Ready.

PropReady is South Africa's home-readiness platform. We help buyers, sellers, estate agents, and bond originators work together with clarity — from first enquiry to keys in hand.`;

    const learnMore = `

Learn more on the platform
• Open your dashboard for a guided overview of your next steps
• Browse educational tools and calculators that demystify deposits, affordability, and the bond process
• Use Messages to ask PropReady staff, agents, or originators anything about your journey
• Complete your profile so recommendations and matches stay relevant

Reply in this chat anytime if you need help — we're here with you.`;

    if (accountType === 'agent') {
        return `${intro}

What you can do as an agent
• Manage buyer and seller leads from one workspace
• Message clients, upload documents, and propose viewings
• Review PPRA / FFC verification status and grow your PropReady presence
• Share listings and keep conversations organised in Messages

${learnMore.trim()}`;
    }

    if (accountType === 'originator') {
        return `${intro}

What you can do as an originator
• Connect with pre-qualified buyers who need bond guidance
• Message clients and PropReady staff from one inbox
• Track appointments and document requests as applications progress
• Stay visible to agents and buyers looking for trusted originator support

${learnMore.trim()}`;
    }

    return `${intro}

What you can do as a buyer or seller
• Get a free soft pre-qualification and understand your buying power
• Browse listings and book property viewings with verified agents
• Upload FICA documents and optionally complete a full bond prequalification
• Sellers can add properties, request valuations, and connect with agents
• Message agents, originators, and PropReady staff in one inbox

${learnMore.trim()}`;
}

/**
 * Remove only the old mass-broadcast Welcome threads that included a staff admin
 * participant (those flooded Admin → Messages). Keep per-user PropReady system welcomes.
 */
export async function cleanupWelcomeBroadcastThreads() {
    try {
        const db = messagesDb();
        const { data: rows } = await db
            .from('message_conversations')
            .select('id')
            .eq('context_type', 'announcement')
            .eq('subject', WELCOME_ANNOUNCEMENT_TITLE)
            .limit(2000);

        const ids = (rows || []).map((r) => String(r.id)).filter(Boolean);
        if (ids.length === 0) return { deleted: 0 };

        const { data: parts } = await db
            .from('message_participants')
            .select('conversation_id, account_type, profile_id')
            .in('conversation_id', ids);

        const spamIds = new Set<string>();
        for (const p of parts || []) {
            if (
                p.account_type === 'admin' &&
                String(p.profile_id || '').startsWith('admin_') &&
                p.profile_id !== PROPREADY_SYSTEM_PROFILE_ID
            ) {
                spamIds.add(String(p.conversation_id));
            }
        }

        const toDelete = [...spamIds];
        if (toDelete.length === 0) return { deleted: 0 };

        const { error } = await db.from('message_conversations').delete().in('id', toDelete);
        if (error) {
            console.error('cleanupWelcomeBroadcastThreads:', error);
            return { deleted: 0 };
        }
        return { deleted: toDelete.length };
    } catch (err) {
        console.error('cleanupWelcomeBroadcastThreads:', err);
        return { deleted: 0 };
    }
}

/** Idempotently ensure the platform welcome announcement exists (portal banner). */
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

/**
 * Send a one-time Welcome conversation into a new user's Messages inbox.
 * Uses a PropReady system sender and context_type=announcement so it does not
 * clutter the staff admin inbox (which hides announcement threads).
 */
export async function sendWelcomeInboxMessage(input: {
    accountType: AccountType;
    profileId: string;
    displayName?: string | null;
}) {
    const profileId = String(input.profileId || '').trim();
    if (!profileId || !input.accountType) return { sent: false as const };

    try {
        const db = messagesDb();

        const { data: existingParts } = await db
            .from('message_participants')
            .select('conversation_id')
            .eq('account_type', input.accountType)
            .eq('profile_id', profileId);

        const existingIds = (existingParts || []).map((p) => String(p.conversation_id));
        if (existingIds.length > 0) {
            const { data: existingWelcome } = await db
                .from('message_conversations')
                .select('id')
                .in('id', existingIds)
                .eq('context_type', 'announcement')
                .eq('subject', WELCOME_ANNOUNCEMENT_TITLE)
                .limit(1)
                .maybeSingle();
            if (existingWelcome?.id) {
                return { sent: false as const, reason: 'already_exists' as const };
            }
        }

        const now = new Date().toISOString();
        const body = welcomeInboxBody(input.accountType);
        const preview = 'Welcome to PropReady! Learn what you can do on the platform.';

        const { data: conversation, error: convErr } = await db
            .from('message_conversations')
            .insert({
                subject: WELCOME_ANNOUNCEMENT_TITLE,
                context_type: 'announcement',
                created_by_account_type: 'admin',
                created_by_profile_id: PROPREADY_SYSTEM_PROFILE_ID,
                last_message_at: now,
                last_message_preview: preview.slice(0, 140),
                updated_at: now,
            })
            .select('id')
            .single();

        if (convErr || !conversation) {
            console.error('sendWelcomeInboxMessage conversation:', convErr);
            return { sent: false as const };
        }

        const { error: partErr } = await db.from('message_participants').insert([
            {
                conversation_id: conversation.id,
                account_type: 'admin',
                profile_id: PROPREADY_SYSTEM_PROFILE_ID,
                display_name: PROPREADY_SYSTEM_NAME,
            },
            {
                conversation_id: conversation.id,
                account_type: input.accountType,
                profile_id: profileId,
                display_name: input.displayName || null,
            },
        ]);

        if (partErr) {
            console.error('sendWelcomeInboxMessage participants:', partErr);
            await db.from('message_conversations').delete().eq('id', conversation.id);
            return { sent: false as const };
        }

        const { error: msgErr } = await db.from('message_items').insert({
            conversation_id: conversation.id,
            kind: 'text',
            body,
            meta: { isWelcome: true, source: 'system' },
            sender_account_type: 'admin',
            sender_profile_id: PROPREADY_SYSTEM_PROFILE_ID,
            sender_name: PROPREADY_SYSTEM_NAME,
            created_at: now,
        });

        if (msgErr) {
            console.error('sendWelcomeInboxMessage message:', msgErr);
            await db.from('message_conversations').delete().eq('id', conversation.id);
            return { sent: false as const };
        }

        return { sent: true as const, conversationId: conversation.id };
    } catch (err) {
        console.error('sendWelcomeInboxMessage:', err);
        return { sent: false as const };
    }
}

/** Banner + per-user inbox welcome for a newly registered account. */
export async function welcomeNewUser(input: {
    accountType: AccountType;
    profileId: string;
    displayName?: string | null;
}) {
    await ensureWelcomeAnnouncement();
    await sendWelcomeInboxMessage(input);
}
