'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home, CheckCircle, AlertCircle, Building2, Phone, ExternalLink, Mail, User, X, Lock, Eye, EyeOff } from 'lucide-react';

interface Originator {
    name: string;
    description: string;
    rating: string;
    features: string[];
    phone: string;
    website: string;
}

export default function QuizPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedOriginator, setSelectedOriginator] = useState<Originator | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        monthlyIncome: '',
        expenses: '',
        hasDebt: null as boolean | null,
        depositSaved: '',
        creditScore: '', // Optional/Self-reported
        employmentStatus: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const totalSteps = 8;

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

    const handleDebtSelection = (hasDebt: boolean) => {
        setFormData(prev => ({ ...prev, hasDebt }));
        
        // Clear error when user selects
        if (errors.hasDebt) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.hasDebt;
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
                    newErrors.phone = 'Please enter a valid South African phone number (e.g., 082 123 4567)';
                }
                break;
            case 2:
                if (!formData.monthlyIncome.trim()) {
                    newErrors.monthlyIncome = 'Monthly income is required';
                } else if (parseFloat(formData.monthlyIncome) <= 0) {
                    newErrors.monthlyIncome = 'Monthly income must be greater than 0';
                }
                if (!formData.employmentStatus) {
                    newErrors.employmentStatus = 'Employment status is required';
                }
                break;
            case 3:
                if (formData.hasDebt === null) {
                    newErrors.hasDebt = 'Please select whether you have existing debt';
                } else if (formData.hasDebt && !formData.expenses.trim()) {
                    newErrors.expenses = 'Monthly debt repayments are required when you have debt';
                } else if (formData.hasDebt && parseFloat(formData.expenses) < 0) {
                    newErrors.expenses = 'Monthly debt repayments cannot be negative';
                }
                break;
            case 4:
                if (!formData.depositSaved.trim()) {
                    newErrors.depositSaved = 'Deposit amount is required';
                } else if (parseFloat(formData.depositSaved) < 0) {
                    newErrors.depositSaved = 'Deposit amount cannot be negative';
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

    const calculatePropReadyScore = () => {
        let score = 0;
        const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
        const expenses = parseFloat(formData.expenses) || 0;
        const depositSaved = parseFloat(formData.depositSaved) || 0;

        // 1. Monthly Income Score (0-30 points)
        // Higher income = better score
        if (monthlyIncome >= 50000) score += 30;
        else if (monthlyIncome >= 30000) score += 25;
        else if (monthlyIncome >= 20000) score += 20;
        else if (monthlyIncome >= 15000) score += 15;
        else if (monthlyIncome >= 10000) score += 10;
        else if (monthlyIncome >= 5000) score += 5;
        else score += 0;

        // 2. Employment Status Score (0-20 points)
        const employmentScores: Record<string, number> = {
            'permanent': 20,
            'contract': 15,
            'self-employed': 12,
            'freelance': 10,
            'part-time': 8,
            'unemployed': 0
        };
        score += employmentScores[formData.employmentStatus] || 0;

        // 3. Debt-to-Income Ratio Score (0-25 points)
        // Lower ratio = better score
        if (monthlyIncome > 0) {
            const debtRatio = (expenses / monthlyIncome) * 100;
            if (debtRatio === 0) score += 25;
            else if (debtRatio <= 10) score += 22;
            else if (debtRatio <= 20) score += 18;
            else if (debtRatio <= 30) score += 12;
            else if (debtRatio <= 40) score += 6;
            else score += 0;
        }

        // 4. Deposit Saved Score (0-15 points)
        // Higher deposit = better score
        if (depositSaved >= 200000) score += 15;
        else if (depositSaved >= 150000) score += 12;
        else if (depositSaved >= 100000) score += 10;
        else if (depositSaved >= 50000) score += 7;
        else if (depositSaved >= 25000) score += 4;
        else if (depositSaved > 0) score += 2;
        else score += 0;

        // 5. Credit Score (if provided) (0-10 points)
        const creditScores: Record<string, number> = {
            'excellent': 10,
            'good': 7,
            'average': 4,
            'poor': 1
        };
        if (formData.creditScore) {
            score += creditScores[formData.creditScore] || 0;
        }

        // Ensure score is between 0-100
        return Math.min(Math.max(Math.round(score), 0), 100);
    };

    const calculatePreQualAmount = () => {
        const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
        const expenses = parseFloat(formData.expenses) || 0;

        // Calculate annual income
        const annualIncome = monthlyIncome * 12;

        // Calculate annual debt obligations
        const annualDebt = expenses * 12;

        // Calculate available annual income after debt
        const availableAnnualIncome = annualIncome - annualDebt;

        // Banks typically lend 3-5x annual income
        // Use a conservative multiplier of 3.5x based on available income
        let loanAmount = availableAnnualIncome * 3.5;

        // Ensure minimum of 0
        loanAmount = Math.max(0, loanAmount);

        // Cap at reasonable maximum (e.g., 5x annual income)
        const maxLoanAmount = annualIncome * 5;
        loanAmount = Math.min(loanAmount, maxLoanAmount);

        return Math.round(loanAmount);
    };

    const handleSubmit = async () => {
        // Calculate score and prequal amount based on user data
        const score = calculatePropReadyScore();
        const preQualAmount = calculatePreQualAmount();

        // Store result in localStorage to simulate persistence
        if (typeof window !== 'undefined') {
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Create user account
            const userAccount = {
                id: userId,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password, // In production, this should be hashed
                timestamp: new Date().toISOString()
            };

            // Store user account
            const existingUsers = JSON.parse(localStorage.getItem('propReady_users') || '[]');
            existingUsers.push(userAccount);
            localStorage.setItem('propReady_users', JSON.stringify(existingUsers));

            // Store quiz result
            const quizResult = {
                ...formData,
                score,
                preQualAmount,
                timestamp: new Date().toISOString(),
                id: userId
            };
            
            localStorage.setItem('propReady_quizResult', JSON.stringify(quizResult));

            // Store as a lead for agents
            const existingLeads = JSON.parse(localStorage.getItem('propReady_leads') || '[]');
            const lead = {
                id: userId,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                monthlyIncome: formData.monthlyIncome,
                depositSaved: formData.depositSaved,
                employmentStatus: formData.employmentStatus,
                creditScore: formData.creditScore,
                score,
                preQualAmount,
                status: 'new',
                timestamp: new Date().toISOString(),
                contactedAt: null
            };
            existingLeads.push(lead);
            localStorage.setItem('propReady_leads', JSON.stringify(existingLeads));

            // Store current user session
            localStorage.setItem('propReady_currentUser', JSON.stringify({
                id: userId,
                fullName: formData.fullName,
                email: formData.email
            }));
        }

        router.push('/dashboard');
    };

    // Render step content based on currentStep
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Let's Get Started</h2>
                        <p className="text-charcoal/60 mb-6 text-center">
                            We need some basic information to personalize your experience
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
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.fullName ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
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
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.email ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
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
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.phone ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
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
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Financial Overview</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                What's your total monthly household income (before tax)? <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                                <input
                                    type="number"
                                    name="monthlyIncome"
                                    value={formData.monthlyIncome}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 45000"
                                    required
                                    min="0"
                                    step="1000"
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-white border ${errors.monthlyIncome ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.monthlyIncome && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.monthlyIncome}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                What is your employment status? <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="employmentStatus"
                                value={formData.employmentStatus}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.employmentStatus ? 'border-red-500' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select status</option>
                                <option value="permanent">Permanent Employee</option>
                                <option value="contract">Contract Worker</option>
                                <option value="self-employed">Self-Employed</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.employmentStatus && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.employmentStatus}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Expenses & Debt</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Do you have any existing debt obligations? <span className="text-red-600">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleDebtSelection(true)}
                                    className={`px-6 py-3 rounded-lg border transition-all font-semibold ${formData.hasDebt === true
                                            ? 'bg-gold text-white border-gold'
                                            : errors.hasDebt 
                                            ? 'bg-white border-2 border-red-500 text-charcoal hover:bg-red-500/10'
                                            : 'bg-white border border-charcoal/20 text-charcoal hover:bg-charcoal/5'
                                        }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDebtSelection(false)}
                                    className={`px-6 py-3 rounded-lg border transition-all font-semibold ${formData.hasDebt === false
                                            ? 'bg-gold text-white border-gold'
                                            : errors.hasDebt 
                                            ? 'bg-white border-2 border-red-500 text-charcoal hover:bg-red-500/10'
                                            : 'bg-white border border-charcoal/20 text-charcoal hover:bg-charcoal/5'
                                        }`}
                                >
                                    No
                                </button>
                            </div>
                            {errors.hasDebt && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.hasDebt}
                                </p>
                            )}
                        </div>

                        {formData.hasDebt && (
                            <div className="premium-card rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-charcoal font-semibold text-lg mb-4">
                                    Total monthly debt repayments? <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                                    <input
                                        type="number"
                                        name="expenses"
                                        value={formData.expenses}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 5000"
                                        required
                                        min="0"
                                        step="100"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg bg-white border ${errors.expenses ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                    />
                                </div>
                                {errors.expenses && (
                                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.expenses}
                                    </p>
                                )}
                                <p className="text-charcoal/50 text-sm mt-2">Include car payments, credit cards, loans, etc.</p>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Savings & Deposit</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                How much do you have saved for a deposit? <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                                <input
                                    type="number"
                                    name="depositSaved"
                                    value={formData.depositSaved}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 100000"
                                    required
                                    min="0"
                                    step="1000"
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-white border ${errors.depositSaved ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.depositSaved && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.depositSaved}
                                </p>
                            )}
                            <div className="mt-4 flex items-start space-x-2 text-gold text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-charcoal/70">A higher deposit can help you get a better interest rate!</p>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Credit Profile</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Do you know your current credit score? (Optional)
                            </label>
                            <select
                                name="creditScore"
                                value={formData.creditScore}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                            >
                                <option value="">I'm not sure</option>
                                <option value="excellent">Excellent (650+)</option>
                                <option value="good">Good (600-649)</option>
                                <option value="average">Average (550-599)</option>
                                <option value="poor">Below Average (&lt;550)</option>
                            </select>
                        </div>

                        <div className="premium-card rounded-xl p-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <div className="flex items-center space-x-3 mb-2">
                                <CheckCircle className="text-gold w-6 h-6" />
                                <h3 className="text-charcoal font-bold text-lg">We'll do a soft check</h3>
                            </div>
                            <p className="text-charcoal/70 leading-relaxed">
                                Don't worry, this quiz won't affect your credit score. We just use this information to give you an accurate estimate.
                            </p>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-charcoal mb-4">Create Your Account</h2>

                        <p className="text-xl text-charcoal/70 mb-8">
                            Create a secure account to access your PropReady dashboard and track your home buying journey.
                        </p>

                        <div className="premium-card rounded-xl p-6 text-left max-w-md mx-auto">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-charcoal font-semibold text-lg mb-4">
                                        Create Password <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="At least 8 characters"
                                            required
                                            className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white border ${errors.password ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
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
                                        <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
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
                                            placeholder="Re-enter your password"
                                            required
                                            className={`w-full pl-12 pr-12 py-3 rounded-lg bg-white border ${errors.confirmPassword ? 'border-red-500' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
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
                                        <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-charcoal mb-4">You're All Set!</h2>

                        <p className="text-xl text-charcoal/70 mb-8">
                            We have everything we need to calculate your PropReady score and pre-qualification amount.
                        </p>

                        <div className="premium-card rounded-xl p-6 text-left max-w-md mx-auto bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-charcoal font-bold mb-4 border-b border-charcoal/20 pb-2">Summary</h3>
                            <div className="space-y-2 text-charcoal/70">
                                <div className="flex justify-between">
                                    <span>Name:</span>
                                    <span className="font-semibold text-charcoal">{formData.fullName || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Monthly Income:</span>
                                    <span className="font-semibold text-charcoal">R {formData.monthlyIncome || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Deposit:</span>
                                    <span className="font-semibold text-charcoal">R {formData.depositSaved || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Employment:</span>
                                    <span className="font-semibold text-charcoal capitalize">{formData.employmentStatus || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 8:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <Building2 className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-charcoal mb-2">Recommended Bond Originators</h2>
                            <p className="text-charcoal/60">
                                Connect with trusted bond originators to help secure your home loan
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    name: 'BetterBond',
                                    description: 'South Africa\'s leading bond originator',
                                    rating: '4.8/5',
                                    features: ['Free service', 'Multiple bank comparisons', 'Expert guidance'],
                                    phone: '0800007111',
                                    website: 'https://www.betterbond.co.za'
                                },
                                {
                                    name: 'Ooba',
                                    description: 'Compare deals from 20+ banks',
                                    rating: '4.7/5',
                                    features: ['No cost to you', 'Fast approval', 'Dedicated consultant'],
                                    phone: '0860006622',
                                    website: 'https://www.ooba.co.za'
                                },
                                {
                                    name: 'MultiNET Home Loans',
                                    description: 'Personalized home loan solutions',
                                    rating: '4.6/5',
                                    features: ['Free pre-approval', 'Best rates guaranteed', '24/7 support'],
                                    phone: '0861545444',
                                    website: 'https://www.multinet.co.za'
                                }
                            ].map((originator, index) => (
                                <div
                                    key={index}
                                    className="premium-card rounded-xl p-6 group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-charcoal font-bold text-lg mb-1">{originator.name}</h3>
                                            <p className="text-charcoal/50 text-sm mb-2">{originator.description}</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-gold text-sm font-semibold">★ {originator.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {originator.features.map((feature, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setSelectedOriginator(originator)}
                                            className="flex-1 px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Contact
                                        </button>
                                        <a 
                                            href={originator.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="premium-card rounded-xl p-4 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
                            <p className="text-charcoal/70 text-sm text-center">
                                <CheckCircle className="w-4 h-4 inline mr-2 text-gold" />
                                Bond originators work for free - banks pay their commission, not you!
                            </p>
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
                            Let's Get You PropReady!
                        </h1>

                        <p className="text-charcoal/60 mb-8 text-center">
                            Answer a few questions to unlock your home buying power.
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
                                <span>{currentStep === totalSteps ? 'Complete & View Dashboard' : 'Next Step'}</span>
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

            {/* Contact Modal */}
            {selectedOriginator && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                            <Phone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {selectedOriginator.name}
                                            </h2>
                                            <p className="text-white/90 text-sm">{selectedOriginator.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOriginator(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="text-center mb-6">
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm">
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Contact Number</p>
                                    <p className="text-2xl font-bold text-gold">
                                        {selectedOriginator.phone.length === 10 
                                            ? selectedOriginator.phone.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
                                            : selectedOriginator.phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${selectedOriginator.phone}`}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Now
                                </a>
                                <a
                                    href={selectedOriginator.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-xl hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Visit Website
                                </a>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setSelectedOriginator(null)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
