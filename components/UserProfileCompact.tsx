'use client';

import type { UserPortalUser } from '@/components/UserPortalLayout';
import { getUserPortalLabel, type UserPortalKind } from '@/lib/user-portal-nav';

function getUserInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface UserProfileCompactProps {
    user: UserPortalUser;
    portal: UserPortalKind;
}

export default function UserProfileCompact({ user, portal }: UserProfileCompactProps) {
    const portalLabel = getUserPortalLabel(portal);

    return (
        <div className="hidden sm:flex items-center gap-3 pl-3 pr-1 py-1.5 rounded-2xl border border-charcoal/[0.08] bg-white hover:border-charcoal/[0.12] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200">
            <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white shrink-0"
                aria-hidden
            >
                {getUserInitials(user.fullName)}
            </div>
            <div className="text-left min-w-0 max-w-[160px] lg:max-w-[200px]">
                <p className="text-charcoal font-semibold text-sm truncate leading-tight">
                    {user.fullName}
                </p>
                <p className="text-charcoal/50 text-[11px] truncate leading-tight">{portalLabel}</p>
            </div>
        </div>
    );
}
