import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import type { AccountType } from '@/lib/auth-enterprise/config';
import {
    displayNameForUser,
    listConversationIdsForUser,
    messagesDb,
    resolveProfileByEmail,
    serializeConversation,
    type ConversationRow,
    type MessageContextType,
    type MessageParticipantInput,
    type ParticipantRow,
} from '@/lib/messages';
import { assertCanStartConversation } from '@/lib/messages-eligibility';

export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const unreadOnly = request.nextUrl.searchParams.get('unread') === '1';
        const ids = await listConversationIdsForUser(session.user);
        if (ids.length === 0) {
            return jsonWithSession({ conversations: [], unreadTotal: 0 }, session);
        }

        const { data: conversations, error } = await messagesDb()
            .from('message_conversations')
            .select('*')
            .in('id', ids)
            .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        const { data: participants } = await messagesDb()
            .from('message_participants')
            .select('*')
            .in('conversation_id', ids);

        const byConv = new Map<string, ParticipantRow[]>();
        for (const p of (participants || []) as ParticipantRow[]) {
            const list = byConv.get(p.conversation_id) || [];
            list.push(p);
            byConv.set(p.conversation_id, list);
        }

        let unreadTotal = 0;
        const serialized = [];

        for (const row of (conversations || []) as ConversationRow[]) {
            const parts = byConv.get(row.id) || [];
            const me = parts.find(
                (p) =>
                    p.account_type === session.user.accountType &&
                    p.profile_id === session.user.profileId
            );
            let unreadCount = 0;
            if (row.last_message_at) {
                const lastRead = me?.last_read_at ? new Date(me.last_read_at).getTime() : 0;
                const lastMsg = new Date(row.last_message_at).getTime();
                if (lastMsg > lastRead) {
                    const { count } = await messagesDb()
                        .from('message_items')
                        .select('id', { count: 'exact', head: true })
                        .eq('conversation_id', row.id)
                        .gt('created_at', me?.last_read_at || '1970-01-01')
                        .neq('sender_profile_id', session.user.profileId);
                    unreadCount = count || (lastMsg > lastRead ? 1 : 0);
                }
            }
            unreadTotal += unreadCount;
            if (unreadOnly && unreadCount === 0) continue;
            serialized.push(
                serializeConversation(row, {
                    participants: parts,
                    unreadCount,
                    myLastReadAt: me?.last_read_at ?? null,
                })
            );
        }

        return jsonWithSession({ conversations: serialized, unreadTotal }, session);
    } catch (err) {
        console.error('GET /api/messages/conversations:', err);
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const subject = String(body.subject || '').trim() || null;
        const contextType = (String(body.contextType || 'general') as MessageContextType) || 'general';
        const contextId = body.contextId ? String(body.contextId) : null;
        const initialMessage = String(body.initialMessage || '').trim();

        const participantsInput: MessageParticipantInput[] = Array.isArray(body.participants)
            ? body.participants
            : [];

        const resolved: MessageParticipantInput[] = [];

        for (const p of participantsInput) {
            const accountType = (p.accountType || 'user') as AccountType;
            if (p.profileId) {
                resolved.push({
                    accountType,
                    profileId: String(p.profileId),
                    displayName: p.displayName,
                });
                continue;
            }
            if (p.email) {
                const found = await resolveProfileByEmail(String(p.email), accountType);
                if (!found) {
                    return NextResponse.json(
                        { error: `No ${accountType} account found for ${p.email}` },
                        { status: 404 }
                    );
                }
                resolved.push({
                    accountType,
                    profileId: found.profileId,
                    displayName: found.displayName,
                    email: found.email,
                });
            }
        }

        // Always include the creator
        const creatorKey = `${session.user.accountType}:${session.user.profileId}`;
        const keys = new Set(resolved.map((p) => `${p.accountType}:${p.profileId}`));
        if (!keys.has(creatorKey)) {
            resolved.unshift({
                accountType: session.user.accountType,
                profileId: session.user.profileId,
                displayName: displayNameForUser(session.user),
            });
        }

        if (resolved.length < 2) {
            return NextResponse.json(
                { error: 'Add at least one other participant' },
                { status: 400 }
            );
        }

        // Enforce relationship rules for every counterpart (not the creator)
        for (const p of resolved) {
            if (
                p.accountType === session.user.accountType &&
                p.profileId === session.user.profileId
            ) {
                continue;
            }
            try {
                await assertCanStartConversation(session.user, {
                    accountType: p.accountType,
                    profileId: p.profileId,
                });
            } catch (gateErr) {
                const status = (gateErr as Error & { status?: number }).status || 403;
                return NextResponse.json(
                    { error: gateErr instanceof Error ? gateErr.message : 'Not allowed' },
                    { status }
                );
            }
        }

        const now = new Date().toISOString();
        const { data: conversation, error: convErr } = await messagesDb()
            .from('message_conversations')
            .insert({
                subject,
                context_type: contextType,
                context_id: contextId,
                created_by_account_type: session.user.accountType,
                created_by_profile_id: session.user.profileId,
                last_message_at: initialMessage ? now : null,
                last_message_preview: initialMessage ? initialMessage.slice(0, 180) : null,
                created_at: now,
                updated_at: now,
            })
            .select('*')
            .single();

        if (convErr || !conversation) throw convErr || new Error('Could not create conversation');

        const participantRows = resolved.map((p) => ({
            conversation_id: conversation.id,
            account_type: p.accountType,
            profile_id: p.profileId,
            display_name: p.displayName || null,
            last_read_at: p.profileId === session.user.profileId ? now : null,
        }));

        const { data: parts, error: partErr } = await messagesDb()
            .from('message_participants')
            .insert(participantRows)
            .select('*');

        if (partErr) throw partErr;

        if (initialMessage) {
            await messagesDb().from('message_items').insert({
                conversation_id: conversation.id,
                kind: 'text',
                body: initialMessage,
                meta: {},
                sender_account_type: session.user.accountType,
                sender_profile_id: session.user.profileId,
                sender_name: displayNameForUser(session.user),
                created_at: now,
            });
        }

        return jsonWithSession(
            {
                success: true,
                conversation: serializeConversation(conversation as ConversationRow, {
                    participants: (parts || []) as ParticipantRow[],
                    unreadCount: 0,
                    myLastReadAt: now,
                }),
            },
            session,
            { status: 201 }
        );
    } catch (err) {
        console.error('POST /api/messages/conversations:', err);
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
