import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import '../home-landing.css';
import './calculator-landing.css';

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
    title: 'Bond Calculator | PropReady',
    description:
        'Estimate bond repayments, stress-test rates, reverse affordability and cash-to-close costs for South African home buyers.',
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${display.variable} ${sans.variable} min-h-screen`}>{children}</div>;
}
