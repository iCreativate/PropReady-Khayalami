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
    title: 'Property Companion™ | PropReady',
    description:
        'Your intelligent property portfolio companion — worth, debt, income, improvements and what to do next.',
};

export default function PropertyIqLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${display.variable} ${sans.variable} min-h-screen`}>{children}</div>;
}
