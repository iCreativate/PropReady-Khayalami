'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, Phone, Mail, MessageCircle, Search, Filter, User, TrendingUp, Calendar, CheckCircle, Clock, XCircle, MoreVertical, X, Building2, MapPin, BookOpen, RefreshCw } from 'lucide-react';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import { getBuyerLeadLimit, getPlanDisplay, normalizeBuyerPlan } from '@/lib/agent-plans';
import AgentPortalLayout from '@/components/AgentPortalLayout';
import type { ListedProperty } from '@/lib/listed-property';
import type { ViewingAppointment } from '@/lib/agent-viewing';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentAiSuggestions from '@/components/AgentAiSuggestions';
import PpraVerificationGate from '@/components/PpraVerificationGate';
import { isAgentPpraVerified } from '@/lib/ppra';
import { mergeDemoLeadsIntoStorage } from '@/lib/demo-leads';
import { DEMO_AGENT } from '@/lib/demo-agent';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import {
    getLeadVerificationStatus,
    verificationStatusLabel,
    verificationStatusClasses,
    countVerifiedLeads,
    type LeadVerificationStatus,
} from '@/lib/lead-verification';
import AgentLeadDetailModal from '@/components/AgentLeadDetailModal';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import {
    AGENT_PAGE_CONTAINER,
    AGENT_STAT_CARD,
    AGENT_STAT_ICON,
    AGENT_BADGE,
    AGENT_TABLE_HEAD,
    AGENT_TABLE_CELL,
    AGENT_VIEW_BTN,
    AGENT_CARD,
    AGENT_CARD_HEADER,
    AGENT_CARD_TOOLBAR,
    AGENT_CARD_BODY,
    AGENT_CARD_FOOTER,
    AGENT_SEARCH_INPUT,
    AGENT_SELECT,
    AGENT_SEGMENT_WRAP,
    agentSegmentBtn,
    AGENT_REFRESH_BTN,
    AGENT_PRIMARY_BTN,
    AGENT_SECONDARY_BTN,
    AGENT_MODAL_BACKDROP,
    AGENT_MODAL_PANEL_LG,
    AGENT_ICON_BTN,
    AGENT_PANEL_HEADER,
    AGENT_PANEL_BODY,
    AGENT_DASH_STACK,
    AGENT_DASH_STAT_LABEL,
    AGENT_DASH_STAT_VALUE,
    AGENT_DASH_EMPTY,
    AGENT_DASH_EMPTY_ICON,
    AGENT_DASH_EMPTY_TITLE,
    AGENT_DASH_EMPTY_DESC,
    AGENT_DASH_SECTION_TITLE,
    AGENT_DASH_SECTION_SUB,
} from '@/lib/agent-portal-ui';

interface Lead {
    id: string;
    leadType?: 'buyer' | 'seller' | 'investor';
    fullName: string;
    email: string;
    phone: string;
    city?: string | null;
    monthlyIncome?: string;
    depositSaved?: string;
    employmentStatus?: string;
    creditScore?: string;
    score?: number;
    preQualAmount?: number;
    bondOriginator?: string | null;
    prequalifiedWithOriginator?: boolean;
    status: 'new' | 'contacted' | 'qualified' | 'not-interested';
    appointmentVerified?: boolean;
    timestamp: string;
    contactedAt: string | null;
}

interface Seller extends Lead {
    leadType: 'seller' | 'investor';
    propertyAddress?: string;
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    propertySize?: string;
    landSize?: string;
    buildingSize?: string;
    currentValue?: string;
    reasonForSelling?: string;
    timeline?: string;
    hasBond?: boolean | null;
    bondBalance?: string;
}

