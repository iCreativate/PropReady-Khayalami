export type LocationResult =
  | { ok: true; city: string; latitude: number; longitude: number }
  | { ok: false; error: 'unsupported' | 'permission_denied' | 'timeout' | 'unavailable' | 'api_error' };

/**
 * Get city name from browser geolocation using OpenStreetMap Nominatim (free, no API key).
 * Returns { ok: true, city, latitude, longitude } or { ok: false, error } on failure.
 * Nominatim requires a valid User-Agent per usage policy.
 */
export async function getLocationFromBrowser(): Promise<LocationResult> {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    return { ok: false, error: 'unsupported' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'PropReady/1.0 (https://propready.co.za; property platform)',
              },
            }
          );
          if (!res.ok) {
            resolve({ ok: false, error: 'api_error' });
            return;
          }
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.village ||
            data.address?.locality ||
            data.address?.county ||
            data.address?.state ||
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.region ||
            '';
          resolve(city ? { ok: true, city, latitude: lat, longitude: lon } : { ok: false, error: 'api_error' });
        } catch {
          resolve({ ok: false, error: 'api_error' });
        }
      },
      (err: GeolocationPositionError) => {
        if (err.code === 1) resolve({ ok: false, error: 'permission_denied' });
        else if (err.code === 3) resolve({ ok: false, error: 'timeout' });
        else resolve({ ok: false, error: 'unavailable' });
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: true }
    );
  });
}
