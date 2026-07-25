import type { LucideIcon } from 'lucide-react';
import { Briefcase, LayoutDashboard, Settings } from 'lucide-react';

export type OriginatorPortalPage = 'dashboard' | 'cases' | 'settings';

export interface OriginatorPortalNavLink {
    page: OriginatorPortalPage;
    href: string;
    label: string;
    icon: LucideIcon;
}

export const ORIGINATOR_PORTAL_LINKS: OriginatorPortalNavLink[] = [
    { page: 'dashboard', href: '/originators/dashboard', label: 'Inbox', icon: LayoutDashboard },
    { page: 'settings', href: '/originators/settings', label: 'Settings', icon: Settings },
];

export const ORIGINATOR_CASE_ICON = Briefcase;
