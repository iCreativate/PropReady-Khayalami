'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Soft enter animation when the route changes — reduces hard content pops
 * in the Capacitor WebView and on the web app.
 */
export default function AppPageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div key={pathname} className="app-page-shell">
            {children}
        </div>
    );
}
