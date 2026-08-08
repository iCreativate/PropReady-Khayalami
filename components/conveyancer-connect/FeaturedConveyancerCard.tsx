'use client';

import Link from 'next/link';
import {
    BadgeCheck,
    Clock3,
    Heart,
    MapPin,
    Scale,
    Sparkles,
} from 'lucide-react';
import { PricePips, Stars } from '@/components/conveyancer-connect/cc-ui';
import { SPECIALTY_LABELS, type ConveyancerProfile } from '@/lib/conveyancer-connect';

function formatTransfers(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k+`;
    return String(n);
}

export default function FeaturedConveyancerCard({
    profile,
    saved,
    onSave,
    onQuote,
    onBook,
    distanceKm,
}: {
    profile: ConveyancerProfile;
    saved?: boolean;
    onSave?: () => void;
    onQuote?: () => void;
    onBook?: () => void;
    distanceKm?: number;
}) {
    const availabilityLabel =
        profile.availability === 'available'
            ? 'Accepting clients'
            : profile.availability === 'limited'
              ? 'Limited slots'
              : 'Busy';

    return (
        <article
            className="cc-featured-card"
            style={{ ['--cc-feat-accent' as string]: profile.accent }}
        >
            <div
                className="cc-featured-brand"
                title="Conveyancer Connect"
                aria-label="Conveyancer Connect"
            >
                <Scale aria-hidden />
                <span>Conveyancer</span>
            </div>

            <div className="cc-featured-card-top">
                <div
                    className="cc-featured-logo"
                    aria-hidden
                    title={`${profile.firmName} logo`}
                >
                    <span className="cc-featured-logo-icon">
                        <Scale strokeWidth={2.25} />
                    </span>
                    <span className="cc-featured-logo-initials">{profile.logoInitials}</span>
                    {profile.verified ? (
                        <span className="cc-featured-avatar-mark">
                            <BadgeCheck strokeWidth={2.5} />
                        </span>
                    ) : null}
                </div>

                <div className="cc-featured-card-identity">
                    <div className="cc-featured-card-badges">
                        {profile.verified ? (
                            <span className="cc-featured-pill cc-featured-pill--verified">
                                <BadgeCheck />
                                Verified
                            </span>
                        ) : null}
                        <span className="cc-featured-pill cc-featured-pill--featured">
                            <Sparkles />
                            Featured
                        </span>
                    </div>
                    <h3>
                        <Link href={`/conveyancers/firm/${profile.slug}`}>{profile.firmName}</Link>
                    </h3>
                    <p>
                        {profile.attorneyName} · {profile.title}
                    </p>
                    <div className="cc-featured-rating">
                        {profile.reviewCount > 0 ? (
                            <>
                                <Stars rating={profile.rating} />
                                <span>{profile.reviewCount} reviews</span>
                            </>
                        ) : (
                            <span>New on PropReady</span>
                        )}
                        <PricePips band={profile.priceBand} />
                    </div>
                </div>
            </div>

            <div className="cc-featured-metrics">
                <div className="cc-featured-metric">
                    <span>Transfers</span>
                    <strong>{formatTransfers(profile.completedTransfers)}</strong>
                </div>
                <div className="cc-featured-metric">
                    <span>Avg days</span>
                    <strong>{profile.avgTransferDays}</strong>
                </div>
                <div className="cc-featured-metric">
                    <span>Response</span>
                    <strong>
                        {profile.avgResponseHours < 1
                            ? `${Math.round(profile.avgResponseHours * 60)}m`
                            : `${profile.avgResponseHours.toFixed(1)}h`}
                    </strong>
                </div>
            </div>

            <div className="cc-featured-meta">
                <span>
                    <MapPin />
                    {profile.suburb}, {profile.city}
                    {typeof distanceKm === 'number' ? ` · ${distanceKm.toFixed(1)} km` : ''}
                </span>
                <span>
                    <Clock3 />
                    {profile.openToday ? 'Open today' : 'Closed today'}
                    {' · '}
                    {availabilityLabel}
                </span>
            </div>

            <div className="cc-featured-tags">
                {profile.specialisations.slice(0, 3).map((s) => (
                    <span key={s} className="cc-featured-tag">
                        {SPECIALTY_LABELS[s]}
                    </span>
                ))}
            </div>

            <div className="cc-featured-actions">
                <Link
                    href={`/conveyancers/firm/${profile.slug}`}
                    className="cc-featured-primary"
                >
                    View profile
                </Link>
                <button type="button" className="cc-featured-secondary" onClick={onQuote}>
                    Request quote
                </button>
                <button type="button" className="cc-featured-secondary" onClick={onBook}>
                    Book
                </button>
                <button
                    type="button"
                    className="cc-featured-icon"
                    onClick={onSave}
                    aria-label={saved ? 'Remove from saved' : 'Save conveyancer'}
                    aria-pressed={saved}
                >
                    <Heart className={saved ? 'fill-current' : ''} />
                </button>
            </div>
        </article>
    );
}
