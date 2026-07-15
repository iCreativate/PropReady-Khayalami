import {
    BadgeDollarSign,
    BookOpen,
    Brain,
    Clock3,
    DoorOpen,
    Handshake,
    Home,
    Lightbulb,
    MapPinned,
    Megaphone,
    PhoneCall,
    Target,
    Trophy,
    Users,
    type LucideIcon,
} from 'lucide-react';

export interface LearnSectionIconRule {
    keywords: string[];
    icon: LucideIcon;
}

/** First matching rule wins. Keywords are matched against a normalised title string. */
export const LEARN_SECTION_ICON_RULES: LearnSectionIconRule[] = [
    { keywords: ['lead generation', 'get leads', 'get more quality leads', 'lead engine', 'top of the funnel'], icon: Target },
    { keywords: ['lead', 'funnel', 'pipeline', 'enquir', 'prospect', 'conversion'], icon: Target },
    { keywords: ['buyer psychology', 'psychology', 'emotion', 'buyer'], icon: Brain },
    { keywords: ['farm area', 'own your area', 'area knowledge', 'suburb', 'local market', 'corridor'], icon: MapPinned },
    { keywords: ['listing', 'mandate', 'cma', 'listing presentation', 'inventory'], icon: Home },
    { keywords: ['viewing', 'appointment', 'show property', 'book viewings'], icon: DoorOpen },
    { keywords: ['negotiat', 'offer', 'counter-offer', 'counter offer'], icon: Handshake },
    { keywords: ['follow-up', 'follow up', 'touch', '7-touch', 'sequence'], icon: PhoneCall },
    { keywords: ['referral', 'sphere', 'repeat business', 'past client'], icon: Users },
    { keywords: ['marketing', 'digital', 'social', 'portal', 'photograph', 'description'], icon: Megaphone },
    { keywords: ['pric', 'commission', 'valuation', 'affordability', 'transfer duty', 'cost'], icon: BadgeDollarSign },
    { keywords: ['winning', 'formula', 'habit', 'scorecard', '90-day'], icon: Trophy },
    { keywords: ['speed', 'response', 'contact within', 'reply within'], icon: Clock3 },
    { keywords: ['time', 'schedule', 'batch', 'admin', 'prioritise', 'protect your off'], icon: Clock3 },
    { keywords: ['compliance', 'eaab', 'legal', 'fica', 'popia', 'trust money', 'ffc'], icon: BookOpen },
    { keywords: ['bond', 'homeloan', 'home loan', 'finance', 'originator', 'transfer', 'registration'], icon: BadgeDollarSign },
    { keywords: ['seller', 'pricing conversation'], icon: Handshake },
];

function normaliseForMatch(text: string): string {
    return text
        .toLowerCase()
        .replace(/['']/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export function resolveLearnSectionIcon(title: string, explicit?: LucideIcon): LucideIcon {
    if (explicit) return explicit;
    const haystack = normaliseForMatch(title);
    for (const rule of LEARN_SECTION_ICON_RULES) {
        if (rule.keywords.some((kw) => haystack.includes(kw))) {
            return rule.icon;
        }
    }
    return BookOpen;
}
