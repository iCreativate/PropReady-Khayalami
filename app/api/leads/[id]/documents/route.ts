import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import { agentHasDocumentAccess } from '@/lib/document-grants-server';
import { fetchDocumentsForUser } from '@/lib/documents-db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leadId } = await params;
    const agentId = request.nextUrl.searchParams.get('agentId')?.trim();

    if (!leadId) {
        return NextResponse.json({ documents: [], accessGranted: false });
    }

    // Agents must have an active grant; buyers/owners call without agentId (owner path).
    if (agentId) {
        const allowed = await agentHasDocumentAccess(leadId, agentId);
        if (!allowed) {
            return NextResponse.json({
                documents: [],
                accessGranted: false,
                reason:
                    'Buyer has not shared documents yet. A viewing must exist and the buyer must agree to work with you.',
            });
        }
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ documents: [], accessGranted: !agentId });
    }

    const { data, error } = await fetchDocumentsForUser(supabase, leadId);

    if (error) {
        console.warn('Lead documents fetch failed:', error);
        return NextResponse.json({ documents: [], accessGranted: Boolean(agentId) || !agentId });
    }

    const documents = data.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        type: row.type,
        status: (row.status as string) ?? 'uploaded',
        size: row.size != null ? String(row.size) : undefined,
        uploadedAt: row.uploaded_at,
        verificationMeta: row.verification_meta ?? undefined,
        // Never expose raw storage paths to agents without going through signed download.
        url: null,
    }));

    return NextResponse.json({
        documents,
        accessGranted: agentId ? true : true,
    });
}
