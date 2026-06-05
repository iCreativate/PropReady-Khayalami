import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from '@/lib/supabase-config';

export function createServiceClient(): SupabaseClient | null {
    const url = getSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url.startsWith('https://') || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}
