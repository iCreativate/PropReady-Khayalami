export type ProvinceSlug =
    | 'gauteng'
    | 'western-cape'
    | 'kwazulu-natal'
    | 'eastern-cape'
    | 'free-state'
    | 'limpopo'
    | 'mpumalanga'
    | 'north-west'
    | 'northern-cape';

export type Specialty =
    | 'residential'
    | 'commercial'
    | 'bond-registration'
    | 'bond-cancellation'
    | 'estate-transfers'
    | 'developments'
    | 'sectional-title'
    | 'deceased-estates'
    | 'investment-property'
    | 'family-transfers'
    | 'divorce-transfers'
    | 'trust-transfers'
    | 'portfolio';

export type ConsultationType = 'virtual' | 'office' | 'phone';

export type PriceBand = 1 | 2 | 3 | 4;

export type SortMode =
    | 'best-rated'
    | 'fastest-transfer'
    | 'most-experienced'
    | 'most-reviews'
    | 'lowest-fees'
    | 'nearest'
    | 'recently-active';

export type TransferStageId =
    | 'offer-accepted'
    | 'instruction-received'
    | 'fica-submitted'
    | 'documents-prepared'
    | 'bond-approved'
    | 'guarantees-issued'
    | 'lodgement'
    | 'registration'
    | 'funds-released'
    | 'transfer-complete';

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface OfficeLocation {
    label: string;
    address: string;
    suburb: string;
    city: string;
    province: ProvinceSlug;
    coords: GeoPoint;
}

export interface ReviewAxes {
    communication: number;
    professionalism: number;
    transparency: number;
    value: number;
    speed: number;
    knowledge: number;
    overall: number;
}

export interface ConveyancerReview {
    id: string;
    author: string;
    role: 'buyer' | 'seller' | 'investor' | 'agent' | 'developer';
    rating: number;
    axes: ReviewAxes;
    title: string;
    body: string;
    date: string;
    verified: boolean;
    helpful: number;
    response?: string;
}

export interface PerformanceMetrics {
    avgTransferDays: number;
    avgResponseHours: number;
    clientSatisfactionPct: number;
    repeatClientPct: number;
    transfersCompleted: number;
    successRatePct: number;
    currentWorkload: number;
    monthlyCases: number;
    avgReview: number;
    yearsActive: number;
    responseRatePct: number;
}

export interface ConveyancerProfile {
    id: string;
    slug: string;
    firmName: string;
    attorneyName: string;
    title: string;
    verified: boolean;
    featured: boolean;
    logoInitials: string;
    photoInitials: string;
    accent: string;
    rating: number;
    reviewCount: number;
    completedTransfers: number;
    yearsInPractice: number;
    province: ProvinceSlug;
    city: string;
    suburb: string;
    languages: string[];
    avgResponseHours: number;
    avgTransferDays: number;
    priceBand: PriceBand;
    acceptingNewClients: boolean;
    openToday: boolean;
    onlineConsultation: boolean;
    availability: 'available' | 'limited' | 'busy';
    specialisations: Specialty[];
    bio: string;
    firmHistory: string;
    qualifications: string[];
    education: string[];
    memberships: string[];
    awards: string[];
    licences: string[];
    offices: OfficeLocation[];
    services: Specialty[];
    performance: PerformanceMetrics;
    reviews: ConveyancerReview[];
    documents: Array<{ label: string; type: string }>;
    phone: string;
    email: string;
    website: string;
    lastActiveAt: string;
    coords: GeoPoint;
}

export interface BrowseFilters {
    query: string;
    province: ProvinceSlug | '';
    city: string;
    suburb: string;
    minRating: number;
    minExperience: number;
    minTransfers: number;
    languages: string[];
    specialities: Specialty[];
    consultationTypes: ConsultationType[];
    maxPriceBand: PriceBand | 0;
    openToday: boolean;
    acceptingNewClients: boolean;
    verifiedOnly: boolean;
    sort: SortMode;
}

