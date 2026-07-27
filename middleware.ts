import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import {
    edgeDashboardPath,
    edgeLoginPath,
    edgePasswordGatePath,
    edgeProfileCompletePath,
    getEdgeAuthFromRequest,
} from '@/lib/auth-enterprise/edge-session';
import { verifyAdminSessionToken } from '@/lib/admin-auth';

const PROTECTED_PREFIXES = [
    '/dashboard',
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
];

const AUTH_PAGES = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/magic-link',
    '/login',
    '/agents/login',
    '/agents/register',
    '/originators/login',
    '/originators/register',
];

export async function middleware(request: NextRequest) {
    const supabaseResponse = await updateSession(request);
    const { pathname } = request.nextUrl;

    // Staff console uses pr_admin — keep separate from user/agent sessions
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
        return supabaseResponse;
    }
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        const token = request.cookies.get('pr_admin')?.value;
        const session = token ? await verifyAdminSessionToken(token) : null;
        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        return supabaseResponse;
    }

    const isProtected = PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
    const isCompleteProfile = pathname.startsWith('/auth/complete-profile');
    const isConfirmPassword = pathname.startsWith('/auth/confirm-password');
    const isAuthHandoff = pathname === '/auth/complete';

    if (!isProtected && !isAuthPage && !isCompleteProfile && !isConfirmPassword && !isAuthHandoff) {
        return supabaseResponse;
    }

    try {
        const auth = await getEdgeAuthFromRequest(request);
        const hasSession = Boolean(auth?.payload.sub || auth?.hasRefresh);
        // Explicit false only (older JWTs without the claim stay unlocked)
        const needsPasswordStep =
            Boolean(auth?.payload.sub) && auth?.payload.passwordOk === false;
        const mustCompleteProfile =
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

        if (isAuthPage && auth?.payload.sub) {
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
    } catch {
        if (isProtected) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
