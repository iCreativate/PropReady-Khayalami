'use client';

import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/storage-keys';

function readHidden(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(STORAGE_KEYS.aiAssistantHidden) === '1';
    } catch {
        return false;
    }
}

/** Persistently hide / restore the floating PropReady AI Assistant. */
export function useAiAssistantVisibility() {
    const [hidden, setHidden] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setHidden(readHidden());
        setReady(true);
    }, []);

    const hide = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.aiAssistantHidden, '1');
        } catch {
            /* ignore */
        }
        setHidden(true);
    }, []);

    const show = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEYS.aiAssistantHidden);
        } catch {
            /* ignore */
        }
        setHidden(false);
    }, []);

    return { hidden, ready, hide, show };
}
