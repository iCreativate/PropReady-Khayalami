'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    Phone,
    Building2,
    FileText,
    CheckCircle,
    AlertCircle,
    MapPin,
} from 'lucide-react';
import ProfessionalAuthShell from '@/components/auth/ProfessionalAuthShell';
import ExistingAccountNotice from '@/components/auth/ExistingAccountNotice';
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
import { validateProfessionalWorkEmail } from '@/lib/professional-email';
import { BUYER_PLANS, PRICING_SUMMARY, type BuyerPlan } from '@/lib/agent-plans';

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
    plan?: string;
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
    const [existingAccount, setExistingAccount] = useState<{
        message: string;
        loginPath: string;
        resetPasswordPath: string;
    } | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        ppraNumber: '',
        ffcNumber: '',
        company: '',
        city: '',
        registrationRole: '' as '' | 'agent' | 'principal',
        plan: '' as '' | BuyerPlan,
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.registrationRole) {
            newErrors.registrationRole = 'Select whether you are registering as an agent or a principal';
        }

        if (!formData.plan) {
            newErrors.plan = 'Choose your buyer lead plan';
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else {
            const workEmailError = validateProfessionalWorkEmail(formData.email);
            if (workEmailError) newErrors.email = workEmailError;
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
        setExistingAccount(null);

        if (typeof window !== 'undefined') {
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

            const agent: AgentRegistration & { registrationRole: string } = {
                id: agentId,
                fullName: formData.fullName,
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone,
                eaabNumber: ppra,
                ppraNumber: ppra,
                ffcNumber: formData.ffcNumber.trim()
                    ? normalizeFfcNumber(formData.ffcNumber)
                    : undefined,
                ffcDocumentUrl,
                verificationStatus: 'pending',
                company: formData.company,
                city: formData.city?.trim() || undefined,
                password: formData.password,
                emailVerified: false,
                timestamp: new Date().toISOString(),
                status: 'pending',
                registrationRole: formData.registrationRole || 'agent',
                plan: formData.plan,
            };

            const registerRes = await fetch('/api/agents/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agent),
            });
            const registerJson = await registerRes.json().catch(() => ({}));

            if (!registerRes.ok || !registerJson.success) {
                const apiError = registerJson.error || registerRes.statusText;
                if (registerRes.status === 409 || registerJson.code === 'EMAIL_EXISTS') {
                    setExistingAccount({
                        message:
                            registerJson.message ||
                            apiError ||
                            'An account with this email already exists. Please log in or reset your password.',
                        loginPath: registerJson.loginPath || '/agents/login',
                        resetPasswordPath:
                            registerJson.resetPasswordPath || '/auth/forgot-password?type=agent',
                    });
                    setErrors({ email: apiError });
                    setIsSubmitting(false);
                    return;
                }
                setErrors({ submit: apiError || 'Registration failed. Please try again.' });
                setIsSubmitting(false);
                return;
            }

            try {
                const existingAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
                existingAgents.push(agent);
                localStorage.setItem('propReady_agents', JSON.stringify(existingAgents));
            } catch {
                /* ignore */
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
        if (name === 'ppraNumber') {
            finalValue = (value as string).replace(/\D/g, '').slice(0, 7);
        }
        if (name === 'ffcNumber') {
            finalValue = (value as string).replace(/\D/g, '').slice(0, 15);
        }
        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                if (name === 'ppraNumber' || name === 'ffcNumber') {
                    delete next.ppraNumber;
                    delete next.ffcNumber;
                }
                return next;
            });
        }
    };

    const fieldError = (key: string) =>
        errors[key] ? (
            <p className="form-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors[key]}
            </p>
        ) : null;

    return (
        <ProfessionalAuthShell
            role="agent"
            title="Join our network"
            subtitle={`Choose your plan, start with a 7-day trial, and unlock full access after PropReady activates payment. ${PRICING_SUMMARY}`}
            wide
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {existingAccount ? (
                    <ExistingAccountNotice
                        message={existingAccount.message}
                        loginPath={existingAccount.loginPath}
                        resetPasswordPath={existingAccount.resetPasswordPath}
                    />
                ) : null}
                {errors.submit ? (
                    <p className="form-error">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {errors.submit}
                    </p>
                ) : null}

                <fieldset>
                    <legend className="auth-label mb-2">
                        Are you registering as… <span className="text-red-600">*</span>
                    </legend>
                    <div className="grid sm:grid-cols-2 gap-2">
                        <label
                            className={`rounded-2xl border px-4 py-3 cursor-pointer transition ${
                                formData.registrationRole === 'agent'
                                    ? 'border-gold bg-gold/[0.06]'
                                    : 'border-charcoal/[0.1] hover:border-charcoal/20'
                            }`}
                        >
                            <input
                                type="radio"
                                name="registrationRole"
                                value="agent"
                                checked={formData.registrationRole === 'agent'}
                                onChange={handleInputChange}
                                className="sr-only"
                            />
                            <span className="block text-sm font-semibold text-charcoal">Agent</span>
                            <span className="block text-xs text-charcoal/55 mt-1">
                                Estate agent representing buyers/sellers under an agency
                            </span>
                        </label>
                        <label
                            className={`rounded-2xl border px-4 py-3 cursor-pointer transition ${
                                formData.registrationRole === 'principal'
                                    ? 'border-gold bg-gold/[0.06]'
                                    : 'border-charcoal/[0.1] hover:border-charcoal/20'
                            }`}
                        >
                            <input
                                type="radio"
                                name="registrationRole"
                                value="principal"
                                checked={formData.registrationRole === 'principal'}
                                onChange={handleInputChange}
                                className="sr-only"
                            />
                            <span className="block text-sm font-semibold text-charcoal">Principal</span>
                            <span className="block text-xs text-charcoal/55 mt-1">
                                Agency principal / responsible person for the firm
                            </span>
                        </label>
                    </div>
                    {fieldError('registrationRole')}
                </fieldset>

                <fieldset>
                    <legend className="auth-label mb-2">
                        Choose your buyer lead plan <span className="text-red-600">*</span>
                    </legend>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {(Object.keys(BUYER_PLANS) as BuyerPlan[]).map((planId) => {
                            const plan = BUYER_PLANS[planId];
                            return (
                                <label
                                    key={planId}
                                    className={`rounded-2xl border px-4 py-3 cursor-pointer transition ${
                                        formData.plan === planId
                                            ? 'border-gold bg-gold/[0.06]'
                                            : 'border-charcoal/[0.1] hover:border-charcoal/20'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={planId}
                                        checked={formData.plan === planId}
                                        onChange={handleInputChange}
                                        className="sr-only"
                                    />
                                    <span className="block text-sm font-semibold text-charcoal">
                                        {plan.name}
                                    </span>
                                    <span className="block text-xs text-charcoal/55 mt-1">
                                        {plan.leadLimit} buyer leads · {plan.priceLabel}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    <p className="text-xs text-charcoal/45 mt-2">
                        Every agent starts on a 7-day trial. After that, leads stay visible but contact details stay locked until PropReady activates the selected plan.
                    </p>
                    {fieldError('plan')}
                </fieldset>

                <div>
                    <label className="auth-label">
                        Full name <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <User className="auth-input-icon" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="e.g., John Mthembu"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`auth-input ${errors.fullName ? 'form-control-error' : ''}`}
                        />
                    </div>
                    {fieldError('fullName')}
                </div>

                <div>
                    <label className="auth-label">
                        Email address <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="you@youragency.co.za"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`auth-input ${errors.email ? 'form-control-error' : ''}`}
                        />
                    </div>
                    <p className="text-xs text-charcoal/45 mt-1.5">
                        Agency email only — Gmail and other free addresses are not accepted.
                    </p>
                    {fieldError('email')}
                </div>

                <div>
                    <label className="auth-label">
                        Phone number <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <Phone className="auth-input-icon" />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="082 123 4567"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`auth-input ${errors.phone ? 'form-control-error' : ''}`}
                        />
                    </div>
                    {fieldError('phone')}
                </div>

                <div className="rounded-xl border border-charcoal/[0.08] bg-charcoal/[0.02] p-4">
                    <p className="text-sm font-semibold text-charcoal mb-3">PPRA verification (required)</p>
                    <div className="flex gap-2 flex-wrap text-xs mb-4">
                        {['Details', 'PPRA & FFC', 'Submit'].map((label, i) => (
                            <span
                                key={label}
                                className={`px-3 py-1 rounded-full ${
                                    registerStep >= i + 1
                                        ? 'bg-gold text-white'
                                        : 'bg-white text-charcoal/50 border border-charcoal/15'
                                }`}
                            >
                                {i + 1}. {label}
                            </span>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="auth-label">
                                PPRA practitioner number <span className="text-red-600">*</span>
                            </label>
                            <div className="auth-input-wrap">
                                <FileText className="auth-input-icon" />
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
                                    className={`auth-input ${errors.ppraNumber ? 'form-control-error' : ''}`}
                                />
                            </div>
                            {fieldError('ppraNumber')}
                        </div>

                        <div>
                            <label className="auth-label">
                                FFC certificate number{' '}
                                <span className="font-normal normal-case tracking-normal text-charcoal/45">
                                    (optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="ffcNumber"
                                placeholder="15 digits starting with 20"
                                value={formData.ffcNumber}
                                onChange={handleInputChange}
                                maxLength={15}
                                inputMode="numeric"
                                className={`auth-input !pl-4 font-mono ${errors.ffcNumber ? 'form-control-error' : ''}`}
                            />
                            {fieldError('ffcNumber')}
                        </div>

                        <div>
                            <label className="auth-label">
                                Upload Fidelity Fund Certificate <span className="text-red-600">*</span>
                            </label>
                            <p className="text-charcoal/45 text-xs mb-2">
                                PDF, JPG, JPEG or PNG — max 10MB. Stored securely.
                            </p>
                            <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-charcoal/20 rounded-xl cursor-pointer hover:bg-charcoal/[0.02] transition">
                                <span className="text-sm text-charcoal/55 px-3 text-center">
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
                            {fieldError('ffcFile')}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="auth-label">
                        Company / agency name <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <Building2 className="auth-input-icon" />
                        <input
                            type="text"
                            name="company"
                            placeholder="e.g., ABC Real Estate"
                            value={formData.company}
                            onChange={handleInputChange}
                            className={`auth-input ${errors.company ? 'form-control-error' : ''}`}
                        />
                    </div>
                    {fieldError('company')}
                </div>

                <div>
                    <label className="auth-label">City or service area</label>
                    <p className="text-charcoal/45 text-xs mb-1.5">
                        Leads near you will be prioritized. Optional.
                    </p>
                    <div className="auth-input-wrap">
                        <MapPin className="auth-input-icon" />
                        <input
                            type="text"
                            name="city"
                            placeholder="e.g., Johannesburg, Sandton, Cape Town"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="auth-input"
                        />
                    </div>
                </div>

                <div>
                    <label className="auth-label">
                        Password <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <Lock className="auth-input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="At least 8 characters"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`auth-input pr-10 ${errors.password ? 'form-control-error' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-input-toggle"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-charcoal/45 text-xs mt-1">{getPasswordRequirementsText()}</p>
                    {fieldError('password')}
                </div>

                <div>
                    <label className="auth-label">
                        Confirm password <span className="text-red-600">*</span>
                    </label>
                    <div className="auth-input-wrap">
                        <Lock className="auth-input-icon" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`auth-input pr-10 ${errors.confirmPassword ? 'form-control-error' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="auth-input-toggle"
                            aria-label={
                                showConfirmPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    {fieldError('confirmPassword')}
                </div>

                <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleInputChange}
                            className="mt-0.5 w-4 h-4 rounded border-charcoal/20 text-gold focus:ring-gold"
                        />
                        <span className="text-charcoal/70 text-sm">
                            I agree to the{' '}
                            <Link href="/terms" className="text-gold hover:underline font-medium">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-gold hover:underline font-medium">
                                Privacy Policy
                            </Link>
                        </span>
                    </label>
                    {fieldError('agreeToTerms')}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-btn-primary w-full"
                    onClick={() => setRegisterStep(3)}
                >
                    {isSubmitting ? 'Registering…' : 'Register as agent'}
                </button>
            </form>

            <p className="text-center text-sm text-charcoal/55 mt-8">
                Already have an account?{' '}
                <Link
                    href="/agents/login"
                    className="text-gold font-medium hover:underline"
                >
                    Sign in
                </Link>
            </p>

            <div className="mt-6 pt-5 border-t border-charcoal/[0.06] flex items-center justify-center gap-2 text-charcoal/55 text-sm">
                <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                <span>EAAB registered agents only</span>
            </div>
            <p className="text-charcoal/45 text-xs text-center mt-2">
                PropReady reviews and approves agent registrations before portal access is enabled
            </p>
        </ProfessionalAuthShell>
    );
}
