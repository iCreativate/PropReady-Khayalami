'use client';

import dynamic from 'next/dynamic';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalLoading from '@/components/PortalLoading';
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
        <CcPageShell>
            <ConveyancerMarketplaceApp
                initialProvince={initialProvince}
                initialCity={initialCity}
                showHero={showHero}
            />
        </CcPageShell>
    );
}
