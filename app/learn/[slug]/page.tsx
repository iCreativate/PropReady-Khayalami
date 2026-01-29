import Link from 'next/link';
import TransferCostCalculator from '@/components/TransferCostCalculator';
import LearningToolkit from '@/components/LearningToolkit';
import { ArrowLeft, BookOpen, Home, Calendar, CheckCircle, AlertCircle, Coins, Wallet } from 'lucide-react';

export default async function LearningModulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Content mapping (in a real app this would come from a CMS or database)
    const modules: Record<string, any> = {
        'home-loans': {
            title: 'Understanding Home Loans',
            icon: 'Calculator',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Getting a home loan (bond) is one of the most critical steps in buying a property.
                        Here&apos;s what you need to know about the process.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. What is a Home Loan?</h3>
                    <p>
                        A home loan is a long-term loan provided by a bank to help you purchase a property.
                        The property itself serves as security for the loan. Most home loans in South Africa are repaid over 20 or 30 years.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Interest Rates: Fixed vs. Variable</h3>
                    <p>
                        <strong>Variable Rate:</strong> The interest rate fluctuates with the prime lending rate. If the prime rate goes up, your monthly repayment goes up. This is the standard option.
                    </p>
                    <p>
                        <strong>Fixed Rate:</strong> The interest rate stays the same for a set period (usually 1-2 years), regardless of market changes. This offers certainty but often starts at a higher rate than variable.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Working with Bond Originators</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">What is a Bond Originator?</h4>
                        <p className="mb-4 text-charcoal/70 leading-relaxed">
                            A bond originator acts as an intermediary between you and the banks. Instead of you applying to each bank individually,
                            they submit a single application to all major banks (Standard Bank, ABSA, FNB, Nedbank, etc.) on your behalf.
                        </p>
                        <h4 className="text-xl font-bold text-gold mb-3">Why use them?</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">It&apos;s Free:</strong> The banks pay them a commission, so the service is completely free to you.</li>
                            <li><strong className="text-charcoal">Better Rates:</strong> They create competition between banks, often securing a lower interest rate than you could get on your own.</li>
                            <li><strong className="text-charcoal">Less Paperwork:</strong> You only fill out one set of forms.</li>
                            <li><strong className="text-charcoal">Higher Success Rate:</strong> They know exactly what banks are looking for and how to motivate your application.</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. The Application Process</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Pre-qualification:</strong> Know what you can afford before you shop. This checks your credit score and income.</li>
                        <li><strong>Formal Application:</strong> Once you have an Offer to Purchase, you submit your documents (ID, payslips, bank statements) to the banks.</li>
                        <li><strong>Credit Check:</strong> Banks assess your credit score, payment history, and affordability.</li>
                        <li><strong>Approval:</strong> You receive a &quot;grant&quot; or &quot;approval in principle&quot; detailing the loan amount and interest rate offered.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. FICA Documents: What You Need</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">What are FICA Documents?</h4>
                        <p className="mb-4 text-charcoal/70 leading-relaxed">
                            FICA stands for the <strong className="text-charcoal">Financial Intelligence Centre Act</strong>. It is South African legislation that requires banks and other accountable institutions to verify your identity and address before they can do business with you. When you apply for a home loan, the bank must comply with FICA to combat money laundering and fraud. You will need to provide &quot;FICA documents&quot;—proof of who you are and where you live—before your bond application can be approved.
                        </p>
                        <p className="text-charcoal/70 leading-relaxed">
                            FICA verification is mandatory for all home loan applicants. Having these documents ready speeds up your application and avoids delays.
                        </p>
                    </div>

                    <h4 className="text-xl font-bold text-charcoal mt-6 mb-3">Types of Documents Required for FICA</h4>
                    <p className="text-charcoal/80 mb-4">Banks typically require the following for FICA compliance when applying for a home loan:</p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="premium-card p-4 rounded-xl bg-white/50 border border-charcoal/10">
                            <h4 className="font-bold text-charcoal mb-2">Proof of Identity</h4>
                            <ul className="list-disc pl-5 space-y-1 text-charcoal/80 text-sm">
                                <li><strong>Valid South African ID book or ID card</strong> (preferred)</li>
                                <li><strong>Valid passport</strong> (if you are not a South African citizen)</li>
                                <li><strong>Valid driver&apos;s licence</strong> (sometimes accepted as secondary ID)</li>
                            </ul>
                            <p className="text-charcoal/60 text-sm mt-2">Documents must be original or certified copies. Certification must be recent (usually within 3 months).</p>
                        </div>
                        <div className="premium-card p-4 rounded-xl bg-white/50 border border-charcoal/10">
                            <h4 className="font-bold text-charcoal mb-2">Proof of Address</h4>
                            <ul className="list-disc pl-5 space-y-1 text-charcoal/80 text-sm">
                                <li><strong>Utility bill</strong> (electricity, water, rates) in your name, not older than 3 months</li>
                                <li><strong>Municipal account</strong> or lease agreement</li>
                                <li><strong>Bank statement</strong> showing your physical address (within 3 months)</li>
                                <li><strong>Retail store account statement</strong> (e.g. Edgars, Woolworths) with your address</li>
                            </ul>
                            <p className="text-charcoal/60 text-sm mt-2">The document must clearly show your full name and physical address (not a P.O. Box only).</p>
                        </div>
                    </div>
                    <div className="premium-card p-4 rounded-xl bg-white/50 border border-charcoal/10">
                        <h4 className="font-bold text-charcoal mb-2">Additional FICA Documents (if applicable)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-charcoal/80 text-sm">
                            <li><strong>Marriage certificate</strong> — if married in community of property</li>
                            <li><strong>Antenuptial contract</strong> — if married out of community of property</li>
                            <li><strong>Divorce decree</strong> — if divorced and relevant to the application</li>
                            <li><strong>Death certificate</strong> — if applying as executor or surviving spouse</li>
                            <li><strong>Trust deed / company documents</strong> — if buying in a trust or company name</li>
                        </ul>
                    </div>
                    <div className="mt-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
                        <p className="text-sm text-charcoal/80"><strong>Tip:</strong> Ask your bond originator or bank for their exact FICA checklist. Some banks accept certified copies; others may require originals. Having everything ready from the start avoids back-and-forth and speeds up approval.</p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'bond-application-checklist',
                    title: 'Bond Application Checklist',
                    description: 'Essential documents and steps needed for your bond application',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Required Documents</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Valid South African ID or passport</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months of recent payslips</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months of bank statements (all accounts)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Proof of address (utility bill or lease agreement)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Marriage certificate (if married in community of property)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Antenuptial contract (if applicable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Signed Offer to Purchase (OTP)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Proof of deposit (if applicable)</span>
                                </li>
                            </ul>
                            <div className="mt-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
                                <p className="text-sm text-charcoal/80"><strong>Tip:</strong> Keep digital copies of all documents. Most banks now accept online submissions.</p>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'pre-qualification-checklist',
                    title: 'Pre-Qualification Checklist',
                    description: 'Steps to get pre-qualified before you start house hunting',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Pre-Qualification Steps</h4>
                            <ol className="space-y-3 list-decimal list-inside">
                                <li className="pl-2"><strong>Check your credit score</strong> - Ensure it&apos;s above 600 for better approval chances</li>
                                <li className="pl-2"><strong>Calculate your affordability</strong> - Use the 30% rule: monthly bond payment should not exceed 30% of gross income</li>
                                <li className="pl-2"><strong>Gather financial documents</strong> - Payslips, bank statements, proof of other income</li>
                                <li className="pl-2"><strong>Contact a bond originator</strong> - They can pre-qualify you across multiple banks</li>
                                <li className="pl-2"><strong>Get pre-approval letter</strong> - This shows agents you&apos;re serious and can afford the property</li>
                            </ol>
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-charcoal/80"><strong>Remember:</strong> Pre-qualification is not a guarantee of final approval, but it gives you a realistic budget range.</p>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'buying-process': {
            title: 'The Buying Process',
            icon: 'FileText',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Buying a home involves several legal and financial steps.
                        Understanding this timeline helps reduce stress.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. The Timeline</h3>
                    <div className="space-y-8 mt-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Offer to Purchase (OTP)</h3>
                                <p>A legally binding contract between buyer and seller detailing the sale terms. Once signed by both parties, you cannot simply change your mind without penalty.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Bond Approval</h3>
                                <p>Securing the finance needed to pay for the property. You typically have a set number of days (e.g., 21 days) to get this approved.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Lodgement & Registration</h3>
                                <p>Documents are lodged at the Deeds Office. After 7-10 days, the property is officially registered in your name.</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-12 mb-4">2. Understanding Conveyancers (Attorneys)</h3>
                    <p>Three different attorneys are typically involved in a property transaction:</p>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="font-bold text-gold mb-2">Transfer Attorney</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">Appointed by the <strong className="text-charcoal">Seller</strong>, but paid by the <strong className="text-charcoal">Buyer</strong>. They handle the transfer of the property.</p>
                        </div>
                        <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="font-bold text-gold mb-2">Bond Attorney</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">Appointed by the <strong className="text-charcoal">Bank</strong>, paid by the <strong className="text-charcoal">Buyer</strong>. They register the bond over the property.</p>
                        </div>
                        <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="font-bold text-gold mb-2">Cancellation Attorney</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">Appointed by the <strong className="text-charcoal">Seller&apos;s Bank</strong>, paid by the <strong className="text-charcoal">Seller</strong>. They cancel the seller&apos;s existing bond.</p>
                        </div>
                    </div>

                    <div className="premium-card p-6 rounded-xl mt-8 bg-blue-50 border border-blue-100">
                        <h4 className="text-xl font-bold text-charcoal mb-2 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                            Don&apos;t Forget Transfer Costs!
                        </h4>
                        <p className="text-charcoal/70 leading-relaxed">
                            Remember that as a buyer, you are responsible for paying Transfer Duty, Transfer Fees, and Bond Registration Fees.
                            Check out our <strong className="text-charcoal">Transfer Costs</strong> module for a detailed breakdown.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'otp-template',
                    title: 'Offer to Purchase (OTP) Template',
                    description: 'See what a typical Offer to Purchase document looks like',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="text-xl font-bold text-charcoal mb-4 text-center">OFFER TO PURCHASE</h4>
                                
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-charcoal mb-1">Property Details:</p>
                                        <p className="text-charcoal/70">Address: [Property Address]</p>
                                        <p className="text-charcoal/70">Erf/Portion: [Erf Number]</p>
                                        <p className="text-charcoal/70">Title Deed Number: [Title Deed Number]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Purchase Price:</p>
                                        <p className="text-charcoal/70">R [Amount in words and figures]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Deposit:</p>
                                        <p className="text-charcoal/70">R [Deposit Amount]</p>
                                        <p className="text-charcoal/70">Due: [Date]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Bond Conditions:</p>
                                        <p className="text-charcoal/70">✓ Subject to bond approval within [21] days</p>
                                        <p className="text-charcoal/70">✓ Bond amount: R [Amount]</p>
                                        <p className="text-charcoal/70">✓ Interest rate not to exceed: [%]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Occupancy Date:</p>
                                        <p className="text-charcoal/70">[Date] or registration, whichever is later</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Fixtures & Fittings:</p>
                                        <p className="text-charcoal/70">Included: [List items]</p>
                                        <p className="text-charcoal/70">Excluded: [List items]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <p className="font-semibold text-charcoal mb-1">Special Conditions:</p>
                                        <p className="text-charcoal/70">[Any additional conditions]</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold text-charcoal mb-2">Buyer:</p>
                                            <p className="text-charcoal/70">Name: _________________</p>
                                            <p className="text-charcoal/70">ID: _________________</p>
                                            <p className="text-charcoal/70">Signature: _________________</p>
                                            <p className="text-charcoal/70">Date: _________________</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-charcoal mb-2">Seller:</p>
                                            <p className="text-charcoal/70">Name: _________________</p>
                                            <p className="text-charcoal/70">ID: _________________</p>
                                            <p className="text-charcoal/70">Signature: _________________</p>
                                            <p className="text-charcoal/70">Date: _________________</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-charcoal/80"><strong>Important:</strong> This is a sample template. Always have a qualified attorney or estate agent review your OTP before signing. Once signed by both parties, it becomes legally binding.</p>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'buying-timeline-checklist',
                    title: 'Buying Process Timeline Checklist',
                    description: 'Track your progress through each step of the buying process',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Step-by-Step Checklist</h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">1</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Offer to Purchase Signed</p>
                                        <p className="text-sm text-charcoal/60">Both parties sign the OTP</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 0</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">2</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Bond Application Submitted</p>
                                        <p className="text-sm text-charcoal/60">Submit all required documents to bank/originator</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 1-3</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">3</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Bond Approval Received</p>
                                        <p className="text-sm text-charcoal/60">Bank grants approval in principle</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 14-21</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">4</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Conveyancers Appointed</p>
                                        <p className="text-sm text-charcoal/60">Transfer and bond attorneys confirmed</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 21-30</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">5</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">FICA & Documents Submitted</p>
                                        <p className="text-sm text-charcoal/60">Provide ID, proof of address, etc. to attorneys</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 30-45</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">6</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Transfer Costs Paid</p>
                                        <p className="text-sm text-charcoal/60">Pay transfer duty, fees to attorneys</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 45-60</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">7</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Documents Lodged at Deeds Office</p>
                                        <p className="text-sm text-charcoal/60">Attorneys submit transfer documents</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 60-75</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">8</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-charcoal">Property Registered</p>
                                        <p className="text-sm text-charcoal/60">Property officially in your name!</p>
                                        <p className="text-xs text-charcoal/50 mt-1">Target: Day 75-90</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'conveyancer-checklist',
                    title: 'Conveyancer Checklist',
                    description: 'Understanding the three attorneys involved in your transaction',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Three Attorneys in Your Transaction</h4>
                            <div className="space-y-4">
                                <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                    <h5 className="font-bold text-gold mb-2">Transfer Attorney</h5>
                                    <p className="text-sm text-charcoal/70 mb-2">Appointed by: <strong>Seller</strong></p>
                                    <p className="text-sm text-charcoal/70 mb-2">Paid by: <strong>Buyer</strong></p>
                                    <p className="text-sm text-charcoal/70">Responsibilities:</p>
                                    <ul className="text-sm text-charcoal/70 list-disc list-inside ml-2 mt-1">
                                        <li>Transfer property into your name</li>
                                        <li>Calculate and pay transfer duty to SARS</li>
                                        <li>Lodge documents at Deeds Office</li>
                                    </ul>
                                </div>
                                <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                    <h5 className="font-bold text-gold mb-2">Bond Attorney</h5>
                                    <p className="text-sm text-charcoal/70 mb-2">Appointed by: <strong>Bank</strong></p>
                                    <p className="text-sm text-charcoal/70 mb-2">Paid by: <strong>Buyer</strong></p>
                                    <p className="text-sm text-charcoal/70">Responsibilities:</p>
                                    <ul className="text-sm text-charcoal/70 list-disc list-inside ml-2 mt-1">
                                        <li>Register the bond over the property</li>
                                        <li>Ensure bank&apos;s security interest is recorded</li>
                                    </ul>
                                </div>
                                <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                    <h5 className="font-bold text-gold mb-2">Cancellation Attorney</h5>
                                    <p className="text-sm text-charcoal/70 mb-2">Appointed by: <strong>Seller&apos;s Bank</strong></p>
                                    <p className="text-sm text-charcoal/70 mb-2">Paid by: <strong>Seller</strong></p>
                                    <p className="text-sm text-charcoal/70">Responsibilities:</p>
                                    <ul className="text-sm text-charcoal/70 list-disc list-inside ml-2 mt-1">
                                        <li>Cancel seller&apos;s existing bond</li>
                                        <li>Release the property from the bank&apos;s security</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'agents': {
            title: 'Working with Agents',
            icon: 'Users',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Estate agents are professionals who facilitate the sale of property.
                        A good agent can be your greatest asset.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">What Agents Do</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Valuation:</strong> Determine the correct market price for a property.</li>
                        <li><strong>Marketing:</strong> List properties on portals and manage viewings.</li>
                        <li><strong>Negotiation:</strong> Act as a middleman to negotiate price and terms between buyer and seller.</li>
                        <li><strong>Administration:</strong> Ensure all legal paperwork (OTP, FICA) is correct.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">How to Select the Right Agent</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> For Sellers</h4>
                            <ul className="space-y-3 text-sm text-charcoal/70">
                                <li><strong className="text-charcoal">Area Specialist:</strong> Choose someone who sells many homes in your specific suburb. They know the buyers.</li>
                                <li><strong className="text-charcoal">Marketing Plan:</strong> Ask exactly how they plan to market your home (photos, portals, social media).</li>
                                <li><strong className="text-charcoal">Valuation Evidence:</strong> Don&apos;t just pick the agent who gives the highest price. Ask for &quot;comps&quot; (comparable sales) to back up their number.</li>
                                <li><strong className="text-charcoal">Sole Mandate:</strong> Giving one agent a sole mandate often motivates them to work harder for you.</li>
                            </ul>
                        </div>

                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> For Buyers</h4>
                            <ul className="space-y-3 text-sm text-charcoal/70">
                                <li><strong className="text-charcoal">Responsiveness:</strong> Good agents reply quickly to enquiries.</li>
                                <li><strong className="text-charcoal">Listen to Needs:</strong> They should show you homes that match your brief, not just what they want to sell.</li>
                                <li><strong className="text-charcoal">Pre-qualification:</strong> Agents take you more seriously if you are pre-qualified.</li>
                                <li><strong className="text-charcoal">Honesty:</strong> Look for an agent who points out potential issues, not just the good features.</li>
                            </ul>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">Commission</h3>
                    <p>
                        Agents earn a commission on the sale price, typically between 3% and 7%.
                        <strong>Important:</strong> The seller usually pays the agent&apos;s commission, not the buyer.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">PropReady Verified Agents</h3>
                    <p>
                        All agents on PropReady are verified with the Property Practitioners Regulatory Authority (PPRA).
                        This ensures you are working with qualified, legal professionals who have a valid Fidelity Fund Certificate (FFC).
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'agent-selection-checklist',
                    title: 'Agent Selection Checklist',
                    description: 'Questions to ask and things to check when choosing an agent',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">For Buyers</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Do they respond to enquiries within 24 hours?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Do they listen to your needs and budget?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Are they PPRA registered with a valid FFC?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Do they have good reviews and references?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Are you pre-qualified? (Agents take you more seriously)</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">For Sellers</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Do they specialize in your area/suburb?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Can they provide comparable sales (comps) for their valuation?</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>What is their marketing plan? (Photos, portals, social media)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>What is their track record? (Sales in last 12 months)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Are they willing to take a sole mandate? (Often better results)</span>
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'questions-to-ask-agents',
                    title: 'Questions to Ask Agents',
                    description: 'Important questions to ask before working with an agent',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                <h5 className="font-bold text-gold mb-3">General Questions</h5>
                                <ul className="space-y-2 text-sm text-charcoal/70">
                                    <li>• How long have you been in real estate?</li>
                                    <li>• Are you PPRA registered? (Ask for FFC number)</li>
                                    <li>• How many properties have you sold in the last year?</li>
                                    <li>• What areas do you specialize in?</li>
                                    <li>• What is your commission structure?</li>
                                </ul>
                            </div>

                            <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                <h5 className="font-bold text-gold mb-3">For Sellers</h5>
                                <ul className="space-y-2 text-sm text-charcoal/70">
                                    <li>• How did you arrive at this valuation? (Ask for comps)</li>
                                    <li>• What is your marketing strategy?</li>
                                    <li>• Which portals will you list on?</li>
                                    <li>• How will you handle viewings?</li>
                                    <li>• What is your average days on market?</li>
                                    <li>• Do you recommend a sole mandate?</li>
                                </ul>
                            </div>

                            <div className="premium-card p-4 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                <h5 className="font-bold text-gold mb-3">For Buyers</h5>
                                <ul className="space-y-2 text-sm text-charcoal/70">
                                    <li>• Are you familiar with properties in my price range?</li>
                                    <li>• How quickly can you show me properties?</li>
                                    <li>• Will you help me negotiate the price?</li>
                                    <li>• Can you recommend a bond originator?</li>
                                    <li>• What should I know about this area?</li>
                                </ul>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'first-time-tips': {
            title: 'First-Time Buyer Tips',
            icon: 'Home',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Buying your first home is exciting but can be overwhelming.
                        Here are essential tips to guide you.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-xl font-bold text-gold mb-2">Budget for Hidden Costs</h3>
                            <p className="text-charcoal/70 leading-relaxed">Remember transfer duties (on properties over R1.1m), bond registration fees, transfer attorney fees, and moving costs. Have cash saved for these upfront costs.</p>
                        </div>

                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-xl font-bold text-gold mb-2">Location, Location</h3>
                            <p className="text-charcoal/70 leading-relaxed">You can change a house, but you can&apos;t change its location. Research the area&apos;s safety, schools, and future development plans.</p>
                        </div>

                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-xl font-bold text-gold mb-2">Check the Property</h3>
                            <p className="text-charcoal/70 leading-relaxed">Look for structural issues, damp, and roof condition. Ask the seller for a mandatory disclosure form listing known defects.</p>
                        </div>

                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h3 className="text-xl font-bold text-gold mb-2">Don&apos;t Overextend</h3>
                            <p className="text-charcoal/70 leading-relaxed">Banks may approve you for more than you can comfortably afford. Ensure your monthly repayments leave room for living expenses, rates, levies, and maintenance.</p>
                        </div>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'property-inspection-checklist',
                    title: 'Property Inspection Checklist',
                    description: 'What to look for when viewing and inspecting a property',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Exterior Inspection</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Roof condition (tiles, leaks, gutters)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Walls for cracks, damp, or structural issues</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Windows and doors (condition, security)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Boundary walls and fencing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Garden and landscaping condition</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Interior Inspection</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Damp or water damage (check ceilings, walls, floors)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Electrical (switches, outlets, visible wiring)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Plumbing (water pressure, leaks, hot water)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Kitchen and bathroom condition</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Flooring condition (tiles, carpets, wood)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Storage space (cupboards, built-ins)</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Important Documents</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Mandatory disclosure form (seller must list known defects)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Electrical compliance certificate</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Plumbing certificate (if applicable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Beetle certificate (if applicable)</span>
                                </li>
                            </ul>

                            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-charcoal/80"><strong>Tip:</strong> Consider hiring a professional home inspector before making an offer. They can identify issues you might miss.</p>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'budget-calculator-template',
                    title: 'Home Buying Budget Template',
                    description: 'Calculate all costs involved in buying your home',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Monthly Budget Calculator</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Monthly Gross Income</label>
                                        <p className="text-charcoal/50 text-xs mt-1">R _________________</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-2">Monthly Expenses</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Bond Repayment (30% of gross)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Rates & Taxes</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Levies (if applicable)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Home Insurance</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Maintenance Reserve (1% of property value/year)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Utilities (water, electricity)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-2">One-Time Costs</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Deposit</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Transfer Duty</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Transfer & Bond Attorney Fees</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Moving Costs</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-charcoal">
                                                <span>Total One-Time Costs</span>
                                                <span>R _________________</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-charcoal/80"><strong>Rule of Thumb:</strong> Your total monthly housing costs (bond + rates + levies) should not exceed 30% of your gross monthly income.</p>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'transfer-costs': {
            title: 'Transfer & Hidden Costs',
            icon: 'Wallet',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        One of the biggest mistakes first-time buyers make is not budgeting for the &quot;hidden&quot; costs of buying a property.
                        These costs must be paid in cash to the attorneys before the property can be registered.
                    </p>

                    <TransferCostCalculator />

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. The Three Main Costs</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Transfer Duty</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">A government tax paid to SARS. It is based on the value of the property.</p>
                        </div>
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Transfer Fees</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">Paid to the Transfer Attorney for their legal work in transferring the property to your name.</p>
                        </div>
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Bond Costs</h4>
                            <p className="text-sm text-charcoal/70 leading-relaxed">Paid to the Bond Attorney for registering your bond with the Deeds Office.</p>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-12 mb-4">2. Estimated Cost Breakdown</h3>
                    <p className="mb-4">Here is a rough estimate of what you can expect to pay based on the purchase price (assuming a 100% bond):</p>

                    <div className="premium-card overflow-hidden rounded-xl">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm border-b-2 border-gold/30">
                                    <tr>
                                        <th className="py-4 px-4 text-gold font-bold whitespace-nowrap min-w-[140px]">Purchase Price</th>
                                        <th className="py-4 px-4 text-gold font-bold whitespace-nowrap min-w-[140px]">Transfer Duty</th>
                                        <th className="py-4 px-4 text-gold font-bold whitespace-nowrap min-w-[140px]">Attorney Fees*</th>
                                        <th className="py-4 px-4 text-gold font-bold whitespace-nowrap min-w-[140px]">Total Extra Cash</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/10 bg-white">
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 750,000</td>
                                        <td className="py-4 px-4 text-green-600 whitespace-nowrap">R 0 (Exempt)</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 38,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 38,000</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 1,000,000</td>
                                        <td className="py-4 px-4 text-green-600 whitespace-nowrap">R 0 (Exempt)</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 45,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 45,000</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 1,500,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 11,700</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 55,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 66,700</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 2,000,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 45,375</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 65,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 110,375</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 3,000,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 128,750</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 85,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 213,750</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 4,000,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 237,600</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 95,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 332,600</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 5,000,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 347,600</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 105,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 452,600</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 7,500,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 622,600</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 125,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 747,600</td>
                                    </tr>
                                    <tr className="hover:bg-charcoal/5 transition-colors">
                                        <td className="py-4 px-4 text-charcoal font-medium whitespace-nowrap">R 10,000,000</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">R 897,600</td>
                                        <td className="py-4 px-4 text-charcoal/70 whitespace-nowrap">± R 140,000</td>
                                        <td className="py-4 px-4 font-bold text-charcoal whitespace-nowrap">± R 1,037,600</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-charcoal/50 mt-2 p-2">* Attorney fees are estimates and include VAT, deeds office levies, and other disbursements. They vary by firm.</p>
                    </div>

                    <div className="bg-gold/20 border border-gold/30 p-6 rounded-xl mt-8">
                        <h4 className="text-xl font-bold text-charcoal mb-2 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Important Note
                        </h4>
                        <p className="text-charcoal/90">
                            Banks rarely lend you money for these costs. You usually need to have this cash available in your savings account
                            before the transaction can proceed.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'cost-breakdown-template',
                    title: 'Transfer Costs Breakdown Template',
                    description: 'Template to calculate and track all your transfer costs',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Transfer Costs Breakdown</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Purchase Price</label>
                                        <p className="text-charcoal/50 text-xs mt-1">R _________________</p>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Transfer Duty (SARS)</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Calculated Amount</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <p className="text-xs text-charcoal/50 italic">Use the calculator above or refer to SARS tax tables</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Transfer Attorney Fees</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Professional Fees</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">VAT (15%)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Deeds Office Fees</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Postage & Petties</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-charcoal">
                                                <span>Subtotal</span>
                                                <span>R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/20 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Bond Registration Costs</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Bond Attorney Fees</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">VAT (15%)</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Deeds Office Fees</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-charcoal">
                                                <span>Subtotal</span>
                                                <span>R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-gold/30 pt-4">
                                        <div className="flex justify-between font-bold text-lg text-charcoal">
                                            <span>Total Transfer Costs</span>
                                            <span>R _________________</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-charcoal/80"><strong>Note:</strong> Attorney fees vary by firm. Always request a detailed quote from your transfer attorney. The calculator above provides estimates based on standard tariffs.</p>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'flisp-subsidy': {
            title: 'Government Subsidies (FLISP)',
            icon: 'Coins',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        The Finance Linked Individual Subsidy Programme (FLISP), now known as First Home Finance,
                        is a government subsidy for first-time home buyers.
                    </p>

                    <div className="bg-gold/20 border border-gold/30 p-6 rounded-xl mt-6">
                        <h3 className="text-xl font-bold text-charcoal mb-2">Who Qualifies?</h3>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/90">
                            <li>You must be a South African citizen or permanent resident.</li>
                            <li>You must be 18 years or older.</li>
                            <li>You must be a first-time home buyer.</li>
                            <li>You must earn between <strong>R3,501 and R22,000</strong> per month (gross household income).</li>
                            <li>You must have a financial dependent (spouse or child).</li>
                            <li>You must have an approved home loan.</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">How Much Can You Get?</h3>
                    <p>
                        The subsidy amount depends on your income. The lower your income, the higher the subsidy.
                        Amounts range from approximately <strong>R30,000 to R130,000</strong>.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">What Can You Use It For?</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Deposit:</strong> Use it as a deposit to lower your loan amount and monthly repayments.</li>
                        <li><strong>Transfer Costs:</strong> Pay for transfer and bond registration attorneys.</li>
                        <li><strong>Loan Repayment:</strong> Pay it directly into your bond to reduce the capital amount.</li>
                    </ul>

                    <div className="bg-white/10 p-6 rounded-xl border border-charcoal/20 shadow-sm mt-8">
                        <h4 className="text-xl font-bold text-gold mb-2 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            How to Apply
                        </h4>
                        <p>
                            You can apply for FLISP after your home loan is approved. PropReady can assist you with the application process
                            to ensure you get the subsidy you deserve.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'flisp-eligibility-checklist',
                    title: 'FLISP Eligibility Checklist',
                    description: 'Check if you qualify for the First Home Finance subsidy',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Eligibility Requirements</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>South African citizen or permanent resident</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>18 years or older</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>First-time home buyer (never owned property before)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Gross household income between R3,501 and R22,000 per month</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Have a financial dependent (spouse or child)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Have an approved home loan</span>
                                </li>
                            </ul>

                            <div className="mt-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
                                <p className="text-sm text-charcoal/80"><strong>Income Calculation:</strong> Gross household income includes all income sources for you and your spouse/partner. This includes salaries, bonuses, rental income, etc.</p>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'flisp-application-checklist',
                    title: 'FLISP Application Checklist',
                    description: 'Documents and steps needed to apply for FLISP subsidy',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Required Documents</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Valid South African ID (certified copy)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months of payslips (all household members)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months of bank statements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Proof of dependents (birth certificates, marriage certificate)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Bond approval letter from bank</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Signed Offer to Purchase (OTP)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Proof of address</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Application Steps</h4>
                            <ol className="space-y-3 list-decimal list-inside">
                                <li className="pl-2"><strong>Get bond approval first</strong> - FLISP requires an approved home loan</li>
                                <li className="pl-2"><strong>Gather all documents</strong> - Ensure all documents are certified where required</li>
                                <li className="pl-2"><strong>Complete FLISP application form</strong> - Available from NHFC or your bond originator</li>
                                <li className="pl-2"><strong>Submit application</strong> - Through NHFC or via your bond originator</li>
                                <li className="pl-2"><strong>Wait for approval</strong> - Typically takes 4-6 weeks</li>
                                <li className="pl-2"><strong>Receive subsidy</strong> - Paid directly to your bond account or attorneys</li>
                            </ol>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-charcoal/80"><strong>Tip:</strong> Apply for FLISP as soon as you receive bond approval. The subsidy can be used for your deposit, transfer costs, or paid directly into your bond.</p>
                            </div>
                        </div>
                    )
                }
            ]
        }
    };

    // Ordered list of modules for "Next topic" navigation
    const moduleOrder = [
        'home-loans',
        'buying-process',
        'agents',
        'first-time-tips',
        'transfer-costs',
        'flisp-subsidy'
    ] as const;

    const learningModule = modules[slug];
    const currentIndex = moduleOrder.indexOf(slug as (typeof moduleOrder)[number]);
    const nextSlug = currentIndex >= 0 && currentIndex < moduleOrder.length - 1 ? moduleOrder[currentIndex + 1] : null;
    const nextModule = nextSlug ? modules[nextSlug] : null;

    if (!learningModule) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center text-charcoal">
                    <h1 className="text-4xl font-bold mb-4">Module Not Found</h1>
                    <Link href="/learn" className="text-gold hover:underline">Back to Learning Center - Buyers</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-charcoal/5">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/learn" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Learning Center</span>
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
                        {/* Card header styled like toolkit modal */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-10 py-6 md:py-8 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                        <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                                            {learningModule.title}
                                        </h1>
                                        <p className="text-white/90 text-sm md:text-base max-w-xl">
                                            A focused learning module to guide you step-by-step on your home journey.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card body */}
                        <div className="px-6 md:px-10 py-8 md:py-10 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="prose max-w-none text-charcoal/90">
                                {learningModule.content}
                            </div>

                            {learningModule.toolkit && (
                                <LearningToolkit items={learningModule.toolkit} />
                            )}

                            {/* Footer actions */}
                            <div className="mt-12 pt-8 border-t border-charcoal/15 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <Link
                                    href="/learn"
                                    className="text-charcoal/70 hover:text-charcoal transition flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Topics
                                </Link>

                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:items-center md:ml-auto">
                                    {nextModule && (
                                        <Link
                                            href={`/learn/${nextSlug}`}
                                            className="px-6 py-3 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/10 transition shadow-sm text-center"
                                        >
                                            Next Topic: {nextModule.title}
                                        </Link>
                                    )}

                                    <Link
                                        href="/quiz"
                                        className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition shadow-lg text-center"
                                    >
                                        Start Your Journey
                                    </Link>
                                </div>
                            </div>
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
