'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { isAgentPortalRoute } from '@/lib/agent-portal-paths';
import { isUserPortalRoute, USER_PORTAL_ALWAYS_FOOTER_ROUTES } from '@/lib/user-portal-paths';

export default function SiteFooter() {
    const pathname = usePathname();

    const inAgentPortal = isAgentPortalRoute(pathname);
    const inUserPortal =
        USER_PORTAL_ALWAYS_FOOTER_ROUTES.has(pathname ?? '') ||
        isUserPortalRoute(pathname) ||
        Boolean(pathname?.startsWith('/dashboard/')) ||
        Boolean(pathname?.startsWith('/sellers/'));
    const inOriginatorPortal = Boolean(pathname?.startsWith('/originators/'));
    const inAdminPortal = Boolean(pathname?.startsWith('/admin'));

    if (inAgentPortal || inUserPortal || inOriginatorPortal || inAdminPortal) {
        return null;
    }

    return <Footer />;
}
