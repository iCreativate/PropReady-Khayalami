import Link from 'next/link';
import { redirect } from 'next/navigation';

/** Public entry — send staff to dedicated originator login. */
export default function OriginatorsLandingPage() {
    redirect('/originators/login');
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Link href="/originators/login" className="text-gold font-medium">
                Sign in as bond originator
            </Link>
        </div>
    );
}
