import { STORAGE_KEYS } from './storage-keys';

export interface ActivityItem {
    id: string;
    action: string;
    date: string;
    userId?: string;
    type?: 'buyer' | 'seller' | 'agent' | 'system';
}

function getActivities(): ActivityItem[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.activity) || '[]');
    } catch {
        return [];
    }
}

export function logActivity(action: string, userId?: string, type: ActivityItem['type'] = 'buyer') {
    if (typeof window === 'undefined') return;
    const items = getActivities();
    const entry: ActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action,
        date: new Date().toISOString(),
        userId,
        type,
    };
    const updated = [entry, ...items].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(updated));
}

export function getUserActivities(userId: string, limit = 5): ActivityItem[] {
    return getActivities()
        .filter((a) => !a.userId || a.userId === userId)
        .slice(0, limit);
}

export function formatActivityDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}
