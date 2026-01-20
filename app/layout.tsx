import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PropReady-iKhayalami | Your Home. Ready.',
    description: '100% Free for buyers and Sellers - Get pre-qualified for a home loan in minutes.',
    keywords: 'home loans, property, South Africa, pre-qualification, FLISP, bond',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <div className="flex-1">{children}</div>
                <Footer />
            </body>
        </html>
    );
}
