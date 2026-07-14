// average two-wheeler city speed, used for rough ETA estimates
const AVERAGE_SPEED_KMH = 22;

// straight-line distance in km between two coordinates
export function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateEtaMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const km = haversineKm(from, to);
  const minutes = (km / AVERAGE_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}