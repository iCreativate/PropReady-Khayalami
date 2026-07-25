'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, User, Lock, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';
import { getPasswordRequirementsText, validatePassword } from '@/lib/password';

export default function AuthRegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedType = parseAccountType(searchParams.get('type'));
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (requestedType === 'agent') router.replace('/agents/register');
        if (requestedType === 'originator') router.replace('/originators/register');
    }, [requestedType, router]);

    if (requestedType === 'agent' || requestedType === 'originator') {
        return (
            <div className="min-h-screen flex items-center justify-center text-charcoal/55 text-sm">
                Redirecting to professional registration…
            </div>
        );
    }

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
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    type: 'user',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }
            window.location.href = `/verify-email?email=${encodeURIComponent(email)}&type=user`;
        } catch {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Create your account" subtitle="Secure registration with email verification" accountType="user">
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
                    <input
                        type="email"
                        className="auth-input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
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
                <p className="text-xs text-charcoal/45 mb-6">{getPasswordRequirementsText()}</p>
                <button type="submit" disabled={loading} className="auth-btn-primary w-full mb-6">
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
            </form>
            <OAuthButtons accountType="user" />
            <p className="text-center text-sm text-charcoal/55 mt-6">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-gold font-medium hover:underline">
                    Sign in
                </Link>
            </p>
            <p className="text-center text-xs text-charcoal/40 mt-4 space-x-3">
                <Link href="/agents/register" className="hover:text-gold transition">
                    Agent registration
                </Link>
                <span aria-hidden>·</span>
                <Link href="/originators/register" className="hover:text-gold transition">
                    Originator registration
                </Link>
            </p>
        </AuthShell>
    );
}
