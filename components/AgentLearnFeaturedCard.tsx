import Link from 'next/link';
import { ArrowRight, Clock, Star, type LucideIcon } from 'lucide-react';
import { getLearnCategoryBadge } from '@/lib/agent-learn-meta';
import { LEARN_MODULE_HIGHLIGHTS } from '@/lib/agent-learn-highlights';
import { AGENT_BADGE, AGENT_PRIMARY_BTN } from '@/lib/agent-portal-ui';

interface AgentLearnFeaturedCardProps {
    slug: string;
    icon: LucideIcon;
    title: string;
    description: string;
    category: string;
    readMinutes: number;
    highlights?: string[];
}

export default function AgentLearnFeaturedCard({
    slug,
    icon: Icon,
    title,
    description,
    category,
    readMinutes,
    highlights = [],
}: AgentLearnFeaturedCardProps) {
    return (
        <Link
            href={`/agents/learn/${slug}`}
            className="group block mb-8 sm:mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 rounded-3xl"
        >
            <article className="relative overflow-hidden rounded-3xl border border-charcoal/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.07] via-white to-charcoal/[0.02] opacity-100" />
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-gold/[0.08] rounded-full blur-3xl group-hover:bg-gold/[0.12] transition-colors duration-500" />

                <div className="relative grid lg:grid-cols-[1fr_280px] gap-8 p-7 sm:p-9 lg:p-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            <span className={`${AGENT_BADGE} bg-gold text-white border-gold shadow-[0_2px_8px_rgba(220,38,38,0.25)]`}>
                                <Star className="w-3.5 h-3.5 fill-current" />
                                Featured guide
                            </span>
                            <span className={`${AGENT_BADGE} ${getLearnCategoryBadge(category)}`}>
                                {category}
                            </span>
                            <span className="text-xs text-charcoal/40 font-medium inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {readMinutes} min read
                            </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-charcoal tracking-tight leading-[1.2] mb-4 group-hover:text-gold transition-colors duration-300">
                            {title}
                        </h3>
                        <p className="text-base sm:text-lg text-charcoal/50 leading-relaxed max-w-2xl mb-5">
                            {description}
                        </p>

                        {highlights.length > 0 && (
                            <ul className="grid sm:grid-cols-2 gap-2.5 mb-6 max-w-2xl">
                                {highlights.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-2.5 rounded-xl border border-gold/15 bg-gold/[0.04] px-3.5 py-2.5 text-sm text-charcoal/60"
                                    >
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <span className={`${AGENT_PRIMARY_BTN} pointer-events-none`}>
                            Start reading
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                        <div className="relative w-full aspect-square max-w-[220px]">
                            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 rotate-6 group-hover:rotate-3 transition-transform duration-500" />
                            <div className="absolute inset-0 rounded-[2rem] bg-white border border-charcoal/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-[0_8px_24px_rgba(220,38,38,0.35)]">
                                    <Icon className="w-11 h-11 text-white" strokeWidth={1.75} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
