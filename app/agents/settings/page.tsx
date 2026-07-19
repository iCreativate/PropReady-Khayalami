'use client';

import { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    Building2,
    FileText,
    User,
    Save,
    CheckCircle,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
    MapPin,
} from 'lucide-react';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentProfileSummary from '@/components/AgentProfileSummary';
import AgentPageHeader from '@/components/AgentPageHeader';
import {
    AGENT_PAGE_CONTAINER,
    AGENT_FORM_SECTION,
    AGENT_FORM_SECTION_HEADER,
    AGENT_FORM_LABEL,
    AGENT_FORM_HINT,
    AGENT_FORM_FOOTER,
    AGENT_PRIMARY_BTN,
    AGENT_CARD_SOFT,
    agentFormInput,
} from '@/lib/agent-portal-ui';
import PortalLoading from '@/components/PortalLoading';

interface AgentData {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    eaabNumber: string;
    company: string;
    city?: string;
    password?: string;
}

function FieldError({ message }: { message: string }) {
    return (
        <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {message}
        </p>
    );
}

export default function AgentSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<AgentData>({
        id: '',
        fullName: '',
        email: '',
        phone: '',
        eaabNumber: '',
        company: '',
        city: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [portalAgent, setPortalAgent] = useState<AgentPortalAgent | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentAgent = localStorage.getItem('propReady_currentAgent');
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');

            if (currentAgent) {
                const agentInfo = JSON.parse(currentAgent);
                setPortalAgent({
                    ...agentInfo,
                    ppraNumber: agentInfo.ppraNumber || agentInfo.eaabNumber,
                });
                const agent = agents.find(
                    (a: AgentData) => a.id === agentInfo.id || a.email === agentInfo.email
                );

                if (agent) {
                    setFormData({
                        id: agent.id,
                        fullName: agent.fullName,
                        email: agent.email,
                        phone: agent.phone,
                        eaabNumber: agent.eaabNumber,
                        company: agent.company,
                        city: agent.city || '',
                    });
                } else {
                    setFormData({
                        id: agentInfo.id || '',
                        fullName: agentInfo.fullName || '',
                        email: agentInfo.email || '',
                        phone: '',
                        eaabNumber: '',
                        company: agentInfo.company || '',
                        city: agentInfo.city || '',
                    });
                }
            }
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'eaabNumber') {
            finalValue = value.replace(/\D/g, '').slice(0, 7);
        }
        setFormData((prev) => ({ ...prev, [name]: finalValue }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateProfile = () => {
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
        if (!formData.eaabNumber.trim()) {
            newErrors.eaabNumber = 'A valid FFC number (Fidelity Fund Certificate) is required';
        } else if (cleanedFFC.length !== 7) {
            newErrors.eaabNumber = 'FFC number must be exactly 7 digits';
        } else if (/^0+$/.test(cleanedFFC)) {
            newErrors.eaabNumber =
                'Enter your valid 7-digit PPRA FFC number (cannot be all zeros)';
        }

        if (!formData.company.trim()) {
            newErrors.company = 'Company/Agency name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePassword = () => {
        const newErrors: Record<string, string> = {};

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }

        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateProfile()) {
            return;
        }

        setIsSaving(true);
        setSuccessMessage('');

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (typeof window !== 'undefined') {
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const agentIndex = agents.findIndex(
                (a: AgentData) => a.id === formData.id || a.email === formData.email
            );

            if (agentIndex !== -1) {
                agents[agentIndex] = {
                    ...agents[agentIndex],
                    ...formData,
                    eaabNumber: formData.eaabNumber.replace(/\D/g, ''),
                };
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }

            const existing = JSON.parse(localStorage.getItem('propReady_currentAgent') || '{}');
            const currentAgent = {
                id: formData.id,
                fullName: formData.fullName,
                email: formData.email,
                company: formData.company,
                city: formData.city,
                plan: existing.plan || agents[agentIndex]?.plan,
            };
            localStorage.setItem('propReady_currentAgent', JSON.stringify(currentAgent));
            setPortalAgent((prev) =>
                prev
                    ? {
                          ...prev,
                          fullName: formData.fullName,
                          email: formData.email,
                          company: formData.company,
                          city: formData.city,
                      }
                    : prev
            );
        }

        setIsSaving(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) {
            return;
        }

        setIsSaving(true);
        setSuccessMessage('');

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (typeof window !== 'undefined') {
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const agentIndex = agents.findIndex(
                (a: AgentData) => a.id === formData.id || a.email === formData.email
            );

            if (agentIndex !== -1) {
                agents[agentIndex].password = passwordData.newPassword;
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }
        }

        setIsSaving(false);
        setSuccessMessage('Password changed successfully!');
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    if (isLoading) {
        return <PortalLoading />;
    }

    return (
        <AgentPortalLayout
            activePage="settings"
            agent={portalAgent}
            title="Settings"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Account"
                    title="Agent Settings"
                    description="Manage your profile, service area, and account security"
                />
            }
        >
            <div className={`${AGENT_PAGE_CONTAINER} relative z-10`}>
                {successMessage && (
                    <div
                        className={`${AGENT_CARD_SOFT} mb-6 p-4 flex items-center gap-3 border-emerald-500/15 bg-emerald-500/[0.04]`}
                    >
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <p className="text-emerald-800 font-medium text-sm">{successMessage}</p>
                    </div>
                )}

                {portalAgent && (
                    <AgentProfileSummary
                        agent={{
                            ...portalAgent,
                            phone: formData.phone || portalAgent.phone,
                            city: formData.city || portalAgent.city,
                            email: formData.email || portalAgent.email,
                            fullName: formData.fullName || portalAgent.fullName,
                            company: formData.company || portalAgent.company,
                            ppraNumber:
                                portalAgent.ppraNumber || formData.eaabNumber || undefined,
                        }}
                    />
                )}

                <div className={AGENT_FORM_SECTION}>
                    <div className={AGENT_FORM_SECTION_HEADER}>
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-2xl bg-gold/[0.08] border border-gold/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-gold" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-charcoal tracking-tight">
                                    Edit profile
                                </h2>
                                <p className="text-charcoal/45 text-sm mt-1 leading-relaxed">
                                    Update your contact details and service area
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={agentFormInput(!!errors.fullName)}
                                    />
                                </div>
                                {errors.fullName && <FieldError message={errors.fullName} />}
                            </div>

                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={agentFormInput(!!errors.email)}
                                    />
                                </div>
                                {errors.email && <FieldError message={errors.email} />}
                            </div>

                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="082 123 4567"
                                        className={agentFormInput(!!errors.phone)}
                                    />
                                </div>
                                {errors.phone && <FieldError message={errors.phone} />}
                            </div>

                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    PPRA Practitioner Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="text"
                                        name="eaabNumber"
                                        placeholder="e.g. 1234567"
                                        value={formData.eaabNumber}
                                        onChange={handleInputChange}
                                        maxLength={7}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        pattern="[0-9]{7}"
                                        title="Enter your 7-digit PPRA practitioner number"
                                        className={`${agentFormInput(!!errors.eaabNumber)} font-mono tracking-wide`}
                                    />
                                </div>
                                {errors.eaabNumber && <FieldError message={errors.eaabNumber} />}
                                <p className={AGENT_FORM_HINT}>
                                    Your valid 7-digit PPRA Fidelity Fund Certificate number. Verify
                                    at theppra.org.za
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className={AGENT_FORM_LABEL}>
                                    Company / Agency <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className={agentFormInput(!!errors.company)}
                                    />
                                </div>
                                {errors.company && <FieldError message={errors.company} />}
                            </div>

                            <div className="md:col-span-2">
                                <label className={AGENT_FORM_LABEL}>City or service area</label>
                                <p className={`${AGENT_FORM_HINT} mb-2 mt-0`}>
                                    Leads near you are prioritised. Leave blank to see all leads.
                                </p>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Johannesburg, Sandton, Cape Town"
                                        className={agentFormInput()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={AGENT_FORM_FOOTER}>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`${AGENT_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className={`${AGENT_FORM_SECTION} mb-0`}>
                    <div className={AGENT_FORM_SECTION_HEADER}>
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-2xl bg-gold/[0.08] border border-gold/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-gold" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-charcoal tracking-tight">
                                    Security
                                </h2>
                                <p className="text-charcoal/45 text-sm mt-1 leading-relaxed">
                                    Change your account password
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="p-6 md:p-8 space-y-5">
                        <div>
                            <label className={AGENT_FORM_LABEL}>
                                Current Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className={`${agentFormInput(!!errors.currentPassword)} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal transition"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.currentPassword && (
                                <FieldError message={errors.currentPassword} />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className={`${agentFormInput(!!errors.newPassword)} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal transition"
                                        aria-label={
                                            showNewPassword ? 'Hide password' : 'Show password'
                                        }
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.newPassword && <FieldError message={errors.newPassword} />}
                            </div>

                            <div>
                                <label className={AGENT_FORM_LABEL}>
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className={`${agentFormInput(!!errors.confirmPassword)} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal transition"
                                        aria-label={
                                            showConfirmPassword ? 'Hide password' : 'Show password'
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <FieldError message={errors.confirmPassword} />
                                )}
                            </div>
                        </div>

                        <div className={AGENT_FORM_FOOTER}>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`${AGENT_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Lock className="w-4 h-4" />
                                {isSaving ? 'Updating…' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AgentPortalLayout>
    );
}
