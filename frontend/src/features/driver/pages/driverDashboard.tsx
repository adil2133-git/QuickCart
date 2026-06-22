import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRequest {
  id: string;
  store: string;
  earnings: string;
  distance: string;
  route: string;
}

interface ActivityItem {
  icon: string;
  iconColor: "green" | "brown";
  title: string;
  description: string;
  time: string;
  amount: string;
  amountColor: "green" | "brown";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "local_shipping", label: "Deliveries", active: false },
  { icon: "payments", label: "Earnings", active: false },
  { icon: "account_balance_wallet", label: "Wallet", active: false },
  { icon: "workspace_premium", label: "Rewards", active: false },
];

const OVERVIEW_CARDS = [
  {
    icon: "payments",
    label: "Today's Earnings",
    value: "₹520.00",
    badge: "+12% vs yesterday",
  },
  {
    icon: "local_shipping",
    label: "Today's Deliveries",
    value: "14",
    badge: null,
  },
  {
    icon: "account_balance_wallet",
    label: "Wallet Balance",
    value: "₹1,250",
    badge: null,
  },
];

const ORDER_REQUESTS: OrderRequest[] = [
  {
    id: "#ORD155",
    store: "Artisan Bakery",
    earnings: "₹45.00",
    distance: "0.8 km",
    route: "Bakery St. → Sector 12, Park Ave",
  },
  {
    id: "#ORD156",
    store: "Dairy Delight",
    earnings: "₹32.00",
    distance: "1.5 km",
    route: "Milk Colony → Aman Vihar",
  },
];

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    icon: "check",
    iconColor: "green",
    title: "Delivery Completed",
    description: "Order #ORD122 delivered to Sector 4",
    time: "12 mins ago",
    amount: "+₹42.00",
    amountColor: "green",
  },
  {
    icon: "account_balance_wallet",
    iconColor: "brown",
    title: "Incentive Added",
    description: "Peak hour bonus for last 5 orders",
    time: "1 hour ago",
    amount: "+₹25.00",
    amountColor: "brown",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );
}

