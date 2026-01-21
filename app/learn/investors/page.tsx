import Link from 'next/link';
import { ArrowLeft, BookOpen, Home, TrendingUp, DollarSign, Building2, BarChart3, Target, PiggyBank, AlertTriangle } from 'lucide-react';

export default function InvestorsLearnPage() {
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
            <main className="relative min-h-screen px-4 pt-32 pb-16">
                <div className="container mx-auto max-w-6xl relative z-10">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                            <BookOpen className="w-5 h-5 text-gold" />
                            <span className="text-gold font-semibold">Learning Center - Property Investors</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-charcoal mb-6">
                            Build Your Property Portfolio
                        </h1>

                        <p className="text-xl text-charcoal/90 max-w-3xl mx-auto">
                            Master the art of property investment in South Africa. Learn strategies, analyze returns,
                            and build wealth through real estate.
                        </p>
                    </div>

                    {/* Learning Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Module 1 */}
                        <Link href="/learn/investors/strategies" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Target className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Investment Strategies
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn about buy-to-let, fix-and-flip, commercial property, and other proven
                                    investment strategies for the South African market.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 2 */}
                        <Link href="/learn/investors/returns" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <BarChart3 className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Calculating Returns
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Master ROI, rental yield, capital growth, and cash flow analysis to make
                                    informed investment decisions.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 3 */}
                        <Link href="/learn/investors/financing" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <DollarSign className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Investment Financing
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Understand investment property loans, deposit requirements, interest rates,
                                    and leveraging strategies for portfolio growth.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 4 */}
                        <Link href="/learn/investors/tax" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <PiggyBank className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Tax & Legal Considerations
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn about rental income tax, capital gains tax, deductions, and legal
                                    structures for property investment in South Africa.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 5 */}
                        <Link href="/learn/investors/portfolio" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Building2 className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Portfolio Management
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Strategies for managing multiple properties, tenant relations, maintenance,
                                    and scaling your investment portfolio effectively.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 6 */}
                        <Link href="/learn/investors/market-analysis" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <TrendingUp className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Market Analysis
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn how to analyze property markets, identify growth areas, assess
                                    property values, and spot investment opportunities.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 7 */}
                        <Link href="/learn/investors/mistakes" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors border border-red-500/20">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-red-600 mb-4">
                                    Common Mistakes to Avoid
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn from the mistakes of others. Discover the most common pitfalls
                                    property investors face and how to avoid them to protect your investment.
                                </p>
                                <div className="flex items-center text-red-600 font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 premium-card rounded-2xl p-12 text-center bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h2 className="text-3xl font-bold text-charcoal mb-4">
                            Ready to Start Investing?
                        </h2>
                        <p className="text-lg text-charcoal/60 mb-8">
                            Connect with verified agents and explore investment properties
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/search"
                                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                            >
                                <span>Browse Investment Properties</span>
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </Link>
                            <Link
                                href="/learn"
                                className="inline-flex items-center justify-center space-x-2 px-8 py-4 border-2 border-gold text-gold font-semibold rounded-lg hover:bg-gold/10 transform hover:scale-105 transition-all"
                            >
                                <span>Buyer Learning Center</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
            </main>
        </div>
    );
}
