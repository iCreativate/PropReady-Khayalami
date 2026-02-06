import { NextRequest, NextResponse } from 'next/server';

/** Allowed domains for image proxying (property listing sites that block CORS) */
const ALLOWED_HOSTS = [
  'images.prop24.com',
  'prop24.com',
  'www.prop24.com',
  'property24.com',
  'images.privateproperty.co.za',
  'www.privateproperty.co.za',
  'privateproperty.co.za',
  'cdn.privateproperty.co.za',
  'i.raw.githubusercontent.com',
  'supabase.co',
  '*.supabase.co',
  '*.supabase.in',
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const base = allowed.slice(2);
        return host === base || host.endsWith('.' + base);
      }
      return host === allowed;
    });
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }
  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PropReady/1.0 (https://propready.live; image proxy)',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }
}
