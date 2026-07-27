'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import OAuthButtons from '@/components/auth/OAuthButtons';
import LoginOtpStep from '@/components/auth/LoginOtpStep';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { loginPathForAccountType, parseAccountType } from '@/lib/auth-enterprise/account-profile';

type AuthMode = 'password' | 'magic';

export default function AuthLoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedType = parseAccountType(searchParams.get('type'));
    const errorParam = searchParams.get('error');

    const [mode, setMode] = useState<AuthMode>('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState(
        errorParam === 'oauth_failed'
            ? 'Google sign-in failed. Please try again or use email instead.'
            : errorParam === 'oauth_state'
              ? 'Sign-in was interrupted. Please try again.'
              : errorParam
                ? 'Authentication error. Please try again.'
                : ''
    );
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [devMagicLink, setDevMagicLink] = useState('');
    const [otpChallenge, setOtpChallenge] = useState<{
        token: string;
        email: string;
        devOtp?: string;
    } | null>(null);

    useEffect(() => {
        if (requestedType === 'agent' || requestedType === 'originator') {
            router.replace(loginPathForAccountType(requestedType));
        }
    }, [requestedType, router]);

    if (requestedType === 'agent' || requestedType === 'originator') {
        return (
            <div className="min-h-screen flex items-center justify-center text-charcoal/55 text-sm">
                Redirecting to professional sign-in…
            </div>
        );
    }

    async function handlePasswordLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setInfo('');
        setDevMagicLink('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email.trim(), password, type: 'user', rememberDevice }),
            });
            const data = await res.json();
            if (res.status === 403 && data.needsVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}&type=user`);
                return;
            }
            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid email or password');
                return;
            }
            if (data.needsOtp && data.challengeToken) {
                setOtpChallenge({
                    token: data.challengeToken,
                    email: data.email || email.trim(),
                    devOtp: data.devOtp,
                });
                setInfo(data.message || 'Check your email for a login code.');
                return;
            }
            setError('Unexpected login response. Please try again.');
        } catch {
            setError('Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setInfo('');
        setDevMagicLink('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), type: 'user' }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not send magic link');
                return;
            }
            if (data.link) {
                setInfo('Magic link ready (local testing). Click the link below to sign in.');
                setDevMagicLink(data.link as string);
            } else {
                setInfo('Check your email for a secure sign-in link (expires in 15 minutes).');
                setDevMagicLink('');
            }
        } catch {
            setError('Could not send magic link.');
        } finally {
            setLoading(false);
        }
    }

    if (otpChallenge) {
        return (
            <AuthShell
                title="Enter login code"
                subtitle="We emailed a one-time code to confirm it’s you"
                accountType="user"
            >
                <LoginOtpStep
                    email={otpChallenge.email}
                    challengeToken={otpChallenge.token}
                    initialDevOtp={otpChallenge.devOtp}
                    onChallengeTokenChange={(token) =>
                        setOtpChallenge((prev) => (prev ? { ...prev, token } : prev))
                    }
                    onVerified={(data) => {
                        syncLegacySession(data.user as Parameters<typeof syncLegacySession>[0], 'user');
                        window.location.assign('/auth/complete?type=user');
                    }}
                    onBack={() => {
                        setOtpChallenge(null);
                        setInfo('');
                        setError('');
                    }}
                    onExpired={() => {
                        setOtpChallenge(null);
                        setError('Your login code expired. Please sign in again.');
                    }}
                />
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Welcome back" subtitle="Sign in to your PropReady account" accountType="user">
            <div className="auth-tabs mb-6">
                <button
                    type="button"
                    className={mode === 'password' ? 'auth-tab auth-tab-active' : 'auth-tab'}
                    onClick={() => setMode('password')}
                >
                    Password
                </button>
                <button
                    type="button"
                    className={mode === 'magic' ? 'auth-tab auth-tab-active' : 'auth-tab'}
                    onClick={() => setMode('magic')}
                >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Magic link
                </button>
            </div>
            {error && (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
            {info && <div className="auth-alert auth-alert-info mb-4">{info}</div>}
            {devMagicLink && (
                <a href={devMagicLink} className="block mb-4 text-sm text-gold font-medium hover:underline break-all">
                    Open magic link
                </a>
            )}
            <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap mb-4">
                    <Mail className="auth-input-icon" />
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        className="auth-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {mode === 'password' && (
                    <>
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrap mb-4">
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
                        <div className="flex items-center justify-between mb-6 text-sm">
                            <label className="flex items-center gap-2 text-charcoal/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberDevice}
                                    onChange={(e) => setRememberDevice(e.target.checked)}
                                    className="rounded border-charcoal/20 text-gold focus:ring-gold"
                                />
                                Trust this device
                            </label>
                            <Link href="/auth/forgot-password" className="text-gold hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </>
                )}
                <button type="submit" disabled={loading} className="auth-btn-primary w-full mb-6">
                    {loading
                        ? 'Please wait…'
                        : mode === 'password'
                          ? 'Continue'
                          : 'Email me a link'}
                </button>
            </form>
            <p className="text-center text-xs text-charcoal/45 mb-6">
                Password sign-in sends a one-time code to your email for security.
            </p>
            <div className="auth-divider mb-6">
                <span>or continue with</span>
            </div>
            <OAuthButtons accountType="user" />
            <p className="text-center text-sm text-charcoal/55 mt-8">
                New here?{' '}
                <Link href="/get-started" className="text-gold font-medium hover:underline">
                    Get started with a quiz
                </Link>
            </p>
            <p className="text-center text-xs text-charcoal/40 mt-4 space-x-3">
                <Link href="/agents/login" className="hover:text-gold transition">
                    Agent portal
                </Link>
                <span aria-hidden>·</span>
                <Link href="/originators/login" className="hover:text-gold transition">
                    Bond originator portal
                </Link>
            </p>
        </AuthShell>
    );
}
