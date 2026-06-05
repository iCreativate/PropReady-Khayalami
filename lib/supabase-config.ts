/**
 * Shared Supabase env — supports legacy anon key and new publishable key.
 */
export function getSupabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
}

export function getSupabaseAnonKey(): string {
    return (
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
        ''
    );
}

export function isSupabaseConfigured(): boolean {
    const url = getSupabaseUrl();
    return url.startsWith('https://') && getSupabaseAnonKey().length > 20;
}
