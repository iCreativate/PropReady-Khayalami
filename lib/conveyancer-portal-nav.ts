import type { LucideIcon } from 'lucide-react';
import {
    Calendar,
    FileText,
    LayoutDashboard,
    Landmark,
    MessageSquare,
    Scale,
    Settings,
} from 'lucide-react';

export type ConveyancerPortalPage =
    | 'dashboard'
    | 'messages'
    | 'matters'
    | 'quotes'
    | 'deeds'
    | 'settings';

export const CONVEYANCER_PORTAL_LINKS: Array<{
    page: ConveyancerPortalPage;
    href: string;
    label: string;
    icon: LucideIcon;
}> = [
    { page: 'dashboard', href: '/conveyancers/portal', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'messages', href: '/conveyancers/portal/messages', label: 'Messages', icon: MessageSquare },
    { page: 'matters', href: '/conveyancers/portal/matters', label: 'Matters', icon: FileText },
    { page: 'quotes', href: '/conveyancers/portal/quotes', label: 'Quotes', icon: Calendar },
    { page: 'deeds', href: '/conveyancers/portal/deeds', label: 'Deeds Office', icon: Landmark },
    { page: 'settings', href: '/conveyancers/portal/settings', label: 'Profile', icon: Settings },
];

export const CONVEYANCER_PORTAL_BRAND = {
    label: 'Conveyancer portal',
    icon: Scale,
};
