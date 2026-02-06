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
          const img = item.image || item.primaryImageOfPage || item.photo;
          if (img) {
            const urls = Array.isArray(img) ? img : [img];
            for (const u of urls) {
              const src = typeof u === 'string' ? u : u?.url || u?.contentUrl || u?.image;
              if (src && !out.images.includes(src)) out.images.push(src);
            }
          }
          const offers = item.offers || item.offers?.[0];
          if (offers?.price && !out.price) {
            const p = offers.price;
            out.price = String(typeof p === 'object' ? (p.value ?? p.price ?? p.amount ?? '') : p).replace(/\D/g, '');
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

  // 2b. Hydration JSON (__NEXT_DATA__, __NUXT_DATA__, etc.) - often has full listing data
  const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    || html.match(/<script[^>]*id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    || html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/i);
  if (nextDataMatch?.[1]) {
    try {
      const json = JSON.parse(nextDataMatch[1].trim());
      const extractFromObj = (obj: unknown, path: string[]): unknown => {
        if (!obj || path.length === 0) return obj;
        const key = path[0];
        const next = (obj as Record<string, unknown>)[key];
        return path.length === 1 ? next : extractFromObj(next, path.slice(1));
      };
      const listing = extractFromObj(json, ['props', 'pageProps', 'listing'])
        || extractFromObj(json, ['props', 'pageProps', 'property'])
        || extractFromObj(json, ['data', 'listing'])
        || extractFromObj(json, ['listing'])
        || (typeof json === 'object' && json !== null ? json : null);
      if (listing && typeof listing === 'object') {
        const L = listing as Record<string, unknown>;
        if (!out.price) {
          const p = L.price ?? L.listingPrice ?? L.amount ?? L.askingPrice ?? L.displayPrice;
          if (p != null) {
            const num = typeof p === 'number' ? p : parseFloat(String(p).replace(/\D/g, ''));
            if (!isNaN(num) && num > 0) out.price = String(Math.round(num));
          }
        }
        const imgs = L.images ?? L.photos ?? L.gallery ?? L.media;
        if (imgs && Array.isArray(imgs)) {
          for (const img of imgs) {
            const src = typeof img === 'string' ? img : (img as Record<string, unknown>)?.url ?? (img as Record<string, unknown>)?.src ?? (img as Record<string, unknown>)?.image;
            if (src && typeof src === 'string' && !out.images.includes(src)) out.images.push(src);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Common HTML patterns (Property24, Private Property, etc.) - Price
  if (!out.price) {
    // JSON-style: "price":1500000 or "listingPrice":"1500000" or "amount":1500000
    const jsonPriceMatch = html.match(/"price"\s*:\s*["']?(\d[\d\s,.]*)/i)
      || html.match(/"listingPrice"\s*:\s*["']?(\d[\d\s,.]*)/i)
      || html.match(/"amount"\s*:\s*["']?(\d[\d\s,.]*)/i)
      || html.match(/"displayPrice"\s*:\s*["']?(\d[\d\s,.]*)/i)
      || html.match(/"askingPrice"\s*:\s*["']?(\d[\d\s,.]*)/i);
    if (jsonPriceMatch?.[1]) {
      const digits = jsonPriceMatch[1].replace(/\D/g, '');
      if (digits.length >= 4) out.price = digits;
    }
  }
  if (!out.price) {
    // R 1 500 000 or R1,500,000 or R1.5m or R 1.5 million
    const priceMatch = html.match(/R\s*(\d+(?:[.,]\d+)?)\s*[mM]illion?/i)
      || html.match(/R\s*([\d\s,]+)(?:\.\d{2})?/i)
      || html.match(/([\d\s,]+)(?:\.\d{2})?\s*R/i);
    if (priceMatch?.[1]) {
      let raw = priceMatch[1];
      if (raw.toLowerCase().includes('m') || (priceMatch[0] || '').toLowerCase().includes('million')) {
        const num = parseFloat(raw.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) raw = String(Math.round(num * 1000000));
      } else {
        raw = raw.replace(/\D/g, '');
      }
      if (raw.length >= 4) out.price = raw;
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

  // 5. Images from page - multiple patterns for property galleries
  const baseUrl = new URL(pageUrl);
  const resolveUrl = (src: string): string => {
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('/')) return baseUrl.origin + src;
    return src;
  };
  const addImage = (src: string) => {
    const resolved = resolveUrl(src);
    if (resolved && !out.images.includes(resolved)) {
      const lower = resolved.toLowerCase();
      if (!lower.includes('logo') && !lower.includes('avatar') && !lower.includes('icon') && !lower.includes('placeholder')) {
        out.images.push(resolved);
      }
    }
  };

  // 5a. data-src, data-lazy, data-original, data-srcset (lazy-loaded gallery images)
  const dataSrcPatterns = [
    /data-src=["']([^"']+)["']/gi,
    /data-lazy=["']([^"']+)["']/gi,
    /data-original=["']([^"']+)["']/gi,
    /data-srcset=["']([^"']+)["']/gi,
    /data-lazy-src=["']([^"']+)["']/gi,
  ];
  for (const re of dataSrcPatterns) {
    for (const m of html.matchAll(re)) {
      const raw = m[1];
      if (raw.includes('.jpg') || raw.includes('.jpeg') || raw.includes('.png') || raw.includes('.webp') || raw.includes('.gif')) {
        addImage(raw.split(/\s+/)[0]);
      } else {
        addImage(raw);
      }
    }
  }

  // 5b. Standard img src - property galleries often use /images/ or /photos/ or /media/ in path
  const imgSrcs = html.matchAll(/(?:data-src|data-lazy|src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/gi);
  for (const m of imgSrcs) {
    addImage(m[1]);
  }

  // 5c. JSON arrays of image URLs in script or data attributes
  const jsonImgMatches = html.matchAll(/(?:images|photos|gallery|media)\s*:\s*\[([^\]]+)\]/gi);
  for (const m of jsonImgMatches) {
    const urls = m[1].match(/["'](https?:\/\/[^"']+)["']/g) || m[1].match(/["'](\/[^"']+)["']/g);
    if (urls) {
      for (const u of urls) {
        const src = u.replace(/^["']|["']$/g, '');
        if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp')) {
          addImage(src);
        }
      }
    }
  }

  // 5d. background-image: url(...) - some galleries use CSS
  const bgMatches = html.matchAll(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi);
  for (const m of bgMatches) {
    if (m[1].includes('.jpg') || m[1].includes('.png') || m[1].includes('.webp')) addImage(m[1]);
  }

  // Limit images but keep more (up to 50 for imported listings)
  out.images = out.images.slice(0, 50);

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
