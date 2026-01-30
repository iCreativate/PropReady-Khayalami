'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Phone, Mail, MessageCircle, Search, Filter, User, TrendingUp, Calendar, CheckCircle, Clock, XCircle, MoreVertical, X, Building2, Plus, MapPin, DollarSign, Bed, Bath, Square, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';

interface Lead {
    id: string;
    leadType?: 'buyer' | 'seller' | 'investor';
    fullName: string;
    email: string;
    phone: string;
    monthlyIncome?: string;
    depositSaved?: string;
    employmentStatus?: string;
    creditScore?: string;
    score?: number;
    preQualAmount?: number;
    status: 'new' | 'contacted' | 'qualified' | 'not-interested';
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
    currentValue?: string;
    reasonForSelling?: string;
    timeline?: string;
    hasBond?: boolean | null;
    bondBalance?: string;
}

interface ListedProperty {
    id: string;
    title: string;
    address: string;
    type: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    size: number;
    description: string;
    agentId: string;
    timestamp: string;
}

interface ViewingAppointment {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contactType: 'buyer' | 'seller';
    date: string;
    time: string;
    notes: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    timestamp: string;
}

export default function AgentsDashboardPage() {
    const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentAgent, setCurrentAgent] = useState<{ fullName: string; email: string; company?: string; id?: string } | null>(null);
    const [showActionsModal, setShowActionsModal] = useState<Lead | Seller | null>(null);
    const [showPropertyModal, setShowPropertyModal] = useState(false);
    const [showViewingModal, setShowViewingModal] = useState(false);
    const [showSuccessfulLeadsModal, setShowSuccessfulLeadsModal] = useState(false);
    const [selectedPropertyForViewing, setSelectedPropertyForViewing] = useState<ListedProperty | null>(null);
    const [selectedViewing, setSelectedViewing] = useState<ViewingAppointment | null>(null);
    const [listedProperties, setListedProperties] = useState<ListedProperty[]>([]);
    const [viewingAppointments, setViewingAppointments] = useState<ViewingAppointment[]>([]);
    const [viewingViewMode, setViewingViewMode] = useState<'list' | 'calendar'>('list');
    const [viewingSearchTerm, setViewingSearchTerm] = useState('');
    const [viewingStatusFilter, setViewingStatusFilter] = useState<string>('all');
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);
    
    const [propertyForm, setPropertyForm] = useState({
        title: '',
        address: '',
        type: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        size: '',
        description: ''
    });

    const [viewingForm, setViewingForm] = useState({
        propertyId: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contactType: 'buyer' as 'buyer' | 'seller',
        date: '',
        time: '',
        notes: ''
    });

    useEffect(() => {
        // Load current agent info
        if (typeof window !== 'undefined') {
            const agentData = localStorage.getItem('propReady_currentAgent');
            if (agentData) {
                const agent = JSON.parse(agentData);
                setCurrentAgent(agent);
            }
        }
    }, []);

    useEffect(() => {
        // Load all leads (buyers + sellers + investors) from one API, merge with localStorage, split by type
        async function loadLeads() {
            if (typeof window === 'undefined') return;
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
            const merged = [...apiLeads, ...localBuyersOnly, ...localSellersOnly].sort((a, b) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            const buyers = merged.filter(l => (l as Lead).leadType !== 'seller' && (l as Lead).leadType !== 'investor') as Lead[];
            const sellersList = merged.filter(l => (l as Lead).leadType === 'seller' || (l as Lead).leadType === 'investor') as Seller[];
            setLeads(buyers);
            setFilteredLeads(buyers);
            setSellers(sellersList);
            setFilteredSellers(sellersList);
        }
        loadLeads();
    }, [leadsRefreshKey]);

    useEffect(() => {
        // Load listed properties
        if (typeof window !== 'undefined' && currentAgent?.id) {
            const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            const agentProperties = storedProperties.filter((p: ListedProperty) => p.agentId === currentAgent.id);
            setListedProperties(agentProperties);
        }
    }, [currentAgent]);

    useEffect(() => {
        // Load viewing appointments
        if (typeof window !== 'undefined' && currentAgent?.id) {
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            // Filter by agent's properties or all if no properties yet
            const agentViewings = listedProperties.length > 0
                ? storedViewings.filter((v: ViewingAppointment) => 
                    listedProperties.some(p => p.id === v.propertyId)
                )
                : storedViewings;
            setViewingAppointments(agentViewings);
        }
    }, [currentAgent, listedProperties]);

    // Initialize viewing form when editing
    useEffect(() => {
        if (selectedViewing && showViewingModal) {
            setViewingForm({
                propertyId: selectedViewing.propertyId,
                contactName: selectedViewing.contactName,
                contactEmail: selectedViewing.contactEmail,
                contactPhone: selectedViewing.contactPhone,
                contactType: selectedViewing.contactType,
                date: selectedViewing.date,
                time: selectedViewing.time,
                notes: selectedViewing.notes
            });
        }
    }, [selectedViewing, showViewingModal]);

    // Scheduling viewings is only possible for properties actually listed by this agent
    const allAvailableProperties = listedProperties;

    // Filter viewings
    const filteredViewings = viewingAppointments.filter(viewing => {
        const matchesSearch = !viewingSearchTerm || 
            viewing.propertyTitle.toLowerCase().includes(viewingSearchTerm.toLowerCase()) ||
            viewing.propertyAddress.toLowerCase().includes(viewingSearchTerm.toLowerCase()) ||
            viewing.contactName.toLowerCase().includes(viewingSearchTerm.toLowerCase());
        
        const matchesStatus = viewingStatusFilter === 'all' || viewing.status === viewingStatusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Calendar helper functions
    const getCalendarDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const days: (number | null)[] = [];
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(null);
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        
        // Fill remaining cells
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
            cancelled: { bg: 'bg-gradient-to-r from-red-500/20 to-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Cancelled' }
        };

        const badge = badges[status as keyof typeof badges] || badges.scheduled;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const updateViewingStatus = (viewingId: string, status: ViewingAppointment['status']) => {
        const updatedViewings = viewingAppointments.map(viewing => {
            if (viewing.id === viewingId) {
                return { ...viewing, status };
            }
            return viewing;
        });

        setViewingAppointments(updatedViewings);
        if (typeof window !== 'undefined') {
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const updatedStored = storedViewings.map((v: ViewingAppointment) => 
                v.id === viewingId ? { ...v, status } : v
            );
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(updatedStored));
        }
    };

    const deleteViewing = (viewingId: string) => {
        const updatedViewings = viewingAppointments.filter(v => v.id !== viewingId);
        setViewingAppointments(updatedViewings);
        if (typeof window !== 'undefined') {
            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const filtered = storedViewings.filter((v: ViewingAppointment) => v.id !== viewingId);
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(filtered));
        }
        setSelectedViewing(null);
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

            setFilteredSellers(filtered);
        }
    }, [searchTerm, statusFilter, leads, sellers, activeTab]);

    const handleContact = (contact: Lead | Seller, method: 'phone' | 'email' | 'whatsapp') => {
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
        if (activeTab === 'buyers') {
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
            'not-interested': { bg: 'bg-gradient-to-r from-red-500/20 to-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Not Interested' }
        };

        const badge = badges[status as keyof typeof badges] || badges.new;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const handleAddProperty = () => {
        if (!currentAgent?.id) return;
        
        const newProperty: ListedProperty = {
            id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...propertyForm,
            price: parseFloat(propertyForm.price),
            bedrooms: parseInt(propertyForm.bedrooms),
            bathrooms: parseInt(propertyForm.bathrooms),
            size: parseFloat(propertyForm.size),
            agentId: currentAgent.id,
            timestamp: new Date().toISOString()
        };

        const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
        storedProperties.push(newProperty);
        localStorage.setItem('propReady_listedProperties', JSON.stringify(storedProperties));
        
        setListedProperties([...listedProperties, newProperty]);
        setPropertyForm({
            title: '',
            address: '',
            type: '',
            price: '',
            bedrooms: '',
            bathrooms: '',
            size: '',
            description: ''
        });
        setShowPropertyModal(false);
    };

    const handleScheduleViewing = () => {
        const property = selectedPropertyForViewing || allAvailableProperties.find(p => p.id === viewingForm.propertyId);
        if (!property && !viewingForm.propertyId) {
            alert('Please select a property');
            return;
        }

        const { propertyId: _, ...viewingFormWithoutPropertyId } = viewingForm;
        const newViewing: ViewingAppointment = {
            id: selectedViewing?.id || `viewing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            propertyId: property?.id || viewingForm.propertyId,
            propertyTitle: property?.title || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address',
            ...viewingFormWithoutPropertyId,
            date: viewingForm.date,
            time: viewingForm.time,
            status: selectedViewing?.status || 'scheduled',
            timestamp: selectedViewing?.timestamp || new Date().toISOString()
        };

        const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
        
        if (selectedViewing) {
            // Update existing viewing
            const updated = storedViewings.map((v: ViewingAppointment) => 
                v.id === selectedViewing.id ? newViewing : v
            );
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(updated));
            setViewingAppointments(viewingAppointments.map(v => v.id === selectedViewing.id ? newViewing : v));
        } else {
            // Add new viewing
            storedViewings.push(newViewing);
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(storedViewings));
            setViewingAppointments([...viewingAppointments, newViewing]);
        }
        
        setViewingForm({
            propertyId: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            contactType: 'buyer',
            date: '',
            time: '',
            notes: ''
        });
        setSelectedPropertyForViewing(null);
        setSelectedViewing(null);
        setShowViewingModal(false);
    };

    const stats = {
        totalBuyers: leads.filter(l => l.status === 'contacted' || l.status === 'qualified').length, // Successful leads contacted
        newBuyers: leads.filter(l => l.status === 'new').length,
        totalSellers: sellers.length,
        newSellers: sellers.filter(s => s.status === 'new').length,
        totalProperties: listedProperties.length,
        totalViewings: viewingAppointments.length
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/agents/dashboard" className="text-gold font-semibold">
                                Dashboard
                            </Link>
                            <Link href="/agents/settings" className="text-charcoal/90 hover:text-charcoal transition">
                                Settings
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-charcoal/70 text-sm">Agent</p>
                            <p className="text-charcoal font-semibold">
                                {currentAgent?.fullName || 'John Agent'}
                            </p>
                            {currentAgent?.company && (
                                <p className="text-charcoal/60 text-xs">{currentAgent.company}</p>
                            )}
                        </div>
                        <button 
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('propReady_currentAgent');
                                    window.location.href = '/agents/login';
                                }
                            }}
                            className="px-4 py-2 rounded-lg border border-charcoal/30 text-charcoal hover:bg-charcoal/10 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            Agent Dashboard 👋
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            Manage your properties, leads, and appointments
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <button
                            onClick={() => {
                                setShowSuccessfulLeadsModal(true);
                            }}
                            className="glass-effect rounded-xl p-6 hover:bg-white/20 transition cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/70 text-sm mb-1">Successful Leads Contacted</p>
                                    <p className="text-charcoal font-bold text-2xl">{stats.totalBuyers}</p>
                                </div>
                                <User className="w-10 h-10 text-gold/50" />
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('sellers');
                                setSearchTerm('');
                                setStatusFilter('all');
                                // Scroll to leads section
                                setTimeout(() => {
                                    const leadsSection = document.getElementById('leads-section');
                                    if (leadsSection) {
                                        leadsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}
                            className="glass-effect rounded-xl p-6 hover:bg-white/20 transition cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/70 text-sm mb-1">Total Sellers</p>
                                    <p className="text-charcoal font-bold text-2xl">{stats.totalSellers}</p>
                                </div>
                                <Building2 className="w-10 h-10 text-gold/50" />
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                // Scroll to properties section
                                setTimeout(() => {
                                    const propertiesSection = document.getElementById('properties-section');
                                    if (propertiesSection) {
                                        propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}
                            className="glass-effect rounded-xl p-6 hover:bg-white/20 transition cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/70 text-sm mb-1">Listed Properties</p>
                                    <p className="text-charcoal font-bold text-2xl">{stats.totalProperties}</p>
                                </div>
                                <Home className="w-10 h-10 text-gold/50" />
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                // Scroll to viewings section
                                setTimeout(() => {
                                    const viewingsSection = document.getElementById('viewings-section');
                                    if (viewingsSection) {
                                        viewingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}
                            className="glass-effect rounded-xl p-6 hover:bg-white/20 transition cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/70 text-sm mb-1">Viewings</p>
                                    <p className="text-charcoal font-bold text-2xl">{stats.totalViewings}</p>
                                </div>
                                <Calendar className="w-10 h-10 text-gold/50" />
                            </div>
                        </button>
                    </div>

                    {/* Listed Properties Section */}
                    <div id="properties-section" className="glass-effect rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-charcoal">My Listed Properties</h2>
                            <button
                                onClick={() => setShowPropertyModal(true)}
                                className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-600 transition flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Property
                            </button>
                        </div>

                        {listedProperties.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                <p className="text-charcoal/70 text-lg">No properties listed yet</p>
                                <p className="text-charcoal/50 text-sm mt-2">
                                    Add your first property to start connecting with buyers and sellers
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {listedProperties.map((property) => (
                                    <div key={property.id} className="bg-white/10 rounded-lg p-4 border border-charcoal/20">
                                        <h3 className="text-charcoal font-semibold mb-2">{property.title}</h3>
                                        <div className="space-y-1 text-sm text-charcoal/70 mb-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{property.address}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" />
                                                <span>R {property.price.toLocaleString('en-ZA')}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Bed className="w-4 h-4" />
                                                    <span>{property.bedrooms}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bath className="w-4 h-4" />
                                                    <span>{property.bathrooms}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Square className="w-4 h-4" />
                                                    <span>{property.size}m²</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedPropertyForViewing(property);
                                                setViewingForm(prev => ({ ...prev, propertyId: property.id }));
                                                setShowViewingModal(true);
                                            }}
                                            className="w-full px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-600 transition text-sm flex items-center justify-center gap-2"
                                        >
                                            <CalendarIcon className="w-4 h-4" />
                                            Schedule Viewing
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Leads Section with Tabs */}
                    <div id="leads-section" className="glass-effect rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-charcoal">Prequalified Leads</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLeadsRefreshKey(k => k + 1)}
                                    className="px-3 py-2 rounded-lg bg-charcoal/10 text-charcoal text-sm font-medium hover:bg-charcoal/20 transition"
                                >
                                    Refresh leads
                                </button>
                                <button
                                    onClick={() => setActiveTab('buyers')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                                        activeTab === 'buyers'
                                            ? 'bg-gold text-white'
                                            : 'bg-white/10 text-charcoal border border-charcoal/20 hover:bg-charcoal/5'
                                    }`}
                                >
                                    Buyers
                                </button>
                                <button
                                    onClick={() => setActiveTab('sellers')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                                        activeTab === 'sellers'
                                            ? 'bg-gold text-white'
                                            : 'bg-white/10 text-charcoal border border-charcoal/20 hover:bg-charcoal/5'
                                    }`}
                                >
                                    Sellers
                                </button>
                            </div>
                        </div>

                    {/* Filters and Search */}
                        <div className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                <input
                                    type="text"
                                        placeholder={`Search ${activeTab} by name, email, or phone...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-charcoal/50" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                >
                                    <option value="all">All Status</option>
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="not-interested">Not Interested</option>
                                </select>
                            </div>
                        </div>
                    </div>

                        {/* Table */}
                        {activeTab === 'buyers' ? (
                            filteredLeads.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                    <p className="text-charcoal/70 text-lg">No buyers found</p>
                                <p className="text-charcoal/50 text-sm mt-2">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? 'Try adjusting your filters' 
                                            : 'Buyers will appear here once they complete the prequalification'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                            <tr className="border-b border-charcoal/20">
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Buyer</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Contact</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Pre-Qual Amount</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Score</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Status</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Date</th>
                                            <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.map((lead) => (
                                                <tr key={lead.id} className="border-b border-charcoal/10 hover:bg-charcoal/5 transition">
                                                <td className="py-4 px-4">
                                                    <div>
                                                            <p className="text-charcoal font-semibold">{lead.fullName || 'N/A'}</p>
                                                        <p className="text-charcoal/60 text-sm">{lead.employmentStatus || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        <p className="text-charcoal/80 text-sm">{lead.email}</p>
                                                        <p className="text-charcoal/60 text-sm">{lead.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-gold font-bold">R {(lead.preQualAmount ?? 0).toLocaleString('en-ZA')}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-gold" />
                                                            <span className="text-charcoal font-semibold">{lead.score}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(lead.status)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-charcoal/70 text-sm">
                                                        {new Date(lead.timestamp).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => setShowActionsModal(lead)}
                                                            className="px-4 py-2 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal hover:bg-charcoal/10 transition flex items-center gap-2"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                        <span className="text-sm">Actions</span>
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
                                <div className="text-center py-12">
                                    <Building2 className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                    <p className="text-charcoal/70 text-lg">No sellers found</p>
                                    <p className="text-charcoal/50 text-sm mt-2">
                                        {searchTerm || statusFilter !== 'all' 
                                            ? 'Try adjusting your filters' 
                                            : 'Sellers will appear here once they complete the seller quiz'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-charcoal/20">
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Seller</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Contact</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Property</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Estimated Value</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Timeline</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Status</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Date</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSellers.map((seller) => (
                                                <tr key={seller.id} className="border-b border-charcoal/10 hover:bg-charcoal/5 transition">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <p className="text-charcoal font-semibold">{seller.fullName || 'N/A'}</p>
                                                            <p className="text-charcoal/60 text-sm capitalize">{seller.propertyType || 'N/A'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="space-y-1">
                                                            <p className="text-charcoal/80 text-sm">{seller.email}</p>
                                                            <p className="text-charcoal/60 text-sm">{seller.phone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="space-y-1">
                                                            <p className="text-charcoal/80 text-sm">{seller.propertyAddress}</p>
                                                            <p className="text-charcoal/60 text-sm">
                                                                {seller.bedrooms} bed, {seller.bathrooms} bath
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <p className="text-gold font-bold">
                                                            R {seller.currentValue ? parseFloat(seller.currentValue).toLocaleString('en-ZA') : '0'}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <p className="text-charcoal/70 text-sm capitalize">
                                                            {seller.timeline ? seller.timeline.replace('-', ' to ') : 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {getStatusBadge(seller.status)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <p className="text-charcoal/70 text-sm">
                                                            {new Date(seller.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => setShowActionsModal(seller)}
                                                            className="px-4 py-2 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal hover:bg-charcoal/10 transition flex items-center gap-2"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                            <span className="text-sm">Actions</span>
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

                    {/* Viewings Section */}
                    <div id="viewings-section" className="glass-effect rounded-xl p-6 mt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-charcoal">Viewing Appointments</h2>
                            <button
                                onClick={() => {
                                    setShowViewingModal(true);
                                    setSelectedPropertyForViewing(null);
                                    setViewingForm({
                                        propertyId: '',
                                        contactName: '',
                                        contactEmail: '',
                                        contactPhone: '',
                                        contactType: 'buyer',
                                        date: '',
                                        time: '',
                                        notes: ''
                                    });
                                }}
                                className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-600 transition flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Schedule Viewing
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setViewingViewMode('list')}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${
                                    viewingViewMode === 'list'
                                        ? 'bg-gold text-white'
                                        : 'bg-white/10 text-charcoal border border-charcoal/20 hover:bg-charcoal/5'
                                }`}
                            >
                                List View
                            </button>
                            <button
                                onClick={() => setViewingViewMode('calendar')}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${
                                    viewingViewMode === 'calendar'
                                        ? 'bg-gold text-white'
                                        : 'bg-white/10 text-charcoal border border-charcoal/20 hover:bg-charcoal/5'
                                }`}
                            >
                                Calendar View
                            </button>
                        </div>

                        {/* Filters and Search */}
                        <div className="mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        placeholder="Search by property, contact name, or address..."
                                        value={viewingSearchTerm}
                                        onChange={(e) => setViewingSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-charcoal/50" />
                                    <select
                                        value={viewingStatusFilter}
                                        onChange={(e) => setViewingStatusFilter(e.target.value)}
                                        className="px-4 py-3 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
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

                        {/* Calendar View */}
                        {viewingViewMode === 'calendar' && (
                            <div className="rounded-3xl shadow-2xl border border-charcoal/10 bg-white/90 backdrop-blur-xl overflow-hidden">
                                {/* Calendar Header */}
                                <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-8 py-5 md:py-6 border-b border-gold/20">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                                <CalendarIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <h2 className="text-xl md:text-2xl font-bold text-white">
                                                {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(currentCalendarDate);
                                                    newDate.setMonth(newDate.getMonth() - 1);
                                                    setCurrentCalendarDate(newDate);
                                                }}
                                                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(currentCalendarDate);
                                                    newDate.setMonth(newDate.getMonth() + 1);
                                                    setCurrentCalendarDate(newDate);
                                                }}
                                                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar Body */}
                                <div className="px-6 md:px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-center text-charcoal/70 font-semibold text-sm py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                    {getCalendarDays(currentCalendarDate).map((day, index) => {
                                        const dayViewings = day !== null ? filteredViewings.filter(v => {
                                            if (!v.date) return false;
                                            const viewingDate = new Date(v.date);
                                            if (isNaN(viewingDate.getTime())) return false;
                                            return viewingDate.getDate() === day && 
                                                   viewingDate.getMonth() === currentCalendarDate.getMonth() &&
                                                   viewingDate.getFullYear() === currentCalendarDate.getFullYear();
                                        }) : [];
                                        const isToday = day !== null && day === new Date().getDate() && 
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
                                                        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-gold font-bold' : 'text-charcoal/70'}`}>
                                                            {day}
                                                        </div>
                                                        {dayViewings.slice(0, 2).map(viewing => (
                                                            <div
                                                                key={viewing.id}
                                                                onClick={() => setSelectedViewing(viewing)}
                                                                className={`text-xs p-1.5 rounded-lg mb-1 cursor-pointer hover:opacity-80 transition shadow-sm ${
                                                                    viewing.status === 'completed' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                                                                    viewing.status === 'confirmed' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                                                                    viewing.status === 'cancelled' ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 border border-red-500/30' :
                                                                    'bg-gradient-to-r from-gold/20 to-gold/10 text-gold border border-gold/30'
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

                        {/* List View */}
                        {viewingViewMode === 'list' && (
                            filteredViewings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                    <p className="text-charcoal/70 text-lg">No viewings found</p>
                                    <p className="text-charcoal/50 text-sm mt-2">
                                        {viewingSearchTerm || viewingStatusFilter !== 'all' 
                                            ? 'Try adjusting your filters' 
                                            : 'Schedule your first viewing appointment'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-charcoal/20">
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Property</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Contact</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Date & Time</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Type</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Status</th>
                                                <th className="text-left py-3 px-4 text-charcoal/70 font-semibold text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredViewings.map((viewing) => (
                                                <tr key={viewing.id} className="border-b border-charcoal/10 hover:bg-charcoal/5 transition">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <p className="text-charcoal font-semibold">{viewing.propertyTitle}</p>
                                                            <p className="text-charcoal/60 text-sm">{viewing.propertyAddress}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="space-y-1">
                                                            <p className="text-charcoal/80 text-sm">{viewing.contactName}</p>
                                                            <p className="text-charcoal/60 text-sm">{viewing.contactPhone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="space-y-1">
                                                            <p className="text-charcoal/80 text-sm">
                                                                {new Date(viewing.date).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-charcoal/60 text-sm">{viewing.time}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            viewing.contactType === 'buyer' 
                                                                ? 'bg-blue-500/20 text-blue-400' 
                                                                : 'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                            {viewing.contactType === 'buyer' ? 'Buyer' : 'Seller'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {getViewingStatusBadge(viewing.status)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => setSelectedViewing(viewing)}
                                                            className="px-4 py-2 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal hover:bg-charcoal/10 transition flex items-center gap-2"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                            <span className="text-sm">Manage</span>
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
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>

            {/* Actions Modal */}
            {showActionsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {showActionsModal.fullName}
                                            </h2>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowActionsModal(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="mb-6">
                                <div className="text-center mb-6">
                                    {activeTab === 'buyers' && 'preQualAmount' in showActionsModal && (
                                        <p className="text-charcoal/70 text-sm mb-4">
                                            Pre-Qual Amount: R {((showActionsModal as Lead).preQualAmount ?? 0).toLocaleString('en-ZA')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                <p className="text-charcoal/70 text-sm mb-2 font-semibold">Contact Information</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-charcoal/50" />
                                        <p className="text-charcoal text-sm break-all">{showActionsModal.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-charcoal/50" />
                                        <p className="text-charcoal text-sm">{showActionsModal.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'buyers' && 'score' in showActionsModal && (
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                    <p className="text-charcoal/70 text-sm mb-2 font-semibold">Lead Details</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-charcoal/60">Score</p>
                                            <p className="text-charcoal font-semibold">{(showActionsModal as Lead).score}%</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Status</p>
                                            <div className="mt-1">{getStatusBadge(showActionsModal.status)}</div>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Employment</p>
                                            <p className="text-charcoal font-semibold capitalize">{(showActionsModal as Lead).employmentStatus}</p>
                                        </div>
                                        <div>
                                            <p className="text-charcoal/60">Deposit</p>
                                            <p className="text-charcoal font-semibold">R {(showActionsModal as Lead).depositSaved || '0'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sellers' && 'propertyAddress' in showActionsModal && (
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 mb-4 shadow-sm">
                                    <p className="text-charcoal/70 text-sm mb-2 font-semibold">Property Details</p>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <p className="text-charcoal/60">Address</p>
                                            <p className="text-charcoal font-semibold">{(showActionsModal as Seller).propertyAddress}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-charcoal/60">Type</p>
                                                <p className="text-charcoal font-semibold capitalize">{(showActionsModal as Seller).propertyType}</p>
                                            </div>
                                            <div>
                                                <p className="text-charcoal/60">Value</p>
                                                <p className="text-charcoal font-semibold">
                                                    R {parseFloat((showActionsModal as Seller).currentValue ?? '0').toLocaleString('en-ZA')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 mt-6">
                                <h4 className="text-charcoal font-semibold mb-2">Contact {activeTab === 'buyers' ? 'Buyer' : 'Seller'}</h4>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button
                                        onClick={() => {
                                            handleContact(showActionsModal, 'phone');
                                            setShowActionsModal(null);
                                        }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                                        title="Call"
                                    >
                                        <Phone className="w-5 h-5" />
                                        <span className="text-xs">Call</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleContact(showActionsModal, 'email');
                                            setShowActionsModal(null);
                                        }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                                        title="Email"
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span className="text-xs">Email</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleContact(showActionsModal, 'whatsapp');
                                            setShowActionsModal(null);
                                        }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-600/20 text-green-300 hover:bg-green-600/30 transition"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="text-xs">WhatsApp</span>
                                    </button>
                                </div>

                                <div className="border-t border-charcoal/20 pt-4">
                                    <h4 className="text-charcoal font-semibold mb-3">Update Status</h4>
                                    <select
                                        value={showActionsModal.status}
                                        onChange={(e) => {
                                            updateContactStatus(showActionsModal.id, e.target.value as 'new' | 'contacted' | 'qualified' | 'not-interested');
                                            setShowActionsModal({ ...showActionsModal, status: e.target.value as 'new' | 'contacted' | 'qualified' | 'not-interested' });
                                        }}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="not-interested">Not Interested</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setShowActionsModal(null)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Property Modal */}
            {showPropertyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                        Add Property to PropReady
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowPropertyModal(false)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-charcoal font-semibold mb-2">Property Title</label>
                                <input
                                    type="text"
                                    value={propertyForm.title}
                                    onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                                    placeholder="e.g., Modern 3-Bedroom House"
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>

                            <div>
                                <label className="block text-charcoal font-semibold mb-2">Address</label>
                                <input
                                    type="text"
                                    value={propertyForm.address}
                                    onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                                    placeholder="e.g., 123 Main Street, Sandton"
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Type</label>
                                    <select
                                        value={propertyForm.type}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                    >
                                        <option value="">Select type</option>
                                        <option value="House">House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Townhouse">Townhouse</option>
                                        <option value="Duplex">Duplex</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Price (R)</label>
                                    <input
                                        type="number"
                                        value={propertyForm.price}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                                        placeholder="e.g., 1200000"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Bedrooms</label>
                                    <input
                                        type="number"
                                        value={propertyForm.bedrooms}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                                        placeholder="3"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Bathrooms</label>
                                    <input
                                        type="number"
                                        value={propertyForm.bathrooms}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                                        placeholder="2"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Size (m²)</label>
                                    <input
                                        type="number"
                                        value={propertyForm.size}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, size: e.target.value })}
                                        placeholder="120"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-charcoal font-semibold mb-2">Description</label>
                                <textarea
                                    value={propertyForm.description}
                                    onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                                    placeholder="Describe the property..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>
                        </div>

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setShowPropertyModal(false)}
                                className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-xl hover:bg-charcoal/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProperty}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Add Property
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Viewing Modal */}
            {showViewingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                        {selectedViewing ? 'Edit Viewing' : 'Schedule Viewing'}
                                    </h2>
                                    {selectedPropertyForViewing && (
                                        <p className="text-white/90 text-sm">{selectedPropertyForViewing.title}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowViewingModal(false);
                                        setSelectedPropertyForViewing(null);
                                        setSelectedViewing(null);
                                        setViewingForm({
                                            propertyId: '',
                                            contactName: '',
                                            contactEmail: '',
                                            contactPhone: '',
                                            contactType: 'buyer',
                                            date: '',
                                            time: '',
                                            notes: ''
                                        });
                                    }}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="space-y-4">
                                {!selectedPropertyForViewing && (
                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">Property <span className="text-red-600">*</span></label>
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
                                                    {allAvailableProperties.map(property => (
                                                        <option key={property.id} value={property.id}>
                                                            {property.title} - {property.address} (R {property.price.toLocaleString('en-ZA')})
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Contact Type</label>
                                    <select
                                        value={viewingForm.contactType}
                                        onChange={(e) => setViewingForm({ ...viewingForm, contactType: e.target.value as 'buyer' | 'seller' })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                    >
                                        <option value="buyer">Buyer</option>
                                        <option value="seller">Seller</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-charcoal font-semibold mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={viewingForm.contactName}
                                        onChange={(e) => setViewingForm({ ...viewingForm, contactName: e.target.value })}
                                        placeholder="Full name"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={viewingForm.contactEmail}
                                            onChange={(e) => setViewingForm({ ...viewingForm, contactEmail: e.target.value })}
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-charcoal font-semibold mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={viewingForm.contactPhone}
                                            onChange={(e) => setViewingForm({ ...viewingForm, contactPhone: e.target.value })}
                                            placeholder="082 123 4567"
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
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

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowViewingModal(false);
                                    setSelectedPropertyForViewing(null);
                                    setSelectedViewing(null);
                                    setViewingForm({
                                        propertyId: '',
                                        contactName: '',
                                        contactEmail: '',
                                        contactPhone: '',
                                        contactType: 'buyer',
                                        date: '',
                                        time: '',
                                        notes: ''
                                    });
                                }}
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

            {/* Viewing Management Modal */}
            {selectedViewing && !showViewingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                            <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {selectedViewing.propertyTitle}
                                            </h2>
                                            <p className="text-white/90 text-sm">{selectedViewing.propertyAddress}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedViewing(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                selectedViewing.contactType === 'buyer' 
                                                    ? 'bg-blue-500/20 text-blue-400' 
                                                    : 'bg-purple-500/20 text-purple-400'
                                            }`}>
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

                            <div className="space-y-3">
                                <div className="border-t border-charcoal/20 pt-4">
                                    <h4 className="text-charcoal font-semibold mb-3">Update Status</h4>
                                    <select
                                        value={selectedViewing.status}
                                        onChange={(e) => {
                                            updateViewingStatus(selectedViewing.id, e.target.value as ViewingAppointment['status']);
                                            setSelectedViewing({ ...selectedViewing, status: e.target.value as ViewingAppointment['status'] });
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
                                                date: selectedViewing.date,
                                                time: selectedViewing.time,
                                                notes: selectedViewing.notes
                                            });
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

                        {/* Footer */}
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

            {/* Successful Leads Contacted Modal */}
            {showSuccessfulLeadsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                        Successful Leads Contacted
                                    </h2>
                                    <p className="text-white/90 text-sm">
                                        Leads that have been contacted or qualified, along with their viewing appointment outcomes
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSuccessfulLeadsModal(false)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
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
                                                className="premium-card rounded-xl p-6 border border-charcoal/20"
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
                                                                <span>Pre-Qual: R {(lead.preQualAmount ?? 0).toLocaleString('en-ZA')}</span>
                                                                <span className="text-charcoal/40">•</span>
                                                                <span>Score: {lead.score}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setShowActionsModal(lead);
                                                            setShowSuccessfulLeadsModal(false);
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-white/10 border border-charcoal/20 text-charcoal hover:bg-charcoal/10 transition"
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
                                                                    className="bg-white/10 rounded-lg p-4 border border-charcoal/20"
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
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedViewing(viewing);
                                                                            setShowSuccessfulLeadsModal(false);
                                                                        }}
                                                                        className="mt-3 text-gold text-sm hover:underline"
                                                                    >
                                                                        Manage Viewing
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 pt-4 border-t border-charcoal/10">
                                                        <p className="text-charcoal/50 text-sm italic">No viewing appointments scheduled yet</p>
                                                        <button
                                                            onClick={() => {
                                                                setShowViewingModal(true);
                                                                setViewingForm({
                                                                    propertyId: '',
                                                                    contactName: lead.fullName,
                                                                    contactEmail: lead.email,
                                                                    contactPhone: lead.phone,
                                                                    contactType: 'buyer',
                                                                    date: '',
                                                                    time: '',
                                                                    notes: ''
                                                                });
                                                                setShowSuccessfulLeadsModal(false);
                                                            }}
                                                            className="mt-2 text-gold text-sm hover:underline"
                                                        >
                                                            Schedule a viewing for this lead
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setShowSuccessfulLeadsModal(false)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
