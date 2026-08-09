import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_CONFIG,
    createOAuthState,
    getAppUrl,
    getOAuthAuthorizationUrl,
    hasAuthSecret,
    parseAccountType,
    type OAuthProvider,
    type AccountType,
} from '@/lib/auth-enterprise';

function isSafePostLoginPath(path: string): boolean {
    const trimmed = path.trim();
    if (!trimmed.startsWith('/')) return false;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.includes('://')) return false;
    if (trimmed.includes('\\')) return false;
    return true;
}

const providers: OAuthProvider[] = ['google', 'apple'];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider: raw } = await params;
        const provider = raw as OAuthProvider;
        if (!providers.includes(provider)) {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
        }

        if (!hasAuthSecret()) {
            return NextResponse.json(
                {
                    error:
                        'Auth secret not configured. Set AUTH_JWT_SECRET (32+ characters) on Netlify, then redeploy.',
                },
                { status: 503 }
            );
        }

        const accountType: AccountType = parseAccountType(
            request.nextUrl.searchParams.get('type')
        );
        const nextParam = request.nextUrl.searchParams.get('next');
        const oauthNext =
            nextParam && isSafePostLoginPath(nextParam) ? nextParam : null;
        const state = createOAuthState(accountType);
        const appUrl = getAppUrl(request.nextUrl.origin);
        const url = getOAuthAuthorizationUrl(provider, accountType, state, appUrl);

        if (!url) {
            return NextResponse.json(
                { error: `${provider} sign-in is not configured` },
                { status: 503 }
            );
        }

        const response = NextResponse.redirect(url);
        response.cookies.set(AUTH_CONFIG.cookieNames.oauthState, state, {
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
        if (oauthNext) {
            response.cookies.set('pr_oauth_next', oauthNext, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: AUTH_CONFIG.oauthStateTtlSeconds,
            });
        }
        return response;
    } catch (err) {
        console.error('oauth/start:', err);
        const message = err instanceof Error ? err.message : 'OAuth failed';
        return NextResponse.json(
            {
                error: /AUTH_JWT_SECRET|NEXTAUTH_SECRET/i.test(message)
                    ? 'Auth secret not configured. Set AUTH_JWT_SECRET (32+ characters) on Netlify, then redeploy.'
                    : 'Sign-in temporarily unavailable. Please try again.',
            },
            { status: 503 }
        );
    }
}
