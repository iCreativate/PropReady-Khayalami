'use client';

import { Loader2 } from 'lucide-react';
import { PORTAL_TEXT_SECONDARY } from '@/lib/portal-ui';

type PortalLoadingVariant = 'page' | 'inline' | 'overlay';

interface PortalLoadingProps {
    message?: string;
    /** page = full viewport; inline = content area; overlay = absolute fill */
    variant?: PortalLoadingVariant;
    className?: string;
}

export default function PortalLoading({
    message = 'Loading…',
    variant = 'page',
    className = '',
}: PortalLoadingProps) {
    const shell =
        variant === 'page'
            ? 'min-h-screen bg-[#fafafa] flex items-center justify-center px-4'
            : variant === 'overlay'
              ? 'absolute inset-0 z-10 flex items-center justify-center bg-[#fafafa]/90 backdrop-blur-[1px]'
              : 'flex items-center justify-center py-16 px-4';

    return (
        <div className={`${shell} ${className}`} role="status" aria-live="polite">
            <div className="text-center">
                <Loader2
                    className="w-8 h-8 text-gold animate-spin mx-auto mb-3"
                    aria-hidden
                />
                <p className={`text-sm font-medium ${PORTAL_TEXT_SECONDARY}`}>{message}</p>
            </div>
        </div>
    );
}
