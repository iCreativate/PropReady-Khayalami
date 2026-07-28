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
        <div className="sticky top-0 z-[60] bg-charcoal text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-start gap-2 min-w-0 flex-1">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
                <p className="text-sm leading-snug">
                    <span className="font-semibold">Staff access</span>
                    {' — '}
                    viewing {info.targetName || info.targetEmail} as {info.adminEmail}. Changes affect
                    this real account.
                </p>
            </div>
            <button
                type="button"
                onClick={() => void exit()}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-gold text-white text-xs font-semibold shrink-0"
            >
                <LogOut className="w-3.5 h-3.5" />
                Exit to admin
            </button>
        </div>
    );
}
