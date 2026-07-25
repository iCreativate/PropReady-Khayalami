import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, getAppUrl } from '@/lib/auth-enterprise';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';

function resolveAppUrl(request: NextRequest) {
    const origin = (request.headers.get('origin') || request.nextUrl.origin).replace(/\/$/, '');
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
    }
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

        const accountType = parseAccountType(type);
        const result = await createMagicLink(String(email).trim(), accountType, {
            appUrl: resolveAppUrl(request),
        });

        return NextResponse.json({
            success: true,
            message:
                'If that email can receive mail, a sign-in link has been sent (expires in 15 minutes).',
            ...(result.link ? { link: result.link } : {}),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not send magic link';
        if (message.includes('company email') || message.includes('Gmail') || message.includes('Free addresses')) {
            return NextResponse.json({ success: false, error: message }, { status: 400 });
        }
        console.error('auth/magic-link:', err);
        return NextResponse.json({ success: false, error: 'Could not send magic link' }, { status: 500 });
    }
}
