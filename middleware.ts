import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import {
    edgeDashboardPath,
    edgeLoginPath,
    edgePasswordGatePath,
    edgeProfileCompletePath,
    getEdgeAuthFromRequest,
} from '@/lib/auth-enterprise/edge-session';
import { verifyAdminSessionToken, IMPERSONATOR_COOKIE, isAdminEmail } from '@/lib/admin-auth';
import { PUBLIC_PROPERTIES_ENABLED } from '@/lib/public-properties';

const PROTECTED_PREFIXES = [
    '/dashboard',
    '/property-iq',
    '/sellers/dashboard',
    '/sellers/messages',
    '/agents/dashboard',
    '/agents/messages',
    '/agents/my-leads',
    '/agents/properties',
    '/agents/viewings',
    '/agents/settings',
    '/agents/plan',
    '/agents/verification',
    '/agents/learn',
    '/originators/dashboard',
    '/originators/messages',
    '/originators/cases',
    '/originators/settings',
    '/conveyancers/portal',
];

/**
 * Public token pages. Stay reachable with a session cookie so email links
 * (password reset, forgot-password, magic-link verify) are not bounced
 * to the dashboard or login. Role variants use the same paths with ?type=.
 */
const ALWAYS_ALLOWED_AUTH_PAGES = [
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/magic-link',
];

const AUTH_PAGES = [
    '/auth/login',
    '/auth/register',
    ...ALWAYS_ALLOWED_AUTH_PAGES,
    '/login',
    '/agents/login',
    '/agents/register',
    '/originators/login',
    '/originators/register',
    '/conveyancers/login',
    '/conveyancers/register',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // API routes resolve auth in-route; skip Supabase session refresh on every call.
    if (pathname.startsWith('/api/')) {
        return NextResponse.next({ request });
    }

    // Never let middleware take down the whole site on Netlify Edge.
    let supabaseResponse: NextResponse;
    try {
        supabaseResponse = await updateSession(request);
    } catch (err) {
        console.error('middleware updateSession:', err);
        supabaseResponse = NextResponse.next({ request });
    }

    try {
        const { pathname } = request.nextUrl;

        // Public Properties browse — off until agents publish listings
        if (
            !PUBLIC_PROPERTIES_ENABLED &&
            (pathname === '/search' || pathname.startsWith('/search/'))
        ) {
            return NextResponse.redirect(new URL('/learning-center', request.url));
        }

        // Block demo/seed tooling in production unless explicitly enabled
        if (pathname.startsWith('/api/dev')) {
            const allow =
                process.env.ALLOW_DEMO_SEED === 'true' || process.env.NODE_ENV === 'development';
            if (!allow) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
        }

        // Staff console uses pr_admin — keep separate from user/agent sessions
        if (pathname !== pathname.toLowerCase() && pathname.toLowerCase().startsWith('/admin')) {
            const normalized = `${pathname.toLowerCase()}${request.nextUrl.search}`;
            return NextResponse.redirect(new URL(normalized, request.url));
        }

        if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
            return supabaseResponse;
        }
        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
            const token = request.cookies.get('pr_admin')?.value;
            let session = null;
            try {
                session = token ? await verifyAdminSessionToken(token) : null;
            } catch (err) {
                console.error('middleware admin verify:', err);
            }
            if (!session) {
                const loginUrl = new URL('/admin/login', request.url);
                const redirect = NextResponse.redirect(loginUrl);
                supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
                    redirect.cookies.set(name, value, options);
                });
                return redirect;
            }
            return supabaseResponse;
        }

        const isProtected = PROTECTED_PREFIXES.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        const isAlwaysAllowedAuthPage = ALWAYS_ALLOWED_AUTH_PAGES.some((p) =>
            pathname.startsWith(p)
        );
        const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
        const isCompleteProfile = pathname.startsWith('/auth/complete-profile');
        const isConfirmPassword = pathname.startsWith('/auth/confirm-password');
        const isAuthHandoff = pathname === '/auth/complete';

        if (!isProtected && !isAuthPage && !isCompleteProfile && !isConfirmPassword && !isAuthHandoff) {
            return supabaseResponse;
        }

        const auth = await getEdgeAuthFromRequest(request);
        const hasSession = Boolean(auth?.payload.sub || auth?.hasRefresh);
        const impersonatorCookie = request.cookies.get(IMPERSONATOR_COOKIE)?.value?.trim().toLowerCase();
        const isStaffAccess =
            Boolean(auth?.payload.impersonatedBy) ||
            (Boolean(impersonatorCookie) && isAdminEmail(impersonatorCookie));
        // Explicit false only (older JWTs without the claim stay unlocked)
        const needsPasswordStep =
            !isStaffAccess &&
            Boolean(auth?.payload.sub) &&
            auth?.payload.passwordOk === false;
        const mustCompleteProfile =
            !isStaffAccess &&
            Boolean(auth?.payload.sub) &&
            auth?.payload.passwordOk !== false &&
            auth?.payload.profileComplete === false;

        if (isProtected && !hasSession) {
            return NextResponse.redirect(new URL(edgeLoginPath(pathname), request.url));
        }

        if (isProtected && needsPasswordStep && auth) {
            return NextResponse.redirect(new URL(edgePasswordGatePath(auth.payload), request.url));
        }

        if (isProtected && mustCompleteProfile) {
            return NextResponse.redirect(
                new URL(edgeProfileCompletePath(auth?.payload.accountType), request.url)
            );
        }

        if ((isCompleteProfile || isConfirmPassword) && !hasSession) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // Already finished password + profile → leave gate pages
        if (
            (isCompleteProfile || isConfirmPassword) &&
            auth?.payload.sub &&
            auth.payload.passwordOk !== false &&
            auth.payload.profileComplete === true
        ) {
            return NextResponse.redirect(
                new URL(edgeDashboardPath(auth.payload.accountType), request.url)
            );
        }

        // Has password confirmed but still needs identity → complete-profile only
        if (
            isConfirmPassword &&
            auth?.payload.sub &&
            auth.payload.passwordOk !== false &&
            auth.payload.profileComplete === false
        ) {
            return NextResponse.redirect(
                new URL(edgeProfileCompletePath(auth.payload.accountType), request.url)
            );
        }

        // First-time (no password) should use complete-profile, not confirm-password
        if (
            isConfirmPassword &&
            auth?.payload.sub &&
            auth.payload.passwordOk === false &&
            auth.payload.hasPassword === false
        ) {
            return NextResponse.redirect(
                new URL(edgeProfileCompletePath(auth.payload.accountType), request.url)
            );
        }

        if (isAuthPage && !isAlwaysAllowedAuthPage && auth?.payload.sub) {
            if (auth.payload.passwordOk === false) {
                return NextResponse.redirect(new URL(edgePasswordGatePath(auth.payload), request.url));
            }
            if (auth.payload.profileComplete === false) {
                return NextResponse.redirect(
                    new URL(edgeProfileCompletePath(auth.payload.accountType), request.url)
                );
            }
            return NextResponse.redirect(
                new URL(edgeDashboardPath(auth.payload.accountType), request.url)
            );
        }
    } catch (err) {
        console.error('middleware auth gate:', err);
        const { pathname } = request.nextUrl;
        const isProtected = PROTECTED_PREFIXES.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        if (isProtected) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
