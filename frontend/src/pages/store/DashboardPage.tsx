import { useState } from "react";
import Sidebar, { type SidebarNavKey } from "../../components/store/layout/Sidebar";
import Topbar from "../../components/store/layout/Topbar";
import Dashboard from "../../components/store/dashboard/Dashboard";
import { getMockDashboardData } from "../../components/store/data/mockDashboard";

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState<SidebarNavKey>("dashboard");
  const data = getMockDashboardData();

  return (
    <div className="flex h-screen w-full bg-[#FBF1E9]">
      <Sidebar activeKey={activeNav} onNavigate={setActiveNav} storeName={data.store.storeName} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar title="Dashboard" notificationCount={3} />
        <Dashboard data={data} />
      </div>
    </div>
  );
}