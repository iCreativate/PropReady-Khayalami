import type { NextRequest } from 'next/server';

export function getRequestMeta(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const deviceFingerprint =
        request.headers.get('x-device-fingerprint') ||
        request.cookies.get('pr_device_fp')?.value ||
        undefined;

    return { ip, userAgent, deviceFingerprint };
}
