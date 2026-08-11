import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import type { CompanionState } from '@/lib/property-iq/types';
import { slimCompanionForCloud } from '@/lib/property-iq/storage';

function coerceIncomingState(raw: unknown): CompanionState | null {
    if (!raw || typeof raw !== 'object') return null;
    const parsed = raw as Partial<CompanionState>;
    if (!Array.isArray(parsed.properties)) return null;
    return slimCompanionForCloud({
        version: 1,
        properties: parsed.properties as CompanionState['properties'],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        activePropertyId: parsed.activePropertyId ?? null,
        updatedAt:
            typeof parsed.updatedAt === 'string' && parsed.updatedAt
                ? parsed.updatedAt
                : new Date().toISOString(),
    });
}

function workspaceWeight(state: CompanionState | null | undefined): number {
    if (!state) return 0;
    return (
        (state.properties?.length || 0) * 10 +
        (state.goals?.length || 0) * 2 +
        (state.alerts?.length || 0)
    );
}

export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    if (session.user.accountType !== 'user') {
        return NextResponse.json(
            { success: false, error: 'Property Companion is for buyer/seller accounts' },
            { status: 403 }
        );
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    try {
        const { data, error } = await supabase
            .from('property_companion_workspaces')
            .select('state, updated_at')
            .eq('account_id', session.user.accountId)
            .maybeSingle();

        if (error) {
            // Table may not exist until migration is applied — fail soft.
            console.warn('property-companion GET:', error.message);
            return jsonWithSession(
                { success: true, state: null, updatedAt: null },
                session
            );
        }

        const state = (data?.state as CompanionState | null) || null;
        return jsonWithSession(
            {
                success: true,
                state,
                updatedAt: data?.updated_at ? String(data.updated_at) : null,
            },
            session
        );
    } catch (err) {
        console.error('property-companion GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    if (session.user.accountType !== 'user') {
        return NextResponse.json(
            { success: false, error: 'Property Companion is for buyer/seller accounts' },
            { status: 403 }
        );
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const incoming = coerceIncomingState(body?.state);
        if (!incoming) {
            return NextResponse.json({ success: false, error: 'Invalid workspace' }, { status: 400 });
        }

        const { data: existing } = await supabase
            .from('property_companion_workspaces')
            .select('state, updated_at')
            .eq('account_id', session.user.accountId)
            .maybeSingle();

        const existingState = (existing?.state as CompanionState | null) || null;
        if (workspaceWeight(incoming) === 0 && workspaceWeight(existingState) > 0) {
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
        const state: CompanionState = {
            ...incoming,
            updatedAt: incoming.updatedAt || now,
        };

        const { data, error } = await supabase
            .from('property_companion_workspaces')
            .upsert(
                {
                    account_id: session.user.accountId,
                    profile_id: session.user.profileId,
                    email: session.user.email.toLowerCase(),
                    state,
                    updated_at: now,
                },
                { onConflict: 'account_id' }
            )
            .select('state, updated_at')
            .single();

        if (error) {
            console.error('property-companion PUT:', error.message);
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
        console.error('property-companion PUT:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
