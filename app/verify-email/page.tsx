'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';
    const typeParam = parseAccountType(searchParams.get('type'));
    const emailErrorParam = searchParams.get('emailError') || '';

    const [email, setEmail] = useState(emailParam);
    const [code, setCode] = useState('');
    const [error, setError] = useState(emailErrorParam);
    const [success, setSuccess] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const loginPath =
        typeParam === 'agent'
            ? '/agents/login'
            : typeParam === 'originator'
              ? '/originators/login'
              : '/auth/login';

    const markLocalVerified = () => {
        if (typeof window === 'undefined' || !email) return;
        if (typeParam === 'agent') {
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const updated = agents.map((a: { email: string; emailVerified?: boolean }) =>
                a.email?.toLowerCase() === email.toLowerCase()
                    ? { ...a, emailVerified: true }
                    : a
            );
            localStorage.setItem('propReady_agents', JSON.stringify(updated));
        } else {
            const users = JSON.parse(localStorage.getItem('propReady_users') || '[]');
            const updated = users.map((u: { email: string; emailVerified?: boolean }) =>
                u.email?.toLowerCase() === email.toLowerCase()
                    ? { ...u, emailVerified: true }
                    : u
            );
            localStorage.setItem('propReady_users', JSON.stringify(updated));
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsVerifying(true);

        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, accountType: typeParam }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Verification failed');
                return;
            }

            markLocalVerified();
            setSuccess(true);
            setTimeout(() => router.push(loginPath), 2500);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setResendMessage('');
        setError('');
        if (!email) {
            setError('Enter your email address first.');
            return;
        }
        setIsResending(true);
        try {
            const res = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, accountType: typeParam }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResendMessage('A new code has been sent to your email.');
            } else {
                setError(data.error || 'Could not resend code');
            }
        } catch {
            setError('Could not resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-24">
            <div className="w-full max-w-md">
                <Link
                    href={loginPath}
                    className="inline-flex items-center gap-2 text-charcoal/70 hover:text-charcoal mb-8 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-7 h-7 text-gold" />
                        </div>
                        <h1 className="text-2xl font-bold text-charcoal mb-2">Verify your email</h1>
                        <p className="text-charcoal/70 text-sm">
                            We sent a 6-digit code to your inbox. Enter it below to activate your account.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center py-4">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <p className="text-charcoal font-semibold mb-2">Email verified!</p>
                            <p className="text-charcoal/70 text-sm">Redirecting you to sign in…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-5">
                            {error && (
                                <p className="text-red-600 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </p>
                            )}
                            {resendMessage && (
                                <p className="text-green-700 text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    {resendMessage}
                                </p>
                            )}

                            <div>
                                <label htmlFor="verify-email" className="block text-charcoal font-semibold mb-2 text-sm">
                                    Email
                                </label>
                                <input
                                    id="verify-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-charcoal/20 form-control"
                                />
                            </div>

                            <div>
                                <label htmlFor="verify-code" className="block text-charcoal font-semibold mb-2 text-sm">
                                    Verification code
                                </label>
                                <input
                                    id="verify-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    placeholder="000000"
                                    className="w-full px-4 py-3 rounded-lg border border-charcoal/20 text-center text-2xl tracking-[0.5em] font-mono form-control"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isVerifying || code.length !== 6}
                                className="w-full py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transition disabled:opacity-50"
                            >
                                {isVerifying ? 'Verifying…' : 'Verify email'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={isResending}
                                className="w-full py-2 text-gold font-semibold text-sm hover:underline disabled:opacity-50"
                            >
                                {isResending ? 'Sending…' : 'Resend code'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <VerifyEmailForm />
        </Suspense>
    );
}
