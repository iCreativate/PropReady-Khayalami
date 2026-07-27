import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import { messagesDb } from '@/lib/messages';
import type { AccountType } from '@/lib/auth-enterprise/config';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const db = messagesDb();
        const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

        const { data: conversations, error } = await db
            .from('message_conversations')
            .select(
                'id, subject, context_type, context_id, last_message_at, last_message_preview, created_at, created_by_account_type'
            )
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(100);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const ids = (conversations || []).map((c) => c.id);
        const { data: participants } = ids.length
            ? await db
                  .from('message_participants')
                  .select('conversation_id, account_type, profile_id, display_name')
                  .in('conversation_id', ids)
            : { data: [] };

        const byConv = new Map<string, typeof participants>();
        for (const p of participants || []) {
            const list = byConv.get(p.conversation_id) || [];
            list.push(p);
            byConv.set(p.conversation_id, list);
        }

        let list = (conversations || []).map((c) => ({
            id: c.id,
            subject: c.subject,
            contextType: c.context_type,
            contextId: c.context_id,
            lastMessageAt: c.last_message_at,
            lastMessagePreview: c.last_message_preview,
            createdAt: c.created_at,
            createdByAccountType: c.created_by_account_type,
            participants: (byConv.get(c.id) || []).map((p) => ({
                accountType: p.account_type,
                profileId: p.profile_id,
                displayName: p.display_name,
            })),
        }));

        if (q) {
            list = list.filter((c) => {
                const hay = [
                    c.subject,
                    c.lastMessagePreview,
                    ...c.participants.map((p) => p.displayName),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return hay.includes(q);
            });
        }

        return NextResponse.json({ success: true, conversations: list });
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

        const { data: conversation, error } = await db
            .from('message_conversations')
            .insert({
                subject,
                context_type: 'general',
                created_by_account_type: 'admin',
                created_by_profile_id: adminId,
                last_message_at: bodyText ? new Date().toISOString() : null,
                last_message_preview: bodyText ? bodyText.slice(0, 140) : null,
            })
            .select('id')
            .single();

        if (error || !conversation) {
            return NextResponse.json(
                { error: error?.message || 'Could not create conversation' },
                { status: 500 }
            );
        }

        await db.from('message_participants').insert([
            {
                conversation_id: conversation.id,
                account_type: 'admin',
                profile_id: adminId,
                display_name: adminName,
            },
            {
                conversation_id: conversation.id,
                account_type: accountType,
                profile_id: profileId,
                display_name: displayName,
            },
        ]);

        if (bodyText) {
            await db.from('message_items').insert({
                conversation_id: conversation.id,
                kind: 'text',
                body: bodyText,
                sender_account_type: 'admin',
                sender_profile_id: adminId,
                sender_name: adminName,
            });
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
