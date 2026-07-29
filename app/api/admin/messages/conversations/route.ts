import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import { messagesDb } from '@/lib/messages';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { cleanupWelcomeBroadcastThreads } from '@/lib/welcome-announcement';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        // Hygiene: remove old staff-broadcast Welcome spam only (keeps per-user system welcomes).
        await cleanupWelcomeBroadcastThreads();

        const db = messagesDb();
        const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

        const { data: conversations, error } = await db
            .from('message_conversations')
            .select(
                'id, subject, context_type, context_id, last_message_at, last_message_preview, created_at, created_by_account_type, created_by_profile_id'
            )
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(200);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Hide mass announcements / welcome fan-out from the staff inbox (banner + user Messages only).
        const visible = (conversations || []).filter((c) => {
            if (c.context_type === 'announcement') return false;
            if (String(c.subject || '') === 'Welcome to PropReady') return false;
            if (String(c.created_by_profile_id || '') === 'system_propready') return false;
            return true;
        });

        const ids = visible.map((c) => c.id);
        const adminId = adminProfileId(auth.email);

        const { data: participants } = ids.length
            ? await db
                  .from('message_participants')
                  .select('conversation_id, account_type, profile_id, display_name, last_read_at')
                  .in('conversation_id', ids)
            : { data: [] };

        type Part = {
            conversation_id: string;
            account_type: string;
            profile_id: string;
            display_name: string | null;
            last_read_at: string | null;
        };

        const byConv = new Map<string, Part[]>();
        for (const p of (participants || []) as Part[]) {
            const list = byConv.get(p.conversation_id) || [];
            list.push(p);
            byConv.set(p.conversation_id, list);
        }

        let unreadTotal = 0;
        const list: Array<{
            id: string;
            subject: string | null;
            contextType: string;
            contextId: string | null;
            lastMessageAt: string | null;
            lastMessagePreview: string | null;
            createdAt: string;
            createdByAccountType: string;
            unreadCount: number;
            myLastReadAt: string | null;
            participants: Array<{
                accountType: string;
                profileId: string;
                displayName: string | null;
            }>;
        }> = [];

        for (const c of visible) {
            const parts = byConv.get(c.id) || [];
            const me = parts.find(
                (p) => p.account_type === 'admin' && p.profile_id === adminId
            );
            let unreadCount = 0;
            if (c.last_message_at) {
                const lastRead = me?.last_read_at ? new Date(me.last_read_at).getTime() : 0;
                const lastMsg = new Date(c.last_message_at).getTime();
                if (lastMsg > lastRead) {
                    const { count } = await db
                        .from('message_items')
                        .select('id', { count: 'exact', head: true })
                        .eq('conversation_id', c.id)
                        .gt('created_at', me?.last_read_at || '1970-01-01')
                        .neq('sender_profile_id', adminId);
                    unreadCount = count || 1;
                }
            }
            unreadTotal += unreadCount;

            const mapped = {
                id: c.id,
                subject: c.subject,
                contextType: c.context_type,
                contextId: c.context_id,
                lastMessageAt: c.last_message_at,
                lastMessagePreview: c.last_message_preview,
                createdAt: c.created_at,
                createdByAccountType: c.created_by_account_type,
                unreadCount,
                myLastReadAt: me?.last_read_at ?? null,
                participants: parts.map((p) => ({
                    accountType: p.account_type,
                    profileId: p.profile_id,
                    displayName: p.display_name,
                })),
            };

            if (q) {
                const hay = [
                    mapped.subject,
                    mapped.lastMessagePreview,
                    ...mapped.participants.map((p) => p.displayName),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) continue;
            }

            list.push(mapped);
        }

        return NextResponse.json({ success: true, conversations: list, unreadTotal });
    } catch (err) {
        console.error('admin messages list:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** Start a conversation with a portal account (staff as admin participant). */
export async function POST(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const accountType = String(body.accountType || '') as AccountType;
        const profileId = String(body.profileId || '').trim();
        const displayName = String(body.displayName || '').trim() || 'User';
        const subject = String(body.subject || '').trim() || 'PropReady support';
        const bodyText = String(body.body || '').trim();

        if (!['user', 'agent', 'originator'].includes(accountType) || !profileId) {
            return NextResponse.json(
                { error: 'accountType and profileId required' },
                { status: 400 }
            );
        }

        const db = messagesDb();
        const adminId = adminProfileId(auth.email);
        const adminName = adminDisplayName(auth.email);
        const now = new Date().toISOString();

        const { data: conversation, error } = await db
            .from('message_conversations')
            .insert({
                subject,
                context_type: 'general',
                created_by_account_type: 'admin',
                created_by_profile_id: adminId,
                last_message_at: bodyText ? now : null,
                last_message_preview: bodyText ? bodyText.slice(0, 140) : null,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error || !conversation) {
            return NextResponse.json(
                { error: error?.message || 'Could not create conversation' },
                { status: 500 }
            );
        }

        const { error: participantsError } = await db.from('message_participants').insert([
            {
                conversation_id: conversation.id,
                account_type: 'admin',
                profile_id: adminId,
                display_name: adminName,
                last_read_at: now,
            },
            {
                conversation_id: conversation.id,
                account_type: accountType,
                profile_id: profileId,
                display_name: displayName,
            },
        ]);
        if (participantsError) {
            return NextResponse.json({ error: participantsError.message }, { status: 500 });
        }

        if (bodyText) {
            const { error: messageError } = await db.from('message_items').insert({
                conversation_id: conversation.id,
                kind: 'text',
                body: bodyText,
                meta: {},
                sender_account_type: 'admin',
                sender_profile_id: adminId,
                sender_name: adminName,
                created_at: now,
            });
            if (messageError) {
                return NextResponse.json({ error: messageError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, conversationId: conversation.id });
    } catch (err) {
        console.error('admin messages create:', err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error && /admin/i.test(err.message)
                        ? 'Admin messaging requires the 20260727_admin_messages migration. Run it in Supabase SQL Editor.'
                        : 'Server error',
            },
            { status: 500 }
        );
    }
}
