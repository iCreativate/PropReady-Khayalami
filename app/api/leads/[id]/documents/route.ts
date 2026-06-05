import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leadId } = await params;

    if (!leadId) {
        return NextResponse.json({ documents: [] });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({ documents: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, status, size, uploaded_at')
        .eq('user_id', leadId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.warn('Lead documents fetch failed:', error.message);
        return NextResponse.json({ documents: [] });
    }

    const documents = (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status ?? 'uploaded',
        size: row.size ?? undefined,
        uploadedAt: row.uploaded_at,
    }));

    return NextResponse.json({ documents });
}
