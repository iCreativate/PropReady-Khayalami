import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONFIG, getAuthSecret } from './config';
import type { AccessTokenPayload } from './types';

function secretKey() {
    return new TextEncoder().encode(getAuthSecret());
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'typ'>): Promise<string> {
    return new SignJWT({ ...payload, typ: 'access' as const })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${AUTH_CONFIG.accessTokenTtlSeconds}s`)
        .setIssuer('propready')
        .setAudience('propready-app')
        .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey(), {
            issuer: 'propready',
            audience: 'propready-app',
        });
        if (payload.typ !== 'access') return null;
        return payload as unknown as AccessTokenPayload;
    } catch {
        return null;
    }
}
