'use client';

import { useEffect, useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';

/** Shown while PropReady staff are viewing a member account. */
export default function ImpersonationBanner() {
    const [info, setInfo] = useState<{
        adminEmail: string;
        targetEmail: string;
        targetName?: string;
    } | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                const by = data?.user?.impersonatedBy;
                if (by && data?.user?.email) {
                    setInfo({
                        adminEmail: by,
                        targetEmail: data.user.email,
                        targetName: data.user.fullName,
                    });
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function exit() {
        const res = await fetch('/api/admin/accounts/impersonate', {
            method: 'DELETE',
            credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        window.location.href = data.redirectTo || '/admin/accounts';
    }

    if (!info) return null;

    return (
        <div className="sticky top-0 z-[60] shrink-0 border-b border-[#E52323]/30 bg-[#111827] px-4 py-2.5 text-white">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#E52323]" />
                    <p className="text-sm leading-snug text-white/90">
                        <span className="font-semibold text-white">Staff access</span>
                        {' — '}
                        viewing {info.targetName || info.targetEmail} as {info.adminEmail}. Changes
                        affect this real account.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void exit()}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#E52323] px-3.5 text-xs font-semibold text-white transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/50"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Exit to admin
                </button>
            </div>
        </div>
    );
}
