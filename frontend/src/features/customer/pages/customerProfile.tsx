// pages/CustomerProfilePage.tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  User as UserIcon,
  ClipboardList,
  MapPin,
  Bell,
  Wallet as WalletIcon,
  LogOut,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useCustomerProfile } from "../hooks/useCustomerProfile";
import type { AddAddressPayload } from "../types/customerProfile";
import { useLogout } from "../../auth/hooks/useLogout";
import { OrdersContent } from "./myOrdersPage";
import { OrderTrackingContent } from "./orderTrackingPage";
import { WalletContent } from "./walletPage";

type SidebarTab = "profile" | "orders" | "wallet" | "addresses" | "notifications";

const VALID_TABS: SidebarTab[] = ["profile", "orders", "wallet", "addresses", "notifications"];

const CustomerProfilePage = () => {
  const { profile, user, isLoading, error, addNewAddress, setDefault, deleteAddress } =
    useCustomerProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as SidebarTab | null;

  // The active tab is derived straight from the URL on every render — no
  // separate state to keep in sync, so a click anywhere (sidebar, navbar
  // Wallet button, a notification link) is reflected immediately on the
  // very first render, not after a follow-up effect fires.
  const activeTab: SidebarTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "profile";

  // Order being tracked inline, within the "My Orders" tab — set when a
  // "Track Order" / "Call Rider" button is tapped. Swaps the tracking view
  // in over the orders list without changing route.
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  // Clear any in-progress order tracking whenever the tab itself changes
  // (e.g. navigating to Wallet mid-tracking via the navbar). Adjusted
  // during render — React's recommended pattern for resetting state when
  // a derived value changes — instead of via an effect, so it applies on
  // the same render rather than a follow-up one.
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    setTrackingOrderId(null);
  }

  const setActiveTab = (tab: SidebarTab) => {
    setSearchParams(tab === "profile" ? {} : { tab }, { replace: true });
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { logout, isLoggingOut } = useLogout();

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "—";

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !lat || !lng) return;

    const payload: AddAddressPayload = {
      label,
      address,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    };

    setSubmitting(true);
    try {
      await addNewAddress(payload);
      setAddress("");
      setLat("");
      setLng("");
      setLabel("Home");
      setShowAddForm(false);
      toast.success("Address saved");
    } catch {
      toast.error("Failed to save address. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] font-sans">

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-3 h-fit">
          <nav className="space-y-1">
            <SidebarItem
              icon={<UserIcon size={18} />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
            <SidebarItem
              icon={<ClipboardList size={18} />}
              label="My Orders"
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <SidebarItem
              icon={<WalletIcon size={18} />}
              label="Wallet"
              active={activeTab === "wallet"}
              onClick={() => setActiveTab("wallet")}
            />
            <SidebarItem
              icon={<MapPin size={18} />}
              label="Saved Addresses"
              active={activeTab === "addresses"}
              onClick={() => setActiveTab("addresses")}
            />
            <SidebarItem
              icon={<Bell size={18} />}
              label="Notifications"
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            />
          </nav>

          <div className="border-t border-[#E3E7E1] my-3" />

          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            {isLoggingOut ? "Logging out…" : "Sign Out"}
          </button>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {activeTab === "profile" && (
            <>
              <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-10 text-center">
                <h1 className="text-4xl font-semibold text-[#145C43] mb-2">
                  {user?.name ?? "—"}
                </h1>
                <p className="italic text-[#6E7C74] mb-4">Member since {memberSince}</p>
                <span className="inline-flex items-center gap-1.5 bg-[#E8EFEC] text-[#145C43] text-sm font-medium px-4 py-1.5 rounded-full">
                  <Star size={14} className="fill-[#145C43]" />
                  {isLoading ? "Loading..." : `${profile?.totalOrders ?? 0} orders placed`}
                </span>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-8">
                <h2 className="text-xl font-semibold text-[#145C43] mb-5">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadOnlyField label="Full Name" value={user?.name ?? "—"} />
                  <ReadOnlyField label="Email Address" value={user?.email ?? "—"} />
                </div>
              </section>
            </>
          )}

          {activeTab === "addresses" && (
            <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-[#145C43]">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddForm((s) => !s)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#145C43] hover:underline"
                >
                  <Plus size={16} />
                  Add Address
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="mb-6 p-5 rounded-xl bg-[#F5F7F3] space-y-3"
                >
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Label (Home, Work...)"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DCE3DC] bg-white focus:outline-none focus:ring-2 focus:ring-[#145C43]"
                  />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DCE3DC] bg-white focus:outline-none focus:ring-2 focus:ring-[#145C43]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Latitude"
                      required
                      className="px-4 py-2.5 rounded-lg border border-[#DCE3DC] bg-white focus:outline-none focus:ring-2 focus:ring-[#145C43]"
                    />
                    <input
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="Longitude"
                      required
                      className="px-4 py-2.5 rounded-lg border border-[#DCE3DC] bg-white focus:outline-none focus:ring-2 focus:ring-[#145C43]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-[#145C43] text-white font-medium disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Address"}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {profile?.savedAddresses.length === 0 && (
                  <p className="text-[#6E7C74] text-sm">No saved addresses yet.</p>
                )}
                {profile?.savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[#E3E7E1]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#16241D]">
                          {addr.label || "Address"}
                        </span>
                        {profile.defaultAddress === addr._id && (
                          <span className="text-xs bg-[#E8EFEC] text-[#145C43] px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6E7C74]">{addr.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile.defaultAddress !== addr._id && (
                        <button
                          onClick={async () => {
  try {
    await setDefault(addr._id);
    toast.success("Default address updated");
  } catch {
    toast.error("Failed to update default address.");
  }
}}
                          className="text-sm text-[#145C43] hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={async () => {
  try {
    await deleteAddress(addr._id);
    toast("Address removed", { icon: "🗑️", duration: 3000 });
  } catch {
    toast.error("Failed to remove address.");
  }
}}
                        className="text-red-500 hover:text-red-600"
                        aria-label="Delete address"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-8">
              {trackingOrderId ? (
                <OrderTrackingContent
                  orderId={trackingOrderId}
                  onBack={() => setTrackingOrderId(null)}
                />
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[#145C43] mb-5">My Orders</h2>
                  <OrdersContent onTrackOrder={setTrackingOrderId} />
                </>
              )}
            </section>
          )}

          {activeTab === "wallet" && (
            <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-8">
              <h2 className="text-xl font-semibold text-[#145C43] mb-5">Wallet</h2>
              <WalletContent />
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="bg-white rounded-2xl shadow-sm border border-[#E3E7E1] p-8 text-[#6E7C74] text-sm">
              No notifications yet.
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${active ? "bg-[#145C43] text-white" : "text-[#16241D] hover:bg-[#ECF2F0]"
      }`}
  >
    {icon}
    {label}
  </button>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-[#6E7C74] uppercase tracking-wide mb-1.5">{label}</p>
    <div className="px-4 py-3 rounded-lg bg-[#F5F7F3] text-[#16241D]">{value}</div>
  </div>
);

export default CustomerProfilePage;