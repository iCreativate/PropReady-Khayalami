'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import {
    getCurrentUser,
    getRememberedUserEmail,
    setRememberedUserEmail,
} from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        if (getCurrentUser()) {
            router.replace('/dashboard');
            return;
        }
        const remembered = getRememberedUserEmail();
        if (remembered) {
            setFormData((prev) => ({ ...prev, email: remembered }));
            setRememberMe(true);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setRememberedUserEmail(formData.email.trim(), rememberMe);

        try {
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password, type: 'user' }),
            });
            const loginJson = await loginRes.json().catch(() => ({}));

            let authenticatedUser = null;

            if (loginRes.status === 403 && loginJson.needsVerification) {
                router.push(
                    `/verify-email?email=${encodeURIComponent(formData.email)}&type=user`
                );
                return;
            }

            if (loginRes.ok && loginJson.success && loginJson.user) {
                authenticatedUser = {
                    id: loginJson.user.id,
                    fullName: loginJson.user.fullName,
                    email: loginJson.user.email,
                };
            }

            if (!authenticatedUser && typeof window !== 'undefined') {
                const users = JSON.parse(localStorage.getItem('propReady_users') || '[]');
                const localUser = users.find(
                    (u: { email: string; password: string }) =>
                        u.email === formData.email && u.password === formData.password
                );
                if (localUser) {
                    if (localUser.emailVerified === false) {
                        router.push(
                            `/verify-email?email=${encodeURIComponent(formData.email)}&type=user`
                        );
                        return;
                    }
                    authenticatedUser = {
                        id: localUser.id,
                        fullName: localUser.fullName,
                        email: localUser.email,
                    };
                }
            }

            if (authenticatedUser) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('propReady_currentUser', JSON.stringify(authenticatedUser));
                }
                router.push('/dashboard');
            } else {
                setError('Invalid email or password. Please try again.');
            }
        } catch {
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>
                </nav>
            </header>

            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24">
                <div className="container mx-auto max-w-md relative z-10">
                    <div className="glass-effect rounded-2xl p-8 md:p-10 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                                <span className="text-gold font-semibold">Buyer Portal</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">Welcome Back</h1>
                            <p className="text-charcoal/80">Sign in to access your dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-lg">
                                    <p className="text-red-600 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="login-email" className="block text-charcoal font-semibold mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        autoComplete="email"
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="login-password" className="block text-charcoal font-semibold mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label htmlFor="remember-me" className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        id="remember-me"
                                        name="rememberMe"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-charcoal/20 bg-white/10 text-gold focus:ring-gold"
                                    />
                                    <span className="text-charcoal/80 text-sm">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-gold hover:text-gold-600 text-sm font-semibold"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-charcoal/20"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-6 py-2 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30 rounded-full text-gold font-semibold text-sm shadow-sm">
                                    New to PropReady?
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-charcoal/80 mb-4">Complete the quiz to create your account</p>
                            <Link
                                href="/quiz"
                                className="block w-full py-3 border border-charcoal/30 text-charcoal font-semibold rounded-lg hover:bg-charcoal/10 transition-all"
                            >
                                Take the Quiz
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 mb-6 text-center">
                        <p className="text-charcoal/60 text-sm">
                            By signing in, you agree to our{' '}
                            <Link href="/terms" className="text-gold hover:text-gold-600 font-semibold">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-gold hover:text-gold-600 font-semibold">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float"></div>
                    <div
                        className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float"
                        style={{ animationDelay: '2s' }}
                    ></div>
                </div>
            </main>

            <ForgotPasswordModal
                open={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
                portalLabel="buyer account"
            />
        </div>
    );
}
