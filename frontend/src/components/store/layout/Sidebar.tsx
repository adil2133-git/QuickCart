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
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "products", label: "Products", icon: Package },
  { key: "inventory", label: "Inventory", icon: Warehouse },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "analytics", label: "Analytics", icon: LineChart },
  { key: "revenue", label: "Revenue", icon: Wallet },
];

interface SidebarProps {
  activeKey: SidebarNavKey;
  onNavigate?: (key: SidebarNavKey) => void;
  storeName?: string;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

export default function Sidebar({
  activeKey,
  onNavigate,
  storeName = "QuickKart",
  onSettingsClick,
  onProfileClick,
  onLogoutClick,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-[#2B1B0E] px-4 py-6">
      {/* Brand */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">{storeName}</h1>
        <p className="mt-0.5 text-sm text-[#A38F7D]">Store Panel</p>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate?.(key)}
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
          onClick={onSettingsClick}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[#D9CCBE] transition-colors hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={onProfileClick}
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[#D9CCBE] transition-colors hover:bg-white/5 hover:text-white"
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
