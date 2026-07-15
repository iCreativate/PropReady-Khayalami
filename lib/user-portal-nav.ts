import type { LucideIcon } from 'lucide-react';
import {
    BookOpen,
    Building2,
    Calculator,
    Calendar,
    ClipboardCheck,
    DollarSign,
    FileText,
    Home,
    LayoutDashboard,
    Search,
    Sparkles,
} from 'lucide-react';

export type UserPortalKind = 'buyer' | 'seller';

export type BuyerPortalPage =
    | 'dashboard'
    | 'properties'
    | 'viewings'
    | 'documents'
    | 'property-optimizer'
    | 'calculator'
    | 'learn'
    | 'quiz';

export type SellerPortalPage =
    | 'dashboard'
    | 'valuation'
    | 'property-quiz'
    | 'property-optimizer'
    | 'learn'
    | 'buyer-dashboard';

export type UserPortalPage = BuyerPortalPage | SellerPortalPage;

export interface UserPortalNavLink {
    page: UserPortalPage;
    href: string;
    label: string;
    icon: LucideIcon;
}

export const BUYER_PORTAL_LINKS: UserPortalNavLink[] = [
    { page: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'properties', href: '/search', label: 'Properties', icon: Search },
    { page: 'viewings', href: '/dashboard/viewings', label: 'Viewings', icon: Calendar },
    { page: 'documents', href: '/dashboard/documents', label: 'Documents', icon: FileText },
    { page: 'property-optimizer', href: '/dashboard/property-optimizer', label: 'Value Optimizer', icon: Sparkles },
    { page: 'calculator', href: '/calculator', label: 'Bond Calculator', icon: Calculator },
    { page: 'learn', href: '/learn', label: 'Learning Center', icon: BookOpen },
    { page: 'quiz', href: '/quiz', label: 'Pre-Qualification', icon: ClipboardCheck },
];

export const SELLER_PORTAL_LINKS: UserPortalNavLink[] = [
    { page: 'dashboard', href: '/sellers/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'valuation', href: '/sellers/valuation', label: 'Property Valuation', icon: DollarSign },
    { page: 'property-quiz', href: '/sellers/property-quiz', label: 'List Property', icon: Building2 },
    { page: 'property-optimizer', href: '/dashboard/property-optimizer', label: 'Value Optimizer', icon: Sparkles },
    { page: 'learn', href: '/sellers', label: 'Learning Center', icon: BookOpen },
    { page: 'buyer-dashboard', href: '/dashboard', label: 'Buyer Dashboard', icon: Home },
];

export function getUserPortalLinks(portal: UserPortalKind): UserPortalNavLink[] {
    return portal === 'buyer' ? BUYER_PORTAL_LINKS : SELLER_PORTAL_LINKS;
}

export function getUserPortalLabel(portal: UserPortalKind): string {
    return portal === 'buyer' ? 'Buyer portal' : 'Seller portal';
}
