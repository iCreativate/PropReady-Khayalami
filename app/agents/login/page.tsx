'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

export default function AgentLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const [storedOTP, setStoredOTP] = useState('');
    const [agentData, setAgentData] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (typeof window !== 'undefined') {
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const agent = agents.find((a: any) => 
                a.email === formData.email && a.password === formData.password
            );

            if (agent) {
                // Store agent data temporarily
                setAgentData(agent);
                
                // Send OTP
                try {
                    const response = await fetch('/api/send-otp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: formData.email, type: 'login' }),
                    });

                    const data = await response.json();
                    
                    // If OTP is returned (even if email sending failed), proceed with OTP verification
                    if (data.otp) {
                        setStoredOTP(data.otp);
                        setShowOTP(true);
                        if (!data.success) {
                            // Show warning if email sending failed but OTP is available
                            setError('Email sending failed, but you can use the OTP shown below for testing.');
                        }
                    } else if (data.success) {
                        // Email sent successfully but OTP not returned (shouldn't happen, but handle gracefully)
                        setShowOTP(true);
                        setError('OTP sent to your email. Please check your inbox.');
                    } else {
                        setError(data.error || 'Failed to send OTP. Please try again.');
                    }
                } catch (err) {
                    console.error('Error sending OTP:', err);
                    setError('Failed to send OTP. Please try again.');
                }
            } else {
                setError('Invalid email or password. Please try again.');
            }
        }
        setIsLoading(false);
    };

    const handleOTPSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // In production, verify OTP from server
        // For now, check against stored OTP (development only)
        if (storedOTP && otp === storedOTP) {
            if (typeof window !== 'undefined' && agentData) {
                // Store current agent session
                localStorage.setItem('propReady_currentAgent', JSON.stringify({
                    id: agentData.id,
                    fullName: agentData.fullName,
                    email: agentData.email,
                    company: agentData.company
                }));

                // Redirect to dashboard
                router.push('/agents/dashboard');
            }
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
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

            {/* Main Content */}
            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24">
                <div className="container mx-auto max-w-md relative z-10">
                    {/* Login Card */}
                    <div className="glass-effect rounded-2xl p-8 md:p-10 shadow-2xl">
                        {/* Badge */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                                <span className="text-gold font-semibold">Agent Portal</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-charcoal/80">
                                Sign in to access your agent dashboard
                            </p>
                        </div>

                        {!showOTP ? (
                            /* Email/Password Form */
                            <form onSubmit={handleEmailPasswordSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-lg">
                                        <p className="text-red-600 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </p>
                                    </div>
                                )}
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="agent-login-email" className="block text-charcoal font-semibold mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            id="agent-login-email"
                                            name="email"
                                            type="email"
                                            placeholder="agent@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={isLoading}
                                            autoComplete="email"
                                            className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label htmlFor="agent-login-password" className="block text-charcoal font-semibold mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            id="agent-login-password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            disabled={isLoading}
                                            autoComplete="current-password"
                                            className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
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

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <label htmlFor="agent-remember-me" className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            id="agent-remember-me"
                                            name="rememberMe"
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-gold focus:ring-gold"
                                        />
                                        <span className="text-charcoal/80 text-sm">Remember me</span>
                                    </label>
                                    <button type="button" className="text-gold hover:text-gold-600 text-sm font-semibold">
                                        Forgot Password?
                                    </button>
                                </div>

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? 'Sending OTP...' : 'Continue'}
                                </button>
                            </form>
                        ) : (
                            /* OTP Form */
                            <form onSubmit={handleOTPSubmit} className="space-y-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
                                        <Shield className="w-8 h-8 text-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal mb-2">Enter Verification Code</h3>
                                    <p className="text-charcoal/70 text-sm">
                                        We&apos;ve sent a 6-digit code to <strong>{formData.email}</strong>
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-lg">
                                        <p className="text-red-600 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* OTP Input */}
                                <div>
                                    <label htmlFor="agent-login-otp" className="block text-charcoal font-semibold mb-2 text-center">
                                        Enter OTP Code
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="agent-login-otp"
                                            name="otp"
                                            type="text"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(value);
                                            }}
                                            maxLength={6}
                                            required
                                            autoComplete="one-time-code"
                                            inputMode="numeric"
                                            className="w-full px-4 py-4 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                    <p className="text-charcoal/60 text-sm mt-2 text-center">
                                        Didn&apos;t receive the code?{' '}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setError('');
                                                try {
                                                    const response = await fetch('/api/send-otp', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ email: formData.email, type: 'login' }),
                                                    });
                                                    const data = await response.json();
                                                    if (data.success && data.otp) {
                                                        setStoredOTP(data.otp);
                                                    }
                                                } catch (err) {
                                                    setError('Failed to resend OTP');
                                                }
                                            }}
                                            className="text-gold hover:text-gold-600 font-semibold"
                                        >
                                            Resend
                                        </button>
                                    </p>
                                </div>

                                {/* Verify Button */}
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                                >
                                    Verify & Sign In
                                </button>

                                {/* Back Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOTP(false);
                                        setOtp('');
                                        setError('');
                                    }}
                                    className="w-full py-2 text-charcoal/70 hover:text-charcoal text-sm font-semibold"
                                >
                                    ← Back to email/password
                                </button>
                            </form>
                        )}

                        {/* Divider */}
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

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="text-charcoal/80 mb-4">
                                Join our network of verified agents
                            </p>
                            <Link
                                href="/agents/register"
                                className="block w-full py-3 border border-charcoal/30 text-charcoal font-semibold rounded-lg hover:bg-charcoal/10 transition-all"
                            >
                                Register as an Agent
                            </Link>
                        </div>

                        {/* Trust Badge */}
                        <div className="mt-8 pt-6 border-t border-charcoal/20">
                            <div className="flex items-center justify-center space-x-2 text-charcoal/70 text-sm">
                                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                                    <span className="text-gold text-xs font-bold">✓</span>
                                </div>
                                <span>EAAB Registered Agents Only</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-12 mb-6 text-center">
                        <p className="text-charcoal/60 text-sm">
                            By signing in, you agree to our{' '}
                            <button className="text-gold hover:text-gold-600 font-semibold">
                                Terms of Service
                            </button>{' '}
                            and{' '}
                            <button className="text-gold hover:text-gold-600 font-semibold">
                                Privacy Policy
                            </button>
                        </p>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
            </main>
        </div>
    );
}
