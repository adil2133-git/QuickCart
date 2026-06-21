// storeShell.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar, { type SidebarNavKey } from "../../components/store/layout/Sidebar";
import Topbar from "../../components/store/layout/Topbar";

// Maps each route prefix to its sidebar key + the title shown in the topbar.
// Add an entry here whenever a new top-level store page is created.
const ROUTE_CONFIG: { match: (path: string) => boolean; key: SidebarNavKey; title: string }[] = [
  { match: (p) => p.startsWith("/store/dashboard"), key: "dashboard", title: "Dashboard" },
  { match: (p) => p.startsWith("/store/orders"), key: "orders", title: "Orders" },
  { match: (p) => p.startsWith("/store/products"), key: "products", title: "Products" },
  { match: (p) => p.startsWith("/store/inventory"), key: "inventory", title: "Inventory" },
  { match: (p) => p.startsWith("/store/categories"), key: "categories", title: "Categories" },
  { match: (p) => p.startsWith("/store/analytics"), key: "analytics", title: "Analytics" },
  { match: (p) => p.startsWith("/store/revenue"), key: "revenue", title: "Revenue" },
];

const ROUTE_FOR_KEY: Record<SidebarNavKey, string> = {
  dashboard: "/store/dashboard",
  orders: "/store/orders",
  products: "/store/products",
  inventory: "/store/inventory",
  categories: "/store/categories",
  analytics: "/store/analytics",
  revenue: "/store/revenue",
};

function resolveActive(pathname: string) {
  const found = ROUTE_CONFIG.find((r) => r.match(pathname));
  return found ?? { key: "dashboard" as SidebarNavKey, title: "Dashboard" };
}

export function StoreShell({
  children,
  notificationCount = 0,
}: {
  children: React.ReactNode;
  notificationCount?: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { key: activeKey, title } = resolveActive(location.pathname);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FBF1E9]">
      <Sidebar
        activeKey={activeKey}
        onNavigate={(key) => navigate(ROUTE_FOR_KEY[key])}
        onSettingsClick={() => navigate("/store/settings")}
        onProfileClick={() => navigate("/store/profile")}
        onLogoutClick={() => navigate("/logout")}
      />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar title={title} notificationCount={notificationCount} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}