// src/features/auth/components/StoreRegistration.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import OtpVerificationModal from "../components/otpVerificationModal";
import PasswordStrengthBar from "../components/shared/passwordStrengthBar";
import { useInputFocusStyle } from "../hooks/useInputFocusStyle";
import { storeRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

type UploadState = { file: File | null };

type Coords = { lat: number; lng: number };

// What gets saved to form state once the user clicks "Confirm Location".
// Until this exists, the form's `location` is null and submission is blocked.
type ConfirmedLocation = {
  lat: number;
  lng: number;
  resolvedAddress: string | null; // reverse-geocoded label shown to the user, may be null if lookup failed
};



// ─── Upload Card ─────────────────────────────────────────────────────────────
function UploadCard({
  icon,
  label,
  sub,
  upload,
  onUpload,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  upload: UploadState;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const uploaded = !!upload.file;
  return (
    <div
      onClick={() => ref.current?.click()}
      className="relative group p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
      style={{
        borderColor: uploaded ? "#145C43" : "#DCE3DC",
        backgroundColor: uploaded ? "#E8EFEC" : "#F5F7F3",
      }}
    >
      <input
        ref={ref}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onUpload(e.target.files[0]);
        }}
      />
      <div style={{ color: uploaded ? "#145C43" : "#6E7C74" }}>{icon}</div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p
          className="text-xs mt-0.5"
          style={{
            color: uploaded ? "#145C43" : "#6E7C74",
            fontWeight: uploaded ? 600 : 400,
          }}
        >
          {uploaded ? `Uploaded: ${upload.file?.name}` : sub}
        </p>
      </div>
    </div>
  );
}

