import type { LucideIcon } from 'lucide-react';
import {
    BookOpen,
    Building2,
    Calculator,
    Calendar,
    ClipboardCheck,
    DollarSign,
    FileText,
    Gauge,
    Home,
    LayoutDashboard,
    MessageSquare,
    Scale,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';

export type UserPortalKind = 'buyer' | 'seller';

export type BuyerPortalPage =
    | 'dashboard'
    | 'messages'
    | 'properties' // public /search — gated off until agent listings go live
    | 'viewings'
    | 'documents'
    | 'prequal'
    | 'agent'
    | 'property-optimizer'
    | 'property-iq'
    | 'smart-bond'
    | 'conveyancer-connect'
    | 'calculator'
    | 'learn'
    | 'quiz';

export type SellerPortalPage =
    | 'dashboard'
    | 'messages'
    | 'valuation'
    | 'property-quiz'
    | 'property-optimizer'
    | 'property-iq'
    | 'smart-bond'
    | 'conveyancer-connect'
    | 'learn'
    | 'agent'
    | 'buyer-dashboard';

export type UserPortalPage = BuyerPortalPage | SellerPortalPage;

export interface UserPortalNavLink {
    page: UserPortalPage;
    href: string;
    label: string;
    icon: LucideIcon;
    /** Visual emphasis for logged-in CTAs (e.g. bond originator prequal) */
    emphasize?: 'alert';
}

export const BUYER_PORTAL_LINKS: UserPortalNavLink[] = [
    { page: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'messages', href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { page: 'viewings', href: '/dashboard/viewings', label: 'Viewings', icon: Calendar },
    {
        page: 'documents',
        href: '/dashboard/documents',
        label: 'Bond Originators',
        icon: FileText,
        emphasize: 'alert',
    },
    { page: 'prequal', href: '/dashboard/prequal', label: 'My Prequal', icon: ClipboardCheck },
    { page: 'agent', href: '/dashboard/agent', label: 'My Agent', icon: Users },
    { page: 'property-optimizer', href: '/dashboard/property-optimizer', label: 'Value Optimizer', icon: Sparkles },
    { page: 'property-iq', href: '/property-iq', label: 'Property IQ™', icon: TrendingUp },
    { page: 'smart-bond', href: '/calculator/smart-bond', label: 'Smart Bond Optimizer', icon: Gauge },
    { page: 'conveyancer-connect', href: '/conveyancers', label: 'Conveyancer Connect', icon: Scale },
    { page: 'calculator', href: '/calculator', label: 'Bond Calculator', icon: Calculator },
    { page: 'learn', href: '/learn', label: 'Learning Center', icon: BookOpen },
    { page: 'quiz', href: '/quiz', label: 'Pre-Qualification Quiz', icon: ClipboardCheck },
];

export const SELLER_PORTAL_LINKS: UserPortalNavLink[] = [
    { page: 'dashboard', href: '/sellers/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'messages', href: '/sellers/messages', label: 'Messages', icon: MessageSquare },
    { page: 'valuation', href: '/sellers/valuation', label: 'Property Valuation', icon: DollarSign },
    { page: 'property-quiz', href: '/sellers/property-quiz', label: 'List Property', icon: Building2 },
    { page: 'agent', href: '/dashboard/agent', label: 'My Agent', icon: Users },
    { page: 'property-optimizer', href: '/dashboard/property-optimizer', label: 'Value Optimizer', icon: Sparkles },
    { page: 'property-iq', href: '/property-iq', label: 'Property IQ™', icon: TrendingUp },
    { page: 'smart-bond', href: '/calculator/smart-bond', label: 'Smart Bond Optimizer', icon: Gauge },
    { page: 'conveyancer-connect', href: '/conveyancers', label: 'Conveyancer Connect', icon: Scale },
    { page: 'learn', href: '/sellers', label: 'Learning Center', icon: BookOpen },
    { page: 'buyer-dashboard', href: '/dashboard', label: 'Buyer Dashboard', icon: Home },
];

export function getUserPortalLinks(portal: UserPortalKind): UserPortalNavLink[] {
    return portal === 'buyer' ? BUYER_PORTAL_LINKS : SELLER_PORTAL_LINKS;
}

export function getUserPortalLabel(portal: UserPortalKind): string {
    return portal === 'buyer' ? 'Buyer portal' : 'Seller portal';
}
