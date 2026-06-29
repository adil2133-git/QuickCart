import { useEffect } from "react";
import {
  Store,
  Clock,
  MapPin,
  FileText,
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pencil,
} from "lucide-react";
import { useStoreSettingsStore, type NotificationPrefs } from "../state/storeSettingsState";

// ─── Section shell — same as Profile's Card ────────────────────────────────
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

function TextField({ label, value, onChange, icon: Icon, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#2B1B0E]/45">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-[#2B1B0E]/10 bg-white px-3.5 py-2.5 focus-within:border-[#C2825A]/60">
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-[#2B1B0E]/35" />}
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-[#2B1B0E] outline-none placeholder:text-[#2B1B0E]/30"
        />
      </div>
    </div>
  );
}

// ─── Read-only display field — mirrors TextField's layout for view mode ───
function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2B1B0E]/45">{label}</p>
      <p className="mt-1.5 text-sm text-[#2B1B0E]">{value || "—"}</p>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#2B1B0E]/15 px-4 py-2 text-xs font-semibold text-[#2B1B0E] transition-colors hover:bg-[#FBF1E9]"
    >
      <Pencil className="h-3.5 w-3.5" /> Edit
    </button>
  );
}

function SaveCancelButtons({ onCancel, onSave, saving, savingLabel = "Saving…", label = "Save" }: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  savingLabel?: string;
  label?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="rounded-full border border-[#2B1B0E]/15 px-4 py-2 text-xs font-semibold text-[#2B1B0E] transition-colors hover:bg-[#FBF1E9]"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#2B1B0E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3a2614] disabled:opacity-50"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saving ? savingLabel : label}
      </button>
    </div>
  );
}

const NOTIFICATION_ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "orderAlerts", label: "Order Alerts", description: "Real-time push notifications for new and canceled orders." },
  { key: "inventoryAlerts", label: "Inventory Alerts", description: "Weekly summaries of low-stock and expiring items." },
  { key: "emailSummaries", label: "Email Summaries", description: "Monthly revenue performance and payout reports." },
];

