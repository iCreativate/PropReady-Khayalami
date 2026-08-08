'use client';

import { useEffect, useState } from 'react';
import type { BondOriginator } from '@/lib/bond-originators';

export function useLiveBondOriginators() {
    const [originators, setOriginators] = useState<BondOriginator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const res = await fetch('/api/bond-originators', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(
                        typeof data.error === 'string' ? data.error : 'Failed to load bond originators'
                    );
                }
                if (!cancelled) {
                    setOriginators(Array.isArray(data.originators) ? data.originators : []);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setOriginators([]);
                    setError(err instanceof Error ? err.message : 'Failed to load bond originators');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return { originators, loading, error };
}
