'use client';

import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
    type PpraVerificationStatus,
    verificationStatusLabel,
    isAgentPpraVerified,
    type AgentPpraFields,
} from '@/lib/ppra';

interface PpraVerificationBadgeProps {
    agent: AgentPpraFields;
    size?: 'sm' | 'md';
}

export default function PpraVerificationBadge({ agent, size = 'md' }: PpraVerificationBadgeProps) {
    let status: PpraVerificationStatus = 'pending';
    if (isAgentPpraVerified(agent)) status = 'verified';
    else if ((agent.verificationStatus || '').toLowerCase() === 'rejected') status = 'rejected';

    const styles = {
        pending: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        verified: 'bg-green-500/15 text-green-800 border-green-500/30',
        rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
    };

    const Icon = status === 'verified' ? CheckCircle : status === 'rejected' ? AlertCircle : Clock;
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${textSize} ${styles[status]}`}
        >
            <Icon className={iconSize} />
            {verificationStatusLabel(status)}
        </span>
    );
}
