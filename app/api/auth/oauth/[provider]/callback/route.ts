import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_CONFIG,
    getAppUrl,
    handleOAuthCallback,
    hashOAuthState,
    loginPathForAccountType,
    parseAccountType,
    setAuthCookies,
    type OAuthProvider,
} from '@/lib/auth-enterprise';
import { getRequestMeta } from '@/lib/auth-enterprise/request-meta';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: raw } = await params;
    const provider = raw as OAuthProvider;
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const storedState = request.cookies.get(AUTH_CONFIG.cookieNames.oauthState)?.value;
    const accountType = parseAccountType(request.cookies.get('pr_oauth_type')?.value || 'user');

    const loginPath = loginPathForAccountType(accountType);
    const loginError = (err: string) =>
        `${getAppUrl()}${loginPath}${loginPath.includes('?') ? '&' : '?'}error=${err}`;

    if (!code || !state || !storedState) {
        return NextResponse.redirect(loginError('oauth_state'));
    }

    const rawState = state.includes(':') ? state.split(':')[0] : state;
    if (hashOAuthState(rawState) !== storedState) {
        return NextResponse.redirect(loginError('oauth_state'));
    }

    const meta = getRequestMeta(request);
    const session = await handleOAuthCallback(provider, code, accountType, meta);

    if (!session) {
        return NextResponse.redirect(loginError('oauth_failed'));
    }

    const typeQ =
        accountType === 'agent'
            ? '?type=agent'
            : accountType === 'originator'
              ? '?type=originator'
              : '';
    const redirectTo = `/auth/complete${typeQ}`;
    const response = NextResponse.redirect(`${getAppUrl()}${redirectTo}`);
    setAuthCookies(response, session.accessToken, session.refreshToken, true);
    response.cookies.delete(AUTH_CONFIG.cookieNames.oauthState);
    response.cookies.delete('pr_oauth_type');
    return response;
}
