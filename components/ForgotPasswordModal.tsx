'use client';

import { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
    open: boolean;
    onClose: () => void;
    portalLabel?: string;
}

export default function ForgotPasswordModal({
    open,
    onClose,
    portalLabel = 'account',
}: ForgotPasswordModalProps) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }
        setSubmitted(true);
    };

    const handleClose = () => {
        setEmail('');
        setSubmitted(false);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {submitted ? (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-7 h-7 text-gold" />
                        </div>
                        <h2 className="text-xl font-bold text-charcoal mb-2">Check your email</h2>
                        <p className="text-charcoal/70 text-sm mb-6">
                            If an account exists for <strong>{email}</strong>, password reset instructions
                            will be sent. Email delivery requires backend integration (Resend API key).
                        </p>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-charcoal mb-2">Reset password</h2>
                        <p className="text-charcoal/70 text-sm mb-6">
                            Enter the email linked to your {portalLabel}. We&apos;ll send reset instructions when
                            email service is configured.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <p className="text-red-600 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </p>
                            )}
                            <div>
                                <label htmlFor="reset-email" className="block text-charcoal font-semibold mb-2 text-sm">
                                    Email
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-charcoal/20 form-control"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                Send reset link
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