export default function AgentsDashboardPage() {
    const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<'all' | 'nearby'>('all');
    const [currentAgent, setCurrentAgent] = useState<{
        fullName: string;
        email: string;
        company?: string;
        id?: string;
        plan?: string;
        sellerPlan?: string;
        city?: string;
        ppraNumber?: string;
        ffcNumber?: string;
        ffcDocumentUrl?: string;
        verificationStatus?: string;
        status?: string;
    } | null>(null);
    const [showActionsModal, setShowActionsModal] = useState<Lead | Seller | null>(null);
    const [showSuccessfulLeadsModal, setShowSuccessfulLeadsModal] = useState(false);
    const [listedProperties, setListedProperties] = useState<ListedProperty[]>([]);
    const [viewingAppointments, setViewingAppointments] = useState<ViewingAppointment[]>([]);
    const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);

    useEffect(() => {
        // Load current agent info
        void (async () => {
            if (typeof window === 'undefined') return;
            let agent: Record<string, unknown> | null = null;
            const agentData = localStorage.getItem('propReady_currentAgent');
            if (agentData) {
                agent = JSON.parse(agentData);
            } else {
                const bridged = await hydrateSessionFromCookies();
                if (bridged?.accountType === 'agent') {
                    agent = {
                        id: bridged.id,
                        fullName: bridged.fullName,
                        email: bridged.email,
                        company: bridged.company,
                        plan: bridged.plan,
                        sellerPlan: bridged.sellerPlan,
                        planStatus: bridged.planStatus,
                        trialStartedAt: bridged.trialStartedAt,
                        trialEndsAt: bridged.trialEndsAt,
                        planActivatedAt: bridged.planActivatedAt,
                    };
                }
            }

            if (agent) {
                setCurrentAgent(agent as typeof currentAgent);
                if (agent.id === DEMO_AGENT.id) {
                    mergeDemoLeadsIntoStorage(String(agent.id));
                }
            }
        })();
    }, []);

    useEffect(() => {
        // Apply buyer and seller plan limits separately
        async function loadLeads() {
            if (typeof window === 'undefined') return;
            const agentData = localStorage.getItem('propReady_currentAgent');
            const parsed = agentData ? JSON.parse(agentData) : {};
            const storedBuyers: Lead[] = JSON.parse(localStorage.getItem('propReady_leads') || '[]');
            const storedSellers: (Seller & { leadType?: string })[] = JSON.parse(localStorage.getItem('propReady_sellers') || '[]');
            const buyersWithType = storedBuyers.map(l => ({ ...l, leadType: 'buyer' as const }));
            const sellersWithType = storedSellers.map(s => ({ ...s, leadType: 'seller' as const, status: s.status || 'new', contactedAt: s.contactedAt ?? null }));
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
            const ids = new Set(apiLeads.map(l => l.id));
            const localBuyersOnly = buyersWithType.filter(l => !ids.has(l.id));
            const localSellersOnly = sellersWithType.filter(s => !ids.has(s.id));
            const localById = new Map([...buyersWithType, ...sellersWithType].map(l => [l.id, l]));
            const merged = [...apiLeads, ...localBuyersOnly, ...localSellersOnly].map((lead) => {
                const local = localById.get(lead.id);
                if (local && (lead.score == null || lead.score === 0) && (local.score != null && local.score > 0)) {
                    const enriched = { ...lead, score: local.score, preQualAmount: lead.preQualAmount ?? local.preQualAmount };
                    fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id, score: local.score, preQualAmount: enriched.preQualAmount }) }).catch(() => {});
                    return enriched;
                }
                return lead;
            }).sort((a, b) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            const allBuyers = merged.filter(l => (l as Lead).leadType !== 'seller' && (l as Lead).leadType !== 'investor') as Lead[];
            const allSellers = merged.filter(l => (l as Lead).leadType === 'seller' || (l as Lead).leadType === 'investor') as Seller[];
            setLeads(allBuyers);
            setFilteredLeads(allBuyers);
            setSellers(allSellers);
            setFilteredSellers(allSellers);
        }
        loadLeads();
    }, [leadsRefreshKey]);

    useEffect(() => {
        // Load listed properties from API and localStorage
        async function loadProperties() {
            if (typeof window === 'undefined' || !currentAgent?.id) return;
            const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            let apiProperties: ListedProperty[] = [];
            try {
                const res = await fetch(`/api/properties?agentId=${encodeURIComponent(currentAgent.id)}&published=false`, { cache: 'no-store' });
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
            // Sync local-only properties to database so they appear on all browsers
            for (const p of localOnly) {
                try {
                    const res = await fetch('/api/properties', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(p),
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        const msg = res.status === 503
                            ? 'Database not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Netlify, then redeploy.'
                            : err?.code === '42P01' || (err?.error && String(err.error).includes('listed_properties'))
                                ? 'Run supabase-migration-properties.sql in Supabase SQL Editor to create the listed_properties table.'
                                : err?.error || `Sync failed (${res.status})`;
                        if (!sessionStorage.getItem('propReady_propertySyncAlertShown')) {
                            sessionStorage.setItem('propReady_propertySyncAlertShown', '1');
                            alert(`Properties are not syncing to the database.\n\n${msg}\n\nThey will only appear on this browser until fixed. See DATABASE_SETUP.md.`);
                        }
                        break;
                    }
                } catch {
                    if (!sessionStorage.getItem('propReady_propertySyncAlertShown')) {
                        sessionStorage.setItem('propReady_propertySyncAlertShown', '1');
                        alert('Properties could not sync to the database. Check your connection. They will only appear on this browser.');
                    }
                    break;
                }
            }
            const merged = [...apiProperties, ...localOnly];
            setListedProperties(merged.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
        }
        loadProperties();
    }, [currentAgent]);

    useEffect(() => {
        // Load viewing appointments from API and localStorage
        async function loadViewings() {
            if (typeof window === 'undefined' || !currentAgent?.id) return;
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            let apiViewings: ViewingAppointment[] = [];
            try {
                const res = await fetch(`/api/viewings?agentId=${encodeURIComponent(currentAgent.id)}`, { cache: 'no-store' });
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
                const price = v.propertyPrice ?? listedProperties.find(p => p.id === v.propertyId)?.price;
                return { ...v, propertyPrice: price ?? v.propertyPrice ?? 0 };
            });
            const agentViewings = listedProperties.length > 0
                ? merged.filter((v: ViewingAppointment) => listedProperties.some(p => p.id === v.propertyId))
                : merged;
            setViewingAppointments(agentViewings.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
        }
        loadViewings();
    }, [currentAgent, listedProperties]);

    const getViewingStatusBadge = (status: string) => {
        const badges = {
            scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock, label: 'Scheduled' },
            confirmed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Confirmed' },
            completed: { bg: 'bg-gold/20', text: 'text-gold', icon: CheckCircle, label: 'Completed' },
            cancelled: { bg: 'bg-gradient-to-r from-red-500/20 to-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Cancelled' }
        };

        const badge = badges[status as keyof typeof badges] || badges.scheduled;
        const Icon = badge.icon;

        return (
            <span className={`${AGENT_BADGE} ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3 shrink-0" />
                {badge.label}
            </span>
        );
    };

    useEffect(() => {
        if (activeTab === 'buyers') {
            let filtered: Lead[] = [...leads];

            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(item =>
                    item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.phone.includes(searchTerm)
                );
            }

            // Filter by status
            if (statusFilter !== 'all') {
                filtered = filtered.filter(item => item.status === statusFilter);
            }

            // Filter by location (agent's city)
            if (locationFilter === 'nearby' && currentAgent?.city?.trim()) {
                const agentCity = currentAgent.city.toLowerCase().trim();
                filtered = filtered.filter(item => {
                    const leadCity = (item.city || '').toLowerCase().trim();
                    return leadCity && (leadCity.includes(agentCity) || agentCity.includes(leadCity));
                });
            }

            setFilteredLeads(filtered);
        } else {
            let filtered: Seller[] = [...sellers];

            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(item =>
                    item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.phone.includes(searchTerm)
                );
            }

            // Filter by status
            if (statusFilter !== 'all') {
                filtered = filtered.filter(item => item.status === statusFilter);
            }

            // Filter by location (agent's city)
            if (locationFilter === 'nearby' && currentAgent?.city?.trim()) {
                const agentCity = currentAgent.city.toLowerCase().trim();
                filtered = filtered.filter(item => {
                    const leadCity = (item.city || '').toLowerCase().trim();
                    return leadCity && (leadCity.includes(agentCity) || agentCity.includes(leadCity));
                });
            }

            setFilteredSellers(filtered);
        }
    }, [searchTerm, statusFilter, locationFilter, leads, sellers, activeTab, currentAgent?.city]);

    const handleContact = (contact: Lead | Seller, method: 'phone' | 'email' | 'whatsapp') => {
        if (!isAgentPpraVerified(currentAgent)) {
            alert('Complete your PPRA verification to access leads and appear on PropReady.');
            return;
        }
        if (method === 'phone') {
            window.location.href = `tel:${contact.phone}`;
        } else if (method === 'email') {
            window.location.href = `mailto:${contact.email}?subject=PropReady - Property Inquiry`;
        } else if (method === 'whatsapp') {
            const message = encodeURIComponent(`Hi ${contact.fullName}, I saw your PropReady inquiry and would love to help you!`);
            window.open(`https://wa.me/${contact.phone.replace(/\s/g, '')}?text=${message}`, '_blank');
        }

        updateContactStatus(contact.id, 'contacted');
    };

    const updateContactStatus = async (contactId: string, status: 'new' | 'contacted' | 'qualified' | 'not-interested') => {
        const isBuyerLead = leads.some((l) => l.id === contactId);
        const isSellerLead = sellers.some((s) => s.id === contactId);
        const updateBuyers = isBuyerLead || (!isSellerLead && activeTab === 'buyers');

        if (updateBuyers) {
            const newContactedAt = status === 'contacted' ? new Date().toISOString() : null;
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
                        setLeads(prev => {
                            const updated = prev.map(l => l.id === contactId ? { ...l, ...updatedLead } : l);
                            setFilteredLeads(updated);
                            if (typeof window !== 'undefined') localStorage.setItem('propReady_leads', JSON.stringify(updated));
                            return updated;
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to update lead status in API', e);
            }
            const updatedLeads = leads.map(lead => {
                if (lead.id === contactId) {
                    return {
                        ...lead,
                        status,
                        contactedAt: status === 'contacted' ? new Date().toISOString() : lead.contactedAt
                    };
                }
                return lead;
            });
            setLeads(updatedLeads);
            setFilteredLeads(updatedLeads);
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_leads', JSON.stringify(updatedLeads));
            }
        } else {
            const newContactedAt = status === 'contacted' ? new Date().toISOString() : null;
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
                        setSellers(prev => {
                            const updated = prev.map(s => s.id === contactId ? { ...s, ...updatedSeller } : s);
                            setFilteredSellers(updated);
                            if (typeof window !== 'undefined') localStorage.setItem('propReady_sellers', JSON.stringify(updated));
                            return updated;
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to update seller status in API', e);
            }
            const updatedSellers = sellers.map(seller => {
                if (seller.id === contactId) {
                    return {
                        ...seller,
                        status,
                        contactedAt: status === 'contacted' ? new Date().toISOString() : seller.contactedAt
                    };
                }
                return seller;
            });
            setSellers(updatedSellers);
            setFilteredSellers(updatedSellers);
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_sellers', JSON.stringify(updatedSellers));
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            new: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Clock, label: 'New' },
            contacted: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Phone, label: 'Contacted' },
            qualified: { bg: 'bg-gold/20', text: 'text-gold', icon: CheckCircle, label: 'Qualified' },
            'not-interested': { bg: 'bg-red-500/10', text: 'text-red-700', icon: XCircle, label: 'Not Interested' }
        };

        const badge = badges[status as keyof typeof badges] || badges.new;
        const Icon = badge.icon;

        return (
            <span className={`${AGENT_BADGE} ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3 shrink-0" />
                {badge.label}
            </span>
        );
    };

    const getVerificationBadge = (lead: Lead | Seller) => {
        const leadType =
            (lead as Seller).leadType === 'seller' || (lead as Seller).leadType === 'investor'
                ? 'seller'
                : 'buyer';
        const status: LeadVerificationStatus = getLeadVerificationStatus(
            { id: lead.id, email: lead.email, leadType, appointmentVerified: lead.appointmentVerified },
            viewingAppointments
        );
        return (
            <span
                className={`${AGENT_BADGE} border ${verificationStatusClasses(status)}`}
            >
                {status === 'verified' && <CheckCircle className="w-3 h-3 shrink-0" />}
                {verificationStatusLabel(status)}
            </span>
        );
    };


    const verifiedBuyerCount = useMemo(
        () =>
            countVerifiedLeads(
                leads.map((l) => ({
                    id: l.id,
                    email: l.email,
                    leadType: 'buyer' as const,
                    appointmentVerified: l.appointmentVerified,
                })),
                viewingAppointments
            ),
        [leads, viewingAppointments]
    );

    const verifiedSellerCount = useMemo(
        () =>
            countVerifiedLeads(
                sellers.map((s) => ({
                    id: s.id,
                    email: s.email,
                    leadType: 'seller' as const,
                    appointmentVerified: s.appointmentVerified,
                })),
                viewingAppointments
            ),
        [sellers, viewingAppointments]
    );

    const pendingVerificationCount = useMemo(() => {
        const all = [
            ...leads.map((l) => ({
                id: l.id,
                email: l.email,
                leadType: 'buyer' as const,
                appointmentVerified: l.appointmentVerified,
            })),
            ...sellers.map((s) => ({
                id: s.id,
                email: s.email,
                leadType: 'seller' as const,
                appointmentVerified: s.appointmentVerified,
            })),
        ];
        return all.filter(
            (l) => getLeadVerificationStatus(l, viewingAppointments) === 'pending_confirmation'
        ).length;
    }, [leads, sellers, viewingAppointments]);

    const buyerPlanLimit = getBuyerLeadLimit(normalizeBuyerPlan(currentAgent?.plan));

    const aiContext = useMemo(
        () => ({
            newBuyers: leads.filter((l) => l.status === 'new').length,
            newSellers: sellers.filter((s) => s.status === 'new').length,
            pendingVerifications: pendingVerificationCount,
            verifiedBuyers: verifiedBuyerCount,
            verifiedSellers: verifiedSellerCount,
            upcomingViewings: viewingAppointments.filter((v) => v.status === 'scheduled' || v.status === 'confirmed').length,
            uncontactedLeads: leads.filter((l) => l.status === 'new').length + sellers.filter((s) => s.status === 'new').length,
            planName: getPlanDisplay(currentAgent?.plan || 'free'),
            buyerLimit: buyerPlanLimit,
        }),
        [
            leads,
            sellers,
            pendingVerificationCount,
            verifiedBuyerCount,
            verifiedSellerCount,
            viewingAppointments,
            currentAgent?.plan,
            buyerPlanLimit,
        ]
    );

    const stats = {
        totalBuyers: leads.filter(l => l.status === 'contacted' || l.status === 'qualified').length,
        newBuyers: leads.filter(l => l.status === 'new').length,
        totalSellers: sellers.length,
        newSellers: sellers.filter(s => s.status === 'new').length,
        totalProperties: listedProperties.length,
        totalViewings: viewingAppointments.length,
        verifiedBuyers: verifiedBuyerCount,
        verifiedSellers: verifiedSellerCount,
    };

    return (
        <AgentPortalLayout
            activePage="dashboard"
            agent={currentAgent}
            title="Dashboard"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow={`Welcome back${currentAgent?.fullName ? `, ${currentAgent.fullName.split(' ')[0]}` : ''}`}
                    title={<>Agent Dashboard <span aria-hidden="true">👋</span></>}
                    description="Manage your properties, leads, and appointments"
                />
            }
        >
            <div className={`${AGENT_PAGE_CONTAINER} relative z-10`}>
                <div className={AGENT_DASH_STACK}>
                    <PpraVerificationGate agent={currentAgent} />

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">
                        <button
                            onClick={() => {
                                setShowSuccessfulLeadsModal(true);
                            }}
                            className={`${AGENT_STAT_CARD} cursor-pointer`}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                                <div className="min-w-0">
                                    <p className={AGENT_DASH_STAT_LABEL}>Successful Leads</p>
                                    <p className={AGENT_DASH_STAT_VALUE}>{stats.totalBuyers}</p>
                                    <p className="text-charcoal/40 text-[11px] mt-2.5 leading-snug hidden sm:block">Contacted pipeline</p>
                                </div>
                                <div className={AGENT_STAT_ICON}>
                                    <User className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('sellers');
                                setSearchTerm('');
                                setStatusFilter('all');
                                setTimeout(() => {
                                    const leadsSection = document.getElementById('leads-section');
                                    if (leadsSection) {
                                        leadsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}
                            className={`${AGENT_STAT_CARD} cursor-pointer`}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                                <div className="min-w-0">
                                    <p className={AGENT_DASH_STAT_LABEL}>Total Sellers</p>
                                    <p className={AGENT_DASH_STAT_VALUE}>{stats.totalSellers}</p>
                                    <p className="text-charcoal/40 text-[11px] mt-2.5 leading-snug hidden sm:block">
                                        {stats.newSellers} new
                                    </p>
                                </div>
                                <div className={AGENT_STAT_ICON}>
                                    <Building2 className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        </button>
                        <Link
                            href="/agents/properties"
                            className={`${AGENT_STAT_CARD} cursor-pointer`}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                                <div className="min-w-0">
                                    <p className={AGENT_DASH_STAT_LABEL}>Listed Properties</p>
                                    <p className={AGENT_DASH_STAT_VALUE}>{stats.totalProperties}</p>
                                    <p className="text-charcoal/40 text-[11px] mt-2.5 leading-snug hidden sm:block">Active listings</p>
                                </div>
                                <div className={AGENT_STAT_ICON}>
                                    <Home className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/agents/viewings"
                            className={`${AGENT_STAT_CARD} cursor-pointer`}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                                <div className="min-w-0">
                                    <p className={AGENT_DASH_STAT_LABEL}>Viewings</p>
                                    <p className={AGENT_DASH_STAT_VALUE}>{stats.totalViewings}</p>
                                    <p className="text-charcoal/40 text-[11px] mt-2.5 leading-snug hidden sm:block">All appointments</p>
                                </div>
                                <div className={AGENT_STAT_ICON}>
                                    <Calendar className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        </Link>
                        <Link
                            href="/agents/learn"
                            className={`${AGENT_STAT_CARD} cursor-pointer col-span-2 xl:col-span-1`}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                                <div className="min-w-0">
                                    <p className={AGENT_DASH_STAT_LABEL}>Learning Hub</p>
                                    <p className="text-charcoal font-semibold text-lg sm:text-xl tracking-tight group-hover:text-gold transition-colors duration-200">
                                        Learn more →
                                    </p>
                                    <p className="text-charcoal/40 text-[11px] mt-2.5 leading-snug hidden sm:block">Guides & playbooks</p>
                                </div>
                                <div className={AGENT_STAT_ICON}>
                                    <BookOpen className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    <AgentAiSuggestions context={aiContext} />


                    {/* Leads Section with Tabs */}
                    <PpraVerificationGate agent={currentAgent} block={!isAgentPpraVerified(currentAgent)}>
                    <div id="leads-section" className={AGENT_CARD}>
                        <div className={AGENT_CARD_HEADER}>
                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-8">
                                <div className="min-w-0">
                                    <h2 className={AGENT_DASH_SECTION_TITLE}>PropReady quiz leads</h2>
                                    <p className={AGENT_DASH_SECTION_SUB}>
                                        {activeTab === 'buyers'
                                            ? `${filteredLeads.length} buyer${filteredLeads.length === 1 ? '' : 's'} who completed the quiz · ${stats.newBuyers} new`
                                            : `${filteredSellers.length} seller${filteredSellers.length === 1 ? '' : 's'} who completed the quiz · ${stats.newSellers} new`}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                                    <div className={`${AGENT_SEGMENT_WRAP} self-start sm:self-auto`}>
                                        <button
                                            onClick={() => setActiveTab('buyers')}
                                            className={agentSegmentBtn(activeTab === 'buyers')}
                                        >
                                            Buyers
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('sellers')}
                                            className={agentSegmentBtn(activeTab === 'sellers')}
                                        >
                                            Sellers
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setLeadsRefreshKey(k => k + 1)}
                                        className={`${AGENT_REFRESH_BTN} self-start sm:self-auto`}
                                        title="Refresh leads from database"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className={AGENT_CARD_TOOLBAR}>
                            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
                                <div className="flex-1 relative min-w-0">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab} by name, email, or phone...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={AGENT_SEARCH_INPUT}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-charcoal/35 shrink-0 hidden sm:block" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className={AGENT_SELECT}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="not-interested">Not Interested</option>
                                        </select>
                                    </div>
                                    {currentAgent?.city && (
                                        <select
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value as 'all' | 'nearby')}
                                            className={AGENT_SELECT}
                                        >
                                            <option value="all">All areas</option>
                                            <option value="nearby">My area ({currentAgent.city})</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={AGENT_CARD_BODY}>
                        {activeTab === 'buyers' ? (
                            filteredLeads.length === 0 ? (
                            <div className={AGENT_DASH_EMPTY}>
                                <div className={AGENT_DASH_EMPTY_ICON}>
                                    <User className="w-7 h-7 text-charcoal/30" />
                                </div>
                                    <p className={AGENT_DASH_EMPTY_TITLE}>No buyers found</p>
                                <p className={AGENT_DASH_EMPTY_DESC}>
                                    {searchTerm || statusFilter !== 'all' || locationFilter === 'nearby'
                                        ? 'Try adjusting your filters (search, status, or area)'
                                        : 'Buyers will appear here once they complete the prequalification'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-1">
                                <table className="w-full min-w-[920px] border-collapse">
                                    <thead>
                                            <tr className="border-b border-charcoal/[0.06]">
                                                <th className={AGENT_TABLE_HEAD}>Buyer</th>
                                            <th className={AGENT_TABLE_HEAD}>Contact</th>
                                            <th className={AGENT_TABLE_HEAD}>Score</th>
                                            <th className={AGENT_TABLE_HEAD}>Bond pre-qual</th>
                                            <th className={AGENT_TABLE_HEAD}>Status</th>
                                            <th className={AGENT_TABLE_HEAD}>Verified</th>
                                            <th className={AGENT_TABLE_HEAD}>Date</th>
                                            <th className={`${AGENT_TABLE_HEAD} text-right`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-charcoal/[0.05]">
                                        {filteredLeads.map((lead) => (
                                                <tr
                                                    key={lead.id}
                                                    className="hover:bg-charcoal/[0.018] transition-colors duration-150 cursor-pointer group"
                                                    onClick={() => setShowActionsModal(lead)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setShowActionsModal(lead);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`View details for ${lead.fullName}`}
                                                >
                                                <td className={AGENT_TABLE_CELL}>
                                                    <div>
                                                            <p className="text-charcoal font-medium text-sm">{lead.fullName || 'N/A'}</p>
                                                        <p className="text-charcoal/45 text-xs mt-1">{lead.employmentStatus || 'N/A'}</p>
                                                        {lead.city && (
                                                            <p className="text-charcoal/40 text-xs flex items-center gap-1 mt-1.5">
                                                                <MapPin className="w-3 h-3 shrink-0" />{lead.city}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={AGENT_TABLE_CELL}>
                                                    <div className="space-y-1 min-w-[150px]">
                                                        <p className="text-charcoal font-medium text-sm truncate max-w-[220px]" title={lead.email}>{lead.email}</p>
                                                        <p className="text-charcoal/45 text-xs tabular-nums">{lead.phone}</p>
                                                    </div>
                                                </td>
                                                <td className={AGENT_TABLE_CELL}>
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp className="w-3.5 h-3.5 text-gold/70 shrink-0" />
                                                            <span className="text-charcoal font-semibold text-base tabular-nums tracking-tight">{lead.score != null ? `${lead.score}%` : '—'}</span>
                                                    </div>
                                                </td>
                                                <td className={AGENT_TABLE_CELL}>
                                                    {lead.prequalifiedWithOriginator && lead.bondOriginator ? (
                                                        <span className={`${AGENT_BADGE} bg-gold/[0.08] text-gold border border-gold/10`}>
                                                            {bondOriginatorLabel(lead.bondOriginator)}
                                                        </span>
                                                    ) : (
                                                        <span className={`${AGENT_BADGE} bg-charcoal/[0.04] text-charcoal/50 border border-charcoal/10`}>
                                                            Optional — no platform prequal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={AGENT_TABLE_CELL}>
                                                    {getStatusBadge(lead.status)}
                                                </td>
                                                <td className={AGENT_TABLE_CELL}>
                                                    {getVerificationBadge(lead)}
                                                </td>
                                                <td className={`${AGENT_TABLE_CELL} whitespace-nowrap`}>
                                                    <p className="text-charcoal/50 text-sm tabular-nums">
                                                        {new Date(lead.timestamp).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className={`${AGENT_TABLE_CELL} text-right`} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowActionsModal(lead)}
                                                        className={AGENT_VIEW_BTN}
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                        <span>View</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            )
                        ) : (
                            filteredSellers.length === 0 ? (
                                <div className={AGENT_DASH_EMPTY}>
                                    <div className={AGENT_DASH_EMPTY_ICON}>
                                        <Building2 className="w-7 h-7 text-charcoal/30" />
                                    </div>
                                    <p className={AGENT_DASH_EMPTY_TITLE}>No sellers found</p>
                                    <p className={AGENT_DASH_EMPTY_DESC}>
                                        {searchTerm || statusFilter !== 'all' || locationFilter === 'nearby'
                                            ? 'Try adjusting your filters (search, status, or area)'
                                            : <>Sellers come from the database when they complete the seller quiz. Use Refresh above, or check <a href="/api/leads/debug" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">/api/leads/debug</a> to verify the database.</>}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-1">
                                    <table className="w-full min-w-[1000px] border-collapse">
                                        <thead>
                                            <tr className="border-b border-charcoal/[0.06]">
                                                <th className={AGENT_TABLE_HEAD}>Seller</th>
                                                <th className={AGENT_TABLE_HEAD}>Contact</th>
                                                <th className={AGENT_TABLE_HEAD}>Property</th>
                                                <th className={AGENT_TABLE_HEAD}>Estimated Value</th>
                                                <th className={AGENT_TABLE_HEAD}>Timeline</th>
                                                <th className={AGENT_TABLE_HEAD}>Status</th>
                                                <th className={AGENT_TABLE_HEAD}>Verified</th>
                                                <th className={AGENT_TABLE_HEAD}>Date</th>
                                                <th className={`${AGENT_TABLE_HEAD} text-right`}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-charcoal/[0.05]">
                                            {filteredSellers.map((seller) => (
                                                <tr
                                                    key={seller.id}
                                                    className="hover:bg-charcoal/[0.018] transition-colors duration-150 cursor-pointer group"
                                                    onClick={() => setShowActionsModal(seller)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setShowActionsModal(seller);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`View details for ${seller.fullName}`}
                                                >
                                                    <td className={AGENT_TABLE_CELL}>
                                                        <div>
                                                            <p className="text-charcoal font-medium text-sm">{seller.fullName || 'N/A'}</p>
                                                            <p className="text-charcoal/45 text-xs mt-1 capitalize">{seller.propertyType || 'N/A'}</p>
                                                            {seller.city && (
                                                                <p className="text-charcoal/40 text-xs flex items-center gap-1 mt-1.5">
                                                                    <MapPin className="w-3 h-3 shrink-0" />{seller.city}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={AGENT_TABLE_CELL}>
                                                        <div className="space-y-1 min-w-[150px]">
                                                            <p className="text-charcoal font-medium text-sm truncate max-w-[220px]" title={seller.email}>{seller.email}</p>
                                                            <p className="text-charcoal/45 text-xs tabular-nums">{seller.phone}</p>
                                                        </div>
                                                    </td>
                                                    <td className={`${AGENT_TABLE_CELL} max-w-[240px]`}>
                                                        <div className="space-y-1">
                                                            <p className="text-charcoal text-sm line-clamp-2 leading-relaxed">
                                                                {seller.propertyAddress
                                                                    ? seller.propertyAddress.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
                                                                    : 'N/A'}
                                                            </p>
                                                            <p className="text-charcoal/45 text-xs">
                                                                {seller.bedrooms} bed, {seller.bathrooms} bath
                                                                {(seller.landSize || seller.buildingSize) && (
                                                                    <> · {[seller.landSize && `${seller.landSize} m² land`, seller.buildingSize && `${seller.buildingSize} m² building`].filter(Boolean).join(', ')}</>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className={`${AGENT_TABLE_CELL} whitespace-nowrap`}>
                                                        <p className="text-gold font-semibold text-sm tabular-nums">
                                                            {formatCurrency(parseAmountForDisplay(seller.currentValue))}
                                                        </p>
                                                    </td>
                                                    <td className={AGENT_TABLE_CELL}>
                                                        <p className="text-charcoal/50 text-sm capitalize">
                                                            {seller.timeline ? seller.timeline.replace('-', ' to ') : 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className={AGENT_TABLE_CELL}>
                                                        {getStatusBadge(seller.status)}
                                                    </td>
                                                    <td className={AGENT_TABLE_CELL}>
                                                        {getVerificationBadge(seller)}
                                                    </td>
                                                    <td className={`${AGENT_TABLE_CELL} whitespace-nowrap`}>
                                                        <p className="text-charcoal/50 text-sm tabular-nums">
                                                            {new Date(seller.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className={`${AGENT_TABLE_CELL} text-right`} onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowActionsModal(seller)}
                                                            className={AGENT_VIEW_BTN}
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                            <span>View</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                        </div>
                        <p className={AGENT_CARD_FOOTER}>
                            Click any lead row to view full details and attached documents.
                        </p>
                    </div>
                    </PpraVerificationGate>
                </div>
            </div>

            {showActionsModal && (
                <AgentLeadDetailModal
                    lead={showActionsModal}
                    leadKind={
                        (showActionsModal as Seller).leadType === 'seller' ||
                        (showActionsModal as Seller).leadType === 'investor' ||
                        Boolean((showActionsModal as Seller).propertyAddress)
                            ? 'seller'
                            : 'buyer'
                    }
                    onClose={() => setShowActionsModal(null)}
                    onContact={handleContact}
                    onStatusChange={(leadId, status) => {
                        updateContactStatus(leadId, status);
                        setShowActionsModal((prev) =>
                            prev && prev.id === leadId ? { ...prev, status } : prev
                        );
                    }}
                    getStatusBadge={getStatusBadge}
                    getVerificationBadge={getVerificationBadge}
                />
            )}


            {/* Successful Leads Contacted Modal */}
            {showSuccessfulLeadsModal && (
                <div className={AGENT_MODAL_BACKDROP}>
                    <div className={`${AGENT_MODAL_PANEL_LG} max-w-4xl flex flex-col overflow-hidden`}>
                        <div className={AGENT_PANEL_HEADER}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight leading-tight">
                                        Successful Leads Contacted
                                    </h2>
                                    <p className="text-charcoal/45 text-sm mt-1">
                                        Leads that have been contacted or qualified, along with their viewing appointment outcomes
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSuccessfulLeadsModal(false)}
                                    className={`flex-shrink-0 ${AGENT_ICON_BTN}`}
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto ${AGENT_PANEL_BODY}`}>
                            <div className="space-y-4">
                            {leads.filter(l => l.status === 'contacted' || l.status === 'qualified').length === 0 ? (
                                <div className="text-center py-12">
                                    <User className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                    <p className="text-charcoal/70 text-lg">No successful leads yet</p>
                                    <p className="text-charcoal/50 text-sm mt-2">
                                        Contact leads to see them appear here
                                    </p>
                                </div>
                            ) : (
                                leads
                                    .filter(l => l.status === 'contacted' || l.status === 'qualified')
                                    .map((lead) => {
                                        // Find viewing appointments for this lead (match by name, email, or phone)
                                        const leadViewings = viewingAppointments.filter(v => 
                                            v.contactType === 'buyer' && (
                                                v.contactName.toLowerCase() === lead.fullName.toLowerCase() ||
                                                v.contactEmail.toLowerCase() === lead.email.toLowerCase() ||
                                                v.contactPhone.replace(/\s/g, '') === lead.phone.replace(/\s/g, '')
                                            )
                                        );

                                        return (
                                            <div
                                                key={lead.id}
                                                className={`${AGENT_CARD} p-6`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="text-xl font-bold text-charcoal">{lead.fullName}</h4>
                                                            {getStatusBadge(lead.status)}
                                                        </div>
                                                        <div className="space-y-1 text-sm text-charcoal/70">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-4 h-4" />
                                                                <span>{lead.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4" />
                                                                <span>{lead.phone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span>Score: {lead.score != null ? `${lead.score}%` : '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setShowActionsModal(lead);
                                                            setShowSuccessfulLeadsModal(false);
                                                        }}
                                                        className={AGENT_SECONDARY_BTN}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>

                                                {/* Viewing Appointments Outcome */}
                                                {leadViewings.length > 0 ? (
                                                    <div className="mt-4 pt-4 border-t border-charcoal/10">
                                                        <p className="text-charcoal/60 text-sm font-semibold mb-3">Viewing Appointments:</p>
                                                        <div className="space-y-3">
                                                            {leadViewings.map((viewing) => (
                                                                <div
                                                                    key={viewing.id}
                                                                    className="rounded-2xl p-4 border border-charcoal/[0.08] bg-charcoal/[0.02]"
                                                                >
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div>
                                                                            <p className="text-charcoal font-semibold">{viewing.propertyTitle}</p>
                                                                            <p className="text-charcoal/60 text-sm">{viewing.propertyAddress}</p>
                                                                        </div>
                                                                        {getViewingStatusBadge(viewing.status)}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                                                        <div>
                                                                            <p className="text-charcoal/60">Date & Time</p>
                                                                            <p className="text-charcoal font-semibold">
                                                                                {new Date(viewing.date).toLocaleDateString()} at {viewing.time}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-charcoal/60">Status</p>
                                                                            <p className="text-charcoal font-semibold capitalize">{viewing.status}</p>
                                                                        </div>
                                                                    </div>
                                                                    {viewing.notes && (
                                                                        <div className="mt-3 pt-3 border-t border-charcoal/10">
                                                                            <p className="text-charcoal/60 text-sm mb-1">Notes:</p>
                                                                            <p className="text-charcoal text-sm">{viewing.notes}</p>
                                                                        </div>
                                                                    )}
                                                                    <Link
                                                                        href="/agents/viewings"
                                                                        onClick={() => setShowSuccessfulLeadsModal(false)}
                                                                        className="mt-3 inline-block text-gold text-sm hover:underline"
                                                                    >
                                                                        Manage Viewing
                                                                    </Link>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 pt-4 border-t border-charcoal/10">
                                                        <p className="text-charcoal/50 text-sm italic">No viewing appointments scheduled yet</p>
                                                        <Link
                                                            href="/agents/viewings"
                                                            onClick={() => {
                                                                if (typeof window !== 'undefined') {
                                                                    sessionStorage.setItem('propReady_scheduleBuyerLeadId', lead.id);
                                                                }
                                                                setShowSuccessfulLeadsModal(false);
                                                            }}
                                                            className="mt-2 inline-block text-gold text-sm hover:underline"
                                                        >
                                                            Schedule a viewing for this lead
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                            </div>
                        </div>

                        <div className="px-6 sm:px-8 py-5 border-t border-charcoal/[0.06] flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowSuccessfulLeadsModal(false)}
                                className={AGENT_PRIMARY_BTN}
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AgentPortalLayout>
    );
}