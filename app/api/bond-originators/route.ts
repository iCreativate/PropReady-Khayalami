import { NextResponse } from 'next/server';
import { listLiveBondOriginatorBrands } from '@/lib/bond-originators-directory';
import { createServiceClient } from '@/lib/supabase-admin';

/** Public directory — only brands with approved, non-demo originator staff. */
export async function GET() {
    try {
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: true, originators: [] });
        }

        const originators = await listLiveBondOriginatorBrands(supabase);
        return NextResponse.json({ success: true, originators });
    } catch (err) {
        console.error('GET /api/bond-originators:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
