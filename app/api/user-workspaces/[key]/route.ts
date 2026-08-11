import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    isUserWorkspaceKey,
    workspaceLooksEmpty,
} from '@/lib/user-workspace-sync';

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    if (session.user.accountType !== 'user') {
        return NextResponse.json(
            { success: false, error: 'Workspaces are for buyer/seller accounts' },
            { status: 403 }
        );
    }

    const { key } = await context.params;
    if (!isUserWorkspaceKey(key)) {
        return NextResponse.json({ success: false, error: 'Unknown workspace' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    try {
        const { data, error } = await supabase
            .from('user_workspaces')
            .select('state, updated_at')
            .eq('account_id', session.user.accountId)
            .eq('workspace_key', key)
            .maybeSingle();

        if (error) {
            console.warn('user-workspaces GET:', error.message);
            return jsonWithSession({ success: true, state: null, updatedAt: null }, session);
        }

        return jsonWithSession(
            {
                success: true,
                state: data?.state ?? null,
                updatedAt: data?.updated_at ? String(data.updated_at) : null,
            },
            session
        );
    } catch (err) {
        console.error('user-workspaces GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    if (session.user.accountType !== 'user') {
        return NextResponse.json(
            { success: false, error: 'Workspaces are for buyer/seller accounts' },
            { status: 403 }
        );
    }

    const { key } = await context.params;
    if (!isUserWorkspaceKey(key)) {
        return NextResponse.json({ success: false, error: 'Unknown workspace' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const incoming = body?.state;
        if (!incoming || typeof incoming !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid state' }, { status: 400 });
        }

        const { data: existing } = await supabase
            .from('user_workspaces')
            .select('state, updated_at')
            .eq('account_id', session.user.accountId)
            .eq('workspace_key', key)
            .maybeSingle();

        const existingState = existing?.state ?? null;
        if (workspaceLooksEmpty(key, incoming) && !workspaceLooksEmpty(key, existingState)) {
            return jsonWithSession(
                {
                    success: true,
                    state: existingState,
                    updatedAt: existing?.updated_at ? String(existing.updated_at) : null,
                    skipped: true,
                },
                session
            );
        }

        const now = new Date().toISOString();
        const state =
            typeof (incoming as { updatedAt?: unknown }).updatedAt === 'string'
                ? incoming
                : { ...incoming, updatedAt: now };

        const { data, error } = await supabase
            .from('user_workspaces')
            .upsert(
                {
                    account_id: session.user.accountId,
                    workspace_key: key,
                    profile_id: session.user.profileId,
                    email: session.user.email.toLowerCase(),
                    state,
                    updated_at: now,
                },
                { onConflict: 'account_id,workspace_key' }
            )
            .select('state, updated_at')
            .single();

        if (error) {
            console.error('user-workspaces PUT:', error.message);
            return NextResponse.json(
                { success: false, error: error.message || 'Could not save workspace' },
                { status: 500 }
            );
        }

        return jsonWithSession(
            {
                success: true,
                state: data.state,
                updatedAt: data.updated_at ? String(data.updated_at) : now,
            },
            session
        );
    } catch (err) {
        console.error('user-workspaces PUT:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
