'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Mail, Lock, Eye, EyeOff, User, Phone, Building2, FileText, CheckCircle, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { validatePassword, formatPasswordErrors, getPasswordRequirementsText } from '@/lib/password';
import {
    validatePpraNumber,
    validateFfcNumber,
    normalizePpraNumber,
    normalizeFfcNumber,
    PPRA_NUMBER_ERROR,
    FFC_NUMBER_ERROR,
    FFC_DOCUMENT_MAX_BYTES,
} from '@/lib/ppra';
import { PRICING_SUMMARY } from '@/lib/agent-plans';

interface AgentRegistration {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    eaabNumber: string;
    ppraNumber: string;
    ffcNumber?: string;
    ffcDocumentUrl?: string;
    verificationStatus?: string;
    company: string;
    city?: string;
    password: string;
    emailVerified?: boolean;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AgentRegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ffcFile, setFfcFile] = useState<File | null>(null);
    const [registerStep, setRegisterStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        ppraNumber: '',
        ffcNumber: '',
        company: '',
        city: '',
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

        if (!validatePpraNumber(formData.ppraNumber)) {
            newErrors.ppraNumber = PPRA_NUMBER_ERROR;
        }
        if (formData.ffcNumber.trim() && !validateFfcNumber(formData.ffcNumber)) {
            newErrors.ffcNumber = FFC_NUMBER_ERROR;
        }
        if (!ffcFile) {
            newErrors.ffcFile = 'Upload your Fidelity Fund Certificate (PDF, JPG, or PNG)';
        } else if (ffcFile.size > FFC_DOCUMENT_MAX_BYTES) {
            newErrors.ffcFile = 'File must be 10MB or smaller';
        }

        if (!formData.company.trim()) {
            newErrors.company = 'Company/Agency name is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const pw = validatePassword(formData.password);
            if (!pw.valid) newErrors.password = formatPasswordErrors(pw);
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

            const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const ppra = normalizePpraNumber(formData.ppraNumber);

            let ffcDocumentUrl: string | undefined;
            if (ffcFile) {
                const fd = new FormData();
                fd.append('file', ffcFile);
                fd.append('agentId', agentId);
                const upRes = await fetch('/api/agents/ppra/upload', { method: 'POST', body: fd });
                const upJson = await upRes.json().catch(() => ({}));
                if (!upRes.ok || !upJson.storagePath) {
                    setErrors({ ffcFile: upJson.error || 'Could not upload FFC document' });
                    setIsSubmitting(false);
                    return;
                }
                ffcDocumentUrl = upJson.storagePath;
            }

            const agent: AgentRegistration = {
                id: agentId,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                eaabNumber: ppra,
                ppraNumber: ppra,
                ffcNumber: formData.ffcNumber.trim() ? normalizeFfcNumber(formData.ffcNumber) : undefined,
                ffcDocumentUrl,
                verificationStatus: 'pending',
                company: formData.company,
                city: formData.city?.trim() || undefined,
                password: formData.password,
                emailVerified: false,
                timestamp: new Date().toISOString(),
                status: 'pending',
            };

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

            try {
                await fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        accountType: 'agent',
                        fullName: formData.fullName,
                    }),
                });
            } catch (err) {
                console.error('Error sending verification email:', err);
            }
        }

        setIsSubmitting(false);
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&type=agent`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let finalValue: string | boolean = type === 'checkbox' ? checked : value;
        // Restrict FFC fields to digits only
        if (name === 'ppraNumber') {
            finalValue = (value as string).replace(/\D/g, '').slice(0, 7);
        }
        if (name === 'ffcNumber') {
            finalValue = (value as string).replace(/\D/g, '').slice(0, 15);
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
                if (name === 'ppraNumber' || name === 'ffcNumber') {
                    delete newErrors.ppraNumber;
                    delete newErrors.ffcNumber;
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
                                {PRICING_SUMMARY}
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

                            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 mb-2">
                                <p className="text-sm font-semibold text-charcoal mb-3">PPRA verification (required)</p>
                                <div className="flex gap-2 flex-wrap text-xs mb-4">
                                    {['Details', 'PPRA & FFC', 'Submit'].map((label, i) => (
                                        <span
                                            key={label}
                                            className={`px-3 py-1 rounded-full ${
                                                registerStep >= i + 1 ? 'bg-gold text-white' : 'bg-white text-charcoal/50 border border-charcoal/20'
                                            }`}
                                        >
                                            {i + 1}. {label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    PPRA Practitioner Number <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="ppraNumber"
                                        placeholder="7-digit practitioner number"
                                        value={formData.ppraNumber}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            setRegisterStep(2);
                                        }}
                                        maxLength={7}
                                        inputMode="numeric"
                                        className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.ppraNumber ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.ppraNumber && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.ppraNumber}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    FFC Certificate Number{' '}
                                    <span className="text-charcoal/50 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="ffcNumber"
                                    placeholder="15 digits starting with 20"
                                    value={formData.ffcNumber}
                                    onChange={handleInputChange}
                                    maxLength={15}
                                    inputMode="numeric"
                                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.ffcNumber ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal font-mono`}
                                />
                                {errors.ffcNumber && (
                                    <p className="text-red-600 text-sm mt-1">{errors.ffcNumber}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Upload Fidelity Fund Certificate <span className="text-red-600">*</span>
                                </label>
                                <p className="text-charcoal/60 text-sm mb-2">PDF, JPG, JPEG or PNG — max 10MB. Stored securely.</p>
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gold/40 rounded-xl cursor-pointer hover:bg-gold/5">
                                    <span className="text-sm text-charcoal/70">
                                        {ffcFile ? ffcFile.name : 'Click to upload'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) => {
                                            setFfcFile(e.target.files?.[0] || null);
                                            setRegisterStep(2);
                                        }}
                                    />
                                </label>
                                {errors.ffcFile && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.ffcFile}
                                    </p>
                                )}
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

                            {/* City / Service Area */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    City or service area
                                </label>
                                <p className="text-charcoal/60 text-sm mb-2">Leads near you will be prioritized. Optional.</p>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="e.g., Johannesburg, Sandton, Cape Town"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
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
                                <p className="text-charcoal/50 text-xs mt-1">{getPasswordRequirementsText()}</p>
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

