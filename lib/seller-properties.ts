/** Multi-property store for seller portal (not marketplace listings). */

import { STORAGE_KEYS } from '@/lib/storage-keys';

export type SellerProperty = {
    id: string;
    userId: string;
    email?: string;
    fullName?: string;
    phone?: string;
    propertyAddress: string;
    propertySuburb?: string;
    suburb?: string;
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    landSize?: string;
    buildingSize?: string;
    propertySize?: string;
    currentValue?: string;
    askingPrice?: string;
    reasonForSelling?: string;
    timeline?: string;
    hasBond?: boolean;
    bondBalance?: string;
    propertyCondition?: string;
    propertyDescription?: string;
    isSeller?: boolean;
    createdAt: string;
    updatedAt: string;
};

export type SellerPropertyInput = Partial<SellerProperty> & {
    propertyAddress: string;
    userId: string;
};

function safeParseArray(raw: string | null): unknown[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function asSellerProperty(row: Record<string, unknown>, fallbackUserId = ''): SellerProperty | null {
    const address = String(row.propertyAddress || '').trim();
    if (!address) return null;
    const now = new Date().toISOString();
    const id = String(row.id || `seller-prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const userId = String(row.userId || row.id || fallbackUserId || '');
    return {
        id,
        userId,
        email: row.email != null ? String(row.email) : undefined,
        fullName: row.fullName != null ? String(row.fullName) : undefined,
        phone: row.phone != null ? String(row.phone) : undefined,
        propertyAddress: address,
        propertySuburb: String(row.propertySuburb || row.suburb || ''),
        suburb: String(row.suburb || row.propertySuburb || ''),
        propertyType: row.propertyType != null ? String(row.propertyType) : undefined,
        bedrooms: row.bedrooms != null ? String(row.bedrooms) : undefined,
        bathrooms: row.bathrooms != null ? String(row.bathrooms) : undefined,
        landSize: row.landSize != null ? String(row.landSize) : undefined,
        buildingSize: row.buildingSize != null ? String(row.buildingSize) : undefined,
        propertySize: row.propertySize != null ? String(row.propertySize) : undefined,
        currentValue: String(row.currentValue || row.askingPrice || ''),
        askingPrice: String(row.askingPrice || row.currentValue || ''),
        reasonForSelling: row.reasonForSelling != null ? String(row.reasonForSelling) : undefined,
        timeline: row.timeline != null ? String(row.timeline) : undefined,
        hasBond: Boolean(row.hasBond),
        bondBalance: row.bondBalance != null ? String(row.bondBalance) : undefined,
        propertyCondition: row.propertyCondition != null ? String(row.propertyCondition) : undefined,
        propertyDescription: row.propertyDescription != null ? String(row.propertyDescription) : undefined,
        isSeller: true,
        createdAt: String(row.createdAt || row.timestamp || now),
        updatedAt: String(row.updatedAt || row.timestamp || now),
    };
}

/** Sync active property into legacy sellerInfo for existing gates. */
export function syncActiveSellerInfo(property: SellerProperty | null) {
    if (typeof window === 'undefined') return;
    if (!property) {
        localStorage.removeItem(STORAGE_KEYS.sellerInfo);
        return;
    }
    const sellerInfo = {
        id: property.userId,
        fullName: property.fullName,
        email: property.email,
        phone: property.phone || '',
        propertyAddress: property.propertyAddress,
        suburb: property.propertySuburb || property.suburb || '',
        propertySuburb: property.propertySuburb || property.suburb || '',
        propertySize: property.propertySize || property.buildingSize || property.landSize || '',
        propertyCondition: property.propertyCondition,
        propertyDescription: property.propertyDescription,
        askingPrice: property.askingPrice || property.currentValue || '',
        currentValue: property.currentValue || property.askingPrice || '',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        landSize: property.landSize,
        buildingSize: property.buildingSize,
        propertyType: property.propertyType,
        reasonForSelling: property.reasonForSelling,
        timeline: property.timeline,
        hasBond: property.hasBond,
        bondBalance: property.bondBalance,
        isSeller: true,
        activePropertyId: property.id,
        timestamp: property.updatedAt,
    };
    localStorage.setItem(STORAGE_KEYS.sellerInfo, JSON.stringify(sellerInfo));
}

function writeList(list: SellerProperty[]) {
    localStorage.setItem(STORAGE_KEYS.sellerProperties, JSON.stringify(list));
    const activeId = localStorage.getItem(STORAGE_KEYS.activeSellerPropertyId);
    const active =
        (activeId && list.find((p) => p.id === activeId)) || list[0] || null;
    if (active) {
        localStorage.setItem(STORAGE_KEYS.activeSellerPropertyId, active.id);
    } else {
        localStorage.removeItem(STORAGE_KEYS.activeSellerPropertyId);
    }
    syncActiveSellerInfo(active);
}

/** Migrate legacy sellerInfo + quizzes into the multi-property array once. */
export function migrateSellerProperties(userId: string): SellerProperty[] {
    if (typeof window === 'undefined') return [];

    const existing = safeParseArray(localStorage.getItem(STORAGE_KEYS.sellerProperties))
        .map((row) => asSellerProperty(row as Record<string, unknown>, userId))
        .filter((p): p is SellerProperty => Boolean(p))
        .filter((p) => !userId || p.userId === userId || !p.userId);

    if (existing.length > 0) {
        writeList(existing);
        return existing;
    }

    const migrated: SellerProperty[] = [];
    const seenAddresses = new Set<string>();

    try {
        const raw = localStorage.getItem(STORAGE_KEYS.sellerInfo);
        if (raw) {
            const info = JSON.parse(raw) as Record<string, unknown>;
            const prop = asSellerProperty(
                {
                    ...info,
                    id: info.activePropertyId || `seller-prop-legacy-${userId}`,
                    userId,
                },
                userId
            );
            if (prop) {
                migrated.push(prop);
                seenAddresses.add(prop.propertyAddress.toLowerCase());
            }
        }
    } catch {
        /* ignore */
    }

    for (const row of safeParseArray(localStorage.getItem(STORAGE_KEYS.propertyQuizzes))) {
        const quiz = row as Record<string, unknown>;
        const quizUser = String(quiz.userId || '');
        if (userId && quizUser && quizUser !== userId) continue;
        const prop = asSellerProperty(
            {
                ...quiz,
                userId: quizUser || userId,
                askingPrice: quiz.askingPrice,
                currentValue: quiz.askingPrice,
                propertySuburb: quiz.propertySuburb || quiz.suburb,
            },
            userId
        );
        if (!prop) continue;
        const key = prop.propertyAddress.toLowerCase();
        if (seenAddresses.has(key)) continue;
        seenAddresses.add(key);
        migrated.push(prop);
    }

    writeList(migrated);
    return migrated;
}

export function listSellerProperties(userId: string): SellerProperty[] {
    if (typeof window === 'undefined') return [];
    const list = migrateSellerProperties(userId);
    return list.filter((p) => !userId || p.userId === userId || !p.userId);
}

export function getActiveSellerProperty(userId: string): SellerProperty | null {
    const list = listSellerProperties(userId);
    if (!list.length) return null;
    const activeId = localStorage.getItem(STORAGE_KEYS.activeSellerPropertyId);
    return (activeId && list.find((p) => p.id === activeId)) || list[0] || null;
}

export function setActiveSellerProperty(userId: string, propertyId: string): SellerProperty | null {
    const list = listSellerProperties(userId);
    const found = list.find((p) => p.id === propertyId) || null;
    if (!found) return null;
    localStorage.setItem(STORAGE_KEYS.activeSellerPropertyId, found.id);
    syncActiveSellerInfo(found);
    return found;
}

export function upsertSellerProperty(input: SellerPropertyInput): SellerProperty {
    const userId = input.userId;
    const list = listSellerProperties(userId);
    const now = new Date().toISOString();
    const id = input.id || `seller-prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const idx = list.findIndex((p) => p.id === id);

    const next: SellerProperty = {
        ...(idx >= 0 ? list[idx] : {}),
        ...input,
        id,
        userId,
        propertyAddress: input.propertyAddress.trim(),
        propertySuburb: input.propertySuburb || input.suburb || '',
        suburb: input.suburb || input.propertySuburb || '',
        currentValue: input.currentValue || input.askingPrice || '',
        askingPrice: input.askingPrice || input.currentValue || '',
        isSeller: true,
        createdAt: idx >= 0 ? list[idx].createdAt : now,
        updatedAt: now,
    };

    if (idx >= 0) list[idx] = next;
    else list.push(next);

    writeList(list);
    setActiveSellerProperty(userId, next.id);
    return next;
}

export function deleteSellerProperty(userId: string, propertyId: string): SellerProperty[] {
    const list = listSellerProperties(userId).filter((p) => p.id !== propertyId);
    writeList(list);
    return list;
}

export function sellerPropertyToFormDefaults(property?: SellerProperty | null) {
    if (!property) {
        return {
            propertyAddress: '',
            propertySuburb: '',
            propertySize: '',
            propertyCondition: '',
            propertyDescription: '',
            askingPrice: '',
            bedrooms: '',
            bathrooms: '',
        };
    }
    return {
        propertyAddress: property.propertyAddress || '',
        propertySuburb: property.propertySuburb || property.suburb || '',
        propertySize: property.propertySize || property.buildingSize || property.landSize || '',
        propertyCondition: property.propertyCondition || '',
        propertyDescription: property.propertyDescription || '',
        askingPrice: property.askingPrice || property.currentValue || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
    };
}
