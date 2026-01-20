'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, MapPin, Clock, User, Phone, Mail, MessageCircle, CheckCircle, XCircle, AlertCircle, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Viewing {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyPrice: number;
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
    const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; id?: string } | null>(null);

    useEffect(() => {
        // Check if user is logged in and load viewing appointments
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
            } else {
                const user = JSON.parse(userData);
                setCurrentUser(user);
                
                // Load viewing appointments from localStorage
                const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
                
                // Load quiz result to get phone number for matching
                const quizResult = JSON.parse(localStorage.getItem('propReady_quizResult') || '{}');
                const sellerInfo = JSON.parse(localStorage.getItem('propReady_sellerInfo') || '{}');
                
                // Filter viewings for this user (buyer or seller)
                const userViewings = storedViewings.filter((v: any) => {
                    const matchesBuyer = v.contactType === 'buyer' && (
                        v.contactName.toLowerCase() === user.fullName.toLowerCase() ||
                        v.contactEmail.toLowerCase() === user.email.toLowerCase() ||
                        (quizResult.phone && v.contactPhone.replace(/\s/g, '') === quizResult.phone.replace(/\s/g, ''))
                    );
                    
                    const matchesSeller = v.contactType === 'seller' && (
                        v.contactName.toLowerCase() === user.fullName.toLowerCase() ||
                        v.contactEmail.toLowerCase() === user.email.toLowerCase() ||
                        (sellerInfo.phone && v.contactPhone.replace(/\s/g, '') === sellerInfo.phone.replace(/\s/g, ''))
                    );
                    
                    return matchesBuyer || matchesSeller;
                }).map((v: any) => ({
                    id: v.id,
                    propertyTitle: v.propertyTitle,
                    propertyAddress: v.propertyAddress,
                    propertyPrice: 0, // Price not stored in viewing appointments
                    agentName: 'Agent', // Could be enhanced to store agent info
                    agentCompany: 'PropReady',
                    agentPhone: '',
                    agentEmail: '',
                    date: v.date,
                    time: v.time,
                    status: v.status,
                    notes: v.notes
                }));
                
                setViewingAppointments(userViewings);
                setIsLoading(false);
            }
        }
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
    
    // Use viewing appointments from localStorage, or fallback to mock data if none exist
    const viewings: Viewing[] = viewingAppointments.length > 0 ? viewingAppointments : [
        {
            id: '1',
            propertyTitle: 'Modern 2-Bedroom Apartment',
            propertyAddress: '123 Main Street, Sandton, Johannesburg',
            propertyPrice: 850000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-01-20',
            time: '14:00',
            status: 'confirmed',
            notes: 'Please arrive 10 minutes early. Parking available in front.'
        },
        {
            id: '2',
            propertyTitle: 'Spacious 3-Bedroom Townhouse',
            propertyAddress: '456 Oak Avenue, Rosebank, Johannesburg',
            propertyPrice: 1200000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-01-22',
            time: '10:30',
            status: 'scheduled',
            notes: 'First viewing. Property has a garden.'
        },
        {
            id: '3',
            propertyTitle: 'Luxury Penthouse',
            propertyAddress: '789 High Street, Sandton, Johannesburg',
            propertyPrice: 2500000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-01-18',
            time: '16:00',
            status: 'completed',
            notes: 'Viewing completed. Follow-up discussion scheduled.'
        },
        {
            id: '4',
            propertyTitle: 'Cozy 1-Bedroom Flat',
            propertyAddress: '321 Park Lane, Braamfontein, Johannesburg',
            propertyPrice: 650000,
            agentName: 'Thabo Mthembu',
            agentCompany: 'Urban Realty',
            agentPhone: '084 234 5678',
            agentEmail: 'thabo.mthembu@urbanrealty.co.za',
            date: '2026-01-15',
            time: '11:00',
            status: 'completed',
            notes: 'Great starter home option.'
        },
        {
            id: '5',
            propertyTitle: 'Family Home with Garden',
            propertyAddress: '555 Garden Road, Randburg, Johannesburg',
            propertyPrice: 1800000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-01-25',
            time: '15:00',
            status: 'confirmed',
            notes: 'Perfect for families. Large backyard.'
        },
        {
            id: '6',
            propertyTitle: 'Modern Studio Apartment',
            propertyAddress: '789 CBD Street, Johannesburg CBD',
            propertyPrice: 550000,
            agentName: 'Lisa van der Merwe',
            agentCompany: 'Coastal Estates',
            agentPhone: '081 345 6789',
            agentEmail: 'lisa.vandermerwe@coastalestates.co.za',
            date: '2026-01-17',
            time: '13:30',
            status: 'completed',
            notes: 'Compact and modern design.'
        },
        {
            id: '7',
            propertyTitle: 'Executive 4-Bedroom House',
            propertyAddress: '999 Prestige Avenue, Sandton, Johannesburg',
            propertyPrice: 3200000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-01-24',
            time: '09:00',
            status: 'scheduled',
            notes: 'Luxury property with pool and garden.'
        },
        {
            id: '8',
            propertyTitle: 'Affordable 2-Bedroom Unit',
            propertyAddress: '222 Affordable Street, Soweto, Johannesburg',
            propertyPrice: 750000,
            agentName: 'Thabo Mthembu',
            agentCompany: 'Urban Realty',
            agentPhone: '084 234 5678',
            agentEmail: 'thabo.mthembu@urbanrealty.co.za',
            date: '2026-01-19',
            time: '12:00',
            status: 'confirmed',
            notes: 'Great value for money.'
        },
        {
            id: '9',
            propertyTitle: 'Beachfront Apartment',
            propertyAddress: '777 Ocean Drive, Durban',
            propertyPrice: 1500000,
            agentName: 'Lisa van der Merwe',
            agentCompany: 'Coastal Estates',
            agentPhone: '081 345 6789',
            agentEmail: 'lisa.vandermerwe@coastalestates.co.za',
            date: '2026-01-21',
            time: '16:30',
            status: 'scheduled',
            notes: 'Stunning ocean views.'
        },
        {
            id: '10',
            propertyTitle: 'Investment Property',
            propertyAddress: '444 Investment Way, Midrand, Johannesburg',
            propertyPrice: 950000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-01-16',
            time: '14:30',
            status: 'cancelled',
            notes: 'Cancelled due to scheduling conflict.'
        },
        {
            id: '11',
            propertyTitle: 'Suburban Family Home',
            propertyAddress: '888 Family Road, Fourways, Johannesburg',
            propertyPrice: 2100000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-01-23',
            time: '10:00',
            status: 'confirmed',
            notes: 'Near schools and shopping centers.'
        },
        {
            id: '12',
            propertyTitle: 'Luxury Apartment Complex',
            propertyAddress: '111 Luxury Boulevard, Sandton, Johannesburg',
            propertyPrice: 2800000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-01-26',
            time: '11:30',
            status: 'scheduled',
            notes: 'Premium location with amenities.'
        },
        {
            id: '13',
            propertyTitle: 'Starter Home',
            propertyAddress: '333 Starter Street, Lenasia, Johannesburg',
            propertyPrice: 680000,
            agentName: 'Thabo Mthembu',
            agentCompany: 'Urban Realty',
            agentPhone: '084 234 5678',
            agentEmail: 'thabo.mthembu@urbanrealty.co.za',
            date: '2026-01-27',
            time: '15:30',
            status: 'scheduled',
            notes: 'Perfect for first-time buyers.'
        },
        {
            id: '14',
            propertyTitle: 'Penthouse with Views',
            propertyAddress: '666 Skyline Tower, Sandton, Johannesburg',
            propertyPrice: 4500000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-01-28',
            time: '17:00',
            status: 'confirmed',
            notes: 'Panoramic city views.'
        },
        {
            id: '15',
            propertyTitle: 'Townhouse Complex',
            propertyAddress: '999 Complex Road, Roodepoort, Johannesburg',
            propertyPrice: 1100000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-01-29',
            time: '09:30',
            status: 'scheduled',
            notes: 'Secure complex with facilities.'
        },
        {
            id: '16',
            propertyTitle: 'Modern Duplex',
            propertyAddress: '777 Duplex Drive, Bryanston, Johannesburg',
            propertyPrice: 1950000,
            agentName: 'Lisa van der Merwe',
            agentCompany: 'Coastal Estates',
            agentPhone: '081 345 6789',
            agentEmail: 'lisa.vandermerwe@coastalestates.co.za',
            date: '2026-01-30',
            time: '14:00',
            status: 'scheduled',
            notes: 'Spacious modern design.'
        },
        {
            id: '17',
            propertyTitle: 'Affordable Housing Unit',
            propertyAddress: '222 Housing Estate, Alexandra, Johannesburg',
            propertyPrice: 580000,
            agentName: 'Thabo Mthembu',
            agentCompany: 'Urban Realty',
            agentPhone: '084 234 5678',
            agentEmail: 'thabo.mthembu@urbanrealty.co.za',
            date: '2026-01-31',
            time: '13:00',
            status: 'confirmed',
            notes: 'Government housing scheme eligible.'
        },
        {
            id: '18',
            propertyTitle: 'Luxury Villa',
            propertyAddress: '555 Villa Lane, Sandton, Johannesburg',
            propertyPrice: 5500000,
            agentName: 'Michael Chen',
            agentCompany: 'Elite Properties',
            agentPhone: '083 123 4567',
            agentEmail: 'michael.chen@eliteproperties.co.za',
            date: '2026-02-01',
            time: '10:00',
            status: 'scheduled',
            notes: 'Ultra-luxury property with all amenities.'
        },
        {
            id: '19',
            propertyTitle: 'Compact 1-Bedroom',
            propertyAddress: '111 Compact Street, Hillbrow, Johannesburg',
            propertyPrice: 420000,
            agentName: 'Thabo Mthembu',
            agentCompany: 'Urban Realty',
            agentPhone: '084 234 5678',
            agentEmail: 'thabo.mthembu@urbanrealty.co.za',
            date: '2026-02-03',
            time: '12:30',
            status: 'scheduled',
            notes: 'Budget-friendly option.'
        },
        {
            id: '20',
            propertyTitle: 'Family Estate Home',
            propertyAddress: '888 Estate Road, Dainfern, Johannesburg',
            propertyPrice: 3800000,
            agentName: 'Sarah Johnson',
            agentCompany: 'Premier Real Estate',
            agentPhone: '082 456 7890',
            agentEmail: 'sarah.johnson@premierrealestate.co.za',
            date: '2026-02-05',
            time: '15:00',
            status: 'scheduled',
            notes: 'Gated estate with security.'
        }
    ];

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
                                Learning Center for Buyers
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
                                { href: '/learn', label: 'Learning Center for Buyers' },
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
                                                        <p className="text-gold font-bold text-xl">R {viewing.propertyPrice.toLocaleString('en-ZA')}</p>
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
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <a
                                                            href={`tel:${viewing.agentPhone.replace(/\s/g, '')}`}
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
                                                        <a
                                                            href={`https://wa.me/${viewing.agentPhone.replace(/\s/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 rounded-lg bg-white border border-charcoal/10 text-charcoal hover:bg-green-50 hover:border-green-200 transition-all shadow-sm"
                                                            title="WhatsApp Agent"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </a>
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
        </div>
    );
}

