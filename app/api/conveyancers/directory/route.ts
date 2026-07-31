import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';

/** Public directory of approved conveyancer accounts. */
export async function GET() {
    try {
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: true, conveyancers: [] });
        }
        const { data, error } = await supabase
            .from('conveyancers')
            .select(
                'id, full_name, email, firm_name, firm_slug, phone, province, city, suburb, bio, website, languages, specialisations, status, verified_at, profile_completion'
            )
            .eq('status', 'approved')
            .order('firm_name');
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, conveyancers: data || [] });
    } catch (err) {
        console.error('conveyancers/directory:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
