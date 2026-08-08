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

function DualRouteFooter() {
    const { user, isHydrated } = useHydratedBuyerPortalUser();
    if (!isHydrated) return null;
    if (user) return null;
    return <Footer />;
}

export default function SiteFooter() {
    const pathname = usePathname();

    const inAgentPortal = isAgentPortalRoute(pathname);
    const inAgentAuth =
        Boolean(pathname?.startsWith('/agents/login')) ||
        Boolean(pathname?.startsWith('/agents/register')) ||
        Boolean(pathname?.startsWith('/agents/verification'));
    const inOriginatorPortal = Boolean(pathname?.startsWith('/originators/'));
    const inAdminPortal = Boolean(pathname?.startsWith('/admin'));
    const inConveyancerPortal = Boolean(pathname?.startsWith('/conveyancers/portal'));

    // Dual public/portal tools (e.g. bond calculator): footer for guests only
    if (isUserPortalPublicDualRoute(pathname)) {
        return <DualRouteFooter />;
    }

    const inUserPortal =
        USER_PORTAL_ALWAYS_FOOTER_ROUTES.has(pathname ?? '') ||
        isUserPortalRoute(pathname) ||
        Boolean(pathname?.startsWith('/dashboard/')) ||
        Boolean(pathname?.startsWith('/sellers/'));

    if (
        inAgentPortal ||
        inAgentAuth ||
        inUserPortal ||
        inOriginatorPortal ||
        inAdminPortal ||
        inConveyancerPortal
    ) {
        return null;
    }

    return <Footer />;
}
