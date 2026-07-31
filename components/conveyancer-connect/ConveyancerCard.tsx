'use client';

import Link from 'next/link';
import {
    BadgeCheck,
    Clock3,
    GitCompare,
    Heart,
    MapPin,
    MessageSquare,
    Phone,
    Sparkles,
} from 'lucide-react';
import {
    CcBadge,
    CC_CARD,
    PricePips,
    Stars,
} from '@/components/conveyancer-connect/cc-ui';
import { SPECIALTY_LABELS, type ConveyancerProfile } from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

export default function ConveyancerCard({
    profile,
    saved,
    compared,
    onSave,
    onCompare,
    onQuote,
    onBook,
    distanceKm,
    compact = false,
}: {
    profile: ConveyancerProfile;
    saved?: boolean;
    compared?: boolean;
    onSave?: () => void;
    onCompare?: () => void;
    onQuote?: () => void;
    onBook?: () => void;
    distanceKm?: number;
    compact?: boolean;
}) {
    return (
        <article className={`${CC_CARD} overflow-hidden`}>
            <div className="relative p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-inner"
                        style={{ background: profile.accent }}
                        aria-hidden
                    >
                        {profile.logoInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold tracking-tight text-charcoal">
                                {profile.firmName}
                            </h3>
                            {profile.verified ? (
                                <CcBadge tone="success">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    Verified
                                </CcBadge>
                            ) : null}
                            {profile.featured ? (
                                <CcBadge tone="gold">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Featured
                                </CcBadge>
                            ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-charcoal/55">
                            {profile.attorneyName} · {profile.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <Stars rating={profile.rating} />
                            <span className="text-charcoal/45">{profile.reviewCount} reviews</span>
                            <PricePips band={profile.priceBand} />
                        </div>
                    </div>
                    <div
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white sm:flex"
                        style={{ background: `${profile.accent}CC` }}
                        aria-hidden
                    >
                        {profile.photoInitials}
                    </div>
                </div>

                {!compact ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Stat label="Transfers" value={profile.completedTransfers.toLocaleString('en-ZA')} />
                        <Stat label="Years" value={String(profile.yearsInPractice)} />
                        <Stat label="Response" value={`${profile.avgResponseHours}h`} />
                        <Stat label="Transfer" value={`${profile.avgTransferDays}d`} />
                    </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-charcoal/55">
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gold" />
                        {profile.suburb}, {profile.city}
                        {typeof distanceKm === 'number' ? ` · ${distanceKm.toFixed(1)} km` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {profile.openToday ? 'Open today' : 'Closed today'}
                    </span>
                    <CcBadge
                        tone={
                            profile.availability === 'available'
                                ? 'success'
                                : profile.availability === 'limited'
                                  ? 'gold'
                                  : 'danger'
                        }
                    >
                        {profile.availability === 'available'
                            ? 'Accepting clients'
                            : profile.availability === 'limited'
                              ? 'Limited availability'
                              : 'Busy'}
                    </CcBadge>
                    {profile.onlineConsultation ? <CcBadge>Online consult</CcBadge> : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.specialisations.slice(0, 4).map((s) => (
                        <span
                            key={s}
                            className="rounded-lg bg-charcoal/[0.04] px-2 py-1 text-[11px] font-medium text-charcoal/65"
                        >
                            {SPECIALTY_LABELS[s]}
                        </span>
                    ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                        href={`/conveyancers/firm/${profile.slug}`}
                        className={`${PORTAL_PRIMARY_BTN} !h-10 !px-4 !text-sm`}
                    >
                        View Profile
                    </Link>
                    <button
                        type="button"
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !px-3 !text-sm`}
                        onClick={onCompare}
                        aria-pressed={compared}
                    >
                        <GitCompare className="h-4 w-4" />
                        {compared ? 'In compare' : 'Compare'}
                    </button>
                    <button
                        type="button"
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !px-3 !text-sm`}
                        onClick={onQuote}
                    >
                        Request Quote
                    </button>
                    <button
                        type="button"
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !px-3 !text-sm`}
                        onClick={onBook}
                    >
                        Book
                    </button>
                    <button
                        type="button"
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !w-10 !px-0`}
                        onClick={onSave}
                        aria-label={saved ? 'Remove from saved' : 'Save conveyancer'}
                        aria-pressed={saved}
                    >
                        <Heart className={`h-4 w-4 ${saved ? 'fill-gold text-gold' : ''}`} />
                    </button>
                    <a
                        href={`tel:${profile.phone.replace(/\s/g, '')}`}
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !w-10 !px-0`}
                        aria-label="Call"
                    >
                        <Phone className="h-4 w-4" />
                    </a>
                    <Link
                        href={`/conveyancers/firm/${profile.slug}?tab=message`}
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !w-10 !px-0`}
                        aria-label="Message"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-charcoal/[0.03] px-3 py-2 ring-1 ring-charcoal/[0.05]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">{label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-charcoal">{value}</p>
        </div>
    );
}
