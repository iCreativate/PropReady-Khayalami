'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';
import { CC_CARD_FLAT, CC_INPUT, CC_LABEL } from '@/components/conveyancer-connect/cc-ui';
import { PROVINCE_LABELS } from '@/lib/conveyancer-connect';

export default function ConveyancerRegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [firmName, setFirmName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lpcNumber, setLpcNumber] = useState('');
    const [province, setProvince] = useState('gauteng');
    const [city, setCity] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'conveyancer',
                    fullName,
                    firmName,
                    email,
                    password,
                    lpcNumber,
                    province,
                    city,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(String(data.error || 'Registration failed'));
                return;
            }
            setMessage(
                String(
                    data.message ||
                        'Check your email to verify, then wait for PropReady admin approval.'
                )
            );
            window.setTimeout(() => {
                router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&type=conveyancer`);
            }, 1200);
        } catch {
            setError('Could not register. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-dvh bg-[#F8FAFC] px-4 py-10">
            <div className="mx-auto max-w-lg space-y-6">
                <div className="text-center">
                    <BrandLogo />
                    <h1 className="mt-6 text-2xl font-semibold text-charcoal">
                        Become a Verified Conveyancer
                    </h1>
                    <p className="mt-2 text-sm text-charcoal/55">
                        Create your firm account to receive leads, message clients, and track Deeds Office
                        progress.
                    </p>
                </div>
                <form onSubmit={onSubmit} className={`${CC_CARD_FLAT} space-y-3 p-6`}>
                    {error ? (
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    ) : null}
                    {message ? (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {message}
                        </p>
                    ) : null}
                    <div>
                        <label className={CC_LABEL}>Lead attorney name</label>
                        <input className={CC_INPUT} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                        <label className={CC_LABEL}>Firm name</label>
                        <input className={CC_INPUT} required value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                    </div>
                    <div>
                        <label className={CC_LABEL}>Work email</label>
                        <input className={CC_INPUT} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className={CC_LABEL}>Password</label>
                        <input className={CC_INPUT} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className={CC_LABEL}>LPC / practice number</label>
                        <input className={CC_INPUT} value={lpcNumber} onChange={(e) => setLpcNumber(e.target.value)} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className={CC_LABEL}>Province</label>
                            <select className={CC_INPUT} value={province} onChange={(e) => setProvince(e.target.value)}>
                                {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={CC_LABEL}>City</label>
                            <input className={CC_INPUT} value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className={`${PORTAL_PRIMARY_BTN} w-full`} disabled={loading}>
                        {loading ? 'Submitting…' : 'Submit for verification'}
                    </button>
                </form>
                <p className="text-center text-sm text-charcoal/55">
                    Already registered?{' '}
                    <Link href="/conveyancers/login" className="font-semibold text-gold">
                        Sign in
                    </Link>
                </p>
                <div className="text-center">
                    <Link href="/conveyancers" className={PORTAL_SECONDARY_BTN}>
                        Marketplace
                    </Link>
                </div>
            </div>
        </div>
    );
}
