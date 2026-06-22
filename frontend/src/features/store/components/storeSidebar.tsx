import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Warehouse,
  Tags,
  LineChart,
  Wallet,
  Settings,
  UserCircle,
  LogOut,
} from "lucide-react";

export type SidebarNavKey =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "categories"
  | "analytics"
  | "revenue";

interface NavItem {
  key: SidebarNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",  label: "Dashboard",  icon: LayoutGrid, path: "/store/dashboard" },
  { key: "orders",     label: "Orders",     icon: ShoppingBag, path: "/store/orders" },
  { key: "products",   label: "Products",   icon: Package,    path: "/store/products" },
  { key: "inventory",  label: "Inventory",  icon: Warehouse,  path: "/store/inventory" },
  { key: "categories", label: "Categories", icon: Tags,       path: "/store/categories" },
  { key: "analytics",  label: "Analytics",  icon: LineChart,  path: "/store/analytics" },
  { key: "revenue",    label: "Revenue",    icon: Wallet,     path: "/store/revenue" },
];

interface SidebarProps {
  storeName?: string;
  onLogoutClick?: () => void;
}

export default function Sidebar({ storeName = "QuickKart", onLogoutClick }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Match active key from current path — products/new and products/:id/edit
  // both live under /store/products so they stay highlighted correctly.
  const activeKey = NAV_ITEMS.find((item) =>
    pathname === item.path || pathname.startsWith(item.path + "/")
  )?.key;

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-[#2B1B0E] px-4 py-6">
      {/* Brand */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">{storeName}</h1>
        <p className="mt-0.5 text-sm text-[#A38F7D]">Store Panel</p>
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

      {/* Footer actions */}
      <div className="space-y-1 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => navigate("/store/settings")}
          className={[
            "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === "/store/settings"
              ? "bg-[#C8A37E] text-[#2B1B0E]"
              : "text-[#D9CCBE] hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/store/profile")}
          className={[
            "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === "/store/profile"
              ? "bg-[#C8A37E] text-[#2B1B0E]"
              : "text-[#D9CCBE] hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          <UserCircle className="h-[18px] w-[18px]" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          onClick={onLogoutClick}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[#D9CCBE] transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}