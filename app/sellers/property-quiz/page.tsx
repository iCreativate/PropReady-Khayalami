'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, MapPin, Square, FileText, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function PropertyQuizPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        propertyAddress: '',
        propertySize: '',
        propertyCondition: '',
        propertyDescription: ''
    });

    const totalSteps = 3;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.propertyAddress.trim()) {
                    newErrors.propertyAddress = 'Property address is required';
                }
                break;
            case 2:
                if (!formData.propertySize.trim()) {
                    newErrors.propertySize = 'Property size is required';
                } else if (parseFloat(formData.propertySize) <= 0) {
                    newErrors.propertySize = 'Property size must be greater than 0';
                }
                if (!formData.propertyCondition) {
                    newErrors.propertyCondition = 'Property condition is required';
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
        // Store property quiz information
        if (typeof window !== 'undefined') {
            const propertyQuizInfo = {
                ...formData,
                timestamp: new Date().toISOString(),
                id: `property-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Store in localStorage
            const existingQuizzes = JSON.parse(localStorage.getItem('propReady_propertyQuizzes') || '[]');
            existingQuizzes.push(propertyQuizInfo);
            localStorage.setItem('propReady_propertyQuizzes', JSON.stringify(existingQuizzes));
        }

        // Redirect to valuation booking page
        router.push('/sellers/quiz');
    };

    // Render step content based on currentStep
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Address</h2>
                        <p className="text-charcoal/60 mb-6 text-center">
                            Let&apos;s start with your property location
                        </p>

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
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Details</h2>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Size (m²) <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <Square className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="number"
                                    name="propertySize"
                                    value={formData.propertySize}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 150"
                                    required
                                    min="0"
                                    step="0.01"
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.propertySize ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold`}
                                />
                            </div>
                            {errors.propertySize && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertySize}
                                </p>
                            )}
                        </div>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Condition <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="propertyCondition"
                                value={formData.propertyCondition}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.propertyCondition ? 'border-red-500/30' : 'border-charcoal/20'} text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal`}
                            >
                                <option value="">Select property condition</option>
                                <option value="excellent">Excellent - Like new, recently renovated</option>
                                <option value="very-good">Very Good - Well maintained, minor wear</option>
                                <option value="good">Good - Some wear, needs minor repairs</option>
                                <option value="fair">Fair - Needs some repairs and updates</option>
                                <option value="needs-work">Needs Work - Requires significant repairs</option>
                            </select>
                            {errors.propertyCondition && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertyCondition}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Property Description</h2>
                        <p className="text-charcoal/60 mb-6 text-center">
                            Tell us more about your property (optional but recommended)
                        </p>

                        <div className="premium-card rounded-xl p-6">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Description <span className="text-charcoal/50 text-sm">(Optional)</span>
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 w-5 h-5 text-charcoal/40" />
                                <textarea
                                    name="propertyDescription"
                                    value={formData.propertyDescription}
                                    onChange={handleInputChange}
                                    placeholder="Describe your property... Include features like number of bedrooms, bathrooms, garden, pool, security features, recent renovations, etc."
                                    rows={8}
                                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
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
                            Tell Us About Your Property
                        </h1>

                        <p className="text-charcoal/60 mb-8 text-center">
                            Help us understand your property better to provide you with an accurate valuation.
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
                                <span>{currentStep === totalSteps ? 'Continue to Valuation' : 'Next Step'}</span>
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
