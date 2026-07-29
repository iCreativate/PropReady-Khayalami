import type { AccountType } from '@/lib/auth-enterprise/config';
import { createServiceClient } from '@/lib/supabase-admin';
import { messagesDb } from '@/lib/messages';

export const WELCOME_ANNOUNCEMENT_TITLE = 'Welcome to PropReady';

export const PROPREADY_SYSTEM_PROFILE_ID = 'system_propready';
export const PROPREADY_SYSTEM_NAME = 'PropReady';

export const WELCOME_ANNOUNCEMENT_BODY = `PropReady is a learning platform for buyers and sellers — built to help you make confident property decisions and avoid costly mistakes.

We're here to teach you the home journey end to end: affordability, bonds, viewings, offers, transfers, and selling with clarity.

Start with the Learning Hub
• Buyers: explore /learn for guides on home loans, prequalification, first-time buyer tips, transfer costs, FLISP, and common mistakes to avoid
• Investors: visit /learn/investors for investor-focused learning
• Agents: use the Learning Hub at /agents/learn for scripts, process tips, and client-ready guidance

What else you can do on PropReady
• Get a free soft pre-qualification and understand your buying power
• Use the bond calculator and tools before you commit
• Browse listings and book viewings with verified agents
• Message agents, originators, and PropReady staff in one inbox
• Upload FICA documents and optionally complete a full bond prequalification
• Sellers can add properties, request valuations, and connect with agents

Open your dashboard, complete your profile, and dive into the Learning Hub — the smartest place to start before you buy or sell.`;

function welcomeInboxBody(accountType: AccountType): string {
    const learningCore = `PropReady is a learning platform for buyers and sellers. We teach you how to make the right decisions, avoid expensive mistakes, and move through the property journey with confidence — not guesswork.

Push into the Learning Hub first
• Buyers & sellers: open the Learning Center (/learn) for home loans, prequalification, the buying process, transfer costs, FLISP, first-time tips, and “mistakes to avoid” guides
• Investors: explore /learn/investors
• Read practical articles before you make offers, apply for a bond, or list a property — learning first saves time and money`;

    if (accountType === 'agent') {
        return `Welcome to PropReady — Your Home. Ready.

PropReady helps South Africans buy and sell with clarity — and it's also a learning platform that prepares buyers and sellers to make smarter decisions and avoid common pitfalls.

Your Learning Hub
• Open /agents/learn for agent-focused lessons, lead conversion tips, and client-ready explanations
• Point buyers and sellers to /learn so they arrive informed, not overwhelmed

What you can do as an agent
• Manage buyer and seller leads from one workspace
• Message clients, upload documents, and propose viewings
• Keep PPRA / FFC verification current and grow your PropReady presence
• Share listings and keep conversations organised in Messages

Other platform features to use with clients
• Soft pre-qualification and buying-power clarity
• Bond calculator and educational tools
• Secure document sharing and appointment scheduling in Messages

Reply here anytime — we're with you.`;
    }

    if (accountType === 'originator') {
        return `Welcome to PropReady — Your Home. Ready.

PropReady is a learning platform for buyers and sellers, and a collaboration hub for originators. Informed buyers make cleaner applications and fewer avoidable mistakes.

Help clients learn first
• Point them to the Learning Center at /learn (home loans, prequalification, bond pitfalls, transfer costs, FLISP)
• Use Messages to answer questions as they work through the guides

What you can do as an originator
• Connect with pre-qualified buyers who need bond guidance
• Message clients and PropReady staff from one inbox
• Track appointments and document requests as applications progress
• Stay visible to agents and buyers looking for trusted support

Other features on the platform
• Soft pre-qualification insights
• Secure messaging and document flow
• Appointment scheduling with buyers and agents

Reply in this chat anytime if you need help.`;
    }

    return `Welcome to PropReady — Your Home. Ready.

${learningCore}

What you can do as a buyer or seller
• Get a free soft pre-qualification and understand your buying power
• Use the bond calculator before you commit
• Browse listings and book property viewings with verified agents
• Upload FICA documents and optionally complete a full bond prequalification
• Sellers can add properties, request valuations, and connect with agents
• Message agents, originators, and PropReady staff in one inbox

Make Learning Hub part of every step
• First-time buyer mistakes, bond application pitfalls, trusts, deceased estates, and more are covered in /learn
• Come back to the guides whenever you're unsure — PropReady is here to teach, not just transact

Reply in this chat anytime if you need help — we're here with you.`;
}


/**
 * Remove staff-broadcast Welcome threads that flooded Admin → Messages.
 * Keeps per-user PropReady system welcomes (created_by = system_propready).
 */
export async function cleanupWelcomeBroadcastThreads() {
    try {
        const db = messagesDb();
        const { data: rows } = await db
            .from('message_conversations')
            .select('id, created_by_profile_id')
            .eq('subject', WELCOME_ANNOUNCEMENT_TITLE)
            .limit(2000);

        const toDelete = (rows || [])
            .filter((r) => String(r.created_by_profile_id || '') !== PROPREADY_SYSTEM_PROFILE_ID)
            .map((r) => String(r.id))
            .filter(Boolean);

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
            await supabase
                .from('admin_announcements')
                .update({
                    active: true,
                    body: WELCOME_ANNOUNCEMENT_BODY,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
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
                // Keep copy current for users who already received a welcome thread.
                await db
                    .from('message_items')
                    .update({
                        body: welcomeInboxBody(input.accountType),
                    })
                    .eq('conversation_id', existingWelcome.id)
                    .eq('sender_profile_id', PROPREADY_SYSTEM_PROFILE_ID)
                    .contains('meta', { isWelcome: true });

                const preview =
                    'Welcome to PropReady! Learn how to buy/sell smarter in the Learning Hub.';
                await db
                    .from('message_conversations')
                    .update({
                        last_message_preview: preview.slice(0, 140),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingWelcome.id);

                return { sent: false as const, reason: 'already_exists' as const };
            }
        }

        const now = new Date().toISOString();
        const body = welcomeInboxBody(input.accountType);
        const preview =
            'Welcome to PropReady! Learn how to buy/sell smarter in the Learning Hub.';

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
