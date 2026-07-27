import { SignJWT, jwtVerify } from 'jose';
import { getAuthSecret } from '@/lib/auth-enterprise/config';
import type { AccountType } from '@/lib/auth-enterprise/config';

const LOGIN_OTP_TTL = '10m';

export type LoginOtpChallengePayload = {
    typ: 'login_otp';
    email: string;
    accountType: AccountType;
    profileId: string;
    accountId: string;
    rememberDevice: boolean;
};

function secretKey() {
    return new TextEncoder().encode(getAuthSecret());
}

export async function signLoginOtpChallenge(
    payload: Omit<LoginOtpChallengePayload, 'typ'>
): Promise<string> {
    return new SignJWT({ ...payload, typ: 'login_otp' as const })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(LOGIN_OTP_TTL)
        .setIssuer('propready')
        .setAudience('propready-login-otp')
        .sign(secretKey());
}

export async function verifyLoginOtpChallenge(
    token: string
): Promise<LoginOtpChallengePayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey(), {
            issuer: 'propready',
            audience: 'propready-login-otp',
        });
        if (payload.typ !== 'login_otp') return null;
        return payload as unknown as LoginOtpChallengePayload;
    } catch {
        return null;
    }
}
