import {
    createSession,
    setAuthCookies,
    getRequestMeta,
} from '@/lib/auth-enterprise';
import type { AccountType } from '@/lib/auth-enterprise/config';
import type { AuthAccount } from '@/lib/auth-enterprise/types';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    generateVerificationCode,
    saveVerificationCode,
} from '@/lib/verification-store';
import { sendLoginOtpEmail } from '@/lib/send-login-otp-email';
import { signLoginOtpChallenge } from '@/lib/auth-enterprise/login-otp';

export function toLegacyUser(user: Awaited<ReturnType<typeof createSession>>['user']) {
    if (user.accountType === 'agent') {
        return {
            id: user.profileId,
            fullName: user.fullName,
            email: user.email,
            company: user.company,
            phone: user.phone,
            plan: user.plan || 'free',
            sellerPlan: user.sellerPlan || 'none',
            ppraNumber: user.ppraNumber,
            verificationStatus: user.verificationStatus,
            status: user.status,
            accountType: 'agent' as const,
        };
    }
    if (user.accountType === 'originator') {
        return {
            id: user.profileId,
            fullName: user.fullName,
            email: user.email,
            organizationId: user.organizationId,
            company: user.company,
            phone: user.phone,
            status: user.status,
            accountType: 'originator' as const,
        };
    }
    return { id: user.profileId, fullName: user.fullName, email: user.email, accountType: 'user' as const };
}

function allowDevOtpFallback(): boolean {
    return (
        process.env.NODE_ENV === 'development' ||
        process.env.ALLOW_LOGIN_OTP_DEV_FALLBACK === 'true'
    );
}

/**
 * After password (and professional checks) succeed: issue OTP email + challenge token.
 * Does not create a session yet.
 */
export async function issueLoginOtpChallenge(params: {
    email: string;
    accountType: AccountType;
    profileId: string;
    accountId: string;
    rememberDevice: boolean;
    fullName?: string | null;
}): Promise<
    | { ok: true; challengeToken: string; email: string; devOtp?: string }
    | { ok: false; error: string; status: number }
> {
    const code = generateVerificationCode();
    const saved = await saveVerificationCode(params.email, params.accountType, code);
    if (!saved.ok) {
        return {
            ok: false,
            error: saved.error || 'Could not create login code',
            status: 503,
        };
    }

    const sent = await sendLoginOtpEmail(
        params.email,
        code,
        params.fullName || undefined
    );

    if (!sent.ok && !allowDevOtpFallback()) {
        return {
            ok: false,
            error: sent.error || 'Could not send login code to your email',
            status: 503,
        };
    }

    const challengeToken = await signLoginOtpChallenge({
        email: params.email,
        accountType: params.accountType,
        profileId: params.profileId,
        accountId: params.accountId,
        rememberDevice: params.rememberDevice,
    });

    return {
        ok: true,
        challengeToken,
        email: params.email,
        ...(allowDevOtpFallback() && (!sent.ok || process.env.NODE_ENV === 'development')
            ? { devOtp: code }
            : {}),
    };
}

export async function finalizeLoginFromChallenge(
    account: AuthAccount,
    rememberDevice: boolean,
    request: Request
) {
    const meta = getRequestMeta(request as import('next/server').NextRequest);
    const session = await createSession(
        account,
        { ...meta, trustedDevice: rememberDevice, passwordOk: false }
    );

    return session;
}

export async function loadAuthAccountById(accountId: string): Promise<AuthAccount | null> {
    const supabase = createServiceClient();
    if (!supabase) return null;
    const { data } = await supabase.from('auth_accounts').select('*').eq('id', accountId).maybeSingle();
    return (data as AuthAccount | null) ?? null;
}

export { setAuthCookies };
