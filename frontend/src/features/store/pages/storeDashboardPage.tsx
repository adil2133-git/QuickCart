import Dashboard from "../../../components/store/dashboard/Dashboard";
import { getMockDashboardData } from "../../../components/store/data/mockDashboard";

export default function DashboardPage() {
  const data = getMockDashboardData();

  return <Dashboard data={data} />;
}