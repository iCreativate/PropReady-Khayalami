import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <main className="relative min-h-screen px-4 pt-24 pb-12">
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="premium-card rounded-2xl p-8 md:p-12 shadow-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Terms of Service</h1>
                        <p className="text-charcoal/70 mb-8">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <div className="prose prose-charcoal max-w-none space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">1. Acceptance of Terms</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    By accessing and using PropReady-iKhayalami (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you accept and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use the Platform. These Terms constitute a legally binding agreement between you and PropReady-iKhayalami.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">2. Description of Service</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    PropReady-iKhayalami is a property platform that provides:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Pre-qualification assessments for property buyers</li>
                                    <li>Educational resources and learning modules</li>
                                    <li>Property search and listing services</li>
                                    <li>Connection services between buyers and verified real estate agents</li>
                                    <li>Property valuation booking services for sellers</li>
                                    <li>Commission and bond calculators</li>
                                    <li>Agent portal for lead management and property listings</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">3. User Accounts and Registration</h2>
                                <h3 className="text-xl font-semibold text-charcoal mb-3 mt-6">3.1 Account Creation</h3>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    To use certain features of the Platform, you may be required to create an account. You agree to:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Provide accurate, current, and complete information during registration</li>
                                    <li>Maintain and update your information to keep it accurate and current</li>
                                    <li>Maintain the security of your password and account</li>
                                    <li>Accept responsibility for all activities that occur under your account</li>
                                    <li>Notify us immediately of any unauthorized use of your account</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-charcoal mb-3 mt-6">3.2 Agent Registration</h3>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    Real estate agents must provide valid EAAB/PPRA registration numbers and company information. We reserve the right to verify agent credentials and may reject or suspend accounts that do not meet our verification standards.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">4. User Conduct and Responsibilities</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    You agree not to:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Use the Platform for any illegal or unauthorized purpose</li>
                                    <li>Violate any laws in your jurisdiction</li>
                                    <li>Infringe upon the rights of others</li>
                                    <li>Transmit any viruses, malware, or harmful code</li>
                                    <li>Attempt to gain unauthorized access to the Platform or related systems</li>
                                    <li>Interfere with or disrupt the Platform or servers</li>
                                    <li>Use automated systems to access the Platform without permission</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Upload false, misleading, or fraudulent information</li>
                                    <li>Harass, abuse, or harm other users</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">5. Pre-Qualification and Financial Information</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    The pre-qualification assessment provided on the Platform is an estimate only and does not constitute:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>A guarantee of loan approval</li>
                                    <li>A binding commitment from any financial institution</li>
                                    <li>Financial advice</li>
                                    <li>A substitute for professional financial consultation</li>
                                </ul>
                                <p className="text-charcoal/80 leading-relaxed mt-4">
                                    Actual loan approval and terms are subject to the policies and procedures of individual financial institutions and bond originators. We are not responsible for loan decisions made by third-party financial institutions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">6. Property Listings and Information</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    Property listings on the Platform are provided by third-party agents and sellers. We do not:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Verify the accuracy of property information</li>
                                    <li>Guarantee the availability of listed properties</li>
                                    <li>Endorse any specific properties or agents</li>
                                    <li>Act as a party to any property transaction</li>
                                </ul>
                                <p className="text-charcoal/80 leading-relaxed mt-4">
                                    You are responsible for verifying all property information and conducting due diligence before entering into any property transaction.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">7. Agent Services and Connections</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    When you request to connect with an agent through the Platform:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>We facilitate the connection but are not a party to any agreement between you and the agent</li>
                                    <li>Agents are independent service providers, not employees or agents of PropReady-iKhayalami</li>
                                    <li>We are not responsible for the services, advice, or conduct of agents</li>
                                    <li>Any agreements or transactions are solely between you and the agent</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">8. Intellectual Property</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    The Platform and its original content, features, and functionality are owned by PropReady-iKhayalami and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Reproduce, distribute, or create derivative works from the Platform content</li>
                                    <li>Use our trademarks or logos without written permission</li>
                                    <li>Reverse engineer or attempt to extract source code</li>
                                    <li>Remove any copyright or proprietary notices</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">9. Limitation of Liability</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    To the maximum extent permitted by South African law:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind</li>
                                    <li>We do not guarantee uninterrupted, secure, or error-free operation of the Platform</li>
                                    <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
                                    <li>Our total liability shall not exceed the amount you paid to us (if any) in the 12 months preceding the claim</li>
                                    <li>We are not responsible for any losses arising from your use of third-party services or agents</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">10. Indemnification</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    You agree to indemnify, defend, and hold harmless PropReady-iKhayalami, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Your use of the Platform</li>
                                    <li>Your violation of these Terms</li>
                                    <li>Your violation of any rights of another party</li>
                                    <li>Any content you submit or transmit through the Platform</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">11. Termination</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any reason, including:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Breach of these Terms</li>
                                    <li>Fraudulent, abusive, or illegal activity</li>
                                    <li>Request by law enforcement or government agencies</li>
                                    <li>Extended periods of inactivity</li>
                                </ul>
                                <p className="text-charcoal/80 leading-relaxed mt-4">
                                    Upon termination, your right to use the Platform will cease immediately. You may also terminate your account at any time by contacting us.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">12. Governing Law and Dispute Resolution</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of South Africa.
                                </p>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We encourage you to contact us first to resolve any disputes amicably before pursuing legal action.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">13. Changes to Terms</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We reserve the right to modify these Terms at any time. We will notify users of material changes by:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Posting the updated Terms on this page</li>
                                    <li>Updating the &quot;Last updated&quot; date</li>
                                    <li>Sending email notifications for significant changes (where applicable)</li>
                                </ul>
                                <p className="text-charcoal/80 leading-relaxed mt-4">
                                    Your continued use of the Platform after changes become effective constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Platform.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">14. Severability</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">15. Contact Information</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    If you have any questions about these Terms of Service, please contact us at:
                                </p>
                                <p className="text-charcoal/80 leading-relaxed">
                                    Email: <a href="mailto:info@propready.co.za" className="text-gold hover:text-gold-600">info@propready.co.za</a>
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-charcoal/10">
                            <Link
                                href="/"
                                className="inline-flex items-center space-x-2 text-gold hover:text-gold-600 font-semibold"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Back to Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
