'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Mail } from 'lucide-react';
import LoginOtpStep from '@/components/auth/LoginOtpStep';

/**
 * PropReady staff login — not linked from the public app.
 * Access requires email on ADMIN_EMAILS + OTP.
 */
export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
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
            const res = await fetch('/api/admin/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || 'Could not start staff sign-in');
                return;
            }
            if (!data.challengeToken) {
                setError(data.error || 'Could not start staff sign-in');
                return;
            }
            setOtpChallenge({
                token: data.challengeToken,
                email: data.email || email.trim(),
                devOtp: data.devOtp,
            });
        } catch {
            setError('Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (otpChallenge) {
        return (
            <div className="min-h-dvh bg-[#f4f4f5] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl border border-charcoal/[0.08] shadow-sm p-6 sm:p-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold mb-2">
                        PropReady staff
                    </p>
                    <h1 className="text-2xl font-semibold text-charcoal mb-6">Enter login code</h1>
                    {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
                    <LoginOtpStep
                        email={otpChallenge.email}
                        challengeToken={otpChallenge.token}
                        initialDevOtp={otpChallenge.devOtp}
                        verifyUrl="/api/admin/auth/verify-otp"
                        resendUrl="/api/admin/auth/resend-otp"
                        onChallengeTokenChange={(token) =>
                            setOtpChallenge((prev) => (prev ? { ...prev, token } : prev))
                        }
                        onVerified={() => router.replace('/admin')}
                        onBack={() => setOtpChallenge(null)}
                        onExpired={() => {
                            setOtpChallenge(null);
                            setError('Code expired. Try again.');
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#f4f4f5] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl border border-charcoal/[0.08] shadow-sm p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold mb-2">
                    PropReady staff
                </p>
                <h1 className="text-2xl font-semibold text-charcoal mb-2">Staff console</h1>
                <p className="text-sm text-charcoal/55 mb-6 leading-relaxed">
                    Restricted access. Sign in with an authorised PropReady staff email. A one-time code is
                    required.
                </p>

                {error ? (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                            Staff email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 pl-10 pr-3 rounded-xl border border-charcoal/[0.12] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                                placeholder="you@propready.co.za"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-gold text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60"
                    >
                        {loading ? 'Sending code…' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
