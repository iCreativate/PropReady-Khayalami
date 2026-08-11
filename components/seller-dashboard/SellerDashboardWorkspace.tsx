'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Bath,
    BedDouble,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Home,
    Landmark,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Ruler,
    Search,
    Sparkles,
    Star,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import PortalHero from '@/components/PortalHero';
import AppointmentConfirmPanel, {
    type ConfirmableViewing,
} from '@/components/AppointmentConfirmPanel';
import PpraTrustSection from '@/components/PpraTrustSection';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import {
    PORTAL_DANGER_BTN,
    PORTAL_MODAL_BACKDROP,
    PORTAL_MODAL_PANEL_LG,
    PORTAL_PRIMARY_BTN,
    PORTAL_SEARCH_INPUT,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';
import type { SellerProperty } from '@/lib/seller-properties';
import '@/app/dashboard/buyer-intelligence.css';

function propertySizeLabel(property: SellerProperty): string {
    const size = property.propertySize || property.buildingSize || property.landSize;
    return size ? `${size} m²` : '—';
}

function propertyTypeLabel(property: SellerProperty): string {
    const raw = (property.propertyType || '').trim();
    if (!raw) return 'Property';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatUpdatedLabel(iso?: string): string {
    if (!iso) return '';
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '';
    return new Date(t).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export type SellerDashboardAgent = {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    rating: number;
    totalSales: number;
    experience: string;
    location: string;
    listingQualityScore: number;
    specialties: string[];
    verified: boolean;
    ppraNumber?: string;
    ffcNumber?: string;
    ffcDocumentUrl?: string;
    verificationStatus?: string;
};

type ViewingRow = {
    id: string;
    propertyTitle?: string;
    propertyAddress?: string;
    propertyPrice?: number;
    date: string;
    time?: string;
    status: string;
    notes?: string;
};

type Props = {
    userName?: string;
    userEmail?: string;
    sellerProperties: SellerProperty[];
    activePropertyId: string | null;
    sellerInfo: SellerProperty | null;
    selectedAgent: SellerDashboardAgent | null;
    viewingAppointments: ViewingRow[];
    showSyncFailedBanner: boolean;
    onDismissSyncBanner: () => void;
    onAddProperty: () => void;
    onEditProperty: (property: SellerProperty) => void;
    onDeleteProperty: (property: SellerProperty) => void;
    onSetActiveProperty: (property: SellerProperty) => void;
    onOpenAgentModal: () => void;
    onRemoveAgent: () => void;
    onConfirmRefresh: () => void;
    showAgentModal: boolean;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    filteredAgents: SellerDashboardAgent[];
    onSelectAgent: (agent: SellerDashboardAgent) => void;
    onCloseAgentModal: () => void;
};

function statusTone(status: string) {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'confirmed') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-[#e53935]/10 text-[#e53935] border-[#e53935]/20';
}

export default function SellerDashboardWorkspace({
    userName,
    userEmail,
    sellerProperties,
    activePropertyId,
    sellerInfo,
    selectedAgent,
    viewingAppointments,
    showSyncFailedBanner,
    onDismissSyncBanner,
    onAddProperty,
    onEditProperty,
    onDeleteProperty,
    onSetActiveProperty,
    onOpenAgentModal,
    onRemoveAgent,
    onConfirmRefresh,
    showAgentModal,
    searchTerm,
    onSearchTermChange,
    filteredAgents,
    onSelectAgent,
    onCloseAgentModal,
}: Props) {
    const firstName = userName?.split(' ')[0] || 'Seller';
    const activeValue = sellerInfo
        ? formatCurrency(parseAmountForDisplay(sellerInfo.currentValue || sellerInfo.askingPrice))
        : '—';
    const nextViewing = viewingAppointments[0];

    return (
        <div className="biw">
            <div className="biw-shell">
                <div className="biw-main">
                    {userEmail ? (
                        <AppointmentConfirmPanel
                            viewings={viewingAppointments as ConfirmableViewing[]}
                            userEmail={userEmail}
                            party="seller"
                            onConfirmed={onConfirmRefresh}
                        />
                    ) : null}

                    {showSyncFailedBanner ? (
                        <div className="biw-panel biw-panel--static flex items-start justify-between gap-4 border border-amber-200/80 bg-amber-50/90 p-4 text-amber-950">
                            <p className="text-sm leading-relaxed">
                                Your info was saved locally. We couldn&apos;t sync to agent dashboards — your
                                agent may need a database update.
                            </p>
                            <button
                                type="button"
                                onClick={onDismissSyncBanner}
                                className="shrink-0 rounded-lg p-1.5 text-amber-800/70 transition hover:bg-amber-100"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : null}

                    <PortalHero
                        eyebrow="Seller workspace"
                        title={
                            <>
                                Welcome back, {firstName}
                            </>
                        }
                        description="Manage properties, connect with agents, and keep viewings on track."
                        glassLabel="Today's pulse"
                        metrics={[
                            { label: 'Properties', value: sellerProperties.length },
                            { label: 'Estimated value', value: activeValue },
                        ]}
                        stats={[
                            {
                                label: 'Listings',
                                value: sellerProperties.length,
                            },
                            {
                                label: 'Agent linked',
                                value: selectedAgent ? selectedAgent.name.split(' ')[0] : 'Not yet',
                                tone: selectedAgent ? 'success' : 'default',
                            },
                            {
                                label: 'Viewings',
                                value: viewingAppointments.length,
                            },
                            {
                                label: 'Status',
                                value: sellerProperties.length > 0 ? 'Active' : 'Setup',
                            },
                        ]}
                        actions={
                            <button type="button" onClick={onAddProperty} className="biw-cta biw-cta--primary w-full">
                                <Plus className="h-3.5 w-3.5" />
                                Add property
                            </button>
                        }
                    >
                        {nextViewing ? (
                            <p className="mt-4 text-xs text-white/60">
                                Next viewing · {new Date(nextViewing.date).toLocaleDateString()}{' '}
                                {nextViewing.time || ''}
                            </p>
                        ) : null}
                    </PortalHero>

                    <section className="biw-kpis" aria-label="Key seller metrics">
                        {[
                            {
                                label: 'Active asking / estimate',
                                value: activeValue,
                                hint: sellerInfo?.propertyAddress || 'Add a property to unlock valuation',
                                icon: Building2,
                            },
                            {
                                label: 'Properties on file',
                                value: String(sellerProperties.length),
                                hint:
                                    sellerProperties.length > 0
                                        ? 'Private seller records — not public listings'
                                        : 'Start with the property you want to sell',
                                icon: Home,
                            },
                            {
                                label: 'Viewings booked',
                                value: String(viewingAppointments.length),
                                hint:
                                    viewingAppointments.length > 0
                                        ? 'Appointments scheduled with agents'
                                        : 'Viewings appear once agents book',
                                icon: Calendar,
                            },
                            {
                                label: 'Agent status',
                                value: selectedAgent ? 'Linked' : 'Open',
                                hint: selectedAgent
                                    ? `${selectedAgent.name} · ${selectedAgent.company}`
                                    : 'Select a verified agent when ready',
                                icon: Users,
                            },
                        ].map((kpi) => {
                            const Icon = kpi.icon;
                            return (
                                <article key={kpi.label} className="biw-panel biw-kpi">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="biw-kpi-label">{kpi.label}</p>
                                        <Icon className="h-3.5 w-3.5 text-[#e53935]/75" />
                                    </div>
                                    <p className="biw-kpi-value">{kpi.value}</p>
                                    <p className="biw-kpi-hint">{kpi.hint}</p>
                                </article>
                            );
                        })}
                    </section>

                    <section className="biw-split biw-split--65-35">
                        <article className="biw-panel biw-panel--static overflow-hidden p-0">
                            <div className="border-b border-black/[0.06] bg-gradient-to-br from-[#fff8f7] via-white to-[#f7f8fa] px-5 py-5 sm:px-6 sm:py-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e53935]/15 bg-[#e53935]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e53935]">
                                            <Sparkles className="h-3 w-3" />
                                            Portfolio
                                        </div>
                                        <h3 className="biw-sec-title">My properties</h3>
                                        <p className="biw-sec-sub mt-1 max-w-xl">
                                            Private seller records for valuation and agent matching — not public
                                            marketplace listings.
                                        </p>
                                        {sellerProperties.length > 0 ? (
                                            <p className="mt-3 text-xs font-medium text-black/45">
                                                {sellerProperties.length} propert
                                                {sellerProperties.length === 1 ? 'y' : 'ies'} on file
                                                {activePropertyId
                                                    ? ' · one marked active for matching'
                                                    : ''}
                                            </p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onAddProperty}
                                        className={`${PORTAL_PRIMARY_BTN} shrink-0`}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add property
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                {sellerProperties.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-black/[0.1] bg-black/[0.015] px-6 py-12 text-center">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e53935]/10 text-[#e53935]">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <p className="biw-sec-title text-base">No properties yet</p>
                                        <p className="biw-sec-sub mx-auto mt-1 max-w-sm">
                                            Add the first property you want to sell to unlock valuation, agent
                                            matching, and your seller workspace.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={onAddProperty}
                                            className="biw-cta biw-cta--primary mx-auto mt-5"
                                        >
                                            Add property
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {sellerProperties.map((property) => {
                                            const isActive = property.id === activePropertyId;
                                            const asking = property.askingPrice;
                                            const estimate = property.currentValue;
                                            const primaryValue = asking || estimate;
                                            const suburb =
                                                property.propertySuburb || property.suburb || '';
                                            const updated = formatUpdatedLabel(
                                                property.updatedAt || property.createdAt
                                            );
                                            const chips = [
                                                propertyTypeLabel(property),
                                                property.propertyCondition
                                                    ? `${property.propertyCondition} condition`
                                                    : null,
                                                property.timeline ? `Timeline · ${property.timeline}` : null,
                                                property.hasBond ? 'Under bond' : null,
                                            ].filter(Boolean) as string[];

                                            return (
                                                <div
                                                    key={property.id}
                                                    className={`group relative overflow-hidden rounded-2xl border transition ${
                                                        isActive
                                                            ? 'border-[#e53935]/30 bg-gradient-to-br from-[#fff7f6] via-white to-white shadow-[0_10px_28px_rgba(229,57,53,0.08)]'
                                                            : 'border-black/[0.08] bg-white hover:border-[#e53935]/22 hover:shadow-[0_10px_28px_rgba(27,27,27,0.06)]'
                                                    }`}
                                                >
                                                    <div
                                                        className={`absolute inset-y-0 left-0 w-1 ${
                                                            isActive ? 'bg-[#e53935]' : 'bg-transparent group-hover:bg-[#e53935]/35'
                                                        }`}
                                                        aria-hidden
                                                    />

                                                    <div className="p-4 pl-5 sm:p-5 sm:pl-6">
                                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                    {isActive ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#e53935]/20 bg-[#e53935]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e53935]">
                                                                            <CheckCircle className="h-3 w-3" />
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black/45">
                                                                            On file
                                                                        </span>
                                                                    )}
                                                                    {chips.map((chip) => (
                                                                        <span
                                                                            key={chip}
                                                                            className="rounded-full border border-black/[0.06] bg-black/[0.025] px-2 py-0.5 text-[10px] font-medium capitalize text-black/55"
                                                                        >
                                                                            {chip}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                <h4 className="text-lg font-semibold tracking-tight text-[#1b1b1b] sm:text-xl">
                                                                    {property.propertyAddress}
                                                                </h4>
                                                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/50">
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#e53935]/70" />
                                                                        {suburb || 'Suburb not set'}
                                                                    </span>
                                                                    {updated ? (
                                                                        <span className="inline-flex items-center gap-1.5">
                                                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                                                            Updated {updated}
                                                                        </span>
                                                                    ) : null}
                                                                </div>

                                                                {property.propertyDescription ? (
                                                                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-black/55">
                                                                        {property.propertyDescription}
                                                                    </p>
                                                                ) : null}

                                                                {property.reasonForSelling ? (
                                                                    <p className="mt-2 text-xs text-black/45">
                                                                        <span className="font-semibold text-black/55">
                                                                            Reason for selling:
                                                                        </span>{' '}
                                                                        {property.reasonForSelling}
                                                                    </p>
                                                                ) : null}
                                                            </div>

                                                            <div className="shrink-0 rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 lg:min-w-[11.5rem] lg:text-right">
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                                                    {asking ? 'Asking price' : 'Estimated value'}
                                                                </p>
                                                                <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-[#e53935]">
                                                                    {formatCurrency(
                                                                        parseAmountForDisplay(primaryValue)
                                                                    )}
                                                                </p>
                                                                {asking &&
                                                                estimate &&
                                                                String(asking) !== String(estimate) ? (
                                                                    <p className="mt-1 text-xs text-black/45">
                                                                        Est.{' '}
                                                                        {formatCurrency(
                                                                            parseAmountForDisplay(estimate)
                                                                        )}
                                                                    </p>
                                                                ) : null}
                                                                {property.hasBond && property.bondBalance ? (
                                                                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-black/50 lg:justify-end">
                                                                        <Landmark className="h-3 w-3" />
                                                                        Bond{' '}
                                                                        {formatCurrency(
                                                                            parseAmountForDisplay(
                                                                                property.bondBalance
                                                                            )
                                                                        )}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                            {[
                                                                {
                                                                    label: 'Bedrooms',
                                                                    value: property.bedrooms || '—',
                                                                    icon: BedDouble,
                                                                },
                                                                {
                                                                    label: 'Bathrooms',
                                                                    value: property.bathrooms || '—',
                                                                    icon: Bath,
                                                                },
                                                                {
                                                                    label: 'Size',
                                                                    value: propertySizeLabel(property),
                                                                    icon: Ruler,
                                                                },
                                                                {
                                                                    label: 'Type',
                                                                    value: propertyTypeLabel(property),
                                                                    icon: Building2,
                                                                },
                                                            ].map((cell) => {
                                                                const Icon = cell.icon;
                                                                return (
                                                                    <div
                                                                        key={cell.label}
                                                                        className="rounded-xl border border-black/[0.05] bg-black/[0.02] px-3 py-2.5"
                                                                    >
                                                                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40">
                                                                            <Icon className="h-3 w-3 text-[#e53935]/65" />
                                                                            {cell.label}
                                                                        </div>
                                                                        <p className="truncate text-sm font-semibold capitalize text-[#1b1b1b]">
                                                                            {cell.value}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
                                                            {!isActive ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onSetActiveProperty(property)}
                                                                    className={PORTAL_SECONDARY_BTN}
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Set as active
                                                                </button>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Used for matching
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => onEditProperty(property)}
                                                                className={PORTAL_SECONDARY_BTN}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Edit details
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => onDeleteProperty(property)}
                                                                className={`${PORTAL_DANGER_BTN} ml-auto`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </article>

                        <div className="flex flex-col gap-4">
                            <article className="biw-panel biw-panel--static p-5 sm:p-6">
                                <h3 className="biw-sec-title">Quick actions</h3>
                                <p className="biw-sec-sub mb-4">Jump to the next seller move</p>
                                <div className="grid gap-2.5">
                                    {[
                                        {
                                            href: '/sellers',
                                            label: 'Learning Center',
                                            icon: FileText,
                                        },
                                        {
                                            href: '/sellers/valuation',
                                            label: 'Book valuation',
                                            icon: Calendar,
                                        },
                                        {
                                            href: '/dashboard/viewings',
                                            label: 'Viewings',
                                            icon: Calendar,
                                            badge: viewingAppointments.length || undefined,
                                        },
                                        {
                                            href: '/dashboard',
                                            label: 'Buyer dashboard',
                                            icon: Home,
                                        },
                                    ].map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Link
                                                key={action.label}
                                                href={action.href}
                                                className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.015] px-3.5 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#e53935]/20 hover:bg-[#e53935]/[0.03]"
                                            >
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e53935]/10 text-[#e53935]">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <span className="flex-1">{action.label}</span>
                                                {action.badge ? (
                                                    <span className="rounded-full bg-[#e53935]/10 px-2 py-0.5 text-[11px] font-semibold text-[#e53935]">
                                                        {action.badge}
                                                    </span>
                                                ) : (
                                                    <ArrowRight className="h-3.5 w-3.5 text-black/30" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={onOpenAgentModal}
                                        className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.015] px-3.5 py-3 text-left text-sm font-medium text-[#1b1b1b] transition hover:border-[#e53935]/20 hover:bg-[#e53935]/[0.03]"
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e53935]/10 text-[#e53935]">
                                            <Users className="h-4 w-4" />
                                        </span>
                                        <span className="flex-1">
                                            {selectedAgent ? 'Change agent' : 'Select agent'}
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 text-black/30" />
                                    </button>
                                </div>
                            </article>

                            {sellerInfo ? (
                                <article className="biw-panel biw-panel--static p-5 sm:p-6">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                                        Active property
                                    </p>
                                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#1b1b1b]">
                                        {sellerInfo.propertyAddress || 'Property'}
                                    </h3>
                                    <p className="mt-3 text-2xl font-semibold tabular-nums text-[#e53935]">
                                        {activeValue}
                                    </p>
                                    <p className="mt-1 text-xs text-black/45">Estimated value</p>
                                    <div className="mt-4 grid gap-3 border-t border-black/[0.06] pt-4 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-black/45">Suburb</span>
                                            <span className="font-medium text-[#1b1b1b]">
                                                {sellerInfo.propertySuburb || sellerInfo.suburb || '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-black/45">Condition</span>
                                            <span className="font-medium capitalize text-[#1b1b1b]">
                                                {sellerInfo.propertyCondition || sellerInfo.propertyType || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ) : null}
                        </div>
                    </section>

                    {viewingAppointments.length > 0 ? (
                        <article className="biw-panel biw-panel--static p-5 sm:p-6">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="biw-sec-title">Viewing appointments</h3>
                                    <p className="biw-sec-sub">Scheduled by agents for your properties</p>
                                </div>
                                <Link href="/dashboard/viewings" className="biw-cta biw-cta--ghost shrink-0">
                                    View all
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {viewingAppointments.map((viewing) => (
                                    <div
                                        key={viewing.id}
                                        className="rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="text-base font-semibold text-[#1b1b1b]">
                                                    {viewing.propertyTitle || 'Property viewing'}
                                                </h4>
                                                <div className="mt-1.5 flex items-center gap-2 text-sm text-black/50">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">{viewing.propertyAddress}</span>
                                                </div>
                                                {(viewing.propertyPrice ?? 0) > 0 ? (
                                                    <p className="mt-2 font-semibold tabular-nums text-[#e53935]">
                                                        {formatCurrency(viewing.propertyPrice || 0)}
                                                    </p>
                                                ) : null}
                                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/60">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(viewing.date).toLocaleDateString()}
                                                    </span>
                                                    {viewing.time ? (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {viewing.time}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
                                                    viewing.status
                                                )}`}
                                            >
                                                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                                            </span>
                                        </div>
                                        {viewing.notes ? (
                                            <p className="mt-3 border-t border-black/[0.06] pt-3 text-sm text-black/55">
                                                {viewing.notes}
                                            </p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </article>
                    ) : null}

                    {selectedAgent ? (
                        <article className="biw-panel biw-panel--static p-5 sm:p-6">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="biw-sec-title">Your selected agent</h3>
                                    <p className="biw-sec-sub">Assigned to help sell your property</p>
                                </div>
                                <button type="button" onClick={onRemoveAgent} className={PORTAL_DANGER_BTN}>
                                    Remove agent
                                </button>
                            </div>

                            <div className="rounded-2xl border border-black/[0.08] bg-black/[0.015] p-5">
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-[#1b1b1b]">{selectedAgent.name}</h4>
                                        <p className="text-sm text-black/50">{selectedAgent.company}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/60">
                                            <span className="inline-flex items-center gap-1 font-semibold text-[#1b1b1b]">
                                                <Star className="h-3.5 w-3.5 fill-[#e53935] text-[#e53935]" />
                                                {selectedAgent.rating}
                                            </span>
                                            <span>·</span>
                                            <span>{selectedAgent.totalSales} sales</span>
                                            <span>·</span>
                                            <span>{selectedAgent.experience}</span>
                                        </div>
                                    </div>
                                    {selectedAgent.verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                            <CheckCircle className="h-3 w-3" />
                                            PPRA verified
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mb-4">
                                    <PpraTrustSection agent={selectedAgent} />
                                </div>

                                <div className="mb-4 space-y-2 text-sm text-black/65">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-black/35" />
                                        {selectedAgent.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-black/35" />
                                        {selectedAgent.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-black/35" />
                                        {selectedAgent.email}
                                    </div>
                                </div>

                                {selectedAgent.specialties.length > 0 ? (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {selectedAgent.specialties.map((specialty) => (
                                            <span
                                                key={specialty}
                                                className="rounded-full border border-[#e53935]/15 bg-[#e53935]/10 px-2.5 py-1 text-[11px] font-medium text-[#e53935]"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-2">
                                    <a href={`tel:${selectedAgent.phone}`} className={PORTAL_PRIMARY_BTN}>
                                        <Phone className="h-4 w-4" />
                                        Call agent
                                    </a>
                                    <a href={`mailto:${selectedAgent.email}`} className={PORTAL_SECONDARY_BTN}>
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </a>
                                </div>
                            </div>
                        </article>
                    ) : null}

                    {sellerInfo ? (
                        <article className="biw-panel biw-panel--static p-5 sm:p-6">
                            <h3 className="biw-sec-title">Active property details</h3>
                            <p className="biw-sec-sub mb-5">Full record used for valuation and matching</p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2 rounded-xl bg-black/[0.025] px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                        Address
                                    </p>
                                    <p className="mt-1 font-semibold text-[#1b1b1b]">
                                        {sellerInfo.propertyAddress
                                            ? sellerInfo.propertyAddress
                                                  .split(',')
                                                  .map((s) => s.trim())
                                                  .filter(Boolean)
                                                  .join(', ')
                                            : '—'}
                                    </p>
                                </div>
                                {[
                                    {
                                        label: 'Suburb',
                                        value: sellerInfo.propertySuburb || sellerInfo.suburb || '—',
                                    },
                                    { label: 'Bedrooms', value: sellerInfo.bedrooms || '—' },
                                    { label: 'Bathrooms', value: sellerInfo.bathrooms || '—' },
                                    {
                                        label: 'Size',
                                        value:
                                            sellerInfo.propertySize ||
                                            sellerInfo.buildingSize ||
                                            sellerInfo.landSize
                                                ? `${sellerInfo.propertySize || sellerInfo.buildingSize || sellerInfo.landSize} m²`
                                                : '—',
                                    },
                                    {
                                        label: 'Estimated value',
                                        value: activeValue,
                                        accent: true,
                                    },
                                    {
                                        label: 'Condition',
                                        value: sellerInfo.propertyCondition || '—',
                                    },
                                ].map((row) => (
                                    <div key={row.label} className="rounded-xl bg-black/[0.025] px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                            {row.label}
                                        </p>
                                        <p
                                            className={`mt-1 font-semibold capitalize ${
                                                row.accent ? 'text-[#e53935]' : 'text-[#1b1b1b]'
                                            }`}
                                        >
                                            {row.value}
                                        </p>
                                    </div>
                                ))}
                                {sellerInfo.propertyDescription ? (
                                    <div className="sm:col-span-2 rounded-xl bg-black/[0.025] px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                            Description
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-[#1b1b1b]">
                                            {sellerInfo.propertyDescription}
                                        </p>
                                    </div>
                                ) : null}
                                {sellerInfo.hasBond ? (
                                    <div className="rounded-xl bg-black/[0.025] px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                            Bond balance
                                        </p>
                                        <p className="mt-1 font-semibold tabular-nums text-[#1b1b1b]">
                                            {formatCurrency(parseAmountForDisplay(sellerInfo.bondBalance))}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </article>
                    ) : null}
                </div>
            </div>

            {showAgentModal ? (
                <div className={`${PORTAL_MODAL_BACKDROP} !z-[100]`}>
                    <div className={`${PORTAL_MODAL_PANEL_LG} flex max-h-[92vh] flex-col overflow-hidden`}>
                        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
                                    Agent match
                                </p>
                                <h2 className="biw-sec-title mt-1 text-xl">Select an agent</h2>
                                <p className="biw-sec-sub">Choose a verified professional for your sale</p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseAgentModal}
                                className="rounded-xl border border-black/[0.08] p-2 text-black/50 transition hover:bg-black/[0.03]"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <div className="relative mb-5">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                <input
                                    type="text"
                                    placeholder="Search by name, company, or location…"
                                    value={searchTerm}
                                    onChange={(e) => onSearchTermChange(e.target.value)}
                                    className={`${PORTAL_SEARCH_INPUT} !pl-10`}
                                />
                            </div>

                            <div className="space-y-3">
                                {filteredAgents.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Users className="mx-auto mb-3 h-10 w-10 text-black/20" />
                                        <p className="font-semibold text-[#1b1b1b]">No agents found</p>
                                        <p className="mt-1 text-sm text-black/45">Try a different search term.</p>
                                    </div>
                                ) : (
                                    filteredAgents.map((agent) => {
                                        const selected = selectedAgent?.id === agent.id;
                                        return (
                                            <button
                                                key={agent.id}
                                                type="button"
                                                onClick={() => onSelectAgent(agent)}
                                                className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                                                    selected
                                                        ? 'border-[#e53935]/30 bg-[#e53935]/[0.04]'
                                                        : 'border-black/[0.08] bg-white hover:border-[#e53935]/20'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                                            <h4 className="text-base font-semibold text-[#1b1b1b]">
                                                                {agent.name}
                                                            </h4>
                                                            {agent.verified ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    Verified
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-sm text-black/50">{agent.company}</p>
                                                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/55">
                                                            <span className="inline-flex items-center gap-1 font-semibold text-[#1b1b1b]">
                                                                <Star className="h-3 w-3 fill-[#e53935] text-[#e53935]" />
                                                                {agent.rating}
                                                            </span>
                                                            <span>{agent.totalSales} sales</span>
                                                            <span>{agent.experience}</span>
                                                            <span>{agent.location}</span>
                                                        </div>
                                                        {agent.specialties.length > 0 ? (
                                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                                {agent.specialties.map((specialty) => (
                                                                    <span
                                                                        key={specialty}
                                                                        className="rounded-full bg-[#e53935]/10 px-2 py-0.5 text-[10px] font-medium text-[#e53935]"
                                                                    >
                                                                        {specialty}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                                                            selected
                                                                ? 'bg-[#e53935] text-white'
                                                                : 'bg-[#e53935]/10 text-[#e53935]'
                                                        }`}
                                                    >
                                                        {selected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-black/[0.06] px-6 py-4">
                            <button type="button" onClick={onCloseAgentModal} className={PORTAL_PRIMARY_BTN}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
