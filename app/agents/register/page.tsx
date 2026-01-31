'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Mail, Lock, Eye, EyeOff, User, Phone, Building2, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface AgentRegistration {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    eaabNumber: string;
    company: string;
    password: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AgentRegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        eaabNumber: '',
        confirmFFCNumber: '',
        company: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid South African phone number';
        }

        const cleanedFFC = formData.eaabNumber.replace(/\D/g, '');
        const cleanedConfirm = formData.confirmFFCNumber.replace(/\D/g, '');
        if (!formData.eaabNumber.trim()) {
            newErrors.eaabNumber = 'A valid FFC number (Fidelity Fund Certificate) is required';
        } else if (cleanedFFC.length !== 7) {
            newErrors.eaabNumber = 'FFC number must be exactly 7 digits';
        } else if (/^0+$/.test(cleanedFFC)) {
            newErrors.eaabNumber = 'Enter your valid 7-digit PPRA FFC number (cannot be all zeros)';
        }
        if (!formData.confirmFFCNumber.trim()) {
            newErrors.confirmFFCNumber = 'Please confirm your FFC number';
        } else if (cleanedConfirm.length !== 7) {
            newErrors.confirmFFCNumber = 'FFC number must be exactly 7 digits';
        } else if (cleanedFFC !== cleanedConfirm) {
            newErrors.confirmFFCNumber = 'FFC numbers do not match. Please re-enter to confirm.';
        } else if (/^0+$/.test(cleanedConfirm)) {
            newErrors.confirmFFCNumber = 'Enter your valid 7-digit PPRA FFC number';
        }

        if (!formData.company.trim()) {
            newErrors.company = 'Company/Agency name is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Check if email already exists
        if (typeof window !== 'undefined') {
            const existingAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const emailExists = existingAgents.some((agent: AgentRegistration) => agent.email === formData.email);

            if (emailExists) {
                setErrors({ email: 'An account with this email already exists' });
                setIsSubmitting(false);
                return;
            }

            // Create agent registration
            const agent: AgentRegistration = {
                id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                eaabNumber: formData.eaabNumber.replace(/\D/g, ''),
                company: formData.company,
                password: formData.password, // In production, this should be hashed
                timestamp: new Date().toISOString(),
                status: 'pending' // Would be approved by admin in production
            };

            // Save to database via server API (uses server env vars)
            const registerRes = await fetch('/api/agents/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agent),
            });
            const registerJson = await registerRes.json().catch(() => ({}));

            if (registerRes.ok && registerJson.success) {
                existingAgents.push(agent);
                localStorage.setItem('propReady_agents', JSON.stringify(existingAgents));
            } else {
                const apiError = registerJson.error || registerRes.statusText;
                if (registerRes.status === 409) {
                    setErrors({ email: apiError });
                    setIsSubmitting(false);
                    return;
                }
                console.warn('Database save failed:', apiError);
                existingAgents.push(agent);
                localStorage.setItem('propReady_agents', JSON.stringify(existingAgents));
            }

            // Send welcome email
            try {
                await fetch('/api/send-welcome-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        fullName: formData.fullName
                    }),
                });
            } catch (err) {
                console.error('Error sending welcome email:', err);
                // Don't block registration if email fails
            }

            // Also store as logged in agent for demo purposes
            localStorage.setItem('propReady_currentAgent', JSON.stringify({
                id: agent.id,
                fullName: agent.fullName,
                email: agent.email,
                company: agent.company,
                plan: 'free'
            }));
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        
        // Redirect to dashboard
        router.push('/agents/dashboard');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let finalValue: string | boolean = type === 'checkbox' ? checked : value;
        // Restrict FFC fields to digits only
        if (name === 'eaabNumber' || name === 'confirmFFCNumber') {
            finalValue = (value as string).replace(/\D/g, '').slice(0, 7);
        }
        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                if (name === 'eaabNumber' || name === 'confirmFFCNumber') {
                    delete newErrors[name === 'eaabNumber' ? 'confirmFFCNumber' : 'eaabNumber'];
                }
                return newErrors;
            });
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link href="/agents/login" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Login</span>
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
            <main className="relative min-h-screen flex items-center justify-center px-4 py-24">
                <div className="container mx-auto max-w-2xl relative z-10">
                    {/* Registration Card */}
                    <div className="glass-effect rounded-2xl p-8 md:p-10 shadow-2xl">
                        {/* Badge */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                                <span className="text-gold font-semibold">Agent Registration</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">
                                Join Our Network
                            </h1>
                            <p className="text-charcoal/80">
                                Register as a verified PropReady agent — 100% free.
                            </p>
                            <p className="text-charcoal/60 text-sm mt-1">
                                Free: 3 leads. Upgrade to 10 leads (R120), 25 leads (R250), or unlimited (book a consultation).
                            </p>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Full Name <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="e.g., John Mthembu"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.fullName ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Email Address <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="agent@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.email ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Phone Number <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="082 123 4567"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.phone ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Valid FFC Number (Fidelity Fund Certificate) */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Valid FFC Number (Fidelity Fund Certificate) <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="eaabNumber"
                                        placeholder="e.g. 1234567 (7 digits only)"
                                        value={formData.eaabNumber}
                                        onChange={handleInputChange}
                                        maxLength={7}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        pattern="[0-9]{7}"
                                        title="Enter your 7-digit PPRA FFC number"
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.eaabNumber ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.eaabNumber && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.eaabNumber}
                                    </p>
                                )}
                                <p className="text-charcoal/60 text-sm mt-1">Enter your valid 7-digit PPRA Fidelity Fund Certificate number. You can verify your FFC at theppra.org.za</p>
                            </div>

                            {/* Confirm FFC Number */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Confirm FFC Number <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="confirmFFCNumber"
                                        placeholder="Re-enter your 7-digit FFC"
                                        value={formData.confirmFFCNumber}
                                        onChange={handleInputChange}
                                        maxLength={7}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        pattern="[0-9]{7}"
                                        title="Re-enter your 7-digit FFC number"
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.confirmFFCNumber ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.confirmFFCNumber && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.confirmFFCNumber}
                                    </p>
                                )}
                                <p className="text-charcoal/60 text-sm mt-1">Re-enter your FFC number to confirm it is correct</p>
                            </div>

                            {/* Company/Agency */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Company/Agency Name <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="company"
                                        placeholder="e.g., ABC Real Estate"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.company ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.company && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.company}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Password <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="At least 8 characters"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border ${errors.password ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Confirm Password <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Re-enter your password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border ${errors.confirmPassword ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Terms and Conditions */}
                            <div>
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleInputChange}
                                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-gold focus:ring-gold"
                                    />
                                    <span className="text-charcoal/80 text-sm">
                                        I agree to the{' '}
                                        <Link href="/terms" className="text-gold hover:text-gold-600 font-semibold">
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="/privacy" className="text-gold hover:text-gold-600 font-semibold">
                                            Privacy Policy
                                        </Link>
                                    </span>
                                </label>
                                {errors.agreeToTerms && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.agreeToTerms}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? 'Registering...' : 'Register as Agent'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-charcoal/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-charcoal/70">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <Link
                                href="/agents/login"
                                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-gradient-to-r from-gold/10 to-gold/5 border-2 border-gold/30 text-charcoal font-bold rounded-lg hover:from-gold/20 hover:to-gold/10 hover:border-gold/50 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 shadow-sm group"
                            >
                                <span>Sign In Instead</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Trust Badge */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="flex items-center justify-center space-x-2 text-charcoal/70 text-sm">
                                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-gold" />
                                </div>
                                <span>EAAB Registered Agents Only</span>
                            </div>
                            <p className="text-charcoal/60 text-xs text-center mt-2">
                                Your registration will be reviewed and approved by our team
                            </p>
                        </div>
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

