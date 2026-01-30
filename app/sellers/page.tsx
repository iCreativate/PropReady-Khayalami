import Link from 'next/link';
import { ArrowLeft, BookOpen, Home, FileText, TrendingUp, Users, DollarSign, CheckCircle, Target, BarChart3, Calendar, Building2, Scale, AlertCircle, ShieldCheck, Briefcase } from 'lucide-react';

export default function SellersHubPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-charcoal/5">
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
                        <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 mb-6 shadow-lg">
                            <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gold font-semibold text-sm md:text-base">Sellers Hub</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-charcoal mb-6">
                            Sell Your Property with Confidence
                        </h1>

                        <p className="text-xl text-charcoal/60 max-w-3xl mx-auto mb-8">
                            Everything you need to know about selling your property in South Africa.
                            Learn at your own pace with our comprehensive guides for sellers.
                        </p>
                        <Link
                            href="/sellers/property-quiz"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transform hover:scale-105 transition-all shadow-xl"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Book a Free Valuation</span>
                        </Link>
                    </div>

                    {/* Learning Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {/* Module 1 */}
                        <Link href="/sellers/pricing-strategy" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <DollarSign className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Pricing Your Property
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn how to determine the right asking price, understand market valuations,
                                    and set competitive prices that attract buyers.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 2 */}
                        <Link href="/sellers/agent-selection" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <Users className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Choosing the Right Agent
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Understand agent commissions, sole mandates vs open mandates,
                                    and how to select an agent who will sell your property quickly.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 3 */}
                        <Link href="/sellers/marketing" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <Target className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Marketing Your Property
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn about property photography, staging, online listings,
                                    and effective marketing strategies to reach qualified buyers.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 4 */}
                        <Link href="/sellers/sale-process" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <FileText className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    The Selling Process
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Step-by-step guide through accepting offers, negotiating terms,
                                    conveyancing, and what to expect during the transfer process.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 5 */}
                        <Link href="/sellers/costs" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <BarChart3 className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Selling Costs & Fees
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Understand agent commissions, bond cancellation fees,
                                    rates and levies, and all costs associated with selling your property.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 6 */}
                        <Link href="/sellers/tips" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <CheckCircle className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Seller Tips & Best Practices
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Essential tips for preparing your home for sale, handling viewings,
                                    negotiating offers, and maximizing your property&apos;s value.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 7 - Selling a Deceased Estate */}
                        <Link href="/sellers/selling-deceased-estate" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <Building2 className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Selling a Deceased Estate
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    What you need to know when selling property from a deceased estate:
                                    executors, Master&apos;s Office, timelines, and your role as seller.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 8 - Understanding Trusts */}
                        <Link href="/sellers/understanding-trusts" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <Scale className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Understanding Trusts
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Selling property held in a trust: trustee authority, resolutions,
                                    bond cancellation, and what buyers and conveyancers need from you.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 9 - Mistakes First-Time Sellers Make */}
                        <Link href="/sellers/first-time-seller-mistakes" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <AlertCircle className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Mistakes First-Time Sellers Make
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Common pitfalls: overpricing, skipping prep, poor photos,
                                    and how to avoid them to sell faster and at a better price.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 10 - What to Avoid When Selling */}
                        <Link href="/sellers/selling-pitfalls" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <ShieldCheck className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    What to Avoid When Selling
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Don&apos;t make these mistakes: hiding defects, poor staging,
                                    ignoring bond clearance, and other pitfalls that delay or derail a sale.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 11 - Selling a Property Under a Business */}
                        <Link href="/sellers/selling-property-under-business" className="block">
                            <div className="premium-card rounded-2xl p-8 cursor-pointer h-full group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5 border border-charcoal/10 hover:border-gold/30">
                                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300 border border-gold/20 shadow-lg">
                                    <Briefcase className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4 group-hover:text-gold-600 transition-colors">
                                    Selling a Property Under a Business
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    What is required when selling property held by a company or close corporation:
                                    resolutions, bond cancellation, and tax considerations.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 premium-card rounded-3xl p-12 text-center bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 shadow-xl">
                        <h2 className="text-3xl font-bold text-charcoal mb-4">
                            Ready to List Your Property?
                        </h2>
                        <p className="text-lg text-charcoal/60 mb-8">
                            Connect with verified agents who can help you sell your property quickly and at the best price
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/sellers/property-quiz"
                                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transform hover:scale-105 transition-all shadow-xl"
                            >
                                <Calendar className="w-5 h-5" />
                                <span>Book a Free Valuation</span>
                            </Link>
                            <Link
                                href="/agents/login"
                                className="inline-flex items-center space-x-2 px-8 py-4 border-2 border-gold text-gold font-semibold rounded-xl hover:bg-gold/10 transform hover:scale-105 transition-all"
                            >
                                <span>Find an Agent</span>
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold/40 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/30 rounded-full blur-3xl"></div>
                </div>
            </main>
        </div>
    );
}

