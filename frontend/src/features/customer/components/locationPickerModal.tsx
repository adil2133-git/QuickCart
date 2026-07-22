// src/features/customer/components/LocationPickerModal.tsx
//
// Shown on CustomerHome when the user has no saved default address.
// Flow: GPS auto-detect OR type address → Nominatim geocode → Leaflet map
// with draggable pin → label (Home / Work / Other) → Confirm → POST to API.
//
// Uses the exact same Leaflet + Nominatim setup as StoreRegistration.
//
// Fix in this version:
//   - The overlay wrapper had z-50, the SAME z-index as NavBar's
//     <motion.header className="sticky top-0 z-50 ...">. With a tie, the
//     browser falls back to DOM/paint order, and the navbar (painted later
//     in that part of the tree) was winning, visually clipping the top of
//     this modal underneath the navbar's opaque background.
//   - Bumped this overlay to z-[100] (well above the navbar's z-50) so it's
//     unambiguously on top, regardless of mount order.
//   - Added an optional `onClose` prop: ✕ button in the header, clicking
//     the backdrop, and pressing Escape all dismiss the modal without
//     saving. Previously there was no way out once it was open — fine for
//     a brand-new customer who genuinely has zero addresses and needs one
//     to continue, but wrong for the "Add new address" entry point from
//     LocationPicker, where the user already has an address and should be
//     able to back out. `onClose` is optional precisely so both flows work:
//     pass it from "Add new address", omit it for the forced first-time flow.

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    MapPin, Navigation, Search, X, Check,
    Home, Briefcase, Tag, Loader2,
} from "lucide-react";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coords {
    lat: number;
    lng: number;
}

interface ConfirmedLocation extends Coords {
    resolvedAddress: string | null;
}

interface LocationPickerModalProps {
    /** Called after the address is successfully saved to the backend */
    onSaved: (addressLabel: string) => void;
    /**
     * Called when the user wants to dismiss the modal without saving
     * (✕ button or clicking the backdrop). Optional: omit this prop for
     * flows where the modal must be completed (e.g. a brand-new customer
     * with zero saved addresses, who needs at least one to continue) — in
     * that case the ✕ button and backdrop-click simply won't render/fire.
     */
    onClose?: () => void;
}

// ─── Address Labels ───────────────────────────────────────────────────────────

const LABELS = [
    { value: "Home", icon: Home },
    { value: "Work", icon: Briefcase },
    { value: "Other", icon: Tag },
];

// ─── Marker icon (matches StoreRegistration style) ────────────────────────────

