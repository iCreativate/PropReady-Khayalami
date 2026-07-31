'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    APIProvider,
    AdvancedMarker,
    Map,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps';
import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import {
    googleMapsDirectionsUrl,
    googleMapsSearchUrl,
    haversineKm,
    hasValidCoords,
    resolveOfficeCoords,
    type ConveyancerProfile,
    type GeoPoint,
} from '@/lib/conveyancer-connect';

const SA_CENTER: GeoPoint = { lat: -28.5, lng: 24.7 };
/** Google’s documented demo Map ID — works for Advanced Markers in development. */
const DEFAULT_MAP_ID = 'DEMO_MAP_ID';

function pinFor(profile: ConveyancerProfile): GeoPoint {
    return resolveOfficeCoords({
        coords: profile.coords,
        city: profile.city,
        province: profile.province,
    });
}

function MapShell({
    title,
    subtitle,
    badge,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    badge?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className={`${CC_CARD_FLAT} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-charcoal/[0.06] px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-charcoal">{title}</p>
                    <p className="text-xs text-charcoal/45">{subtitle}</p>
                </div>
                {badge ? (
                    <span className="rounded-full bg-charcoal/[0.04] px-2.5 py-1 text-[11px] font-medium text-charcoal/55">
                        {badge}
                    </span>
                ) : null}
            </div>
            {children}
            {footer}
        </div>
    );
}

function ActiveFirmFooter({
    profile,
    position,
    origin,
}: {
    profile: ConveyancerProfile;
    position: GeoPoint;
    origin?: GeoPoint | null;
}) {
    return (
        <div className="border-t border-charcoal/[0.06] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-charcoal">{profile.firmName}</p>
                    <p className="text-xs text-charcoal/50">
                        {profile.offices[0]?.address || `${profile.suburb}, ${profile.city}`}
                        {origin && hasValidCoords(origin)
                            ? ` · ${haversineKm(origin, position).toFixed(1)} km`
                            : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a
                        className="rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-charcoal/[0.03]"
                        href={googleMapsDirectionsUrl(position)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Directions
                    </a>
                    <Link
                        href={`/conveyancers/firm/${profile.slug}`}
                        className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold/90"
                    >
                        Open profile
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FitBounds({
    pins,
    origin,
}: {
    pins: { position: GeoPoint }[];
    origin?: GeoPoint | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!map || pins.length <= 1) return;
        const bounds = new google.maps.LatLngBounds();
        pins.forEach((p) => bounds.extend(p.position));
        if (origin && hasValidCoords(origin)) bounds.extend(origin);
        map.fitBounds(bounds, 64);
    }, [map, pins, origin]);

    return null;
}

function GoogleOfficeMap({
    profiles,
    origin,
    selectedId,
    onSelect,
    apiKey,
    mapId,
}: {
    profiles: ConveyancerProfile[];
    origin?: GeoPoint | null;
    selectedId?: string;
    onSelect?: (id: string) => void;
    apiKey: string;
    mapId: string;
}) {
    const [hoverId, setHoverId] = useState<string | null>(null);

    const pins = useMemo(
        () =>
            profiles.map((p) => ({
                profile: p,
                position: pinFor(p),
            })),
        [profiles]
    );

    const activeId = hoverId || selectedId || pins[0]?.profile.id;
    const active = pins.find((p) => p.profile.id === activeId);

    const center = useMemo(() => {
        if (origin && hasValidCoords(origin)) return origin;
        if (active) return active.position;
        if (pins.length === 1) return pins[0].position;
        if (pins.length > 1) {
            const lat = pins.reduce((s, p) => s + p.position.lat, 0) / pins.length;
            const lng = pins.reduce((s, p) => s + p.position.lng, 0) / pins.length;
            return { lat, lng };
        }
        return SA_CENTER;
    }, [origin, active, pins]);

    const zoom = pins.length <= 1 ? 12 : pins.length <= 4 ? 10 : 6;

    return (
        <MapShell
            title="Office map"
            subtitle={`${profiles.length} location${profiles.length === 1 ? '' : 's'} on Google Maps${
                origin && hasValidCoords(origin) ? ' · distances from your search centre' : ''
            }`}
            badge="Google Maps"
            footer={
                active ? (
                    <ActiveFirmFooter
                        profile={active.profile}
                        position={active.position}
                        origin={origin}
                    />
                ) : null
            }
        >
            <div className="relative aspect-[16/11] bg-slate-100">
                <APIProvider apiKey={apiKey}>
                    <Map
                        defaultCenter={center}
                        defaultZoom={zoom}
                        mapId={mapId}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        mapTypeControl={false}
                        streetViewControl={false}
                        fullscreenControl
                        clickableIcons={false}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <FitBounds pins={pins} origin={origin} />
                        {origin && hasValidCoords(origin) ? (
                            <AdvancedMarker position={origin} title="Search centre">
                                <Pin
                                    background="#0ea5e9"
                                    borderColor="#ffffff"
                                    glyphColor="#ffffff"
                                    scale={0.9}
                                />
                            </AdvancedMarker>
                        ) : null}
                        {pins.map(({ profile, position }) => (
                            <AdvancedMarker
                                key={profile.id}
                                position={position}
                                title={profile.firmName}
                                onClick={() => {
                                    onSelect?.(profile.id);
                                    setHoverId(profile.id);
                                }}
                                onMouseEnter={() => setHoverId(profile.id)}
                            >
                                <Pin
                                    background="#B8860B"
                                    borderColor="#ffffff"
                                    glyphColor="#ffffff"
                                />
                            </AdvancedMarker>
                        ))}
                    </Map>
                </APIProvider>
            </div>
        </MapShell>
    );
}

function useGoogleMapsConfig(): {
    apiKey: string | null;
    mapId: string;
    loading: boolean;
} {
    const buildTimeKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
    const buildTimeMapId =
        (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '').trim() || DEFAULT_MAP_ID;
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
                    setMapId((data.mapId || '').trim() || DEFAULT_MAP_ID);
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

export default function MapView({
    profiles,
    origin,
    selectedId,
    onSelect,
}: {
    profiles: ConveyancerProfile[];
    origin?: GeoPoint | null;
    selectedId?: string;
    onSelect?: (id: string) => void;
}) {
    const { apiKey, mapId, loading } = useGoogleMapsConfig();

    const pins = useMemo(
        () =>
            profiles.map((p) => ({
                profile: p,
                position: pinFor(p),
            })),
        [profiles]
    );
    const active = pins.find((p) => p.profile.id === selectedId) || pins[0];
    const directionsQuery = active
        ? active.profile.offices[0]?.address ||
          `${active.profile.suburb}, ${active.profile.city}, South Africa`
        : '';

    if (loading) {
        return (
            <MapShell title="Office map" subtitle="Loading Google Maps…">
                <div className="flex aspect-[16/11] items-center justify-center bg-slate-50 text-sm text-charcoal/50">
                    Loading Google Maps…
                </div>
            </MapShell>
        );
    }

    if (!apiKey) {
        return (
            <MapShell
                title="Office map"
                subtitle="Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Maps."
                footer={
                    active ? (
                        <ActiveFirmFooter
                            profile={active.profile}
                            position={active.position}
                            origin={origin}
                        />
                    ) : null
                }
            >
                <div className="flex aspect-[16/11] flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
                    <p className="text-sm text-charcoal/60">
                        Google Maps is not configured yet. You can still open firm locations in Google Maps.
                    </p>
                    {active ? (
                        <a
                            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
                            href={googleMapsSearchUrl(directionsQuery)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open in Google Maps
                        </a>
                    ) : null}
                </div>
            </MapShell>
        );
    }

    return (
        <GoogleOfficeMap
            profiles={profiles}
            origin={origin}
            selectedId={selectedId}
            onSelect={onSelect}
            apiKey={apiKey}
            mapId={mapId}
        />
    );
}
