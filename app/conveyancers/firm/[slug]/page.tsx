'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalLoading from '@/components/PortalLoading';
import { getConveyancerBySlug } from '@/lib/conveyancer-connect';

const FirmProfileApp = dynamic(
    () => import('@/components/conveyancer-connect/FirmProfileApp'),
    {
        ssr: false,
        loading: () => (
            <PortalLoading variant="inline" message="Loading profile…" className="min-h-[420px]" />
        ),
    }
);

function FirmInner() {
    const params = useParams();
    const search = useSearchParams();
    const slug = String(params.slug || '');
    const profile = getConveyancerBySlug(slug);
    if (!profile) notFound();
    return <FirmProfileApp profile={profile} initialTab={search.get('tab') || undefined} />;
}

export default function FirmPage() {
    return (
        <CcPageShell title="Conveyancer profile">
            <Suspense
                fallback={
                    <PortalLoading variant="inline" message="Loading profile…" className="min-h-[420px]" />
                }
            >
                <FirmInner />
            </Suspense>
        </CcPageShell>
    );
}
