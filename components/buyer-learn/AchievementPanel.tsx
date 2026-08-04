'use client';

import { Award, Flame, Stars } from 'lucide-react';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

export default function AchievementPanel({
    title,
    body,
    badgeLabel,
    xp,
    streakDays,
    totalXp,
    onContinue,
}: {
    title: string;
    body: string;
    badgeLabel: string;
    xp: number;
    streakDays: number;
    totalXp: number;
    onContinue: () => void;
}) {
    return (
        <div className="rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] via-white to-white p-6 sm:p-8 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-white shadow-md">
                <Award className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">
                {title}
            </h2>
            <p className="mt-2 text-charcoal/60 max-w-lg mx-auto leading-relaxed">{body}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <div className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                        Badge
                    </p>
                    <p className="mt-1 font-semibold text-charcoal">{badgeLabel}</p>
                </div>
                <div className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                        XP earned
                    </p>
                    <p className="mt-1 font-semibold text-gold inline-flex items-center gap-1">
                        <Stars className="h-4 w-4" />+{xp}
                    </p>
                </div>
                <div className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                        Streak
                    </p>
                    <p className="mt-1 font-semibold text-charcoal inline-flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {streakDays} day{streakDays === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                        Total XP
                    </p>
                    <p className="mt-1 font-semibold tabular-nums text-charcoal">{totalXp}</p>
                </div>
            </div>

            <button type="button" className={`${PORTAL_PRIMARY_BTN} mt-8`} onClick={onContinue}>
                Continue to next lesson
            </button>
        </div>
    );
}
