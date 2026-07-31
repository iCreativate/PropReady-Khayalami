'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalLoading from '@/components/PortalLoading';
import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import { fetchFirmBySlug, type ConveyancerProfile } from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

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
    const [profile, setProfile] = useState<ConveyancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            setLoading(true);
            const firm = await fetchFirmBySlug(slug);
            if (cancelled) return;
            if (!firm) setMissing(true);
            else setProfile(firm);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (loading) {
        return <PortalLoading variant="inline" message="Loading profile…" className="min-h-[420px]" />;
    }

    if (missing || !profile) {
        return (
            <div className={`${CC_CARD_FLAT} p-8 text-center`}>
                <h2 className="text-lg font-semibold text-charcoal">Firm not found</h2>
                <p className="mt-2 text-sm text-charcoal/55">
                    This conveyancer is not in the PropReady verified directory, or their profile is still
                    pending approval.
                </p>
                <Link href="/conveyancers" className={`${PORTAL_PRIMARY_BTN} mt-5 inline-flex`}>
                    Browse conveyancers
                </Link>
            </div>
        );
    }

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
