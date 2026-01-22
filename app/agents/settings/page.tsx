'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Mail, Phone, Building2, FileText, User, Save, ArrowLeft, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface AgentData {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    eaabNumber: string;
    company: string;
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
        company: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // Load current agent data
        if (typeof window !== 'undefined') {
            const currentAgent = localStorage.getItem('propReady_currentAgent');
            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            
            if (currentAgent) {
                const agentInfo = JSON.parse(currentAgent);
                const agent = agents.find((a: AgentData) => a.id === agentInfo.id || a.email === agentInfo.email);
                
                if (agent) {
                    setFormData({
                        id: agent.id,
                        fullName: agent.fullName,
                        email: agent.email,
                        phone: agent.phone,
                        eaabNumber: agent.eaabNumber,
                        company: agent.company
                    });
                } else {
                    // If agent not found in agents list, use current agent info
                    setFormData({
                        id: agentInfo.id || '',
                        fullName: agentInfo.fullName || '',
                        email: agentInfo.email || '',
                        phone: '',
                        eaabNumber: '',
                        company: agentInfo.company || ''
                    });
                }
            }
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
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

        if (!formData.eaabNumber.trim()) {
            newErrors.eaabNumber = 'EAAB/PPRA registration number is required';
        } else {
            const cleanedNumber = formData.eaabNumber.replace(/\s/g, '');
            // EAAB/PPRA FFC numbers are 10-11 digits (traditional format) or newer formats
            // Valid formats: 10 digits, 11 digits, or 6 digits (legacy)
            if (!/^\d{10,11}$|^\d{6}$/.test(cleanedNumber)) {
                newErrors.eaabNumber = 'EAAB/PPRA number must be 10-11 digits (or 6 digits for legacy numbers)';
            }
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
                    eaabNumber: formData.eaabNumber.replace(/\s/g, '')
                };
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }

            // Update current agent info
            const currentAgent = {
                id: formData.id,
                fullName: formData.fullName,
                email: formData.email,
                company: formData.company
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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/agents/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                            <Link href="/agents/settings" className="text-gold font-semibold">
                                Settings
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/agents/dashboard"
                        className="flex items-center space-x-2 text-charcoal/90 hover:text-charcoal transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-4xl relative z-10">
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

                    {/* Profile Settings */}
                    <div className="glass-effect rounded-2xl p-8 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-6 h-6 text-gold" />
                            <h2 className="text-2xl font-bold text-charcoal">Profile Information</h2>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="082 123 4567"
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

                                {/* EAAB Number */}
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">
                                        EAAB Registration Number <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            type="text"
                                            name="eaabNumber"
                                            value={formData.eaabNumber}
                                            onChange={handleInputChange}
                                            maxLength={6}
                                            className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border ${errors.eaabNumber ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold`}
                                        />
                                    </div>
                                    {errors.eaabNumber && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.eaabNumber}
                                        </p>
                                    )}
                                </div>

                                {/* Company */}
                                <div className="md:col-span-2">
                                    <label className="block text-charcoal font-semibold mb-2">
                                        Company/Agency Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                        <input
                                            type="text"
                                            name="company"
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
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-bold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Password Settings */}
                    <div className="glass-effect rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="w-6 h-6 text-gold" />
                            <h2 className="text-2xl font-bold text-charcoal">Change Password</h2>
                        </div>

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

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>
        </div>
    );
}

