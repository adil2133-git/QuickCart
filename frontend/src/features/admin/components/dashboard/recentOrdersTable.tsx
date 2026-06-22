import { useState } from "react";
import { Search, SlidersHorizontal, Download } from "lucide-react";

/**
 * QuickOps Admin — Recent Orders Table
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 */

type OrderStatus = "Delivered" | "Processing" | "Out for Delivery" | "Cancelled";

interface Order {
  id: string;
  customer: string;
  store: string;
  amount: string;
  payment: "UPI" | "COD" | "Card";
  status: OrderStatus;
}

const ORDERS: Order[] = [
  { id: "#QK-9842", customer: "Amit Sharma", store: "Bikanervala", amount: "₹1,240", payment: "UPI", status: "Out for Delivery" },
  { id: "#QK-9841", customer: "Priya Verma", store: "Fresh Mart", amount: "₹850", payment: "COD", status: "Processing" },
  { id: "#QK-9840", customer: "Rahul Jain", store: "The Baker's", amount: "₹3,420", payment: "Card", status: "Delivered" },
  { id: "#QK-9839", customer: "Siddharth R.", store: "Spice Route", amount: "₹2,100", payment: "UPI", status: "Delivered" },
  { id: "#QK-9838", customer: "Neha Kapoor", store: "Daily Greens", amount: "₹640", payment: "COD", status: "Cancelled" },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Delivered: "bg-[#E6F4EC] text-[#2E8B57]",
  Processing: "bg-[#FBF1DD] text-[#B8860B]",
  "Out for Delivery": "bg-[#E8EFFB] text-[#3D6FD1]",
  Cancelled: "bg-[#FBEAEA] text-[#D94F4F]",
};

const PAYMENT_STYLES: Record<Order["payment"], string> = {
  UPI: "bg-[#E6F4EC] text-[#2E8B57] border-[#CDE9D7]",
  COD: "bg-[#FBF1DD] text-[#B8860B] border-[#F3E2B5]",
  Card: "bg-[#F0EAFB] text-[#7B5FC2] border-[#E0D4F5]",
};

export default function RecentOrdersTable() {
  const [query, setQuery] = useState("");

  const filteredOrders = ORDERS.filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.store.toLowerCase().includes(query.toLowerCase())
  );

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
          <button className="flex items-center gap-1.5 rounded-lg border border-[#EBE1D2] px-3 py-1.5 text-[12.5px] font-medium text-[#5A4A3A] transition-colors hover:bg-[#FBF6EE]">
            <SlidersHorizontal size={13} />
            Filters
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#8B6F47] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#7A5F3C]">
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
          {filteredOrders.map((order) => (
            <tr
              key={order.id}
              className="border-t border-[#F2EBDD] text-[13.5px] text-[#3A2C20] transition-colors hover:bg-[#FBF6EE]"
            >
              <td className="px-6 py-3.5 font-medium text-[#8B6F47]">{order.id}</td>
              <td className="px-3 py-3.5">{order.customer}</td>
              <td className="px-3 py-3.5 text-[#5A4A3A]">{order.store}</td>
              <td className="px-3 py-3.5 font-semibold">{order.amount}</td>
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
          {filteredOrders.length === 0 && (
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