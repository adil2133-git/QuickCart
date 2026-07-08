const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Parses a "HH:mm" (24h) string into minutes-since-midnight.
// Returns null for missing/malformed input so callers treat it as "no hours set".
function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function getLiveStoreStatus(store, now = new Date()) {
    if (store.isManuallyClosed) {
        return { status: "CLOSED", reason: "MANUALLY_CLOSED" };
    }

    if (store.storeStatus === "BUSY") {
        return { status: "BUSY", reason: "MANUALLY_BUSY" };
    }

    if (store.storeStatus === "OPEN") {
        return { status: "OPEN", reason: "MANUALLY_OPEN" };
    }

    const todayName = DAY_NAMES[now.getDay()];
    const todayHours = (store.operatingHours || []).find((h) => h.day === todayName);

    if (!todayHours || todayHours.isClosed) {
        return { status: "CLOSED", reason: "OUTSIDE_HOURS" };
    }

    const openMinutes = parseTimeToMinutes(todayHours.openTime);
    const closeMinutes = parseTimeToMinutes(todayHours.closeTime);

    if (openMinutes === null || closeMinutes === null) {
        // Malformed/incomplete hours — fail safe to CLOSED rather than guessing
        return { status: "CLOSED", reason: "HOURS_NOT_SET" };
    }

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const isOpen =
        closeMinutes > openMinutes
            ? nowMinutes >= openMinutes && nowMinutes < closeMinutes
            : // Overnight hours, e.g. open 18:00, close 02:00
              nowMinutes >= openMinutes || nowMinutes < closeMinutes;

    return isOpen ? { status: "OPEN", reason: "WITHIN_HOURS" } : { status: "CLOSED", reason: "OUTSIDE_HOURS" };
}

// Haversine distance in km — used instead of MongoDB's $near since coordinates
// are stored as a plain { lat, lng } object, not GeoJSON.
function distanceInKm(pointA, pointB) {
    if (
        !pointA ||
        !pointB ||
        typeof pointA.lat !== "number" ||
        typeof pointA.lng !== "number" ||
        typeof pointB.lat !== "number" ||
        typeof pointB.lng !== "number"
    ) {
        return null;
    }

    const R = 6371; // Earth radius in km
    const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180;
    const dLng = ((pointB.lng - pointA.lng) * Math.PI) / 180;
    const lat1 = (pointA.lat * Math.PI) / 180;
    const lat2 = (pointB.lat * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

module.exports = { getLiveStoreStatus, distanceInKm, parseTimeToMinutes };