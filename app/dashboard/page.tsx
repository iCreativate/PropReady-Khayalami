'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FileText, Heart, Users, TrendingUp, Download, Calendar, ArrowLeft, Building2, Phone, ExternalLink, CheckCircle, X, MapPin, Clock } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

interface Originator {
    name: string;
    description: string;
    rating: string;
    features: string[];
    phone: string;
    website: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [selectedOriginator, setSelectedOriginator] = useState<Originator | null>(null);
    const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; id?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quizResult, setQuizResult] = useState<{
        score: number;
        preQualAmount: number;
        monthlyIncome: string;
        depositSaved: string;
        fullName: string;
    } | null>(null);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [isSeller, setIsSeller] = useState(false);
    const [viewingAppointments, setViewingAppointments] = useState<any[]>([]);

    useEffect(() => {
        // Check if user is logged in and load quiz results
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);
                
                // Check if user is a seller
                const storedSellerInfo = localStorage.getItem('propReady_sellerInfo');
                if (storedSellerInfo) {
                    const seller = JSON.parse(storedSellerInfo);
                    // Check if seller info belongs to current user
                    if (seller.id === user.id || seller.email === user.email) {
                        setSellerInfo(seller);
                        setIsSeller(true);
                    }
                }
                
                // Load quiz result (buyer)
                const storedQuizResult = localStorage.getItem('propReady_quizResult');
                if (storedQuizResult) {
                    const result = JSON.parse(storedQuizResult);
                    // Check if quiz result belongs to current user
                    if (result.id === user.id || result.email === user.email) {
                        setQuizResult({
                            score: result.score || 0,
                            preQualAmount: result.preQualAmount || 0,
                            monthlyIncome: result.monthlyIncome || '0',
                            depositSaved: result.depositSaved || '0',
                            fullName: result.fullName || 'User'
                        });
                    }
                }

                // Load viewing appointments for this user (buyer)
                const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
                const quizData = JSON.parse(localStorage.getItem('propReady_quizResult') || '{}');
                const userViewings = storedViewings.filter((v: any) => 
                    v.contactType === 'buyer' && (
                        v.contactName.toLowerCase() === user.fullName.toLowerCase() ||
                        v.contactEmail.toLowerCase() === user.email.toLowerCase() ||
                        (quizData.phone && v.contactPhone.replace(/\s/g, '') === quizData.phone.replace(/\s/g, ''))
                    )
                );
                setViewingAppointments(userViewings);
                
                setIsLoading(false);
            } else {
                // Redirect to login if not authenticated
                router.push('/login');
            }
        }
    }, [router]);

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 65) return 'Very Good';
        if (score >= 50) return 'Good';
        if (score >= 35) return 'Fair';
        return 'Needs Improvement';
    };

    const calculateMonthlyBudget = (preQualAmount: number) => {
        // Estimate monthly repayment based on pre-qual amount
        // Using typical 20-year loan at ~10% interest rate
        // Simplified calculation: (amount * 0.10) / 12 for rough estimate
        // More accurate: Using mortgage formula approximation
        const annualRate = 0.10; // 10% annual interest
        const years = 20;
        const monthlyRate = annualRate / 12;
        const numPayments = years * 12;
        
        if (preQualAmount === 0) return 0;
        
        // Mortgage payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
        const monthlyPayment = preQualAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                               (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        return Math.round(monthlyPayment);
    };

    const generateSuggestedProperties = () => {
        if (!quizResult || quizResult.preQualAmount === 0) {
            return [];
        }

        const preQualAmount = quizResult.preQualAmount;
        const propReadyScore = quizResult.score || 0;
        
        // Property types
        const propertyTypes = ['Apartment', 'Townhouse', 'House', 'Duplex'];
        const locations = [
            'iKhayalami, Johannesburg',
            'Sandton, Johannesburg',
            'Rosebank, Johannesburg',
            'Fourways, Johannesburg',
            'Randburg, Johannesburg'
        ];

        // Generate properties within 80-120% of prequalification amount
        // Higher PropReady Score = properties closer to prequal amount
        const scoreMultiplier = propReadyScore / 100; // 0 to 1
        const minPrice = preQualAmount * (0.75 + scoreMultiplier * 0.1); // 75-85% for high scores
        const maxPrice = preQualAmount * (1.15 - scoreMultiplier * 0.1); // 105-115% for high scores

        const properties = [];
        for (let i = 0; i < 3; i++) {
            // Generate price within range, with some variation
            const priceVariation = (maxPrice - minPrice) / 3;
            const basePrice = minPrice + (priceVariation * i);
            const propertyPrice = Math.round(basePrice + (Math.random() * priceVariation * 0.5 - priceVariation * 0.25));

            // Calculate match score based on:
            // 1. How close price is to prequal amount (60% weight)
            // 2. PropReady Score (40% weight)
            const priceDifference = Math.abs(propertyPrice - preQualAmount);
            const maxDifference = preQualAmount * 0.3; // 30% max difference
            const priceMatch = Math.max(0, 100 - (priceDifference / maxDifference) * 60);
            const scoreMatch = propReadyScore * 0.4;
            const matchScore = Math.round(priceMatch + scoreMatch);

            properties.push({
                id: `suggested-${i + 1}`,
                type: propertyTypes[i % propertyTypes.length],
                location: locations[i % locations.length],
                price: propertyPrice,
                matchScore: Math.min(100, Math.max(60, matchScore)) // Clamp between 60-100%
            });
        }

        // Sort by match score (highest first)
        return properties.sort((a, b) => b.matchScore - a.matchScore);
    };

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/70">Loading...</p>
                </div>
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
                            <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                                Properties
                            </Link>
                            <Link href="/learn" className="text-charcoal/90 hover:text-charcoal transition">
                                Learning Center for Buyers
                            </Link>
                            <Link
                                href="/sellers"
                                className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                For Sellers
                            </Link>
                            <Link href="/calculator" className="text-charcoal/90 hover:text-charcoal transition">
                                Bond Calculator
                            </Link>
                            <Link href="/dashboard" className="text-gold font-semibold">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <MobileNav
                            links={[
                                { href: '/search', label: 'Properties' },
                                { href: '/learn', label: 'Learning Center for Buyers' },
                                { href: '/sellers', label: 'For Sellers', isButton: true },
                                { href: '/calculator', label: 'Bond Calculator' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ]}
                        />
                        {currentUser && (
                            <div className="text-right">
                                <p className="text-charcoal/70 text-sm">Welcome back</p>
                                <p className="text-charcoal font-semibold">{currentUser.fullName}</p>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('propReady_currentUser');
                                    router.push('/login');
                                }
                            }}
                            className="px-4 py-2 rounded-lg border border-charcoal/30 text-charcoal hover:bg-charcoal/10 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            Welcome back, {quizResult?.fullName || currentUser?.fullName || 'User'}! 👋
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            {isSeller && quizResult 
                                ? "Here's your home buying and selling journey at a glance"
                                : "Here's your home buying journey at a glance"
                            }
                        </p>
                    </div>

                    {/* Seller Information Section (if user is also a seller) */}
                    {isSeller && sellerInfo && (
                        <div className="premium-card rounded-2xl p-8 mb-8 relative overflow-hidden border-2 border-gold/30">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-charcoal mb-1">Your Property Listing</h2>
                                            <p className="text-charcoal/50 text-sm">Selling your property</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/sellers/dashboard"
                                        className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-600 transition"
                                    >
                                        Go to Seller Dashboard
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Property Value</p>
                                        <p className="text-charcoal font-bold text-xl">
                                            R {sellerInfo.currentValue ? parseFloat(sellerInfo.currentValue).toLocaleString() : '0'}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Property Type</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.propertyType || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Selling Timeline</p>
                                        <p className="text-charcoal font-bold text-sm capitalize">
                                            {sellerInfo.timeline ? sellerInfo.timeline.replace('-', ' to ') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl opacity-50"></div>
                        </div>
                    )}

                    {/* PropReady Score Card */}
                    <div className="premium-card rounded-2xl p-8 mb-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-charcoal mb-2">Your PropReady Score</h2>
                                    <p className="text-charcoal/60 text-sm">Based on your qualification quiz</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-bold text-gold mb-1">
                                        {quizResult?.score || 0}%
                                    </div>
                                    <p className="text-charcoal/50 text-sm font-medium">
                                        {quizResult ? getScoreLabel(quizResult.score) : 'No Score'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Pre-Qualification</p>
                                    <p className="text-charcoal font-bold text-xl">
                                        R {quizResult?.preQualAmount.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Monthly Budget</p>
                                    <p className="text-charcoal font-bold text-xl">
                                        R {quizResult ? calculateMonthlyBudget(quizResult.preQualAmount).toLocaleString() : '0'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Deposit Saved</p>
                                    <p className="text-charcoal font-bold text-xl">
                                        R {quizResult ? parseFloat(quizResult.depositSaved || '0').toLocaleString() : '0'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Link href="/search" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Home className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Browse Properties</h3>
                        </Link>

                        <Link href="/dashboard/documents" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <FileText className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">My Documents</h3>
                        </Link>

                        <Link href="/dashboard/agent" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Users className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">My Agent</h3>
                        </Link>

                        <Link href="/dashboard/viewings" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Calendar className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Viewings</h3>
                        </Link>
                    </div>

                    {/* Viewing Appointments Section */}
                    {viewingAppointments.length > 0 && (
                        <div className="premium-card rounded-2xl p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-1">Your Viewing Appointments</h2>
                                        <p className="text-charcoal/50 text-sm">Appointments scheduled by agents</p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/viewings"
                                    className="px-4 py-2 text-gold hover:underline text-sm font-semibold"
                                >
                                    View All
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {viewingAppointments.slice(0, 3).map((viewing) => (
                                    <div
                                        key={viewing.id}
                                        className="premium-card rounded-xl p-6 border border-charcoal/20 hover:border-gold/50 transition"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-charcoal mb-2">{viewing.propertyTitle}</h3>
                                                <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{viewing.propertyAddress}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-charcoal/70">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(viewing.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{viewing.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                viewing.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                viewing.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                viewing.status === 'cancelled' ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 border border-red-500/30' :
                                                'bg-gold/20 text-gold'
                                            }`}>
                                                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                                            </span>
                                        </div>
                                        {viewing.notes && (
                                            <div className="mt-4 pt-4 border-t border-charcoal/10">
                                                <p className="text-charcoal/60 text-sm">{viewing.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bond Originators Section */}
                    <div className="premium-card rounded-2xl p-8 mb-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-gold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-charcoal mb-1">Recommended Bond Originators</h2>
                                    <p className="text-charcoal/50 text-sm">Get help securing your home loan from trusted experts</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {[
                                {
                                    name: 'BetterBond',
                                    description: 'South Africa\'s leading bond originator',
                                    rating: '4.8/5',
                                    features: ['Free service', 'Multiple banks', 'Expert guidance'],
                                    phone: '0800007111',
                                    website: 'https://www.betterbond.co.za'
                                },
                                {
                                    name: 'Ooba',
                                    description: 'Compare deals from 20+ banks',
                                    rating: '4.7/5',
                                    features: ['No cost', 'Fast approval', 'Dedicated consultant'],
                                    phone: '0860006622',
                                    website: 'https://www.ooba.co.za'
                                },
                                {
                                    name: 'MultiNET Home Loans',
                                    description: 'Personalized solutions',
                                    rating: '4.6/5',
                                    features: ['Free pre-approval', 'Best rates', '24/7 support'],
                                    phone: '0861545444',
                                    website: 'https://www.multinet.co.za'
                                }
                            ].map((originator, index) => (
                                <div
                                    key={index}
                                    className="premium-card rounded-xl p-6 group"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-charcoal font-bold text-lg mb-2">{originator.name}</h3>
                                        <p className="text-charcoal/50 text-sm mb-3 leading-relaxed">{originator.description}</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gold text-sm font-semibold">★</span>
                                            <span className="text-charcoal/60 text-sm font-medium">{originator.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {originator.features.map((feature, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedOriginator(originator)}
                                            className="flex-1 px-3 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            Contact
                                        </button>
                                        <a 
                                            href={originator.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 hover:border-gold transition text-sm flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Visit
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gold/10 rounded-lg p-3 border border-gold/30">
                            <p className="text-charcoal/90 text-sm text-center flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gold" />
                                Bond originators work for free - banks pay their commission, not you!
                            </p>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Suggested Properties */}
                        <div className="lg:col-span-2">
                            <div className="premium-card rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal flex items-center mb-1">
                                            <Heart className="w-6 h-6 mr-2 text-gold" />
                                            Suggested Properties
                                        </h2>
                                        {quizResult && quizResult.preQualAmount > 0 && (
                                            <p className="text-charcoal/60 text-sm ml-8">
                                                Matched based on your R {quizResult.preQualAmount.toLocaleString()} prequalification and {quizResult.score}% PropReady Score
                                            </p>
                                        )}
                                    </div>
                                    <Link href="/search" className="text-gold hover:text-gold-600 font-semibold text-sm transition-colors">
                                        View All
                                    </Link>
                                </div>

                                {quizResult && quizResult.preQualAmount > 0 ? (
                                    <div className="space-y-3">
                                        {generateSuggestedProperties().map((property) => (
                                            <Link
                                                key={property.id}
                                                href="/search"
                                                className="premium-card rounded-lg p-4 flex items-center space-x-4 group hover:scale-[1.02] transition-all cursor-pointer"
                                            >
                                                <div className="w-20 h-20 bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold/20 group-hover:border-gold/40 transition-colors">
                                                    <Home className="w-8 h-8 text-gold/70" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-charcoal font-semibold mb-1">Modern {property.type}</h3>
                                                    <p className="text-charcoal/50 text-sm mb-2">{property.location}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gold font-bold text-lg">R {property.price.toLocaleString('en-ZA')}</span>
                                                        <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold">
                                                            {property.matchScore}% Match
                                                        </span>
                                                    </div>
                                                    <p className="text-charcoal/40 text-xs mt-1">
                                                        Based on your R {quizResult.preQualAmount.toLocaleString('en-ZA')} prequalification
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Home className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                        <p className="text-charcoal/70 text-lg mb-2">Complete the quiz to see suggested properties</p>
                                        <p className="text-charcoal/50 text-sm mb-4">
                                            Properties will be matched based on your prequalification amount and PropReady Score
                                        </p>
                                        <Link
                                            href="/quiz"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                                        >
                                            Take the Quiz
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity & Documents */}
                        <div className="space-y-6">
                            {/* Recent Activity */}
                            <div className="premium-card rounded-xl p-6">
                                <h2 className="text-xl font-bold text-charcoal mb-5 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-gold" />
                                    Recent Activity
                                </h2>
                                <div className="space-y-4">
                                    <div className="text-sm pb-3 border-b border-charcoal/10 last:border-0">
                                        <p className="text-charcoal font-medium mb-1">3 new properties suggested</p>
                                        <p className="text-charcoal/40 text-xs">2 hours ago</p>
                                    </div>
                                    <div className="text-sm pb-3 border-b border-charcoal/10 last:border-0">
                                        <p className="text-charcoal font-medium mb-1">Completed qualification quiz</p>
                                        <p className="text-charcoal/40 text-xs">Yesterday</p>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-charcoal font-medium mb-1">Uploaded ID document</p>
                                        <p className="text-charcoal/40 text-xs">3 days ago</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="premium-card rounded-xl p-6">
                                <h2 className="text-xl font-bold text-charcoal mb-5 flex items-center">
                                    <Download className="w-5 h-5 mr-2 text-gold" />
                                    My Documents
                                </h2>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm flex items-center justify-between">
                                        <span>Pre-Qualification Letter</span>
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm flex items-center justify-between">
                                        <span>ID Document</span>
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm flex items-center justify-between">
                                        <span>Proof of Income</span>
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
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
                                    <p className="text-charcoal/70 text-sm mb-1 font-semibold">Contact Number</p>
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
