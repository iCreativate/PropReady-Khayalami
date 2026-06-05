'use client';

import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';
import { isAgentPpraVerified, PPRA_ACCESS_MESSAGE, type AgentPpraFields } from '@/lib/ppra';
import PpraVerificationBadge from '@/components/PpraVerificationBadge';

interface PpraVerificationGateProps {
    agent: AgentPpraFields | null | undefined;
    children?: React.ReactNode;
    /** When true, blocks children entirely and shows CTA */
    block?: boolean;
}

export default function PpraVerificationGate({ agent, children, block = false }: PpraVerificationGateProps) {
    if (isAgentPpraVerified(agent)) {
        return children ? <>{children}</> : null;
    }

    const banner = (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-50 to-gold/10 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-charcoal">PPRA verification required</h3>
                        {agent && <PpraVerificationBadge agent={agent} size="sm" />}
                    </div>
                    <p className="text-charcoal/80 text-sm mb-3">{PPRA_ACCESS_MESSAGE}</p>
                    <Link
                        href="/agents/verification"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition text-sm"
                    >
                        Complete verification
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );

    if (block || !children) {
        return banner;
    }

    return (
        <>
            {banner}
            <div className="opacity-50 pointer-events-none select-none" aria-hidden>
                {children}
            </div>
        </>
    );
}
