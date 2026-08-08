'use client';

import { useEffect, useState } from 'react';
import type { BondOriginator } from '@/lib/bond-originators';
import { fetchLiveBondOriginators } from '@/lib/bond-originators-client';

export function useLiveBondOriginators() {
    const [originators, setOriginators] = useState<BondOriginator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        void fetchLiveBondOriginators()
            .then((rows) => {
                if (!cancelled) {
                    setOriginators(rows);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setOriginators([]);
                    setError(err instanceof Error ? err.message : 'Failed to load bond originators');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { originators, loading, error };
}
