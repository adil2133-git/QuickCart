// src/features/driver/pages/driverDashboard.tsx
import { useDriverDashboard } from "../hooks/useDriverDashboard";
import type { OrderRequest, ActivityItem, OverviewCard } from "../types/driverDashboard";

// ─── Status Bar (Go Online / Offline) ──────────────────────────────────────────

function StatusBar({
  isOnline,
  onToggle,
}: {
  isOnline: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${
            isOnline ? "bg-emerald-500" : "bg-[#A38F7D]"
          }`}
        />
        <div>
          <p className="text-sm font-semibold text-[#1d1b16]">
            You're currently {isOnline ? "Online" : "Offline"}
          </p>
          <p className="text-xs text-[#4e453d]">
            {isOnline
              ? "You can receive new delivery requests."
              : "Go online to start receiving requests."}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
          isOnline
            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            : "bg-[#735a3e] text-white hover:brightness-110"
        }`}
      >
        {isOnline ? "Go Offline" : "Go Online"}
      </button>
    </section>
  );
}

// ─── Overview Cards ───────────────────────────────────────────────────────────

function OverviewCards({ cards }: { cards: OverviewCard[] }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white p-6 rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30 flex flex-col gap-1 hover:bg-[#f9f3ea] transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#735a3e]">{card.icon}</span>
            {card.badge && <span className="text-xs text-[#376847] font-medium">{card.badge}</span>}
          </div>
          <p className="text-xs font-medium text-[#4e453d] uppercase tracking-tight">{card.label}</p>
          <span className="text-2xl font-bold text-[#1d1b16] font-['Playfair_Display']">{card.value}</span>
        </div>
      ))}
    </section>
  );
}

// ─── Active Order ─────────────────────────────────────────────────────────────

function ActiveOrderSection() {
  return (
    <section className="bg-white rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30 overflow-hidden">
      <div className="bg-[#f3ede4]/50 px-6 py-4 flex items-center gap-4 border-b border-[#d2c4b9]/30">
        <span className="material-symbols-outlined text-[#735a3e]">conveyor_belt</span>
        <h3 className="text-base font-semibold text-[#1d1b16] font-['Playfair_Display']">Active Order</h3>
      </div>
      <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#f3ede4] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#735a3e] text-4xl opacity-50">local_shipping</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-semibold text-[#1d1b16]">No Active Order Running</h4>
          <p className="text-sm text-[#4e453d] max-w-[280px] mx-auto">
            New requests will appear below when they are assigned to you.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  order,
  highlighted,
  onAccept,
  onDecline,
}: {
  order: OrderRequest;
  highlighted: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <div className={`bg-white p-6 rounded-xl border shadow-[0_2px_12px_rgba(194,163,131,0.18)] relative overflow-hidden ${highlighted ? "border-[#735a3e]/20" : "border-[#d2c4b9]/30"}`}>
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#735a3e]/20">
          <div className="h-full bg-[#735a3e] animate-[shrink_60s_linear_infinite]" style={{ width: "100%" }} />
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-mono text-[#735a3e]">{order.id}</span>
          <h4 className="text-sm font-semibold text-[#1d1b16] font-['Playfair_Display']">{order.store}</h4>
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold text-[#735a3e] font-['Playfair_Display']">{order.earnings}</span>
          <p className="text-xs text-[#4e453d]">{order.distance}</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <span className="material-symbols-outlined text-[#4e453d] text-sm mt-1">location_on</span>
        <p className="text-sm text-[#4e453d] line-clamp-2">{order.route}</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onAccept(order.id)}
          className="flex-1 bg-[#735a3e] text-white py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(order.id)}
          className="flex-1 border border-[#d2c4b9] text-[#4e453d] py-2 rounded-lg text-sm font-semibold hover:bg-[#f3ede4] transition-all"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function NewRequestsSection({
  orders,
  onAccept,
  onDecline,
}: {
  orders: OrderRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-[#1d1b16] font-['Playfair_Display']">New Requests</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order, i) => (
          <RequestCard
            key={order.id}
            order={order}
            highlighted={i === 0}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivitySection({ items }: { items: ActivityItem[] }) {
  return (
    <section className="bg-white p-6 rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30">
      <h3 className="text-base font-semibold text-[#1d1b16] mb-6 font-['Playfair_Display']">Recent Activity</h3>
      <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#d2c4b9]/30">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4 relative">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 border-white flex-shrink-0 ${item.iconColor === "green" ? "bg-[#376847]/10" : "bg-[#735a3e]/10"}`}>
              <span className={`material-symbols-outlined text-sm ${item.iconColor === "green" ? "text-[#376847]" : "text-[#735a3e]"}`}>
                {item.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1d1b16]">{item.title}</p>
              <p className="text-sm text-[#4e453d]">{item.description}</p>
              <span className="text-xs text-[#4e453d] opacity-60">{item.time}</span>
            </div>
            <span className={`text-sm font-semibold ${item.amountColor === "green" ? "text-[#376847]" : "text-[#735a3e]"}`}>
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// NOTE: No Sidebar / Header here anymore — DriverShell (rendered by the router
// layout route) already provides DriverSidebar + DriverTopbar via <Outlet/>.
// This component is just the page content for "/driver/dashboard".

export default function QuickKartDashboard() {
  const {
    orders,
    overviewCards,
    activityItems,
    isLoading,
    error,
    isOnline,
    toggleOnline,
    acceptOrder,
    declineOrder,
  } = useDriverDashboard();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 1.25rem;
        }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>

      <div className="space-y-6 max-w-[1200px] mx-auto w-full font-['DM_Sans']">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading shimmer */}
        {isLoading && (
          <div className="text-sm text-[#4e453d] animate-pulse">Loading dashboard…</div>
        )}

        {/* Online / Offline status + action */}
        <StatusBar isOnline={isOnline} onToggle={toggleOnline} />

        <OverviewCards cards={overviewCards} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <ActiveOrderSection />
            <NewRequestsSection
              orders={orders}
              onAccept={acceptOrder}
              onDecline={declineOrder}
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <RecentActivitySection items={activityItems} />
          </div>
        </div>
      </div>
    </>
  );
}