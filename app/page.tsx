import Link from 'next/link';
import { ArrowRight, Home, ShieldCheck, TrendingUp } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/learn" className="text-charcoal/90 hover:text-charcoal transition">
                            Learning Center | Buyers
                        </Link>
                        <Link
                            href="/sellers"
                            className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                        >
                            For Sellers
                        </Link>
                        <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                            Properties
                        </Link>
                        <Link href="/calculator" className="text-charcoal/90 hover:text-charcoal transition">
                            Bond Calculator
                        </Link>
                        <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                            Dashboard
                        </Link>
                        <Link
                            href="/agents/login"
                            className="px-4 py-2 border border-charcoal/30 rounded-lg text-charcoal hover:bg-charcoal/10 transition"
                        >
                            Agent Login
                        </Link>
                    </div>

                    <MobileNav
                        links={[
                            { href: '/learn', label: 'Learning Center | Buyers' },
                            { href: '/sellers', label: 'For Sellers', isButton: true },
                            { href: '/search', label: 'Properties' },
                            { href: '/calculator', label: 'Bond Calculator' },
                            { href: '/dashboard', label: 'Dashboard' },
                            { href: '/agents/login', label: 'Agent Login' },
                        ]}
                    />
                </nav>
            </header>

            {/* Hero Section */}
            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24">
                <div className="container mx-auto text-center relative z-10">
                    {/* Free Badge */}
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-8 animate-pulse">
                        <span className="text-gold font-semibold">100% FREE FOR BUYERS AND SELLERS</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold text-charcoal mb-6 leading-tight">
                        Your Home. Ready.<br />
                        <span className="text-gold">iKhayalami.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-charcoal/90 mb-12 max-w-3xl mx-auto">
                        Get pre-qualified for a home loan in minutes. Connect with verified agents.
                        Find your dream home. All for free.
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="/quiz"
                        className="inline-flex items-center space-x-2 px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-2xl"
                    >
                        <span>Start My Home Journey</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    {/* Trust Indicators */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white border border-charcoal/10 shadow-lg p-6 rounded-xl">
                            <ShieldCheck className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h3 className="text-charcoal font-semibold text-lg mb-2">Pre-Qualified Buyers</h3>
                            <p className="text-charcoal/70">Get approved before you search</p>
                        </div>

                        <div className="bg-white border border-charcoal/10 shadow-lg p-6 rounded-xl">
                            <Home className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h3 className="text-charcoal font-semibold text-lg mb-2">Verified Agents</h3>
                            <p className="text-charcoal/70">Connect with EAAB registered professionals</p>
                        </div>

                        <div className="bg-white border border-charcoal/10 shadow-lg p-6 rounded-xl">
                            <TrendingUp className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h3 className="text-charcoal font-semibold text-lg mb-2">PropReady Score</h3>
                            <p className="text-charcoal/70">See how well properties match you</p>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
            </main>
        </div>
    );
}
