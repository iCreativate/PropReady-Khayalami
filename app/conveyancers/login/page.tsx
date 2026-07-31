'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import LoginOtpStep from '@/components/auth/LoginOtpStep';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { CC_INPUT, CC_LABEL } from '@/components/conveyancer-connect/cc-ui';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

export default function ConveyancerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpChallenge, setOtpChallenge] = useState<{
        token: string;
        email: string;
        devOtp?: string;
    } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    type: 'conveyancer',
                    rememberDevice,
                }),
            });
            const data = await res.json();
            if (res.status === 403 && data.needsVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}&type=conveyancer`);
                return;
            }
            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid credentials');
                return;
            }
            if (data.needsOtp && data.challengeToken) {
                setOtpChallenge({
                    token: data.challengeToken,
                    email: data.email || email.trim(),
                    devOtp: data.devOtp,
                });
                return;
            }
            if (data.user) {
                syncLegacySession(
                    {
                        id: data.user.profileId || data.user.accountId,
                        fullName: data.user.fullName,
                        email: data.user.email,
                        company: data.user.company,
                        accountType: 'conveyancer',
                    },
                    'conveyancer'
                );
            }
            router.push('/conveyancers/portal');
        } catch {
            setError('Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (otpChallenge) {
        return (
            <ProfessionalAuthShell
                role="conveyancer"
                title="Enter login code"
                subtitle="We emailed a one-time code to confirm it’s you"
            >
                <LoginOtpStep
                    email={otpChallenge.email}
                    challengeToken={otpChallenge.token}
                    initialDevOtp={otpChallenge.devOtp}
                    onChallengeTokenChange={(token) =>
                        setOtpChallenge((prev) => (prev ? { ...prev, token } : prev))
                    }
                    onVerified={(data) => {
                        const u = data.user as {
                            profileId?: string;
                            accountId?: string;
                            fullName?: string;
                            email?: string;
                            company?: string;
                        } | undefined;
                        if (u) {
                            syncLegacySession(
                                {
                                    id: u.profileId || u.accountId || '',
                                    fullName: u.fullName,
                                    email: u.email || otpChallenge.email,
                                    company: u.company,
                                    accountType: 'conveyancer',
                                },
                                'conveyancer'
                            );
                        }
                        window.location.assign(data.redirectTo || '/conveyancers/portal');
                    }}
                    onBack={() => setOtpChallenge(null)}
                    onExpired={() => {
                        setOtpChallenge(null);
                        setError('Your login code expired. Please sign in again.');
                    }}
                />
            </ProfessionalAuthShell>
        );
    }

    return (
        <ProfessionalAuthShell
            role="conveyancer"
            title="Conveyancer sign in"
            subtitle="Access matters, live inbox, quotes and Deeds Office tracking"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                ) : null}
                <div>
                    <label className={CC_LABEL}>Work email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
                        <input
                            className={`${CC_INPUT} pl-10`}
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className={CC_LABEL}>Password</label>
                    <input
                        className={CC_INPUT}
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-charcoal/60">
                    <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="accent-gold"
                    />
                    Remember this device
                </label>
                <button type="submit" className={`${PORTAL_PRIMARY_BTN} w-full`} disabled={loading}>
                    {loading ? 'Signing in…' : 'Continue'}
                </button>
                <p className="text-center text-sm text-charcoal/55">
                    New firm?{' '}
                    <Link href="/conveyancers/register" className="font-semibold text-gold">
                        Become verified
                    </Link>
                </p>
            </form>
        </ProfessionalAuthShell>
    );
}
