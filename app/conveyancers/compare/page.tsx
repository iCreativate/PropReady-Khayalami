'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import MapView from '@/components/conveyancer-connect/MapView';
import { CC_CARD_FLAT, PricePips, Stars } from '@/components/conveyancer-connect/cc-ui';
import {
    getConveyancerById,
    loadCcState,
    toggleCompare,
    type ConveyancerProfile,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

const ROWS: Array<{ label: string; render: (c: ConveyancerProfile) => React.ReactNode }> = [
    { label: 'Firm', render: (c) => c.firmName },
    { label: 'Attorney', render: (c) => c.attorneyName },
    { label: 'Rating', render: (c) => <Stars rating={c.rating} /> },
    { label: 'Reviews', render: (c) => c.reviewCount },
    { label: 'Experience', render: (c) => `${c.yearsInPractice} years` },
    { label: 'Transfers', render: (c) => c.completedTransfers.toLocaleString('en-ZA') },
    { label: 'Fee band', render: (c) => <PricePips band={c.priceBand} /> },
    { label: 'Response', render: (c) => `${c.avgResponseHours}h` },
    { label: 'Avg duration', render: (c) => `${c.avgTransferDays} days` },
    { label: 'Languages', render: (c) => c.languages.join(', ') },
    { label: 'Services', render: (c) => c.specialisations.slice(0, 4).join(', ') },
    { label: 'Availability', render: (c) => c.availability },
    { label: 'Verified', render: (c) => (c.verified ? 'Yes' : 'No') },
    { label: 'Location', render: (c) => `${c.suburb}, ${c.city}` },
];

export default function ComparePage() {
    const [ids, setIds] = useState<string[]>([]);

    useEffect(() => {
        setIds(loadCcState().compareIds);
    }, []);

    const profiles = useMemo(
        () => ids.map((id) => getConveyancerById(id)).filter(Boolean) as ConveyancerProfile[],
        [ids]
    );

    function remove(id: string) {
        const { state } = toggleCompare(id);
        setIds(state.compareIds);
    }

    return (
        <CcPageShell title="Compare conveyancers">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Compare up to four"
                    title="Side-by-side conveyancer comparison"
                    description="Rating, experience, fees, response times and services — choose with confidence."
                />

                {!profiles.length ? (
                    <div className={`${CC_CARD_FLAT} p-8 text-center`}>
                        <p className="text-sm text-charcoal/55">
                            No firms in your compare tray yet. Browse and tap Compare on up to four cards.
                        </p>
                        <Link href="/conveyancers" className={`${PORTAL_PRIMARY_BTN} mt-4 inline-flex`}>
                            Browse conveyancers
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-[1.25rem] border border-charcoal/[0.08] bg-white">
                            <table className="min-w-[720px] w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-charcoal/[0.06] bg-charcoal/[0.02]">
                                        <th className="px-4 py-3 font-semibold text-charcoal/50">Metric</th>
                                        {profiles.map((p) => (
                                            <th key={p.id} className="px-4 py-3">
                                                <p className="font-semibold text-charcoal">{p.firmName}</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/conveyancers/firm/${p.slug}`}
                                                        className={`${PORTAL_PRIMARY_BTN} !h-8 !px-3 !text-xs`}
                                                    >
                                                        Profile
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className={`${PORTAL_SECONDARY_BTN} !h-8 !px-3 !text-xs`}
                                                        onClick={() => remove(p.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ROWS.map((row) => (
                                        <tr key={row.label} className="border-b border-charcoal/[0.04]">
                                            <td className="px-4 py-3 font-medium text-charcoal/55">{row.label}</td>
                                            {profiles.map((p) => (
                                                <td key={p.id} className="px-4 py-3 text-charcoal">
                                                    {row.render(p)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <MapView profiles={profiles} />
                    </>
                )}
            </div>
        </CcPageShell>
    );
}
