import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { AUTH_CONFIG } from './config';

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: AUTH_CONFIG.argon2.memoryCost,
        timeCost: AUTH_CONFIG.argon2.timeCost,
        parallelism: AUTH_CONFIG.argon2.parallelism,
    });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
}
