'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';

export default function MagicLinkClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const accountType = searchParams.get('type') === 'agent' ? 'agent' : 'user';
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid link'); return; }
    fetch('/api/auth/magic-link/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ token, type: accountType, trustedDevice: true }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Link expired'); return; }
      const { hydrateSessionFromCookies } = await import('@/lib/auth-session-bridge');
      await hydrateSessionFromCookies();
      router.replace(data.redirectTo || '/auth/complete');
    }).catch(() => setError('Verification failed'));
  }, [token, accountType, router]);

  return (
    <AuthShell title="Signing you in…" accountType={accountType}>
      {error ? <p className="text-red-600 text-sm">{error}</p> : <p className="text-charcoal/60 text-sm">Verifying your secure link…</p>}
    </AuthShell>
  );
}
