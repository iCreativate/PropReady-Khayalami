import Link from 'next/link';
import { ArrowLeft, BookOpen, Home, FileText, Calculator, Users, Coins, Wallet, Building2, Scale, AlertCircle, ShieldCheck, Briefcase } from 'lucide-react';

export default function LearnPage() {
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
                            <span className="text-gold font-semibold">Learning Center - Buyers</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-charcoal mb-6">
                            Master Your Home Journey
                        </h1>

                        <p className="text-xl text-charcoal/90 max-w-3xl mx-auto">
                            Everything you need to know about buying your first home in South Africa.
                            Learn at your own pace with our comprehensive guides.
                        </p>
                    </div>

                    {/* Learning Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Module 1 */}
                        <Link href="/learn/home-loans" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Calculator className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Understanding Home Loans
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn about bond applications, interest rates, deposit requirements,
                                    and why you should use a bond originator.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 2 */}
                        <Link href="/learn/buying-process" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <FileText className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    The Buying Process
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Step-by-step guide through property search, making an offer,
                                    transfer costs, conveyancers, and registration.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 3 */}
                        <Link href="/learn/agents" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Users className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Working with Agents
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    How to find and select the right estate agent, understanding commission,
                                    and how PropReady connects you with verified professionals.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 4 */}
                        <Link href="/learn/first-time-tips" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Home className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    First-Time Buyer Tips
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Essential advice for first-time buyers including budgeting,
                                    hidden costs, inspection tips, and making smart decisions.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 5 */}
                        <Link href="/learn/transfer-costs" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Wallet className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Transfer & Hidden Costs
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    A detailed breakdown of transfer duties, attorney fees, and bond registration costs
                                    based on property value.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 6 */}
                        <Link href="/learn/flisp-subsidy" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Coins className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Government Subsidies (FLISP)
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Learn about the Finance Linked Individual Subsidy Programme (FLISP)
                                    and how it can help you buy your first home if you earn between R3,501 and R22,000.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 7 - Buying a Deceased Estate */}
                        <Link href="/learn/buying-deceased-estate" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Building2 className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Buying a Deceased Estate
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    What you need to know when buying a property from a deceased estate:
                                    executors, Master&apos;s Office, delays, and how to protect yourself.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 8 - Understanding Trusts */}
                        <Link href="/learn/understanding-trusts" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Scale className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Understanding Trusts
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Buying property held in a trust: trustees, consent, bond implications,
                                    and what to check before you sign.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 9 - Mistakes First-Time Buyers Make */}
                        <Link href="/learn/first-time-buyer-mistakes" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <AlertCircle className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Mistakes First-Time Buyers Make
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Common pitfalls: skipping pre-qualification, ignoring hidden costs,
                                    emotional bidding, and how to avoid them.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 10 - What to Avoid When Applying for a Bond */}
                        <Link href="/learn/bond-application-avoid" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <ShieldCheck className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    What to Avoid When Applying for a Bond
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    Don&apos;t make these mistakes: job-hopping, new credit, incomplete documents,
                                    and other factors that can delay or derail your bond approval.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>

                        {/* Module 11 - Buying a Property as a Business */}
                        <Link href="/learn/buying-property-as-business" className="block">
                            <div className="premium-card rounded-xl p-8 cursor-pointer h-full group">
                                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                    <Briefcase className="w-8 h-8 text-gold" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold mb-4">
                                    Buying a Property as a Business
                                </h3>
                                <p className="text-charcoal/60 mb-6 leading-relaxed">
                                    What is required when buying property in a company or close corporation name:
                                    documents, bond requirements, and tax considerations.
                                </p>
                                <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                                    <span>Start Learning</span>
                                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 premium-card rounded-2xl p-12 text-center bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h2 className="text-3xl font-bold text-charcoal mb-4">
                            Ready to Start Your Journey?
                        </h2>
                        <p className="text-lg text-charcoal/60 mb-8">
                            Take our quick quiz to get pre-qualified and see your property matches
                        </p>
                        <Link
                            href="/quiz"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                        >
                            <span>Get Started Now</span>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </Link>
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
