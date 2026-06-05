'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Building2, FileText, User, Save, CheckCircle, AlertCircle, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentProfileSummary from '@/components/AgentProfileSummary';

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

export default function AgentSettingsPage() {
    const router = useRouter();
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
        city: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [portalAgent, setPortalAgent] = useState<AgentPortalAgent | null>(null);

    useEffect(() => {
        // Load current agent data
        if (typeof window !== 'undefined') {
            const currentAgent = localStorage.getItem('propReady_currentAgent');
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            
            if (currentAgent) {
                const agentInfo = JSON.parse(currentAgent);
                setPortalAgent({
                    ...agentInfo,
                    ppraNumber: agentInfo.ppraNumber || agentInfo.eaabNumber,
                });
                const agent = agents.find((a: AgentData) => a.id === agentInfo.id || a.email === agentInfo.email);
                
                if (agent) {
                    setFormData({
                        id: agent.id,
                        fullName: agent.fullName,
                        email: agent.email,
                        phone: agent.phone,
                        eaabNumber: agent.eaabNumber,
                        company: agent.company,
                        city: agent.city || ''
                    });
                } else {
                    // If agent not found in agents list, use current agent info
                    setFormData({
                        id: agentInfo.id || '',
                        fullName: agentInfo.fullName || '',
                        email: agentInfo.email || '',
                        phone: '',
                        eaabNumber: '',
                        company: agentInfo.company || '',
                        city: agentInfo.city || ''
                    });
                }
            }
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue = value;
        // Restrict FFC field to digits only, max 7
        if (name === 'eaabNumber') {
            finalValue = value.replace(/\D/g, '').slice(0, 7);
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
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
            newErrors.eaabNumber = 'Enter your valid 7-digit PPRA FFC number (cannot be all zeros)';
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

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (typeof window !== 'undefined') {
            // Update agent in agents list
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const agentIndex = agents.findIndex((a: AgentData) => a.id === formData.id || a.email === formData.email);
            
            if (agentIndex !== -1) {
                agents[agentIndex] = {
                    ...agents[agentIndex],
                    ...formData,
                    eaabNumber: formData.eaabNumber.replace(/\D/g, '')
                };
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }

            // Update current agent info
            const existing = JSON.parse(localStorage.getItem('propReady_currentAgent') || '{}');
            const currentAgent = {
                id: formData.id,
                fullName: formData.fullName,
                email: formData.email,
                company: formData.company,
                city: formData.city,
                plan: existing.plan || agents[agentIndex]?.plan
            };
            localStorage.setItem('propReady_currentAgent', JSON.stringify(currentAgent));
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

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (typeof window !== 'undefined') {
            // Update password in agents list
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const agentIndex = agents.findIndex((a: AgentData) => a.id === formData.id || a.email === formData.email);
            
            if (agentIndex !== -1) {
                agents[agentIndex].password = passwordData.newPassword; // In production, this should be hashed
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }
        }

        setIsSaving(false);
        setSuccessMessage('Password changed successfully!');
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-white">Loading...</p>
            </div>
        );
    }

    return (
        <AgentPortalLayout activePage="settings" agent={portalAgent} title="Settings">
            <div className="max-w-4xl mx-auto relative z-10">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            Agent Settings
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            Manage your profile and account preferences
                        </p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-400 font-semibold">{successMessage}</p>
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

                    {/* Profile Settings */}
                    <div className="rounded-2xl border border-charcoal/10 bg-white shadow-sm mb-6 overflow-hidden">
                        <div className="px-6 md:px-8 py-5 border-b border-charcoal/10 bg-charcoal/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gold" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-charcoal">Edit profile</h2>
                                    <p className="text-charcoal/60 text-sm">
                                        Update your contact details and service area
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border ${errors.fullName ? 'border-red-400 ring-1 ring-red-400/30' : 'border-charcoal/15'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition`}
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
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border ${errors.email ? 'border-red-400 ring-1 ring-red-400/30' : 'border-charcoal/15'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition`}
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
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="082 123 4567"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border ${errors.phone ? 'border-red-400 ring-1 ring-red-400/30' : 'border-charcoal/15'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition`}
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
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        PPRA Practitioner Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            name="eaabNumber"
                                            placeholder="e.g. 1234567 (7 digits)"
                                            value={formData.eaabNumber}
                                            onChange={handleInputChange}
                                            maxLength={7}
                                            inputMode="numeric"
                                            autoComplete="off"
                                            pattern="[0-9]{7}"
                                            title="Enter your 7-digit PPRA practitioner number"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border ${errors.eaabNumber ? 'border-red-400 ring-1 ring-red-400/30' : 'border-charcoal/15'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition`}
                                        />
                                    </div>
                                    {errors.eaabNumber && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.eaabNumber}
                                        </p>
                                    )}
                                    <p className="text-charcoal/60 text-sm mt-1">Your valid 7-digit PPRA Fidelity Fund Certificate number. Verify at theppra.org.za</p>
                                </div>

                                {/* Company */}
                                <div className="md:col-span-2">
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        Company / Agency <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border ${errors.company ? 'border-red-400 ring-1 ring-red-400/30' : 'border-charcoal/15'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition`}
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
                                <div className="md:col-span-2">
                                    <label className="block text-charcoal/80 text-sm font-semibold mb-1.5">
                                        City or service area
                                    </label>
                                    <p className="text-charcoal/50 text-xs mb-2">Leads near you are prioritised. Leave blank to see all leads.</p>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city || ''}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Johannesburg, Sandton, Cape Town"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/[0.03] border border-charcoal/15 text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-charcoal/10">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Settings */}
                    <div className="rounded-2xl border border-charcoal/10 bg-white shadow-sm overflow-hidden">
                        <div className="px-6 md:px-8 py-5 border-b border-charcoal/10 bg-charcoal/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-gold" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-charcoal">Security</h2>
                                    <p className="text-charcoal/60 text-sm">Change your account password</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            {/* Current Password */}
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">
                                    Current Password <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border ${errors.currentPassword ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.currentPassword && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.currentPassword}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* New Password */}
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">
                                        New Password <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white/10 border ${errors.newPassword ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/50 hover:text-charcoal transition"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.newPassword && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.newPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">
                                        Confirm New Password <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
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
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <Lock className="w-5 h-5" />
                                {isSaving ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                        </div>
                    </div>
            </div>
        </AgentPortalLayout>
    );
}

