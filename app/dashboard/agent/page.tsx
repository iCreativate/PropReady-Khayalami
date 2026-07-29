'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Calendar,
    CheckCircle,
    CheckSquare,
    FileText,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import PpraTrustSection from '@/components/PpraTrustSection';
import { refreshViewingsFromApi } from '@/lib/buyer-viewings';
import { PORTAL_CALLOUT, PORTAL_CARD, PORTAL_PAGE_CONTAINER, PORTAL_STAT_ICON } from '@/lib/portal-ui';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { resolveWorkingAgent, type WorkingAgent } from '@/lib/working-agent';
import {
    fetchDocumentGrantStatus,
    grantDocumentAccess,
    revokeDocumentAccess,
    type DocumentGrant,
} from '@/lib/document-grants';
import PortalLoading from '@/components/PortalLoading';

const AGENT_CHECKLIST = [
    'PPRA / EAAB registered with a current Fidelity Fund Certificate (FFC)',
    'Clear communication — returns calls and explains next steps in plain language',
    'Local market knowledge for the suburbs you care about',
    'Transparent about fees, mandates, and timelines',
    'Willing to work with your bond originator and conveyancer',
    'Shows comparable sales and a realistic pricing / offer strategy',
];

const HOW_TO_FIND = [
    {
        title: 'Start with a viewing or valuation',
        body: 'On PropReady, the agent who books your viewing or seller appointment becomes your working agent here — after they’ve actually engaged you.',
    },
    {
        title: 'Verify credentials',
        body: 'Ask for their PPRA / EAAB number and FFC. Verified PropReady agents display trust badges so you can check at a glance.',
    },
    {
        title: 'Interview more than one if needed',
        body: 'A good agent should be comfortable explaining their process, marketing plan, and how they’ll protect your interests.',
    },
    {
        title: 'Align on communication',
        body: 'Agree how you’ll stay in touch (call, WhatsApp, email) and how often you’ll get updates on offers, viewings, and documents.',
    },
];

function readIsSellerPortal(user: { id?: string; email?: string } | null) {
    if (typeof window === 'undefined' || !user) return false;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.sellerInfo);
        if (!raw) return false;
        const seller = JSON.parse(raw) as { id?: string; email?: string };
        return seller.id === user.id || seller.email === user.email;
    } catch {
        return false;
    }
}

