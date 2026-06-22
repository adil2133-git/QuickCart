import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import KpiStrip from "../components/dashboard/kpistrip";
import OperationsIntelligence from "../components/dashboard/operationsIntelligence";
import RecentOrdersTable from "../components/dashboard/recentOrdersTable";
import ActionRail from "../components/dashboard/actionRail";

/**
 * QuickKart Admin — Dashboard Page
 * Stack: React + TypeScript + Tailwind CSS
 *
 * Combines the shared Sidebar + TopBar with dashboard-only content:
 * a "Command Rail" layout — left side is the monitoring feed
 * (KPIs, chart, recent orders), right side is the action rail
 * (needs attention, approvals, quick actions).
 *
 * To build the next page (e.g. Analytics), copy this file's shape:
 * keep the <Sidebar /> + <TopBar pageTitle="..." /> exactly as is,
 * swap out everything inside <main> for that page's own content.
 *
 * Requires: lucide-react, recharts
 *   npm install lucide-react recharts
 */

export default function Dashboard() {
    return (
        <div className="flex h-screen w-full bg-[#FBF6EE]">
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

                        {/* Right: action rail — sticky, but no separate scrollbar.
                            It scrolls together with the page as one unit; sticky
                            just keeps it pinned in view while the left column
                            scrolls past it. */}
                        <div className="sticky top-0 shrink-0 self-start">
                            <ActionRail />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}