import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import '../home-landing.css';
import './property-iq.css';

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
    title: 'Property IQ™ | PropReady',
    description:
        'Build, track and grow property wealth — portfolio KPIs, bond optimisation, equity unlock, renovations, rental performance and AI insights on one premium dashboard.',
};

export default function PropertyIqLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${display.variable} ${sans.variable} min-h-screen`}>{children}</div>;
}
