'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertCircle,
    Building2,
    Eye,
    EyeOff,
    Home,
    KeyRound,
    Phone,
    Search,
    User,
} from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import {
    dashboardPathForAccountType,
    loginPathForAccountType,
    parseAccountType,
} from '@/lib/auth-enterprise/account-profile';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { getPasswordRequirementsText, validatePassword } from '@/lib/password';

function CompleteProfileInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountType = parseAccountType(searchParams.get('type'));

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [organizationId, setOrganizationId] = useState(BOND_ORIGINATORS[0]?.id || '');
    const [eaabNumber, setEaabNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [intent, setIntent] = useState<'buyer' | 'seller' | ''>('');
    const [email, setEmail] = useState('');
    const [needsPassword, setNeedsPassword] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                if (!res.ok) {
                    router.replace(loginPathForAccountType(accountType));
                    return;
                }
                const data = await res.json();
                if (cancelled) return;

                const user = data.user;
                if (
                    user?.profileComplete &&
                    user?.passwordOk !== false &&
                    user?.hasPassword
                ) {
                    router.replace(dashboardPathForAccountType(user.accountType));
                    return;
                }

                // Returning users with a password but passwordOk false → confirm first
                if (user?.hasPassword && user?.passwordOk === false) {
                    router.replace(
                        accountType === 'agent'
                            ? '/auth/confirm-password?type=agent'
                            : accountType === 'originator'
                              ? '/auth/confirm-password?type=originator'
                              : '/auth/confirm-password'
                    );
                    return;
                }

                setEmail(user?.email || '');
                setFullName(
                    user?.fullName && !String(user.fullName).includes('@')
                        ? user.fullName
                        : ''
                );
                setPhone(user?.phone || '');
                setCompany(user?.company || '');
                if (user?.organizationId) setOrganizationId(user.organizationId);
                setNeedsPassword(!user?.hasPassword);
                setReady(true);
            } catch {
                if (!cancelled) router.replace(loginPathForAccountType(accountType));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accountType, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (needsPassword) {
            const pw = validatePassword(password);
            if (!pw.valid) {
                setError(`Password must include: ${pw.errors.join(', ')}`);
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (accountType === 'user' && !intent) {
                setError('Please choose whether you are buying or selling');
                return;
            }
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    fullName,
                    phone,
                    company: accountType === 'agent' ? company : undefined,
                    organizationId: accountType === 'originator' ? organizationId : undefined,
                    eaabNumber: accountType === 'agent' ? eaabNumber : undefined,
                    password: needsPassword ? password : undefined,
                    intent: needsPassword && accountType === 'user' ? intent : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not save your details');
                return;
            }
            if (data.user) {
                syncLegacySession(
                    {
                        id: data.user.id,
                        fullName: data.user.fullName,
                        email: data.user.email,
                        company: data.user.company,
                        organizationId: data.user.organizationId,
                        accountType: data.user.accountType,
                    },
                    data.user.accountType
                );
            }
            router.replace(data.redirectTo || dashboardPathForAccountType(accountType));
        } catch {
            setError('Could not save your details. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!ready) {
        return (
            <AuthShell title="Setting up your account…" accountType={accountType}>
                <p className="text-sm text-charcoal/60">Loading…</p>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title={needsPassword ? 'Finish creating your account' : 'Confirm your identity'}
            subtitle={
                needsPassword
                    ? 'Create a password, confirm who you are, then choose buyer or seller. Your dashboard will open with a short required form.'
                    : 'We need your real details before you can access the portal.'
            }
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
                    <label className="auth-label" htmlFor="cp-full-name">
                        Full legal name
                    </label>
                    <div className="auth-input-wrap">
                        <User className="auth-input-icon" />
                        <input
                            id="cp-full-name"
                            className="auth-input"
                            required
                            autoComplete="name"
                            placeholder="e.g. Thabo Molefe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="auth-label" htmlFor="cp-phone">
                        Mobile number
                    </label>
                    <div className="auth-input-wrap">
                        <Phone className="auth-input-icon" />
                        <input
                            id="cp-phone"
                            className="auth-input"
                            required
                            type="tel"
                            autoComplete="tel"
                            placeholder="e.g. 082 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>

                {accountType === 'agent' && (
                    <>
                        <div>
                            <label className="auth-label" htmlFor="cp-company">
                                Agency / company
                            </label>
                            <div className="auth-input-wrap">
                                <Building2 className="auth-input-icon" />
                                <input
                                    id="cp-company"
                                    className="auth-input"
                                    required
                                    autoComplete="organization"
                                    placeholder="Your agency name"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="auth-label" htmlFor="cp-eaab">
                                EAAB / PPRA number (optional)
                            </label>
                            <input
                                id="cp-eaab"
                                className="auth-input !pl-4"
                                autoComplete="off"
                                placeholder="If you have one"
                                value={eaabNumber}
                                onChange={(e) => setEaabNumber(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {accountType === 'originator' && (
                    <div>
                        <label className="auth-label" htmlFor="cp-org">
                            Bond originator organisation
                        </label>
                        <div className="auth-input-wrap">
                            <Building2 className="auth-input-icon" />
                            <select
                                id="cp-org"
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
                )}

                {needsPassword && (
                    <>
                        <div>
                            <label className="auth-label" htmlFor="cp-password">
                                Create password
                            </label>
                            <div className="auth-input-wrap">
                                <KeyRound className="auth-input-icon" />
                                <input
                                    id="cp-password"
                                    className="auth-input pr-12"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
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
                            <p className="mt-1.5 text-xs text-charcoal/45">
                                {getPasswordRequirementsText()}
                            </p>
                        </div>
                        <div>
                            <label className="auth-label" htmlFor="cp-confirm">
                                Confirm password
                            </label>
                            <div className="auth-input-wrap">
                                <KeyRound className="auth-input-icon" />
                                <input
                                    id="cp-confirm"
                                    className="auth-input"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {accountType === 'user' && (
                            <div>
                                <p className="auth-label mb-2">I want to</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIntent('buyer')}
                                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                                            intent === 'buyer'
                                                ? 'border-gold bg-gold/5 shadow-sm'
                                                : 'border-charcoal/10 hover:border-charcoal/20'
                                        }`}
                                    >
                                        <Search className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                                        <span>
                                            <span className="block text-sm font-semibold text-charcoal">
                                                Buy a property
                                            </span>
                                            <span className="block text-xs text-charcoal/55 mt-1">
                                                Start pre-qualification
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIntent('seller')}
                                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                                            intent === 'seller'
                                                ? 'border-gold bg-gold/5 shadow-sm'
                                                : 'border-charcoal/10 hover:border-charcoal/20'
                                        }`}
                                    >
                                        <Home className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                                        <span>
                                            <span className="block text-sm font-semibold text-charcoal">
                                                Sell a property
                                            </span>
                                            <span className="block text-xs text-charcoal/55 mt-1">
                                                Add your property details
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button type="submit" disabled={loading} className="auth-btn-primary w-full mt-2">
                    {loading
                        ? 'Saving…'
                        : needsPassword && intent === 'seller'
                          ? 'Continue to seller dashboard'
                          : needsPassword && intent === 'buyer'
                            ? 'Continue to buyer dashboard'
                            : 'Continue'}
                </button>
            </form>
        </AuthShell>
    );
}

export default function CompleteProfileClient() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-cream text-charcoal/70 text-sm">
                    Loading…
                </div>
            }
        >
            <CompleteProfileInner />
        </Suspense>
    );
}
