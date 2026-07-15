'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { isAgentPortalRoute } from '@/lib/agent-portal-paths';
import { isUserPortalRoute, USER_PORTAL_ALWAYS_FOOTER_ROUTES } from '@/lib/user-portal-paths';
import { STORAGE_KEYS } from '@/lib/storage-keys';

function PortalFooterShell() {
    return (
        <div className="lg:ml-64 mt-12 lg:mt-16 border-t border-charcoal/[0.06]">
            <Footer variant="portal" />
        </div>
    );
}

export default function SiteFooter() {
    const pathname = usePathname();
    const [hasUserSession, setHasUserSession] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setHasUserSession(Boolean(localStorage.getItem(STORAGE_KEYS.currentUser)));
    }, [pathname]);

    const inAgentPortal = isAgentPortalRoute(pathname);
    const inUserPortal =
        USER_PORTAL_ALWAYS_FOOTER_ROUTES.has(pathname ?? '') ||
        (hasUserSession && isUserPortalRoute(pathname));

    if (inAgentPortal || inUserPortal) {
        return <PortalFooterShell />;
    }

    return <Footer />;
}
