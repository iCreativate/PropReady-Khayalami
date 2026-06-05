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

    if (!agent) return null;

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-charcoal/10 px-4 py-4">
                <div className="container mx-auto flex items-center gap-4">
                    <Link href="/agents/dashboard" className="text-charcoal/70 hover:text-charcoal flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-gold" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal">PPRA verification</h1>
                        <p className="text-charcoal/70">Build trust with buyers and sellers on PropReady</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {steps.map((s, i) => (
                        <div
                            key={s.label}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold ${
                                s.done ? 'bg-green-500/15 text-green-800' : 'bg-charcoal/10 text-charcoal/60'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
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
                    <div className="premium-card p-6 rounded-xl border border-green-500/30 bg-green-50">
                        <p className="text-green-800 font-semibold">You are PPRA verified on PropReady.</p>
                        <p className="text-green-700 text-sm mt-2">You can access leads and appear in search results.</p>
                        <Link
                            href="/agents/dashboard"
                            className="inline-block mt-4 text-gold font-semibold hover:underline"
                        >
                            Go to dashboard →
                        </Link>
                    </div>
                ) : (
                    <div className="premium-card p-6 rounded-xl space-y-5">
                        {(agent.verificationStatus as string) === 'rejected' && (
                            <p className="text-red-600 text-sm flex items-start gap-2 bg-red-50 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                {agent.verificationNotes || 'Verification failed. Update your details and resubmit.'}
                            </p>
                        )}

                        <div>
                            <label className="block font-semibold text-charcoal mb-2">
                                PPRA Practitioner Number <span className="text-red-600">*</span>
                            </label>
                            <input
                                value={ppraNumber}
                                onChange={(e) => setPpraNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                                maxLength={7}
                                inputMode="numeric"
                                className="w-full px-4 py-3 rounded-lg border border-charcoal/20 font-mono"
                                placeholder="7 digits"
                            />
                            {errors.ppraNumber && (
                                <p className="text-red-600 text-sm mt-1">{errors.ppraNumber}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-charcoal mb-2">
                                FFC Certificate Number <span className="text-charcoal/50 font-normal">(optional)</span>
                            </label>
                            <input
                                value={ffcNumber}
                                onChange={(e) => setFfcNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                maxLength={15}
                                inputMode="numeric"
                                className="w-full px-4 py-3 rounded-lg border border-charcoal/20 font-mono"
                                placeholder="15 digits starting with 20"
                            />
                            {errors.ffcNumber && (
                                <p className="text-red-600 text-sm mt-1">{errors.ffcNumber}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-charcoal mb-2">
                                Fidelity Fund Certificate <span className="text-red-600">*</span>
                            </label>
                            <p className="text-charcoal/60 text-sm mb-2">PDF, JPG, JPEG or PNG — max 10MB. Stored securely.</p>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gold/40 rounded-xl cursor-pointer hover:bg-gold/5 transition">
                                <Upload className="w-8 h-8 text-gold mb-2" />
                                <span className="text-sm text-charcoal/70">
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
                                <p className="text-green-700 text-xs mt-2 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Document uploaded (private)
                                </p>
                            )}
                        </div>

                        {message && (
                            <p className={`text-sm ${message.includes('failed') ? 'text-red-600' : 'text-green-700'}`}>
                                {message}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={uploading}
                            className="w-full py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 disabled:opacity-50"
                        >
                            {uploading ? 'Submitting…' : 'Submit for verification'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
