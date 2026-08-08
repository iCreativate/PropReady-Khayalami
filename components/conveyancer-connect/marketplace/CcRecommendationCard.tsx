'use client';

import Link from 'next/link';
import { BadgeCheck, Heart, Sparkles } from 'lucide-react';
import { Stars } from '@/components/conveyancer-connect/cc-ui';
import { SPECIALTY_LABELS, type ConveyancerProfile } from '@/lib/conveyancer-connect';

function trustLine(profile: ConveyancerProfile) {
    const top = profile.specialisations[0];
    if (top && SPECIALTY_LABELS[top]) {
        return `Highly rated for ${SPECIALTY_LABELS[top].toLowerCase()} transfers`;
    }
    return 'Trusted by PropReady users for property transfers';
}

export default function CcRecommendationCard({
    profile,
    saved,
    onSave,
    onQuote,
}: {
    profile: ConveyancerProfile;
    saved?: boolean;
    onSave?: () => void;
    onQuote?: () => void;
}) {
    return (
        <article
            className="cc-mp-rec-card"
            style={{ ['--cc-mp-accent' as string]: profile.accent }}
        >
            <div className="cc-mp-rec-card-top">
                <div className="cc-mp-rec-badges">
                    {profile.verified ? (
                        <span className="cc-mp-badge cc-mp-badge--verified">
                            <BadgeCheck />
                            Verified
                        </span>
                    ) : null}
                    <span className="cc-mp-badge cc-mp-badge--rec">
                        <Sparkles />
                        Recommended
                    </span>
                </div>
                <button
                    type="button"
                    className={`cc-mp-rec-fav${saved ? ' is-saved' : ''}`}
                    onClick={onSave}
                    aria-label={saved ? 'Remove from saved' : 'Save conveyancer'}
                    aria-pressed={saved}
                >
                    <Heart />
                </button>
            </div>

            <div className="cc-mp-monogram" aria-hidden>
                {profile.logoInitials}
            </div>

            <div className="cc-mp-rec-identity">
                <h3>
                    <Link href={`/conveyancers/firm/${profile.slug}`}>{profile.firmName}</Link>
                </h3>
                <p>
                    {profile.attorneyName} · Conveyancing Attorney
                </p>
                <p className="cc-mp-rec-location">
                    {profile.suburb}, {profile.city}
                </p>
            </div>

            <div className="cc-mp-rec-rating">
                {profile.reviewCount > 0 ? (
                    <>
                        <Stars rating={profile.rating} />
                        <span>{profile.reviewCount} client reviews</span>
                    </>
                ) : (
                    <span>New on PropReady</span>
                )}
            </div>

            <p className="cc-mp-rec-trust">{trustLine(profile)}</p>

            <div className="cc-mp-rec-metrics">
                <div className="cc-mp-rec-metric">
                    <strong>{profile.completedTransfers}</strong>
                    <span>Transfers</span>
                </div>
                <div className="cc-mp-rec-metric">
                    <strong>{profile.rating.toFixed(1)}</strong>
                    <span>Rating</span>
                </div>
                <div className="cc-mp-rec-metric">
                    <strong>{profile.yearsInPractice} yrs</strong>
                    <span>Experience</span>
                </div>
            </div>

            <div className="cc-mp-rec-tags">
                {profile.specialisations.slice(0, 3).map((s) => (
                    <span key={s} className="cc-mp-rec-tag">
                        {SPECIALTY_LABELS[s]}
                    </span>
                ))}
            </div>

            <div className="cc-mp-rec-actions">
                <Link
                    href={`/conveyancers/firm/${profile.slug}`}
                    className="cc-mp-btn-primary"
                >
                    View Profile
                </Link>
                <button type="button" className="cc-mp-btn-secondary" onClick={onQuote}>
                    Request Quote
                </button>
            </div>
        </article>
    );
}

export function pickRecommendations(profiles: ConveyancerProfile[], limit = 3) {
    return [...profiles]
        .sort((a, b) => {
            const score = (p: ConveyancerProfile) =>
                (p.featured ? 100 : 0) +
                (p.availability === 'available' ? 20 : p.availability === 'limited' ? 10 : 0) +
                p.rating * Math.log10(p.reviewCount + 10) +
                p.yearsInPractice * 0.5;
            return score(b) - score(a);
        })
        .slice(0, limit);
}
