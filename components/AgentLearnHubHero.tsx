import { BookOpen, Clock, Layers } from 'lucide-react';
import { AGENT_BADGE } from '@/lib/agent-portal-ui';
import { BRAND_DARK_GLOW, BRAND_DARK_SURFACE } from '@/lib/brand-surface';

interface AgentLearnHubHeroProps {
    articleCount: number;
    totalMinutes: number;
    topicCount: number;
}

export default function AgentLearnHubHero({
    articleCount,
    totalMinutes,
    topicCount,
}: AgentLearnHubHeroProps) {
    return (
        <div
            className={`${BRAND_DARK_SURFACE} rounded-3xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.2)] mb-8 sm:mb-10`}
        >
            <div className={BRAND_DARK_GLOW} aria-hidden />
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
                aria-hidden
            />

            <div className="relative z-10 px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold mb-3">
                    PropReady Academy
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight max-w-2xl">
                    Master the skills that close more deals
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/55 max-w-xl leading-relaxed">
                    Bite-sized playbooks for lead conversion, compliance, listings, and growth — built
                    for South African estate agents.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[140px]">
                        <span className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gold" />
                        </span>
                        <div>
                            <p className="text-xl font-semibold tabular-nums leading-none">{articleCount}</p>
                            <p className="text-[11px] text-white/45 mt-1 uppercase tracking-wider">Articles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[140px]">
                        <span className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-gold" />
                        </span>
                        <div>
                            <p className="text-xl font-semibold tabular-nums leading-none">~{totalMinutes}</p>
                            <p className="text-[11px] text-white/45 mt-1 uppercase tracking-wider">Minutes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[140px]">
                        <span className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-gold" />
                        </span>
                        <div>
                            <p className="text-xl font-semibold tabular-nums leading-none">{topicCount}</p>
                            <p className="text-[11px] text-white/45 mt-1 uppercase tracking-wider">Topics</p>
                        </div>
                    </div>
                    <span className={`${AGENT_BADGE} self-center bg-gold/15 text-gold border-gold/25`}>
                        Updated for 2026
                    </span>
                </div>
            </div>
        </div>
    );
}
