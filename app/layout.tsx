import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteFooter from '@/components/SiteFooter';
import AppProviders from '@/components/providers/AppProviders';
import NativeShellInit from '@/components/NativeShellInit';
import { getSiteUrl } from '@/lib/site-url';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = getSiteUrl();
const siteTitle = 'PropReady | Your Home. Ready.';
const siteDescription =
    '100% free for buyers and sellers — get pre-qualified for a home loan, learn the property journey, and connect with verified professionals in South Africa.';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: siteTitle,
        template: '%s | PropReady',
    },
    description: siteDescription,
    keywords: 'home loans, property, South Africa, pre-qualification, FLISP, bond, conveyancer',
    applicationName: 'PropReady',
    authors: [{ name: 'PropReady' }],
    creator: 'PropReady',
    publisher: 'PropReady',
    openGraph: {
        type: 'website',
        locale: 'en_ZA',
        url: siteUrl,
        siteName: 'PropReady',
        title: siteTitle,
        description: siteDescription,
    },
    twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: siteDescription,
    },
    robots: {
        index: true,
        follow: true,
    },
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
