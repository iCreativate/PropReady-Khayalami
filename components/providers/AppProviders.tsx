'use client';

import { ToastProvider } from './ToastProvider';
import IdleSessionTimeout from './IdleSessionTimeout';

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <IdleSessionTimeout />
            {children}
        </ToastProvider>
    );
}
