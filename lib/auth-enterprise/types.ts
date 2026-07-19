import type { AccountType } from './config';

export interface AuthAccount {
    id: string;
    email: string;
    account_type: AccountType;
    profile_id: string;
    password_hash: string | null;
    email_verified_at: string | null;
    password_changed_at: string | null;
    profile_completed_at?: string | null;
    onboarding_intent?: 'buyer' | 'seller' | null;
    onboarding_completed_at?: string | null;
}

export interface AuthSessionRow {
    id: string;
    account_id: string;
    refresh_token_hash: string;
    device_fingerprint: string | null;
    user_agent: string | null;
    ip_address: string | null;
    is_trusted: boolean;
    password_ok?: boolean;
    last_active_at: string;
    expires_at: string;
    revoked_at: string | null;
}

export interface AccessTokenPayload {
    sub: string;
    email: string;
    accountType: AccountType;
    profileId: string;
    sessionId: string;
    profileComplete: boolean;
    /** False after magic-link until password is set/confirmed this session */
    passwordOk: boolean;
    hasPassword: boolean;
    typ: 'access';
}

export interface SessionUser {
    accountId: string;
    profileId: string;
    email: string;
    accountType: AccountType;
    sessionId: string;
    profileComplete?: boolean;
    hasPassword?: boolean;
    passwordOk?: boolean;
    /** Set only for first-time magic-link/OAuth users who chose buy/sell */
    onboardingIntent?: 'buyer' | 'seller' | null;
    onboardingRequired?: boolean;
    fullName?: string;
    company?: string;
    phone?: string;
    plan?: string;
    sellerPlan?: string;
    ppraNumber?: string;
    verificationStatus?: string;
    status?: string;
}

export type OnboardingIntent = 'buyer' | 'seller';

export interface LoginResult {
    user: SessionUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
