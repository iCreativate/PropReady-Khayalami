import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">Privacy Policy</h1>
                        <p className="text-charcoal/70 mb-8">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <div className="prose prose-charcoal max-w-none space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">1. Introduction</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    PropReady-iKhayalami (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. This policy complies with the Protection of Personal Information Act (POPIA) of South Africa.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">2. Information We Collect</h2>
                                <h3 className="text-xl font-semibold text-charcoal mb-3 mt-6">2.1 Personal Information</h3>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We may collect the following personal information:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Name and contact information (email address, phone number)</li>
                                    <li>Financial information (monthly income, expenses, deposit saved)</li>
                                    <li>Employment status and credit score information</li>
                                    <li>Property preferences and search history</li>
                                    <li>Documents uploaded for pre-qualification (ID, bank statements, payslips)</li>
                                    <li>For agents: EAAB/PPRA registration number and company information</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-charcoal mb-3 mt-6">2.2 Automatically Collected Information</h3>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We may automatically collect certain information when you use our Platform:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Device information (browser type, operating system)</li>
                                    <li>IP address and location data</li>
                                    <li>Usage data (pages visited, time spent, features used)</li>
                                    <li>Cookies and similar tracking technologies</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">3. How We Use Your Information</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We use the information we collect to:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li>Provide and maintain our services</li>
                                    <li>Process your pre-qualification assessment</li>
                                    <li>Connect you with verified real estate agents</li>
                                    <li>Send you welcome emails and important updates</li>
                                    <li>Improve and personalize your experience</li>
                                    <li>Analyze usage patterns and trends</li>
                                    <li>Ensure platform security and prevent fraud</li>
                                    <li>Comply with legal obligations</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">4. Information Sharing and Disclosure</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We do not sell your personal information. We may share your information in the following circumstances:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li><strong>With Verified Agents:</strong> When you request to connect with an agent, we share your contact information and pre-qualification details to facilitate the connection.</li>
                                    <li><strong>With Bond Originators:</strong> If you choose to send documents to a bond originator, we share your documents and information as necessary for prequalification.</li>
                                    <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating the Platform (e.g., email services, hosting providers).</li>
                                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
                                    <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">5. Data Storage and Security</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
                                </p>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    Your data is stored securely in our database and is only accessible to authorized personnel who need access to perform their duties.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">6. Your Rights Under POPIA</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    As a data subject under POPIA, you have the right to:
                                </p>
                                <ul className="list-disc list-inside text-charcoal/80 space-y-2 ml-4">
                                    <li><strong>Access:</strong> Request access to your personal information</li>
                                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                                    <li><strong>Objection:</strong> Object to processing of your personal information</li>
                                    <li><strong>Data Portability:</strong> Request transfer of your data to another service provider</li>
                                    <li><strong>Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
                                </ul>
                                <p className="text-charcoal/80 leading-relaxed mt-4">
                                    To exercise these rights, please contact us at <a href="mailto:info@propready.co.za" className="text-gold hover:text-gold-600">info@propready.co.za</a>.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">7. Cookies and Tracking Technologies</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We use cookies and similar tracking technologies to track activity on our Platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Platform.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">8. Data Retention</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">9. Children&apos;s Privacy</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">10. International Data Transfers</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    Your information may be transferred to and maintained on computers located outside of South Africa. By using our Platform, you consent to the transfer of your information to facilities outside South Africa, where it will be subject to appropriate safeguards.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">11. Changes to This Privacy Policy</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-charcoal mb-4">12. Contact Us</h2>
                                <p className="text-charcoal/80 leading-relaxed mb-4">
                                    If you have any questions about this Privacy Policy or wish to exercise your rights under POPIA, please contact us at:
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
