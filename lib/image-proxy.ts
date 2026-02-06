/**
 * Returns a proxied URL for external images that may block CORS (e.g. Property24).
 * Use for img src when displaying property images from imported listings.
 */
const CORS_BLOCKED_HOSTS = [
  'images.prop24.com',
  'prop24.com',
  'www.prop24.com',
  'property24.com',
  'images.privateproperty.co.za',
  'www.privateproperty.co.za',
  'privateproperty.co.za',
  'cdn.privateproperty.co.za',
];

export function getProxiedImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const needsProxy = CORS_BLOCKED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
    if (needsProxy) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}
