'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    BadgeCheck,
    Globe,
    Heart,
    Phone,
    Share2,
    GitCompare,
} from 'lucide-react';
import PortalHero, { PORTAL_HERO_SECONDARY_BTN } from '@/components/PortalHero';
import FeeEstimator from '@/components/conveyancer-connect/FeeEstimator';
import MapView from '@/components/conveyancer-connect/MapView';
import {
    BookModal,
    MessagePanel,
    QuoteModal,
} from '@/components/conveyancer-connect/EngagementModals';
import {
    CcBadge,
    CC_CARD_FLAT,
    CC_MUTED,
    CC_SECTION_TITLE,
    PricePips,
    Stars,
} from '@/components/conveyancer-connect/cc-ui';
import {
    loadCcState,
    SPECIALTY_LABELS,
    toggleCompare,
    toggleSaved,
    type ConveyancerProfile,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

const TABS = [
    'about',
    'services',
    'performance',
    'reviews',
    'documents',
    'pricing',
] as const;

type Tab = (typeof TABS)[number];

export default function FirmProfileApp({
    profile,
    initialTab,
}: {
    profile: ConveyancerProfile;
    initialTab?: string;
}) {
    const [tab, setTab] = useState<Tab>(
        TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'about'
    );
    const [saved, setSaved] = useState(false);
    const [compared, setCompared] = useState(false);
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [bookOpen, setBookOpen] = useState(false);
    const [messageOpen, setMessageOpen] = useState(false);

    useEffect(() => {
        const s = loadCcState();
        setSaved(s.savedIds.includes(profile.id));
        setCompared(s.compareIds.includes(profile.id));
        if (initialTab === 'message') setMessageOpen(true);
    }, [profile.id, initialTab]);

    const axisAvg = useMemo(() => {
        if (!profile.reviews.length) return null;
        const keys = [
            'communication',
            'professionalism',
            'transparency',
            'value',
            'speed',
            'knowledge',
            'overall',
        ] as const;
        const out: Record<string, number> = {};
        for (const k of keys) {
            out[k] =
                Math.round(
                    (profile.reviews.reduce((s, r) => s + r.axes[k], 0) / profile.reviews.length) *
                        10
                ) / 10;
        }
        return out;
    }, [profile.reviews]);

    return (
        <div className="space-y-6">
            <PortalHero
                size="compact"
                eyebrow="Verified conveyancer profile"
                eyebrowIcon={<BadgeCheck className="h-3.5 w-3.5 text-gold" />}
                title={profile.firmName}
                description={
                    <span>
                        {profile.attorneyName} · {profile.title} · {profile.suburb}, {profile.city}
                    </span>
                }
                actions={
                    <>
                        <button type="button" className={PORTAL_PRIMARY_BTN} onClick={() => setBookOpen(true)}>
                            Book consultation
                        </button>
                        <button
                            type="button"
                            className={PORTAL_HERO_SECONDARY_BTN}
                            onClick={() => setQuoteOpen(true)}
                        >
                            Request quote
                        </button>
                    </>
                }
                stats={[
                    {
                        label: 'Status',
                        value: profile.verified ? 'Verified' : 'Listed',
                    },
                    { label: 'Location', value: profile.city || 'South Africa' },
                    {
                        label: 'Languages',
                        value: String(profile.languages.length || 1),
                    },
                    {
                        label: 'Services',
                        value: String(profile.specialisations.length || 1),
                    },
                ]}
            />

            <div className="flex flex-wrap gap-2">
                <button type="button" className={PORTAL_SECONDARY_BTN} onClick={() => setMessageOpen(true)}>
                    Message
                </button>
                {profile.phone ? (
                    <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className={PORTAL_SECONDARY_BTN}>
                        <Phone className="h-4 w-4" />
                        Call
                    </a>
                ) : null}
                {profile.website ? (
                    <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className={PORTAL_SECONDARY_BTN}
                    >
                        <Globe className="h-4 w-4" />
                        Website
                    </a>
                ) : null}
                <button
                    type="button"
                    className={PORTAL_SECONDARY_BTN}
                    onClick={() => {
                        const s = toggleSaved(profile.id);
                        setSaved(s.savedIds.includes(profile.id));
                    }}
                >
                    <Heart className={`h-4 w-4 ${saved ? 'fill-gold text-gold' : ''}`} />
                    Save
                </button>
                <button
                    type="button"
                    className={PORTAL_SECONDARY_BTN}
                    onClick={() => {
                        const { state } = toggleCompare(profile.id);
                        setCompared(state.compareIds.includes(profile.id));
                    }}
                >
                    <GitCompare className="h-4 w-4" />
                    {compared ? 'In compare' : 'Compare'}
                </button>
                <button
                    type="button"
                    className={PORTAL_SECONDARY_BTN}
                    onClick={() => {
                        void navigator.clipboard?.writeText(window.location.href);
                    }}
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
                <Link href="/conveyancers/tracker" className={PORTAL_SECONDARY_BTN}>
                    Start transfer
                </Link>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                            tab === t
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal/60 ring-1 ring-charcoal/10'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'about' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <section className={`${CC_CARD_FLAT} p-6`}>
                        <h2 className={CC_SECTION_TITLE}>About</h2>
                        <p className={`${CC_MUTED} mt-3`}>{profile.bio}</p>
                        <p className={`${CC_MUTED} mt-3`}>{profile.firmHistory}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Stars rating={profile.rating} size="md" />
                            <PricePips band={profile.priceBand} />
                            {profile.verified ? (
                                <CcBadge tone="success">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    Verified
                                </CcBadge>
                            ) : null}
                        </div>
                    </section>
                    <section className={`${CC_CARD_FLAT} p-6 space-y-4`}>
                        <Block title="Qualifications" items={profile.qualifications} />
                        <Block title="Education" items={profile.education} />
                        <Block title="Memberships" items={profile.memberships} />
                        <Block title="Awards" items={profile.awards} />
                        <Block title="Licences" items={profile.licences} />
                        <Block title="Languages" items={profile.languages} />
                    </section>
                    <div className="lg:col-span-2">
                        <MapView profiles={[profile]} />
                    </div>
                </div>
            ) : null}

            {tab === 'services' ? (
                <section className={`${CC_CARD_FLAT} p-6`}>
                    <h2 className={CC_SECTION_TITLE}>Services</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {profile.services.map((s) => (
                            <div
                                key={s}
                                className="rounded-2xl border border-charcoal/[0.06] bg-charcoal/[0.02] px-4 py-3 text-sm font-semibold text-charcoal"
                            >
                                {SPECIALTY_LABELS[s]}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {tab === 'performance' ? (
                <section className={`${CC_CARD_FLAT} p-6`}>
                    <h2 className={CC_SECTION_TITLE}>Performance</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {Object.entries({
                            'Avg transfer days': profile.performance.avgTransferDays,
                            'Response hours': profile.performance.avgResponseHours,
                            'Satisfaction %': profile.performance.clientSatisfactionPct,
                            'Repeat clients %': profile.performance.repeatClientPct,
                            'Transfers completed': profile.performance.transfersCompleted,
                            'Success rate %': profile.performance.successRatePct,
                            'Current workload': profile.performance.currentWorkload,
                            'Monthly cases': profile.performance.monthlyCases,
                        }).map(([label, value]) => (
                            <div key={label} className="rounded-2xl bg-charcoal/[0.03] p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">
                                    {label}
                                </p>
                                <p className="mt-1 text-2xl font-semibold tabular-nums text-charcoal">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {tab === 'reviews' ? (
                <section className="space-y-4">
                    {axisAvg ? (
                        <div className={`${CC_CARD_FLAT} grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4`}>
                            {Object.entries(axisAvg).map(([k, v]) => (
                                <div key={k}>
                                    <p className="text-xs capitalize text-charcoal/45">{k}</p>
                                    <p className="text-xl font-semibold text-charcoal">{v}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {profile.reviews.map((r) => (
                        <article key={r.id} className={`${CC_CARD_FLAT} p-5`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="font-semibold text-charcoal">{r.title}</p>
                                    <p className="text-xs text-charcoal/45">
                                        {r.author} · {r.role} · {r.date}
                                        {r.verified ? ' · Verified' : ''}
                                    </p>
                                </div>
                                <Stars rating={r.rating} />
                            </div>
                            <p className={`${CC_MUTED} mt-3`}>{r.body}</p>
                            {r.response ? (
                                <p className="mt-3 rounded-xl bg-gold/[0.06] px-3 py-2 text-sm text-charcoal/70">
                                    <span className="font-semibold text-gold">Firm response: </span>
                                    {r.response}
                                </p>
                            ) : null}
                            <p className="mt-2 text-xs text-charcoal/40">{r.helpful} found helpful</p>
                        </article>
                    ))}
                </section>
            ) : null}

            {tab === 'documents' ? (
                <section className={`${CC_CARD_FLAT} p-6`}>
                    <h2 className={CC_SECTION_TITLE}>Documents & team</h2>
                    <ul className="mt-4 space-y-2">
                        {profile.documents.map((d) => (
                            <li
                                key={d.label}
                                className="flex items-center justify-between rounded-xl border border-charcoal/[0.06] px-4 py-3 text-sm"
                            >
                                <span className="font-medium text-charcoal">{d.label}</span>
                                <span className="text-charcoal/45">{d.type}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {tab === 'pricing' ? <FeeEstimator priceBand={profile.priceBand} /> : null}

            {quoteOpen ? (
                <QuoteModal
                    firmIds={[profile.id]}
                    firmLabel={profile.firmName}
                    onClose={() => setQuoteOpen(false)}
                />
            ) : null}
            {bookOpen ? (
                <BookModal
                    firmId={profile.id}
                    firmLabel={profile.firmName}
                    onClose={() => setBookOpen(false)}
                />
            ) : null}
            {messageOpen ? (
                <MessagePanel
                    firmId={profile.id}
                    firmLabel={profile.firmName}
                    onClose={() => setMessageOpen(false)}
                />
            ) : null}
        </div>
    );
}

function Block({ title, items }: { title: string; items: string[] }) {
    if (!items.length) return null;
    return (
        <div>
            <h3 className="text-sm font-semibold text-charcoal">{title}</h3>
            <ul className="mt-1 space-y-1 text-sm text-charcoal/60">
                {items.map((i) => (
                    <li key={i}>• {i}</li>
                ))}
            </ul>
        </div>
    );
}
