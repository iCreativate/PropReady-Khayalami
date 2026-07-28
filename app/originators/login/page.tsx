'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, Hash, Mail } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import LoginOtpStep from '@/components/auth/LoginOtpStep';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';

export default function OriginatorLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [organizationId, setOrganizationId] = useState<string>(BOND_ORIGINATORS[0]?.id || '');
    const [staffNumber, setStaffNumber] = useState('');
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

        const staff = staffNumber.trim().toUpperCase();
        if (staff.length < 4) {
            setError('Enter your bond originator staff number (at least 4 characters).');
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
                    type: 'originator',
                    organizationId,
                    staffNumber: staff,
                    rememberDevice,
                }),
            });
            const data = await res.json();
            if (res.status === 403 && data.needsVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}&type=originator`);
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
                role="originator"
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
                        syncLegacySession(
                            data.user as Parameters<typeof syncLegacySession>[0],
                            'originator'
                        );
                        window.location.assign(
                            data.redirectTo || '/auth/confirm-password?type=originator'
                        );
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
            role="originator"
            title="Bond originator sign-in"
            subtitle="Organisation, staff number, and work email first. We email a code, then ask for your password."
        >
            {error ? (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

            <div className="rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] px-4 py-3 text-xs text-charcoal/55 mb-5 leading-relaxed">
                After you register and verify email, PropReady must approve your staff account. Your staff number
                is emailed when you are approved. Each sign-in is email code first, then password.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="auth-label">Organisation</label>
                    <div className="auth-input-wrap">
                        <Building2 className="auth-input-icon" />
                        <select
                            className="auth-input"
                            required
                            value={organizationId}
                            onChange={(e) => setOrganizationId(e.target.value)}
                        >
                            {BOND_ORIGINATORS.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="auth-label">Originator staff number</label>
                    <div className="auth-input-wrap">
                        <Hash className="auth-input-icon" />
                        <input
                            type="text"
                            required
                            autoComplete="off"
                            className="auth-input font-mono uppercase"
                            placeholder="e.g. BB-10482"
                            value={staffNumber}
                            onChange={(e) => setStaffNumber(e.target.value.slice(0, 32))}
                        />
                    </div>
                </div>

                <div>
                    <label className="auth-label">Work email</label>
                    <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="auth-input"
                            placeholder="you@originator.co.za"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
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
                    <span className="text-charcoal/45">Password is entered after the code.</span>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary w-full mt-2">
                    {loading ? 'Sending code…' : 'Continue'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-8">
                New staff member?{' '}
                <Link href="/originators/register" className="text-gold font-medium hover:underline">
                    Register as staff
                </Link>
            </p>
        </ProfessionalAuthShell>
    );
}
