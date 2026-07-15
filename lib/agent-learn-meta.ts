export const LEARN_MODULE_META: Record<
    string,
    { category: string; readMinutes: number }
> = {
    'understanding-homeloans': { category: 'Finance', readMinutes: 9 },
    'bond-origination': { category: 'Finance', readMinutes: 8 },
    'transfer-and-registration': { category: 'Finance', readMinutes: 7 },
    'eaab-mandates-and-commission': { category: 'Compliance', readMinutes: 8 },
    'eaab-fidelity-fund-cpd': { category: 'Compliance', readMinutes: 7 },
    'eaab-trust-money': { category: 'Compliance', readMinutes: 7 },
    'eaab-code-of-conduct': { category: 'Compliance', readMinutes: 9 },
    'winning-formula': { category: 'Sales', readMinutes: 10 },
    'how-to-get-leads': { category: 'Sales', readMinutes: 8 },
    'leads-to-clients': { category: 'Sales', readMinutes: 9 },
    'follow-up-system': { category: 'Sales', readMinutes: 7 },
    'lead-conversion': { category: 'Sales', readMinutes: 6 },
    'buyer-psychology': { category: 'Sales', readMinutes: 6 },
    'negotiation-skills': { category: 'Sales', readMinutes: 6 },
    'winning-pitch': { category: 'Sales', readMinutes: 8 },
    'listing-presentations': { category: 'Listings', readMinutes: 7 },
    'eaab-compliance': { category: 'Compliance', readMinutes: 7 },
    'listing-tips': { category: 'Marketing', readMinutes: 5 },
    'digital-marketing': { category: 'Marketing', readMinutes: 5 },
    'social-media-for-agents': { category: 'Marketing', readMinutes: 6 },
    'email-and-nurture': { category: 'Marketing', readMinutes: 6 },
    'legal-basics': { category: 'Compliance', readMinutes: 8 },
    'working-with-sellers': { category: 'Listings', readMinutes: 5 },
    'pricing-to-sell': { category: 'Listings', readMinutes: 7 },
    'show-day-playbook': { category: 'Listings', readMinutes: 6 },
    'time-management': { category: 'Productivity', readMinutes: 5 },
    'agent-mistakes': { category: 'Productivity', readMinutes: 8 },
    'crm-and-systems': { category: 'Productivity', readMinutes: 6 },
    'daily-routine-top-producers': { category: 'Productivity', readMinutes: 6 },
};

export const LEARN_CATEGORY_BADGE: Record<string, string> = {
    Sales: 'bg-gold/[0.08] text-gold border-gold/15',
    Finance: 'bg-blue-500/[0.08] text-blue-700 border-blue-500/15',
    Compliance: 'bg-sky-500/[0.08] text-sky-700 border-sky-500/15',
    Marketing: 'bg-violet-500/[0.08] text-violet-700 border-violet-500/15',
    Listings: 'bg-emerald-500/[0.08] text-emerald-700 border-emerald-500/15',
    Productivity: 'bg-amber-500/[0.08] text-amber-800 border-amber-500/15',
};

export function getLearnCategoryBadge(category: string): string {
    return LEARN_CATEGORY_BADGE[category] ?? 'bg-charcoal/[0.04] text-charcoal/55 border-charcoal/[0.08]';
}