const makeMarkerIcon = () =>
    L.divIcon({
        className: "",
        html: `<div style="
      width:36px;height:36px;
      background:#735A3E;
      border:3px solid #291803;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 4px 12px rgba(41,24,3,0.35);
    "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationPickerModal({ onSaved, onClose }: LocationPickerModalProps) {
    // Map refs
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    // Location state
    const [pending, setPending] = useState<Coords | null>(null);
    const [confirmed, setConfirmed] = useState<ConfirmedLocation | null>(null);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);

    // Search state
    const [searchText, setSearchText] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    // GPS state
    const [gpsLoading, setGpsLoading] = useState(false);

    // Label + save state
    const [selectedLabel, setSelectedLabel] = useState("Home");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ── Lock background scroll while the modal is open ─────────────────────────
    // Without this, the page behind can still scroll (you can see this in the
    // earlier screenshot — the navbar scrolled away while the modal stayed
    // pinned to the viewport). Locking body scroll keeps the backdrop steady
    // and reinforces that this is a true overlay, not part of page flow.
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    // ── Escape key closes the modal (only when dismissal is allowed) ───────────
    useEffect(() => {
        if (!onClose) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setResolving(true);
        setResolvedAddress(null);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            setResolvedAddress(data?.display_name || null);
        } catch {
            setResolvedAddress(null);
        } finally {
            setResolving(false);
        }
    }, []);

    const updatePending = useCallback((lat: number, lng: number) => {
        const coords = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
        setPending(coords);
        setConfirmed(null);
        void reverseGeocode(coords.lat, coords.lng);
    }, [reverseGeocode]);

    const placePin = useCallback((map: L.Map, lat: number, lng: number) => {
        if (markerRef.current) markerRef.current.remove();

        const marker = L.marker([lat, lng], {
            icon: makeMarkerIcon(),
            draggable: true,
        }).addTo(map);

        marker.on("dragend", (e) => {
            const pos = (e.target as L.Marker).getLatLng();
            updatePending(pos.lat, pos.lng);
        });

        markerRef.current = marker;
        updatePending(lat, lng);
    }, [updatePending]);

    // ── Init Leaflet map ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [20.5937, 78.9629], // India default
            zoom: 5,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);

        // Click on map to pin
        map.on("click", (e: L.LeafletMouseEvent) => {
            placePin(map, e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [placePin]);

    // ── GPS ───────────────────────────────────────────────────────────────────

    const handleGPS = () => {
        if (!navigator.geolocation || !mapRef.current) return;
        setSearchError("");
        setGpsLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                mapRef.current!.setView([lat, lng], 17);
                placePin(mapRef.current!, lat, lng);
                setGpsLoading(false);
            },
            () => {
                setSearchError("Couldn't get your location. Check permissions or search manually.");
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // ── Search ────────────────────────────────────────────────────────────────

    const handleSearch = async () => {
        const q = searchText.trim();
        if (!q || !mapRef.current) return;

        setSearchError("");
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();

            if (data?.[0]) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                mapRef.current!.setView([lat, lng], 17);
                placePin(mapRef.current!, lat, lng);
            } else {
                setSearchError("Address not found. Try a nearby landmark or pin it on the map.");
            }
        } catch {
            setSearchError("Search failed. Check your connection and try again.");
        } finally {
            setSearching(false);
        }
    };

    // ── Confirm pin ───────────────────────────────────────────────────────────

    const handleConfirm = () => {
        if (!pending) return;
        setConfirmed({ ...pending, resolvedAddress });
    };

    // ── Save to backend ───────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!confirmed) return;
        setSaveError("");
        setSaving(true);

        try {
            await api.post("/customer/address", {
                label: selectedLabel,
                address: confirmed.resolvedAddress || `${confirmed.lat}, ${confirmed.lng}`,
                coordinates: { lat: confirmed.lat, lng: confirmed.lng },
            });
            onSaved(selectedLabel);
        } catch (err: unknown) {
            setSaveError(getApiErrorMessage(err, "Couldn't save address. Try again."));
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const isConfirmed = !!confirmed;
    const canSave = isConfirmed;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(29,27,22,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => onClose?.()}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full overflow-hidden rounded-2xl"
                style={{
                    maxWidth: 520,
                    backgroundColor: "#FFF9EF",
                    boxShadow: "0px 24px 64px rgba(29,27,22,0.22)",
                    border: "1px solid #D2C4B9",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* ── Header ── */}
                <div
                    className="px-6 pt-6 pb-4 border-b"
                    style={{ borderColor: "#EFE6D8" }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: "#735A3E" }}
                        >
                            <MapPin size={18} color="#FFF9EF" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2
                                className="font-bold text-lg leading-tight"
                                style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}
                            >
                                Where should we deliver?
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: "#80756B" }}>
                                Set your delivery location to see nearby stores and products.
                            </p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#F3EAE0]"
                                style={{ color: "#80756B" }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">

                    {/* ── GPS button ── */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGPS}
                        disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
                        style={{
                            borderColor: "#C2A383",
                            color: "#735A3E",
                            backgroundColor: "#F9F3EA",
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        {gpsLoading
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Navigation size={15} />
                        }
                        {gpsLoading ? "Detecting location…" : "Use my current location"}
                    </motion.button>

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ backgroundColor: "#E5DAC9" }} />
                        <span className="text-xs font-medium" style={{ color: "#9C8C7C" }}>or search</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "#E5DAC9" }} />
                    </div>

                    {/* ── Search row ── */}
                    <div className="flex gap-2">
                        <div
                            className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5"
                            style={{ backgroundColor: "#F9F3EA", borderColor: "#D2C4B9" }}
                        >
                            <Search size={14} color="#9C8C7C" />
                            <input
                                type="text"
                                placeholder="Search for your area, street…"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="flex-1 bg-transparent text-sm outline-none"
                                style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}
                            />
                            {searchText && (
                                <button onClick={() => setSearchText("")}>
                                    <X size={13} color="#9C8C7C" />
                                </button>
                            )}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSearch}
                            disabled={searching || !searchText.trim()}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                            style={{
                                backgroundColor: "#735A3E",
                                color: "#FFF9EF",
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            {searching ? <Loader2 size={14} className="animate-spin" /> : "Go"}
                        </motion.button>
                    </div>

                    {searchError && (
                        <p className="text-xs" style={{ color: "#C24B3F" }}>{searchError}</p>
                    )}

                    {/* ── Map ── */}
                    <div
                        className="overflow-hidden rounded-xl border-2 transition-colors"
                        style={{
                            borderColor: isConfirmed ? "#735A3E" : pending ? "#C2A383" : "#D2C4B9",
                        }}
                    >
                        <div ref={mapContainerRef} style={{ height: 240, width: "100%" }} />
                    </div>

                    {/* ── Pin status panel ── */}
                    <div
                        className="rounded-xl p-3 space-y-2"
                        style={{
                            backgroundColor: isConfirmed ? "rgba(115,90,62,0.08)" : pending ? "#F9F3EA" : "#F5F1EE",
                            border: `1px solid ${isConfirmed ? "#C2A383" : pending ? "#D2C4B9" : "#E8E1DD"}`,
                        }}
                    >
                        {!pending && (
                            <p className="text-xs text-center" style={{ color: "#9C8C7C" }}>
                                Tap the map, search, or use GPS to drop a pin.
                            </p>
                        )}

                        {pending && (
                            <>
                                <div className="flex items-start gap-2">
                                    <div
                                        className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                                        style={{ backgroundColor: isConfirmed ? "#735A3E" : "#C2A383" }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold font-mono" style={{ color: "#5C4A35" }}>
                                            {pending.lat}, {pending.lng}
                                        </p>
                                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6D614F" }}>
                                            {resolving ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 size={10} className="animate-spin" />
                                                    Looking up address…
                                                </span>
                                            ) : resolvedAddress ? (
                                                resolvedAddress
                                            ) : (
                                                "Coordinates saved — couldn't resolve a street address."
                                            )}
                                        </p>
                                    </div>
                                    {isConfirmed && (
                                        <span
                                            className="flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                            style={{ backgroundColor: "rgba(115,90,62,0.15)", color: "#735A3E" }}
                                        >
                                            <Check size={10} /> Confirmed
                                        </span>
                                    )}
                                </div>

                                {!isConfirmed && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs" style={{ color: "#9C8C7C" }}>
                                            Drag the pin to fine-tune, then confirm.
                                        </p>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleConfirm}
                                            className="w-full rounded-lg py-2.5 text-sm font-semibold"
                                            style={{
                                                backgroundColor: "#C2A383",
                                                color: "#291803",
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}
                                        >
                                            Confirm this location
                                        </motion.button>
                                    </div>
                                )}

                                {isConfirmed && (
                                    <button
                                        onClick={() => setConfirmed(null)}
                                        className="text-xs font-semibold underline"
                                        style={{ color: "#735A3E" }}
                                    >
                                        Change pin
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Label selector — only shown after confirming ── */}
                    <AnimatePresence>
                        {isConfirmed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <p className="text-xs font-semibold" style={{ color: "#4E453D" }}>
                                    Save this as
                                </p>
                                <div className="flex gap-2">
                                    {LABELS.map(({ value, icon: Icon }) => (
                                        <motion.button
                                            key={value}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedLabel(value)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors"
                                            style={{
                                                borderColor: selectedLabel === value ? "#735A3E" : "#D2C4B9",
                                                backgroundColor: selectedLabel === value ? "rgba(115,90,62,0.08)" : "#F9F3EA",
                                                color: selectedLabel === value ? "#735A3E" : "#80756B",
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}
                                        >
                                            <Icon size={13} />
                                            {value}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Save error ── */}
                    {saveError && (
                        <p className="text-xs" style={{ color: "#C24B3F" }}>{saveError}</p>
                    )}

                    {/* ── Save button ── */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSave || saving}
                        className="w-full rounded-xl py-3.5 text-sm font-semibold transition-opacity disabled:opacity-40"
                        style={{
                            backgroundColor: "#735A3E",
                            color: "#FFF9EF",
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: "0px 4px 16px rgba(115,90,62,0.25)",
                        }}
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Saving…
                            </span>
                        ) : (
                            "Save & continue"
                        )}
                    </motion.button>

                    <p className="text-center text-xs" style={{ color: "#9C8C7C" }}>
                        You can change or add more addresses later from your profile.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}