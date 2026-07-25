'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import {
    loginPathForAccountType,
    parseAccountType,
} from '@/lib/auth-enterprise/account-profile';

export default function ForgotPasswordClient() {
    const searchParams = useSearchParams();
    const accountType = parseAccountType(searchParams.get('type'));
    const [email, setEmail] = useState('');
    const [info, setInfo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: accountType }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Request failed');
                return;
            }
            setInfo(data.message);
        } catch {
            setError('Request failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Reset password" subtitle="We'll email you a secure reset link" accountType={accountType}>
            {error && (
                <div className="auth-alert auth-alert-error mb-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
            {info && <div className="auth-alert auth-alert-info mb-4">{info}</div>}
            <form onSubmit={handleSubmit}>
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap mb-6">
                    <Mail className="auth-input-icon" />
                    <input
                        type="email"
                        required
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={loading} className="auth-btn-primary w-full mb-4">
                    {loading ? 'Sending…' : 'Send reset link'}
                </button>
            </form>
            <p className="text-center text-sm">
                <Link href={loginPathForAccountType(accountType)} className="text-gold hover:underline">
                    Back to sign in
                </Link>
            </p>
        </AuthShell>
    );
}
