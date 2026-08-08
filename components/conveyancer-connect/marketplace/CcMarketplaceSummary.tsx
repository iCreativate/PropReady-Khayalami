'use client';

import type { ConveyancerProfile } from '@/lib/conveyancer-connect';

export default function CcMarketplaceSummary({
    catalog,
    resultsCount,
}: {
    catalog: ConveyancerProfile[];
    resultsCount: number;
}) {
    const verified = catalog.filter((c) => c.verified);
    const rated = catalog.filter((c) => c.reviewCount > 0);
    const avgRating =
        rated.length > 0
            ? rated.reduce((s, c) => s + c.rating, 0) / rated.length
            : 0;
    const avgResponse =
        catalog.length > 0
            ? catalog.reduce((s, c) => s + c.avgResponseHours, 0) / catalog.length
            : 0;
    const availableNow = catalog.filter((c) => c.availability === 'available').length;

    const responseLabel =
        avgResponse < 1
            ? `< ${Math.max(1, Math.round(avgResponse * 60))} min`
            : avgResponse < 2
              ? '< 2 hrs'
              : `${avgResponse.toFixed(1)} hrs`;

    return (
        <div className="cc-mp-summary" role="status">
            <p className="cc-mp-summary-lead">
                <strong>{resultsCount || verified.length}</strong> verified conveyancers available
                in your area
            </p>
            <div className="cc-mp-summary-stats">
                <span className="cc-mp-summary-stat">
                    <em>Verified firms</em>
                    <strong>{verified.length}</strong>
                </span>
                <span className="cc-mp-summary-stat">
                    <em>Average rating</em>
                    <strong>{avgRating ? `${avgRating.toFixed(1)} ★` : '—'}</strong>
                </span>
                <span className="cc-mp-summary-stat">
                    <em>Average response</em>
                    <strong>{catalog.length ? responseLabel : '—'}</strong>
                </span>
                <span className="cc-mp-summary-stat">
                    <em>Available now</em>
                    <strong>{availableNow}</strong>
                </span>
            </div>
        </div>
    );
}
