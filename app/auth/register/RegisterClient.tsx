'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, User, Lock, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { getPasswordRequirementsText, validatePassword } from '@/lib/password';

export default function AuthRegisterPage() {
    const searchParams = useSearchParams();
    const accountType = searchParams.get('type') === 'agent' ? 'agent' : 'user';
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
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
                body: JSON.stringify({ fullName, email, password, type: accountType }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }
            window.location.href = `/verify-email?email=${encodeURIComponent(email)}&type=${accountType}`;
        } catch {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Create your account" subtitle="Secure registration with email verification" accountType={accountType}>
            {error && (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <label className="auth-label">Full name</label>
                <div className="auth-input-wrap mb-4">
                    <User className="auth-input-icon" />
                    <input className="auth-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap mb-4">
                    <Mail className="auth-input-icon" />
                    <input type="email" className="auth-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap mb-2">
                    <Lock className="auth-input-icon" />
                    <input type="password" className="auth-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <p className="text-xs text-charcoal/45 mb-6">{getPasswordRequirementsText()}</p>
                <button type="submit" disabled={loading} className="auth-btn-primary w-full mb-6">
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
            </form>
            <OAuthButtons accountType={accountType} />
            <p className="text-center text-sm text-charcoal/55 mt-6">
                Already have an account?{' '}
                <Link href={`/auth/login?type=${accountType}`} className="text-gold font-medium hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthShell>
    );
}
