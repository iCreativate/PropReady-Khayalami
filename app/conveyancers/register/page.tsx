'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';
import { CC_INPUT, CC_LABEL } from '@/components/conveyancer-connect/cc-ui';
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
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
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

            try {
                await fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        accountType: 'conveyancer',
                        fullName,
                    }),
                });
            } catch {
                /* verify page can resend */
            }

            router.push(
                `/verify-email?email=${encodeURIComponent(email)}&type=conveyancer`
            );
        } catch {
            setError('Could not register. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProfessionalAuthShell
            role="conveyancer"
            title="Become a verified conveyancer"
            subtitle="Create your firm account, verify email, then wait for PropReady admin approval to access the portal."
            wide
        >
            <form onSubmit={onSubmit} className="space-y-3">
                {error ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                ) : null}
                <div>
                    <label className={CC_LABEL}>Lead attorney name</label>
                    <input
                        className={CC_INPUT}
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                    />
                </div>
                <div>
                    <label className={CC_LABEL}>Firm name</label>
                    <input
                        className={CC_INPUT}
                        required
                        value={firmName}
                        onChange={(e) => setFirmName(e.target.value)}
                        autoComplete="organization"
                    />
                </div>
                <div>
                    <label className={CC_LABEL}>Work email</label>
                    <input
                        className={CC_INPUT}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className={CC_LABEL}>Password</label>
                    <input
                        className={CC_INPUT}
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
                <div>
                    <label className={CC_LABEL}>LPC / practice number</label>
                    <input
                        className={CC_INPUT}
                        value={lpcNumber}
                        onChange={(e) => setLpcNumber(e.target.value)}
                    />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className={CC_LABEL}>Province</label>
                        <select
                            className={CC_INPUT}
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                        >
                            {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={CC_LABEL}>City</label>
                        <input
                            className={CC_INPUT}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" className={`${PORTAL_PRIMARY_BTN} w-full`} disabled={loading}>
                    {loading ? 'Submitting…' : 'Submit for verification'}
                </button>
                <p className="text-center text-sm text-charcoal/55">
                    Already registered?{' '}
                    <Link href="/conveyancers/login" className="font-semibold text-gold">
                        Sign in to portal
                    </Link>
                </p>
            </form>
        </ProfessionalAuthShell>
    );
}
