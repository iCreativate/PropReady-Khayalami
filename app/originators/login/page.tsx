'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, Eye, EyeOff, Hash, Lock, Mail } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import { syncLegacySession } from '@/lib/auth-session-bridge';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';

export default function OriginatorLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [organizationId, setOrganizationId] = useState(BOND_ORIGINATORS[0]?.id || '');
    const [staffNumber, setStaffNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                    password,
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
            syncLegacySession(data.user, 'originator');
            router.push('/originators/dashboard');
        } catch {
            setError('Unable to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProfessionalAuthShell
            role="originator"
            title="Bond originator sign-in"
            subtitle="Staff login requires your organisation and originator staff number."
        >
            {error ? (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

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
                    <Link href="/auth/forgot-password?type=originator" className="text-gold hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary w-full mt-2">
                    {loading ? 'Signing in…' : 'Sign in to originator portal'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-8">
                New staff member?{' '}
                <Link href="/originators/register" className="text-gold font-medium hover:underline">
                    Register with staff number
                </Link>
            </p>
        </ProfessionalAuthShell>
    );
}
