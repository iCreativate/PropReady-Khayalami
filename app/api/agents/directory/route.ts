import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';

/** Public directory of PPRA-verified / approved agents for seller valuation booking. */
export async function GET() {
    try {
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: true, agents: [] });
        }
        const { data, error } = await supabase
            .from('agents')
            .select(
                'id, full_name, email, phone, company, city, status, verification_status, ppra_number, eaab_number'
            )
            .eq('status', 'approved')
            .order('company');
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        const agents = (data || []).filter((a) => {
            const vs = String(a.verification_status || '').toLowerCase();
            return vs === 'verified' || vs === 'approved';
        });
        return NextResponse.json({ success: true, agents });
    } catch (err) {
        console.error('agents/directory:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
