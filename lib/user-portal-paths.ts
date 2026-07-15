import { BUYER_PORTAL_LINKS, SELLER_PORTAL_LINKS } from '@/lib/user-portal-nav';

/** Routes that use UserPortalLayout / portal shells with a fixed sidebar on desktop. */
/** Routes that always use the portal sidebar (login required). */
export const USER_PORTAL_ALWAYS_FOOTER_ROUTES = new Set([
    '/dashboard',
    '/dashboard/viewings',
    '/dashboard/documents',
    '/dashboard/property-optimizer',
    '/sellers/dashboard',
]);

export const USER_PORTAL_ROUTES = new Set([
    ...BUYER_PORTAL_LINKS.map((link) => link.href),
    ...SELLER_PORTAL_LINKS.map((link) => link.href),
]);

export function isUserPortalRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return USER_PORTAL_ROUTES.has(pathname);
}
