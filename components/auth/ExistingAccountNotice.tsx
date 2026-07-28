'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

type Props = {
    message: string;
    loginPath?: string;
    resetPasswordPath?: string;
};

/** Shown when registration fails because the email is already registered. */
export default function ExistingAccountNotice({
    message,
    loginPath = '/auth/login',
    resetPasswordPath = '/auth/forgot-password',
}: Props) {
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 space-y-2">
            <p className="flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{message}</span>
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-amber-900/90">
                <Link href={loginPath} className="font-semibold underline underline-offset-2">
                    Log in instead
                </Link>
                <Link href={resetPasswordPath} className="font-semibold underline underline-offset-2">
                    Reset password
                </Link>
            </div>
        </div>
    );
}