// ─── Location Step ────────────────────────────────────────────────────────────
// Implements the explicit flow:
//   1. User clicks "Use Current Location" OR types a search query
//   2. A marker appears
//   3. User can drag the marker to fine-tune
//   4. User clicks "Confirm Location" — only THEN is the location saved
//      to the parent form. Dragging or re-searching after a confirm
//      un-confirms it, so a stale confirm can never silently survive a change.
function LocationStep({
  confirmed,
  onConfirm,
  initialAddressHint,
}: {
  confirmed: ConfirmedLocation | null;
  onConfirm: (loc: ConfirmedLocation | null) => void;
  initialAddressHint: string; // address+pincode typed earlier in the form, used to prefill the search box once
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ map: L.Map; markerIcon: L.DivIcon } | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchText, setSearchText] = useState("");
  const [searching, setGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Pending = pinned but not yet confirmed by the user.
  const [pending, setPending] = useState<Coords | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [searchError, setSearchError] = useState("");

  const hintAppliedRef = useRef(false);

  const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
  const DEFAULT_ZOOM = 5;

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    setResolvedAddress(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      setResolvedAddress(data?.display_name || null);
    } catch {
      setResolvedAddress(null);
    } finally {
      setResolving(false);
    }
  }, []);

  const setPendingCoords = useCallback((lat: number, lng: number) => {
    const rounded = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    setPending(rounded);
    onConfirm(null);
    void reverseGeocode(rounded.lat, rounded.lng);
  }, [onConfirm, reverseGeocode]);

  const placeMarker = useCallback((map: L.Map, icon: L.DivIcon, lat: number, lng: number) => {
    if (markerRef.current) markerRef.current.remove();
    const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
    marker.on("dragend", (e) => {
      const pos = (e.target as L.Marker).getLatLng();
      setPendingCoords(pos.lat, pos.lng);
    });
    markerRef.current = marker;
  }, [setPendingCoords]);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:36px;height:36px;
          background:#145C43;
          border:3px solid #0D2B21;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 4px 12px rgba(13,43,33,0.35);
        "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, markerIcon, lat, lng);
      setPendingCoords(lat, lng);
    });

    mapInstanceRef.current = { map, markerIcon };
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a location was already confirmed (e.g. user went back a step and returned),
  // re-show it on the map without requiring re-confirmation.
  useEffect(() => {
    if (!mapReady || !confirmed || !mapInstanceRef.current) return;
    const { map, markerIcon } = mapInstanceRef.current;
    map.setView([confirmed.lat, confirmed.lng], 17);
    placeMarker(map, markerIcon, confirmed.lat, confirmed.lng);
    setPending({ lat: confirmed.lat, lng: confirmed.lng });
    setResolvedAddress(confirmed.resolvedAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // Prefill the search box from the address typed earlier in the form, once,
  // so the user isn't forced to retype something they already wrote above.
  useEffect(() => {
    if (!hintAppliedRef.current && initialAddressHint && !searchText) {
      hintAppliedRef.current = true;
      setSearchText(initialAddressHint);
    }
  }, [initialAddressHint, searchText]);

  // ── Forward geocode (search box → pin) ───────────────────────────────────
  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query || !mapInstanceRef.current) return;
    setSearchError("");
    setGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const { map, markerIcon } = mapInstanceRef.current;
        map.setView([lat, lng], 17);
        placeMarker(map, markerIcon, lat, lng);
        setPendingCoords(lat, lng);
      } else {
        setSearchError("Couldn't find that address. Try a nearby landmark, or pin it manually on the map.");
      }
    } catch {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setGeocoding(false);
    }
  };

  // ── GPS ────────────────────────────────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setSearchError("");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { map, markerIcon } = mapInstanceRef.current!;
        map.setView([lat, lng], 17);
        placeMarker(map, markerIcon, lat, lng);
        setPendingCoords(lat, lng);
        setGpsLoading(false);
      },
      () => {
        setSearchError("Couldn't get your location. Check location permissions, or search/pin manually.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    if (!pending) return;
    onConfirm({ lat: pending.lat, lng: pending.lng, resolvedAddress });
  };

  const isConfirmed = !!confirmed;

  return (
    <div className="space-y-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search for your store's address"
            className="w-full h-11 pl-9 pr-3 bg-white border rounded-lg outline-none text-sm text-gray-800 placeholder-gray-400"
            style={{ borderColor: "#DCE3DC" }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchText.trim()}
          className="h-11 px-4 rounded-lg text-sm font-semibold transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: "#145C43", color: "#FFFFFF" }}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold border-2 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
        style={{ borderColor: "#145C43", color: "#145C43", backgroundColor: "#E8EFEC" }}
      >
        {gpsLoading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        )}
        {gpsLoading ? "Locating…" : "Use Current Location"}
      </button>

      {searchError && (
        <p className="text-xs flex items-start gap-1.5" style={{ color: "#BA1A1A" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {searchError}
        </p>
      )}

      {/* Map */}
      <div
        className="relative rounded-xl overflow-hidden border-2"
        style={{ borderColor: isConfirmed ? "#145C43" : pending ? "#A9CC3B" : "#DCE3DC" }}
      >
        <div ref={mapRef} style={{ height: "280px", width: "100%", zIndex: 1 }} />
      </div>

      {/* Pin / confirm panel */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{
          backgroundColor: isConfirmed ? "#E8EFEC" : pending ? "#F5F7F3" : "#F5F7F3",
          border: `1px solid ${isConfirmed ? "#145C43" : pending ? "#DCE3DC" : "#E3E7E1"}`,
        }}
      >
        {!pending && (
          <p className="text-xs text-gray-400">
            No pin yet — search above, use your current location, or click directly on the map.
          </p>
        )}

        {pending && (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isConfirmed ? "#145C43" : "#A9CC3B" }}
              />
              <p className="text-xs font-mono font-semibold" style={{ color: "#16241D" }}>
                {pending.lat}, {pending.lng}
              </p>
              {isConfirmed && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
                  style={{ backgroundColor: "#E8EFEC", color: "#145C43" }}
                >
                  ✓ Confirmed
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "#6E7C74" }}>
              {resolving ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Looking up address for this pin…
                </span>
              ) : resolvedAddress ? (
                <>Nearest match: <span className="font-medium">{resolvedAddress}</span></>
              ) : (
                "Couldn't resolve an address for this exact pin — that's fine, the coordinates will still be saved."
              )}
            </p>

            {!isConfirmed && (
              <>
                <p className="text-xs" style={{ color: "#6E7C74" }}>
                  Drag the marker to fine-tune, then confirm.
                </p>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full h-10 rounded-lg text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
                  style={{ backgroundColor: "#145C43", color: "#FFFFFF" }}
                >
                  Confirm Location
                </button>
              </>
            )}

            {isConfirmed && (
              <button
                type="button"
                onClick={() => onConfirm(null)}
                className="text-xs font-semibold underline"
                style={{ color: "#145C43" }}
              >
                Change location
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StoreRegistration() {
  const navigate = useNavigate();

  // Location — null until the user explicitly confirms a pin
  const [location, setLocation] = useState<ConfirmedLocation | null>(null);

  // File uploads
  const [tradeLicense, setTradeLicense] = useState<UploadState>({ file: null });
  const [ownerID, setOwnerID] = useState<UploadState>({ file: null });
  const [storeFront, setStoreFront] = useState<UploadState>({ file: null });

  // UI state
  const [error, setError] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const { handleFocus } = useInputFocusStyle("muted");
  const inputClass =
    "w-full h-11 px-3 bg-white border rounded-lg outline-none text-sm text-gray-800 placeholder-gray-400 transition-all";
  const inputStyle = { borderColor: "#DCE3DC" };

  const formik = useFormik({
    initialValues: {
      storeName: "",
      ownerName: "",
      address: "",
      pincode: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: storeRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");

      if (!location) {
        const locErr = "Please confirm your store location on the map";
        setError(locErr);
        showErrorToast("Location Required", { subtitle: locErr });
        setSubmitting(false);
        return;
      }

      if (!tradeLicense.file || !ownerID.file || !storeFront.file) {
        const docErr = "Trade license, owner ID, and store front photo are all required";
        setError(docErr);
        showErrorToast("Documents Required", { subtitle: docErr });
        setSubmitting(false);
        return;
      }

      try {
        const lowerEmail = values.email.trim().toLowerCase();
        const formData = new FormData();
        formData.append("storeName", values.storeName.trim());
        formData.append("ownerName", values.ownerName.trim());
        formData.append("address", values.address.trim());
        formData.append("pincode", values.pincode.trim());
        formData.append("email", lowerEmail);
        formData.append("phone", values.phone.trim());
        formData.append("password", values.password);
        formData.append("confirmPassword", values.confirmPassword);
        formData.append("lat", String(location.lat));
        formData.append("lng", String(location.lng));
        formData.append("tradeLicense", tradeLicense.file);
        formData.append("ownerId", ownerID.file);
        formData.append("storeFront", storeFront.file);

        await api.post("/auth/register/store", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtpModal(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleStoreVerified = () => {
    setShowOtpModal(false);
    showSuccessToast("Application Submitted", { subtitle: "We will review your supermarket application soon." });
    navigate("/store/pending");
  };

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ backgroundColor: "#F7F8F5" }}>
      {showOtpModal && (
        <OtpVerificationModal
          email={targetEmail}
          onClose={() => setShowOtpModal(false)}
          onVerified={handleStoreVerified}
        />
      )}

      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col justify-between w-[40%] min-h-screen px-10 py-10 relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "#0D2B21" }}
      >
        <div
          className="absolute inset-0 opacity-20 grayscale pointer-events-none"
          style={{ background: "linear-gradient(135deg,#0D2B21 0%,#0A1F17 100%)" }}
        />
        <div className="relative z-10">
          <span className="text-white font-bold text-2xl tracking-tight">QuickKart</span>
          <div className="mt-10 space-y-4">
            <h1 className="text-white text-3xl font-bold leading-tight">
              Grow your business with hyperlocal delivery.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#8FCDB0" }}>
              Your neighbourhood grocery, delivered fast. Join our network of premium local stores.
            </p>
          </div>
          <nav className="mt-10 space-y-1">
            {[
              { label: "Hyperlocal", icon: <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /> },
              {
                label: "Real-time availability",
                icon: (<><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>),
              },
              {
                label: "Fast delivery",
                icon: (
                  <>
                    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                    <rect x="9" y="11" width="14" height="10" rx="2" />
                    <circle cx="12" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                  </>
                ),
              },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex items-center gap-3 py-3 cursor-pointer group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FCDB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {icon}
                </svg>
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8FCDB0" }}>
                  {label}
                </span>
              </div>
            ))}
          </nav>
        </div>
        <div className="relative z-10 flex items-center gap-1">
          <span className="text-xs" style={{ color: "#8FCDB0" }}>© 2024 QuickKart</span>
        </div>
      </aside>

      {/* ── Right Panel ─────────────────────────────────────────────────────── */}
      <main className="flex-1 h-screen overflow-y-auto px-6 md:px-0 py-10">
        <div className="max-w-[480px] mx-auto space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs">
            <button onClick={() => navigate("/login")} className="hover:underline" style={{ color: "#145C43" }}>
              Login
            </button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <button onClick={() => navigate("/create-account")} className="hover:underline" style={{ color: "#145C43" }}>
              Create Account
            </button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="font-bold" style={{ color: "#145C43" }}>Store Registration</span>
          </nav>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-[#16241D]">Register your Store</h2>
            <p className="text-sm text-[#6E7C74] mt-1">
              Partner with us to reach thousands of customers in your locality.
            </p>
          </div>

          {/* Admin Review Notice */}
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "#F5F7F3", borderLeft: "4px solid #145C43" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#145C43" stroke="none" className="mt-0.5 flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#6E7C74" }}>
              Your store will be reviewed and approved by our admin team within 24–48 hours after submission. Ensure all documents are clear and valid.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-md px-4 py-3 bg-[#FBEAEA] border border-[#BA1A1A]/30">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-[#BA1A1A]">{error}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-8" noValidate>
            {/* ── Section 1: Store Info ─────────────────────────────────────── */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#E3E7E1" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#145C43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                  <path d="M9 9v12M15 9v12" />
                </svg>
                <h3 className="text-base font-semibold text-[#16241D]">Store Info</h3>
              </div>

              <div className="space-y-4">
                {/* Store Name */}
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">
                    Store Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l1-5h16l1 5" />
                        <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                      </svg>
                    </span>
                    <input
                      id="storeName"
                      name="storeName"
                      type="text"
                      placeholder="e.g. Green Valley Organics"
                      className={`${inputClass} pl-9 ${formik.touched.storeName && formik.errors.storeName ? "border-red-400 focus:border-red-500" : ""}`}
                      style={inputStyle}
                      value={formik.values.storeName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      onFocus={handleFocus}
                    />
                  </div>
                  {formik.touched.storeName && formik.errors.storeName && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.storeName}</p>
                  )}
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">
                    Owner Name
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    placeholder="Legal full name"
                    className={`${inputClass} ${formik.touched.ownerName && formik.errors.ownerName ? "border-red-400 focus:border-red-500" : ""}`}
                    style={inputStyle}
                    value={formik.values.ownerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  {formik.touched.ownerName && formik.errors.ownerName && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.ownerName}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    placeholder="Full street address, building number, landmark"
                    rows={3}
                    className={`w-full p-3 bg-white border rounded-lg outline-none text-sm text-gray-800 placeholder-gray-400 resize-none transition-all ${
                      formik.touched.address && formik.errors.address ? "border-red-400 focus:border-red-500" : ""
                    }`}
                    style={inputStyle}
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  {formik.touched.address && formik.errors.address && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.address}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">
                    Pincode
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      placeholder="6-digit postal code"
                      className={`${inputClass} pl-9 ${formik.touched.pincode && formik.errors.pincode ? "border-red-400 focus:border-red-500" : ""}`}
                      style={inputStyle}
                      value={formik.values.pincode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      onFocus={handleFocus}
                    />
                  </div>
                  {formik.touched.pincode && formik.errors.pincode && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.pincode}</p>
                  )}
                </div>

                {/* ── Location Step ───────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500">
                      Store Location
                    </label>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: location ? "#E8EFEC" : "rgba(186,26,26,0.08)",
                        color: location ? "#145C43" : "#BA1A1A",
                      }}
                    >
                      {location ? "✓ Confirmed" : "Required"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Search your address or use your current location, adjust the pin, then confirm.
                  </p>
                  <LocationStep
                    confirmed={location}
                    onConfirm={setLocation}
                    initialAddressHint={
                      formik.values.address.trim() && formik.values.pincode.trim()
                        ? `${formik.values.address.trim()}, ${formik.values.pincode.trim()}, India`
                        : ""
                    }
                  />
                </div>
              </div>
            </section>

            {/* ── Section 2: Credentials ───────────────────────────────────── */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#E3E7E1" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#145C43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <h3 className="text-base font-semibold text-[#16241D]">Credentials</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@store.com"
                    className={`${inputClass} ${formik.touched.email && formik.errors.email ? "border-red-400 focus:border-red-500" : ""}`}
                    style={inputStyle}
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    className={`${inputClass} ${formik.touched.phone && formik.errors.phone ? "border-red-400 focus:border-red-500" : ""}`}
                    style={inputStyle}
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password (min. 8 characters)"
                    className={`${inputClass} ${formik.touched.password && formik.errors.password ? "border-red-400 focus:border-red-500" : ""}`}
                    style={inputStyle}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  <PasswordStrengthBar password={formik.values.password} />
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    className={`${inputClass} ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-400 focus:border-red-500" : ""}`}
                    style={inputStyle}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleFocus}
                  />
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Section 3: Documents ─────────────────────────────────────── */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#E3E7E1" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#145C43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <h3 className="text-base font-semibold text-[#16241D]">Documents</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <UploadCard
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  }
                  label="Trade License"
                  sub="PDF, JPG or PNG (Max 5MB)"
                  upload={tradeLicense}
                  onUpload={(f) => setTradeLicense({ file: f })}
                />
                <UploadCard
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M7 15s0-4 5-4 5 4 5 4" />
                      <circle cx="12" cy="9" r="2" />
                    </svg>
                  }
                  label="Owner ID Proof"
                  sub="Government Issued ID"
                  upload={ownerID}
                  onUpload={(f) => setOwnerID({ file: f })}
                />
                <UploadCard
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  }
                  label="Store Front Photo"
                  sub="Clear photo of the shop entrance"
                  upload={storeFront}
                  onUpload={(f) => setStoreFront({ file: f })}
                />
              </div>
            </section>

            {/* ── Submit ───────────────────────────────────────────────────── */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full h-12 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                style={{
                  backgroundColor: "#A9CC3B",
                  color: "#16241D",
                  boxShadow: "0 8px 24px rgba(20,92,67,0.12)",
                }}
              >
                {formik.isSubmitting ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l1-5h16l1 5" />
                    <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                  </svg>
                )}
                {formik.isSubmitting ? "Submitting..." : "Submit Store Application"}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                By clicking submit, you agree to QuickKart's{" "}
                <a href="#" className="font-semibold underline" style={{ color: "#145C43" }}>
                  Merchant Terms &amp; Conditions
                </a>
                .
              </p>
              <p className="mt-4 text-sm text-center text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold underline"
                  style={{ color: "#145C43" }}
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}