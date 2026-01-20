import Link from 'next/link';
import LearningToolkit from '@/components/LearningToolkit';
import CommissionCalculator from '@/components/CommissionCalculator';
import { ArrowLeft, Home, DollarSign, Users, Target, FileText, BarChart3, CheckCircle, Calendar, BookOpen } from 'lucide-react';

export default async function SellersLearningModulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Content mapping (in a real app this would come from a CMS or database)
    const modules: Record<string, any> = {
        'pricing-strategy': {
            title: 'Pricing Your Property',
            icon: 'DollarSign',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Setting the right price is crucial for selling your property quickly and at the best value.
                        Here&apos;s what you need to know about pricing your property.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Understanding Market Valuations</h3>
                    <p className="text-charcoal/70 leading-relaxed">
                        A market valuation is an estimate of what your property is worth based on recent sales of similar properties in your area.
                        Estate agents typically provide a Comparative Market Analysis (CMA) that shows:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li>Recent sales of similar properties in your suburb</li>
                        <li>Current listings of comparable properties</li>
                        <li>Market trends in your area</li>
                        <li>Your property&apos;s unique features and condition</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Factors That Affect Property Value</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Value Drivers</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Location:</strong> Proximity to schools, shopping centers, and transport</li>
                            <li><strong className="text-charcoal">Size:</strong> Square meters, number of bedrooms and bathrooms</li>
                            <li><strong className="text-charcoal">Condition:</strong> Age, maintenance, and renovations</li>
                            <li><strong className="text-charcoal">Features:</strong> Pool, garden, security, parking</li>
                            <li><strong className="text-charcoal">Market Conditions:</strong> Supply and demand in your area</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Pricing Strategies</h3>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Competitive Pricing</h4>
                            <p className="text-charcoal/70 leading-relaxed text-sm">Price at or slightly below market value to attract multiple offers and create competition among buyers.</p>
                        </div>
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Premium Pricing</h4>
                            <p className="text-charcoal/70 leading-relaxed text-sm">Price above market value if your property has unique features or is in exceptional condition. Be prepared for longer selling times.</p>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Common Pricing Mistakes</h3>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li><strong className="text-charcoal">Overpricing:</strong> Properties priced too high sit on the market longer and may sell for less than market value</li>
                        <li><strong className="text-charcoal">Emotional Pricing:</strong> Basing price on what you need rather than market value</li>
                        <li><strong className="text-charcoal">Ignoring Market Conditions:</strong> Not adjusting for current market trends</li>
                        <li><strong className="text-charcoal">Not Getting Multiple Valuations:</strong> Always get at least 2-3 valuations from different agents</li>
                    </ul>
                </div>
            ),
            toolkit: [
                {
                    id: 'pricing-checklist',
                    title: 'Property Pricing Checklist',
                    description: 'Essential steps and factors to consider when pricing your property',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Before Setting Your Price</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Get at least 2-3 valuations from different agents</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Review comparable sales (comps) in your area</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Check current listings of similar properties</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Consider market conditions (buyer's or seller's market)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Factor in your property's unique features and condition</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Pricing Strategy Considerations</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Competitive pricing: Price at or slightly below market value</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Premium pricing: Only if property has exceptional features</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Leave room for negotiation (typically 5-10%)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Be realistic about market conditions</span>
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'valuation-comparison-template',
                    title: 'Valuation Comparison Template',
                    description: 'Template to compare valuations from different agents',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Agent Valuation Comparison</h4>
                                
                                <div className="space-y-4">
                                    <div className="border-b border-charcoal/10 pb-4">
                                        <label className="text-sm font-semibold text-charcoal/70">Agent 1</label>
                                        <div className="mt-2 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Valuation:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Commission:</span>
                                                <span className="text-charcoal/50">_________________%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Comparable Sales Provided:</span>
                                                <span className="text-charcoal/50">Yes / No</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-b border-charcoal/10 pb-4">
                                        <label className="text-sm font-semibold text-charcoal/70">Agent 2</label>
                                        <div className="mt-2 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Valuation:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Commission:</span>
                                                <span className="text-charcoal/50">_________________%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Comparable Sales Provided:</span>
                                                <span className="text-charcoal/50">Yes / No</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Agent 3</label>
                                        <div className="mt-2 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Valuation:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Commission:</span>
                                                <span className="text-charcoal/50">_________________%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Comparable Sales Provided:</span>
                                                <span className="text-charcoal/50">Yes / No</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-charcoal/80"><strong>Tip:</strong> Don't automatically choose the agent with the highest valuation. Ask for evidence (comparable sales) to support their price. The agent who provides the best marketing plan and realistic valuation is often the better choice.</p>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'agent-selection': {
            title: 'Choosing the Right Agent',
            icon: 'Users',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Choosing the right estate agent is one of the most important decisions you&apos;ll make when selling your property.
                        Here&apos;s how to find the best agent for your needs.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Understanding Agent Mandates</h3>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Sole Mandate</h4>
                            <p className="text-charcoal/70 leading-relaxed text-sm">One agent has exclusive rights to market your property for a set period (usually 3-6 months). They typically work harder and may negotiate better commission rates.</p>
                        </div>
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Open Mandate</h4>
                            <p className="text-charcoal/70 leading-relaxed text-sm">Multiple agents can market your property. The first to find a buyer earns the commission. Can create competition but may lead to less focused marketing.</p>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Agent Commissions</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Standard Commission Rates</h4>
                        <p className="mb-4 text-charcoal/70 leading-relaxed">
                            Agent commissions in South Africa typically range from 3% to 8% of the selling price, plus VAT.
                            The commission is negotiable and may vary based on:
                        </p>
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-charcoal/80">
                                <strong>Important:</strong> Agents typically share a percentage of their commission with the agency they work with. Not all of the commission goes directly to the individual agent. The split between agent and agency varies by agency and agreement.
                            </p>
                        </div>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Property value (higher value properties may have lower percentages)</li>
                            <li>Type of mandate (sole mandates may have better rates)</li>
                            <li>Market conditions</li>
                            <li>Agent&apos;s experience and track record</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. What to Look for in an Agent</h3>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li><strong className="text-charcoal">Area Specialist:</strong> Choose an agent who sells many properties in your specific suburb</li>
                        <li><strong className="text-charcoal">Track Record:</strong> Ask for evidence of recent sales and average days on market</li>
                        <li><strong className="text-charcoal">Marketing Plan:</strong> Ask exactly how they plan to market your property (photos, portals, social media)</li>
                        <li><strong className="text-charcoal">Communication:</strong> Choose someone who responds quickly and keeps you informed</li>
                        <li><strong className="text-charcoal">Valuation Evidence:</strong> Don&apos;t just pick the agent who gives the highest price - ask for comparable sales to back up their valuation</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Questions to Ask Potential Agents</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-blue-50 border border-blue-100">
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>How many properties have you sold in this area in the last 12 months?</li>
                            <li>What is your average days on market?</li>
                            <li>What is your marketing strategy for my property?</li>
                            <li>What commission rate do you charge?</li>
                            <li>Can you provide references from recent sellers?</li>
                            <li>How will you keep me updated on viewings and offers?</li>
                        </ul>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'agent-selection-checklist',
                    title: 'Agent Selection Checklist',
                    description: 'Key factors to consider when choosing an estate agent',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Essential Criteria</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Area specialist (sells many properties in your suburb)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Strong track record (recent sales, average days on market)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Provides comparable sales (comps) for their valuation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Clear marketing plan (photos, portals, social media)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>PPRA registered with valid FFC</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Good references from recent sellers</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Mandate Considerations</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Sole mandate: Better focus, may negotiate commission</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Open mandate: Multiple agents, but less focused marketing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Typical sole mandate period: 3-6 months</span>
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'agent-questions-template',
                    title: 'Questions to Ask Agents Template',
                    description: 'Important questions to ask potential agents before signing',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Agent Interview Questions</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-semibold text-charcoal mb-2">Track Record</p>
                                        <ul className="text-sm text-charcoal/70 space-y-1">
                                            <li>• How many properties have you sold in this area in the last 12 months?</li>
                                            <li>• What is your average days on market?</li>
                                            <li>• Can you provide references from recent sellers?</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-charcoal mb-2">Valuation</p>
                                        <ul className="text-sm text-charcoal/70 space-y-1">
                                            <li>• How did you arrive at this valuation?</li>
                                            <li>• Can you show me comparable sales (comps)?</li>
                                            <li>• Why is your valuation different from other agents?</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-charcoal mb-2">Marketing</p>
                                        <ul className="text-sm text-charcoal/70 space-y-1">
                                            <li>• What is your marketing strategy for my property?</li>
                                            <li>• Which portals will you list on?</li>
                                            <li>• Will you use professional photography?</li>
                                            <li>• How will you handle viewings?</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-charcoal mb-2">Commission & Terms</p>
                                        <ul className="text-sm text-charcoal/70 space-y-1">
                                            <li>• What commission rate do you charge?</li>
                                            <li>• Is the commission negotiable?</li>
                                            <li>• Do you recommend a sole or open mandate?</li>
                                            <li>• What is the mandate period?</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'marketing': {
            title: 'Marketing Your Property',
            icon: 'Target',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Effective marketing is essential for attracting qualified buyers and selling your property quickly.
                        Here&apos;s how to market your property effectively.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Professional Photography</h3>
                    <p className="text-charcoal/70 leading-relaxed">
                        High-quality photos are the first thing potential buyers see. Professional photography can significantly increase interest in your property.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70 mt-4">
                        <li>Use a professional photographer who specializes in real estate</li>
                        <li>Ensure good lighting and staging before photos are taken</li>
                        <li>Include photos of all rooms, outdoor spaces, and unique features</li>
                        <li>Consider virtual tours or 360-degree photos for online listings</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Property Staging</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Staging Tips</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Declutter:</strong> Remove personal items and excess furniture</li>
                            <li><strong className="text-charcoal">Deep Clean:</strong> Ensure the property is spotless for viewings</li>
                            <li><strong className="text-charcoal">Neutral Colors:</strong> Use neutral tones to appeal to a wider audience</li>
                            <li><strong className="text-charcoal">Curb Appeal:</strong> First impressions matter - maintain the garden and exterior</li>
                            <li><strong className="text-charcoal">Fix Minor Issues:</strong> Repair broken fixtures, touch up paint, fix leaky taps</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Online Listings</h3>
                    <p className="text-charcoal/70 leading-relaxed">
                        Most buyers start their property search online. Ensure your property is listed on:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70 mt-4">
                        <li>Major property portals (Property24, Private Property, Gumtree)</li>
                        <li>Agent&apos;s website and social media</li>
                        <li>PropReady platform</li>
                        <li>Local community groups and forums</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Effective Listing Descriptions</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-blue-50 border border-blue-100">
                        <p className="text-charcoal/70 leading-relaxed mb-3">
                            A good listing description should include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Key features and selling points</li>
                            <li>Accurate measurements and room counts</li>
                            <li>Location benefits (schools, transport, amenities)</li>
                            <li>Recent renovations or upgrades</li>
                            <li>Clear, honest information about the property</li>
                        </ul>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'staging-checklist',
                    title: 'Property Staging Checklist',
                    description: 'Complete checklist for preparing your home for sale',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">Interior Preparation</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Deep clean entire property (consider professional cleaning)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Declutter - remove personal items and excess furniture</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Depersonalize - remove family photos and memorabilia</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Fix minor issues (broken fixtures, leaky taps, touch up paint)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Neutral colors - repaint bold colors if needed</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Organize closets and storage spaces</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Exterior & Curb Appeal</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Maintain garden and landscaping</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Paint front door if needed</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Clean exterior walls and windows</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Ensure entrance is welcoming and well-lit</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">For Viewings</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Open curtains and turn on lights</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Remove pets or secure them safely</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Avoid strong cooking smells</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Leave during viewings to let buyers explore freely</span>
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'listing-description-template',
                    title: 'Property Listing Description Template',
                    description: 'Template for writing an effective property listing',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Listing Description Template</h4>
                                
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="font-semibold text-charcoal/70 block mb-2">Headline (50-60 characters)</label>
                                        <p className="text-charcoal/50 italic">e.g., "Stunning 3-Bedroom Family Home in [Suburb]"</p>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-charcoal/70 block mb-2">Opening Statement</label>
                                        <p className="text-charcoal/50 italic mb-2">Start with the most compelling feature:</p>
                                        <p className="text-charcoal/50">"This beautifully maintained [property type] offers [key feature] in the heart of [suburb]..."</p>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-charcoal/70 block mb-2">Key Features</label>
                                        <ul className="text-charcoal/50 space-y-1 list-disc list-inside">
                                            <li>Number of bedrooms and bathrooms</li>
                                            <li>Square meters / size</li>
                                            <li>Special features (pool, garden, security, etc.)</li>
                                            <li>Recent renovations or upgrades</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-charcoal/70 block mb-2">Location Benefits</label>
                                        <ul className="text-charcoal/50 space-y-1 list-disc list-inside">
                                            <li>Proximity to schools, shopping, transport</li>
                                            <li>Neighborhood amenities</li>
                                            <li>Safety and security features</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-charcoal/70 block mb-2">Call to Action</label>
                                        <p className="text-charcoal/50 italic">"Contact us today to arrange a viewing!"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'sale-process': {
            title: 'The Selling Process',
            icon: 'FileText',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Understanding the selling process helps you know what to expect and when.
                        Here&apos;s a step-by-step guide to selling your property.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. The Timeline</h3>
                    <div className="space-y-8 mt-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Listing Your Property</h3>
                                <p className="text-charcoal/70 leading-relaxed">Your agent markets the property, conducts viewings, and presents offers to you.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Accepting an Offer</h3>
                                <p className="text-charcoal/70 leading-relaxed">You review and accept an offer. The buyer signs the Offer to Purchase (OTP), which becomes a sale agreement once you sign.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Bond Approval</h3>
                                <p className="text-charcoal/70 leading-relaxed">The buyer secures financing (typically 21-30 days). If the buyer cannot secure a bond, the sale may fall through.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-white font-bold flex items-center justify-center">4</div>
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Conveyancing</h3>
                                <p className="text-charcoal/70 leading-relaxed">Attorneys handle the legal transfer. Your bond is cancelled, and the property is transferred to the buyer (typically 60-90 days).</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-12 mb-4">2. Understanding Conveyancers</h3>
                    <p className="text-charcoal/70 leading-relaxed">Three different attorneys are typically involved:</p>
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
                            <p className="text-sm text-charcoal/70 leading-relaxed">Appointed by the <strong className="text-charcoal">Seller&apos;s Bank</strong>, paid by the <strong className="text-charcoal">Seller</strong>. They cancel your existing bond.</p>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Negotiating Offers</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Key Considerations</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Price:</strong> Is the offer close to your asking price?</li>
                            <li><strong className="text-charcoal">Conditions:</strong> Subject to bond approval, home inspection, etc.</li>
                            <li><strong className="text-charcoal">Occupancy Date:</strong> When does the buyer want to move in?</li>
                            <li><strong className="text-charcoal">Deposit:</strong> A larger deposit shows serious intent</li>
                            <li><strong className="text-charcoal">Buyer&apos;s Financial Position:</strong> Pre-approved buyers are more reliable</li>
                        </ul>
                    </div>
                </div>
            ),
            toolkit: [
                {
                    id: 'selling-timeline-checklist',
                    title: 'Selling Process Timeline Checklist',
                    description: 'Track your progress through each step of the selling process',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">1</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal">Property Listed</p>
                                    <p className="text-sm text-charcoal/60">Agent markets property, conducts viewings</p>
                                    <p className="text-xs text-charcoal/50 mt-1">Target: Day 0</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">2</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal">Offer Received</p>
                                    <p className="text-sm text-charcoal/60">Review and accept offer, sign OTP</p>
                                    <p className="text-xs text-charcoal/50 mt-1">Target: Day 7-30</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">3</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal">Buyer's Bond Approved</p>
                                    <p className="text-sm text-charcoal/60">Buyer secures financing (21-30 days)</p>
                                    <p className="text-xs text-charcoal/50 mt-1">Target: Day 30-60</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">4</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal">Conveyancing Started</p>
                                    <p className="text-sm text-charcoal/60">Attorneys handle legal transfer</p>
                                    <p className="text-xs text-charcoal/50 mt-1">Target: Day 60-90</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-charcoal/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gold text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">5</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-charcoal">Property Transferred</p>
                                    <p className="text-sm text-charcoal/60">Property officially sold!</p>
                                    <p className="text-xs text-charcoal/50 mt-1">Target: Day 90-120</p>
                                </div>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'offer-evaluation-template',
                    title: 'Offer Evaluation Template',
                    description: 'Template to evaluate and compare offers from buyers',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Offer Evaluation</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Offer Price</label>
                                        <p className="text-charcoal/50 text-xs mt-1">R _________________</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Deposit Amount</label>
                                        <p className="text-charcoal/50 text-xs mt-1">R _________________</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Occupancy Date</label>
                                        <p className="text-charcoal/50 text-xs mt-1">_________________</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Conditions</label>
                                        <ul className="text-xs text-charcoal/50 space-y-1 mt-1">
                                            <li>□ Subject to bond approval</li>
                                            <li>□ Subject to home inspection</li>
                                            <li>□ Other: _________________</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Buyer's Financial Position</label>
                                        <ul className="text-xs text-charcoal/50 space-y-1 mt-1">
                                            <li>□ Pre-approved for bond</li>
                                            <li>□ Cash buyer</li>
                                            <li>□ Other: _________________</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'costs': {
            title: 'Selling Costs & Fees',
            icon: 'BarChart3',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Selling a property involves various costs and fees. Understanding these upfront helps you budget correctly
                        and avoid surprises during the sale process.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Agent Commission</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <p className="mb-4 text-charcoal/70 leading-relaxed">
                            The largest cost when selling is typically the estate agent&apos;s commission, which ranges from 3% to 8% of the selling price, plus VAT (15%).
                        </p>
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-charcoal/80">
                                <strong>Note:</strong> Agents typically share a percentage of their commission with the agency they work with. Not all of the commission goes directly to the individual agent. The split between agent and agency varies by agency and agreement.
                            </p>
                        </div>
                        <p className="text-charcoal/70 leading-relaxed">
                            <strong className="text-charcoal">Example:</strong> If you sell for R1,000,000 at 5% commission:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70 mt-2">
                            <li>Commission: R50,000</li>
                            <li>VAT on commission: R7,500</li>
                            <li>Total: R57,500</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Bond Cancellation Costs</h3>
                    <p className="text-charcoal/70 leading-relaxed">
                        If you have a bond on the property, you&apos;ll need to pay cancellation fees to your bank:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70 mt-4">
                        <li><strong className="text-charcoal">Cancellation Attorney Fees:</strong> Typically R3,000 - R8,000</li>
                        <li><strong className="text-charcoal">Early Settlement Penalties:</strong> May apply if you cancel within a certain period (check your bond agreement)</li>
                        <li><strong className="text-charcoal">Outstanding Bond Balance:</strong> The full amount owed to the bank</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Rates, Levies, and Utilities</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-blue-50 border border-blue-100">
                        <p className="text-charcoal/70 leading-relaxed mb-3">
                            You are responsible for paying these up to the date of transfer:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li>Municipal rates and taxes (pro-rated to transfer date)</li>
                            <li>Body corporate levies (if applicable)</li>
                            <li>Water and electricity (final readings and settlement)</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Other Potential Costs</h3>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li><strong className="text-charcoal">Home Repairs:</strong> Fixing issues found during inspections</li>
                        <li><strong className="text-charcoal">Staging:</strong> Professional staging services (optional)</li>
                        <li><strong className="text-charcoal">Moving Costs:</strong> Hiring movers and related expenses</li>
                        <li><strong className="text-charcoal">Capital Gains Tax:</strong> May apply if the property is not your primary residence</li>
                    </ul>
                </div>
            ),
            toolkit: [
                {
                    id: 'commission-calculator',
                    title: 'Commission Calculator',
                    description: 'Interactive calculator to estimate agent commission and net proceeds',
                    type: 'template' as const,
                    content: <CommissionCalculator />
                },
                {
                    id: 'selling-costs-calculator',
                    title: 'Selling Costs Calculator Template',
                    description: 'Calculate all costs associated with selling your property',
                    type: 'template' as const,
                    content: (
                        <div className="space-y-4">
                            <div className="premium-card p-6 rounded-xl border border-charcoal/20">
                                <h4 className="font-bold text-charcoal text-lg mb-4">Selling Costs Breakdown</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-charcoal/70">Selling Price</label>
                                        <p className="text-charcoal/50 text-xs mt-1">R _________________</p>
                                    </div>

                                    <div className="border-t border-charcoal/10 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Agent Commission</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Commission Rate:</span>
                                                <span className="text-charcoal/50">_________________%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Commission Amount:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">VAT (15%):</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-charcoal">
                                                <span>Total Commission:</span>
                                                <span>R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/10 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Bond Cancellation</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Outstanding Bond Balance:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Cancellation Attorney Fees:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Early Settlement Penalties:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/10 pt-4">
                                        <h5 className="font-semibold text-charcoal mb-3">Other Costs</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Rates & Taxes (pro-rated):</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Levies (if applicable):</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-charcoal/70">Repairs/Staging:</span>
                                                <span className="text-charcoal/50">R _________________</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-gold/30 pt-4">
                                        <div className="flex justify-between font-bold text-lg text-charcoal">
                                            <span>Net Proceeds (Estimated):</span>
                                            <span>R _________________</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        'tips': {
            title: 'Seller Tips & Best Practices',
            icon: 'CheckCircle',
            content: (
                <div className="space-y-6 text-charcoal/90">
                    <p className="text-lg">
                        Selling your property successfully requires preparation, patience, and the right approach.
                        Here are essential tips to help you sell quickly and at the best price.
                    </p>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Preparing Your Home for Sale</h3>
                    <div className="premium-card p-6 rounded-xl mb-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h4 className="text-xl font-bold text-gold mb-3">Before Listing</h4>
                        <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                            <li><strong className="text-charcoal">Deep Clean:</strong> Professional cleaning makes a huge difference</li>
                            <li><strong className="text-charcoal">Declutter:</strong> Remove personal items and excess furniture</li>
                            <li><strong className="text-charcoal">Fix Minor Issues:</strong> Repair broken fixtures, touch up paint, fix leaky taps</li>
                            <li><strong className="text-charcoal">Curb Appeal:</strong> Maintain the garden, paint the front door, ensure the exterior looks inviting</li>
                            <li><strong className="text-charcoal">Depersonalize:</strong> Remove family photos and personal memorabilia</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Handling Viewings</h3>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li><strong className="text-charcoal">Be Flexible:</strong> Accommodate viewing times, even if inconvenient</li>
                        <li><strong className="text-charcoal">Leave During Viewings:</strong> Let buyers feel comfortable exploring without you present</li>
                        <li><strong className="text-charcoal">Create Atmosphere:</strong> Open curtains, turn on lights, play soft music</li>
                        <li><strong className="text-charcoal">Pet Management:</strong> Remove pets during viewings or ensure they&apos;re secured</li>
                        <li><strong className="text-charcoal">Fresh Scents:</strong> Avoid strong cooking smells; use subtle air fresheners</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Negotiating Offers</h3>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Do</h4>
                            <ul className="list-disc pl-6 space-y-2 text-charcoal/70 text-sm">
                                <li>Consider all offers seriously</li>
                                <li>Negotiate in good faith</li>
                                <li>Be realistic about market conditions</li>
                                <li>Consider the buyer&apos;s financial position</li>
                            </ul>
                        </div>
                        <div className="premium-card p-6 rounded-xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                            <h4 className="text-xl font-bold text-gold mb-2">Don&apos;t</h4>
                            <ul className="list-disc pl-6 space-y-2 text-charcoal/70 text-sm">
                                <li>Reject offers without consideration</li>
                                <li>Be too emotional about the price</li>
                                <li>Ignore market feedback</li>
                                <li>Make counter-offers that are unrealistic</li>
                            </ul>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Maximizing Your Property&apos;s Value</h3>
                    <ul className="list-disc pl-6 space-y-2 text-charcoal/70">
                        <li><strong className="text-charcoal">Highlight Unique Features:</strong> Emphasize what makes your property special</li>
                        <li><strong className="text-charcoal">Show Potential:</strong> Help buyers envision how they could use the space</li>
                        <li><strong className="text-charcoal">Timing:</strong> Consider market conditions - spring and early summer often see more activity</li>
                        <li><strong className="text-charcoal">Professional Presentation:</strong> Quality photos and staging can significantly impact buyer interest</li>
                    </ul>
                </div>
            ),
            toolkit: [
                {
                    id: 'pre-sale-preparation-checklist',
                    title: 'Pre-Sale Preparation Checklist',
                    description: 'Complete checklist for preparing your home before listing',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">6-8 Weeks Before Listing</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Get 2-3 valuations from different agents</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Choose your estate agent</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Start decluttering and organizing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Plan any necessary repairs or improvements</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">2-4 Weeks Before Listing</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Complete all repairs and touch-ups</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Deep clean entire property</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Stage property for photos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Professional photography scheduled</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Listing Day</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Property goes live on portals</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Be ready for immediate viewings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Keep property show-ready at all times</span>
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    id: 'negotiation-tips-checklist',
                    title: 'Negotiation Tips Checklist',
                    description: 'Best practices for negotiating offers',
                    type: 'checklist' as const,
                    content: (
                        <div className="space-y-4">
                            <h4 className="font-bold text-charcoal text-lg mb-4">When Evaluating Offers</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Consider the full package, not just price</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Check buyer's financial position (pre-approved is better)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Evaluate occupancy date (fits your timeline?)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Consider deposit size (larger = more serious buyer)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Review conditions (bond approval, inspections, etc.)</span>
                                </li>
                            </ul>

                            <h4 className="font-bold text-charcoal text-lg mb-4 mt-6">Negotiation Do's</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Be realistic about market conditions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Respond to offers promptly</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Consider counter-offers if close to your price</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                                    <span>Work with your agent on negotiation strategy</span>
                                </li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
    };

    // Ordered list of modules for "Next topic" navigation
    const moduleOrder = [
        'pricing-strategy',
        'agent-selection',
        'marketing',
        'sale-process',
        'costs',
        'tips'
    ] as const;

    const module = modules[slug];
    const currentIndex = moduleOrder.indexOf(slug as (typeof moduleOrder)[number]);
    const nextSlug = currentIndex >= 0 && currentIndex < moduleOrder.length - 1 ? moduleOrder[currentIndex + 1] : null;
    const nextModule = nextSlug ? modules[nextSlug] : null;

    if (!module) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-charcoal mb-4">Module Not Found</h1>
                    <Link href="/sellers" className="text-gold hover:underline">Back to Sellers Hub</Link>
                </div>
            </div>
        );
    }

    const IconComponent = {
        DollarSign,
        Users,
        Target,
        FileText,
        BarChart3,
        CheckCircle,
    }[module.icon] || FileText;

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-charcoal/5">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/sellers" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Sellers Hub</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>
                </nav>
            </header>

            <main className="relative px-4 pt-24 pb-16">
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="rounded-3xl shadow-2xl border border-charcoal/10 bg-white/90 backdrop-blur-xl overflow-hidden">
                        {/* Card header styled like toolkit modal */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-10 py-6 md:py-8 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                        <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                                            {module.title}
                                        </h1>
                                        <p className="text-white/90 text-sm md:text-base max-w-xl">
                                            A focused learning module to guide you step-by-step on your selling journey.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card body */}
                        <div className="px-6 md:px-10 py-8 md:py-10 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="prose max-w-none text-charcoal/90">
                                {module.content}
                            </div>

                            {module.toolkit && (
                                <LearningToolkit items={module.toolkit} />
                            )}

                            {/* Footer actions */}
                            <div className="mt-12 pt-8 border-t border-charcoal/15 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <Link
                                    href="/sellers"
                                    className="text-charcoal/70 hover:text-charcoal transition flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Topics
                                </Link>

                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:items-center md:ml-auto">
                                    {nextModule && (
                                        <Link
                                            href={`/sellers/${nextSlug}`}
                                            className="px-6 py-3 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/10 transition shadow-sm text-center"
                                        >
                                            Next Topic: {nextModule.title}
                                        </Link>
                                    )}

                                    <Link
                                        href="/sellers/property-quiz"
                                        className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition shadow-lg text-center flex items-center justify-center gap-2"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Book a Free Valuation
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

