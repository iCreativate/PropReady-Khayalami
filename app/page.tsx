import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import HomeLanding from '@/components/marketing/home/HomeLanding';
import './home-landing.css';

const display = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['500', '600'],
    variable: '--font-home-display',
    display: 'swap',
});

const sans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-home-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "PropReady | South Africa's intelligent property platform",
    description:
        'Learn, decide and own with confidence. PropReady combines immersive property education, smart calculators and trusted professionals for South African buyers, sellers and investors.',
    openGraph: {
        title: 'PropReady | Learn. Decide. Own.',
        description:
            "South Africa's intelligent property platform — education, tools, insights and professionals in one place.",
    },
};

export default function HomePage() {
    return (
        <div className={`${display.variable} ${sans.variable} min-h-screen`}>
            <PublicSiteHeader />
            <main>
                <HomeLanding />
            </main>
        </div>
    );
}
