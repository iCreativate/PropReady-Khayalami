'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

function ConfirmPasswordInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountType = searchParams.get('type') === 'agent' ? 'agent' : 'user';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                if (!res.ok) {
                    router.replace(`/auth/login?type=${accountType}`);
                    return;
                }
                const data = await res.json();
                if (cancelled) return;

                if (!data.user?.hasPassword) {
                    router.replace(
                        accountType === 'agent'
                            ? '/auth/complete-profile?type=agent'
                            : '/auth/complete-profile'
                    );
                    return;
                }

                if (data.user.passwordOk !== false && data.user.profileComplete) {
                    router.replace(
                        data.user.accountType === 'agent' ? '/agents/dashboard' : '/dashboard'
                    );
                    return;
                }

                if (data.user.passwordOk !== false && !data.user.profileComplete) {
                    router.replace(
                        accountType === 'agent'
                            ? '/auth/complete-profile?type=agent'
                            : '/auth/complete-profile'
                    );
                    return;
                }

                setEmail(data.user?.email || '');
                setReady(true);
            } catch {
                if (!cancelled) router.replace(`/auth/login?type=${accountType}`);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accountType, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/confirm-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Incorrect password');
                if (data.redirectTo) router.replace(data.redirectTo);
                return;
            }
            router.replace(data.redirectTo || '/dashboard');
        } catch {
            setError('Could not confirm password. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!ready) {
        return (
            <AuthShell title="Confirm your password…" accountType={accountType}>
                <p className="text-sm text-charcoal/60">Loading…</p>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Enter your password"
            subtitle="For your security, magic-link sign-in still requires your account password."
            accountType={accountType}
        >
            {email && (
                <p className="text-sm text-charcoal/55 mb-5">
                    Signed in as <span className="font-medium text-charcoal">{email}</span>
                </p>
            )}

            {error && (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="auth-label" htmlFor="confirm-pw">
                        Password
                    </label>
                    <div className="auth-input-wrap">
                        <KeyRound className="auth-input-icon" />
                        <input
                            id="confirm-pw"
                            className="auth-input pr-12"
                            required
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="auth-input-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary w-full">
                    {loading ? 'Checking…' : 'Continue'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-6">
                Forgot your password?{' '}
                <Link
                    href={`/auth/forgot-password?type=${accountType}`}
                    className="text-gold font-medium hover:underline"
                >
                    Reset it
                </Link>
            </p>
        </AuthShell>
    );
}

export default function ConfirmPasswordClient() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-cream text-charcoal/70 text-sm">
                    Loading…
                </div>
            }
        >
            <ConfirmPasswordInner />
        </Suspense>
    );
}
