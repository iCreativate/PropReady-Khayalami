const STORAGE_KEY = 'propready_favourite_properties';

function readIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
        return new Set();
    }
}

function writeIds(ids: Set<string>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function isFavouriteProperty(id: string): boolean {
    return readIds().has(id);
}

export function toggleFavouriteProperty(id: string): boolean {
    const ids = readIds();
    if (ids.has(id)) {
        ids.delete(id);
        writeIds(ids);
        return false;
    }
    ids.add(id);
    writeIds(ids);
    return true;
}
