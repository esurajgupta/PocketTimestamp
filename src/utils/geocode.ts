// Reverse geocoder using Google Maps Geocoding API
// Docs: https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding

export type GeoAddress = {
  displayName: string;
};

const GOOGLE_API_KEY = 'AIzaSyBfXLFKmSLFwyDgJybGsIJ9rWHnXKqjDow';

export async function reverseGeocode(lat: number, lon: number): Promise<GeoAddress | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      lat,
    )},${encodeURIComponent(lon)}&key=${encodeURIComponent(GOOGLE_API_KEY)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json?.status !== 'OK' || !Array.isArray(json.results) || json.results.length === 0) {
      return null;
    }
    const display = json.results[0]?.formatted_address as string | undefined;
    if (!display) return null;
    return { displayName: display };
  } catch {
    return null;
  }
}


