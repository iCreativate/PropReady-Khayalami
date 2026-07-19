import { Suspense } from 'react';
import AuthLoginClient from './AuthLoginClient';

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <AuthLoginClient />
        </Suspense>
    );
}
