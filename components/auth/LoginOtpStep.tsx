'use client';

import { useState } from 'react';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';

type LoginOtpStepProps = {
    email: string;
    challengeToken: string;
    /** Shown in development when Resend is unavailable */
    initialDevOtp?: string;
    verifyUrl?: string;
    resendUrl?: string;
    onChallengeTokenChange: (token: string) => void;
    onVerified: (data: { user?: unknown; email?: string }) => void;
    onBack: () => void;
    onExpired: () => void;
};

export default function LoginOtpStep({
    email,
    challengeToken,
    initialDevOtp,
    verifyUrl = '/api/auth/login/verify-otp',
    resendUrl = '/api/auth/login/resend-otp',
    onChallengeTokenChange,
    onVerified,
    onBack,
    onExpired,
}: LoginOtpStepProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState(
        initialDevOtp ? `Dev code: ${initialDevOtp}` : ''
    );
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ challengeToken, otp: otp.trim() }),
            });
            const data = await res.json();
            if (data.expired) {
                onExpired();
                return;
            }
            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid login code');
                return;
            }
            onVerified(data);
        } catch {
            setError('Unable to verify code. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError('');
        setInfo('');
        setResending(true);
        try {
            const res = await fetch(resendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeToken }),
            });
            const data = await res.json();
            if (data.expired) {
                onExpired();
                return;
            }
            if (!res.ok || !data.success) {
                setError(data.error || 'Could not resend code');
                return;
            }
            if (data.challengeToken) onChallengeTokenChange(data.challengeToken);
            setInfo(
                data.devOtp
                    ? `New code sent. Dev code: ${data.devOtp}`
                    : 'A new code was sent to your email.'
            );
        } catch {
            setError('Could not resend code.');
        } finally {
            setResending(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] px-4 py-3 text-sm text-charcoal/65 leading-relaxed">
                We sent a 6-digit code to <span className="font-medium text-charcoal">{email}</span>.
                Enter it below to finish signing in.
            </div>

            {error ? (
                <div className="auth-alert auth-alert-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}
            {info ? (
                <p className="text-xs text-charcoal/55 font-mono break-all">{info}</p>
            ) : null}

            <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label className="auth-label">Login code</label>
                    <div className="auth-input-wrap">
                        <KeyRound className="auth-input-icon" />
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            maxLength={6}
                            className="auth-input font-mono tracking-[0.35em] text-center text-lg"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading || otp.length !== 6} className="auth-btn-primary w-full">
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                        </span>
                    ) : (
                        'Verify & sign in'
                    )}
                </button>
            </form>

            <div className="flex items-center justify-between gap-3 text-sm pt-1">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-charcoal/55 hover:text-charcoal transition"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={resending}
                    className="text-gold font-medium hover:underline disabled:opacity-50"
                >
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
            </div>
        </div>
    );
}
