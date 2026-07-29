'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { bondOriginatorLabel } from '@/lib/bond-originators';

function initials(name: string, email: string) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium text-[#111827]">{value}</p>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="max-w-2xl animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-[#E5E7EB]" />
            <div className="h-64 rounded-2xl border border-[#E5E7EB] bg-white" />
        </div>
    );
}

export default function OriginatorSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        fullName: string;
        email: string;
        organizationId?: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

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
            setLoading(false);
        })();
    }, [router]);

    return (
        <OriginatorPortalLayout
            activePage="settings"
            user={user}
            title="Settings"
            pageHeader={
                <div className="min-w-0">
                    <h2 className="text-[32px] leading-tight font-semibold tracking-tight text-[#111827]">
                        Settings
                    </h2>
                    <p className="mt-2 text-base text-[#6B7280]">Staff profile</p>
                </div>
            }
        >
            {loading && !user ? (
                <SettingsSkeleton />
            ) : (
                <div className="max-w-2xl">
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                        <div className="border-b border-[#E5E7EB] px-5 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#111827] text-lg font-semibold text-white">
                                    {initials(user?.fullName || '', user?.email || '')}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-semibold text-[#111827]">
                                        {user?.fullName || '—'}
                                    </h3>
                                    <p className="truncate text-sm text-[#6B7280]">
                                        {user?.email || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <h4 className="mb-3 text-sm font-semibold text-[#111827]">
                                Profile details
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <InfoField label="Name" value={user?.fullName || '—'} />
                                <InfoField label="Email" value={user?.email || '—'} />
                                <InfoField
                                    label="Organisation"
                                    value={bondOriginatorLabel(user?.organizationId) || '—'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OriginatorPortalLayout>
    );
}
