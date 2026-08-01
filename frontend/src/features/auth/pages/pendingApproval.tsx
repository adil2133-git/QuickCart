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
    heroIcon: <Clock size={28} className="text-[#1F4D3D]" />,
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
    heroIcon: <StoreIcon size={28} className="text-[#1F4D3D]" />,
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

  const fetchProfile = async () => {
    try {
      setError(null);
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

      if (fetched.approvalStatus === "ACTIVE") {
        navigate("/login", {
          state: {
            message: "Your account has been approved! Please log in to continue.",
          },
        });
      }
    } catch (err) {
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
      <div className="h-screen flex items-center justify-center bg-[#F7F8F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#1F4D3D]" />
          <p className="text-sm text-[#6E7C74]">
            Loading your application...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8F5]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <AlertCircle size={32} className="text-rose-600" />
          <p className="text-sm text-[#16241D]">
            {error || "We couldn't load your application status."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              fetchProfile().finally(() => setLoading(false));
            }}
            className="text-sm font-semibold uppercase tracking-widest px-6 py-2.5 rounded-xl border border-[#1F4D3D] text-[#1F4D3D] hover:bg-[#E7EFEA] transition-colors cursor-pointer"
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
      <div className="h-screen flex items-center justify-center bg-[#F7F8F5]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
          <AlertCircle size={40} className="text-rose-600" />
          <h2 className="text-2xl font-bold text-[#16241D]">Application Rejected</h2>
          <p className="text-sm leading-relaxed text-[#6E7C74]">
            Unfortunately your application was not approved at this time.
            Please contact support for more information.
          </p>
          <a
            href="mailto:support@quickkart.com"
            className="text-sm font-semibold underline text-[#1F4D3D]"
          >
            support@quickkart.com
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl bg-[#1F4D3D] text-white hover:bg-[#163D30] transition-colors cursor-pointer"
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
    <div className="h-screen flex overflow-hidden font-['Inter',sans-serif]">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-[420px] h-full flex flex-col justify-between px-10 py-10 flex-shrink-0 bg-[#1F4D3D]">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <ShoppingBag size={22} className="text-[#A9CC3B]" />
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
                className="flex items-center gap-3 text-sm tracking-widest uppercase text-emerald-100/70"
              >
                <span>{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            {config.sidebarTagline}
          </h2>
          <p className="text-sm leading-relaxed mb-10 text-emerald-100/80">
            {config.sidebarBody}
          </p>
          <p className="text-xs text-emerald-200/50">
            © 2024 QuickKart
          </p>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto px-16 py-14 bg-[#F7F8F5]">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full border-2 border-[#1F4D3D] flex items-center justify-center mb-6 bg-[#E7EFEA]">
            {config.heroIcon}
          </div>
          <h2 className="text-4xl font-bold mb-3 text-[#16241D]">
            Application Under Review
          </h2>
          <p className="text-sm max-w-lg leading-relaxed text-[#6E7C74]">
            We've received your application! Our team is reviewing your
            documents and will notify you within 24–48 hours.
          </p>

          {profile?.name && (
            <p className="mt-2 text-sm font-semibold text-[#1F4D3D]">
              Hi, {profile.name} 👋
            </p>
          )}
        </div>

        {/* Applicant Card */}
        <div className="rounded-2xl p-6 mb-4 bg-white border border-[#E3E7E1] shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs uppercase tracking-widest text-[#6E7C74]">
              {config.cardLabel}
            </p>
            <span className="text-xs px-4 py-1 rounded-full font-semibold bg-[#E7EFEA] text-[#1F4D3D]">
              {profile.role}
            </span>
          </div>
          <p className="text-xl font-bold mb-5 text-[#16241D]">
            {profile.name}
          </p>

          <hr className="border-[#E3E7E1] mb-5" />

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
                <span className="mt-0.5 text-[#1F4D3D]">
                  {icon}
                </span>
                <div>
                  <p className="text-xs mb-0.5 text-[#6E7C74]">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-[#16241D]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-[#E3E7E1] mb-4" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6E7C74]">
              Application Status
            </span>
            <span className="flex items-center gap-2 text-xs px-4 py-1.5 rounded-full font-semibold tracking-widest uppercase border border-[#1F4D3D] text-[#1F4D3D] bg-[#E7EFEA]">
              <span className="w-2 h-2 rounded-full inline-block bg-[#1F4D3D]" />
              {statusLabel(profile.approvalStatus)}
            </span>
          </div>
        </div>

        {/* Document Status */}
        <div className="rounded-2xl p-6 mb-4 bg-white border border-[#E3E7E1] shadow-sm">
          <p className="text-xs uppercase tracking-widest mb-4 text-[#6E7C74]">
            Submitted Documents
          </p>
          <ul className="space-y-3">
            {profile.documents.map((doc) => (
              <li
                key={doc.key}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-[#16241D]">
                  {doc.submitted ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500" />
                  )}
                  {doc.label}
                </div>
                <span
                  className={`text-xs px-3 py-0.5 rounded-full font-semibold ${
                    doc.submitted
                      ? "bg-[#E7EFEA] text-[#1F4D3D]"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {doc.submitted ? "Submitted" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Store Location — store applicants only */}
        {role === "store" && (
          <div className="rounded-2xl p-6 mb-4 bg-white border border-[#E3E7E1] shadow-sm">
            <p className="text-xs uppercase tracking-widest mb-4 text-[#6E7C74]">
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
                  <p className="text-xs font-mono text-[#6E7C74]">
                    {storeCoordinates.lat.toFixed(6)}, {storeCoordinates.lng.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${storeCoordinates.lat},${storeCoordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold underline text-[#1F4D3D]"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#6E7C74]">
                No location was pinned during registration. Our team will
                confirm your address using the details you provided.
              </p>
            )}
          </div>
        )}

        {/* What Happens Next */}
        <div className="rounded-2xl p-6 mb-4 bg-white border border-[#E3E7E1] shadow-sm">
          <p className="text-xs uppercase tracking-widest mb-6 text-[#6E7C74]">
            What Happens Next?
          </p>
          <ol>
            {steps.map((step, i) => (
              <li key={step.number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      step.done
                        ? "bg-[#1F4D3D] text-white"
                        : "bg-[#F5F7F3] text-[#6E7C74] border border-[#E3E7E1]"
                    }`}
                  >
                    {step.done ? <CheckCircle2 size={15} /> : step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 my-1 bg-[#E3E7E1]" />
                  )}
                </div>
                <div className="pb-5">
                  <p className={`text-sm font-semibold ${step.done ? "text-[#16241D]" : "text-[#6E7C74]"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5 text-[#6E7C74]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs mt-1 text-[#6E7C74]">
            You will receive an email and SMS notification once your account is
            approved.
          </p>
        </div>

        {/* Contact Support */}
        <div className="rounded-2xl p-6 mb-6 bg-white border border-[#E3E7E1] shadow-sm">
          <p className="text-xs uppercase tracking-widest mb-4 text-[#6E7C74]">
            Need Help?
          </p>
          <div className="space-y-3">
            <a
              href="mailto:support@quickkart.com"
              className="flex items-center gap-3 text-sm text-[#16241D] hover:text-[#1F4D3D] transition-colors group"
            >
              <Mail size={16} className="text-[#1F4D3D]" />
              support@quickkart.com
              <ChevronRight
                size={14}
                className="ml-auto text-[#6E7C74]"
              />
            </a>
            <hr className="border-[#E3E7E1]" />
            <a
              href="tel:+919876500000"
              className="flex items-center gap-3 text-sm text-[#16241D] hover:text-[#1F4D3D] transition-colors group"
            >
              <Phone size={16} className="text-[#1F4D3D]" />
              +91 98765 00000
              <ChevronRight
                size={14}
                className="ml-auto text-[#6E7C74]"
              />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest py-3.5 rounded-xl border border-[#1F4D3D] text-[#1F4D3D] hover:bg-[#1F4D3D] hover:text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={15} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Check Application Status"}
          </button>

          {lastChecked && (
            <p className="text-center text-xs text-[#6E7C74]">
              Last checked at {lastChecked}
            </p>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut size={15} />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <p className="text-center text-xs mt-8 mb-4 text-[#6E7C74]">
          Need help?{" "}
          <a
            href="mailto:support@quickkart.com"
            className="underline text-[#1F4D3D]"
          >
            Contact Support
          </a>
        </p>
      </main>
    </div>
  );
}