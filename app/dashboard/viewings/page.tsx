'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, MapPin, Clock, User, Phone, Mail, MessageCircle, CheckCircle, XCircle, AlertCircle, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import LearningCenterDropdown from '@/components/LearningCenterDropdown';
import { formatCurrency } from '@/lib/currency';
import ViewingChat from '@/components/ViewingChat';

interface Viewing {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyPrice: number;
    chatMessages?: { id: string; sender: string; text: string; timestamp: string }[];
    agentName: string;
    agentCompany: string;
    agentPhone: string;
    agentEmail: string;
    date: string;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed';
    notes?: string;
}

export default function ViewingsPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'confirmed' | 'scheduled' | 'completed' | 'cancelled'>('scheduled');
    const [isLoading, setIsLoading] = useState(true);
    const [viewingAppointments, setViewingAppointments] = useState<Viewing[]>([]);
    const [chatViewing, setChatViewing] = useState<Viewing | null>(null);
    const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; id?: string } | null>(null);

    useEffect(() => {
        async function load() {
            if (typeof window === 'undefined') return;
            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(userData);
            setCurrentUser(user);
                
                // Load viewing appointments from API and localStorage
                const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
                const quizResult = JSON.parse(localStorage.getItem('propReady_quizResult') || '{}');
                const sellerInfo = JSON.parse(localStorage.getItem('propReady_sellerInfo') || '{}');
                const quizPhone = (quizResult.phone || '').replace(/\s/g, '');
                const sellerPhone = (sellerInfo?.phone || '').replace(/\s/g, '');
                const matchViewing = (v: any) => {
                    const matchesBuyer = v.contactType === 'buyer' && (
                        (v.contactName && user.fullName && v.contactName.toLowerCase() === user.fullName.toLowerCase()) ||
                        (v.contactEmail && user.email && v.contactEmail.toLowerCase() === user.email.toLowerCase()) ||
                        (quizPhone && v.contactPhone && v.contactPhone.replace(/\s/g, '') === quizPhone)
                    );
                    const matchesSeller = v.contactType === 'seller' && (
                        (v.contactName && user.fullName && v.contactName.toLowerCase() === user.fullName.toLowerCase()) ||
                        (v.contactEmail && user.email && v.contactEmail.toLowerCase() === user.email.toLowerCase()) ||
                        (sellerPhone && v.contactPhone && v.contactPhone.replace(/\s/g, '') === sellerPhone)
                    );
                    return matchesBuyer || matchesSeller;
                };
                let apiViewings: any[] = [];
                try {
                    const res = await fetch(`/api/viewings?contactEmail=${encodeURIComponent(user.email)}`, { cache: 'no-store' });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && Array.isArray(data.viewings)) {
                        apiViewings = (data.viewings || []).filter(matchViewing);
                    }
                } catch (e) {
                    console.warn('Failed to load viewings from API', e);
                }
                const ids = new Set(apiViewings.map((v: any) => v.id));
                const localOnly = storedViewings.filter((v: any) => matchViewing(v) && !ids.has(v.id));
                const merged = [...apiViewings, ...localOnly];
                const userViewings = merged.map((v: any) => ({
                    id: v.id,
                    propertyTitle: v.propertyTitle,
                    propertyAddress: v.propertyAddress,
                    propertyPrice: v.propertyPrice ?? v.property_price ?? 0,
                    chatMessages: v.chatMessages ?? v.chat_messages ?? [],
                    agentName: 'Agent', // Could be enhanced to store agent info
                    agentCompany: 'PropReady',
                    agentPhone: '',
                    agentEmail: '',
                    date: v.date ?? v.viewing_date,
                    time: v.time ?? v.viewing_time,
                    status: v.status,
                    notes: v.notes
                }));
                
                setViewingAppointments(userViewings);
            setIsLoading(false);
        }
        load();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/70">Loading...</p>
                </div>
            </div>
        );
    }
    
    // Use only real viewing appointments from localStorage
    const viewings: Viewing[] = viewingAppointments;

    const getStatusBadge = (status: Viewing['status']) => {
        const badges = {
            scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock, label: 'Scheduled' },
            confirmed: { bg: 'bg-white/20', text: 'text-charcoal', icon: CheckCircle, label: 'Confirmed' },
            completed: { bg: 'bg-gold/20', text: 'text-gold', icon: CheckCircle, label: 'Completed' },
            cancelled: { bg: 'bg-gradient-to-r from-red-500/20 to-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Cancelled' }
        };

        const badge = badges[status];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const isUpcoming = (dateString: string, timeString: string) => {
        const viewingDateTime = new Date(`${dateString}T${timeString}`);
        return viewingDateTime > new Date();
    };

    const isToday = (dateString: string) => {
        const today = new Date();
        const viewingDate = new Date(dateString);
        return viewingDate.toDateString() === today.toDateString();
    };

    const isPast = (dateString: string, timeString: string) => {
        const viewingDateTime = new Date(`${dateString}T${timeString}`);
        return viewingDateTime < new Date();
    };

    const isCurrent = (dateString: string, timeString: string) => {
        return isToday(dateString) && !isPast(dateString, timeString);
    };

    const isFuture = (dateString: string, timeString: string) => {
        const viewingDateTime = new Date(`${dateString}T${timeString}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewingDate = new Date(viewingDateTime);
        viewingDate.setHours(0, 0, 0, 0);
        return viewingDate > today;
    };

    const confirmedViewings = viewings.filter(v => v.status === 'confirmed');
    const scheduledViewings = viewings.filter(v => v.status === 'scheduled');
    const completedViewings = viewings.filter(v => v.status === 'completed');
    const cancelledViewings = viewings.filter(v => v.status === 'cancelled');

    const getFilteredViewings = () => {
        switch (activeTab) {
            case 'confirmed':
                return confirmedViewings;
            case 'scheduled':
                return scheduledViewings;
            case 'completed':
                return completedViewings;
            case 'cancelled':
                return cancelledViewings;
            default:
                return scheduledViewings;
        }
    };

    const filteredViewings = getFilteredViewings();

    // Calendar functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getViewingsForDate = (date: Date) => {
        if (!date || isNaN(date.getTime())) return [];
        const dateString = date.toISOString().split('T')[0];
        return viewings.filter(v => v && v.date === dateString);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                            <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                                Properties
                            </Link>
                            <Link href="/learn" className="text-charcoal/90 hover:text-charcoal transition">
                                Learning Center | Buyers
                            </Link>
                            <Link
                                href="/sellers"
                                className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                For Sellers
                            </Link>
                            <Link href="/calculator" className="text-charcoal/90 hover:text-charcoal transition">
                                Bond Calculator
                            </Link>
                            <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <MobileNav
                            links={[
                                { href: '/search', label: 'Properties' },
                                { href: '/learn', label: 'Learning Center - Buyers' },
                                { href: '/learn/investors', label: 'Learning Center - Investors' },
                                { href: '/sellers', label: 'For Sellers', isButton: true },
                                { href: '/calculator', label: 'Bond Calculator' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ]}
                        />
                        <Link
                            href="/dashboard"
                            className="hidden sm:flex items-center space-x-2 text-charcoal/90 hover:text-charcoal transition"
                        >
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-6xl relative z-10">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            Viewing Appointments
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            Manage your property viewing appointments with agents
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <div className="premium-card rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Total Viewings</p>
                                    <p className="text-charcoal font-bold text-3xl">{viewings.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-gold" />
                                </div>
                            </div>
                        </div>
                        <div className="premium-card rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Confirmed</p>
                                    <p className="text-charcoal font-bold text-3xl">{confirmedViewings.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="premium-card rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Scheduled</p>
                                    <p className="text-charcoal font-bold text-3xl">{scheduledViewings.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="premium-card rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Completed</p>
                                    <p className="text-charcoal font-bold text-3xl">{completedViewings.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-gold" />
                                </div>
                            </div>
                        </div>
                        <div className="premium-card rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Cancelled</p>
                                    <p className="text-charcoal font-bold text-3xl">{cancelledViewings.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Section */}
                    <div className="rounded-3xl shadow-2xl border border-charcoal/10 bg-white/90 backdrop-blur-xl overflow-hidden mb-8">
                        {/* Calendar Header */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-8 py-5 md:py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white">
                                        Viewing Calendar
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-white font-semibold min-w-[200px] text-center px-4">{monthName}</span>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/30 transition-all duration-200 text-sm"
                                    >
                                        Today
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Body */}
                        <div className="px-6 md:px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="grid grid-cols-7 gap-2 mb-3">
                                {weekDays.map((day) => (
                                    <div key={day} className="text-center text-charcoal/70 font-semibold text-sm py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                            {/* Empty cells for days before month starts */}
                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                            ))}
                            
                            {/* Calendar days */}
                            {days.map((day) => {
                                const date = new Date(year, month, day);
                                const dateString = date.toISOString().split('T')[0];
                                const dayViewings = getViewingsForDate(date);
                                const isToday = dateString === new Date().toISOString().split('T')[0];
                                const isPast = date < new Date() && !isToday;
                                
                                return (
                                    <div
                                        key={day}
                                        className={`aspect-square rounded-xl p-2 border transition-all ${
                                            isToday
                                                ? 'bg-gradient-to-br from-gold/30 to-gold/20 border-gold/40 shadow-md'
                                                : dayViewings.length > 0
                                                ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
                                                : 'bg-white border-charcoal/10 hover:border-charcoal/20'
                                        } ${isPast ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex flex-col h-full">
                                            <span className={`text-sm font-semibold ${isToday ? 'text-gold font-bold' : 'text-charcoal'}`}>
                                                {day}
                                            </span>
                                            {dayViewings.length > 0 && (
                                                <div className="flex-1 flex items-center justify-center mt-1">
                                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                                        {dayViewings.slice(0, 3).map((viewing, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    viewing?.status === 'confirmed'
                                                                        ? 'bg-white'
                                                                        : viewing?.status === 'completed'
                                                                        ? 'bg-gold'
                                                                        : viewing?.status === 'cancelled'
                                                                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                                        : 'bg-blue-400'
                                                                }`}
                                                                title={`${viewing?.propertyTitle || 'Viewing'} - ${viewing?.time || ''}`}
                                                            />
                                                        ))}
                                                        {dayViewings.length > 3 && (
                                                            <span className="text-xs text-charcoal/70 font-medium">+{dayViewings.length - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 pt-6 border-t border-charcoal/10">
                                <p className="text-charcoal/70 text-sm mb-3 font-semibold">Legend:</p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                        <span className="text-charcoal/70">Scheduled</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white border border-charcoal/20"></div>
                                        <span className="text-charcoal/70">Confirmed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gold"></div>
                                        <span className="text-charcoal/70">Completed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-600"></div>
                                        <span className="text-charcoal/70">Cancelled</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events Tabs */}
                        <div className="mb-8">
                        <div className="premium-card rounded-xl p-6">
                            {/* Tabs */}
                            <div className="flex items-center gap-2 mb-6 border-b border-charcoal/20 pb-4 flex-wrap">
                                <button
                                    onClick={() => setActiveTab('confirmed')}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                        activeTab === 'confirmed'
                                            ? 'bg-gold text-white'
                                            : 'text-charcoal bg-white/50 hover:bg-white/70 border border-charcoal/20'
                                    }`}
                                >
                                    Confirmed ({confirmedViewings.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('scheduled')}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                        activeTab === 'scheduled'
                                            ? 'bg-gold text-white'
                                            : 'text-charcoal bg-white/50 hover:bg-white/70 border border-charcoal/20'
                                    }`}
                                >
                                    Scheduled ({scheduledViewings.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('completed')}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                        activeTab === 'completed'
                                            ? 'bg-gold text-white'
                                            : 'text-charcoal bg-white/50 hover:bg-white/70 border border-charcoal/20'
                                    }`}
                                >
                                    Completed ({completedViewings.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('cancelled')}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                        activeTab === 'cancelled'
                                            ? 'bg-gold text-white'
                                            : 'text-charcoal bg-white/50 hover:bg-white/70 border border-charcoal/20'
                                    }`}
                                >
                                    Cancelled ({cancelledViewings.length})
                                </button>
                            </div>

                            {/* Viewings List */}
                            {filteredViewings.length > 0 ? (
                            <div className="space-y-4">
                                    {filteredViewings.map((viewing) => {
                                        const isPastEvent = viewing.status === 'completed' || viewing.status === 'cancelled';
                                        return (
                                    <div
                                        key={viewing.id}
                                            className={`premium-card rounded-xl p-6 transition-all ${
                                                isPastEvent 
                                                    ? 'opacity-60' 
                                                    : ''
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-charcoal mb-1">{viewing.propertyTitle}</h3>
                                                        <p className="text-charcoal/50 text-sm flex items-center gap-1 mb-3">
                                                            <MapPin className="w-4 h-4" />
                                                            {viewing.propertyAddress}
                                                        </p>
                                                        <p className="text-gold font-bold text-xl">{(viewing.propertyPrice ?? 0) > 0 ? formatCurrency(viewing.propertyPrice) : '—'}</p>
                                                    </div>
                                                    {getStatusBadge(viewing.status)}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                                    <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-lg">
                                                        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-gold" />
                                                        </div>
                                                        <div>
                                                            <p className="text-charcoal/50 text-xs font-medium mb-1">Date</p>
                                                            <p className="text-charcoal font-semibold text-sm">{formatDate(viewing.date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-lg">
                                                        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                                                        <Clock className="w-5 h-5 text-gold" />
                                                        </div>
                                                        <div>
                                                            <p className="text-charcoal/50 text-xs font-medium mb-1">Time</p>
                                                            <p className="text-charcoal font-semibold text-sm">{viewing.time}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 mb-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <User className="w-4 h-4 text-gold" />
                                                        <p className="text-charcoal/50 text-xs font-medium uppercase tracking-wide">Agent</p>
                                                    </div>
                                                    <p className="text-charcoal font-bold text-base mb-1">{viewing.agentName}</p>
                                                    <p className="text-charcoal/50 text-sm">{viewing.agentCompany}</p>
                                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                                        <button
                                                            onClick={() => setChatViewing(viewing)}
                                                            className="p-2.5 rounded-lg bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-all shadow-sm font-semibold text-sm flex items-center gap-2"
                                                            title="Chat"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                            Chat
                                                        </button>
                                                        <a
                                                            href={`tel:${(viewing.agentPhone || '').replace(/\s/g, '')}`}
                                                            className="p-2.5 rounded-lg bg-white border border-charcoal/10 text-charcoal hover:bg-gold/10 hover:border-gold/30 transition-all shadow-sm"
                                                            title="Call Agent"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                        <a
                                                            href={`mailto:${viewing.agentEmail}`}
                                                            className="p-2.5 rounded-lg bg-white border border-charcoal/10 text-charcoal hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                                                            title="Email Agent"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </a>
                                                        {(viewing.agentPhone || '').replace(/\s/g, '').length > 0 && (
                                                            <a
                                                                href={`https://wa.me/${(viewing.agentPhone || '').replace(/\D/g, '').replace(/^0/, '27')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 rounded-lg bg-white border border-charcoal/10 text-charcoal hover:bg-green-50 hover:border-green-200 transition-all shadow-sm"
                                                                title="WhatsApp Agent"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {viewing.notes && (
                                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                            <p className="text-charcoal/70 text-sm leading-relaxed">{viewing.notes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                    })}
                            </div>
                            ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                        <p className="text-charcoal/70 text-lg mb-2">
                                            {activeTab === 'confirmed' && 'No confirmed events'}
                                            {activeTab === 'scheduled' && 'No scheduled events'}
                                            {activeTab === 'completed' && 'No completed events'}
                                            {activeTab === 'cancelled' && 'No cancelled events'}
                                        </p>
                                        <p className="text-charcoal/50 text-sm">
                                            {activeTab === 'confirmed' && 'You don\'t have any confirmed viewing appointments'}
                                            {activeTab === 'scheduled' && 'You don\'t have any scheduled viewing appointments'}
                                            {activeTab === 'completed' && 'You haven\'t completed any viewing appointments yet'}
                                            {activeTab === 'cancelled' && 'You don\'t have any cancelled viewing appointments'}
                                        </p>
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* No Viewings State */}
                    {viewings.length === 0 && (
                        <div className="premium-card rounded-xl p-12 text-center">
                            <Calendar className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                            <p className="text-charcoal/70 text-lg mb-2">No viewing appointments yet</p>
                            <p className="text-charcoal/50 text-sm mb-6">Schedule your first property viewing with an agent</p>
                            <Link
                                href="/search"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                <Building2 className="w-5 h-5" />
                                Browse Properties
                            </Link>
                        </div>
                    )}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>

            {/* Chat Modal */}
            {chatViewing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-charcoal">Chat - {chatViewing.propertyTitle}</h3>
                                <p className="text-charcoal/60 text-sm">{chatViewing.propertyAddress}</p>
                            </div>
                            <button
                                onClick={() => setChatViewing(null)}
                                className="p-2 rounded-lg hover:bg-charcoal/10 text-charcoal"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 p-4">
                            <ViewingChat
                                viewingId={chatViewing.id}
                                messages={chatViewing.chatMessages ?? []}
                                currentUserRole="contact"
                                onMessagesChange={(msgs) => {
                                    setViewingAppointments((prev) =>
                                        prev.map((v) => (v.id === chatViewing.id ? { ...v, chatMessages: msgs } : v))
                                    );
                                    setChatViewing((prev) => (prev ? { ...prev, chatMessages: msgs } : null));
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

