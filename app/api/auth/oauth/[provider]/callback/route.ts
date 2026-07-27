import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_CONFIG,
    getAppUrl,
    handleOAuthCallback,
    loginPathForAccountType,
    parseAccountType,
    setAuthCookies,
    verifyOAuthState,
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
    const cookieState = request.cookies.get(AUTH_CONFIG.cookieNames.oauthState)?.value;
    const appUrl = getAppUrl(request.nextUrl.origin);

    const verified = state ? verifyOAuthState(state) : null;
    const accountType =
        verified?.accountType ||
        parseAccountType(request.cookies.get('pr_oauth_type')?.value || 'user');

    const loginPath = loginPathForAccountType(accountType);
    const loginError = (err: string) =>
        `${appUrl}${loginPath}${loginPath.includes('?') ? '&' : '?'}error=${err}`;

    if (!code || !state || !verified) {
        return NextResponse.redirect(loginError('oauth_state'));
    }

    // If a cookie is present, it must match (blocks state fixation when cookies work).
    if (cookieState && cookieState !== state) {
        return NextResponse.redirect(loginError('oauth_state'));
    }

    const meta = getRequestMeta(request);
    const session = await handleOAuthCallback(provider, code, accountType, meta, appUrl);

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
    const response = NextResponse.redirect(`${appUrl}${redirectTo}`);
    setAuthCookies(response, session.accessToken, session.refreshToken, true);
    response.cookies.delete(AUTH_CONFIG.cookieNames.oauthState);
    response.cookies.delete('pr_oauth_type');
    return response;
}
