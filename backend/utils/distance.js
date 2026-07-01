// Haversine formula — returns distance in kilometres between two
// { lat, lng } coordinate pairs. Accurate enough for delivery radius
// checks (±0.5% error, well within our 5km granularity).
function haversineKm(a, b) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
        sinDLat * sinDLat +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
    return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

module.exports = { haversineKm };