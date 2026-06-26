// src/features/driver/components/DriverTopbar.tsx
import { Bell, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { toast } from "sonner";

function titleFromPath(pathname: string): string {
  if (pathname === "/driver/dashboard")   return "Dashboard";
  if (pathname === "/driver/deliveries")  return "Delivery Management";
  if (pathname === "/driver/earnings")    return "Earnings";
  if (pathname === "/driver/wallet")      return "Wallet";
  if (pathname === "/driver/rewards")     return "Rewards";
  if (pathname === "/driver/profile")     return "Profile";
  return "QuickKart";
}

interface DriverTopbarProps {
  brandName?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function DriverTopbar({
  brandName = "QuickKart",
  notificationCount = 0,
  onNotificationClick,
}: DriverTopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);

  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const { toggleAvailability } = useDriverDeliveryActions();

  const handleToggle = async () => {
    try {
      await toggleAvailability(!isOnline);
    } catch {
      toast.error("Could not update availability. Try again.");
    }
  };

  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-[#EADFD3] bg-[#FBF1E9] px-8">
      {/* Left: brand + page title */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-[#2B1B0E]">{brandName}</span>
        <span className="text-[#C8A37E]">/</span>
        <h2 className="text-lg font-semibold text-[#2B1B0E]">{title}</h2>
      </div>

      {/* Right: online toggle + notifications + profile */}
      <div className="flex items-center gap-3">
        {/* Online / Offline toggle */}
        <button
          type="button"
          onClick={handleToggle}
          className={[
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            isOnline
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-[#EADFD3] text-[#7A6350] hover:bg-[#DDD0C3]",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              isOnline ? "bg-emerald-500" : "bg-[#A38F7D]",
            ].join(" ")}
          />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onNotificationClick}
          aria-label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : "Notifications"
          }
          className="relative rounded-full p-2 text-[#2B1B0E] transition-colors hover:bg-black/5"
        >
          <Bell className="h-6 w-6" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#FBF1E9]" />
          )}
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={() => navigate("/driver/profile")}
          className="rounded-full p-2 text-[#2B1B0E] transition-colors hover:bg-black/5"
          aria-label="Profile"
        >
          <UserCircle className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}