'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import { haversineKm, type ConveyancerProfile, type GeoPoint } from '@/lib/conveyancer-connect';

/** Lightweight pin map — no external map API required. */
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
    const [hoverId, setHoverId] = useState<string | null>(null);

    const bounds = useMemo(() => {
        if (!profiles.length) {
            return { minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 };
        }
        const lats = profiles.map((p) => p.coords.lat);
        const lngs = profiles.map((p) => p.coords.lng);
        const pad = 0.35;
        return {
            minLat: Math.min(...lats) - pad,
            maxLat: Math.max(...lats) + pad,
            minLng: Math.min(...lngs) - pad,
            maxLng: Math.max(...lngs) + pad,
        };
    }, [profiles]);

    function project(lat: number, lng: number) {
        const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
        const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
        return { x: Math.min(98, Math.max(2, x)), y: Math.min(98, Math.max(2, y)) };
    }

    const active = profiles.find((p) => p.id === (hoverId || selectedId));

    return (
        <div className={`${CC_CARD_FLAT} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-charcoal/[0.06] px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-charcoal">Office map</p>
                    <p className="text-xs text-charcoal/45">
                        {profiles.length} location{profiles.length === 1 ? '' : 's'}
                        {origin ? ' · distances from your search centre' : ''}
                    </p>
                </div>
                <span className="rounded-full bg-charcoal/[0.04] px-2.5 py-1 text-[11px] font-medium text-charcoal/55">
                    Street / satellite via firm profile directions
                </span>
            </div>
            <div className="relative aspect-[16/11] bg-[radial-gradient(ellipse_at_30%_20%,#dbeafe_0%,transparent_50%),radial-gradient(ellipse_at_70%_80%,#fef3c7_0%,transparent_45%),linear-gradient(160deg,#ecfdf5,#f8fafc_40%,#e2e8f0)]">
                <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                {origin ? (
                    <span
                        className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 ring-4 ring-sky-200"
                        style={{
                            left: `${project(origin.lat, origin.lng).x}%`,
                            top: `${project(origin.lat, origin.lng).y}%`,
                        }}
                        title="Search centre"
                    />
                ) : null}
                {profiles.map((p) => {
                    const { x, y } = project(p.coords.lat, p.coords.lng);
                    const on = p.id === (hoverId || selectedId);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            className={`absolute z-20 -translate-x-1/2 -translate-y-full rounded-full px-2 py-1 text-[10px] font-bold text-white shadow-lg transition ${
                                on ? 'scale-110 ring-2 ring-white' : 'opacity-90 hover:scale-105'
                            }`}
                            style={{ left: `${x}%`, top: `${y}%`, background: p.accent }}
                            onMouseEnter={() => setHoverId(p.id)}
                            onMouseLeave={() => setHoverId(null)}
                            onFocus={() => setHoverId(p.id)}
                            onBlur={() => setHoverId(null)}
                            onClick={() => onSelect?.(p.id)}
                            aria-label={p.firmName}
                        >
                            {p.logoInitials}
                        </button>
                    );
                })}
            </div>
            {active ? (
                <div className="border-t border-charcoal/[0.06] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-charcoal">{active.firmName}</p>
                            <p className="text-xs text-charcoal/50">
                                {active.offices[0]?.address}, {active.suburb}
                                {origin
                                    ? ` · ${haversineKm(origin, active.coords).toFixed(1)} km`
                                    : ''}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                className="rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-charcoal/[0.03]"
                                href={`https://www.google.com/maps/dir/?api=1&destination=${active.coords.lat},${active.coords.lng}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Directions
                            </a>
                            <Link
                                href={`/conveyancers/firm/${active.slug}`}
                                className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold/90"
                            >
                                Open profile
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
