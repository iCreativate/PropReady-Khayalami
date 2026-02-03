import { NextRequest, NextResponse } from 'next/server';

/** Extract property data from a listing URL (Property24, Private Property, etc.) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL must be http or https' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PropReady/1.0 (https://propready.co.za; property import)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch page (${res.status})` },
        { status: 422 }
      );
    }

    const html = await res.text();
    const extracted = extractPropertyData(html, url);
    return NextResponse.json(extracted);
  } catch (err) {
    console.error('Property import error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}

interface ExtractedProperty {
  title: string;
  address: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  type: string;
  images: string[];
  features: string[];
  videoUrl: string;
}

const FEATURE_KEYWORDS: { pattern: RegExp; feature: string }[] = [
  { pattern: /\bparking\b/i, feature: 'Parking' },
  { pattern: /\b(?:garden|braai|paved)\b/i, feature: 'Garden' },
  { pattern: /\b(?:security|alarm|electric fence|gated)\b/i, feature: 'Security' },
  { pattern: /\bpet[- ]?friendly|pets?\s+allowed\b/i, feature: 'Pet Friendly' },
  { pattern: /\bpool\b/i, feature: 'Pool' },
  { pattern: /\bgarage\b/i, feature: 'Garage' },
  { pattern: /\bborehole\b/i, feature: 'Borehole' },
  { pattern: /\bsolar\b/i, feature: 'Solar' },
  { pattern: /\bfibre\b/i, feature: 'Fibre' },
];

function extractPropertyData(html: string, pageUrl: string): ExtractedProperty {
  const out: ExtractedProperty = {
    title: '',
    address: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    type: '',
    images: [],
    features: [],
    videoUrl: '',
  };

  // 1. Meta tags
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle?.[1]) out.title = decodeHtml(ogTitle[1]);

  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogDesc?.[1]) out.description = decodeHtml(ogDesc[1]);

  const ogImages = html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi);
  for (const m of ogImages) {
    if (m[1] && !out.images.includes(m[1])) out.images.push(m[1]);
  }
  const ogImageAlt = html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi);
  for (const m of ogImageAlt) {
    if (m[1] && !out.images.includes(m[1])) out.images.push(m[1]);
  }

  // 2. JSON-LD
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch?.[1]) {
    try {
      const parsed = JSON.parse(ldMatch[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = (item['@type'] || '').toLowerCase();
        if (type.includes('realestate') || type.includes('product') || type.includes('place')) {
          if (item.name && !out.title) out.title = String(item.name);
          if (item.description && !out.description) out.description = String(item.description);
          const addr = item.address || item.addressLocality;
          if (addr) {
            const a = typeof addr === 'string' ? addr : (addr.streetAddress || '') + ', ' + (addr.addressLocality || '') + ', ' + (addr.addressRegion || '');
            if (a.trim() && !out.address) out.address = a.replace(/^,\s*|,\s*$/g, '').trim();
          }
          const img = item.image || item.primaryImageOfPage;
          if (img) {
            const urls = Array.isArray(img) ? img : [img];
            for (const u of urls) {
              const src = typeof u === 'string' ? u : u?.url || u?.contentUrl;
              if (src && !out.images.includes(src)) out.images.push(src);
            }
          }
          const offers = item.offers || item.offers?.[0];
          if (offers?.price && !out.price) {
            const p = offers.price;
            out.price = String(typeof p === 'object' ? (p.value ?? p.price ?? '') : p).replace(/\D/g, '');
          }
          if (item.numberOfBedrooms != null && !out.bedrooms) out.bedrooms = String(item.numberOfBedrooms);
          if (item.numberOfBathroomsTotal != null && !out.bathrooms) out.bathrooms = String(item.numberOfBathroomsTotal);
          const fs = item.floorSize;
          if (fs && !out.size) {
            const val = typeof fs === 'object' ? (fs.value ?? fs) : fs;
            if (val != null) out.size = String(Math.round(parseFloat(String(val))));
          }
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  // 3. Common HTML patterns (Property24, Private Property, etc.)
  if (!out.price) {
    const priceMatch = html.match(/R\s*[\d\s,]+(?:\.\d{2})?|[\d\s,]+(?:\.\d{2})?\s*R|price["']?\s*:?\s*["']?([\d\s,]+)/i);
    if (priceMatch) {
      const digits = (priceMatch[0] || priceMatch[1] || '').replace(/\D/g, '');
      if (digits.length >= 4) out.price = digits;
    }
  }

  if (!out.bedrooms) {
    const bedMatch = html.match(/(\d+)\s*(?:bed|bedroom|bedrooms|beds)/i) || html.match(/bedrooms?["']?\s*:?\s*["']?(\d+)/i);
    if (bedMatch?.[1]) out.bedrooms = bedMatch[1];
  }

  if (!out.bathrooms) {
    const bathMatch = html.match(/(\d+)\s*(?:bath|bathroom|bathrooms)/i) || html.match(/bathrooms?["']?\s*:?\s*["']?(\d+)/i);
    if (bathMatch?.[1]) out.bathrooms = bathMatch[1];
  }

  if (!out.size) {
    const sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*m²|(\d+(?:\.\d+)?)\s*sqm|floorSize["']?\s*:?\s*["']?(\d+)/i);
    if (sizeMatch) out.size = String(Math.round(parseFloat(sizeMatch[1] || sizeMatch[2] || sizeMatch[3] || '0')));
  }

  // 4. Property type from common terms
  if (!out.type) {
    const lower = html.toLowerCase();
    if (lower.includes('apartment') || lower.includes('flat')) out.type = 'Apartment';
    else if (lower.includes('townhouse') || lower.includes('town house')) out.type = 'Townhouse';
    else if (lower.includes('duplex')) out.type = 'Duplex';
    else if (lower.includes('house') || lower.includes('home')) out.type = 'House';
  }

  // 5. Images from page (data-src, src for property galleries)
  const imgSrcs = html.matchAll(/(?:data-src|data-lazy|src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/gi);
  const baseUrl = new URL(pageUrl);
  for (const m of imgSrcs) {
    let src = m[1];
    if (src.startsWith('//')) src = 'https:' + src;
    else if (src.startsWith('/')) src = baseUrl.origin + src;
    if (src && !out.images.includes(src) && !src.includes('logo') && !src.includes('avatar')) {
      out.images.push(src);
    }
  }
  // Limit images to avoid huge payloads
  out.images = out.images.slice(0, 20);

  // 6. Features from description / amenities
  const searchText = (out.description || html);
  for (const { pattern, feature } of FEATURE_KEYWORDS) {
    if (pattern.test(searchText) && !out.features.includes(feature)) {
      out.features.push(feature);
    }
  }

  // 7. Video URL (YouTube, Vimeo)
  const ytMatch = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) out.videoUrl = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
  else {
    const vimeoMatch = html.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) out.videoUrl = `https://vimeo.com/${vimeoMatch[1]}`;
  }

  return out;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}
