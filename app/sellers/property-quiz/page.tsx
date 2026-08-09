'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Square, FileText, AlertCircle } from 'lucide-react';
import SellerPortalShell from '@/components/SellerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import QuizWizardShell from '@/components/quiz/QuizWizardShell';
import { QuizPublicHeader, QuizStepHeader } from '@/components/quiz/quiz-ui';

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
        // Store property quiz information and append a seller property record
        if (typeof window !== 'undefined') {
            const userRaw = localStorage.getItem('propReady_currentUser');
            const user = userRaw ? JSON.parse(userRaw) : null;
            const propertyQuizInfo = {
                ...formData,
                timestamp: new Date().toISOString(),
                id: `property-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: user?.id,
                email: user?.email,
            };

            const existingQuizzes = JSON.parse(localStorage.getItem('propReady_propertyQuizzes') || '[]');
            existingQuizzes.push(propertyQuizInfo);
            localStorage.setItem('propReady_propertyQuizzes', JSON.stringify(existingQuizzes));

            if (user?.id) {
                const { upsertSellerProperty } = await import('@/lib/seller-properties');
                upsertSellerProperty({
                    userId: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    phone: user.phone || '',
                    propertyAddress: formData.propertyAddress.trim(),
                    propertySize: formData.propertySize,
                    propertyCondition: formData.propertyCondition,
                    propertyDescription: formData.propertyDescription,
                });
            }
        }

        // Redirect to valuation booking page
        router.push('/sellers/quiz');
    };

    // Render step content based on currentStep
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-5 quiz-step-enter">
                        <QuizStepHeader
                            title="Property Address"
                            subtitle="Let's start with your property location"
                        />

                        <div className="quiz-field-card">
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
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.propertyAddress ? 'form-control-error' : 'border-charcoal/20'} text-charcoal placeholder:text-charcoal/35 form-control`}
                                />
                            </div>
                            {errors.propertyAddress && (
                                <p className="form-error">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertyAddress}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-5 quiz-step-enter">
                        <QuizStepHeader title="Property Details" />

                        <div className="quiz-field-card">
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
                                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${errors.propertySize ? 'form-control-error' : 'border-charcoal/20'} text-charcoal placeholder:text-charcoal/35 form-control`}
                                />
                            </div>
                            {errors.propertySize && (
                                <p className="form-error">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertySize}
                                </p>
                            )}
                        </div>

                        <div className="quiz-field-card">
                            <label className="block text-charcoal font-semibold text-lg mb-4">
                                Property Condition <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="propertyCondition"
                                value={formData.propertyCondition}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg bg-white border ${errors.propertyCondition ? 'form-control-error' : 'border-charcoal/20'} text-charcoal form-control [&>option]:text-charcoal`}
                            >
                                <option value="">Select property condition</option>
                                <option value="excellent">Excellent - Like new, recently renovated</option>
                                <option value="very-good">Very Good - Well maintained, minor wear</option>
                                <option value="good">Good - Some wear, needs minor repairs</option>
                                <option value="fair">Fair - Needs some repairs and updates</option>
                                <option value="needs-work">Needs Work - Requires significant repairs</option>
                            </select>
                            {errors.propertyCondition && (
                                <p className="form-error">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.propertyCondition}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-5 quiz-step-enter">
                        <QuizStepHeader
                            title="Property Description"
                            subtitle="Tell us more about your property (optional but recommended)"
                        />

                        <div className="quiz-field-card">
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
                                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder:text-charcoal/35 form-control"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const propertyQuizPublicHeader = (
        <QuizPublicHeader backHref="/sellers" backLabel="Back to Sellers Hub" />
    );

    return (
        <SellerPortalShell
            activePage="property-quiz"
            title="List Property"
            publicChrome={propertyQuizPublicHeader}
            pageHeader={
                <PortalPageHeader
                    eyebrow="Seller onboarding"
                    title="List Your Property"
                    description="Share a few details so we can match you with the right valuation and listing support."
                    glassLabel="Listing pulse"
                    metrics={[
                        { label: 'Step', value: `${currentStep} of ${totalSteps}` },
                        {
                            label: 'Progress',
                            value: `${Math.round((currentStep / totalSteps) * 100)}%`,
                        },
                    ]}
                    stats={[
                        { label: 'Current step', value: currentStep },
                        { label: 'Steps total', value: totalSteps },
                        {
                            label: 'Progress',
                            value: `${Math.round((currentStep / totalSteps) * 100)}%`,
                            tone: 'success',
                        },
                        { label: 'Goal', value: 'List & match' },
                    ]}
                />
            }
        >
            <QuizWizardShell
                title="Tell Us About Your Property"
                subtitle="Help us understand your property better to provide you with an accurate valuation."
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={handlePrevious}
                onNext={handleNext}
                previousDisabled={currentStep === 1}
                nextLabel={currentStep === totalSteps ? 'Continue to Valuation' : 'Next Step'}
            >
                {renderStepContent()}
            </QuizWizardShell>
        </SellerPortalShell>
    );
}