export default function StoreSettingsPage() {
  const {
    settings,
    loading,
    error,
    savingInfo,
    savingHours,
    actionError,
    actionSuccess,
    infoDraft,
    hoursDraft,
    editingInfo,
    editingHours,
    notificationPrefs,
    fetchSettings,
    setInfoDraft,
    setHoursDraft,
    saveStoreInfo,
    saveOperatingHours,
    toggleNotificationPref,
    setEditingInfo,
    setEditingHours,
    initializeHours,
    cancelEditInfo,
    cancelEditHours,
    setActionError,
  } = useStoreSettingsStore();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-[#FBF1E9]">

      <div className="flex flex-1 flex-col overflow-hidden">

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-[#2B1B0E]/45">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading settings…</p>
            </div>
          ) : error || !settings ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
              <p className="text-sm text-[#2B1B0E]/60">{error || "Something went wrong."}</p>
              <button
                onClick={fetchSettings}
                className="rounded-full border border-[#2B1B0E]/15 px-4 py-2 text-sm font-medium text-[#2B1B0E] hover:bg-white"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl space-y-6">

              <div>
                <h1 className="text-2xl font-bold text-[#2B1B0E]">Settings</h1>
                <p className="mt-1 text-sm text-[#2B1B0E]/55">
                  Manage your store details, operating hours, and documentation.
                </p>
              </div>

              {actionError && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/15">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" /> {actionError}
                  </span>
                  <button onClick={() => setActionError(null)} className="text-red-700/60 hover:text-red-700">
                    ×
                  </button>
                </div>
              )}
              {actionSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-600/15">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {actionSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left / main column */}
                <div className="space-y-6 lg:col-span-2">

                  {/* ── Store Information ── */}
                  <Card
                    title="Store Information"
                    subtitle="Editable business details shown to customers."
                    icon={Store}
                    right={
                      editingInfo ? (
                        <SaveCancelButtons
                          onCancel={cancelEditInfo}
                          onSave={saveStoreInfo}
                          saving={savingInfo}
                          savingLabel="Saving…"
                          label="Save Info"
                        />
                      ) : (
                        <EditButton onClick={() => setEditingInfo(true)} />
                      )
                    }
                  >
                    {editingInfo ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                          label="Store Name"
                          value={infoDraft.storeName}
                          onChange={(v) => setInfoDraft("storeName", v)}
                          icon={Store}
                        />
                        <TextField
                          label="Pincode"
                          value={infoDraft.pincode}
                          onChange={(v) => setInfoDraft("pincode", v)}
                          placeholder="Optional"
                        />
                        <div className="sm:col-span-2">
                          <TextField
                            label="Store Address"
                            value={infoDraft.address}
                            onChange={(v) => setInfoDraft("address", v)}
                            icon={MapPin}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DisplayField label="Store Name" value={settings.storeName} />
                        <DisplayField label="Pincode" value={settings.pincode || ""} />
                        <div className="sm:col-span-2">
                          <DisplayField label="Store Address" value={settings.address} />
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-[#2B1B0E]/40">
                      Note: there's no <code>email</code> field on <code>StoreProfile</code> —
                      that lives on the linked <code>User</code> document, so it isn't editable here.
                    </p>
                  </Card>

                  {/* ── Operating Hours ── */}
                  <Card
                    title="Operating Hours"
                    subtitle="Set when your store is open for orders."
                    icon={Clock}
                    right={
                      hoursDraft.length === 0 ? null : editingHours ? (
                        <SaveCancelButtons
                          onCancel={cancelEditHours}
                          onSave={saveOperatingHours}
                          saving={savingHours}
                          savingLabel="Saving…"
                          label="Save Hours"
                        />
                      ) : (
                        <EditButton onClick={() => setEditingHours(true)} />
                      )
                    }
                  >
                    {hoursDraft.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <p className="text-sm text-[#2B1B0E]/50">You haven't set any operating hours yet.</p>
                        <button
                          onClick={initializeHours}
                          className="rounded-full bg-[#2B1B0E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a2614]"
                        >
                          Add Operating Hours
                        </button>
                      </div>
                    ) : editingHours ? (
                      <div className="divide-y divide-[#2B1B0E]/[0.06]">
                        {hoursDraft.map((h) => (
                          <div key={h.day} className="flex flex-wrap items-center gap-3 py-3">
                            <span className="w-28 flex-shrink-0 text-sm font-medium text-[#2B1B0E]">{h.day}</span>

                            <input
                              type="time"
                              value={h.openTime || ""}
                              disabled={h.isClosed}
                              onChange={(e) => setHoursDraft(h.day, "openTime", e.target.value)}
                              className="rounded-lg border border-[#2B1B0E]/10 bg-[#FBF1E9]/40 px-2.5 py-1.5 text-sm text-[#2B1B0E] outline-none disabled:opacity-40"
                            />
                            <span className="text-xs text-[#2B1B0E]/40">to</span>
                            <input
                              type="time"
                              value={h.closeTime || ""}
                              disabled={h.isClosed}
                              onChange={(e) => setHoursDraft(h.day, "closeTime", e.target.value)}
                              className="rounded-lg border border-[#2B1B0E]/10 bg-[#FBF1E9]/40 px-2.5 py-1.5 text-sm text-[#2B1B0E] outline-none disabled:opacity-40"
                            />

                            <div className="ml-auto flex items-center gap-2">
                              <ToggleSwitch
                                checked={!h.isClosed}
                                onChange={() => setHoursDraft(h.day, "isClosed", !h.isClosed)}
                              />
                              <span className={`text-xs font-medium ${h.isClosed ? "text-[#2B1B0E]/40" : "text-emerald-700"}`}>
                                {h.isClosed ? "Closed" : "Open"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2B1B0E]/[0.06]">
                        {hoursDraft.map((h) => (
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

                  {/* ── Documents ── */}
                  <Card title="Verification Documents" subtitle="Submitted during onboarding. Re-upload isn't supported on this page yet." icon={FileText}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {settings.documents.map((doc) => (
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
                  <Card title="Store Location" icon={MapPin}>
                    <div className="rounded-xl bg-[#FBF1E9]/60 px-4 py-3.5 text-sm text-[#2B1B0E]/70">
                      <p>Lat: {settings.coordinates.lat.toFixed(5)}</p>
                      <p>Lng: {settings.coordinates.lng.toFixed(5)}</p>
                    </div>
                    <p className="mt-3 text-xs text-[#2B1B0E]/40">
                      There's no geocoding/pin-refine endpoint yet, so this just displays the stored{" "}
                      <code>coordinates</code> field. Add a map picker + <code>PATCH /store/coordinates</code>{" "}
                      to make this interactive.
                    </p>
                  </Card>

                  <Card title="Notification Preferences" subtitle="Stored locally — not yet persisted." icon={Bell}>
                    <div className="space-y-4">
                      {NOTIFICATION_ITEMS.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-[#FBF1E9]/60 px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#2B1B0E]">{item.label}</p>
                            <p className="mt-0.5 text-xs text-[#2B1B0E]/50">{item.description}</p>
                          </div>
                          <ToggleSwitch
                            checked={notificationPrefs[item.key]}
                            onChange={() => toggleNotificationPref(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[#2B1B0E]/40">
                      <code>StoreProfile</code> has no <code>notificationPreferences</code> field — add one
                      (or a separate collection if push tokens are needed later) plus a{" "}
                      <code>PATCH /store/notifications</code> endpoint to persist these toggles for real.
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