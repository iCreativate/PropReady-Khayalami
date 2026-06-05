export interface ListedProperty {
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
    images?: string[];
    features?: string[];
    listingScore?: number;
    videoUrl?: string;
    published?: boolean;
}

export const PROPERTY_FEATURES = [
    'Parking',
    'Garden',
    'Security',
    'Pet Friendly',
    'Pool',
    'Garage',
    'Borehole',
    'Solar',
    'Fibre',
] as const;

export const EMPTY_PROPERTY_FORM = {
    title: '',
    address: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    description: '',
    images: [] as string[],
    features: [] as string[],
    videoUrl: '',
};
