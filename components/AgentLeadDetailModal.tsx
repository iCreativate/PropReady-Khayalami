'use client';

import { useEffect, useState } from 'react';
import {
    User,
    X,
    Mail,
    Phone,
    MessageCircle,
    MapPin,
    TrendingUp,
    FileText,
    CheckCircle,
    Upload,
    AlertCircle,
    Building2,
} from 'lucide-react';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import {
    fetchLeadDocuments,
    leadDocumentTypeLabel,
    type LeadDocument,
} from '@/lib/lead-documents';
export interface AgentLeadDetail {
    id: string;
    leadType?: 'buyer' | 'seller' | 'investor';
    fullName: string;
    email: string;
    phone: string;
    city?: string | null;
    monthlyIncome?: string;
    depositSaved?: string;
    employmentStatus?: string;
    creditScore?: string;
    score?: number;
    preQualAmount?: number;
    bondOriginator?: string | null;
    prequalifiedWithOriginator?: boolean;
    status: 'new' | 'contacted' | 'qualified' | 'not-interested';
    appointmentVerified?: boolean;
    timestamp: string;
    contactedAt: string | null;
    propertyAddress?: string;
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    propertySize?: string;
    landSize?: string;
    buildingSize?: string;
    currentValue?: string;
    reasonForSelling?: string;
    timeline?: string;
    hasBond?: boolean | null;
    bondBalance?: string;
}

interface AgentLeadDetailModalProps {
    lead: AgentLeadDetail;
    leadKind: 'buyer' | 'seller';
    onClose: () => void;
    onContact: (lead: AgentLeadDetail, method: 'phone' | 'email' | 'whatsapp') => void;
    onStatusChange: (
        leadId: string,
        status: 'new' | 'contacted' | 'qualified' | 'not-interested'
    ) => void;
    getStatusBadge: (status: string) => React.ReactNode;
    getVerificationBadge: (lead: AgentLeadDetail) => React.ReactNode;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-charcoal/60 text-xs uppercase tracking-wide">{label}</p>
            <p className="text-charcoal font-semibold text-sm mt-0.5">{value ?? '—'}</p>
        </div>
    );
}

function documentStatusBadge(status: LeadDocument['status']) {
    const styles = {
        verified: { bg: 'bg-green-500/15', text: 'text-green-700', icon: CheckCircle, label: 'Verified' },
        uploaded: { bg: 'bg-blue-500/15', text: 'text-blue-700', icon: Upload, label: 'Uploaded' },
        pending: { bg: 'bg-amber-500/15', text: 'text-amber-700', icon: AlertCircle, label: 'Pending' },
    };
    const badge = styles[status] ?? styles.uploaded;
    const Icon = badge.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
            <Icon className="w-3 h-3" />
            {badge.label}
        </span>
    );
}

