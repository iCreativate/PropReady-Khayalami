'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, Lock, Mail, User } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import ExistingAccountNotice from '@/components/auth/ExistingAccountNotice';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { getPasswordRequirementsText, validatePassword } from '@/lib/password';
import { validateProfessionalWorkEmail } from '@/lib/professional-email';

export default function OriginatorRegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizationId, setOrganizationId] = useState<string>(BOND_ORIGINATORS[0]?.id || '');
    const [error, setError] = useState('');
    const [existingAccount, setExistingAccount] = useState<{
        message: string;
        loginPath: string;
        resetPasswordPath: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setExistingAccount(null);

        const emailError = validateProfessionalWorkEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        const pw = validatePassword(password);
        if (!pw.valid) {
            setError(pw.errors.join(', '));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    type: 'originator',
                    organizationId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409 || data.code === 'EMAIL_EXISTS') {
                    setExistingAccount({
                        message:
                            data.message ||
                            data.error ||
                            'An account with this email already exists. Please log in or reset your password.',
                        loginPath: data.loginPath || '/originators/login',
                        resetPasswordPath:
                            data.resetPasswordPath || '/auth/forgot-password?type=originator',
                    });
                    return;
                }
                setError(data.error || 'Registration failed');
                return;
            }
            window.location.href = `/verify-email?email=${encodeURIComponent(email)}&type=originator`;
        } catch {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProfessionalAuthShell
            role="originator"
            title="Register as originator staff"
            subtitle="Create a staff account with your organisation. PropReady assigns your staff number when your account is approved."
        >
            {existingAccount ? (
                <div className="mb-4">
                    <ExistingAccountNotice
                        message={existingAccount.message}
                        loginPath={existingAccount.loginPath}
                        resetPasswordPath={existingAccount.resetPasswordPath}
                    />
                </div>
            ) : null}
            {error ? (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

            <div className="rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] px-4 py-3 text-xs text-charcoal/55 mb-5 leading-relaxed">
                After email verification, a PropReady admin reviews your application. Your unique staff number is
                emailed to you on approval — use it with your organisation to sign in.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="auth-label">Full name</label>
                    <div className="auth-input-wrap">
                        <User className="auth-input-icon" />
                        <input
                            className="auth-input"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                </div>

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
                    <label className="auth-label">Work email</label>
                    <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            className="auth-input"
                            required
                            placeholder="you@yourcompany.co.za"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-charcoal/45 mt-1.5">
                        Company email only — Gmail and other free addresses are not accepted.
                    </p>
                </div>

                <div>
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrap mb-2">
                        <Lock className="auth-input-icon" />
                        <input
                            type="password"
                            className="auth-input"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-charcoal/45 mb-2">{getPasswordRequirementsText()}</p>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary w-full">
                    {loading ? 'Creating account…' : 'Create originator account'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-8">
                Already registered?{' '}
                <Link href="/originators/login" className="text-gold font-medium hover:underline">
                    Sign in
                </Link>
            </p>
            <p className="text-charcoal/45 text-xs text-center mt-4 leading-relaxed">
                Your registration is reviewed by PropReady before you can access buyer prequal cases.
            </p>
        </ProfessionalAuthShell>
    );
}
