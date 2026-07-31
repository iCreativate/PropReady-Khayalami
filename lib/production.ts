/**
 * Production runtime gates for PropReady.
 * Demo/seed/debug paths must stay off unless explicitly enabled.
 */

export function isProductionRuntime(): boolean {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

/** Explicit opt-in for local/demo tooling (never set on Netlify production). */
export function isDemoToolsEnabled(): boolean {
    if (process.env.ALLOW_DEMO_SEED === 'true') return true;
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO === '1') return true;
    return !isProductionRuntime() && process.env.NEXT_PUBLIC_ENABLE_DEMO !== '0';
}

export function assertDemoToolsAllowed(): { ok: true } | { ok: false; response: Response } {
    if (isDemoToolsEnabled()) return { ok: true };
    return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'Not available in production' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        }),
    };
}
