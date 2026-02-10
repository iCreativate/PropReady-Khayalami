'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
    ArrowLeft,
    BookOpen,
    Home,
    UserPlus,
    ShieldCheck,
    Megaphone,
    Brain,
    Handshake,
    Smartphone,
    Scale,
    MessageSquare,
    Target,
} from 'lucide-react';

export default function AgentLearnPage() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const agent = localStorage.getItem('propReady_currentAgent');
            if (!agent) {
                router.push('/agents/login');
            }
        }
    }, [router]);

    const modules = [
        {
            slug: 'lead-conversion',
            icon: UserPlus,
            title: 'Lead Conversion Best Practices',
            description:
                'How to turn prequalified leads into closed deals. Follow-up timing, qualifying questions, and building trust.',
        },
        {
            slug: 'eaab-compliance',
            icon: ShieldCheck,
            title: 'EAAB Compliance & Ethics',
            description:
                'Understand the Estate Agency Affairs Board requirements, ethical conduct, and staying compliant in South Africa.',
        },
        {
            slug: 'listing-tips',
            icon: Megaphone,
            title: 'Property Marketing & Listing Tips',
            description:
                'Stand out with better listings: photography, descriptions, pricing, and showcasing properties effectively.',
        },
        {
            slug: 'buyer-psychology',
            icon: Brain,
            title: 'Understanding Buyer Psychology',
            description:
                'What motivates buyers, common objections, and how to align your approach with their decision-making process.',
        },
        {
            slug: 'working-with-sellers',
            icon: Handshake,
            title: 'Working with Sellers Effectively',
            description:
                'Getting listings, pricing conversations, managing expectations, and building long-term seller relationships.',
        },
        {
            slug: 'digital-marketing',
            icon: Smartphone,
            title: 'Digital Marketing for Real Estate',
            description:
                'Social media, property portals, email marketing, and leveraging PropReady to grow your digital presence.',
        },
        {
            slug: 'legal-basics',
            icon: Scale,
            title: 'Legal Compliance Basics',
            description:
                'OTPs, FICA, POPIA, and key legal requirements every agent should know when facilitating property transactions.',
        },
        {
            slug: 'negotiation-skills',
            icon: MessageSquare,
            title: 'Negotiation Skills',
            description:
                'Essential negotiation techniques for offers, counter-offers, and closing deals that work for all parties.',
        },
        {
            slug: 'time-management',
            icon: Target,
            title: 'Time Management for Agents',
            description:
                'Prioritising leads, balancing viewings and admin, and systems to work smarter without burning out.',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/agents/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                            <Link href="/agents/learn" className="text-gold font-semibold">
                                Learning Hub
                            </Link>
                            <Link href="/agents/settings" className="text-charcoal/90 hover:text-charcoal transition">
                                Settings
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/agents/dashboard"
                        className="flex items-center space-x-2 text-charcoal hover:text-gold transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative min-h-screen px-4 pt-28 pb-16">
                <div className="container mx-auto max-w-6xl relative z-10">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                            <BookOpen className="w-5 h-5 text-gold" />
                            <span className="text-gold font-semibold">Learning Hub – Agents</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-charcoal mb-6">
                            Grow Your Real Estate Career
                        </h1>

                        <p className="text-xl text-charcoal/90 max-w-3xl mx-auto">
                            Practical guides and tips to help you convert more leads, stay compliant,
                            and build a stronger reputation in the South African property market.
                        </p>
                    </div>

                    {/* Learning Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map(({ slug, icon: Icon, title, description }) => (
                            <Link key={slug} href={`/agents/learn/${slug}`} className="block">
                                <div className="premium-card rounded-xl p-6 cursor-pointer h-full group border border-charcoal/10 hover:border-gold/30 transition-colors">
                                    <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors border border-gold/20">
                                        <Icon className="w-7 h-7 text-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal mb-2 group-hover:text-gold transition-colors">
                                        {title}
                                    </h3>
                                    <p className="text-charcoal/60 text-sm leading-relaxed mb-4">
                                        {description}
                                    </p>
                                    <div className="flex items-center text-gold font-semibold text-sm group-hover:gap-2 transition-all">
                                        <span>Read Article</span>
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 premium-card rounded-2xl p-12 text-center bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                        <h2 className="text-3xl font-bold text-charcoal mb-4">
                            Apply What You Learn
                        </h2>
                        <p className="text-lg text-charcoal/60 mb-8">
                            Use your PropReady dashboard to put these practices into action with your
                            prequalified leads and listed properties.
                        </p>
                        <Link
                            href="/agents/dashboard"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </Link>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl animate-float" />
                    <div
                        className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-float"
                        style={{ animationDelay: '2s' }}
                    />
                </div>
            </main>
        </div>
    );
}
