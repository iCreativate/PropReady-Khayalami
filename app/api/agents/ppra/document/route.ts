import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import { assertAdmin } from '@/lib/admin-auth';

const BUCKET = 'ppra-documents';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');
    const agentEmail = searchParams.get('agentEmail');
    const adminEmail = searchParams.get('adminEmail');

    if (!storagePath) {
        return NextResponse.json({ success: false, error: 'path required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 503 });
    }

    if (adminEmail) {
        const auth = assertAdmin(adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
        }
    } else if (agentEmail) {
        const { data: agent } = await supabase
            .from('agents')
            .select('email, ffc_document_url')
            .eq('email', agentEmail)
            .maybeSingle();

        if (!agent?.ffc_document_url || agent.ffc_document_url !== storagePath) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }
    } else {
        return NextResponse.json(
            { success: false, error: 'agentEmail or adminEmail required' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 300);

    if (error || !data?.signedUrl) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Could not generate preview URL' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, signedUrl: data.signedUrl });
}