export interface MatchAnswers {
    intent: 'buying' | 'selling' | 'investing' | 'developing' | 'agent';
    province: ProvinceSlug | '';
    propertyValue: number;
    timelineWeeks: number;
    propertyType: 'residential' | 'commercial' | 'development' | 'investment';
    budgetBand: PriceBand | 0;
    specialRequirements: Specialty[];
}

export type MatchBucket =
    | 'best-overall'
    | 'fastest'
    | 'best-value'
    | 'highest-rated'
    | 'most-experienced';

export interface MatchRecommendation {
    bucket: MatchBucket;
    profile: ConveyancerProfile;
    score: number;
    reasons: string[];
}

export interface FeeEstimateInput {
    propertyValue: number;
    bondAmount: number;
    priceBand: PriceBand;
}

export interface FeeEstimateLine {
    id: string;
    label: string;
    amount: number;
    explanation: string;
}

export interface FeeEstimate {
    lines: FeeEstimateLine[];
    subtotal: number;
    vat: number;
    total: number;
}

export interface QuoteRequest {
    id: string;
    firmIds: string[];
    propertyType: string;
    location: string;
    purchasePrice: number;
    bondAmount: number;
    timeline: string;
    notes: string;
    createdAt: string;
    status: 'submitted' | 'received' | 'accepted';
}

export interface ConsultationBooking {
    id: string;
    firmId: string;
    type: ConsultationType;
    slot: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    createdAt: string;
    status: 'confirmed' | 'reminder';
}

export interface MessageThreadStub {
    id: string;
    firmId: string;
    messages: Array<{ id: string; from: 'user' | 'firm'; body: string; at: string }>;
}

export interface TransferTrackerState {
    firmId: string | null;
    propertyLabel: string;
    currentStageIndex: number;
    stages: Array<{
        id: TransferStageId;
        completed: boolean;
        completedAt?: string;
        expectedAt?: string;
        responsible: string;
        documents: string[];
    }>;
    notifications: Array<{ id: string; text: string; at: string }>;
}

export interface CcUserState {
    savedIds: string[];
    compareIds: string[];
    notes: Record<string, string>;
    recentSearches: string[];
    quotes: QuoteRequest[];
    bookings: ConsultationBooking[];
    threads: MessageThreadStub[];
    matchAnswers: MatchAnswers | null;
    tracker: TransferTrackerState | null;
    darkMode: boolean;
}

export const SPECIALTY_LABELS: Record<Specialty, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    'bond-registration': 'Bond Registration',
    'bond-cancellation': 'Bond Cancellation',
    'estate-transfers': 'Estate Transfers',
    developments: 'Developments',
    'sectional-title': 'Sectional Title',
    'deceased-estates': 'Deceased Estates',
    'investment-property': 'Investment Property',
    'family-transfers': 'Family Transfers',
    'divorce-transfers': 'Transfers after Divorce',
    'trust-transfers': 'Trust Transfers',
    portfolio: 'Property Portfolio',
};

export const PROVINCE_LABELS: Record<ProvinceSlug, string> = {
    gauteng: 'Gauteng',
    'western-cape': 'Western Cape',
    'kwazulu-natal': 'KwaZulu-Natal',
    'eastern-cape': 'Eastern Cape',
    'free-state': 'Free State',
    limpopo: 'Limpopo',
    mpumalanga: 'Mpumalanga',
    'north-west': 'North West',
    'northern-cape': 'Northern Cape',
};

export const SORT_LABELS: Record<SortMode, string> = {
    'best-rated': 'Best Rated',
    'fastest-transfer': 'Fastest Transfer',
    'most-experienced': 'Most Experienced',
    'most-reviews': 'Most Reviews',
    'lowest-fees': 'Lowest Fees',
    nearest: 'Nearest',
    'recently-active': 'Recently Active',
};

export const DEFAULT_FILTERS: BrowseFilters = {
    query: '',
    province: '',
    city: '',
    suburb: '',
    minRating: 0,
    minExperience: 0,
    minTransfers: 0,
    languages: [],
    specialities: [],
    consultationTypes: [],
    maxPriceBand: 0,
    openToday: false,
    acceptingNewClients: false,
    verifiedOnly: false,
    sort: 'best-rated',
};
