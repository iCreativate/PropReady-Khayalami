import type { ChatMessage } from '@/components/ViewingChat';

export interface ViewingAppointment {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyPrice?: number;
    chatMessages?: ChatMessage[];
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contactType: 'buyer' | 'seller';
    date: string;
    time: string;
    notes: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    timestamp: string;
    buyerLeadId?: string | null;
    sellerLeadId?: string | null;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    sellerName?: string;
    sellerEmail?: string;
    sellerPhone?: string;
    buyerConfirmedAt?: string | null;
    sellerConfirmedAt?: string | null;
}

export const EMPTY_VIEWING_FORM = {
    propertyId: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactType: 'buyer' as 'buyer' | 'seller',
    buyerLeadId: '',
    sellerLeadId: '',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    sellerName: '',
    sellerEmail: '',
    sellerPhone: '',
    date: '',
    time: '',
    notes: '',
};
