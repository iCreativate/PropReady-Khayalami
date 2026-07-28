'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { isAgentPortalRoute } from '@/lib/agent-portal-paths';
import { isUserPortalRoute, USER_PORTAL_ALWAYS_FOOTER_ROUTES } from '@/lib/user-portal-paths';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export default function SiteFooter() {
    const pathname = usePathname();
    const [hasUserSession, setHasUserSession] = useState(false);
    const [hasOriginatorSession, setHasOriginatorSession] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setHasUserSession(Boolean(localStorage.getItem(STORAGE_KEYS.currentUser)));
        setHasOriginatorSession(Boolean(localStorage.getItem('propReady_currentOriginator')));
    }, [pathname]);

    const inAgentPortal = isAgentPortalRoute(pathname);
    const inUserPortal =
        USER_PORTAL_ALWAYS_FOOTER_ROUTES.has(pathname ?? '') ||
        (hasUserSession && isUserPortalRoute(pathname));
    const inOriginatorPortal = hasOriginatorSession && Boolean(pathname?.startsWith('/originators/'));

    if (inAgentPortal || inUserPortal || inOriginatorPortal) {
        return null;
    }

    return <Footer />;
}
