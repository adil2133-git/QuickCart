// src/features/driver/pages/DriverShell.tsx
import { Outlet } from "react-router-dom";
import DriverSidebar from "../components/driverSidebar";
import DriverTopbar from "../components/driverTopbar";
import { useAuthStore } from "../../auth/state/authState";

export default function DriverShell() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBF1E9] font-[Inter,sans-serif]">
      <DriverSidebar
        driverName={user?.name ?? "Driver"}
        driverLevel="GOLD"
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DriverTopbar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}