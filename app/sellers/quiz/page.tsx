'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home, CheckCircle, AlertCircle, Building2, Calendar, TrendingUp, DollarSign, MapPin, Home as HomeIcon, Mail, Phone, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function SellersQuizPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        propertyAddress: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        propertySize: '',
        yearBuilt: '',
        currentValue: '',
        reasonForSelling: '',
        timeline: '',
        hasBond: null as boolean | null,
        bondBalance: '',
        agentPreference: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const totalSteps = 7;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const handleBondSelection = (hasBond: boolean) => {
        setFormData(prev => ({ ...prev, hasBond }));
        
        // Clear error when user selects
        if (errors.hasBond) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.hasBond;
                return newErrors;
            });
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.fullName.trim()) {
                    newErrors.fullName = 'Full name is required';
                }
                if (!formData.email.trim()) {
                    newErrors.email = 'Email address is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    newErrors.email = 'Please enter a valid email address';
                }
                if (!formData.phone.trim()) {
                    newErrors.phone = 'Phone number is required';
                } else if (!/^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
                    newErrors.phone = 'Please enter a valid South African phone number';
                }
                break;
            case 2:
                if (!formData.propertyAddress.trim()) {
                    newErrors.propertyAddress = 'Property address is required';
                }
                if (!formData.propertyType) {
                    newErrors.propertyType = 'Property type is required';
                }
                break;
            case 3:
                if (!formData.bedrooms) {
                    newErrors.bedrooms = 'Number of bedrooms is required';
                }
                if (!formData.bathrooms) {
                    newErrors.bathrooms = 'Number of bathrooms is required';
                }
                break;
            case 4:
                if (!formData.currentValue.trim()) {
                    newErrors.currentValue = 'Estimated property value is required';
                } else if (parseFloat(formData.currentValue) <= 0) {
                    newErrors.currentValue = 'Property value must be greater than 0';
                }
                if (formData.hasBond === null) {
                    newErrors.hasBond = 'Please indicate if you have a bond';
                } else if (formData.hasBond && !formData.bondBalance.trim()) {
                    newErrors.bondBalance = 'Bond balance is required when you have a bond';
                }
                break;
            case 5:
                if (!formData.reasonForSelling) {
                    newErrors.reasonForSelling = 'Reason for selling is required';
                }
                if (!formData.timeline) {
                    newErrors.timeline = 'Selling timeline is required';
                }
                break;
            case 6:
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
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // Create user account and store seller information
        if (typeof window !== 'undefined') {
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Check if user already exists (might be a buyer too)
            const existingUsers = JSON.parse(localStorage.getItem('propReady_users') || '[]');
            const existingUser = existingUsers.find((u: any) => u.email === formData.email);
            
            if (existingUser) {
                // User already exists (buyer account), update it
                existingUser.isSeller = true;
                localStorage.setItem('propReady_users', JSON.stringify(existingUsers));
            } else {
                // Create new user account
                const userAccount = {
                    id: userId,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password, // In production, this should be hashed
                    isSeller: true,
                    isBuyer: false,
                    timestamp: new Date().toISOString()
                };
                existingUsers.push(userAccount);
                localStorage.setItem('propReady_users', JSON.stringify(existingUsers));
            }
            
            // Store seller information
            const sellerInfo = {
                ...formData,
                password: undefined, // Don't store password in seller info
                confirmPassword: undefined,
                timestamp: new Date().toISOString(),
                id: existingUser?.id || userId
            };
            
            // Store as single object for the seller's own use
            localStorage.setItem('propReady_sellerInfo', JSON.stringify(sellerInfo));
            
            // Store as lead (seller type) for agents - same leads table as buyers
            const sellerLead = {
                id: existingUser?.id || userId,
                leadType: 'seller',
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                propertyAddress: formData.propertyAddress,
                propertyType: formData.propertyType,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                propertySize: formData.propertySize,
                currentValue: formData.currentValue,
                reasonForSelling: formData.reasonForSelling,
                timeline: formData.timeline,
                hasBond: formData.hasBond,
                bondBalance: formData.bondBalance,
                status: 'new',
                timestamp: sellerInfo.timestamp,
                contactedAt: null
            };
            const leadsRes = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sellerLead),
            });
            if (!leadsRes.ok) {
                const errBody = await leadsRes.json().catch(() => ({}));
                console.error('Seller lead save to database failed:', leadsRes.status, errBody);
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('propReady_sellerLeadSyncFailed', '1');
            }
            const existingSellers = JSON.parse(localStorage.getItem('propReady_sellers') || '[]');
            const filteredSellers = existingSellers.filter((s: any) => s.id !== (existingUser?.id || userId));
            filteredSellers.push({ ...sellerLead, ...sellerInfo });
            localStorage.setItem('propReady_sellers', JSON.stringify(filteredSellers));

            // Store current user session
            localStorage.setItem('propReady_currentUser', JSON.stringify({
                id: existingUser?.id || userId,
                fullName: formData.fullName,
                email: formData.email
            }));
        }

        router.push('/sellers/dashboard');
    };

    // Render step content based on currentStep
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Let&apos;s Get Started</h2>
                        <p className="text-charcoal/60 mb-6 text-center">
                            We need some basic information to help you sell your property
                        </p>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., John Mthembu"
                                    required
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.fullName ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.fullName}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Email Address <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="e.g., john@example.com"
                                    required
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.email ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Phone Number <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 082 123 4567"
                                    required
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.phone ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.phone && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Details</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Address <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="text"
                                    name="propertyAddress"
                                    value={formData.propertyAddress}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 123 Main Street, Sandton, Johannesburg"
                                    required
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.propertyAddress ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.propertyAddress && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertyAddress}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Type <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="propertyType"
                                value={formData.propertyType}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.propertyType ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select property type</option>
                                <option value="house">House</option>
                                <option value="apartment">Apartment/Flat</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="duplex">Duplex</option>
                                <option value="land">Land</option>
                                <option value="commercial">Commercial</option>
                            </select>
                            {errors.propertyType && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertyType}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Specifications</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Number of Bedrooms <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="bedrooms"
                                value={formData.bedrooms}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.bedrooms ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select bedrooms</option>
                                <option value="1">1 Bedroom</option>
                                <option value="2">2 Bedrooms</option>
                                <option value="3">3 Bedrooms</option>
                                <option value="4">4 Bedrooms</option>
                                <option value="5+">5+ Bedrooms</option>
                            </select>
                            {errors.bedrooms && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.bedrooms}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Number of Bathrooms <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="bathrooms"
                                value={formData.bathrooms}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.bathrooms ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select bathrooms</option>
                                <option value="1">1 Bathroom</option>
                                <option value="2">2 Bathrooms</option>
                                <option value="3">3 Bathrooms</option>
                                <option value="4+">4+ Bathrooms</option>
                            </select>
                            {errors.bathrooms && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.bathrooms}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Size (m²) <span className="text-charcoal/50 text-sm">(Optional)</span>
                            </label>
                            <div className="relative">
                                <HomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="number"
                                    name="propertySize"
                                    value={formData.propertySize}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 150"
                                    min="0"
                                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Value & Bond</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Estimated Current Property Value <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                                <input
                                    type="number"
                                    name="currentValue"
                                    value={formData.currentValue}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1500000"
                                    required
                                    min="0"
                                    step="10000"
                                    className={`w-full pl-16 pr-4 py-3 rounded-lg bg-white border ${errors.currentValue ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.currentValue && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.currentValue}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Do you have a bond on this property? <span className="text-red-600">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleBondSelection(true)}
                                    className={`px-6 py-3 rounded-lg border transition-all font-semibold ${formData.hasBond === true
                                            ? 'bg-gold text-white border-gold'
                                            : errors.hasBond 
                                            ? 'bg-white border-2 border-red-500/30 text-charcoal hover:bg-red-500/10'
                                            : 'bg-white border border-charcoal/20 text-charcoal hover:bg-charcoal/5'
                                        }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBondSelection(false)}
                                    className={`px-6 py-3 rounded-lg border transition-all font-semibold ${formData.hasBond === false
                                            ? 'bg-gold text-white border-gold'
                                            : errors.hasBond 
                                            ? 'bg-white border-2 border-red-500/30 text-charcoal hover:bg-red-500/10'
                                            : 'bg-white border border-charcoal/20 text-charcoal hover:bg-charcoal/5'
                                        }`}
                                >
                                    No
                                </button>
                            </div>
                            {errors.hasBond && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.hasBond}
                                </p>
                            )}
                        </div>

                        {formData.hasBond && (
                            <div className="premium-card rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-charcoal font-semibold text-lg mb-4">
                                    Current Bond Balance <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                                    <input
                                        type="number"
                                        name="bondBalance"
                                        value={formData.bondBalance}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 800000"
                                        required
                                        min="0"
                                        step="10000"
                                        className={`w-full pl-16 pr-4 py-3 rounded-lg bg-white border ${errors.bondBalance ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.bondBalance && (
                                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.bondBalance}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Selling Preferences</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Reason for Selling <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="reasonForSelling"
                                value={formData.reasonForSelling}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.reasonForSelling ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select reason</option>
                                <option value="upgrading">Upgrading to larger home</option>
                                <option value="downsizing">Downsizing</option>
                                <option value="relocating">Relocating</option>
                                <option value="investment">Selling investment property</option>
                                <option value="divorce">Divorce/Separation</option>
                                <option value="financial">Financial reasons</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.reasonForSelling && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.reasonForSelling}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                When do you want to sell? <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="timeline"
                                value={formData.timeline}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.timeline ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select timeline</option>
                                <option value="immediately">Immediately</option>
                                <option value="1-3months">Within 1-3 months</option>
                                <option value="3-6months">Within 3-6 months</option>
                                <option value="6-12months">Within 6-12 months</option>
                                <option value="flexible">Flexible/No rush</option>
                            </select>
                            {errors.timeline && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.timeline}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Create Your Account</h2>
                        <p className="text-charcoal/60 mb-6 text-center">
                            Create an account to access your seller dashboard and manage your property listing
                        </p>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Password <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter password (min. 8 characters)"
                                    required
                                    className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white border ${errors.password ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Confirm Password <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    required
                                    className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white border ${errors.confirmPassword ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-charcoal mb-4">You&apos;re All Set!</h2>

                        <p className="text-xl text-charcoal/70 mb-8">
                            Your account has been created. Access your dashboard to manage your property listing and connect with verified agents.
                        </p>

                        <div className="premium-card rounded-xl p-6 text-left max-w-md mx-auto bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-charcoal font-bold mb-4 border-b border-charcoal/20 pb-2">Summary</h3>
                            <div className="space-y-2 text-charcoal/70">
                                <div className="flex justify-between">
                                    <span>Property:</span>
                                    <span className="font-semibold text-charcoal">{formData.propertyType || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estimated Value:</span>
                                    <span className="font-semibold text-charcoal">R {formData.currentValue ? parseFloat(formData.currentValue).toLocaleString() : '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Timeline:</span>
                                    <span className="font-semibold text-charcoal capitalize">{formData.timeline ? formData.timeline.replace('-', ' to ') : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link href="/sellers" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Sellers Hub</span>
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
            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
                <div className="container mx-auto max-w-4xl relative z-10">
                    {/* Progress Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30">
                            <span className="text-gold font-semibold">Step {currentStep} of {totalSteps}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-gold transition-all duration-500 ease-out"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Quiz Card */}
                    <div className="premium-card rounded-2xl p-8 md:p-12 min-h-[500px] flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2 text-center">
                            Let&apos;s Get Your Property Ready to Sell!
                        </h1>

                        <p className="text-charcoal/60 mb-8 text-center">
                            Answer a few questions to get a free property valuation and connect with verified agents.
                        </p>

                        {/* Dynamic Step Content */}
                        <div className="flex-grow">
                            {renderStepContent()}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-12 pt-6 border-t border-charcoal/10">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`px-6 py-3 rounded-lg border border-charcoal/20 text-charcoal font-semibold transition-all ${currentStep === 1
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-charcoal/5'
                                    }`}
                            >
                                Previous
                            </button>

                            <button
                                onClick={handleNext}
                                className="inline-flex items-center space-x-2 px-8 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                            >
                                <span>{currentStep === totalSteps ? 'Create Account & Go to Dashboard' : 'Next Step'}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Trust Message */}
                    <div className="text-center mt-8">
                        <p className="text-charcoal/70 text-sm flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Your information is secure and encrypted
                        </p>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
            </main>
        </div>
    );
}
