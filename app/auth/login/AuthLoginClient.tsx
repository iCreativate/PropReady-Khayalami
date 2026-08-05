'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import OAuthButtons from '@/components/auth/OAuthButtons';
import LoginOtpStep from '@/components/auth/LoginOtpStep';
import LoginRolePicker from '@/components/auth/LoginRolePicker';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { loginPathForAccountType, parseAccountType } from '@/lib/auth-enterprise/account-profile';
import {
    getLoginRoleOption,
    parseLoginAudience,
    parseLoginRole,
    persistLoginRole,
    PROFESSIONALS_LOGIN_HREF,
    readPersistedLoginRole,
    type LoginRole,
    type LoginRoleOption,
} from '@/lib/auth-login-roles';

type AuthMode = 'password' | 'magic';

export default function AuthLoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const audience = parseLoginAudience(searchParams.get('audience'));
    const isProfessionals = audience === 'professionals';
    const requestedType = parseAccountType(searchParams.get('type'));
    const requestedRole = parseLoginRole(searchParams.get('role'));
    const errorParam = searchParams.get('error');

    const [role, setRole] = useState<LoginRole | null>(null);
    const [mode, setMode] = useState<AuthMode>('password');
    const [email, setEmail] = useState('');
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
        if (isProfessionals) {
            setRole(null);
            if (requestedRole === 'agent' || requestedRole === 'originator' || requestedRole === 'conveyancer') {
                router.replace(loginPathForAccountType(requestedRole));
            }
            return;
        }
        if (
            requestedType === 'agent' ||
            requestedType === 'originator' ||
            requestedType === 'conveyancer'
        ) {
            router.replace(loginPathForAccountType(requestedType));
            return;
        }
        if (requestedRole === 'agent' || requestedRole === 'originator' || requestedRole === 'conveyancer') {
            router.replace(loginPathForAccountType(requestedRole));
            return;
        }
        if (requestedRole === 'buyer' || requestedRole === 'seller') {
            setRole(requestedRole);
            persistLoginRole(requestedRole);
            return;
        }
        const stored = readPersistedLoginRole();
        if (stored === 'buyer' || stored === 'seller') {
            setRole(stored);
        }
    }, [isProfessionals, requestedType, requestedRole, router]);

    if (
        !isProfessionals &&
        (requestedType === 'agent' ||
            requestedType === 'originator' ||
            requestedType === 'conveyancer' ||
            requestedRole === 'agent' ||
            requestedRole === 'originator' ||
            requestedRole === 'conveyancer')
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center text-charcoal/55 text-sm">
                Redirecting to professional sign-in…
            </div>
        );
    }

    if (
        isProfessionals &&
        (requestedRole === 'agent' ||
            requestedRole === 'originator' ||
            requestedRole === 'conveyancer')
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center text-charcoal/55 text-sm">
                Redirecting to professional sign-in…
            </div>
        );
    }

    function handleRoleSelect(option: LoginRoleOption) {
        persistLoginRole(option.id);
        if (option.href) {
            router.push(option.href);
            return;
        }
        setRole(option.id);
        setError('');
        setInfo('');
    }

    function clearRole() {
        setRole(null);
        setError('');
        setInfo('');
        setOtpChallenge(null);
        try {
            sessionStorage.removeItem('propReady_loginRole');
        } catch {
            /* ignore */
        }
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
                body: JSON.stringify({ email: email.trim(), type: 'user', rememberDevice }),
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

    const roleMeta = role ? getLoginRoleOption(role) : null;
    const postLoginRedirect =
        role === 'seller' ? '/sellers/dashboard' : '/dashboard';

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
                        const next =
                            data.redirectTo ||
                            `/auth/confirm-password?type=user&next=${encodeURIComponent(postLoginRedirect)}`;
                        window.location.assign(next);
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

    if (isProfessionals || !role) {
        return (
            <AuthShell
                title="Who’s signing in?"
                subtitle={
                    isProfessionals
                        ? 'Choose your professional role to continue to the right portal.'
                        : 'Choose buyer or seller to continue to your PropReady account.'
                }
                accountType="user"
                variant="roles"
                rolesAudience={audience}
            >
                <LoginRolePicker audience={audience} onSelect={handleRoleSelect} />
                {isProfessionals ? (
                    <p className="text-center text-sm text-charcoal/55 mt-8">
                        Buying or selling?{' '}
                        <Link href="/auth/login" className="text-gold font-medium hover:underline">
                            Buyer & seller sign-in
                        </Link>
                    </p>
                ) : (
                    <>
                        <p className="text-center text-sm text-charcoal/55 mt-8">
                            New here?{' '}
                            <Link href="/get-started" className="text-gold font-medium hover:underline">
                                Get started with a quiz
                            </Link>
                        </p>
                        <p className="text-center text-xs text-charcoal/40 mt-4 leading-relaxed">
                            Agent, bond originator or conveyancer?{' '}
                            <Link
                                href={PROFESSIONALS_LOGIN_HREF}
                                className="text-gold font-medium hover:underline"
                            >
                                Professional sign-in
                            </Link>
                        </p>
                    </>
                )}
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title={`Sign in as ${roleMeta?.label ?? 'Buyer'}`}
            subtitle={
                role === 'seller'
                    ? 'Access your seller dashboard, listings and messages'
                    : 'Access your buyer dashboard, prequal and learning'
            }
            accountType="user"
        >
            <button type="button" onClick={clearRole} className="auth-role-change mb-5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Change account type
            </button>

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
                        <span className="text-charcoal/45">Password is entered after the code.</span>
                    </div>
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
                Password sign-in sends a one-time code first, then asks for your password.
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
        </AuthShell>
    );
}
