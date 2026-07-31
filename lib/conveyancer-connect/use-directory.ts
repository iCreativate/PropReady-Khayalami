'use client';

import { useEffect, useState } from 'react';
import type { ConveyancerProfile } from '@/lib/conveyancer-connect/types';
import { fetchDirectoryProfiles } from '@/lib/conveyancer-connect/directory-client';

export function useConveyancerDirectory() {
    const [profiles, setProfiles] = useState<ConveyancerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const list = await fetchDirectoryProfiles();
                if (!cancelled) setProfiles(list);
            } catch {
                if (!cancelled) setError('Could not load conveyancer directory');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return { profiles, loading, error };
}
