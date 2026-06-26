// src/features/driver/components/DriverSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Truck,
  BadgeDollarSign,
  Wallet,
  Trophy,
  LogOut,
} from "lucide-react";
import { useLogout } from "../../auth/hooks/useLogout";

type DriverNavKey = "dashboard" | "deliveries" | "earnings" | "wallet" | "rewards";

interface NavItem {
  key: DriverNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",  label: "Dashboard",  icon: LayoutGrid,       path: "/driver/dashboard" },
  { key: "deliveries", label: "Deliveries", icon: Truck,            path: "/driver/deliveries" },
  { key: "earnings",   label: "Earnings",   icon: BadgeDollarSign,  path: "/driver/earnings" },
  { key: "wallet",     label: "Wallet",     icon: Wallet,           path: "/driver/wallet" },
  { key: "rewards",    label: "Rewards",    icon: Trophy,           path: "/driver/rewards" },
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
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { logout, isLoggingOut } = useLogout();

  const activeKey = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )?.key;

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-[#2B1B0E] px-4 py-6">
      {/* Driver identity */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="relative h-10 w-10 flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={driverName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#C8A37E] text-sm font-bold text-[#2B1B0E]">
              {driverName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#2B1B0E] bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{driverName}</p>
          <p className="text-xs text-[#A38F7D]">{driverLevel} PARTNER</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#C8A37E] text-[#2B1B0E]"
                  : "text-[#D9CCBE] hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}