import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

// Derives a human-readable title from the current path so every page
// gets the right heading without each page having to pass it manually.
function titleFromPath(pathname: string): string {
  if (pathname === "/store/dashboard")           return "Dashboard";
  if (pathname === "/store/orders")              return "Orders";
  if (pathname === "/store/products/new")        return "Add Product";
  if (pathname.match(/^\/store\/products\/.+\/edit$/)) return "Edit Product";
  if (pathname === "/store/products")            return "Products";
  if (pathname === "/store/inventory")           return "Inventory";
  if (pathname === "/store/categories")          return "Categories";
  if (pathname === "/store/analytics")           return "Analytics";
  if (pathname === "/store/revenue")             return "Revenue";
  if (pathname === "/store/settings")            return "Settings";
  if (pathname === "/store/profile")             return "Profile";
  return "Store Panel";
}

interface TopbarProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function Topbar({ notificationCount = 0, onNotificationClick }: TopbarProps) {
  const { pathname } = useLocation();
  const title = titleFromPath(pathname);

  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-[#EADFD3] bg-[#FBF1E9] px-8">
      <h2 className="text-2xl font-bold text-[#2B1B0E]">{title}</h2>

      <button
        type="button"
        onClick={onNotificationClick}
        aria-label={
          notificationCount > 0 ? `Notifications, ${notificationCount} unread` : "Notifications"
        }
        className="relative rounded-full p-2 text-[#2B1B0E] transition-colors hover:bg-black/5"
      >
        <Bell className="h-6 w-6" />
        {notificationCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#FBF1E9]" />
        )}
      </button>
    </header>
  );
}