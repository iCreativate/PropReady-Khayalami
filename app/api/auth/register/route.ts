import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import {
    findAccountByEmail,
    upsertAccountFromProfile,
} from '@/lib/auth-enterprise';
import { parseAccountType, profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const fullName = String(body.fullName || '').trim();
        const accountType = parseAccountType(body.type);
        const organizationId = String(body.organizationId || '').trim();
        const staffNumber = String(body.staffNumber || '')
            .trim()
            .toUpperCase();

        if (!email || !password || !fullName) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        if (accountType === 'originator') {
            const validOrg = BOND_ORIGINATORS.some((o) => o.id === organizationId);
            if (!validOrg) {
                return NextResponse.json(
                    { success: false, error: 'Select a valid bond originator organisation' },
                    { status: 400 }
                );
            }
            if (staffNumber.length < 4) {
                return NextResponse.json(
                    { success: false, error: 'Originator staff number is required' },
                    { status: 400 }
                );
            }
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

        const table = profileTableForAccountType(accountType);
        const { data: dup } = await supabase.from(table).select('id').eq('email', email).maybeSingle();
        if (dup) {
            return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
        }

        const id = crypto.randomUUID();
        const row =
            accountType === 'agent'
                ? { id, full_name: fullName, email, password: '', status: 'pending' }
                : accountType === 'originator'
                  ? {
                        id,
                        full_name: fullName,
                        email,
                        password: '',
                        organization_id: organizationId,
                        staff_number: staffNumber,
                        status: 'active',
                    }
                  : { id, full_name: fullName, email, password: '' };

        const { data: profile, error } = await supabase
            .from(table)
            .insert(row as Record<string, unknown>)
            .select('id')
            .single();
        if (error || !profile) {
            console.error('auth/register profile insert:', error);
            if (error?.code === '23505' && accountType === 'originator') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'That staff number is already registered for this organisation, or the email is taken',
                    },
                    { status: 409 }
                );
            }
            return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
        }

        await upsertAccountFromProfile(email, accountType, profile.id, password);

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
