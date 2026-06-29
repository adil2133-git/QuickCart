// pages/CustomerProfilePage.tsx
import { useState } from "react";
import {
  User as UserIcon,
  ClipboardList,
  MapPin,
  Bell,
  LogOut,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import NavBar from "../components/navbar";
import { useCustomerProfile } from "../hooks/useCustomerProfile";
import type { AddAddressPayload } from "../types/customerProfile";
import { useLogout } from "../../auth/hooks/useLogout";

type SidebarTab = "profile" | "orders" | "addresses" | "notifications";

const CustomerProfilePage = () => {
  const { profile, user, isLoading, error, addNewAddress, setDefault, deleteAddress } =
    useCustomerProfile();

  const [activeTab, setActiveTab] = useState<SidebarTab>("profile");
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
    } catch {
      // form stays open on failure; could surface a toast here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6EC] font-sans">
      <NavBar />

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="bg-white rounded-2xl shadow-sm p-3 h-fit">
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

          <div className="border-t border-[#EFE3D0] my-3" />

          <button
            onClick={isLoggingOut ? "Logging out…" : logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {activeTab === "profile" && (
            <>
              <section className="bg-white rounded-2xl shadow-sm p-10 text-center">
                <h1 className="text-4xl font-semibold text-[#8B6B3D] mb-2">
                  {user?.name ?? "—"}
                </h1>
                <p className="italic text-gray-500 mb-4">Member since {memberSince}</p>
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full">
                  <Star size={14} className="fill-green-700" />
                  {isLoading ? "Loading..." : `${profile?.totalOrders ?? 0} orders placed`}
                </span>
              </section>

              <section className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-semibold text-[#8B6B3D] mb-5">
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
            <section className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-[#8B6B3D]">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddForm((s) => !s)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#8B6B3D] hover:underline"
                >
                  <Plus size={16} />
                  Add Address
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="mb-6 p-5 rounded-xl bg-[#FDF6EC] space-y-3"
                >
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Label (Home, Work...)"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#EFE3D0] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A368]"
                  />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#EFE3D0] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A368]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Latitude"
                      required
                      className="px-4 py-2.5 rounded-lg border border-[#EFE3D0] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A368]"
                    />
                    <input
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="Longitude"
                      required
                      className="px-4 py-2.5 rounded-lg border border-[#EFE3D0] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A368]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-[#C9A368] text-white font-medium disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Address"}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {profile?.savedAddresses.length === 0 && (
                  <p className="text-gray-500 text-sm">No saved addresses yet.</p>
                )}
                {profile?.savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[#EFE3D0]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#5C4A2E]">
                          {addr.label || "Address"}
                        </span>
                        {profile.defaultAddress === addr._id && (
                          <span className="text-xs bg-[#C9A368]/20 text-[#8B6B3D] px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{addr.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile.defaultAddress !== addr._id && (
                        <button
                          onClick={() => setDefault(addr._id)}
                          className="text-sm text-[#8B6B3D] hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(addr._id)}
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
            <section className="bg-white rounded-2xl shadow-sm p-8 text-gray-500 text-sm">
              Order history coming soon.
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="bg-white rounded-2xl shadow-sm p-8 text-gray-500 text-sm">
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      active ? "bg-[#C9A368] text-white" : "text-[#5C4A2E] hover:bg-[#FDF6EC]"
    }`}
  >
    {icon}
    {label}
  </button>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
    <div className="px-4 py-3 rounded-lg bg-[#FDF6EC] text-[#5C4A2E]">{value}</div>
  </div>
);

export default CustomerProfilePage;