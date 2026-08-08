'use client';

import dynamic from 'next/dynamic';
import { Scale } from 'lucide-react';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalLoading from '@/components/PortalLoading';
import PortalPageHeader from '@/components/PortalPageHeader';
import type { ProvinceSlug } from '@/lib/conveyancer-connect';

const ConveyancerMarketplaceApp = dynamic(
    () => import('@/components/conveyancer-connect/ConveyancerMarketplaceApp'),
    {
        ssr: false,
        loading: () => (
            <PortalLoading
                variant="inline"
                message="Loading Conveyancer Connect…"
                className="min-h-[420px]"
            />
        ),
    }
);

export default function ConveyancersBrowsePage({
    initialProvince = '',
    initialCity = '',
    showHero = true,
}: {
    initialProvince?: ProvinceSlug | '';
    initialCity?: string;
    showHero?: boolean;
}) {
    return (
        <CcPageShell
            title="Conveyancer Connect"
            pageHeader={
                showHero ? (
                    <PortalPageHeader
                        variant="premium"
                        eyebrow="Conveyancer Connect"
                        eyebrowIcon={<Scale className="h-3.5 w-3.5 text-gold" />}
                        title="Find the right conveyancer for your property transfer"
                        description="Browse PropReady-verified firms, request quotes, book consultations, and message attorneys from one place."
                        glassLabel="Directory pulse"
                        metrics={[
                            { label: 'Focus', value: 'Transfers' },
                            { label: 'Coverage', value: 'South Africa' },
                        ]}
                        stats={[
                            { label: 'Directory', value: 'Verified firms' },
                            { label: 'Access', value: 'Quotes · Chat' },
                            { label: 'Tools', value: 'Match · Track' },
                            { label: 'Status', value: 'Live marketplace', tone: 'success' },
                        ]}
                    />
                ) : undefined
            }
        >
            <ConveyancerMarketplaceApp
                initialProvince={initialProvince}
                initialCity={initialCity}
                showHero={false}
            />
        </CcPageShell>
    );
}
