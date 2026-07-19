'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { syncLegacySession } from '@/lib/auth-session-bridge';

type AuthMode = 'password' | 'magic';

export default function AuthLoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountType = searchParams.get('type') === 'agent' ? 'agent' : 'user';
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

    const dashboard = accountType === 'agent' ? '/agents/dashboard' : '/dashboard';

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
                body: JSON.stringify({ email: email.trim(), password, type: accountType, rememberDevice }),
            });
            const data = await res.json();
            if (res.status === 403 && data.needsVerification) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}&type=${accountType}`);
                return;
            }
            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid email or password');
                return;
            }
            syncLegacySession(data.user, accountType);
            router.push(dashboard);
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
                body: JSON.stringify({ email: email.trim(), type: accountType }),
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

    return (
        <AuthShell
            title="Welcome back"
            subtitle={accountType === 'agent' ? 'Sign in to your agent portal' : 'Sign in to your PropReady account'}
            accountType={accountType}
        >
            <div className="auth-tabs mb-6">
                <button type="button" className={mode === 'password' ? 'auth-tab auth-tab-active' : 'auth-tab'} onClick={() => setMode('password')}>Password</button>
                <button type="button" className={mode === 'magic' ? 'auth-tab auth-tab-active' : 'auth-tab'} onClick={() => setMode('magic')}>
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Magic link
                </button>
            </div>
            {error && <div className="auth-alert auth-alert-error mb-4"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            {info && <div className="auth-alert auth-alert-info mb-4">{info}</div>}
            {devMagicLink && (
                <a
                    href={devMagicLink}
                    className="block mb-4 text-sm text-gold font-medium hover:underline break-all"
                >
                    Open magic link
                </a>
            )}
            <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap mb-4">
                    <Mail className="auth-input-icon" />
                    <input type="email" required autoComplete="email" className="auth-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {mode === 'password' && (
                    <>
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrap mb-4">
                            <Lock className="auth-input-icon" />
                            <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" className="auth-input pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="button" className="auth-input-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mb-6 text-sm">
                            <label className="flex items-center gap-2 text-charcoal/70 cursor-pointer">
                                <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="rounded border-charcoal/20 text-gold focus:ring-gold" />
                                Trust this device
                            </label>
                            <Link href={`/auth/forgot-password?type=${accountType}`} className="text-gold hover:underline">Forgot password?</Link>
                        </div>
                    </>
                )}
                <button type="submit" disabled={loading} className="auth-btn-primary w-full mb-6">
                    {loading ? 'Please wait…' : mode === 'password' ? 'Sign in securely' : 'Email me a link'}
                </button>
            </form>
            <div className="auth-divider mb-6"><span>or continue with</span></div>
            <OAuthButtons accountType={accountType} />
            <p className="text-center text-sm text-charcoal/55 mt-8">
                {accountType === 'agent' ? (
                    <>New agent? <Link href="/agents/register" className="text-gold font-medium hover:underline">Register</Link></>
                ) : (
                    <>New here? <Link href="/auth/register" className="text-gold font-medium hover:underline">Create account</Link></>
                )}
            </p>
        </AuthShell>
    );
}
