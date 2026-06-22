import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ToggleLeft,
  Star,
  Wallet,
  PackageCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import Sidebar from "../components/storeSidebar";
import Topbar from "../components/storeTopbar";
import api from "../../../api/axios";

// ════════════════════════════════════════════════════════════════════════════
//  Types — mirrored from getMyStoreProfile's response shape + StoreProfile schema
// ════════════════════════════════════════════════════════════════════════════
interface DocumentStatus {
  label: string;
  key: string;
  submitted: boolean;
}

interface OperatingHour {
  day: string;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
}

interface StoreMe {
  name: string;
  phone: string;
  email: string;
  storeId: string;
  registeredOn: string;
  role: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  storeName: string;
  ownerName: string;
  address: string;
  pincode: string | null;
  storeStatus: "OPEN" | "CLOSED" | "BUSY";
  logoUrl: string | null;
  coverImageUrl: string | null;
  isManuallyClosed: boolean;
  operatingHours: OperatingHour[];
  documents: DocumentStatus[];
}

const PALETTE = {
  brown: "#C2825A",
  ink: "#2B1B0E",
  bg: "#FBF1E9",
};

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function approvalBadge(status: string) {
  if (status === "APPROVED") return { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", Icon: CheckCircle2 };
  if (status === "REJECTED") return { label: "Rejected", className: "bg-red-50 text-red-700 ring-red-600/15", Icon: XCircle };
  return { label: "Pending Review", className: "bg-amber-50 text-amber-700 ring-amber-600/15", Icon: AlertCircle };
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Section shell ───────────────────────────────────────────────────────────
function Card({ title, subtitle, icon: Icon, children, right }: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#2B1B0E]/[0.07] bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FBF1E9] text-[#C2825A]">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div>
            <h3 className="text-base font-semibold text-[#2B1B0E]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-[#2B1B0E]/55">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─── Read-only field row (no backend endpoint to edit these yet) ───────────
function LockedField({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2B1B0E]/45">
        {label}
        <Lock className="h-3 w-3 text-[#2B1B0E]/30" />
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-[#2B1B0E]/[0.08] bg-[#FBF1E9]/50 px-3.5 py-2.5 text-sm text-[#2B1B0E]/75">
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-[#2B1B0E]/35" />}
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

// ─── Toggle switch ───────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-[#C2825A]" : "bg-[#2B1B0E]/15"
      }`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

export default function StoreProfilePage() {
  const [store, setStore] = useState<StoreMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingClose, setSavingClose] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const flashSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  // ── Load profile ──
  const loadProfile = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/store/me")
      .then((res) => setStore(res.data.store))
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load your store profile."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Toggle manual close ──
  const handleToggleClose = async () => {
    if (!store) return;
    setSavingClose(true);
    setActionError(null);
    const prev = store.isManuallyClosed;
    setStore({ ...store, isManuallyClosed: !prev }); // optimistic
    try {
      const res = await api.patch("/store/toggleManualClose");
      setStore((s) => (s ? { ...s, isManuallyClosed: res.data.isManuallyClosed } : s));
      flashSuccess(res.data.message);
    } catch (err: any) {
      setStore((s) => (s ? { ...s, isManuallyClosed: prev } : s)); // revert
      setActionError(err?.response?.data?.message || "Couldn't update store status.");
    } finally {
      setSavingClose(false);
    }
  };

  // ── Branding upload (logo / coverImage) ──
  const handleBrandingUpload = async (field: "logo" | "coverImage", file: File) => {
    const setUploading = field === "logo" ? setUploadingLogo : setUploadingCover;
    setUploading(true);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append(field, file);
      const res = await api.patch("/store/branding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStore((s) =>
        s
          ? {
              ...s,
              logoUrl: res.data.logoUrl ?? s.logoUrl,
              coverImageUrl: res.data.coverImageUrl ?? s.coverImageUrl,
            }
          : s
      );
      flashSuccess(field === "logo" ? "Logo updated." : "Cover image updated.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Upload failed. Try a smaller image.");
    } finally {
      setUploading(false);
    }
  };

  const hours = (store?.operatingHours || [])
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  return (
    <div className="flex h-screen bg-[#FBF1E9]">
      <Sidebar activeKey="dashboard" storeName={store?.storeName || "QuickKart"} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Profile" />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-[#2B1B0E]/45">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading your profile…</p>
            </div>
          ) : error || !store ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
              <p className="text-sm text-[#2B1B0E]/60">{error || "Something went wrong."}</p>
              <button
                onClick={loadProfile}
                className="rounded-full border border-[#2B1B0E]/15 px-4 py-2 text-sm font-medium text-[#2B1B0E] hover:bg-white"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl space-y-6">

              {/* ── Inline notifications ── */}
              {actionError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/15">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-600/15">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {actionSuccess}
                </div>
              )}

              {/* ── Hero: cover + logo + identity ── */}
              <div className="overflow-hidden rounded-2xl border border-[#2B1B0E]/[0.07] bg-white">
                <div className="relative h-40 w-full bg-gradient-to-br from-[#E7D7C1] to-[#C2825A]/40">
                  {store.coverImageUrl && (
                    <img src={store.coverImageUrl} alt="Store cover" className="h-full w-full object-cover" />
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleBrandingUpload("coverImage", e.target.files[0])}
                  />
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70 disabled:opacity-60"
                  >
                    {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {uploadingCover ? "Uploading…" : "Change Cover"}
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-5 px-6 pb-6 pt-0">
                  <div className="relative -mt-12 flex-shrink-0">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#E7D7C1] text-2xl font-bold text-[#735a3e] shadow-sm">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                      ) : (
                        initialsFrom(store.storeName)
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleBrandingUpload("logo", e.target.files[0])}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute -right-1 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#2B1B0E] text-white shadow disabled:opacity-60"
                      title="Change logo"
                    >
                      {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 pt-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl font-bold text-[#2B1B0E]">{store.storeName}</h1>
                      {(() => {
                        const b = approvalBadge(store.approvalStatus);
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${b.className}`}>
                            <b.Icon className="h-3 w-3" /> {b.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="mt-1 text-sm text-[#2B1B0E]/60">Owner: {store.ownerName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[#2B1B0E]/55">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {store.email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {store.phone}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {store.address}</span>
                    </div>
                  </div>

                  <div className="pt-3 text-right text-xs text-[#2B1B0E]/45">
                    <span className="flex items-center justify-end gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Joined {new Date(store.registeredOn).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Main grid ── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Left / main column */}
                <div className="space-y-6 lg:col-span-2">

                  <Card
                    title="Store Details"
                    subtitle="These are set during onboarding — contact support to change legal/registration details."
                    icon={ShieldCheck}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <LockedField label="Full Name" value={store.name} />
                      <LockedField label="Store Name" value={store.storeName} />
                      <LockedField label="Email Address" value={store.email} icon={Mail} />
                      <LockedField label="Phone Number" value={store.phone} icon={Phone} />
                      <div className="sm:col-span-2">
                        <LockedField label="Store Address" value={`${store.address}${store.pincode ? `, ${store.pincode}` : ""}`} icon={MapPin} />
                      </div>
                    </div>
                  </Card>

                  <Card title="Operating Hours" subtitle="Set from onboarding. Hours editing is coming to this page soon." icon={Clock}>
                    {hours.length === 0 ? (
                      <p className="text-sm text-[#2B1B0E]/50">No hours set yet.</p>
                    ) : (
                      <div className="divide-y divide-[#2B1B0E]/[0.06]">
                        {hours.map((h) => (
                          <div key={h.day} className="flex items-center justify-between py-2.5 text-sm">
                            <span className="font-medium text-[#2B1B0E]">{h.day}</span>
                            <span className={h.isClosed ? "text-[#2B1B0E]/40" : "text-[#2B1B0E]/70"}>
                              {h.isClosed || !h.openTime || !h.closeTime ? "Closed" : `${h.openTime} – ${h.closeTime}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card title="Verification Documents" subtitle="Submitted during store onboarding." icon={FileText}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {store.documents.map((doc) => (
                        <div
                          key={doc.key}
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                            doc.submitted
                              ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                              : "border-[#2B1B0E]/10 bg-[#FBF1E9]/50 text-[#2B1B0E]/45"
                          }`}
                        >
                          {doc.submitted ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
                          <span className="font-medium">{doc.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right / sidebar column */}
                <div className="space-y-6">
                  <Card title="Store Availability" icon={ToggleLeft}>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FBF1E9]/60 px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-[#2B1B0E]">Manually closed</p>
                        <p className="text-xs text-[#2B1B0E]/50">Overrides your operating hours when on.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {savingClose && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2B1B0E]/40" />}
                        <ToggleSwitch checked={store.isManuallyClosed} onChange={handleToggleClose} disabled={savingClose} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#2B1B0E]/50">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          store.isManuallyClosed ? "bg-[#2B1B0E]/30" : store.storeStatus === "BUSY" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      Currently shown to customers as{" "}
                      <strong className="text-[#2B1B0E]">
                        {store.isManuallyClosed ? "CLOSED" : store.storeStatus === "BUSY" ? "BUSY" : "OPEN (per hours)"}
                      </strong>
                    </div>
                  </Card>

                  <Card title="Store Stats" icon={Star}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#FBF1E9]/60 px-3.5 py-3">
                        <p className="flex items-center gap-1 text-[11px] font-medium text-[#2B1B0E]/50">
                          <Star className="h-3 w-3" /> Rating
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#2B1B0E]">—</p>
                      </div>
                      <div className="rounded-xl bg-[#FBF1E9]/60 px-3.5 py-3">
                        <p className="flex items-center gap-1 text-[11px] font-medium text-[#2B1B0E]/50">
                          <PackageCheck className="h-3 w-3" /> Orders
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#2B1B0E]">—</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[#2B1B0E]/40">
                      Rating and order totals aren't returned by <code>/store/me</code> yet — add{" "}
                      <code>averageRating</code> and <code>totalOrders</code> to that controller's response to light these up.
                    </p>
                  </Card>

                  <Card title="Earnings" icon={Wallet}>
                    <p className="text-xs text-[#2B1B0E]/40">
                      <code>availableBalance</code> / <code>pendingBalance</code> exist on the schema but aren't
                      returned by <code>getMyStoreProfile</code> yet — add them there to show real numbers here.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}