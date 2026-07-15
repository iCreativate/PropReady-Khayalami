'use client';

import { useState, useEffect } from 'react';
import {
    Phone, Mail, Search, Filter, User, Calendar, CheckCircle, Clock, XCircle, Plus,
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit, Trash2, X, MoreVertical,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import AgentPageHeader from '@/components/AgentPageHeader';
import {
    AGENT_CARD,
    AGENT_CARD_HEADER,
    AGENT_CARD_BODY,
    AGENT_CARD_TOOLBAR,
    AGENT_SEARCH_INPUT,
    AGENT_SELECT,
    AGENT_SEGMENT_WRAP,
    agentSegmentBtn,
    AGENT_PRIMARY_BTN,
    AGENT_TABLE_HEAD,
    AGENT_TABLE_CELL,
    AGENT_TABLE_ROW,
    AGENT_VIEW_BTN,
    AGENT_BADGE,
    AGENT_EMPTY_ICON,
    AGENT_PANEL_HEADER,
    AGENT_PANEL_BODY,
} from '@/lib/agent-portal-ui';
import type { ListedProperty } from '@/lib/listed-property';
import ViewingChat, { type ChatMessage } from '@/components/ViewingChat';
import { mergeDemoLeadsIntoStorage } from '@/lib/demo-leads';
import { DEMO_AGENT } from '@/lib/demo-agent';
import {
    type ViewingAppointment,
    EMPTY_VIEWING_FORM,
} from '@/lib/agent-viewing';

interface Lead {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: 'new' | 'contacted' | 'qualified' | 'not-interested';
    contactedAt: string | null;
    timestamp?: string;
}

interface Seller extends Lead {
    leadType?: 'seller' | 'investor';
}

interface AgentViewingsWorkspaceProps {
    agent: {
        id: string;
        fullName?: string;
        email?: string;
        company?: string;
        plan?: string;
        sellerPlan?: string;
        verificationStatus?: string;
        status?: string;
    } | null;
    showPageHeader?: boolean;
}

export default function AgentViewingsWorkspace({
    agent: currentAgent,
    showPageHeader = true,
}: AgentViewingsWorkspaceProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [listedProperties, setListedProperties] = useState<ListedProperty[]>([]);
    const [viewingAppointments, setViewingAppointments] = useState<ViewingAppointment[]>([]);
    const [showViewingModal, setShowViewingModal] = useState(false);
    const [selectedPropertyForViewing, setSelectedPropertyForViewing] = useState<ListedProperty | null>(null);
    const [selectedViewing, setSelectedViewing] = useState<ViewingAppointment | null>(null);
    const [viewingViewMode, setViewingViewMode] = useState<'list' | 'calendar'>('list');
    const [viewingSearchTerm, setViewingSearchTerm] = useState('');
    const [viewingStatusFilter, setViewingStatusFilter] = useState<string>('all');
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);
    const [viewingForm, setViewingForm] = useState({ ...EMPTY_VIEWING_FORM });
    const [selectedBuyerLeadKey, setSelectedBuyerLeadKey] = useState('');
    const [selectedSellerLeadKey, setSelectedSellerLeadKey] = useState('');

    useEffect(() => {
        if (currentAgent?.id === DEMO_AGENT.id) {
            mergeDemoLeadsIntoStorage(currentAgent.id);
        }
    }, [currentAgent?.id]);

    useEffect(() => {
        async function loadLeads() {
            if (typeof window === 'undefined') return;
            const storedBuyers: Lead[] = JSON.parse(localStorage.getItem('propReady_leads') || '[]');
            const storedSellers: (Seller & { leadType?: string })[] = JSON.parse(
                localStorage.getItem('propReady_sellers') || '[]'
            );
            const buyersWithType = storedBuyers.map((l) => ({ ...l, leadType: 'buyer' as const }));
            const sellersWithType = storedSellers.map((s) => ({
                ...s,
                leadType: 'seller' as const,
                status: s.status || 'new',
                contactedAt: s.contactedAt ?? null,
            }));
            let apiLeads: (Lead | Seller)[] = [];
            try {
                const res = await fetch(`/api/leads?_=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.leads)) {
                    apiLeads = data.leads;
                }
            } catch (e) {
                console.warn('Failed to load leads from API', e);
            }
            const ids = new Set(apiLeads.map((l) => l.id));
            const localBuyersOnly = buyersWithType.filter((l) => !ids.has(l.id));
            const localSellersOnly = sellersWithType.filter((s) => !ids.has(s.id));
            const merged = [...apiLeads, ...localBuyersOnly, ...localSellersOnly].sort(
                (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            const allBuyers = merged.filter(
                (l) => (l as Seller).leadType !== 'seller' && (l as Seller).leadType !== 'investor'
            ) as Lead[];
            const allSellers = merged.filter(
                (l) => (l as Seller).leadType === 'seller' || (l as Seller).leadType === 'investor'
            ) as Seller[];
            setLeads(allBuyers);
            setSellers(allSellers);
        }
        loadLeads();
    }, [leadsRefreshKey]);

    useEffect(() => {
        async function loadProperties() {
            if (typeof window === 'undefined' || !currentAgent?.id) return;
            const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            let apiProperties: ListedProperty[] = [];
            try {
                const res = await fetch(
                    `/api/properties?agentId=${encodeURIComponent(currentAgent.id)}&published=false`,
                    { cache: 'no-store' }
                );
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.properties)) {
                    apiProperties = data.properties.map((p: Record<string, unknown>) => ({
                        ...p,
                        published: (p.published ?? true) as boolean,
                    })) as ListedProperty[];
                }
            } catch (e) {
                console.warn('Failed to load properties from API', e);
            }
            const ids = new Set(apiProperties.map((p: ListedProperty) => p.id));
            const localOnly = storedProperties
                .filter((p: ListedProperty) => p.agentId === currentAgent.id && !ids.has(p.id))
                .map((p: ListedProperty) => ({ ...p, published: p.published ?? true }));
            const merged = [...apiProperties, ...localOnly];
            setListedProperties(
                merged.sort(
                    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                )
            );
        }
        loadProperties();
    }, [currentAgent]);

    useEffect(() => {
        async function loadViewings() {
            if (typeof window === 'undefined' || !currentAgent?.id) return;
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            let apiViewings: ViewingAppointment[] = [];
            try {
                const res = await fetch(`/api/viewings?agentId=${encodeURIComponent(currentAgent.id)}`, {
                    cache: 'no-store',
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.viewings)) {
                    apiViewings = data.viewings;
                }
            } catch (e) {
                console.warn('Failed to load viewings from API', e);
            }
            const ids = new Set(apiViewings.map((v: ViewingAppointment) => v.id));
            const localOnly = storedViewings.filter((v: ViewingAppointment) => !ids.has(v.id));
            const merged = [...apiViewings, ...localOnly].map((v: ViewingAppointment) => {
                const price = v.propertyPrice ?? listedProperties.find((p) => p.id === v.propertyId)?.price;
                const chat = (v.chatMessages ??
                    (typeof window !== 'undefined'
                        ? JSON.parse(localStorage.getItem(`propReady_viewingChat_${v.id}`) || '[]')
                        : [])) as ChatMessage[];
                return { ...v, propertyPrice: price ?? v.propertyPrice ?? 0, chatMessages: chat };
            });
            const agentViewings =
                listedProperties.length > 0
                    ? merged.filter((v: ViewingAppointment) =>
                          listedProperties.some((p) => p.id === v.propertyId)
                      )
                    : merged;
            setViewingAppointments(
                agentViewings.sort(
                    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                )
            );
        }
        loadViewings();
    }, [currentAgent, listedProperties, leadsRefreshKey]);

    useEffect(() => {
        if (selectedViewing && showViewingModal) {
            setViewingForm({
                propertyId: selectedViewing.propertyId,
                contactName: selectedViewing.contactName,
                contactEmail: selectedViewing.contactEmail,
                contactPhone: selectedViewing.contactPhone,
                contactType: selectedViewing.contactType,
                buyerLeadId: selectedViewing.buyerLeadId || '',
                sellerLeadId: selectedViewing.sellerLeadId || '',
                buyerName: selectedViewing.buyerName || selectedViewing.contactName,
                buyerEmail:
                    selectedViewing.buyerEmail ||
                    (selectedViewing.contactType === 'buyer' ? selectedViewing.contactEmail : ''),
                buyerPhone: selectedViewing.buyerPhone || selectedViewing.contactPhone,
                sellerName: selectedViewing.sellerName || '',
                sellerEmail:
                    selectedViewing.sellerEmail ||
                    (selectedViewing.contactType === 'seller' ? selectedViewing.contactEmail : ''),
                sellerPhone: selectedViewing.sellerPhone || '',
                date: selectedViewing.date,
                time: selectedViewing.time,
                notes: selectedViewing.notes,
            });
            setSelectedBuyerLeadKey(selectedViewing.buyerLeadId ? `buyer-${selectedViewing.buyerLeadId}` : '');
            setSelectedSellerLeadKey(selectedViewing.sellerLeadId ? `seller-${selectedViewing.sellerLeadId}` : '');
        }
    }, [selectedViewing, showViewingModal]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const buyerLeadId = sessionStorage.getItem('propReady_scheduleBuyerLeadId');
        if (buyerLeadId && leads.length > 0) {
            const lead = leads.find((l) => l.id === buyerLeadId);
            if (lead) {
                sessionStorage.removeItem('propReady_scheduleBuyerLeadId');
                setSelectedBuyerLeadKey(`buyer-${lead.id}`);
                setViewingForm((prev) => ({
                    ...prev,
                    buyerLeadId: lead.id,
                    buyerName: lead.fullName || '',
                    buyerEmail: lead.email || '',
                    buyerPhone: lead.phone || '',
                }));
                setShowViewingModal(true);
            }
        }

        if (listedProperties.length === 0) return;
        const propertyId = sessionStorage.getItem('propReady_schedulePropertyId');
        if (!propertyId) return;
        const property = listedProperties.find((p) => p.id === propertyId);
        if (!property) return;
        sessionStorage.removeItem('propReady_schedulePropertyId');
        setSelectedPropertyForViewing(property);
        setViewingForm((prev) => ({ ...prev, propertyId: property.id }));
        setShowViewingModal(true);
    }, [listedProperties, leads]);

    const allAvailableProperties = listedProperties;

    const filteredViewings = viewingAppointments.filter((viewing) => {
        const matchesSearch =
            !viewingSearchTerm ||
            viewing.propertyTitle.toLowerCase().includes(viewingSearchTerm.toLowerCase()) ||
            viewing.propertyAddress.toLowerCase().includes(viewingSearchTerm.toLowerCase()) ||
            viewing.contactName.toLowerCase().includes(viewingSearchTerm.toLowerCase());
        const matchesStatus = viewingStatusFilter === 'all' || viewing.status === viewingStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const getCalendarDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: (number | null)[] = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push(null);
        }
        return days;
    };

    const getViewingStatusBadge = (status: string) => {
        const badges = {
            scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock, label: 'Scheduled' },
            confirmed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Confirmed' },
            completed: { bg: 'bg-gold/20', text: 'text-gold', icon: CheckCircle, label: 'Completed' },
            cancelled: {
                bg: 'bg-gradient-to-r from-red-500/20 to-red-500/10',
                text: 'text-red-600',
                icon: XCircle,
                label: 'Cancelled',
            },
        };
        const badge = badges[status as keyof typeof badges] || badges.scheduled;
        const Icon = badge.icon;
        return (
            <span
                className={`${AGENT_BADGE} ${badge.bg} ${badge.text}`}
            >
                <Icon className="w-3 h-3 shrink-0" />
                {badge.label}
            </span>
        );
    };

    const resetViewingForm = () => {
        setViewingForm({ ...EMPTY_VIEWING_FORM });
        setSelectedBuyerLeadKey('');
        setSelectedSellerLeadKey('');
    };

    const closeScheduleModal = () => {
        setShowViewingModal(false);
        setSelectedPropertyForViewing(null);
        setSelectedViewing(null);
        resetViewingForm();
    };

    const updateContactStatus = async (
        contactId: string,
        status: 'new' | 'contacted' | 'qualified' | 'not-interested'
    ) => {
        const isBuyerLead = leads.some((l) => l.id === contactId);
        const newContactedAt = status === 'contacted' ? new Date().toISOString() : null;

        if (isBuyerLead) {
            try {
                const res = await fetch(`/api/leads/${contactId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.lead) {
                        const updatedLead = { ...json.lead, contactedAt: json.lead.contactedAt ?? newContactedAt };
                        setLeads((prev) => {
                            const updated = prev.map((l) => (l.id === contactId ? { ...l, ...updatedLead } : l));
                            if (typeof window !== 'undefined') localStorage.setItem('propReady_leads', JSON.stringify(updated));
                            return updated;
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to update lead status in API', e);
            }
            const updatedLeads = leads.map((lead) =>
                lead.id === contactId
                    ? { ...lead, status, contactedAt: status === 'contacted' ? new Date().toISOString() : lead.contactedAt }
                    : lead
            );
            setLeads(updatedLeads);
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_leads', JSON.stringify(updatedLeads));
            }
        } else {
            try {
                const res = await fetch(`/api/leads/${contactId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.lead) {
                        const updatedSeller = { ...json.lead, contactedAt: json.lead.contactedAt ?? newContactedAt };
                        setSellers((prev) => {
                            const updated = prev.map((s) => (s.id === contactId ? { ...s, ...updatedSeller } : s));
                            if (typeof window !== 'undefined') localStorage.setItem('propReady_sellers', JSON.stringify(updated));
                            return updated;
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to update seller status in API', e);
            }
            const updatedSellers = sellers.map((seller) =>
                seller.id === contactId
                    ? {
                          ...seller,
                          status,
                          contactedAt: status === 'contacted' ? new Date().toISOString() : seller.contactedAt,
                      }
                    : seller
            );
            setSellers(updatedSellers);
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_sellers', JSON.stringify(updatedSellers));
            }
        }
    };

    const updateViewingStatus = (viewingId: string, status: ViewingAppointment['status']) => {
        const updatedViewings = viewingAppointments.map((viewing) =>
            viewing.id === viewingId ? { ...viewing, status } : viewing
        );
        setViewingAppointments(updatedViewings);
        if (typeof window !== 'undefined') {
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const updatedStored = storedViewings.map((v: ViewingAppointment) =>
                v.id === viewingId ? { ...v, status } : v
            );
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(updatedStored));
        }
        fetch('/api/viewings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: viewingId, status }),
        }).catch((e) => console.warn('Viewing status sync failed', e));
    };

    const deleteViewing = (viewingId: string) => {
        const updatedViewings = viewingAppointments.filter((v) => v.id !== viewingId);
        setViewingAppointments(updatedViewings);
        if (typeof window !== 'undefined') {
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const filtered = storedViewings.filter((v: ViewingAppointment) => v.id !== viewingId);
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(filtered));
        }
        setSelectedViewing(null);
        fetch(`/api/viewings?id=${encodeURIComponent(viewingId)}`, { method: 'DELETE' }).catch((e) =>
            console.warn('Viewing delete sync failed', e)
        );
    };

    const handleScheduleViewing = async () => {
        const property =
            selectedPropertyForViewing || allAvailableProperties.find((p) => p.id === viewingForm.propertyId);
        if (!property && !viewingForm.propertyId) {
            alert('Please select a property');
            return;
        }
        if (!viewingForm.buyerEmail?.trim() || !viewingForm.sellerEmail?.trim()) {
            alert('Please select both a buyer and a seller for this appointment.');
            return;
        }
        if (!viewingForm.date || !viewingForm.time) {
            alert('Please set the viewing date and time.');
            return;
        }

        const newViewing: ViewingAppointment = {
            id: selectedViewing?.id || `viewing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            propertyId: property?.id || viewingForm.propertyId,
            propertyTitle: property?.title || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address',
            propertyPrice: property?.price ?? selectedViewing?.propertyPrice ?? 0,
            contactName: viewingForm.buyerName,
            contactEmail: viewingForm.buyerEmail,
            contactPhone: viewingForm.buyerPhone,
            contactType: 'buyer',
            buyerLeadId: viewingForm.buyerLeadId || null,
            sellerLeadId: viewingForm.sellerLeadId || null,
            buyerName: viewingForm.buyerName,
            buyerEmail: viewingForm.buyerEmail,
            buyerPhone: viewingForm.buyerPhone,
            sellerName: viewingForm.sellerName,
            sellerEmail: viewingForm.sellerEmail,
            sellerPhone: viewingForm.sellerPhone,
            buyerConfirmedAt: selectedViewing?.buyerConfirmedAt ?? null,
            sellerConfirmedAt: selectedViewing?.sellerConfirmedAt ?? null,
            date: viewingForm.date,
            time: viewingForm.time,
            notes: viewingForm.notes,
            status: selectedViewing?.status || 'scheduled',
            timestamp: selectedViewing?.timestamp || new Date().toISOString(),
        };

        const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');

        if (selectedViewing) {
            const updated = storedViewings.map((v: ViewingAppointment) =>
                v.id === selectedViewing.id ? newViewing : v
            );
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(updated));
            setViewingAppointments(viewingAppointments.map((v) => (v.id === selectedViewing.id ? newViewing : v)));
        } else {
            storedViewings.push(newViewing);
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(storedViewings));
            setViewingAppointments([...viewingAppointments, newViewing]);
        }

        try {
            const res = await fetch('/api/viewings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newViewing, agentId: currentAgent?.id }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.warn('Viewing save to database failed:', res.status, err);
            }
        } catch (e) {
            console.warn('Viewing API sync failed', e);
        }

        if (viewingForm.buyerLeadId) {
            await updateContactStatus(viewingForm.buyerLeadId, 'contacted');
        }
        if (viewingForm.sellerLeadId) {
            await updateContactStatus(viewingForm.sellerLeadId, 'contacted');
        }

        alert(
            'Viewing scheduled. The buyer and seller must each confirm the appointment in their dashboard before this lead counts as verified. This lead now appears under My Leads.'
        );

        resetViewingForm();
        setSelectedPropertyForViewing(null);
        setSelectedViewing(null);
        setShowViewingModal(false);
        setLeadsRefreshKey((k) => k + 1);
    };

    const openNewViewingModal = () => {
        setShowViewingModal(true);
        setSelectedPropertyForViewing(null);
        resetViewingForm();
    };

    return (
        <>
            {showPageHeader && (
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Appointments"
                    title="Viewing Appointments"
                    description="Schedule and manage property viewings with buyers and sellers"
                />
            )}

            <div id="viewings-section" className={AGENT_CARD}>
                <div className={`${AGENT_CARD_HEADER} flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-8`}>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-charcoal tracking-tight">Your viewings</h2>
                        <p className="text-charcoal/45 text-sm mt-2 leading-relaxed">
                            {filteredViewings.length} appointment{filteredViewings.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                        <div className={`${AGENT_SEGMENT_WRAP} self-start sm:self-auto`}>
                            <button
                                onClick={() => setViewingViewMode('list')}
                                className={agentSegmentBtn(viewingViewMode === 'list')}
                            >
                                List View
                            </button>
                            <button
                                onClick={() => setViewingViewMode('calendar')}
                                className={agentSegmentBtn(viewingViewMode === 'calendar')}
                            >
                                Calendar View
                            </button>
                        </div>
                        <button
                            onClick={openNewViewingModal}
                            className={`${AGENT_PRIMARY_BTN} self-start sm:self-auto`}
                        >
                            <Plus className="w-4 h-4" />
                            Schedule Viewing
                        </button>
                    </div>
                </div>

                <div className={AGENT_CARD_TOOLBAR}>
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
                        <div className="flex-1 relative min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by property, contact name, or address..."
                                value={viewingSearchTerm}
                                onChange={(e) => setViewingSearchTerm(e.target.value)}
                                className={AGENT_SEARCH_INPUT}
                            />
                        </div>
                        <div className="flex items-center gap-2 lg:shrink-0">
                            <Filter className="w-4 h-4 text-charcoal/35 shrink-0 hidden sm:block" />
                            <select
                                value={viewingStatusFilter}
                                onChange={(e) => setViewingStatusFilter(e.target.value)}
                                className={AGENT_SELECT}
                            >
                                <option value="all">All Status</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={AGENT_CARD_BODY}>
                {viewingViewMode === 'calendar' && (
                    <div className={`${AGENT_CARD} overflow-hidden`}>
                        <div className={AGENT_PANEL_HEADER}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold/[0.08] rounded-2xl flex items-center justify-center border border-gold/10">
                                        <CalendarIcon className="w-5 h-5 text-gold" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight">
                                        {currentCalendarDate.toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentCalendarDate);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCurrentCalendarDate(newDate);
                                        }}
                                        className="p-2 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentCalendarDate);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCurrentCalendarDate(newDate);
                                        }}
                                        className="p-2 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={AGENT_PANEL_BODY}>
                            <div className="grid grid-cols-7 gap-2 mb-3">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="text-center text-charcoal/70 font-semibold text-sm py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {getCalendarDays(currentCalendarDate).map((day, index) => {
                                    const dayViewings =
                                        day !== null
                                            ? filteredViewings.filter((v) => {
                                                  if (!v.date) return false;
                                                  const viewingDate = new Date(v.date);
                                                  if (isNaN(viewingDate.getTime())) return false;
                                                  return (
                                                      viewingDate.getDate() === day &&
                                                      viewingDate.getMonth() === currentCalendarDate.getMonth() &&
                                                      viewingDate.getFullYear() === currentCalendarDate.getFullYear()
                                                  );
                                              })
                                            : [];
                                    const isToday =
                                        day !== null &&
                                        day === new Date().getDate() &&
                                        currentCalendarDate.getMonth() === new Date().getMonth() &&
                                        currentCalendarDate.getFullYear() === new Date().getFullYear();
                                    const isCurrentMonth = day !== null;

                                    return (
                                        <div
                                            key={index}
                                            className={`min-h-[80px] p-2 rounded-xl border transition-all ${
                                                isToday
                                                    ? 'bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30 shadow-md'
                                                    : isCurrentMonth
                                                      ? 'bg-white border-charcoal/10 hover:border-charcoal/20'
                                                      : 'bg-charcoal/5 border-charcoal/5'
                                            }`}
                                        >
                                            {day && (
                                                <>
                                                    <div
                                                        className={`text-sm font-semibold mb-1 ${isToday ? 'text-gold font-bold' : 'text-charcoal/70'}`}
                                                    >
                                                        {day}
                                                    </div>
                                                    {dayViewings.slice(0, 2).map((viewing) => (
                                                        <div
                                                            key={viewing.id}
                                                            onClick={() => setSelectedViewing(viewing)}
                                                            className={`text-xs p-1.5 rounded-lg mb-1 cursor-pointer hover:opacity-80 transition shadow-sm ${
                                                                viewing.status === 'completed'
                                                                    ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                                                    : viewing.status === 'confirmed'
                                                                      ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                                                                      : viewing.status === 'cancelled'
                                                                        ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 border border-red-500/30'
                                                                        : 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold border border-gold/30'
                                                            }`}
                                                        >
                                                            {viewing.time} - {viewing.contactName}
                                                        </div>
                                                    ))}
                                                    {dayViewings.length > 2 && (
                                                        <div className="text-xs text-charcoal/50 font-medium">
                                                            +{dayViewings.length - 2} more
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {viewingViewMode === 'list' &&
                    (filteredViewings.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className={AGENT_EMPTY_ICON}>
                                <Calendar className="w-8 h-8 text-charcoal/25" />
                            </div>
                            <p className="text-charcoal font-medium text-lg">No viewings found</p>
                            <p className="text-charcoal/50 text-sm mt-2">
                                {viewingSearchTerm || viewingStatusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Schedule your first viewing appointment'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full min-w-[900px] border-collapse">
                                <thead>
                                    <tr className="border-b border-charcoal/[0.06]">
                                        <th className={AGENT_TABLE_HEAD}>Property</th>
                                        <th className={AGENT_TABLE_HEAD}>Price</th>
                                        <th className={AGENT_TABLE_HEAD}>Contact</th>
                                        <th className={AGENT_TABLE_HEAD}>Date & Time</th>
                                        <th className={AGENT_TABLE_HEAD}>Type</th>
                                        <th className={AGENT_TABLE_HEAD}>Status</th>
                                        <th className={`${AGENT_TABLE_HEAD} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/[0.05]">
                                    {filteredViewings.map((viewing) => (
                                        <tr key={viewing.id} className={AGENT_TABLE_ROW}>
                                            <td className={AGENT_TABLE_CELL}>
                                                <div>
                                                    <p className="text-charcoal font-medium text-sm">{viewing.propertyTitle}</p>
                                                    <p className="text-charcoal/45 text-xs mt-1 line-clamp-1">{viewing.propertyAddress}</p>
                                                </div>
                                            </td>
                                            <td className={`${AGENT_TABLE_CELL} whitespace-nowrap`}>
                                                <p className="text-gold font-semibold text-sm tabular-nums">
                                                    {(viewing.propertyPrice ?? 0) > 0
                                                        ? formatCurrency(viewing.propertyPrice!)
                                                        : '—'}
                                                </p>
                                            </td>
                                            <td className={AGENT_TABLE_CELL}>
                                                <div className="space-y-1 min-w-[120px]">
                                                    <p className="text-charcoal font-medium text-sm">{viewing.contactName}</p>
                                                    <p className="text-charcoal/45 text-xs tabular-nums">{viewing.contactPhone}</p>
                                                </div>
                                            </td>
                                            <td className={`${AGENT_TABLE_CELL} whitespace-nowrap`}>
                                                <div className="space-y-0.5">
                                                    <p className="text-charcoal text-sm tabular-nums">
                                                        {new Date(viewing.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-charcoal/45 text-xs">{viewing.time}</p>
                                                </div>
                                            </td>
                                            <td className={AGENT_TABLE_CELL}>
                                                <span
                                                    className={`${AGENT_BADGE} ${
                                                        viewing.contactType === 'buyer'
                                                            ? 'bg-blue-500/10 text-blue-700'
                                                            : 'bg-purple-500/10 text-purple-700'
                                                    }`}
                                                >
                                                    {viewing.contactType === 'buyer' ? 'Buyer' : 'Seller'}
                                                </span>
                                            </td>
                                            <td className={AGENT_TABLE_CELL}>{getViewingStatusBadge(viewing.status)}</td>
                                            <td className={`${AGENT_TABLE_CELL} text-right`}>
                                                <button
                                                    onClick={() => setSelectedViewing(viewing)}
                                                    className={AGENT_VIEW_BTN}
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                    <span>Manage</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>

            {showViewingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
                        <div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse"
                            style={{ animationDelay: '1s' }}
                        />
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        <div className={AGENT_PANEL_HEADER}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight leading-tight">
                                        {selectedViewing ? 'Edit Viewing' : 'Schedule Viewing'}
                                    </h2>
                                    {selectedPropertyForViewing && (
                                        <p className="text-charcoal/45 text-sm mt-1">{selectedPropertyForViewing.title}</p>
                                    )}
                                </div>
                                <button
                                    onClick={closeScheduleModal}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200 flex items-center justify-center"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto ${AGENT_PANEL_BODY}`}>
                            <div className="space-y-4">
                                {!selectedPropertyForViewing && (
                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">
                                            Property <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            value={viewingForm.propertyId}
                                            onChange={(e) => {
                                                setViewingForm({ ...viewingForm, propertyId: e.target.value });
                                            }}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                            disabled={allAvailableProperties.length === 0}
                                        >
                                            {allAvailableProperties.length === 0 ? (
                                                <option value="">No listed properties yet (list a property first)</option>
                                            ) : (
                                                <>
                                                    <option value="">Select a property</option>
                                                    {allAvailableProperties.map((property) => (
                                                        <option key={property.id} value={property.id}>
                                                            {property.title} - {property.address} (
                                                            {formatCurrency(property.price)})
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}
                                <p className="text-sm text-charcoal/70 bg-gold/10 border border-gold/30 rounded-lg p-3">
                                    Select <strong>both</strong> buyer and seller. Each must confirm the appointment in
                                    their dashboard before the lead is verified.
                                </p>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">
                                        Buyer <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={selectedBuyerLeadKey}
                                        onChange={(e) => {
                                            const key = e.target.value;
                                            setSelectedBuyerLeadKey(key);
                                            if (!key) {
                                                setViewingForm((prev) => ({
                                                    ...prev,
                                                    buyerLeadId: '',
                                                    buyerName: '',
                                                    buyerEmail: '',
                                                    buyerPhone: '',
                                                }));
                                                return;
                                            }
                                            const id = key.replace('buyer-', '');
                                            const lead = leads.find((l) => l.id === id);
                                            if (lead) {
                                                setViewingForm((prev) => ({
                                                    ...prev,
                                                    buyerLeadId: lead.id,
                                                    buyerName: lead.fullName || '',
                                                    buyerEmail: lead.email || '',
                                                    buyerPhone: lead.phone || '',
                                                }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                                    >
                                        <option value="">{leads.length === 0 ? 'No buyers yet' : 'Select buyer'}</option>
                                        {leads.map((lead) => (
                                            <option key={lead.id} value={`buyer-${lead.id}`}>
                                                {lead.fullName} ({lead.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">
                                        Seller <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={selectedSellerLeadKey}
                                        onChange={(e) => {
                                            const key = e.target.value;
                                            setSelectedSellerLeadKey(key);
                                            if (!key) {
                                                setViewingForm((prev) => ({
                                                    ...prev,
                                                    sellerLeadId: '',
                                                    sellerName: '',
                                                    sellerEmail: '',
                                                    sellerPhone: '',
                                                }));
                                                return;
                                            }
                                            const id = key.replace('seller-', '');
                                            const seller = sellers.find((s) => s.id === id);
                                            if (seller) {
                                                setViewingForm((prev) => ({
                                                    ...prev,
                                                    sellerLeadId: seller.id,
                                                    sellerName: seller.fullName || '',
                                                    sellerEmail: seller.email || '',
                                                    sellerPhone: seller.phone || '',
                                                }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                                    >
                                        <option value="">
                                            {sellers.length === 0 ? 'No sellers yet' : 'Select seller'}
                                        </option>
                                        {sellers.map((seller) => (
                                            <option key={seller.id} value={`seller-${seller.id}`}>
                                                {seller.fullName} ({seller.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={viewingForm.date}
                                            onChange={(e) => setViewingForm({ ...viewingForm, date: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">Time</label>
                                        <input
                                            type="time"
                                            value={viewingForm.time}
                                            onChange={(e) => setViewingForm({ ...viewingForm, time: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={viewingForm.notes}
                                        onChange={(e) => setViewingForm({ ...viewingForm, notes: e.target.value })}
                                        placeholder="Any additional notes..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={closeScheduleModal}
                                className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-xl hover:bg-charcoal/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleScheduleViewing}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                {selectedViewing ? 'Update Viewing' : 'Schedule Viewing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedViewing && !showViewingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
                        <div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse"
                            style={{ animationDelay: '1s' }}
                        />
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        <div className={AGENT_PANEL_HEADER}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-gold/[0.08] rounded-2xl flex items-center justify-center border border-gold/10">
                                            <Calendar className="w-5 h-5 text-gold" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight leading-tight">
                                                {selectedViewing.propertyTitle}
                                            </h2>
                                            <p className="text-charcoal/45 text-sm mt-0.5">{selectedViewing.propertyAddress}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedViewing(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200 flex items-center justify-center"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto ${AGENT_PANEL_BODY}`}>
                            <div className="mb-6">
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                    <p className="text-charcoal/70 text-sm mb-2 font-semibold">Contact Information</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-charcoal/50" />
                                            <p className="text-charcoal text-sm">{selectedViewing.contactName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-charcoal/50" />
                                            <p className="text-charcoal text-sm break-all">{selectedViewing.contactEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-charcoal/50" />
                                            <p className="text-charcoal text-sm">{selectedViewing.contactPhone}</p>
                                        </div>
                                    </div>
                                </div>

                                {(selectedViewing.propertyPrice ?? 0) > 0 && (
                                    <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                        <p className="text-gold font-bold text-xl">
                                            {formatCurrency(selectedViewing.propertyPrice!)}
                                        </p>
                                    </div>
                                )}

                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                    <p className="text-charcoal/70 text-sm mb-2 font-semibold">Appointment Details</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-charcoal/60">Date:</span>
                                            <span className="text-charcoal font-semibold">
                                                {new Date(selectedViewing.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-charcoal/60">Time:</span>
                                            <span className="text-charcoal font-semibold">{selectedViewing.time}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-charcoal/60">Type:</span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    selectedViewing.contactType === 'buyer'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-purple-500/20 text-purple-400'
                                                }`}
                                            >
                                                {selectedViewing.contactType === 'buyer' ? 'Buyer' : 'Seller'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-charcoal/60">Status:</span>
                                            <div className="mt-1">{getViewingStatusBadge(selectedViewing.status)}</div>
                                        </div>
                                        {selectedViewing.notes && (
                                            <div className="mt-2 pt-2 border-t border-charcoal/10">
                                                <p className="text-charcoal/60 mb-1">Notes:</p>
                                                <p className="text-charcoal text-sm">{selectedViewing.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <ViewingChat
                                viewingId={selectedViewing.id}
                                messages={selectedViewing.chatMessages ?? []}
                                currentUserRole="agent"
                                onMessagesChange={(msgs) => {
                                    setSelectedViewing({ ...selectedViewing, chatMessages: msgs });
                                    setViewingAppointments((prev) =>
                                        prev.map((v) => (v.id === selectedViewing.id ? { ...v, chatMessages: msgs } : v))
                                    );
                                }}
                                className="mt-4"
                            />

                            <div className="space-y-3 mt-6">
                                <div className="border-t border-charcoal/20 pt-4">
                                    <h4 className="text-charcoal font-semibold mb-3">Update Status</h4>
                                    <select
                                        value={selectedViewing.status}
                                        onChange={(e) => {
                                            updateViewingStatus(
                                                selectedViewing.id,
                                                e.target.value as ViewingAppointment['status']
                                            );
                                            setSelectedViewing({
                                                ...selectedViewing,
                                                status: e.target.value as ViewingAppointment['status'],
                                            });
                                        }}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setViewingForm({
                                                propertyId: selectedViewing.propertyId,
                                                contactName: selectedViewing.contactName,
                                                contactEmail: selectedViewing.contactEmail,
                                                contactPhone: selectedViewing.contactPhone,
                                                contactType: selectedViewing.contactType,
                                                buyerLeadId: selectedViewing.buyerLeadId || '',
                                                sellerLeadId: selectedViewing.sellerLeadId || '',
                                                buyerName: selectedViewing.buyerName || selectedViewing.contactName,
                                                buyerEmail: selectedViewing.buyerEmail || '',
                                                buyerPhone: selectedViewing.buyerPhone || '',
                                                sellerName: selectedViewing.sellerName || '',
                                                sellerEmail: selectedViewing.sellerEmail || '',
                                                sellerPhone: selectedViewing.sellerPhone || '',
                                                date: selectedViewing.date,
                                                time: selectedViewing.time,
                                                notes: selectedViewing.notes,
                                            });
                                            setSelectedBuyerLeadKey(
                                                selectedViewing.buyerLeadId ? `buyer-${selectedViewing.buyerLeadId}` : ''
                                            );
                                            setSelectedSellerLeadKey(
                                                selectedViewing.sellerLeadId ? `seller-${selectedViewing.sellerLeadId}` : ''
                                            );
                                            setShowViewingModal(true);
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this viewing?')) {
                                                deleteViewing(selectedViewing.id);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 rounded-xl hover:from-red-500/30 hover:to-red-500/20 transition border border-red-500/30"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setSelectedViewing(null)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
