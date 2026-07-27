'use client';

import { useEffect } from 'react';

/** Boots Capacitor plugins when running inside the native shell. */
export default function NativeShellInit() {
    useEffect(() => {
        void (async () => {
            try {
                const { initNativeShell } = await import('@/mobile/native-shell');
                await initNativeShell();
            } catch {
                /* web-only or Capacitor not present — still mark ready for CSS */
                document.documentElement.classList.add('app-ready');
            }
        })();
    }, []);

    return null;
}
