'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { validatePassword, getPasswordRequirementsText } from '@/lib/password';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const accountType = searchParams.get('type') === 'agent' ? 'agent' : 'user';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pw = validatePassword(password);
    if (!pw.valid) { setError(pw.errors.join(', ')); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, type: accountType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      setDone(true);
    } catch { setError('Reset failed'); } finally { setLoading(false); }
  }

  return (
    <AuthShell title="Set new password" accountType={accountType}>
      {error && <div className="auth-alert auth-alert-error mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
      {done ? (
        <p className="text-sm text-charcoal/70 mb-4">Password updated. All other sessions were signed out.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="auth-label">New password</label>
          <div className="auth-input-wrap mb-2">
            <Lock className="auth-input-icon" />
            <input type="password" required className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <p className="text-xs text-charcoal/45 mb-6">{getPasswordRequirementsText()}</p>
          <button type="submit" disabled={loading || !token} className="auth-btn-primary w-full">Update password</button>
        </form>
      )}
      <p className="text-center text-sm mt-6"><Link href={`/auth/login?type=${accountType}`} className="text-gold">Sign in</Link></p>
    </AuthShell>
  );
}
