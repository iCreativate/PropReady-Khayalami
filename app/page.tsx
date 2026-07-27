import Link from 'next/link';
import { ArrowRight, Home, ShieldCheck, TrendingUp } from 'lucide-react';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import {
    PORTAL_CARD_SOFT,
    PORTAL_MARKETING_CTA,
    PORTAL_STAT_ICON,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicSiteHeader />

            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24">
                <div className="container mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-8">
                        <span className="text-gold font-semibold text-sm tracking-wide">
                            100% FREE FOR BUYERS AND SELLERS
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-charcoal mb-6 leading-tight tracking-tight">
                        Your Home. Ready.
                        <br />
                        <span className="text-gold">iKhayalami.</span>
                    </h1>

                    <p className={`text-xl md:text-2xl ${PORTAL_TEXT_SECONDARY} mb-12 max-w-3xl mx-auto leading-relaxed`}>
                        Learn about real estate, bonds, buying your first home, and navigating the
                        property market. Connect with verified agents and find your dream home.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                        <Link href="/get-started" className={PORTAL_MARKETING_CTA}>
                            <span>Get started</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/learn"
                            className="inline-flex items-center gap-2 text-charcoal/70 font-medium hover:text-gold transition"
                        >
                            Explore Learner Hub
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <p className={`text-sm ${PORTAL_TEXT_SECONDARY} mb-12`}>
                        New buyers and sellers start with a short quiz — then create your account.
                    </p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            {
                                icon: ShieldCheck,
                                title: 'Pre-Qualified Buyers',
                                body: 'Get approved before you search',
                            },
                            {
                                icon: Home,
                                title: 'Verified Agents',
                                body: 'Connect with EAAB registered professionals',
                            },
                            {
                                icon: TrendingUp,
                                title: 'PropReady Score',
                                body: 'See how well properties match you',
                            },
                        ].map(({ icon: Icon, title, body }) => (
                            <div key={title} className={`${PORTAL_CARD_SOFT} p-6 text-center`}>
                                <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                    <Icon className="w-5 h-5 text-gold" />
                                </div>
                                <h3 className="text-charcoal font-semibold text-lg mb-2">{title}</h3>
                                <p className={`${PORTAL_TEXT_SECONDARY} text-sm`}>{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden>
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float" />
                    <div
                        className="absolute bottom-20 right-10 w-96 h-96 bg-gold/30 rounded-full blur-3xl animate-float"
                        style={{ animationDelay: '2s' }}
                    />
                </div>
            </main>
        </div>
    );
}
