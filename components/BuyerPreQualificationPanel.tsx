'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle,
    Eye,
    FileText,
    Home,
    RefreshCw,
    Search,
    TrendingUp,
    Upload,
} from 'lucide-react';
import BuyerDocumentPreviewModal from '@/components/BuyerDocumentPreviewModal';
import BondOriginatorSlider from '@/components/BondOriginatorSlider';
import PortalPageHeader from '@/components/PortalPageHeader';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import type { BondOriginator } from '@/lib/bond-originators';
import {
    buyerDocumentTypeLabel,
    readBuyerDocumentsLocal,
    refreshBuyerDocumentsFromApi,
    type BuyerDocument,
} from '@/lib/buyer-documents';
import {
    calculateMonthlyBondBudget,
    getPropReadyScoreLabel,
    parseStoredAmount,
    type BuyerQuizResult,
} from '@/lib/quiz-result';
import { PORTAL_CARD, PORTAL_CALLOUT, PORTAL_INNER_CARD, PORTAL_PRIMARY_BTN, PORTAL_STAT_ICON } from '@/lib/portal-ui';

interface BuyerPreQualificationPanelProps {
    result: BuyerQuizResult;
    userId?: string;
    onContactOriginator?: (originator: BondOriginator) => void;
    onRetakeQuiz?: () => void;
    showRetake?: boolean;
}

