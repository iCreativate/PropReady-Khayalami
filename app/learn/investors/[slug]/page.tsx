import Link from 'next/link';
import LearningToolkit from '@/components/LearningToolkit';
import { ArrowLeft, BookOpen, Home, CheckCircle, Target, BarChart3, DollarSign, PiggyBank, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

export default async function InvestorsLearningModulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Content mapping for Property Investors modules
    const modules: Record<string, any> = {
        'strategies': {
            title: 'Investment Strategies',
            icon: 'Target',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Understanding different property investment strategies is crucial for building a successful portfolio.
                        Each strategy has its own risk profile, capital requirements, and potential returns.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Buy-to-Let (Rental Properties)</h3>
                    <p>
                        This is the most common investment strategy where you purchase a property to rent it out.
                        The goal is to generate monthly rental income while potentially benefiting from capital appreciation over time.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Considerations</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Location:</strong> Choose areas with high rental demand and good infrastructure</li>
                            <li><strong className="text-charcoal">Rental Yield:</strong> Aim for 6-10% gross rental yield in South Africa</li>
                            <li><strong className="text-charcoal">Tenant Management:</strong> Factor in property management costs (8-12% of rental)</li>
                            <li><strong className="text-charcoal">Vacancy Rates:</strong> Budget for 1-2 months vacancy per year</li>
                            <li><strong className="text-charcoal">Maintenance:</strong> Set aside 1-2% of property value annually for maintenance</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Fix-and-Flip</h3>
                    <p>
                        This strategy involves purchasing a property in need of renovation, improving it, and selling it for a profit.
                        It requires capital for both purchase and renovations, plus knowledge of property values and renovation costs.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                        <h4 className="text-xl font-bold text-blue-600 mb-3">Important Factors</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Purchase Price:</strong> Buy at 70-80% of after-repair value (ARV) minus renovation costs</li>
                            <li><strong className="text-charcoal">Renovation Budget:</strong> Get multiple quotes and add 20% buffer for unexpected costs</li>
                            <li><strong className="text-charcoal">Timeline:</strong> Faster renovations mean less holding costs (rates, utilities, interest)</li>
                            <li><strong className="text-charcoal">Market Timing:</strong> Understand local market conditions and buyer preferences</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Commercial Property Investment</h3>
                    <p>
                        Investing in commercial properties (offices, retail, warehouses) typically offers higher yields but requires
                        larger capital and longer lease terms. Commercial leases are usually 3-5 years with annual escalations.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Property Development</h3>
                    <p>
                        This involves buying land or existing properties to develop new buildings. It requires significant capital,
                        development expertise, and understanding of zoning and building regulations.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. REITs (Real Estate Investment Trusts)</h3>
                    <p>
                        For investors who want property exposure without direct ownership, REITs offer shares in property portfolios.
                        They provide liquidity and diversification but less control over individual properties.
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'investment-strategy-comparison',
                    title: 'Investment Strategy Comparison',
                    description: 'Compare different investment strategies side-by-side',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Strategy Comparison Matrix</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gold/10">
                                            <th className="border border-charcoal/20 p-3 text-left text-charcoal font-semibold">Strategy</th>
                                            <th className="border border-charcoal/20 p-3 text-left text-charcoal font-semibold">Capital Required</th>
                                            <th className="border border-charcoal/20 p-3 text-left text-charcoal font-semibold">Risk Level</th>
                                            <th className="border border-charcoal/20 p-3 text-left text-charcoal font-semibold">Typical Yield</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Buy-to-Let</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Medium</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Medium</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">6-10%</td>
                                        </tr>
                                        <tr className="bg-charcoal/5">
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Fix-and-Flip</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">High</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">High</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">15-30% ROI</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Commercial</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Very High</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Medium-High</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">8-12%</td>
                                        </tr>
                                        <tr className="bg-charcoal/5">
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">REITs</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Low</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">Low-Medium</td>
                                            <td className="border border-charcoal/20 p-3 text-charcoal/80">5-8%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'returns': {
            title: 'Calculating Returns',
            icon: 'BarChart3',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Understanding how to calculate returns is essential for making informed investment decisions.
                        Different metrics tell you different things about your investment performance.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Rental Yield (Gross & Net)</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Gross Rental Yield</h4>
                        <p className="mb-2 text-charcoal/70">Formula: (Annual Rental Income ÷ Property Value) × 100</p>
                        <p className="text-sm text-charcoal/60">Example: R120,000 annual rent ÷ R1,500,000 property value = 8% gross yield</p>
                    </div>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                        <h4 className="text-xl font-bold text-blue-600 mb-3">Net Rental Yield</h4>
                        <p className="mb-2 text-charcoal/70">Formula: ((Annual Rental Income - Annual Expenses) ÷ Property Value) × 100</p>
                        <p className="text-sm text-charcoal/60">Expenses include: rates, levies, insurance, maintenance, property management, vacancy allowance</p>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Cash Flow Analysis</h3>
                    <p>
                        Positive cash flow means your rental income exceeds all expenses including bond repayments.
                        Negative cash flow (cash flow negative) means you need to top up from other income sources.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
                        <h4 className="text-xl font-bold text-green-600 mb-3">Monthly Cash Flow Calculation</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Rental Income:</strong> R10,000/month</li>
                            <li><strong className="text-charcoal">Less Bond Repayment:</strong> -R8,500/month</li>
                            <li><strong className="text-charcoal">Less Rates & Levies:</strong> -R1,200/month</li>
                            <li><strong className="text-charcoal">Less Insurance:</strong> -R300/month</li>
                            <li><strong className="text-charcoal">Less Maintenance Reserve:</strong> -R500/month</li>
                            <li><strong className="text-charcoal">Net Cash Flow:</strong> -R500/month (cash flow negative)</li>
                        </ul>
                        <p className="mt-4 text-sm text-charcoal/60">Note: Negative cash flow can still be profitable if capital appreciation exceeds the shortfall.</p>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Return on Investment (ROI)</h3>
                    <p>
                        ROI measures the total return on your invested capital, including both rental income and capital appreciation.
                    </p>
                    <p className="font-semibold text-charcoal">Formula: ((Annual Profit + Capital Gain) ÷ Total Investment) × 100</p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Capital Growth</h3>
                    <p>
                        Capital growth is the increase in property value over time. In South Africa, property values have historically
                        grown at 5-7% annually, though this varies by location and market conditions.
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'roi-calculator',
                    title: 'ROI Calculator Template',
                    description: 'Calculate your return on investment',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">ROI Calculation Worksheet</h4>
                            <div className="space-y-3">
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-2">Property Purchase Price</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-2">Annual Rental Income</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-2">Annual Expenses (rates, levies, maintenance, etc.)</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
                                    <p className="text-sm font-semibold text-charcoal mb-1">Net Annual Profit</p>
                                    <p className="text-2xl font-bold text-gold">R 0</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'financing': {
            title: 'Investment Financing',
            icon: 'DollarSign',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Financing investment properties differs from primary residence loans. Banks typically require
                        higher deposits and charge higher interest rates for investment properties.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Deposit Requirements</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">First Investment Property:</strong> Typically 20-30% deposit required</li>
                            <li><strong className="text-charcoal">Second Investment Property:</strong> 30-40% deposit</li>
                            <li><strong className="text-charcoal">Third+ Properties:</strong> 40-50% deposit or higher</li>
                            <li><strong className="text-charcoal">Commercial Properties:</strong> Usually 30-50% deposit</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Interest Rates</h3>
                    <p>
                        Investment property loans typically have interest rates 0.5-1.5% higher than primary residence loans.
                        This is because banks consider investment properties higher risk.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Affordability Assessment</h3>
                    <p>
                        Banks will assess your ability to service multiple bonds. They typically:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Consider your total debt-to-income ratio across all properties</li>
                        <li>May require proof of rental income from existing properties</li>
                        <li>Stress test your ability to pay if rental income drops by 20-30%</li>
                        <li>Require strong credit history and stable income</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Leveraging Strategy</h3>
                    <p>
                        Using borrowed money (leverage) can amplify returns but also increases risk. If property values increase,
                        your percentage return on your own capital is much higher. However, if values decrease, losses are also magnified.
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'financing-checklist',
                    title: 'Investment Property Financing Checklist',
                    description: 'Essential documents and requirements for investment property loans',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Required Documents</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months payslips (if employed) or financial statements (if self-employed)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>3 months bank statements for all accounts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Rental income statements from existing properties (if applicable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Signed Offer to Purchase</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Property valuation report</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>ITC credit report</span>
                                </li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        'tax': {
            title: 'Tax & Legal Considerations',
            icon: 'PiggyBank',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Understanding tax implications and legal structures is crucial for maximizing returns and protecting your assets.
                        Always consult with a tax advisor for personalized advice.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Rental Income Tax</h3>
                    <p>
                        Rental income is taxable and must be declared in your annual tax return. However, you can deduct
                        various expenses to reduce your taxable rental income.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Deductible Expenses</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Interest on bond repayments (not capital portion)</li>
                            <li>Rates and taxes</li>
                            <li>Levies (if applicable)</li>
                            <li>Insurance premiums</li>
                            <li>Property management fees</li>
                            <li>Repairs and maintenance</li>
                            <li>Advertising for tenants</li>
                            <li>Legal and accounting fees related to the property</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Capital Gains Tax (CGT)</h3>
                    <p>
                        When you sell an investment property, you may be liable for Capital Gains Tax on the profit.
                        The annual exclusion is R40,000 for individuals, and only 40% of the capital gain is included in taxable income.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Legal Structures</h3>
                    <p>
                        Consider whether to hold properties in your personal name, a trust, or a company. Each has different
                        tax implications, asset protection benefits, and estate planning considerations.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Transfer Duty</h3>
                    <p>
                        Investment properties are subject to the same transfer duty rates as primary residences.
                        Properties under R1.1 million are exempt, with progressive rates above that threshold.
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'tax-deduction-tracker',
                    title: 'Tax Deduction Tracker',
                    description: 'Track deductible expenses for your tax return',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Annual Expense Tracking</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Bond Interest (not capital)</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Rates & Taxes</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Maintenance & Repairs</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                                    <p className="text-sm font-semibold text-charcoal mb-1">Total Deductible Expenses</p>
                                    <p className="text-xl font-bold text-gold">R 0</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'portfolio': {
            title: 'Portfolio Management',
            icon: 'Building2',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Managing multiple properties requires systems, processes, and strategic thinking to maximize returns
                        while minimizing stress and time commitment.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Property Management Options</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Self-Management vs. Professional Management</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold text-charcoal mb-2">Self-Management</p>
                                <ul className="list-disc pl-6 space-y-1 text-sm text-charcoal/70">
                                    <li>Save on management fees (8-12%)</li>
                                    <li>Full control over tenant selection</li>
                                    <li>Time-intensive</li>
                                    <li>Requires knowledge of rental laws</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-charcoal mb-2">Professional Management</p>
                                <ul className="list-disc pl-6 space-y-1 text-sm text-charcoal/70">
                                    <li>Handles tenant issues 24/7</li>
                                    <li>Expert knowledge of rental laws</li>
                                    <li>Frees up your time</li>
                                    <li>Costs 8-12% of rental income</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Tenant Selection</h3>
                    <p>
                        Good tenants are crucial for successful property investment. Always conduct thorough credit checks,
                        verify employment, and check references from previous landlords.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Maintenance Planning</h3>
                    <p>
                        Regular maintenance prevents costly repairs and keeps properties attractive to tenants.
                        Create a maintenance schedule and budget 1-2% of property value annually for maintenance.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Scaling Your Portfolio</h3>
                    <p>
                        As you build equity in existing properties, you can use that equity to finance additional purchases.
                        This strategy, called &quot;leveraging,&quot; can accelerate portfolio growth but increases risk.
                    </p>
                </div>
            ),
            toolkit: [
                {
                    id: 'portfolio-tracker',
                    title: 'Portfolio Tracker',
                    description: 'Track all your investment properties in one place',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Property Portfolio Overview</h4>
                            <div className="space-y-3">
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <p className="text-sm font-semibold text-charcoal mb-2">Property 1</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-charcoal/60">Purchase Price</p>
                                            <p className="font-semibold text-charcoal">R 0</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Monthly Rental</p>
                                            <p className="font-semibold text-charcoal">R 0</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Yield</p>
                                            <p className="font-semibold text-charcoal">0%</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Cash Flow</p>
                                            <p className="font-semibold text-charcoal">R 0</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
                                    <p className="text-sm font-semibold text-charcoal mb-2">Portfolio Totals</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-charcoal/60">Total Value</p>
                                            <p className="font-bold text-gold text-lg">R 0</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Monthly Income</p>
                                            <p className="font-bold text-gold text-lg">R 0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'market-analysis': {
            title: 'Market Analysis',
            icon: 'TrendingUp',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Successful property investment requires understanding market dynamics, identifying growth areas,
                        and making data-driven decisions rather than emotional ones.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Location Analysis</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Location Factors</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Infrastructure:</strong> Proximity to schools, hospitals, shopping centers, public transport</li>
                            <li><strong className="text-charcoal">Employment Hubs:</strong> Areas with growing job markets</li>
                            <li><strong className="text-charcoal">Development Plans:</strong> Upcoming infrastructure projects or developments</li>
                            <li><strong className="text-charcoal">Safety:</strong> Crime statistics and security measures</li>
                            <li><strong className="text-charcoal">Demographics:</strong> Population growth, age demographics, income levels</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Property Valuation Methods</h3>
                    <p>
                        Understanding how properties are valued helps you identify good deals and avoid overpaying.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Comparative Market Analysis (CMA):</strong> Compare with similar recently sold properties</li>
                        <li><strong>Income Approach:</strong> Value based on rental income potential (for investment properties)</li>
                        <li><strong>Cost Approach:</strong> Land value + construction cost - depreciation</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Market Cycles</h3>
                    <p>
                        Property markets move in cycles: expansion, peak, contraction, and recovery. Understanding where
                        the market is in the cycle can inform your buying and selling decisions.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Research Tools</h3>
                    <p>
                        Use multiple sources for market research:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Property portals (Property24, Private Property) for price trends</li>
                        <li>Municipal records for rates and property values</li>
                        <li>Local estate agents for market insights</li>
                        <li>Property investment forums and communities</li>
                        <li>Economic indicators (GDP growth, interest rates, employment data)</li>
                    </ul>
                </div>
            ),
            toolkit: [
                {
                    id: 'property-analysis-template',
                    title: 'Property Analysis Template',
                    description: 'Evaluate potential investment properties systematically',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Property Evaluation Checklist</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Property Address</label>
                                    <input type="text" placeholder="Enter address" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Asking Price</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Estimated Rental Income</label>
                                    <input type="text" placeholder="R 0/month" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Comparable Sales in Area</label>
                                    <textarea placeholder="List similar properties and their sale prices" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" rows={3}></textarea>
                                </div>
                                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                                    <p className="text-sm font-semibold text-charcoal mb-1">Gross Rental Yield</p>
                                    <p className="text-xl font-bold text-gold">0%</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'pre-purchase-mistakes': {
            title: 'Pre-Purchase Mistakes',
            icon: 'AlertTriangle',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        The decisions you make before purchasing a property can make or break your investment.
                        Many investors make costly mistakes during the pre-purchase phase that could have been avoided
                        with proper research and objective analysis. Here are the critical mistakes to avoid before you buy.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Insufficient Research & Due Diligence</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">The Mistake</h4>
                        <p className="mb-3 text-charcoal/70">
                            Jumping into a purchase without thoroughly researching the property, area, market conditions,
                            or property history. This leads to overpaying, buying in declining areas, or purchasing properties
                            with hidden problems.
                        </p>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">How to Avoid It</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Research the area&apos;s growth trends, crime statistics, and development plans</li>
                            <li>Get a professional property inspection before purchase</li>
                            <li>Check comparable sales in the area (CMA) to ensure fair pricing</li>
                            <li>Review property history, including previous sales and any issues</li>
                            <li>Verify rental rates in the area if buying for investment</li>
                            <li>Check municipal rates, levies, and any outstanding debts on the property</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Emotional Decision-Making</h3>
                    <p>
                        Property investment should be a business decision, not an emotional one. Falling in love with a property
                        or making decisions based on fear of missing out (FOMO) leads to poor financial outcomes.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Common Emotional Traps</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">FOMO:</strong> Buying because you&apos;re afraid prices will rise</li>
                            <li><strong className="text-charcoal">Attachment:</strong> Overpaying because you &quot;love&quot; the property</li>
                            <li><strong className="text-charcoal">Pride:</strong> Not walking away from a bad deal to save face</li>
                            <li><strong className="text-charcoal">Impatience:</strong> Rushing into purchases without proper analysis</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Solution</h4>
                        <p className="text-charcoal/70">
                            Always use objective criteria: rental yield, cash flow, growth potential, and ROI. If a property
                            doesn&apos;t meet your investment criteria, walk away—there will always be other opportunities.
                        </p>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Underestimating Costs</h3>
                    <p>
                        Many investors only calculate the purchase price and monthly bond repayment, forgetting about all the
                        other costs that come with property ownership.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Hidden Costs Often Overlooked</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Transfer costs:</strong> 8-10% of purchase price (duty, transfer fees, bond registration)</li>
                            <li><strong className="text-charcoal">Municipal rates & levies:</strong> Monthly costs that can be substantial</li>
                            <li><strong className="text-charcoal">Insurance:</strong> Building and landlord insurance</li>
                            <li><strong className="text-charcoal">Maintenance & repairs:</strong> Budget 1-2% of property value annually</li>
                            <li><strong className="text-charcoal">Property management:</strong> 8-12% of rental income if using an agent</li>
                            <li><strong className="text-charcoal">Vacancy periods:</strong> 1-2 months per year without rental income</li>
                            <li><strong className="text-charcoal">Legal & accounting:</strong> Tax preparation, lease agreements, evictions if needed</li>
                            <li><strong className="text-charcoal">Unexpected repairs:</strong> Major issues like roof leaks, plumbing, electrical</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Best Practice</h4>
                        <p className="text-charcoal/70">
                            Create a detailed budget spreadsheet before purchasing. Factor in all costs and ensure you have
                            a buffer for unexpected expenses. Only proceed if the numbers work with all costs included.
                        </p>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Poor Location Choice</h3>
                    <p>
                        The old adage &quot;location, location, location&quot; exists for a reason. A great property in a poor location
                        will struggle to appreciate and attract quality tenants.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Location Red Flags</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>High crime rates or declining safety</li>
                            <li>Poor infrastructure (roads, public transport, utilities)</li>
                            <li>Limited access to schools, hospitals, shopping centers</li>
                            <li>High vacancy rates in the area</li>
                            <li>Declining property values or stagnant growth</li>
                            <li>Over-supply of rental properties</li>
                            <li>Planned developments that could negatively impact the area</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">What to Look For</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Growing population and employment opportunities</li>
                            <li>Good schools, hospitals, and amenities nearby</li>
                            <li>Low vacancy rates and high rental demand</li>
                            <li>Upcoming infrastructure projects or developments</li>
                            <li>Stable or increasing property values</li>
                            <li>Safe neighborhoods with good security</li>
                        </ul>
                    </div>

                    <div className="premium-card p-6 rounded-xl mt-8 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Takeaway</h4>
                        <p className="text-charcoal/80 leading-relaxed">
                            The pre-purchase phase is your opportunity to protect your investment before you commit.
                            Always do thorough research, use objective criteria, and choose locations with strong fundamentals.
                            If a property doesn&apos;t meet your investment criteria, walk away—there will always be other opportunities.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'pre-purchase-checklist',
                    title: 'Pre-Purchase Checklist',
                    description: 'Use this checklist to avoid mistakes before purchasing',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Pre-Purchase Due Diligence Checklist</h4>
                            <div className="space-y-3">
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Property inspection completed</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Comparable sales researched (CMA)</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Area growth trends analyzed</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Location factors verified (safety, amenities, infrastructure)</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Rental rates verified in area</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Property history checked (no hidden issues)</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Objective investment criteria met (not emotional decision)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'financial-mistakes': {
            title: 'Financial Mistakes',
            icon: 'AlertTriangle',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Financial mistakes are among the most costly errors property investors make. Poor financial planning,
                        underestimating costs, and over-leveraging can quickly turn a promising investment into a financial burden.
                        Here&apos;s how to avoid the most common financial pitfalls.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Underestimating Costs</h3>
                    <p>
                        Using too much debt to finance properties can be dangerous. While leverage can amplify returns,
                        it also amplifies risk, especially when interest rates rise or rental income drops.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">The Risks</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Negative cash flow if rental doesn&apos;t cover all costs</li>
                            <li>Vulnerability to interest rate increases</li>
                            <li>Difficulty servicing debt if you lose your job or income drops</li>
                            <li>Forced sales at bad times if you can&apos;t meet obligations</li>
                            <li>Limited ability to handle unexpected expenses</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Safe Leverage Guidelines</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Ensure positive cash flow after all expenses</li>
                            <li>Maintain a loan-to-value (LTV) ratio below 80% when possible</li>
                            <li>Keep a cash reserve (6-12 months of expenses) for emergencies</li>
                            <li>Don&apos;t rely on capital growth to make deals work—ensure cash flow is sustainable</li>
                            <li>Stress test your portfolio: what happens if interest rates rise 2-3%?</li>
                        </ul>
                    </div>

                    <p>
                        Bad tenants can cost you thousands in unpaid rent, property damage, and legal fees.
                        Rushing tenant selection to fill a vacancy quickly is a costly mistake.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Screening Mistakes</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Not checking credit history or credit score</li>
                            <li>Skipping employment verification</li>
                            <li>Not contacting previous landlords for references</li>
                            <li>Accepting tenants without proper lease agreements</li>
                            <li>Not verifying identity and income</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Proper Screening Process</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Require completed application forms with all details</li>
                            <li>Run credit checks (use reputable credit bureaus)</li>
                            <li>Verify employment and income (payslips, bank statements)</li>
                            <li>Contact at least 2 previous landlords</li>
                            <li>Verify identity (ID copy) and check for any red flags</li>
                            <li>Ensure monthly income is at least 3x the rental amount</li>
                            <li>Use proper lease agreements that comply with South African rental laws</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Neglecting Property Maintenance</h3>
                    <p>
                        Deferring maintenance to save money is a false economy. Small issues become expensive problems,
                        and poorly maintained properties lose value and struggle to attract quality tenants.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Consequences of Neglect</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Small repairs become major, expensive fixes</li>
                            <li>Property value decreases</li>
                            <li>Difficulty attracting and retaining good tenants</li>
                            <li>Higher vacancy rates</li>
                            <li>Legal issues if property becomes uninhabitable</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Maintenance Best Practices</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Budget 1-2% of property value annually for maintenance</li>
                            <li>Conduct regular property inspections (quarterly or bi-annually)</li>
                            <li>Address issues immediately—don&apos;t let them escalate</li>
                            <li>Keep records of all maintenance and repairs</li>
                            <li>Build relationships with reliable contractors</li>
                            <li>Plan for major expenses (roof, plumbing, electrical) every 10-15 years</li>
                        </ul>
                    </div>

                    <div className="premium-card p-6 rounded-xl mt-8 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Takeaway</h4>
                        <p className="text-charcoal/80 leading-relaxed">
                            Good property management protects your investment and maximizes returns. Take time to screen tenants
                            properly, and never skimp on maintenance. A well-maintained property with quality tenants is the
                            foundation of a successful investment portfolio.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'tenant-screening-checklist',
                    title: 'Tenant Screening Checklist',
                    description: 'Use this checklist to properly screen potential tenants',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Tenant Screening Checklist</h4>
                            <div className="space-y-3">
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Application form completed with all details</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Credit check completed</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Employment verified (payslips, bank statements)</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Income is at least 3x monthly rental</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">2+ previous landlord references checked</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Identity verified (ID copy)</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-gold rounded" />
                                        <span className="text-sm font-semibold text-charcoal">Proper lease agreement prepared</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'portfolio-strategy-mistakes': {
            title: 'Portfolio Strategy Mistakes',
            icon: 'AlertTriangle',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Building a successful property portfolio requires strategic thinking and long-term planning.
                        Many investors make mistakes in portfolio strategy, tax planning, and setting realistic expectations
                        that undermine their investment success. Here&apos;s how to avoid these critical errors.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Lack of Diversification</h3>
                    <p>
                        Putting all your investment capital into a single property or one area creates significant risk.
                        If that property or area underperforms, your entire investment suffers.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Diversification Risks</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>All properties in one area (local economic downturn affects all)</li>
                            <li>All properties of the same type (e.g., only apartments)</li>
                            <li>All properties in the same price range</li>
                            <li>No cash reserves or other asset classes</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">How to Diversify</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Spread properties across different suburbs or cities</li>
                            <li>Mix property types (residential, commercial, different sizes)</li>
                            <li>Vary price ranges and tenant demographics</li>
                            <li>Maintain cash reserves for opportunities and emergencies</li>
                            <li>Consider other asset classes alongside property</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Ignoring Tax Implications</h3>
                    <p>
                        Property investment has significant tax implications. Not understanding or planning for taxes
                        can eat into your returns and create legal problems.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Common Tax Mistakes</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Not declaring rental income to SARS</li>
                            <li>Not claiming all allowable deductions (maintenance, rates, interest, etc.)</li>
                            <li>Not understanding capital gains tax implications when selling</li>
                            <li>Not using tax-efficient structures (trusts, companies) when appropriate</li>
                            <li>Poor record-keeping leading to missed deductions or compliance issues</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Tax Planning Essentials</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Keep detailed records of all income and expenses</li>
                            <li>Work with a tax professional who understands property investment</li>
                            <li>Understand what expenses are deductible</li>
                            <li>Plan for capital gains tax when selling</li>
                            <li>Consider the tax implications of different ownership structures</li>
                            <li>Stay compliant with SARS requirements</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Unrealistic Expectations</h3>
                    <p>
                        Property investment is not a get-rich-quick scheme. Many investors enter with unrealistic
                        expectations about returns, timelines, and effort required, leading to disappointment and poor decisions.
                    </p>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                        <h4 className="text-xl font-bold text-red-600 mb-3">Unrealistic Expectations</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Expecting immediate high returns</li>
                            <li>Believing property always appreciates quickly</li>
                            <li>Thinking it&apos;s passive income with no work required</li>
                            <li>Expecting properties to always be tenanted</li>
                            <li>Underestimating the time and effort needed</li>
                        </ul>
                        <h4 className="text-xl font-bold text-gold mb-3 mt-4">Realistic Property Investment</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Property investment is a long-term strategy (5-10+ years)</li>
                            <li>Returns come from both rental income and capital growth over time</li>
                            <li>It requires active management or paying for property management</li>
                            <li>There will be vacancies, repairs, and challenges</li>
                            <li>Success requires education, patience, and discipline</li>
                            <li>Focus on building wealth gradually, not overnight</li>
                        </ul>
                    </div>

                    <div className="premium-card p-6 rounded-xl mt-8 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Takeaway</h4>
                        <p className="text-charcoal/80 leading-relaxed">
                            Building a successful property portfolio requires strategic thinking, proper diversification,
                            tax planning, and realistic expectations. Focus on long-term wealth building through disciplined
                            investing, and always work with professionals who understand property investment.
                        </p>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'portfolio-diversification-template',
                    title: 'Portfolio Diversification Tracker',
                    description: 'Track your portfolio diversification across locations and property types',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Portfolio Diversification Analysis</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Properties by Location</label>
                                    <textarea placeholder="List properties and their locations" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" rows={3}></textarea>
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Property Types</label>
                                    <textarea placeholder="List property types (residential, commercial, etc.)" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" rows={2}></textarea>
                                </div>
                                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                                    <label className="block text-sm font-semibold text-charcoal mb-1">Cash Reserves</label>
                                    <input type="text" placeholder="R 0" className="w-full px-3 py-2 border border-charcoal/20 rounded-lg" />
                                </div>
                                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                                    <p className="text-sm font-semibold text-charcoal mb-1">Diversification Score</p>
                                    <p className="text-xl font-bold text-gold">Good - Well Diversified</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        }
    };

    // Ordered list of modules for "Next topic" navigation
    const moduleOrder = [
        'strategies',
        'returns',
        'financing',
        'tax',
        'portfolio',
        'market-analysis',
        'pre-purchase-mistakes',
        'financial-mistakes',
        'property-management-mistakes',
        'portfolio-strategy-mistakes'
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
                    <Link href="/learn/investors" className="text-gold hover:underline">Back to Property Investors Learning Center</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-charcoal/5">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/learn/investors" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Property Investors</span>
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
                                            A focused learning module to guide you step-by-step on your property investment journey.
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
                                    href="/learn/investors"
                                    className="text-charcoal/70 hover:text-charcoal transition flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Topics
                                </Link>

                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:items-center md:ml-auto">
                                    {nextModule && (
                                        <Link
                                            href={`/learn/investors/${nextSlug}`}
                                            className="px-6 py-3 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/10 transition shadow-sm text-center"
                                        >
                                            Next Topic: {nextModule.title}
                                        </Link>
                                    )}

                                    <Link
                                        href="/search"
                                        className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition shadow-lg text-center"
                                    >
                                        Browse Properties
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
