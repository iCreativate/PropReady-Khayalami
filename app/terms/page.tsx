import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-white">
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

            <main className="relative min-h-screen px-4 pt-24 pb-12">
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="premium-card rounded-2xl p-8 md:p-12 shadow-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Terms of Service</h1>
                        <p className="text-charcoal/70 mb-8">
                            Last updated:{' '}
                            {new Date().toLocaleDateString('en-ZA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>

                        <div className="prose prose-charcoal max-w-none space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">1. Acceptance of Terms</h2>
                                <p className="text-charcoal/80 leading-relaxed">
                                    By accessing or using PropReady-iKhayalami (&quot;the Platform&quot;), you agree to
                                    these Terms of Service. If you do not agree, please do not use the Platform.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">2. Services</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    PropReady provides property pre-qualification tools, educational content, document
                                    management features, and connections between buyers, sellers, and registered estate
                                    agents. Bond origination and home loan approval are provided by third-party
                                    financial institutions, not PropReady.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">3. User Accounts</h2>
                                <p className="text-charcoal/80 leading-relaxed">
                                    You are responsible for maintaining the confidentiality of your login credentials
                                    and for all activity under your account. You must provide accurate information when
                                    registering or completing quizzes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">4. Agent Registration</h2>
                                <p className="text-charcoal/80 leading-relaxed">
                                    Estate agents must hold valid EAAB/PPRA registration. PropReady may verify agent
                                    credentials before granting full platform access.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">5. Limitation of Liability</h2>
                                <p className="text-charcoal/80 leading-relaxed">
                                    Pre-qualification estimates and property suggestions are indicative only and do not
                                    constitute a loan offer or financial advice. PropReady is not liable for decisions
                                    made based on Platform content.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">6. Contact</h2>
                                <p className="text-charcoal/80 leading-relaxed">
                                    Questions about these terms:{' '}
                                    <a href="mailto:info@propready.co.za" className="text-gold hover:text-gold-600">
                                        info@propready.co.za
                                    </a>
                                </p>
                            </section>
                        </div>

                        <div className="mt-10 pt-6 border-t border-charcoal/10">
                            <Link href="/privacy" className="text-gold hover:text-gold-600 font-semibold text-sm">
                                View Privacy Policy →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
