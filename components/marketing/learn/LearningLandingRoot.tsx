import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import '@/app/home-landing.css';
import '@/app/learning-landing.css';

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

/** Loads landing fonts + CSS for learning center / hub pages. */
export default function LearningLandingRoot({ children }: { children: React.ReactNode }) {
    return <div className={`${display.variable} ${sans.variable} min-h-screen`}>{children}</div>;
}
