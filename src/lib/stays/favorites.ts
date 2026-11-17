/**
 * Saved stays live in a plain cookie (no account needed), so the server can
 * render the "Favorites" view. Entries are "propertyId/unitId".
 */
export const STAY_FAVORITES_COOKIE = "mgh_stays_favs";
export const MAX_STAY_FAVORITES = 50;

const KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,64}$/;

export function stayKey(propertyId: string, unitId: string) {
  return `${propertyId}/${unitId}`;
}

export function parseStayFavorites(raw: string | undefined): string[] {
  if (!raw) return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return [];
  }
  const keys = decoded.split(",").filter((key) => KEY_PATTERN.test(key));
  return [...new Set(keys)].slice(0, MAX_STAY_FAVORITES);
}

export function serializeStayFavorites(keys: string[]) {
  return encodeURIComponent(keys.join(","));
}

export function toggleStayFavorite(keys: string[], key: string) {
  return keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key];
}
