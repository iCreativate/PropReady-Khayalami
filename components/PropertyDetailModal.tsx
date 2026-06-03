'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, MapPin, Bed, Bath, Square, Home, Calendar } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { logActivity } from '@/lib/activity';
import { useToast } from '@/components/providers/ToastProvider';

export interface PropertyDetail {
    id: string;
    title: string;
    address: string;
    type: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    size: number;
    description?: string;
    matchScore?: number;
}

interface PropertyDetailModalProps {
    property: PropertyDetail | null;
    onClose: () => void;
}

export default function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
    const router = useRouter();
    const { success } = useToast();

    if (!property) return null;

    const handleRequestViewing = () => {
        const user = getCurrentUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const quizData = JSON.parse(localStorage.getItem(STORAGE_KEYS.quizResult) || '{}');
        const appointment = {
            id: `viewing-${Date.now()}`,
            propertyId: property.id,
            propertyTitle: property.title,
            propertyAddress: property.address,
            contactName: user.fullName,
            contactEmail: user.email,
            contactPhone: quizData.phone || '',
            contactType: 'buyer' as const,
            date: '',
            time: '',
            notes: `Viewing request from property search: ${property.title}`,
            status: 'scheduled' as const,
            timestamp: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.viewingAppointments) || '[]');
        localStorage.setItem(STORAGE_KEYS.viewingAppointments, JSON.stringify([appointment, ...existing]));
        logActivity(`Requested viewing for ${property.title}`, user.id);
        success('Viewing request submitted. Your agent will confirm a date and time.');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="h-40 bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center relative">
                    <Home className="w-16 h-16 text-gold/50" />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-charcoal hover:bg-white"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-2xl font-bold text-gold mb-2">
                        R {property.price.toLocaleString('en-ZA')}
                    </p>
                    <h2 className="text-xl font-bold text-charcoal mb-2">{property.title}</h2>
                    <p className="text-charcoal/60 text-sm flex items-center gap-1 mb-4">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {property.address}
                    </p>

                    <div className="flex items-center gap-4 text-charcoal/60 text-sm mb-4">
                        <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" /> {property.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                            <Square className="w-4 h-4" /> {property.size}m²
                        </span>
                    </div>

                    {property.description && (
                        <p className="text-charcoal/70 text-sm mb-4">{property.description}</p>
                    )}

                    {property.matchScore !== undefined && property.matchScore > 0 && (
                        <p className="text-sm text-gold font-semibold mb-4">{property.matchScore}% match to your profile</p>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleRequestViewing}
                            className="w-full py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-5 h-5" />
                            Request Viewing
                        </button>
                        <Link
                            href="/dashboard/viewings"
                            onClick={onClose}
                            className="w-full py-3 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition text-center text-sm"
                        >
                            View my appointments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
