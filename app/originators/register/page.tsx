'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, Hash, Lock, Mail, User } from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { getPasswordRequirementsText, validatePassword } from '@/lib/password';

export default function OriginatorRegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizationId, setOrganizationId] = useState(BOND_ORIGINATORS[0]?.id || '');
    const [staffNumber, setStaffNumber] = useState('');
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
                    staffNumber: staff,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
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
            subtitle="Create a staff account with your organisation and official staff number."
        >
            {error ? (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

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
                    <label className="auth-label">Originator staff number</label>
                    <div className="auth-input-wrap">
                        <Hash className="auth-input-icon" />
                        <input
                            className="auth-input font-mono uppercase"
                            required
                            autoComplete="off"
                            placeholder="Issued by your organisation"
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
                            className="auth-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
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
        </ProfessionalAuthShell>
    );
}
