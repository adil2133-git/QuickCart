import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import KpiStrip from "../components/dashboard/kpistrip";
import OperationsIntelligence from "../components/dashboard/operationsIntelligence";
import RecentOrdersTable from "../components/dashboard/recentOrdersTable";
import ActionRail from "../components/dashboard/actionRail";

export default function Dashboard() {
    return (
        <div className="flex h-screen w-full bg-white text-[#16241D]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Dashboard" />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                    <div className="flex items-start gap-6">
                        {/* Left: monitoring feed */}
                        <div className="flex min-w-0 flex-1 flex-col gap-6">
                            <KpiStrip />
                            <OperationsIntelligence />
                            <RecentOrdersTable />
                        </div>

                        <div className="sticky top-0 shrink-0 self-start">
                            <ActionRail />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}