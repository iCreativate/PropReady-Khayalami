/**
 * Get city name from browser geolocation using OpenStreetMap Nominatim (free, no API key).
 * Returns { city, latitude, longitude } or null if geolocation/reverse geocode fails.
 */
export async function getLocationFromBrowser(): Promise<{
  city: string;
  latitude: number;
  longitude: number;
} | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.county ||
            data.address?.state ||
            data.address?.suburb ||
            '';
          resolve(city ? { city, latitude: lat, longitude: lon } : null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}
