'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    LayoutGrid,
    Map as MapIcon,
    Moon,
    Scale,
    Sparkles,
    Sun,
} from 'lucide-react';
import PortalHero, { PORTAL_HERO_SECONDARY_BTN } from '@/components/PortalHero';
import ConveyancerCard from '@/components/conveyancer-connect/ConveyancerCard';
import FilterPanel, { QUICK_SPECIALTIES } from '@/components/conveyancer-connect/FilterPanel';
import MapView from '@/components/conveyancer-connect/MapView';
import StatsStrip from '@/components/conveyancer-connect/StatsStrip';
import {
    BookModal,
    QuoteModal,
} from '@/components/conveyancer-connect/EngagementModals';
import { CC_CHIP, CC_CHIP_ACTIVE, CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import {
    DEFAULT_FILTERS,
    demoCatalogEnabled,
    filterConveyancers,
    fetchDirectoryProfiles,
    haversineKm,
    loadCcState,
    pushRecentSearch,
    setDarkMode,
    toggleCompare,
    toggleSaved,
    type BrowseFilters,
    type ConveyancerProfile,
    type ProvinceSlug,
    type Specialty,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

const DEFAULT_ORIGIN = { lat: -26.2041, lng: 28.0473 };

export default function ConveyancerMarketplaceApp({
    initialProvince = '',
    initialCity = '',
    showHero = true,
}: {
    initialProvince?: ProvinceSlug | '';
    initialCity?: string;
    showHero?: boolean;
}) {
    const [filters, setFilters] = useState<BrowseFilters>({
        ...DEFAULT_FILTERS,
        province: initialProvince,
        city: initialCity,
        verifiedOnly: false,
    });
    const [view, setView] = useState<'list' | 'map'>('list');
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [dark, setDark] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [quoteFirm, setQuoteFirm] = useState<ConveyancerProfile | null>(null);
    const [bookFirm, setBookFirm] = useState<ConveyancerProfile | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [selectedMapId, setSelectedMapId] = useState<string | undefined>();
    const [catalog, setCatalog] = useState<ConveyancerProfile[]>([]);
    const [loadingDirectory, setLoadingDirectory] = useState(true);

    useEffect(() => {
        const s = loadCcState();
        setSavedIds(s.savedIds);
        setCompareIds(s.compareIds);
        setDark(s.darkMode);
    }, []);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            setLoadingDirectory(true);
            try {
                const list = await fetchDirectoryProfiles();
                if (!cancelled) setCatalog(list);
            } catch {
                if (!cancelled) setCatalog([]);
            } finally {
                if (!cancelled) setLoadingDirectory(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setFilters((f) => ({
            ...f,
            province: initialProvince || f.province,
            city: initialCity || f.city,
        }));
    }, [initialProvince, initialCity]);

    const results = useMemo(
        () => filterConveyancers(catalog, filters, DEFAULT_ORIGIN),
        [catalog, filters]
    );
    const featured = useMemo(
        () => catalog.filter((c) => c.featured).slice(0, 4),
        [catalog]
    );

    function notify(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2600);
    }

    function onSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        pushRecentSearch(filters.query);
        document.getElementById('cc-results')?.scrollIntoView({ behavior: 'smooth' });
    }

    function handleSave(id: string) {
        const s = toggleSaved(id);
        setSavedIds(s.savedIds);
    }

    function handleCompare(id: string) {
        const { state, error } = toggleCompare(id);
        setCompareIds(state.compareIds);
        if (error) notify(error);
    }

    function toggleQuick(s: Specialty) {
        setFilters((f) => ({
            ...f,
            specialities: f.specialities.includes(s)
                ? f.specialities.filter((x) => x !== s)
                : [...f.specialities, s],
        }));
    }

    return (
        <div className={dark ? 'cc-dark rounded-[1.5rem] bg-slate-950 p-3 sm:p-4 text-white' : ''}>
            <div className={`space-y-6 ${dark ? '[&_.text-charcoal]:text-white [&_.text-charcoal\\/55]:text-white/60 [&_.text-charcoal\\/50]:text-white/50 [&_.text-charcoal\\/45]:text-white/45 [&_.bg-white]:bg-white/[0.06] [&_.border-charcoal\\/\\[0\\.08\\]]:border-white/10' : ''}`}>
                {showHero ? (
                    <PortalHero
                        eyebrow="Conveyancer Connect · PropReady"
                        eyebrowIcon={<Scale className="h-3.5 w-3.5 text-gold" />}
                        title="Find the right conveyancer for your property transfer."
                        description="Browse PropReady-verified conveyancing firms, request quotes, book consultations, and message attorneys from one place."
                        actions={
                            <>
                                <a href="#cc-results" className={PORTAL_PRIMARY_BTN}>
                                    Find Conveyancers
                                </a>
                                <Link href="/conveyancers/become-verified" className={PORTAL_HERO_SECONDARY_BTN}>
                                    Become a Verified Conveyancer
                                </Link>
                            </>
                        }
                        stats={[
                            { label: 'Directory', value: loadingDirectory ? '…' : `${catalog.length} firms` },
                            { label: 'Coverage', value: 'South Africa' },
                            { label: 'Access', value: 'Quotes · Chat · Track' },
                        ]}
                    />
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Link href="/conveyancers/match" className={`${PORTAL_PRIMARY_BTN} !h-10 !text-sm`}>
                            <Sparkles className="h-4 w-4" />
                            AI Matching
                        </Link>
                        <Link href="/conveyancers/compare" className={PORTAL_HERO_SECONDARY_BTN}>
                            Compare ({compareIds.length}/4)
                        </Link>
                        <Link href="/conveyancers/tracker" className={PORTAL_HERO_SECONDARY_BTN}>
                            Transfer Tracker
                        </Link>
                        <Link href="/conveyancers/learn" className={PORTAL_HERO_SECONDARY_BTN}>
                            Education
                        </Link>
                        <Link href="/conveyancers/dashboard" className={PORTAL_HERO_SECONDARY_BTN}>
                            My dashboard
                        </Link>
                    </div>
                    <button
                        type="button"
                        className={PORTAL_HERO_SECONDARY_BTN}
                        onClick={() => {
                            const next = !dark;
                            setDark(next);
                            setDarkMode(next);
                        }}
                        aria-label="Toggle dark mode"
                    >
                        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {dark ? 'Light' : 'Dark'}
                    </button>
                </div>

                <form
                    onSubmit={onSearchSubmit}
                    className={`${CC_CARD_FLAT} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5`}
                >
                    <input
                        className="min-w-0 flex-1 rounded-xl border border-charcoal/[0.12] bg-white px-4 py-3 text-base text-charcoal outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20"
                        placeholder="Search firm, attorney, province, city, suburb…"
                        value={filters.query}
                        onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                        aria-label="Search conveyancers"
                    />
                    <button type="submit" className={PORTAL_PRIMARY_BTN}>
                        Find Conveyancers
                    </button>
                </form>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {QUICK_SPECIALTIES.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={filters.specialities.includes(s) ? CC_CHIP_ACTIVE : CC_CHIP}
                            onClick={() => toggleQuick(s)}
                        >
                            {s.replace(/-/g, ' ')}
                        </button>
                    ))}
                </div>

                <StatsStrip firmCount={catalog.length} />

                {featured.length > 0 ? (
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-charcoal">Featured conveyancers</h2>
                            <p className="text-sm text-charcoal/50">
                                Verified firms ready to take on new transfer instructions.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {featured.slice(0, 4).map((p) => (
                            <ConveyancerCard
                                key={p.id}
                                profile={p}
                                saved={savedIds.includes(p.id)}
                                compared={compareIds.includes(p.id)}
                                onSave={() => handleSave(p.id)}
                                onCompare={() => handleCompare(p.id)}
                                onQuote={() => setQuoteFirm(p)}
                                onBook={() => setBookFirm(p)}
                                distanceKm={
                                    p.coords.lat || p.coords.lng
                                        ? haversineKm(DEFAULT_ORIGIN, p.coords)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </section>
                ) : null}

                <div id="cc-results" className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="hidden lg:block">
                        <FilterPanel filters={filters} onChange={setFilters} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-charcoal/55">
                                <span className="font-semibold text-charcoal">{results.length}</span> conveyancers
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="lg:hidden rounded-xl border border-charcoal/10 px-3 py-2 text-sm font-semibold"
                                    onClick={() => setFiltersOpen(true)}
                                >
                                    Filters
                                </button>
                                <div className="inline-flex rounded-xl border border-charcoal/10 p-1">
                                    <button
                                        type="button"
                                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                            view === 'list' ? 'bg-charcoal text-white' : 'text-charcoal/60'
                                        }`}
                                        onClick={() => setView('list')}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        List
                                    </button>
                                    <button
                                        type="button"
                                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                            view === 'map' ? 'bg-charcoal text-white' : 'text-charcoal/60'
                                        }`}
                                        onClick={() => setView('map')}
                                    >
                                        <MapIcon className="h-3.5 w-3.5" />
                                        Map
                                    </button>
                                </div>
                            </div>
                        </div>

                        {view === 'map' ? (
                            <MapView
                                profiles={results}
                                origin={DEFAULT_ORIGIN}
                                selectedId={selectedMapId}
                                onSelect={setSelectedMapId}
                            />
                        ) : (
                            <div className="grid gap-4">
                                {results.map((p) => (
                                    <ConveyancerCard
                                        key={p.id}
                                        profile={p}
                                        saved={savedIds.includes(p.id)}
                                        compared={compareIds.includes(p.id)}
                                        onSave={() => handleSave(p.id)}
                                        onCompare={() => handleCompare(p.id)}
                                        onQuote={() => setQuoteFirm(p)}
                                        onBook={() => setBookFirm(p)}
                                        distanceKm={
                                            p.coords.lat || p.coords.lng
                                                ? haversineKm(DEFAULT_ORIGIN, p.coords)
                                                : undefined
                                        }
                                    />
                                ))}
                                {loadingDirectory ? (
                                    <div className={`${CC_CARD_FLAT} p-8 text-center text-sm text-charcoal/55`}>
                                        Loading verified firms…
                                    </div>
                                ) : !results.length ? (
                                    <div className={`${CC_CARD_FLAT} space-y-4 p-8 text-center`}>
                                        <p className="text-sm text-charcoal/55">
                                            {catalog.length === 0
                                                ? demoCatalogEnabled()
                                                    ? 'No conveyancers match these filters.'
                                                    : 'No verified conveyancers are listed yet. Firms appear here after PropReady admin approval.'
                                                : 'No conveyancers match these filters. Try widening your search.'}
                                        </p>
                                        {catalog.length === 0 ? (
                                            <Link
                                                href="/conveyancers/register"
                                                className={`${PORTAL_PRIMARY_BTN} inline-flex`}
                                            >
                                                Register your firm
                                            </Link>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {filtersOpen ? (
                <div className="fixed inset-0 z-[70] lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close filters"
                        onClick={() => setFiltersOpen(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[1.5rem] bg-[#F8FAFC] p-4">
                        <FilterPanel
                            filters={filters}
                            onChange={(f) => {
                                setFilters(f);
                            }}
                            compact
                        />
                        <button
                            type="button"
                            className={`${PORTAL_PRIMARY_BTN} mt-4 w-full`}
                            onClick={() => setFiltersOpen(false)}
                        >
                            Show {results.length} results
                        </button>
                    </div>
                </div>
            ) : null}

            {quoteFirm ? (
                <QuoteModal
                    firmIds={[quoteFirm.id]}
                    firmLabel={quoteFirm.firmName}
                    onClose={() => setQuoteFirm(null)}
                />
            ) : null}
            {bookFirm ? (
                <BookModal
                    firmId={bookFirm.id}
                    firmLabel={bookFirm.firmName}
                    onClose={() => setBookFirm(null)}
                />
            ) : null}

            {toast ? (
                <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-charcoal px-4 py-2 text-sm text-white shadow-lg">
                    {toast}
                </div>
            ) : null}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 p-3 backdrop-blur sm:hidden">
                <div className="flex gap-2">
                    <a href="#cc-results" className={`${PORTAL_PRIMARY_BTN} flex-1 !h-11`}>
                        Find
                    </a>
                    <Link href="/conveyancers/match" className={`${PORTAL_HERO_SECONDARY_BTN} !text-charcoal !bg-charcoal/[0.04]`}>
                        Match
                    </Link>
                    <Link href="/conveyancers/compare" className={`${PORTAL_HERO_SECONDARY_BTN} !text-charcoal !bg-charcoal/[0.04]`}>
                        Compare
                    </Link>
                </div>
            </div>
        </div>
    );
}
