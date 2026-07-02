import { Bell, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDashboardStore } from "../state/driverDashboarState";
import { toast } from "sonner";

function titleFromPath(pathname: string): string {
  if (pathname === "/driver/dashboard")  return "Dashboard";
  if (pathname === "/driver/deliveries") return "Deliveries";
  if (pathname === "/driver/earnings")   return "Earnings";
  if (pathname === "/driver/wallet")     return "Wallet";
  if (pathname === "/driver/rewards")    return "Rewards";
  if (pathname === "/driver/profile")    return "Profile";
  return "Driver Portal";
}

export default function DriverTopbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);

  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const requests = useDriverDeliveryStore((s) => s.requests);
  const locationStatus = useDriverDashboardStore((s) => s.locationStatus);
  const { toggleAvailability } = useDriverDeliveryActions();

  const handleToggle = async () => {
    try {
      await toggleAvailability(!isOnline);
    } catch {
      toast.error("Could not update availability. Try again.");
    }
  };

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E8DCCF] bg-[#FDF8F1] px-6">
      <h1 className="text-[15px] font-semibold text-[#2B2B2B] tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {isOnline && (
          <div className="flex items-center gap-1.5 rounded-full bg-white border border-[#E8DCCF] px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${
              locationStatus === "active" ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
            }`} />
            <span className="text-[11px] font-medium text-[#8A7C72]">
              {locationStatus === "active" ? "GPS" : "Locating…"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className={[
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all",
            isOnline
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
              : "bg-[#E8DCCF] text-[#6F4E37]",
          ].join(" ")}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-white" : "bg-[#8A7C72]"}`} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6F4E37] transition-colors hover:bg-[#F0E8DF]"
        >
          <Bell className="h-[18px] w-[18px]" />
          {requests.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#FDF8F1]">
              {requests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/driver/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#6F4E37] transition-colors hover:bg-[#F0E8DF]"
          aria-label="Profile"
        >
          <UserCircle className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}