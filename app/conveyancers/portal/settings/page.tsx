'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConveyancerPortalLayout from '@/components/conveyancer-connect/ConveyancerPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { CC_CARD_FLAT, CC_INPUT, CC_LABEL, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

export default function ConveyancerSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [city, setCity] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const optimistic = readOptimisticSession('conveyancer');
        if (optimistic) {
            setUser({
                id: optimistic.id,
                fullName: optimistic.fullName || 'Conveyancer',
                email: optimistic.email,
                firmName: optimistic.company,
            });
        }
        void (async () => {
            const bridged = await hydrateSessionFromCookies({ force: true });
            if (cancelled) return;
            if (!bridged || bridged.accountType !== 'conveyancer') {
                router.replace('/conveyancers/login');
                return;
            }
            setUser({
                id: bridged.id,
                fullName: bridged.fullName || 'Conveyancer',
                email: bridged.email,
                firmName: bridged.company,
            });
            const res = await fetch('/api/conveyancers/portal/summary', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.profile) {
                setBio(String(data.profile.bio || ''));
                setPhone(String(data.profile.phone || ''));
                setWebsite(String(data.profile.website || ''));
                setCity(String(data.profile.city || ''));
                setUser((u) =>
                    u
                        ? {
                              ...u,
                              firmName: data.profile.firm_name || u.firmName,
                              fullName: data.profile.full_name || u.fullName,
                          }
                        : u
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        const res = await fetch('/api/conveyancers/profile', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio, phone, website, city }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(String(data.error || 'Could not save'));
            return;
        }
        setMessage('Profile updated');
    }

    if (!user) {
        return <div className="min-h-screen bg-[#F8FAFC] p-8 text-sm text-charcoal/50">Loading…</div>;
    }

    return (
        <ConveyancerPortalLayout
            activePage="settings"
            user={user}
            title="Profile"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Public presence"
                    title={user.firmName || 'Firm profile'}
                    description="Keep your marketplace profile current so buyers, sellers and agents can reach you with confidence."
                />
            }
        >
            <form onSubmit={save} className={`${CC_CARD_FLAT} mx-auto max-w-xl space-y-3 p-6`}>
                {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                {message ? (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
                ) : null}
                <p className={CC_MUTED}>
                    Signed in as {user.fullName} · {user.email}
                </p>
                <div>
                    <label className={CC_LABEL}>Phone</label>
                    <input className={CC_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                    <label className={CC_LABEL}>City</label>
                    <input className={CC_INPUT} value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                    <label className={CC_LABEL}>Website</label>
                    <input className={CC_INPUT} value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div>
                    <label className={CC_LABEL}>Bio</label>
                    <textarea className={CC_INPUT} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>
                <button type="submit" className={PORTAL_PRIMARY_BTN}>
                    Save profile
                </button>
            </form>
        </ConveyancerPortalLayout>
    );
}
