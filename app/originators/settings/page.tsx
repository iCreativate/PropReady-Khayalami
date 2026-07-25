'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import {
    ORIGINATOR_CARD,
    ORIGINATOR_CARD_BODY,
    ORIGINATOR_CARD_HEADER,
    ORIGINATOR_TEXT_SECONDARY,
} from '@/lib/originator-portal-ui';

export default function OriginatorSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        fullName: string;
        email: string;
        organizationId?: string;
    } | null>(null);

    useEffect(() => {
        void (async () => {
            const bridged = await hydrateSessionFromCookies();
            if (!bridged || bridged.accountType !== 'originator') {
                router.replace('/originators/login');
                return;
            }
            setUser({
                fullName: bridged.fullName || bridged.email,
                email: bridged.email,
                organizationId: bridged.organizationId || bridged.company,
            });
        })();
    }, [router]);

    return (
        <OriginatorPortalLayout activePage="settings" user={user} title="Settings">
            <div className={`${ORIGINATOR_CARD} max-w-xl`}>
                <div className={ORIGINATOR_CARD_HEADER}>
                    <h2 className="text-lg font-semibold text-charcoal">Staff profile</h2>
                </div>
                <div className={`${ORIGINATOR_CARD_BODY} space-y-3 text-sm`}>
                    <p>
                        <span className={ORIGINATOR_TEXT_SECONDARY}>Name · </span>
                        {user?.fullName || '—'}
                    </p>
                    <p>
                        <span className={ORIGINATOR_TEXT_SECONDARY}>Email · </span>
                        {user?.email || '—'}
                    </p>
                    <p>
                        <span className={ORIGINATOR_TEXT_SECONDARY}>Organisation · </span>
                        {bondOriginatorLabel(user?.organizationId) || '—'}
                    </p>
                </div>
            </div>
        </OriginatorPortalLayout>
    );
}
