// src/features/auth/components/PendingApproval.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Zap,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Hash,
  Calendar,
  AtSign,
  ChevronRight,
  ShoppingBag,
  Loader2,
  Store as StoreIcon,
  MapPinned,
} from "lucide-react";
import api from "../../../api/axios";
import LocationPreviewMap from "../../admin/components/locationPreview";
import { useLogout } from "../hooks/useLogout";

type Role = "driver" | "store";

interface DocumentItem {
  label: string;
  key: string;
  submitted: boolean;
}

interface BaseProfile {
  name: string;
  phone: string;
  email: string;
  registeredOn: string;
  role: string;
  approvalStatus: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";
  documents: DocumentItem[];
}

interface DriverProfile extends BaseProfile {
  driverId: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
}

interface StoreProfileInfo extends BaseProfile {
  storeId: string;
  storeName: string;
  ownerName: string;
  address: string;
  pincode: string | null;
  storeStatus: "OPEN" | "CLOSED" | "BUSY";
  coordinates: { lat: number; lng: number } | null;
}

type ProfileInfo = DriverProfile | StoreProfileInfo;

interface PendingApprovalProps {
  role: Role;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function statusLabel(status: ProfileInfo["approvalStatus"]) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "ACTIVE":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status;
  }
}

const roleConfig = {
  driver: {
    endpoint: "driver",
    heroIcon: <Clock size={28} style={{ color: "#c9a96e" }} />,
    sidebarTagline: "Your neighbourhood grocery, delivered fast.",
    sidebarBody:
      "Join our network of elite delivery partners and local stores to bring quality goods to your community.",
    cardLabel: "Applicant Name",
    idLabel: "Driver ID",
    nextStepsDescription:
      "Our team verifies your background check and vehicle documents.",
    getIdentity: (p: ProfileInfo) => (p as DriverProfile).driverId,
    extraFields: (p: ProfileInfo) => {
      const d = p as DriverProfile;
      return [
        { icon: <Hash size={14} />, label: "Vehicle Type", value: d.vehicleType },
        { icon: <Hash size={14} />, label: "Vehicle Number", value: d.vehicleNumber },
        { icon: <Hash size={14} />, label: "License Number", value: d.licenseNumber },
      ];
    },
  },
  store: {
    endpoint: "store",
    heroIcon: <StoreIcon size={28} style={{ color: "#c9a96e" }} />,
    sidebarTagline: "Bring your store online, the easy way.",
    sidebarBody:
      "Join our network of local stores and delivery partners to bring quality goods to your community.",
    cardLabel: "Account Holder",
    idLabel: "Store ID",
    nextStepsDescription:
      "Our team verifies your trade license, owner ID, and store details.",
    getIdentity: (p: ProfileInfo) => (p as StoreProfileInfo).storeId,
    extraFields: (p: ProfileInfo) => {
      const s = p as StoreProfileInfo;
      return [
        { icon: <StoreIcon size={14} />, label: "Store Name", value: s.storeName },
        { icon: <Hash size={14} />, label: "Owner Name", value: s.ownerName },
        { icon: <MapPinned size={14} />, label: "Address", value: s.address },
        { icon: <MapPin size={14} />, label: "Pincode", value: s.pincode || "—" },
      ];
    },
  },
} as const;

function buildSteps(description: string) {
  return [
    { number: 1, title: "Admin Review", description, done: true },
    {
      number: 2,
      title: "Notification",
      description: "Receive an email and SMS once your profile is activated.",
      done: false,
    },
    {
      number: 3,
      title: "Login & Start",
      description: "Access your dashboard and start accepting local orders.",
      done: false,
    },
  ];
}

