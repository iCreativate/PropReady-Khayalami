'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { isAgentPortalRoute } from '@/lib/agent-portal-paths';
import {
    isUserPortalPublicDualRoute,
    isUserPortalRoute,
    USER_PORTAL_ALWAYS_FOOTER_ROUTES,
} from '@/lib/user-portal-paths';

export default function SiteFooter() {
    const pathname = usePathname();
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    const inAgentPortal = isAgentPortalRoute(pathname);
    const inAgentAuth =
        Boolean(pathname?.startsWith('/agents/login')) ||
        Boolean(pathname?.startsWith('/agents/register')) ||
        Boolean(pathname?.startsWith('/agents/verification'));
    const inOriginatorPortal = Boolean(pathname?.startsWith('/originators/'));
    const inAdminPortal = Boolean(pathname?.startsWith('/admin'));

    // Dual public/portal tools (e.g. bond calculator): footer for guests only
    if (isUserPortalPublicDualRoute(pathname)) {
        if (!isHydrated) return null;
        if (user) return null;
        return <Footer />;
    }

    const inUserPortal =
        USER_PORTAL_ALWAYS_FOOTER_ROUTES.has(pathname ?? '') ||
        isUserPortalRoute(pathname) ||
        Boolean(pathname?.startsWith('/dashboard/')) ||
        Boolean(pathname?.startsWith('/sellers/'));

    if (inAgentPortal || inAgentAuth || inUserPortal || inOriginatorPortal || inAdminPortal) {
        return null;
    }

    return <Footer />;
}
