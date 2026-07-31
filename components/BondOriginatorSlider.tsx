'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Briefcase,
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clipboard,
    ExternalLink,
    Home,
    Phone,
    Star,
    Trophy,
    type LucideIcon,
} from 'lucide-react';
import { BOND_ORIGINATORS, type BondOriginator } from '@/lib/bond-originators';

const ORIGINATOR_ICONS: Record<BondOriginator['id'], LucideIcon> = {
    'sa-home-loans': Building2,
    betterbond: Trophy,
    ooba: Home,
    multinet: Briefcase,
    mortgageplus: Clipboard,
};

type BondOriginatorSliderMode = 'browse' | 'select';

interface BondOriginatorSliderProps {
    mode?: BondOriginatorSliderMode;
    selectedId?: string;
    onSelect?: (originator: BondOriginator) => void;
    onContact?: (originator: BondOriginator) => void;
    className?: string;
}

export default function BondOriginatorSlider({
    mode = 'browse',
    selectedId,
    onSelect,
    onContact,
    className = '',
}: BondOriginatorSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;

        const { scrollLeft, scrollWidth, clientWidth } = track;
        setCanScrollLeft(scrollLeft > 8);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);

        const cardWidth = track.firstElementChild?.clientWidth ?? 1;
        const gap = 16;
        const index = Math.round(scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.min(Math.max(index, 0), BOND_ORIGINATORS.length - 1));
    }, []);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        updateScrollState();
        track.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
            track.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [updateScrollState]);

    const scrollByPage = (direction: -1 | 1) => {
        const track = trackRef.current;
        if (!track) return;
        const amount = Math.max(track.clientWidth * 0.85, 280);
        track.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    const scrollToIndex = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        const card = track.children[index] as HTMLElement | undefined;
        card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };

    return (
        <div className={`relative ${className}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-charcoal/55">
                    Swipe or use arrows to compare all {BOND_ORIGINATORS.length} originators
                </p>
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => scrollByPage(-1)}
                        disabled={!canScrollLeft}
                        aria-label="Previous originators"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 bg-white text-charcoal transition hover:border-gold/30 hover:bg-gold/5 disabled:pointer-events-none disabled:opacity-35"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollByPage(1)}
                        disabled={!canScrollRight}
                        aria-label="Next originators"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 bg-white text-charcoal transition hover:border-gold/30 hover:bg-gold/5 disabled:pointer-events-none disabled:opacity-35"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                ref={trackRef}
                className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="list"
                aria-label="Bond originators"
            >
                {BOND_ORIGINATORS.map((originator) => {
                    const Icon = ORIGINATOR_ICONS[originator.id];
                    const isSelected = mode === 'select' && selectedId === originator.id;

                    if (mode === 'select') {
                        return (
                            <button
                                key={originator.id}
                                type="button"
                                role="listitem"
                                onClick={() => onSelect?.(originator)}
                                className={`relative min-w-[min(100%,320px)] max-w-[320px] shrink-0 snap-start rounded-2xl border p-5 text-left transition-all sm:min-w-[300px] ${
                                    isSelected
                                        ? 'border-gold bg-gold/10 shadow-lg'
                                        : 'border-charcoal/10 bg-white hover:border-gold/40 hover:bg-gold/5'
                                }`}
                            >
                                {isSelected && (
                                    <CheckCircle
                                        className="absolute right-3 top-3 h-6 w-6 text-gold"
                                        aria-hidden
                                    />
                                )}
                                <OriginatorCardBody originator={originator} Icon={Icon} compact />
                            </button>
                        );
                    }

                    return (
                        <article
                            key={originator.id}
                            role="listitem"
                            className="premium-card min-w-[min(100%,320px)] max-w-[320px] shrink-0 snap-start rounded-xl p-6 sm:min-w-[300px]"
                        >
                            <OriginatorCardBody originator={originator} Icon={Icon} />
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onContact?.(originator)}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white transition hover:bg-gold-600"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    Contact
                                </button>
                                <a
                                    href={originator.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg border border-charcoal/20 px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-gold hover:bg-charcoal/5"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Visit
                                </a>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
                {BOND_ORIGINATORS.map((originator, index) => (
                    <button
                        key={originator.id}
                        type="button"
                        aria-label={`Go to ${originator.name}`}
                        onClick={() => scrollToIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                            index === activeIndex
                                ? 'w-6 bg-gold'
                                : 'w-2 bg-charcoal/20 hover:bg-charcoal/35'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function OriginatorCardBody({
    originator,
    Icon,
    compact = false,
}: {
    originator: BondOriginator;
    Icon: LucideIcon;
    compact?: boolean;
}) {
    return (
        <>
            <div className={`flex items-start gap-3 ${compact ? 'pr-8' : ''}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                    <Icon className="h-6 w-6 text-gold" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-charcoal">{originator.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-charcoal">
                            <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
                            {originator.badge}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-charcoal/55">{originator.description}</p>
                </div>
            </div>
            <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-3' : 'mt-4 mb-1'}`}>
                {originator.features.map((feature) => (
                    <span
                        key={feature}
                        className="rounded-full border border-gold/15 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold"
                    >
                        {feature}
                    </span>
                ))}
            </div>
            {compact && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal/60">
                    <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        {originator.phone}
                    </span>
                    <a
                        href={originator.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 hover:text-gold"
                    >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Website
                    </a>
                </div>
            )}
        </>
    );
}
