import { useEffect, useState } from "react";
import { Search, Download } from "lucide-react";
import { useDashboardState, type OrderStatusLabel, type PaymentLabel } from "../../state/dashboardState";

/**
 * QuickOps Admin — Recent Orders Table
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Live data via GET /admin/dashboard/recent-orders. Search is debounced
 * and sent to the server rather than filtered client-side, since the
 * server only returns a capped recent slice.
 *
 * "Filters" from the old mock was dropped — payment method here is only
 * ever Online/COD (that's all the schema tracks), so a dedicated filter
 * button didn't add anything real to filter by yet.
 */

const STATUS_STYLES: Record<OrderStatusLabel, string> = {
  Delivered: "bg-[#E6F4EC] text-[#2E8B57]",
  Processing: "bg-[#FBF1DD] text-[#B8860B]",
  "Out for Delivery": "bg-[#E8EFFB] text-[#3D6FD1]",
  Cancelled: "bg-[#FBEAEA] text-[#D94F4F]",
};

const PAYMENT_STYLES: Record<PaymentLabel, string> = {
  Online: "bg-[#E6F4EC] text-[#2E8B57] border-[#CDE9D7]",
  COD: "bg-[#FBF1DD] text-[#B8860B] border-[#F3E2B5]",
};

function formatAmount(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function exportCsv(orders: { id: string; customer: string; store: string; amount: number; payment: string; status: string }[]) {
  const header = ["Order ID", "Customer", "Store", "Amount", "Payment", "Status"];
  const rows = orders.map((o) => [o.id, o.customer, o.store, o.amount, o.payment, o.status]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recent-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecentOrdersTable() {
  const [query, setQuery] = useState("");
  const { recentOrders, recentOrdersLoading, recentOrdersError, fetchRecentOrders } = useDashboardState();

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Debounce server-side search so we're not firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => fetchRecentOrders(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="rounded-2xl border border-[#EBE1D2] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EBE1D2] px-6 py-5">
        <h2 className="text-[16px] font-semibold text-[#2A1F18]">Recent Orders</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#EBE1D2] bg-[#FBF6EE] px-2.5 py-1.5">
            <Search size={14} className="text-[#A2937F]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-28 bg-transparent text-[12.5px] text-[#3A2C20] placeholder:text-[#A2937F] focus:outline-none"
            />
          </div>
          <button
            onClick={() => exportCsv(recentOrders)}
            disabled={recentOrders.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#8B6F47] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#7A5F3C] disabled:opacity-40"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-[#A2937F]">
            <th className="px-6 py-3">Order ID</th>
            <th className="px-3 py-3">Customer</th>
            <th className="px-3 py-3">Store</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Payment</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {recentOrdersError && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#D94F4F]">
                {recentOrdersError}
              </td>
            </tr>
          )}

          {!recentOrdersError && recentOrdersLoading && recentOrders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#A2937F]">
                Loading…
              </td>
            </tr>
          )}

          {!recentOrdersError &&
            recentOrders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-[#F2EBDD] text-[13.5px] text-[#3A2C20] transition-colors hover:bg-[#FBF6EE]"
              >
                <td className="px-6 py-3.5 font-medium text-[#8B6F47]">{order.id}</td>
                <td className="px-3 py-3.5">{order.customer}</td>
                <td className="px-3 py-3.5 text-[#5A4A3A]">{order.store}</td>
                <td className="px-3 py-3.5 font-semibold">{formatAmount(order.amount)}</td>
                <td className="px-3 py-3.5">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${PAYMENT_STYLES[order.payment]}`}
                  >
                    {order.payment}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}

          {!recentOrdersError && !recentOrdersLoading && recentOrders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-[#A2937F]">
                No orders match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-[#F2EBDD] px-6 py-4 text-right">
        <button className="text-[13px] font-semibold text-[#8B6F47] hover:underline">
          View All Orders →
        </button>
      </div>
    </div>
  );
}