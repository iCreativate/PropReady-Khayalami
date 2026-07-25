import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_CONFIG,
    createOAuthState,
    getOAuthAuthorizationUrl,
    hashOAuthState,
    parseAccountType,
    type OAuthProvider,
    type AccountType,
} from '@/lib/auth-enterprise';

const providers: OAuthProvider[] = ['google', 'apple'];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: raw } = await params;
    const provider = raw as OAuthProvider;
    if (!providers.includes(provider)) {
        return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
    }

    const accountType: AccountType = parseAccountType(
        request.nextUrl.searchParams.get('type')
    );
    const state = createOAuthState();
    const url = getOAuthAuthorizationUrl(provider, accountType, state);

    if (!url) {
        return NextResponse.json(
            { error: `${provider} sign-in is not configured` },
            { status: 503 }
        );
    }

    const response = NextResponse.redirect(url);
    response.cookies.set(AUTH_CONFIG.cookieNames.oauthState, hashOAuthState(state), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: AUTH_CONFIG.oauthStateTtlSeconds,
    });
    response.cookies.set('pr_oauth_type', accountType, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: AUTH_CONFIG.oauthStateTtlSeconds,
    });
    return response;
}
