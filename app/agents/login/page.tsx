'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, FileText, Lock, Mail } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import LoginOtpStep from '@/components/auth/LoginOtpStep';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { FFC_NUMBER_ERROR, normalizeFfcNumber, validateFfcNumber } from '@/lib/ppra';

export default function AgentLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [ffcNumber, setFfcNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

        const ffc = normalizeFfcNumber(ffcNumber);
        if (!ffc || !validateFfcNumber(ffc) || ffc.length !== 15) {
            setError(FFC_NUMBER_ERROR);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    type: 'agent',
                    ffcNumber: ffc,
                    rememberDevice,
                }),
            });
            const data = await res.json();
            if (res.status === 403 && data.needsVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}&type=agent`);
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
            setError('Unexpected login response. Please try again.');
        } catch {
            setError('Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (otpChallenge) {
        return (
            <ProfessionalAuthShell
                role="agent"
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
                        syncLegacySession(data.user as Parameters<typeof syncLegacySession>[0], 'agent');
                        window.location.assign('/auth/complete?type=agent');
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
            role="agent"
            title="Agent sign-in"
            subtitle="Enter your work email, Fidelity Fund Certificate number, and password. A one-time email code confirms every sign-in."
        >
            {error ? (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

            <div className="rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] px-4 py-3 text-xs text-charcoal/55 mb-5 leading-relaxed">
                New registrations stay pending until a PropReady admin reviews your details and FFC and
                approves your account. Every login also requires an email one-time code.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="auth-label">Work email</label>
                    <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="auth-input"
                            placeholder="you@agency.co.za"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="auth-label">FFC number</label>
                    <div className="auth-input-wrap">
                        <FileText className="auth-input-icon" />
                        <input
                            type="text"
                            required
                            inputMode="numeric"
                            autoComplete="off"
                            className="auth-input font-mono"
                            placeholder="15-digit FFC number"
                            value={ffcNumber}
                            onChange={(e) => setFfcNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        />
                    </div>
                    <p className="text-xs text-charcoal/45 mt-1.5">Must match the FFC on your PropReady agent profile.</p>
                </div>

                <div>
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                        <Lock className="auth-input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            className="auth-input pr-10"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="auth-input-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label="Toggle password"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                    <label className="flex items-center gap-2 text-charcoal/70 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="rounded border-charcoal/20 text-gold focus:ring-gold"
                        />
                        Trust this device
                    </label>
                    <Link href="/auth/forgot-password?type=agent" className="text-gold hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary w-full mt-2">
                    {loading ? 'Sending code…' : 'Continue'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-8">
                New PPRA agent?{' '}
                <Link href="/agents/register" className="text-gold font-medium hover:underline">
                    Register with FFC
                </Link>
            </p>
        </ProfessionalAuthShell>
    );
}
