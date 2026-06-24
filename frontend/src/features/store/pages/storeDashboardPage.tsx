import Sidebar from "../components/storeSidebar";
import Topbar from "../components/storeTopbar";
import Dashboard from "../../../components/store/dashboard/Dashboard";
import { getMockDashboardData } from "../../../components/store/data/mockDashboard";

export default function DashboardPage() {
  const data = getMockDashboardData();

  return (
    <div className="flex h-screen w-full bg-[#FBF1E9]">
      <Sidebar storeName={data.store.storeName} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar notificationCount={3} />
        <Dashboard data={data} />
      </div>
    </div>
  );
}