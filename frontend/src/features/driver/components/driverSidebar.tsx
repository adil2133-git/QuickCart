import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, Truck, BadgeDollarSign, Wallet,
  Trophy, LogOut, Headphones, Settings,
} from "lucide-react";
import { useLogout } from "../../auth/hooks/useLogout";

type DriverNavKey = "dashboard" | "deliveries" | "earnings" | "wallet" | "rewards" | "support" | "settings";

interface NavItem {
  key: DriverNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",  label: "Dashboard",  icon: LayoutGrid,      path: "/driver/dashboard" },
  { key: "deliveries", label: "Deliveries", icon: Truck,           path: "/driver/deliveries" },
  { key: "earnings",   label: "Earnings",   icon: BadgeDollarSign, path: "/driver/earnings" },
  { key: "wallet",     label: "Wallet",     icon: Wallet,          path: "/driver/wallet" },
  { key: "rewards",    label: "Rewards",    icon: Trophy,          path: "/driver/rewards" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { key: "support",  label: "Support",  icon: Headphones, path: "/driver/support" },
  { key: "settings", label: "Settings", icon: Settings,   path: "/driver/settings" },
];

interface DriverSidebarProps {
  driverName?: string;
  driverLevel?: string;
  avatarUrl?: string | null;
}

export default function DriverSidebar({
  driverName = "Driver",
  driverLevel = "BRONZE",
  avatarUrl = null,
}: DriverSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, isLoggingOut } = useLogout();

  const activeKey = [...NAV_ITEMS, ...BOTTOM_ITEMS].find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )?.key;

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = activeKey === item.key;
    return (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(item.path)}
        className={[
          "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-[#3D2A18] text-white"
            : "text-[#C9BCAC] hover:bg-[#3D2A18]/60 hover:text-white",
        ].join(" ")}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#C9A97A]" />
        )}
        <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-[#C9A97A]" : ""}`} />
        {item.label}
      </motion.button>
    );
  };

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col bg-[#2F1B12] px-3 py-5">
      {/* Brand */}
      <div className="mb-6 px-3">
        <p className="text-base font-bold text-white tracking-tight">QuickKart</p>
        <p className="text-[11px] text-[#C9A97A] font-medium">Driver Portal</p>
      </div>

      {/* Driver card */}
      <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2.5">
        <div className="relative h-8 w-8 flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={driverName} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A97A] text-xs font-bold text-[#2B1B0E]">
              {driverName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#2F1B12] bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white leading-tight">{driverName}</p>
          <p className="text-[10px] text-[#C9A97A] font-medium">{driverLevel} Partner</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="mt-4 space-y-0.5 border-t border-white/10 pt-4">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {isLoggingOut ? "Logging out…" : "Logout"}
        </motion.button>
      </div>
    </aside>
  );
}