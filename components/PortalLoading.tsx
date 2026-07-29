'use client';

import { Loader2 } from 'lucide-react';
import { PORTAL_TEXT_SECONDARY } from '@/lib/portal-ui';

type PortalLoadingVariant = 'page' | 'inline' | 'overlay' | 'dashboard';

interface PortalLoadingProps {
    message?: string;
    /** page = full viewport; inline = content area; overlay = absolute fill; dashboard = skeleton chrome */
    variant?: PortalLoadingVariant;
    className?: string;
}

export default function PortalLoading({
    message = 'Loading…',
    variant = 'page',
    className = '',
}: PortalLoadingProps) {
    if (variant === 'dashboard') {
        return (
            <div
                className={`portal-loading-shell min-h-screen bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 ${className}`}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="max-w-[1400px] mx-auto space-y-8 sm:space-y-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-gold animate-spin shrink-0" aria-hidden />
                        <p className={`text-sm font-medium ${PORTAL_TEXT_SECONDARY}`}>{message}</p>
                    </div>
                    <div className="h-28 rounded-3xl bg-white border border-charcoal/[0.08] shadow-card animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-28 rounded-3xl bg-white border border-charcoal/[0.08] shadow-card animate-pulse"
                                style={{ animationDelay: `${i * 60}ms` }}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="lg:col-span-2 h-64 rounded-3xl bg-white border border-charcoal/[0.08] shadow-card animate-pulse" />
                        <div
                            className="h-64 rounded-3xl bg-white border border-charcoal/[0.08] shadow-card animate-pulse"
                            style={{ animationDelay: '80ms' }}
                        />
                    </div>
                    <span className="sr-only">{message}</span>
                </div>
            </div>
        );
    }

    const shell =
        variant === 'page'
            ? 'min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4'
            : variant === 'overlay'
              ? 'absolute inset-0 z-10 flex items-center justify-center bg-[#F8FAFC]/90 backdrop-blur-[1px]'
              : 'flex items-center justify-center py-16 px-4';

    return (
        <div
            className={`portal-loading-shell ${shell} ${className}`}
            role="status"
            aria-live="polite"
        >
            <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-charcoal/[0.08] shadow-card flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" aria-hidden />
                </div>
                <p className={`text-sm font-medium ${PORTAL_TEXT_SECONDARY}`}>{message}</p>
            </div>
        </div>
    );
}