function Sidebar({ online }: { online: boolean }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#f9f3ea] border-r border-[#d2c4b9] flex flex-col py-6 px-4 z-30">
      {/* Profile */}
      <div className="flex items-center gap-4 p-2 mb-8 bg-[#eeddc7]/20 rounded-xl">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d2c4b9] flex-shrink-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4CdLyEvmYlhnTtOuYgRl9ytHQelVNJ4ppEe5GnjfWTz3uMTpErnZAGfoo2RJ05gXstx4XNSgvtd0xO4HcTw4kxqC3YaGyFbQP_kbci-elVAd7YGIq65p8i_Yq0zYn96xDrMOGIoVIgOcIE1HTFwMiFoP36u8mniYznBOgcndSmidJsxn2zThTUPdcC5SqeoshoY3Cp6XjPVuO8g6-zzpvveahcTs98Z8zjNH00SOZdW3O-i_irmYjf2fVm2H_cJPpwi2fjYgk753s"
            alt="Driver Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#735a3e]">Alex Driver</p>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${online ? "bg-[#376847]" : "bg-[#4e453d]"}`}
            />
            <p className="text-xs text-[#4e453d]">
              {online ? "Active Now" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-4 px-4 py-2 rounded-lg text-sm transition-colors ${
              item.active
                ? "text-[#735a3e] font-bold border-r-4 border-[#735a3e] bg-[#eeddc7]/10"
                : "text-[#4e453d] hover:bg-[#e7e2d9]"
            }`}
          >
            <MaterialIcon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto">
        <button className="w-full flex items-center gap-4 px-4 py-2 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/10 transition-colors text-sm font-bold">
          <MaterialIcon name="logout" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Header({
  online,
  onToggle,
}: {
  online: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-[#fff9ef] border-b border-[#d2c4b9] flex justify-between items-center px-10 z-20 gap-6">
      <h1 className="text-xl font-semibold text-[#735a3e] mr-auto font-['Playfair_Display']">
        QuickKart
      </h1>
      <div className="flex items-center gap-6">
        {/* Online toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={online}
              onChange={onToggle}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-[#e7e2d9] rounded-full peer peer-checked:bg-[#376847]/20 transition-colors" />
            <div
              className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all ${
                online
                  ? "translate-x-4 bg-[#376847]"
                  : "bg-[#4e453d]"
              }`}
            />
          </div>
          <span
            className={`text-xs font-medium uppercase tracking-wider transition-colors ${
              online ? "text-[#376847]" : "text-[#4e453d]"
            }`}
          >
            {online ? "Online" : "Offline"}
          </span>
        </label>

        {/* Icons */}
        <div className="flex items-center gap-4 text-[#4e453d]">
          <button className="p-1 hover:text-[#735a3e] transition-colors">
            <MaterialIcon name="notifications" />
          </button>
          <button className="p-1 hover:text-[#735a3e] transition-colors">
            <MaterialIcon name="account_circle" />
          </button>
        </div>
      </div>
    </header>
  );
}

function OverviewCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {OVERVIEW_CARDS.map((card) => (
        <div
          key={card.label}
          className="bg-white p-6 rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30 flex flex-col gap-1 group hover:bg-[#f9f3ea] transition-colors"
        >
          <div className="flex justify-between items-start">
            <MaterialIcon name={card.icon} className="text-[#735a3e]" />
            {card.badge && (
              <span className="text-xs text-[#376847] font-medium">
                {card.badge}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#4e453d] uppercase tracking-tight">
            {card.label}
          </p>
          <span className="text-2xl font-bold text-[#1d1b16] font-['Playfair_Display']">
            {card.value}
          </span>
        </div>
      ))}
    </section>
  );
}

function ActiveOrderSection() {
  return (
    <section className="bg-white rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30 overflow-hidden">
      <div className="bg-[#f3ede4]/50 px-6 py-4 flex justify-between items-center border-b border-[#d2c4b9]/30">
        <div className="flex items-center gap-4">
          <MaterialIcon name="conveyor_belt" className="text-[#735a3e]" />
          <h3 className="text-base font-semibold text-[#1d1b16] font-['Playfair_Display']">
            Active Order
          </h3>
        </div>
      </div>
      <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#f3ede4] flex items-center justify-center">
          <MaterialIcon
            name="local_shipping"
            className="text-[#735a3e] text-4xl opacity-50"
          />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-semibold text-[#1d1b16]">
            No Active Order Running
          </h4>
          <p className="text-sm text-[#4e453d] max-w-[280px] mx-auto">
            New requests will appear below when they are assigned to you.
          </p>
        </div>
      </div>
    </section>
  );
}

function RequestCard({
  order,
  highlighted,
}: {
  order: OrderRequest;
  highlighted: boolean;
}) {
  return (
    <div
      className={`bg-white p-6 rounded-xl border shadow-[0_2px_12px_rgba(194,163,131,0.18)] relative overflow-hidden group ${
        highlighted ? "border-[#735a3e]/20" : "border-[#d2c4b9]/30"
      }`}
    >
      {/* Timer bar */}
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#735a3e]/20">
          <div
            className="h-full bg-[#735a3e] animate-[shrink_60s_linear_infinite]"
            style={{ width: "100%" }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-mono text-[#735a3e]">{order.id}</span>
          <h4 className="text-sm font-semibold text-[#1d1b16] font-['Playfair_Display']">
            {order.store}
          </h4>
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold text-[#735a3e] font-['Playfair_Display']">
            {order.earnings}
          </span>
          <p className="text-xs text-[#4e453d]">{order.distance}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <MaterialIcon
          name="location_on"
          className="text-[#4e453d] text-sm mt-1"
        />
        <p className="text-sm text-[#4e453d] line-clamp-2">{order.route}</p>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 bg-[#735a3e] text-white py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all">
          Accept
        </button>
        <button className="flex-1 border border-[#d2c4b9] text-[#4e453d] py-2 rounded-lg text-sm font-semibold hover:bg-[#f3ede4] transition-all">
          Decline
        </button>
      </div>
    </div>
  );
}

function NewRequestsSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-[#1d1b16] font-['Playfair_Display']">
        New Requests
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORDER_REQUESTS.map((order, i) => (
          <RequestCard key={order.id} order={order} highlighted={i === 0} />
        ))}
      </div>
    </section>
  );
}

function TargetBonusSection() {
  const current = 20;
  const target = 30;
  const pct = Math.round((current / target) * 100);

  return (
    <section className="bg-[#80b48d]/10 p-6 rounded-xl border border-[#376847]/20 flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-base font-semibold text-[#124628] font-['Playfair_Display']">
            Target Bonus
          </h3>
          <p className="text-sm text-[#1e5031]">
            Deliver {target - current} more to unlock ₹500 bonus.
          </p>
        </div>
        <span className="text-lg font-semibold text-[#376847]">
          {current} / {target}
        </span>
      </div>

      <div className="w-full h-3 bg-[#e7e2d9] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#376847] transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(55,104,71,0.3)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-[#1e5031] flex justify-between">
        <span>Daily Target: {target}</span>
        <span>Earn: ₹500.00</span>
      </p>
    </section>
  );
}

function RecentActivitySection() {
  return (
    <section className="bg-white p-6 rounded-xl shadow-[0_2px_12px_rgba(194,163,131,0.18)] border border-[#d2c4b9]/30">
      <h3 className="text-base font-semibold text-[#1d1b16] mb-6 font-['Playfair_Display']">
        Recent Activity
      </h3>

      <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#d2c4b9]/30">
        {ACTIVITY_ITEMS.map((item, i) => (
          <div key={i} className="flex gap-4 relative">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 border-white flex-shrink-0 ${
                item.iconColor === "green"
                  ? "bg-[#376847]/10"
                  : "bg-[#735a3e]/10"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-sm ${
                  item.iconColor === "green"
                    ? "text-[#376847]"
                    : "text-[#735a3e]"
                }`}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1d1b16]">
                {item.title}
              </p>
              <p className="text-sm text-[#4e453d]">{item.description}</p>
              <span className="text-xs text-[#4e453d] opacity-60">
                {item.time}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${
                item.amountColor === "green"
                  ? "text-[#376847]"
                  : "text-[#735a3e]"
              }`}
            >
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function QuickKartDashboard() {
  const [online, setOnline] = useState(true);

  return (
    <>
      {/* Google Fonts + Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 1.25rem;
        }
        body {
          background-color: #fff9ef;
          background-image: radial-gradient(#e7d7c1 0.5px, transparent 0.5px);
          background-size: 24px 24px;
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      <div className="min-h-screen text-[#1d1b16] font-['DM_Sans']">
        <Sidebar online={online} />
        <Header online={online} onToggle={() => setOnline((v) => !v)} />

        <main className="ml-64 flex flex-col min-h-screen pt-16">
          <div className="p-10 space-y-6 max-w-[1200px] mx-auto w-full">
            {/* Quick overview cards */}
            <OverviewCards />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column */}
              <div className="lg:col-span-7 space-y-6">
                <ActiveOrderSection />
                <NewRequestsSection />
              </div>

              {/* Right column */}
              <div className="lg:col-span-5 space-y-6">
                <TargetBonusSection />
                <RecentActivitySection />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}