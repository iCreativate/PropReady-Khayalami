import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';

const SELECT_COLS =
    'id, full_name, email, firm_name, firm_slug, phone, province, city, suburb, bio, website, languages, specialisations, status, verified_at, profile_completion';

/** Public directory of approved conveyancer accounts. Optional ?slug= or ?id= for one firm. */
export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: true, conveyancers: [] });
        }

        const slug = request.nextUrl.searchParams.get('slug')?.trim();
        const id = request.nextUrl.searchParams.get('id')?.trim();

        if (slug || id) {
            let query = supabase.from('conveyancers').select(SELECT_COLS).eq('status', 'approved');
            if (id) query = query.eq('id', id);
            else if (slug) query = query.or(`firm_slug.eq.${slug},id.eq.${slug}`);

            const { data, error } = await query.maybeSingle();
            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
            if (!data) {
                return NextResponse.json({ success: false, error: 'Firm not found' }, { status: 404 });
            }
            return NextResponse.json({ success: true, conveyancer: data });
        }

        const { data, error } = await supabase
            .from('conveyancers')
            .select(SELECT_COLS)
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
