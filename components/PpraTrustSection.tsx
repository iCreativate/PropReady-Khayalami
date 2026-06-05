'use client';

import { Shield, FileCheck, Hash } from 'lucide-react';
import PpraVerificationBadge from '@/components/PpraVerificationBadge';
import {
    getPublicPpraNumber,
    hasFfcDocumentUploaded,
    type AgentPpraFields,
} from '@/lib/ppra';

interface PpraTrustSectionProps {
    agent: AgentPpraFields & { fullName?: string; company?: string };
}

export default function PpraTrustSection({ agent }: PpraTrustSectionProps) {
    const ppra = getPublicPpraNumber(agent);
    const docUploaded = hasFfcDocumentUploaded(agent);

    return (
        <div className="rounded-xl border border-charcoal/10 bg-gradient-to-br from-white to-charcoal/5 p-5">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-gold" />
                <h4 className="font-bold text-charcoal">Practitioner trust & compliance</h4>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-charcoal/70">PPRA verification</span>
                    <PpraVerificationBadge agent={agent} size="sm" />
                </div>
                {ppra && (
                    <div className="flex items-center gap-2 text-charcoal/80">
                        <Hash className="w-4 h-4 text-gold" />
                        <span>
                            PPRA Practitioner No.{' '}
                            <span className="font-mono font-semibold text-charcoal">{ppra}</span>
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-charcoal/80">
                    <FileCheck className="w-4 h-4 text-gold" />
                    <span>
                        FFC document on file:{' '}
                        <strong>{docUploaded ? 'Yes (private)' : 'Not yet uploaded'}</strong>
                    </span>
                </div>
                <p className="text-charcoal/50 text-xs pt-1">
                    Verification documents are never shown publicly. Only status and practitioner number are
                    displayed.
                </p>
            </div>
        </div>
    );
}
