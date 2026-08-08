'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Scale } from 'lucide-react';
import FilterPanel from '@/components/conveyancer-connect/FilterPanel';
import MapView from '@/components/conveyancer-connect/MapView';
import {
    BookModal,
    QuoteModal,
} from '@/components/conveyancer-connect/EngagementModals';
import CcDiscoveryBar from '@/components/conveyancer-connect/marketplace/CcDiscoveryBar';
import CcRecommendationsSection from '@/components/conveyancer-connect/marketplace/CcRecommendationsSection';
import CcMarketplaceSummary from '@/components/conveyancer-connect/marketplace/CcMarketplaceSummary';
import ConveyancerResultCard from '@/components/conveyancer-connect/marketplace/ConveyancerResultCard';
import CcCompareTray from '@/components/conveyancer-connect/marketplace/CcCompareTray';
import CcSmartInsight from '@/components/conveyancer-connect/marketplace/CcSmartInsight';
import CcTrustSection, {
    CcHowItWorks,
    CcFinalCta,
} from '@/components/conveyancer-connect/marketplace/CcMarketplaceSections';
import {
    DEFAULT_FILTERS,
    filterConveyancers,
    fetchDirectoryProfiles,
    loadCcState,
    haversineKm,
    pushRecentSearch,
    toggleCompare,
    toggleSaved,
    type BrowseFilters,
    type ConveyancerProfile,
    type ProvinceSlug,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';
import '@/app/conveyancers/cc-marketplace.css';
import '@/app/conveyancers/cc-content.css';

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

    function notify(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2600);
    }

    function onSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        pushRecentSearch(filters.query);
        document.getElementById('cc-results')?.scrollIntoView({ behavior: 'smooth' });
    }

    function scrollToAdvanced() {
        document.getElementById('cc-results')?.scrollIntoView({ behavior: 'smooth' });
        if (window.matchMedia('(max-width: 1023px)').matches) {
            setFiltersOpen(true);
        }
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

    function clearFilters() {
        setFilters({ ...DEFAULT_FILTERS, verifiedOnly: false });
    }

    return (
        <div className="cc-marketplace">
            {showHero ? (
                <header className="cc-content-hero cc-content-hero--soft">
                    <p className="cc-content-kicker">
                        <Scale className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
                        Conveyancer Connect
                    </p>
                    <h1 className="cc-content-title">
                        Find the right conveyancer for your property transfer
                    </h1>
                    <p>
                        PropReady-verified firms — request quotes, book a consult, or message an
                        attorney.
                    </p>
                </header>
            ) : null}

            <div className="cc-mp-browse">
                <CcDiscoveryBar
                    filters={filters}
                    onChange={setFilters}
                    onSearch={onSearchSubmit}
                    onAdvanced={scrollToAdvanced}
                />

                <CcRecommendationsSection
                    catalog={catalog}
                    savedIds={savedIds}
                    onSave={handleSave}
                    onQuote={setQuoteFirm}
                />

                <CcMarketplaceSummary catalog={catalog} resultsCount={results.length} />

                <div id="cc-results" className="cc-mp-layout">
                <div className="hidden lg:block">
                    <FilterPanel
                        filters={filters}
                        onChange={setFilters}
                        variant="marketplace"
                        catalog={catalog}
                    />
                </div>

                <div>
                    <div className="cc-mp-results-head">
                        <p className="cc-mp-results-count">
                            {loadingDirectory ? (
                                'Loading results…'
                            ) : (
                                <>
                                    <strong>{results.length}</strong> conveyancers match your search
                                </>
                            )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="lg:hidden cc-mp-btn-secondary !h-9 !px-3 !text-xs"
                                onClick={() => setFiltersOpen(true)}
                            >
                                Filters
                            </button>
                            <div className="cc-mp-view-toggle">
                                <button
                                    type="button"
                                    className={view === 'list' ? 'is-active' : ''}
                                    onClick={() => setView('list')}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    List
                                </button>
                                <button
                                    type="button"
                                    className={view === 'map' ? 'is-active' : ''}
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
                        <div className="cc-mp-results-list">
                            {loadingDirectory ? (
                                <div className="cc-mp-empty">
                                    <h3>Loading verified firms…</h3>
                                    <p>Fetching PropReady-approved conveyancers.</p>
                                </div>
                            ) : results.length ? (
                                results.map((p) => (
                                    <ConveyancerResultCard
                                        key={p.id}
                                        profile={p}
                                        saved={savedIds.includes(p.id)}
                                        compared={compareIds.includes(p.id)}
                                        onSave={() => handleSave(p.id)}
                                        onCompare={() => handleCompare(p.id)}
                                        onQuote={() => setQuoteFirm(p)}
                                    />
                                ))
                            ) : (
                                <div className="cc-mp-empty">
                                    <h3>No conveyancers match your search.</h3>
                                    <p>
                                        {catalog.length === 0
                                            ? 'No verified conveyancers are listed yet. Check back soon — firms appear here after PropReady approval.'
                                            : 'Try widening your location or adjusting your filters.'}
                                    </p>
                                    {catalog.length > 0 ? (
                                        <button
                                            type="button"
                                            className="cc-mp-btn-primary"
                                            onClick={clearFilters}
                                        >
                                            Clear filters
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>

            <div className="cc-mp-trust-zone">
                <CcTrustSection />
            </div>

            <div className="cc-mp-guides">
                <CcHowItWorks />
                <CcSmartInsight
                    filters={filters}
                    onApplyFilters={setFilters}
                    onNotify={notify}
                />
                <CcFinalCta />
            </div>

            {filtersOpen ? (
                <div className="fixed inset-0 z-[70] lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close filters"
                        onClick={() => setFiltersOpen(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[1.5rem] bg-[#F7F4EF] p-4">
                        <FilterPanel
                            filters={filters}
                            onChange={setFilters}
                            compact
                            variant="marketplace"
                            catalog={catalog}
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

            <CcCompareTray
                compareIds={compareIds}
                catalog={catalog}
                onRemove={handleCompare}
            />

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 p-3 backdrop-blur sm:hidden"
                aria-label="Quick links"
            >
                <div className="flex gap-2">
                    <a href="#cc-results" className={`${PORTAL_PRIMARY_BTN} flex-1 !h-11`}>
                        Find
                    </a>
                    <Link
                        href="/conveyancers/match"
                        className="cc-mp-btn-secondary flex-1 !h-11"
                    >
                        Match
                    </Link>
                    <Link href="/conveyancers/compare" className="cc-mp-btn-secondary flex-1 !h-11">
                        Compare
                    </Link>
                </div>
            </nav>
        </div>
    );
}