export default function MyAgentPage() {
    const router = useRouter();
    const { user: currentUser, isHydrated } = useHydratedBuyerPortalUser();
    const [agent, setAgent] = useState<WorkingAgent | null>(null);
    const [isSeller, setIsSeller] = useState(false);
    const [grant, setGrant] = useState<DocumentGrant | null>(null);
    const [grantBusy, setGrantBusy] = useState(false);
    const [grantMessage, setGrantMessage] = useState('');

    useEffect(() => {
        if (!isHydrated) return;
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setIsSeller(readIsSellerPortal(currentUser));
        const resolved = resolveWorkingAgent(currentUser);
        setAgent(resolved);

        void refreshViewingsFromApi(currentUser, { includeSeller: true }).then((viewings) => {
            const next = resolveWorkingAgent(currentUser, viewings);
            setAgent(next);
        });
    }, [router, isHydrated, currentUser]);

    useEffect(() => {
        if (!currentUser?.id || !agent?.id || isSeller) {
            setGrant(null);
            return;
        }
        let cancelled = false;
        void fetchDocumentGrantStatus({
            buyerUserId: String(currentUser.id || ''),
            agentId: agent.id,
        }).then((g) => {
            if (!cancelled) setGrant(g);
        });
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, agent?.id, isSeller]);

    if (!isHydrated || !currentUser) {
        return <PortalLoading message="Loading agent…" variant="dashboard" />;
    }

    const portal = isSeller ? 'seller' : 'buyer';
    const hasViewingWithAgent = Boolean(agent?.latestAppointment);
    const canShareDocs = !isSeller && hasViewingWithAgent;

    async function handleGrant() {
        if (!currentUser || !agent) return;
        setGrantBusy(true);
        setGrantMessage('');
        const result = await grantDocumentAccess({
            buyerUserId: String(currentUser.id || ''),
            buyerEmail: String(currentUser.email || ''),
            agentId: agent.id,
            viewingId: agent.latestAppointment?.id || null,
        });
        setGrantBusy(false);
        if (!result.ok) {
            setGrantMessage(result.error || 'Could not share documents');
            return;
        }
        setGrant(result.grant || null);
        setGrantMessage('Documents shared with this agent.');
    }

    async function handleRevoke() {
        if (!currentUser || !agent) return;
        const ok = window.confirm(
            'Revoke this agent’s access to your documents? They will no longer be able to download your FICA or income files.'
        );
        if (!ok) return;
        setGrantBusy(true);
        setGrantMessage('');
        const result = await revokeDocumentAccess({
            buyerUserId: String(currentUser.id || ''),
            agentId: agent.id,
        });
        setGrantBusy(false);
        if (!result.ok) {
            setGrantMessage(result.error || 'Could not revoke access');
            return;
        }
        setGrant(null);
        setGrantMessage('Document access revoked.');
    }

    return (
        <UserPortalLayout
            portal={portal}
            activePage="agent"
            user={currentUser}
            title="My Agent"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="Working with an agent"
                    title="My Agent"
                    description="See who you’re working with after an appointment is booked, plus practical guidance for choosing the right agent."
                />
            }
        >
            <div className={`${PORTAL_PAGE_CONTAINER} relative z-10 space-y-8`}>
                {/* Working agent from appointment / selection */}
                {agent ? (
                    <section className={`${PORTAL_CARD} p-6 sm:p-8`}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                            <div className={`${PORTAL_STAT_ICON} w-16 h-16 shrink-0`}>
                                <Users className="w-8 h-8 text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-bold text-charcoal">{agent.name}</h2>
                                    {agent.verified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-charcoal/[0.04] border border-charcoal/10 text-charcoal/55 text-[11px] font-semibold uppercase tracking-wide">
                                        {agent.source === 'appointment'
                                            ? 'From appointment'
                                            : 'Selected on PropReady'}
                                    </span>
                                </div>
                                <p className="text-charcoal/60 mb-3">{agent.company}</p>
                                <p className="text-sm text-charcoal/50 flex items-center gap-1.5 mb-4">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    {agent.location}
                                </p>

                                {agent.latestAppointment && (
                                    <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 mb-5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gold mb-1 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Latest appointment
                                        </p>
                                        <p className="text-sm font-medium text-charcoal">
                                            {agent.latestAppointment.propertyTitle}
                                        </p>
                                        {agent.latestAppointment.propertyAddress && (
                                            <p className="text-xs text-charcoal/55 mt-0.5">
                                                {agent.latestAppointment.propertyAddress}
                                            </p>
                                        )}
                                        <p className="text-xs text-charcoal/55 mt-1 capitalize">
                                            {agent.latestAppointment.date}
                                            {agent.latestAppointment.time
                                                ? ` · ${agent.latestAppointment.time}`
                                                : ''}{' '}
                                            · {agent.latestAppointment.status}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {agent.phone && (
                                        <a
                                            href={`tel:${agent.phone.replace(/\s/g, '')}`}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </a>
                                    )}
                                    {agent.email && (
                                        <a
                                            href={`mailto:${agent.email}`}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal/15 text-charcoal text-sm font-semibold hover:bg-charcoal/[0.03] transition"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </a>
                                    )}
                                    {agent.phone && (
                                        <a
                                            href={`https://wa.me/${agent.phone.replace(/\D/g, '').replace(/^0/, '27')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal/15 text-charcoal text-sm font-semibold hover:bg-charcoal/[0.03] transition"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>
                                    )}
                                    <Link
                                        href="/dashboard/viewings"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal/15 text-charcoal text-sm font-semibold hover:bg-charcoal/[0.03] transition"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Viewings
                                    </Link>
                                </div>

                                {!isSeller && (
                                    <div className="mt-6 rounded-xl border border-charcoal/10 bg-charcoal/[0.02] p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gold" />
                                            <p className="text-sm font-semibold text-charcoal">
                                                Document sharing
                                            </p>
                                        </div>
                                        <p className="mb-3 text-xs leading-relaxed text-charcoal/60">
                                            Agents can only view your FICA and income documents after a viewing
                                            with them and your explicit agreement. Platform bond prequalification
                                            remains optional — you can use your agent’s originator or skip it.
                                        </p>
                                        {!hasViewingWithAgent ? (
                                            <p className="text-xs font-medium text-amber-700">
                                                Book or confirm a viewing with this agent before sharing documents.
                                            </p>
                                        ) : grant?.status === 'active' ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Documents shared
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={grantBusy}
                                                    onClick={() => void handleRevoke()}
                                                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Revoke access
                                                </button>
                                            </div>
                                        ) : canShareDocs ? (
                                            <button
                                                type="button"
                                                disabled={grantBusy}
                                                onClick={() => void handleGrant()}
                                                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gold/90 disabled:opacity-50"
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                                {grantBusy
                                                    ? 'Saving…'
                                                    : 'Agree to work with this agent & share my documents'}
                                            </button>
                                        ) : null}
                                        {grantMessage ? (
                                            <p className="mt-2 text-xs text-charcoal/55">{grantMessage}</p>
                                        ) : null}
                                    </div>
                                )}

                                {(agent.ppraNumber || agent.ffcNumber) && (
                                    <div className="mt-6 pt-5 border-t border-charcoal/10">
                                        <PpraTrustSection
                                            agent={{
                                                ppraNumber: agent.ppraNumber,
                                                ffcNumber: agent.ffcNumber,
                                                verificationStatus: agent.verificationStatus,
                                                fullName: agent.name,
                                                company: agent.company,
                                            }}
                                        />                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className={`${PORTAL_CARD} p-8 text-center`}>
                        <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                            <Users className="w-7 h-7 text-gold" />
                        </div>
                        <h2 className="text-xl font-bold text-charcoal mb-2">No working agent yet</h2>
                        <p className="text-charcoal/60 text-sm max-w-lg mx-auto mb-6">
                            When a PropReady agent calls you and books a viewing or valuation appointment, they’ll
                            appear here as the agent you’re working with.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={isSeller ? '/sellers/dashboard' : '/search'}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition"
                            >
                                <Search className="w-4 h-4" />
                                {isSeller ? 'Seller dashboard' : 'Browse properties'}
                            </Link>
                            <Link
                                href="/dashboard/viewings"
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-charcoal/15 text-charcoal text-sm font-semibold hover:bg-charcoal/[0.03] transition"
                            >
                                <Calendar className="w-4 h-4" />
                                Check viewings
                            </Link>
                        </div>
                    </section>
                )}

                <div className={PORTAL_CALLOUT}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <p className="text-sm text-charcoal/70 leading-relaxed">
                            A strong agent partnership is about trust, clarity, and pace — not pressure. Use the
                            guidance below whether you’re buying or selling.
                        </p>
                    </div>
                </div>

                {/* How to find the right agent */}
                <section>
                    <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gold" />
                        How to find the right agent
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {HOW_TO_FIND.map((item) => (
                            <div key={item.title} className={`${PORTAL_CARD} p-5`}>
                                <h3 className="font-semibold text-charcoal mb-2">{item.title}</h3>
                                <p className="text-sm text-charcoal/60 leading-relaxed">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Checklist */}
                <section className={`${PORTAL_CARD} p-6 sm:p-8`}>
                    <h2 className="text-lg font-bold text-charcoal mb-2 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-gold" />
                        Tick all the boxes
                    </h2>
                    <p className="text-sm text-charcoal/55 mb-5">
                        Before you commit, make sure your agent covers these basics.
                    </p>
                    <ul className="space-y-3">
                        {AGENT_CHECKLIST.map((item) => (
                            <li key={item} className="flex items-start gap-3 text-sm text-charcoal/75">
                                <span className="mt-0.5 w-5 h-5 rounded-md border border-gold/30 bg-gold/10 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-3.5 h-3.5 text-gold" />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Working together */}
                <section className={`${PORTAL_CARD} p-6 sm:p-8`}>
                    <h2 className="text-lg font-bold text-charcoal mb-4">Working with your agent on PropReady</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="rounded-xl border border-charcoal/10 p-4">
                            <p className="font-semibold text-charcoal mb-1">1. Appointment</p>
                            <p className="text-charcoal/55 leading-relaxed">
                                The agent schedules a viewing or valuation with you as buyer or seller.
                            </p>
                        </div>
                        <div className="rounded-xl border border-charcoal/10 p-4">
                            <p className="font-semibold text-charcoal mb-1">2. Confirm</p>
                            <p className="text-charcoal/55 leading-relaxed">
                                Confirm the appointment in your Viewings dashboard so the lead is verified.
                            </p>
                        </div>
                        <div className="rounded-xl border border-charcoal/10 p-4">
                            <p className="font-semibold text-charcoal mb-1">3. Share documents (optional)</p>
                            <p className="text-charcoal/55 leading-relaxed">
                                After a viewing, you can agree to work with the agent and share FICA docs. Bond
                                prequal on PropReady stays optional.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </UserPortalLayout>
    );
}
