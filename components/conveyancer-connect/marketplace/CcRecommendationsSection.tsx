'use client';

import Link from 'next/link';
import CcRecommendationCard, {
    pickRecommendations,
} from '@/components/conveyancer-connect/marketplace/CcRecommendationCard';
import type { ConveyancerProfile } from '@/lib/conveyancer-connect';

export default function CcRecommendationsSection({
    catalog,
    savedIds,
    onSave,
    onQuote,
}: {
    catalog: ConveyancerProfile[];
    savedIds: string[];
    onSave: (id: string) => void;
    onQuote: (profile: ConveyancerProfile) => void;
}) {
    const recommended = pickRecommendations(catalog, 3);
    if (!recommended.length) return null;

    return (
        <section className="cc-mp-rec" aria-labelledby="cc-rec-heading">
            <div className="cc-mp-rec-head">
                <div>
                    <h2 id="cc-rec-heading">Recommended for you</h2>
                    <p>Based on your property journey, location and transfer needs.</p>
                </div>
                <Link href="#cc-results" className="cc-mp-rec-link">
                    View all →
                </Link>
            </div>
            <div className="cc-mp-rec-grid">
                {recommended.map((p) => (
                    <CcRecommendationCard
                        key={p.id}
                        profile={p}
                        saved={savedIds.includes(p.id)}
                        onSave={() => onSave(p.id)}
                        onQuote={() => onQuote(p)}
                    />
                ))}
            </div>
        </section>
    );
}
