import { BUYER_PORTAL_LINKS, SELLER_PORTAL_LINKS } from '@/lib/user-portal-nav';

/** Routes that always use the portal sidebar (login required). */
export const USER_PORTAL_ALWAYS_FOOTER_ROUTES = new Set([
    '/dashboard',
    '/dashboard/messages',
    '/dashboard/viewings',
    '/dashboard/documents',
    '/dashboard/property-optimizer',
    '/sellers/dashboard',
    '/sellers/messages',
]);

/**
 * Portal-linked tools that also render as public marketing pages when logged out.
 * Site footer should show on these routes unless the buyer is authenticated.
 */
export const USER_PORTAL_PUBLIC_DUAL_ROUTES = new Set([
    '/calculator',
    '/calculator/smart-bond',
    '/property-iq',
    '/learning-center',
    '/learn',
    '/learn/investors',
    '/sellers',
]);

export const USER_PORTAL_ROUTES = new Set([
    ...BUYER_PORTAL_LINKS.map((link) => link.href),
    ...SELLER_PORTAL_LINKS.map((link) => link.href),
]);

export function isUserPortalRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return USER_PORTAL_ROUTES.has(pathname);
}

export function isUserPortalPublicDualRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return USER_PORTAL_PUBLIC_DUAL_ROUTES.has(pathname);
}