export default function PendingApproval({ role }: PendingApprovalProps) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const navigate = useNavigate();
  const config = roleConfig[role];

  // ── Route protection ────────────────────────────────────────────────────────
  // Drivers and stores arrive here right after OTP verification. At that point
  // the auth store has NOT been populated (they are pending, not logged in).
  // So we only redirect to /login if there is genuinely no auth cookie — which
  // the API call below will tell us via a 401 handled by the axios interceptor.
  //
  // We do NOT block rendering based on the store alone, because the store is
  // intentionally empty for pending users.

  const fetchProfile = async () => {
    try {
      setError(null);
      // Uses the HttpOnly cookie automatically (withCredentials: true in axios)
      const { data } = await api.get<{
        success: boolean;
        message?: string;
        driver?: ProfileInfo;
        store?: ProfileInfo;
      }>(`/${config.endpoint}/me`);

      if (!data.success) {
        throw new Error(data.message || "Failed to load your application status.");
      }

      const fetched = data[config.endpoint as "driver" | "store"];
      if (!fetched) {
        throw new Error("Profile data not found in response.");
      }

      setProfile(fetched);

      // If the admin has approved them since the last check, redirect to login
      // so they can start a proper session.
      if (fetched.approvalStatus === "ACTIVE") {
        navigate("/login", {
          state: {
            message: "Your account has been approved! Please log in to continue.",
          },
        });
      }
    } catch (err) {
      // 401 errors are handled globally by the axios interceptor —
      // they clear the store and redirect to /login automatically.
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    })();

    // Silent background poll every 60 seconds — if approved, fetchProfile
    // redirects to /login automatically so the user never has to check manually
    const interval = setInterval(() => {
      fetchProfile();
    }, 60_000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await fetchProfile();
    setChecking(false);
    setLastChecked(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const { logout: handleLogout, isLoggingOut } = useLogout();

  // ── Loading ──
  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f5ede4" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: "#c9a96e" }} />
          <p className="text-sm" style={{ color: "#7a6550" }}>
            Loading your application...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f5ede4" }}
      >
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <AlertCircle size={32} style={{ color: "#b03a2e" }} />
          <p className="text-sm" style={{ color: "#1a1108" }}>
            {error || "We couldn't load your application status."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              fetchProfile().finally(() => setLoading(false));
            }}
            className="text-sm font-semibold uppercase tracking-widest px-6 py-2.5 rounded-xl"
            style={{ border: "1px solid #2a1a0e", color: "#2a1a0e" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Rejected state ──
  if (profile?.approvalStatus === "REJECTED") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#f5ede4" }}>
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <AlertCircle size={40} style={{ color: "#b03a2e" }} />
          <h2 className="text-2xl font-bold" style={{ color: "#1a1108" }}>Application Rejected</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#7a6550" }}>
            Unfortunately your application was not approved at this time.
            Please contact support for more information.
          </p>
          <a
            href="mailto:support@quickkart.com"
            className="text-sm font-semibold underline"
            style={{ color: "#7a5c34" }}
          >
            support@quickkart.com
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl"
            style={{ backgroundColor: "#2a1a0e", color: "#ffffff" }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    );
  }

  const steps = buildSteps(config.nextStepsDescription);
  const identity = config.getIdentity(profile);
  const extraFields = config.extraFields(profile);
  const storeCoordinates =
    role === "store" ? (profile as StoreProfileInfo).coordinates : null;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="w-[420px] h-full flex flex-col justify-between px-10 py-10 flex-shrink-0"
        style={{ backgroundColor: "#2a1a0e" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-16">
            <ShoppingBag size={22} style={{ color: "#c9a96e" }} />
            <span className="text-white text-xl font-bold tracking-tight">
              QuickKart
            </span>
          </div>
          <ul className="space-y-7">
            {[
              { icon: <MapPin size={16} />, label: "Hyperlocal" },
              { icon: <Clock size={16} />, label: "Real-time product availability" },
              { icon: <Zap size={16} />, label: "Fast delivery" },
            ].map(({ icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm tracking-widest uppercase"
                style={{ color: "#9e8872" }}
              >
                <span style={{ color: "#9e8872" }}>{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            {config.sidebarTagline}
          </h2>
          <p
            className="text-sm leading-relaxed mb-10"
            style={{ color: "#9e8872" }}
          >
            {config.sidebarBody}
          </p>
          <p className="text-xs" style={{ color: "#5a4535" }}>
            © 2024 QuickKart
          </p>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 h-full overflow-y-auto px-16 py-14"
        style={{ backgroundColor: "#f5ede4" }}
      >
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-6"
            style={{ borderColor: "#c9a96e" }}
          >
            {config.heroIcon}
          </div>
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: "#1a1108" }}
          >
            Application Under Review
          </h2>
          <p
            className="text-sm max-w-lg leading-relaxed"
            style={{ color: "#7a6550" }}
          >
            We've received your application! Our team is reviewing your
            documents and will notify you within 24–48 hours.
          </p>

          {/* Show name from store if available, as a warm greeting */}
          {profile?.name && (
            <p
              className="mt-2 text-sm font-medium"
              style={{ color: "#c9a96e" }}
            >
              Hi, {profile.name} 👋
            </p>
          )}
        </div>

        {/* Applicant Card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd1" }}
        >
          <div className="flex items-start justify-between mb-1">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "#a89070" }}
            >
              {config.cardLabel}
            </p>
            <span
              className="text-xs px-4 py-1 rounded-full font-medium"
              style={{ backgroundColor: "#ede0ce", color: "#7a5c34" }}
            >
              {profile.role}
            </span>
          </div>
          <p
            className="text-xl font-bold mb-5"
            style={{ color: "#1a1108" }}
          >
            {profile.name}
          </p>

          <hr style={{ borderColor: "#ede0ce", marginBottom: "20px" }} />

          <div className="grid grid-cols-2 gap-5 mb-5">
            {[
              { icon: <Phone size={14} />, label: "Phone", value: profile.phone },
              { icon: <AtSign size={14} />, label: "Email", value: profile.email },
              { icon: <Hash size={14} />, label: config.idLabel, value: identity },
              {
                icon: <Calendar size={14} />,
                label: "Registered On",
                value: formatDate(profile.registeredOn),
              },
              ...extraFields,
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: "#a89070" }}>
                  {icon}
                </span>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#a89070" }}>
                    {label}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#1a1108" }}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "#ede0ce", marginBottom: "16px" }} />

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#7a6550" }}>
              Application Status
            </span>
            <span
              className="flex items-center gap-2 text-xs px-4 py-1.5 rounded-full font-semibold tracking-widest uppercase"
              style={{ border: "1px solid #c9a96e", color: "#7a5c34" }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: "#c9a96e" }}
              />
              {statusLabel(profile.approvalStatus)}
            </span>
          </div>
        </div>

        {/* Document Status */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd1" }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: "#a89070" }}
          >
            Submitted Documents
          </p>
          <ul className="space-y-3">
            {profile.documents.map((doc) => (
              <li
                key={doc.key}
                className="flex items-center justify-between"
              >
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#1a1108" }}
                >
                  {doc.submitted ? (
                    <CheckCircle2 size={16} style={{ color: "#6a8f5c" }} />
                  ) : (
                    <AlertCircle size={16} style={{ color: "#c9a96e" }} />
                  )}
                  {doc.label}
                </div>
                <span
                  className="text-xs px-3 py-0.5 rounded-full font-medium"
                  style={
                    doc.submitted
                      ? { backgroundColor: "#e6f0e0", color: "#3d6b30" }
                      : { backgroundColor: "#fdf0dc", color: "#9a6f2a" }
                  }
                >
                  {doc.submitted ? "Submitted" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Store Location — store applicants only */}
        {role === "store" && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd1" }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "#a89070" }}
            >
              Store Location
            </p>
            {storeCoordinates ? (
              <>
                <LocationPreviewMap
                  lat={storeCoordinates.lat}
                  lng={storeCoordinates.lng}
                  height={220}
                />
                <div className="flex items-center justify-between mt-3">
                  <p
                    className="text-xs font-mono"
                    style={{ color: "#a89070" }}
                  >
                    {storeCoordinates.lat.toFixed(6)}, {storeCoordinates.lng.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${storeCoordinates.lat},${storeCoordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold underline"
                    style={{ color: "#7a5c34" }}
                  >
                    Open in Google Maps
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "#7a6550" }}>
                No location was pinned during registration. Our team will
                confirm your address using the details you provided.
              </p>
            )}
          </div>
        )}

        {/* What Happens Next */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd1" }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-6"
            style={{ color: "#a89070" }}
          >
            What Happens Next?
          </p>
          <ol>
            {steps.map((step, i) => (
              <li key={step.number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={
                      step.done
                        ? { backgroundColor: "#2a1a0e", color: "#ffffff" }
                        : { backgroundColor: "#ede0ce", color: "#a89070" }
                    }
                  >
                    {step.done ? <CheckCircle2 size={15} /> : step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px flex-1 my-1"
                      style={{ backgroundColor: "#e8ddd1" }}
                    />
                  )}
                </div>
                <div className="pb-5">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: step.done ? "#1a1108" : "#a89070" }}
                  >
                    {step.title}
                  </p>
                  <p
                    className="text-xs leading-relaxed mt-0.5"
                    style={{ color: "#7a6550" }}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs mt-1" style={{ color: "#a89070" }}>
            You will receive an email and SMS notification once your account is
            approved.
          </p>
        </div>

        {/* Contact Support */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd1" }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: "#a89070" }}
          >
            Need Help?
          </p>
          <div className="space-y-3">
            <a
              href="mailto:support@quickkart.com"
              className="flex items-center gap-3 text-sm transition-colors group"
              style={{ color: "#1a1108" }}
            >
              <Mail size={16} style={{ color: "#a89070" }} />
              support@quickkart.com
              <ChevronRight
                size={14}
                className="ml-auto"
                style={{ color: "#c9b89a" }}
              />
            </a>
            <hr style={{ borderColor: "#ede0ce" }} />
            <a
              href="tel:+919876500000"
              className="flex items-center gap-3 text-sm transition-colors group"
              style={{ color: "#1a1108" }}
            >
              <Phone size={16} style={{ color: "#a89070" }} />
              +91 98765 00000
              <ChevronRight
                size={14}
                className="ml-auto"
                style={{ color: "#c9b89a" }}
              />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60"
            style={{
              border: "1px solid #2a1a0e",
              color: "#2a1a0e",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#2a1a0e";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#2a1a0e";
            }}
          >
            <RefreshCw size={15} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Check Application Status"}
          </button>

          {lastChecked && (
            <p
              className="text-center text-xs"
              style={{ color: "#a89070" }}
            >
              Last checked at {lastChecked}
            </p>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50"
            style={{ color: "#b03a2e" }}
          >
            <LogOut size={15} />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <p
          className="text-center text-xs mt-8 mb-4"
          style={{ color: "#a89070" }}
        >
          Need help?{" "}
          <a
            href="mailto:support@quickkart.com"
            className="underline"
            style={{ color: "#7a5c34" }}
          >
            Contact Support
          </a>
        </p>
      </main>
    </div>
  );
}