export default function BuyerPreQualificationPanel({
    result,
    userId,
    onContactOriginator,
    onRetakeQuiz,
    showRetake = true,
}: BuyerPreQualificationPanelProps) {
    const [documents, setDocuments] = useState<BuyerDocument[]>([]);
    const [previewDoc, setPreviewDoc] = useState<BuyerDocument | null>(null);

    useEffect(() => {
        if (!userId) return;
        const localDocs = readBuyerDocumentsLocal(userId);
        setDocuments(localDocs);
        void refreshBuyerDocumentsFromApi(userId, localDocs).then(setDocuments);
    }, [userId]);

    const score = result.score ?? 0;
    const preQualAmount = result.preQualAmount ?? 0;
    const monthlyBudget = calculateMonthlyBondBudget(preQualAmount);
    const completedAt = result.timestamp ? new Date(result.timestamp).toLocaleDateString() : null;

    return (
        <>
        <div className="space-y-8">
            <div className={`${PORTAL_CARD} p-8 md:p-10`}>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                        <div>
                            <p className="text-charcoal/50 text-sm font-medium uppercase tracking-wide mb-2">
                                Your PropReady Score
                            </p>
                            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">
                                {result.fullName ? `${result.fullName.split(' ')[0]}'s pre-qualification` : 'Your pre-qualification'}
                            </h2>
                            <p className="text-charcoal/60">
                                {completedAt
                                    ? `Last updated ${completedAt}`
                                    : 'Based on your PropReady assessment'}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <div className="text-5xl md:text-6xl font-bold text-gold mb-1">{score}%</div>
                            <p className="text-charcoal/50 font-medium">{getPropReadyScoreLabel(score)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        <div className="portal-stat-inner">
                            <p className="text-charcoal/45 text-xs font-medium uppercase tracking-[0.08em] mb-2">
                                Pre-Qualification
                            </p>
                            <p className="text-charcoal font-bold text-2xl">{formatCurrency(preQualAmount)}</p>
                        </div>
                        <div className="portal-stat-inner">
                            <p className="text-charcoal/45 text-xs font-medium uppercase tracking-[0.08em] mb-2">
                                Est. Monthly Bond
                            </p>
                            <p className="text-charcoal font-bold text-2xl">{formatCurrency(monthlyBudget)}</p>
                        </div>
                        <div className="portal-stat-inner">
                            <p className="text-charcoal/45 text-xs font-medium uppercase tracking-[0.08em] mb-2">
                                Deposit Saved
                            </p>
                            <p className="text-charcoal font-bold text-2xl">
                                {formatCurrency(parseStoredAmount(result.depositSaved))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 sm:gap-6">
                <Link href="/search" className="premium-card p-5 text-center group">
                    <div className={`${PORTAL_STAT_ICON} mx-auto mb-3`}>
                        <Search className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-charcoal font-semibold text-sm">Browse Properties</h3>
                </Link>
                <Link href="/dashboard/documents" className="premium-card p-5 text-center group">
                    <div className={`${PORTAL_STAT_ICON} mx-auto mb-3`}>
                        <FileText className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-charcoal font-semibold text-sm">Upload Documents</h3>
                </Link>
                <Link href="/dashboard" className="premium-card p-5 text-center group">
                    <div className={`${PORTAL_STAT_ICON} mx-auto mb-3`}>
                        <Home className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-charcoal font-semibold text-sm">Dashboard</h3>
                </Link>
                <Link href="/calculator" className="premium-card p-5 text-center group">
                    <div className={`${PORTAL_STAT_ICON} mx-auto mb-3`}>
                        <TrendingUp className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-charcoal font-semibold text-sm">Bond Calculator</h3>
                </Link>
            </div>

            <div className="premium-card rounded-2xl p-6 md:p-8 border border-charcoal/10">
                <h3 className="text-xl font-bold text-charcoal mb-4">Assessment summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">In market for property</span>
                        <span className="font-semibold text-charcoal text-right">
                            {result.inMarketForProperty === true
                                ? 'Yes'
                                : result.inMarketForProperty === false
                                  ? 'No'
                                  : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">Monthly income</span>
                        <span className="font-semibold text-charcoal text-right">
                            {formatCurrency(parseAmountForDisplay(result.monthlyIncome ?? '0'))}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">Monthly expenses / debt</span>
                        <span className="font-semibold text-charcoal text-right">
                            {formatCurrency(parseAmountForDisplay(result.expenses ?? '0'))}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">Employment</span>
                        <span className="font-semibold text-charcoal capitalize text-right">
                            {result.employmentStatus?.replace(/-/g, ' ') || '—'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">Credit profile</span>
                        <span className="font-semibold text-charcoal capitalize text-right">
                            {result.creditScore || '—'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-2">
                        <span className="text-charcoal/60">City / area</span>
                        <span className="font-semibold text-charcoal text-right">{result.city || '—'}</span>
                    </div>
                </div>
            </div>

            {documents.length > 0 && (
                <div className="premium-card rounded-2xl p-6 md:p-8 border border-charcoal/10">
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-gold" />
                            <h3 className="text-xl font-bold text-charcoal">Uploaded documents</h3>
                        </div>
                        <Link
                            href="/dashboard/documents"
                            className="text-sm font-semibold text-gold hover:text-gold-600 transition"
                        >
                            Manage
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-start justify-between gap-4 rounded-xl border border-charcoal/10 bg-white px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-charcoal truncate" title={doc.name}>
                                        {doc.name}
                                    </p>
                                    <p className="text-sm text-charcoal/60 mt-0.5">
                                        {buyerDocumentTypeLabel(doc.type)}
                                        {doc.size ? ` • ${doc.size}` : ''}
                                        {doc.uploadedAt
                                            ? ` • ${new Date(doc.uploadedAt).toLocaleDateString()}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDoc(doc)}
                                        className="p-2 rounded-xl bg-gold/[0.06] hover:bg-gold/10 transition text-gold border border-gold/10"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-700">
                                        <CheckCircle className="w-3 h-3" />
                                        {doc.status === 'verified' ? 'Verified' : 'Uploaded'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {userId && documents.length === 0 && (
                <div className="premium-card rounded-2xl p-6 md:p-8 border border-dashed border-charcoal/15 text-center">
                    <Upload className="w-10 h-10 text-charcoal/30 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-charcoal mb-2">No documents uploaded yet</h3>
                    <p className="text-charcoal/60 text-sm mb-4 max-w-md mx-auto">
                        Upload your FICA documents to share with bond originators for formal pre-qualification.
                    </p>
                    <Link
                        href="/dashboard/documents"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition text-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Upload documents
                    </Link>
                </div>
            )}

            <div className={`${PORTAL_CARD} p-6 sm:p-8`}>
                <PortalPageHeader
                    variant="section"
                    eyebrow="Home loan partners"
                    title="Recommended Bond Originators"
                    description="Connect with a bond originator to formalise your pre-qualification with the banks."
                    className="mb-6 sm:mb-8"
                />
                <BondOriginatorSlider onContact={onContactOriginator} />
                <div className={`${PORTAL_CALLOUT} mt-6`}>
                    <p className="text-charcoal/70 text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                        Bond originators work for free — banks pay their commission, not you.
                    </p>
                </div>
            </div>

            {showRetake && onRetakeQuiz && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onRetakeQuiz}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-charcoal/15 text-charcoal/70 hover:text-charcoal hover:border-gold/40 hover:bg-gold/5 transition text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Update my pre-qualification
                    </button>
                </div>
            )}
        </div>

        <BuyerDocumentPreviewModal
            doc={previewDoc}
            userId={userId}
            onClose={() => setPreviewDoc(null)}
        />
        </>
    );
}
