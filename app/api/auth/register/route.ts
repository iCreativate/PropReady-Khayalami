import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import {
    findAccountByEmail,
    upsertAccountFromProfile,
} from '@/lib/auth-enterprise';
import { createServiceClient } from '@/lib/supabase-admin';
import type { AccountType } from '@/lib/auth-enterprise/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const fullName = String(body.fullName || '').trim();
        const accountType: AccountType = body.type === 'agent' ? 'agent' : 'user';

        if (!email || !password || !fullName) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        const pw = validatePassword(password);
        if (!pw.valid) {
            return NextResponse.json({ success: false, error: pw.errors.join(', ') }, { status: 400 });
        }

        const existing = await findAccountByEmail(email, accountType);
        if (existing) {
            return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const table = accountType === 'agent' ? 'agents' : 'users';
        const { data: dup } = await supabase.from(table).select('id').eq('email', email).maybeSingle();
        if (dup) {
            return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
        }

        const id = crypto.randomUUID();
        const row =
            accountType === 'agent'
                ? { id, full_name: fullName, email, password: '', status: 'pending' }
                : { id, full_name: fullName, email, password: '' };

        const { data: profile, error } = await supabase
            .from(table)
            .insert(row as Record<string, unknown>)
            .select('id')
            .single();
        if (error || !profile) {
            return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
        }

        const account = await upsertAccountFromProfile(email, accountType, profile.id, password);

        void account;

        return NextResponse.json({
            success: true,
            needsVerification: true,
            email,
            accountType,
            message: 'Check your email to verify your account before signing in.',
        });
    } catch (err) {
        console.error('auth/register:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
