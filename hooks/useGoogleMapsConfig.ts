'use client';

import { useEffect, useState } from 'react';

/** Google’s documented demo Map ID — works for Advanced Markers in development. */
export const DEFAULT_GOOGLE_MAP_ID = 'DEMO_MAP_ID';

/**
 * Loads Maps JS config from build-time env, falling back to `/api/config/maps`.
 * The key is intended to be public (restrict by HTTP referrer in Google Cloud).
 */
export function useGoogleMapsConfig(): {
    apiKey: string | null;
    mapId: string;
    loading: boolean;
} {
    const buildTimeKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
    const buildTimeMapId =
        (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '').trim() || DEFAULT_GOOGLE_MAP_ID;
    const [apiKey, setApiKey] = useState<string | null>(buildTimeKey || null);
    const [mapId, setMapId] = useState(buildTimeMapId);
    const [loading, setLoading] = useState(!buildTimeKey);

    useEffect(() => {
        if (buildTimeKey) {
            setApiKey(buildTimeKey);
            setMapId(buildTimeMapId);
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/config/maps');
                const data = (await res.json()) as {
                    apiKey?: string | null;
                    mapId?: string | null;
                };
                if (!cancelled) {
                    setApiKey((data.apiKey || '').trim() || null);
                    setMapId((data.mapId || '').trim() || DEFAULT_GOOGLE_MAP_ID);
                }
            } catch {
                if (!cancelled) setApiKey(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [buildTimeKey, buildTimeMapId]);

    return { apiKey, mapId, loading };
}
