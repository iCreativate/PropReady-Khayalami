'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';

type Announcement = {
    id: string;
    title: string;
    body: string;
    audience: string;
    active: boolean;
    publishedAt: string;
    createdByEmail?: string;
};

export default function AdminAnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('all');
    const [alsoMessage, setAlsoMessage] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/announcements', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setItems(data.announcements || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function publish(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, audience, alsoMessage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Publish failed');
            setTitle('');
            setBody('');
            if (data.broadcast?.sent != null) {
                alert(
                    `Published.${alsoMessage ? ` Also messaged ${data.broadcast.sent}/${data.broadcast.recipientCount} accounts.` : ''}`
                );
            }
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Publish failed');
        } finally {
            setSaving(false);
        }
    }

    async function setActive(id: string, active: boolean) {
        setError('');
        const res = await fetch('/api/admin/announcements', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, active }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Update failed');
            return;
        }
        await load();
    }

    return (
        <AdminShell title="Announcements">
            <p className="text-sm text-charcoal/55 mb-5">
                Publish latest updates for the platform. Announcements appear in portal banners.
                Optionally also deliver them as inbox messages to every matching account.
            </p>

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

            <form
                onSubmit={publish}
                className="mb-8 rounded-2xl border border-charcoal/[0.08] bg-white p-5 space-y-3"
            >
                <div className="flex items-center gap-2 text-charcoal font-semibold">
                    <Megaphone className="w-4 h-4 text-gold" />
                    New announcement
                </div>
                <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                />
                <textarea
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Latest update / announcement body…"
                    rows={4}
                    className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    >
                        <option value="all">Everyone</option>
                        <option value="user">Buyers / sellers</option>
                        <option value="agent">Agents</option>
                        <option value="originator">Originators</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-charcoal/70">
                        <input
                            type="checkbox"
                            checked={alsoMessage}
                            onChange={(e) => setAlsoMessage(e.target.checked)}
                        />
                        Also send as inbox message to each account
                    </label>
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-11 px-4 rounded-xl bg-gold text-white text-sm font-semibold disabled:opacity-60 sm:ml-auto"
                    >
                        {saving ? 'Publishing…' : 'Publish'}
                    </button>
                </div>
            </form>

            {loading ? <PortalLoading variant="inline" message="Loading…" /> : null}

            <div className="rounded-2xl border border-charcoal/[0.08] bg-white divide-y divide-charcoal/[0.05]">
                {!loading && items.length === 0 ? (
                    <p className="p-8 text-center text-sm text-charcoal/45">No announcements yet</p>
                ) : null}
                {items.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-charcoal">{item.title}</p>
                                <span className="text-[11px] uppercase tracking-wide text-charcoal/40 bg-charcoal/[0.04] px-2 py-0.5 rounded-md">
                                    {item.audience}
                                </span>
                                {!item.active ? (
                                    <span className="text-[11px] text-red-600">Inactive</span>
                                ) : null}
                            </div>
                            <p className="text-sm text-charcoal/65 mt-1 whitespace-pre-wrap">{item.body}</p>
                            <p className="text-xs text-charcoal/40 mt-2">
                                {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ''}
                                {item.createdByEmail ? ` · ${item.createdByEmail}` : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void setActive(item.id, !item.active)}
                            className="text-xs font-medium text-charcoal/55 hover:text-charcoal shrink-0"
                        >
                            {item.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                    </div>
                ))}
            </div>
        </AdminShell>
    );
}
