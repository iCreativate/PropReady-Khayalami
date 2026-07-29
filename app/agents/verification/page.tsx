'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Upload,
    CheckCircle,
    FileText,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import PpraVerificationBadge from '@/components/PpraVerificationBadge';
import {
    validatePpraNumber,
    validateFfcNumber,
    normalizePpraNumber,
    normalizeFfcNumber,
    PPRA_NUMBER_ERROR,
    FFC_NUMBER_ERROR,
    FFC_DOCUMENT_MAX_BYTES,
    isAgentPpraVerified,
    type AgentPpraFields,
} from '@/lib/ppra';
import {
    AGENT_PAGE_CONTAINER,
    AGENT_FORM_SECTION,
    AGENT_FORM_SECTION_HEADER,
    AGENT_FORM_INPUT,
    AGENT_PRIMARY_BTN,
    AGENT_BADGE,
    AGENT_CARD_SOFT,
} from '@/lib/agent-portal-ui';
import PortalLoading from '@/components/PortalLoading';

export default function AgentVerificationPage() {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentPpraFields & { id?: string; fullName?: string; email?: string } | null>(
        null
    );
    const [ppraNumber, setPpraNumber] = useState('');
    const [ffcNumber, setFfcNumber] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const raw = localStorage.getItem('propReady_currentAgent');
        if (!raw) {
            router.replace('/agents/login');
            return;
        }
        const a = JSON.parse(raw);
        setAgent(a);
        setPpraNumber(a.ppraNumber || a.eaabNumber || '');
        setFfcNumber(a.ffcNumber || '');
    }, [router]);

    const steps = [
        { label: 'Account', done: true },
        { label: 'PPRA details', done: !!ppraNumber },
        { label: 'FFC upload', done: !!(agent?.ffcDocumentUrl || file) },
        { label: 'Review', done: isAgentPpraVerified(agent) },
    ];

    const handleUpload = async (agentId: string) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('agentId', agentId);
        const res = await fetch('/api/agents/ppra/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data.storagePath as string;
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        const ppra = normalizePpraNumber(ppraNumber);
        if (!validatePpraNumber(ppra)) newErrors.ppraNumber = PPRA_NUMBER_ERROR;
        if (ffcNumber.trim() && !validateFfcNumber(ffcNumber)) newErrors.ffcNumber = FFC_NUMBER_ERROR;
        if (!agent?.ffcDocumentUrl && !file) newErrors.file = 'Upload your Fidelity Fund Certificate';
        if (file && file.size > FFC_DOCUMENT_MAX_BYTES) newErrors.file = 'File must be 10MB or smaller';
        setErrors(newErrors);
        if (Object.keys(newErrors).length || !agent?.id) return;

        setUploading(true);
        setMessage('');
        try {
            let docPath = agent.ffcDocumentUrl;
            if (file) docPath = await handleUpload(agent.id!);

            const updated = {
                ...agent,
                ppraNumber: ppra,
                eaabNumber: ppra,
                ffcNumber: ffcNumber.trim() ? normalizeFfcNumber(ffcNumber) : undefined,
                ffcDocumentUrl: docPath,
                verificationStatus: 'pending',
            };
            localStorage.setItem('propReady_currentAgent', JSON.stringify(updated));

            const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const idx = agents.findIndex((x: { id: string }) => x.id === agent.id);
            if (idx >= 0) {
                agents[idx] = { ...agents[idx], ...updated };
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }

            setAgent(updated);
            setMessage('Submitted for PPRA review. You will be notified once verified.');
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setUploading(false);
        }
    };

    if (!agent) {
        return <PortalLoading message="Loading verification…" variant="dashboard" />;
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <header className="border-b border-charcoal/[0.06] bg-white px-4 py-4">
                <div className={`${AGENT_PAGE_CONTAINER} !pb-0 flex items-center gap-4`}>
                    <Link
                        href="/agents/dashboard"
                        className="inline-flex items-center gap-1.5 text-charcoal/55 hover:text-charcoal text-sm font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className={`${AGENT_PAGE_CONTAINER} max-w-[720px] pt-8 sm:pt-10`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gold/[0.08] border border-gold/10 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-gold" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/45 mb-1">
                            Compliance
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal tracking-tight">
                            PPRA verification
                        </h1>
                        <p className="text-charcoal/45 text-sm mt-1">
                            Build trust with buyers and sellers on PropReady
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {steps.map((s, i) => (
                        <div
                            key={s.label}
                            className={`${AGENT_BADGE} flex-shrink-0 gap-2 px-3 py-2 h-auto ${
                                s.done
                                    ? 'bg-emerald-500/[0.08] text-emerald-700 border border-emerald-500/15'
                                    : 'bg-charcoal/[0.03] text-charcoal/50 border border-charcoal/[0.06]'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-semibold">
                                {s.done ? <CheckCircle className="w-3 h-3" /> : i + 1}
                            </span>
                            {s.label}
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    <PpraVerificationBadge agent={agent} />
                </div>

                {isAgentPpraVerified(agent) ? (
                    <div className={`${AGENT_CARD_SOFT} p-6 sm:p-8 border-emerald-500/15 bg-emerald-500/[0.04]`}>
                        <p className="text-emerald-800 font-semibold">You are PPRA verified on PropReady.</p>
                        <p className="text-emerald-700/80 text-sm mt-2 leading-relaxed">
                            You can access leads and appear in search results.
                        </p>
                        <Link
                            href="/agents/dashboard"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-gold hover:text-gold-600 transition"
                        >
                            Go to dashboard
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Link>
                    </div>
                ) : (
                    <div className={AGENT_FORM_SECTION}>
                        <div className={AGENT_FORM_SECTION_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal tracking-tight">
                                Submit verification details
                            </h2>
                            <p className="text-charcoal/45 text-sm mt-1">
                                Your documents are stored securely and reviewed by our team.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8 space-y-5">
                        {(agent.verificationStatus as string) === 'rejected' && (
                            <p className="text-red-700 text-sm flex items-start gap-2 bg-red-500/[0.06] border border-red-500/15 p-4 rounded-2xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                {agent.verificationNotes || 'Verification failed. Update your details and resubmit.'}
                            </p>
                        )}

                        <div>
                            <label className="block font-semibold text-charcoal text-sm mb-1.5">
                                PPRA Practitioner Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={ppraNumber}
                                onChange={(e) => setPpraNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                                maxLength={7}
                                inputMode="numeric"
                                className={`${AGENT_FORM_INPUT} !pl-4 font-mono ${errors.ppraNumber ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                                placeholder="7 digits"
                            />
                            {errors.ppraNumber && (
                                <p className="text-red-600 text-sm mt-1">{errors.ppraNumber}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-charcoal text-sm mb-1.5">
                                FFC Certificate Number{' '}
                                <span className="text-charcoal/45 font-normal">(optional)</span>
                            </label>
                            <input
                                value={ffcNumber}
                                onChange={(e) => setFfcNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                maxLength={15}
                                inputMode="numeric"
                                className={`${AGENT_FORM_INPUT} !pl-4 font-mono ${errors.ffcNumber ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                                placeholder="15 digits starting with 20"
                            />
                            {errors.ffcNumber && (
                                <p className="text-red-600 text-sm mt-1">{errors.ffcNumber}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-charcoal text-sm mb-1.5">
                                Fidelity Fund Certificate <span className="text-red-500">*</span>
                            </label>
                            <p className="text-charcoal/45 text-sm mb-3">
                                PDF, JPG, JPEG or PNG — max 10MB. Stored securely.
                            </p>
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-charcoal/[0.12] rounded-2xl cursor-pointer hover:bg-gold/[0.03] hover:border-gold/20 transition-all duration-200">
                                <Upload className="w-8 h-8 text-gold mb-2" />
                                <span className="text-sm text-charcoal/55">
                                    {file ? file.name : agent.ffcDocumentUrl ? 'Document on file — choose to replace' : 'Click to upload'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file}</p>}
                            {agent.ffcDocumentUrl && !file && (
                                <p className="text-emerald-700 text-xs mt-2 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Document uploaded (private)
                                </p>
                            )}
                        </div>

                        {message && (
                            <p className={`text-sm ${message.includes('failed') ? 'text-red-600' : 'text-emerald-700'}`}>
                                {message}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={uploading}
                            className={`${AGENT_PRIMARY_BTN} w-full h-11 disabled:opacity-50`}
                        >
                            {uploading ? 'Submitting…' : 'Submit for verification'}
                        </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
