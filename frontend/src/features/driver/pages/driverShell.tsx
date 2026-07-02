import { Outlet } from "react-router-dom";
import DriverSidebar from "../components/driverSidebar";
import DriverTopbar from "../components/driverTopbar";
import { useAuthStore } from "../../auth/state/authState";
import { useDriverLocationTracking } from "../hooks/useDriverLocationTracking";
import { useDriverDeliverySocket } from "../hooks/useDriverDeliverySocket";
import DeliveryRequestPopup from "../components/deliveryRequestPopup";

export default function DriverShell() {
  const user = useAuthStore((s) => s.user);

  useDriverLocationTracking();
  useDriverDeliverySocket();

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDF8F1] font-[Inter,sans-serif]">
      <DriverSidebar
        driverName={user?.name ?? "Driver"}
        driverLevel="GOLD"
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DriverTopbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Global delivery request popup — appears on any page */}
      <DeliveryRequestPopup />
    </div>
  );
}