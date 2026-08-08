'use client';

import Link from 'next/link';
import { BadgeCheck, GitCompare, Heart, Sparkles } from 'lucide-react';
import { Stars } from '@/components/conveyancer-connect/cc-ui';
import { SPECIALTY_LABELS, type ConveyancerProfile } from '@/lib/conveyancer-connect';

function profileQuote(profile: ConveyancerProfile) {
    const top = profile.specialisations[0];
    if (top && SPECIALTY_LABELS[top]) {
        return `Trusted by PropReady users for ${SPECIALTY_LABELS[top].toLowerCase()} property transfers.`;
    }
    return 'Trusted by PropReady users for residential property transfers.';
}

function formatResponse(hours: number) {
    if (hours < 1) return `${Math.round(hours * 60)} min average response`;
    return `${hours < 2 ? Math.round(hours * 10) / 10 : Math.round(hours)} hr average response`;
}

export default function ConveyancerResultCard({
    profile,
    saved,
    compared,
    onSave,
    onCompare,
    onQuote,
}: {
    profile: ConveyancerProfile;
    saved?: boolean;
    compared?: boolean;
    onSave?: () => void;
    onCompare?: () => void;
    onQuote?: () => void;
}) {
    const satisfaction = profile.performance?.clientSatisfactionPct;

    return (
        <article
            className={`cc-mp-result-card${compared ? ' is-compared' : ''}`}
            style={{ ['--cc-mp-accent' as string]: profile.accent }}
        >
            <div className="cc-mp-result-main">
                <div className="cc-mp-result-aside">
                    <div
                        className="cc-mp-monogram"
                        aria-hidden
                        title={`${profile.firmName} logo`}
                    >
                        {profile.logoInitials}
                    </div>
                    <div className="cc-mp-result-badges">
                        {profile.verified ? (
                            <span className="cc-mp-badge cc-mp-badge--verified">
                                <BadgeCheck />
                                Verified
                            </span>
                        ) : null}
                        {profile.featured ? (
                            <span className="cc-mp-badge cc-mp-badge--rec">
                                <Sparkles />
                                Recommended
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="cc-mp-result-body">
                    <h3>
                        <Link href={`/conveyancers/firm/${profile.slug}`}>{profile.firmName}</Link>
                    </h3>
                    <p className="cc-mp-result-role">Conveyancing Attorneys</p>
                    <p className="cc-mp-result-quote">{profileQuote(profile)}</p>
                    <div className="cc-mp-rec-rating">
                        {profile.reviewCount > 0 ? (
                            <>
                                <Stars rating={profile.rating} />
                                <span>{profile.reviewCount} reviews</span>
                            </>
                        ) : (
                            <span>New on PropReady</span>
                        )}
                    </div>
                    <p className="cc-mp-result-meta">
                        {profile.city} · {profile.yearsInPractice} years experience
                    </p>
                </div>
            </div>

            <div className="cc-mp-result-section">
                <p className="cc-mp-result-section-label">Services</p>
                <p className="cc-mp-result-services">
                    {profile.specialisations.slice(0, 4).map((s) => SPECIALTY_LABELS[s]).join(' · ')}
                </p>
            </div>

            <div className="cc-mp-result-section">
                <p className="cc-mp-result-section-label">Performance</p>
                <p className="cc-mp-result-perf">
                    <span>
                        <strong>{profile.completedTransfers}</strong> transfers completed
                    </span>
                    <span>{formatResponse(profile.avgResponseHours)}</span>
                    {typeof satisfaction === 'number' ? (
                        <span>
                            <strong>{satisfaction}%</strong> client satisfaction
                        </span>
                    ) : null}
                </p>
            </div>

            <div className="cc-mp-result-actions">
                <Link
                    href={`/conveyancers/firm/${profile.slug}`}
                    className="cc-mp-btn-primary"
                >
                    View Profile
                </Link>
                <button type="button" className="cc-mp-btn-secondary" onClick={onQuote}>
                    Request Quote
                </button>
                <button
                    type="button"
                    className={`cc-mp-result-icon-btn${compared ? ' is-compared' : ''}`}
                    onClick={onCompare}
                    aria-label={compared ? 'Remove from compare' : 'Add to compare'}
                    aria-pressed={compared}
                >
                    <GitCompare />
                </button>
                <button
                    type="button"
                    className={`cc-mp-result-icon-btn${saved ? ' is-saved' : ''}`}
                    onClick={onSave}
                    aria-label={saved ? 'Remove from saved' : 'Save conveyancer'}
                    aria-pressed={saved}
                >
                    <Heart />
                </button>
            </div>
        </article>
    );
}
