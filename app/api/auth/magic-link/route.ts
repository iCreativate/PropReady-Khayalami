import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, getAppUrl } from '@/lib/auth-enterprise';
import type { AccountType } from '@/lib/auth-enterprise';

function resolveAppUrl(request: NextRequest) {
    const origin = (request.headers.get('origin') || request.nextUrl.origin).replace(/\/$/, '');
    // Local: use the browser origin so links hit localhost, not production
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
    }
    // Live / preview: prefer the host the user is on, then configured app URL
    if (/propready\.live|prop-ready|netlify\.app|vercel\.app/i.test(origin)) {
        return origin;
    }
    return getAppUrl();
}

export async function POST(request: NextRequest) {
    try {
        const { email, type = 'user' } = await request.json();
        if (!email) {
            return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
        }

        const accountType: AccountType = type === 'agent' ? 'agent' : 'user';
        const result = await createMagicLink(String(email).trim(), accountType, {
            appUrl: resolveAppUrl(request),
        });

        return NextResponse.json({
            success: true,
            message: 'If that email can receive mail, a sign-in link has been sent (expires in 15 minutes).',
            // Only returned in local/dev so you can test without waiting on email delivery
            ...(result.link ? { link: result.link } : {}),
        });
    } catch (err) {
        console.error('auth/magic-link:', err);
        return NextResponse.json({ success: false, error: 'Could not send magic link' }, { status: 500 });
    }
}
