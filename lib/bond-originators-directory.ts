import type { SupabaseClient } from '@supabase/supabase-js';
import { BOND_ORIGINATORS, type BondOriginator } from '@/lib/bond-originators';
import { filterDemoOriginators } from '@/lib/originator-exclusions';

/** Bond originator brands with at least one approved, non-demo staff member. */
export async function listLiveBondOriginatorBrands(
    supabase: SupabaseClient
): Promise<BondOriginator[]> {
    const { data, error } = await supabase
        .from('originators')
        .select('id, email, organization_id, status')
        .eq('status', 'approved');

    if (error || !data?.length) {
        return [];
    }

    const orgIds = new Set<string>();
    for (const row of filterDemoOriginators(data)) {
        const orgId = String(row.organization_id || '').trim();
        if (orgId) orgIds.add(orgId);
    }

    if (orgIds.size === 0) {
        return [];
    }

    return BOND_ORIGINATORS.filter((originator) => orgIds.has(originator.id));
}

export async function isLiveBondOriginatorBrand(
    supabase: SupabaseClient,
    organizationId: string
): Promise<boolean> {
    const id = organizationId.trim();
    if (!id) return false;
    const brands = await listLiveBondOriginatorBrands(supabase);
    return brands.some((brand) => brand.id === id);
}
