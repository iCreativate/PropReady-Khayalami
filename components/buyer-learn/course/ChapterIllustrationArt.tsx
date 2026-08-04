'use client';

import type { ChapterIllustration } from '@/lib/buyer-learn/types';

const LABELS: Record<ChapterIllustration, string> = {
    bond: 'Bond',
    deposit: 'Deposit',
    rates: 'Rates',
    originator: 'Originator',
    fica: 'FICA',
    costs: 'Costs',
    strategy: 'Strategy',
    default: 'Learn',
};

export default function ChapterIllustrationArt({
    kind,
    dark = false,
}: {
    kind: ChapterIllustration;
    dark?: boolean;
}) {
    const stroke = dark ? '#FECACA' : '#DC2626';
    const fill = dark ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.08)';
    const muted = dark ? 'rgba(255,255,255,0.35)' : 'rgba(44,44,44,0.35)';

    return (
        <div
            className={`relative aspect-square w-full max-w-[320px] lg:max-w-[380px] rounded-[2rem] border p-6 ${
                dark
                    ? 'border-white/10 bg-gradient-to-br from-white/10 to-transparent'
                    : 'border-charcoal/10 bg-gradient-to-br from-white to-charcoal/[0.03] shadow-sm'
            }`}
            aria-hidden
        >
            <svg viewBox="0 0 240 240" className="h-full w-full">
                <rect x="36" y="118" width="168" height="86" rx="14" fill={fill} />
                <path
                    d="M48 118 L120 52 L192 118"
                    fill="none"
                    stroke={stroke}
                    strokeWidth="8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <rect x="104" y="148" width="32" height="56" rx="6" fill={stroke} />
                <circle cx="178" cy="72" r="16" fill={stroke} opacity="0.35" />
                {kind === 'deposit' && (
                    <text x="120" y="108" textAnchor="middle" fill={muted} fontSize="13" fontWeight="700">
                        10–20%
                    </text>
                )}
                {kind === 'rates' && (
                    <path
                        d="M60 190 L100 170 L140 178 L180 150"
                        fill="none"
                        stroke={stroke}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                )}
                <text
                    x="120"
                    y="44"
                    textAnchor="middle"
                    fill={dark ? 'white' : '#2C2C2C'}
                    fontSize="13"
                    fontWeight="700"
                    opacity="0.85"
                >
                    {LABELS[kind]}
                </text>
            </svg>
        </div>
    );
}
