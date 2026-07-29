import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteFooter from '@/components/SiteFooter';
import AppProviders from '@/components/providers/AppProviders';
import NativeShellInit from '@/components/NativeShellInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PropReady-iKhayalami | Your Home. Ready.',
    description: '100% Free for buyers and Sellers - Get pre-qualified for a home loan in minutes.',
    keywords: 'home loans, property, South Africa, pre-qualification, FLISP, bond',
};

/** Required for Capacitor SystemBars safe-area CSS vars on Android edge-to-edge. */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} flex flex-col min-h-screen bg-[#F8FAFC]`}>
                <AppProviders>
                    <NativeShellInit />
                    <div className="flex-1">{children}</div>
                    <SiteFooter />
                </AppProviders>
            </body>
        </html>
    );
}