export default function AgentLeadDetailModal({
    lead,
    leadKind,
    onClose,
    onContact,
    onStatusChange,
    getStatusBadge,
    getVerificationBadge,
}: AgentLeadDetailModalProps) {
    const [documents, setDocuments] = useState<LeadDocument[]>([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [status, setStatus] = useState(lead.status);

    useEffect(() => {
        setStatus(lead.status);
    }, [lead.status]);

    useEffect(() => {
        let cancelled = false;
        setDocsLoading(true);
        fetchLeadDocuments(lead.id).then((docs) => {
            if (!cancelled) {
                setDocuments(docs);
                setDocsLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [lead.id]);

    const isSeller = leadKind === 'seller';
    const HeaderIcon = isSeller ? Building2 : User;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shrink-0">
                                <HeaderIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl font-bold text-white truncate">{lead.fullName}</h2>
                                <p className="text-white/80 text-sm capitalize">
                                    {isSeller ? 'Seller lead' : 'Buyer lead'}
                                    {lead.city ? ` · ${lead.city}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 flex items-center justify-center"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5 space-y-4">
                    <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                        <p className="text-charcoal/70 text-sm font-semibold mb-3">Contact</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-charcoal/50 shrink-0" />
                                <span className="text-charcoal break-all">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-charcoal/50 shrink-0" />
                                <span className="text-charcoal">{lead.phone}</span>
                            </div>
                            {lead.city && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-charcoal/50 shrink-0" />
                                    <span className="text-charcoal">{lead.city}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                        <p className="text-charcoal/70 text-sm font-semibold mb-3">Lead status</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <DetailRow label="Status" value={getStatusBadge(lead.status)} />
                            <DetailRow label="Verified" value={getVerificationBadge(lead)} />
                            <DetailRow
                                label="Submitted"
                                value={new Date(lead.timestamp).toLocaleString()}
                            />
                            {lead.contactedAt && (
                                <DetailRow
                                    label="Last contacted"
                                    value={new Date(lead.contactedAt).toLocaleString()}
                                />
                            )}
                        </div>
                    </section>

                    {!isSeller && (
                        <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                            <p className="text-charcoal/70 text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-gold" />
                                Pre-qualification
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <DetailRow
                                    label="Readiness score"
                                    value={lead.score != null ? `${lead.score}%` : '—'}
                                />
                                <DetailRow
                                    label="Pre-qual amount"
                                    value={
                                        lead.preQualAmount != null
                                            ? formatCurrency(lead.preQualAmount)
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    label="Employment"
                                    value={
                                        lead.employmentStatus
                                            ? lead.employmentStatus.charAt(0).toUpperCase() +
                                              lead.employmentStatus.slice(1)
                                            : '—'
                                    }
                                />
                                <DetailRow label="Monthly income" value={lead.monthlyIncome || '—'} />
                                <DetailRow
                                    label="Deposit saved"
                                    value={formatCurrency(parseAmountForDisplay(lead.depositSaved))}
                                />
                                <DetailRow label="Credit score" value={lead.creditScore || '—'} />
                                <DetailRow
                                    label="Bond originator"
                                    value={
                                        lead.prequalifiedWithOriginator && lead.bondOriginator
                                            ? bondOriginatorLabel(lead.bondOriginator)
                                            : '—'
                                    }
                                />
                            </div>
                        </section>
                    )}

                    {isSeller && (
                        <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                            <p className="text-charcoal/70 text-sm font-semibold mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gold" />
                                Property details
                            </p>
                            <div className="space-y-3">
                                <DetailRow
                                    label="Address"
                                    value={
                                        lead.propertyAddress
                                            ? lead.propertyAddress
                                                  .split(',')
                                                  .map((s) => s.trim())
                                                  .filter(Boolean)
                                                  .join(', ')
                                            : '—'
                                    }
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <DetailRow
                                        label="Property type"
                                        value={
                                            lead.propertyType
                                                ? lead.propertyType.charAt(0).toUpperCase() +
                                                  lead.propertyType.slice(1)
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label="Estimated value"
                                        value={formatCurrency(parseAmountForDisplay(lead.currentValue))}
                                    />
                                    <DetailRow label="Bedrooms" value={lead.bedrooms || '—'} />
                                    <DetailRow label="Bathrooms" value={lead.bathrooms || '—'} />
                                    <DetailRow
                                        label="Land size"
                                        value={lead.landSize ? `${lead.landSize} m²` : '—'}
                                    />
                                    <DetailRow
                                        label="Building size"
                                        value={lead.buildingSize ? `${lead.buildingSize} m²` : '—'}
                                    />
                                    <DetailRow
                                        label="Floor size"
                                        value={lead.propertySize ? `${lead.propertySize} m²` : '—'}
                                    />
                                    <DetailRow
                                        label="Timeline"
                                        value={
                                            lead.timeline
                                                ? lead.timeline.replace('-', ' to ')
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label="Reason for selling"
                                        value={lead.reasonForSelling || '—'}
                                    />
                                    <DetailRow
                                        label="Bond"
                                        value={
                                            lead.hasBond == null
                                                ? '—'
                                                : lead.hasBond
                                                  ? `Yes${lead.bondBalance ? ` · ${lead.bondBalance}` : ''}`
                                                  : 'No'
                                        }
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                        <p className="text-charcoal/70 text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gold" />
                            Attached documents
                        </p>
                        {docsLoading ? (
                            <p className="text-charcoal/50 text-sm">Loading documents…</p>
                        ) : documents.length === 0 ? (
                            <p className="text-charcoal/50 text-sm">No documents attached for this lead.</p>
                        ) : (
                            <ul className="space-y-2">
                                {documents.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-charcoal/5 border border-charcoal/10"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <FileText className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-charcoal font-medium text-sm truncate">
                                                    {doc.name}
                                                </p>
                                                <p className="text-charcoal/60 text-xs">
                                                    {leadDocumentTypeLabel(doc.type)}
                                                    {doc.size ? ` · ${doc.size}` : ''}
                                                    {' · '}
                                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {documentStatusBadge(doc.status)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="bg-white rounded-xl p-4 border border-charcoal/10 shadow-sm">
                        <p className="text-charcoal/70 text-sm font-semibold mb-3">
                            Contact {isSeller ? 'seller' : 'buyer'}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => onContact(lead, 'phone')}
                                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-500/15 text-green-700 hover:bg-green-500/25 transition"
                            >
                                <Phone className="w-5 h-5" />
                                <span className="text-xs font-medium">Call</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onContact(lead, 'email')}
                                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition"
                            >
                                <Mail className="w-5 h-5" />
                                <span className="text-xs font-medium">Email</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onContact(lead, 'whatsapp')}
                                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-600/15 text-green-800 hover:bg-green-600/25 transition"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-xs font-medium">WhatsApp</span>
                            </button>
                        </div>
                        <label className="text-charcoal font-semibold text-sm block mb-2">
                            Update status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                const next = e.target.value as typeof status;
                                setStatus(next);
                                onStatusChange(lead.id, next);
                            }}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal form-control"
                        >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="not-interested">Not Interested</option>
                        </select>
                    </section>
                </div>

                <div className="px-8 py-5 bg-white border-t border-charcoal/10 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold/90 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
