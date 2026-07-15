import Link from 'next/link';
import { ArrowUpRight, Clock, type LucideIcon } from 'lucide-react';
import { getLearnCategoryBadge } from '@/lib/agent-learn-meta';
import {
    AGENT_MODULE_CARD,
    AGENT_MODULE_CARD_ICON,
    AGENT_BADGE,
} from '@/lib/agent-portal-ui';

type HighlightTone = 'gold' | 'blue' | 'emerald' | 'amber' | 'sky' | 'violet';

const HIGHLIGHT_DOT: Record<HighlightTone, string> = {
    gold: 'bg-gold',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
};

const CATEGORY_TONE: Record<string, HighlightTone> = {
    Sales: 'gold',
    Finance: 'blue',
    Compliance: 'sky',
    Marketing: 'violet',
    Listings: 'emerald',
    Productivity: 'amber',
};

interface AgentLearnModuleCardProps {
    slug: string;
    icon: LucideIcon;
    title: string;
    description: string;
    category?: string;
    readMinutes?: number;
    index?: number;
    highlights?: string[];
}

export default function AgentLearnModuleCard({
    slug,
    icon: Icon,
    title,
    description,
    category = 'Guide',
    readMinutes = 5,
    index = 0,
    highlights = [],
}: AgentLearnModuleCardProps) {
    const displayIndex = String(index + 1).padStart(2, '0');
    const tone = CATEGORY_TONE[category] ?? 'gold';

    return (
        <Link
            href={`/agents/learn/${slug}`}
            className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:ring-offset-2 rounded-3xl"
        >
            <article className={AGENT_MODULE_CARD}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span
                    className="absolute top-4 right-5 text-[3.5rem] font-bold leading-none text-charcoal/[0.04] group-hover:text-gold/[0.08] transition-colors duration-300 select-none tabular-nums"
                    aria-hidden
                >
                    {displayIndex}
                </span>

                <div className="relative flex flex-col h-full min-h-[260px]">
                    <div className="flex items-start gap-4 mb-5">
                        <div className={AGENT_MODULE_CARD_ICON}>
                            <Icon className="w-5 h-5 text-gold" strokeWidth={2} />
                        </div>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                            <span className={`${AGENT_BADGE} ${getLearnCategoryBadge(category)}`}>
                                {category}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-charcoal mb-2 pr-12 group-hover:text-gold transition-colors duration-200 leading-snug tracking-tight">
                        {title}
                    </h3>

                    <div className="flex-1 space-y-3">
                        <p className="text-charcoal/45 text-sm leading-[1.65] line-clamp-2">
                            {description}
                        </p>

                        {highlights.length > 0 && (
                            <div className="rounded-xl border border-charcoal/[0.06] bg-charcoal/[0.02] px-3.5 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-charcoal/40 mb-2.5">
                                    Key topics
                                </p>
                                <ul className="space-y-2">
                                    {highlights.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-2.5 text-xs text-charcoal/55 leading-relaxed"
                                        >
                                            <span
                                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${HIGHLIGHT_DOT[tone]}`}
                                                aria-hidden
                                            />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 pt-5 border-t border-charcoal/[0.06] flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-charcoal/40 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {readMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal/50 group-hover:text-gold transition-colors">
                            Read
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
