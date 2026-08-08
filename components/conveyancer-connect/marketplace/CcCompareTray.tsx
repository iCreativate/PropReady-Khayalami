'use client';

import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { findInProfiles, type ConveyancerProfile } from '@/lib/conveyancer-connect';

export default function CcCompareTray({
    compareIds,
    catalog,
    onRemove,
}: {
    compareIds: string[];
    catalog: ConveyancerProfile[];
    onRemove: (id: string) => void;
}) {
    if (compareIds.length < 1) return null;

    const firms = compareIds
        .map((id) => findInProfiles(catalog, id))
        .filter(Boolean) as ConveyancerProfile[];

    return (
        <div className="cc-mp-compare-tray" role="region" aria-label="Compare conveyancers">
            <span className="cc-mp-compare-label">
                Compare {compareIds.length} conveyancer{compareIds.length === 1 ? '' : 's'}
            </span>
            <div className="cc-mp-compare-firms">
                {firms.map((f) => (
                    <span key={f.id} className="cc-mp-compare-pill">
                        <span>{f.firmName}</span>
                        <button
                            type="button"
                            onClick={() => onRemove(f.id)}
                            aria-label={`Remove ${f.firmName} from compare`}
                        >
                            <X />
                        </button>
                    </span>
                ))}
            </div>
            <Link href="/conveyancers/compare" className="cc-mp-compare-go">
                Compare now
                <ArrowRight aria-hidden />
            </Link>
        </div>
    );
}
