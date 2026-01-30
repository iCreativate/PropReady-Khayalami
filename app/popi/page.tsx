import Link from 'next/link';
import { Home, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function POPIActPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-charcoal/5">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
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
            <main className="relative px-4 pt-24 pb-16">
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="rounded-3xl shadow-2xl border border-charcoal/10 bg-white/90 backdrop-blur-xl overflow-hidden">
                        {/* Card header */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-10 py-6 md:py-8 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            <div className="relative flex items-start gap-4">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                    <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                                        POPI Act
                                    </h1>
                                    <p className="text-white/90 text-sm md:text-base">
                                        Protection of Personal Information Act (South Africa). Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card body */}
                        <div className="px-6 md:px-10 py-8 md:py-10 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="space-y-6">
                                <section className="premium-card rounded-xl p-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                    <h2 className="text-xl font-bold text-gold mb-2">Our Commitment</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-0">
                                        PropReady-iKhayalami adheres to the <strong>Protection of Personal Information Act (POPI Act)</strong> of South Africa (Act 4 of 2013). We are committed to protecting your personal information and processing it lawfully, fairly, and in a transparent manner.
                                    </p>
                                </section>

                                <section className="premium-card rounded-xl p-6 bg-white/60 border border-charcoal/10">
                                    <h2 className="text-xl font-bold text-gold mb-3">1. What is the POPI Act?</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-0">
                                        The Protection of Personal Information Act (POPIA) is South African legislation that regulates how personal information is collected, processed, stored, and shared. It gives you rights over your personal data and requires responsible parties (like PropReady) to handle your information responsibly.
                                    </p>
                                </section>

                                <section className="premium-card rounded-xl p-6 bg-white/60 border border-charcoal/10">
                                    <h2 className="text-xl font-bold text-gold mb-3">2. How We Comply</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-4">
                                        We comply with POPI by:
                                    </p>
                                    <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                        <li><strong>Processing lawfully:</strong> We only collect and use personal information for legitimate purposes (e.g. pre-qualification, connecting you with agents, providing our services).</li>
                                        <li><strong>Minimising data:</strong> We collect only what is necessary for the purpose.</li>
                                        <li><strong>Keeping data accurate:</strong> We allow you to update your information and correct inaccuracies.</li>
                                        <li><strong>Securing data:</strong> We use appropriate technical and organisational measures to protect your information from unauthorised access, loss, or damage.</li>
                                        <li><strong>Respecting your rights:</strong> You can request access, correction, or deletion of your personal information (see our <Link href="/privacy" className="text-gold hover:text-gold-600 font-medium">Privacy Policy</Link>).</li>
                                        <li><strong>Not selling your data:</strong> We do not sell your personal information to third parties.</li>
                                    </ul>
                                </section>

                                <section className="premium-card rounded-xl p-6 bg-white/60 border border-charcoal/10">
                                    <h2 className="text-xl font-bold text-gold mb-3">3. Information We Process</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-0">
                                        In line with POPI, we process personal information such as your name, email, phone number, financial information (for pre-qualification), and property-related details. We use this only to provide our services, connect you with verified agents, and improve your experience. For full details, see our <Link href="/privacy" className="text-gold hover:text-gold-600 font-medium">Privacy Policy</Link>.
                                    </p>
                                </section>

                                <section className="premium-card rounded-xl p-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                    <h2 className="text-xl font-bold text-gold mb-3">4. Your Rights Under POPI</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-4">
                                        You have the right to:
                                    </p>
                                    <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4 mb-4">
                                        <li>Know what personal information we hold about you</li>
                                        <li>Request access to your personal information</li>
                                        <li>Request correction of inaccurate or incomplete information</li>
                                        <li>Object to the processing of your personal information in certain circumstances</li>
                                        <li>Request deletion of your personal information (subject to legal obligations)</li>
                                        <li>Lodge a complaint with the Information Regulator of South Africa</li>
                                    </ul>
                                    <p className="text-charcoal/80 leading-relaxed mb-0">
                                        To exercise these rights, contact us at <a href="mailto:info@propready.co.za" className="text-gold hover:text-gold-600 font-medium">info@propready.co.za</a>.
                                    </p>
                                </section>

                                <section className="premium-card rounded-xl p-6 bg-white/60 border border-charcoal/10">
                                    <h2 className="text-xl font-bold text-gold mb-3">5. Contact Us</h2>
                                    <p className="text-charcoal/80 leading-relaxed mb-0">
                                        For any questions about our POPI Act compliance or your personal information: <a href="mailto:info@propready.co.za" className="text-gold hover:text-gold-600 font-medium">info@propready.co.za</a>
                                    </p>
                                </section>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-8 border-t border-charcoal/15">
                                <Link
                                    href="/"
                                    className="inline-flex items-center space-x-2 text-charcoal/70 hover:text-charcoal transition"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Home</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/30 rounded-full blur-3xl" />
                </div>
            </main>
        </div>
    );
}
