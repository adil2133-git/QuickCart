import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  IndianRupee, PackageCheck, Star, Wallet,
  MapPin, Navigation,
  ChevronRight, Store, Phone,
} from "lucide-react";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDashboardStore } from "../state/driverDashboarState";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { toast } from "sonner";

// Framer Motion stagger helpers
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};

// ── Hero status card ──────────────────────────────────────────────────────────
function HeroCard() {
  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const { toggleAvailability, fetchAvailability } = useDriverDeliveryActions();
  const [shiftStart, setShiftStart] = useState<Date | null>(null);

  useEffect(() => {
    void fetchAvailability(); // hydrate real isOnline from the DB on mount/refresh
  }, [fetchAvailability]);

  const shiftLabel = shiftStart
    ? shiftStart.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleToggle = async () => {
    const nextOnline = !isOnline;
    if (nextOnline) {
      setShiftStart(new Date());
    } else {
      setShiftStart(null);
    }

    try {
      await toggleAvailability(nextOnline);
    } catch {
      toast.error("Could not update availability. Try again.");
    }
  };

  return (
    <motion.div
      variants={card}
      className={[
        "relative overflow-hidden rounded-3xl p-6 transition-all duration-500",
        isOnline
          ? "bg-gradient-to-br from-[#DDF8EF] to-[#F6FFF8] border border-emerald-200"
          : "bg-white border border-[#E8DCCF]",
      ].join(" ")}
    >
      {/* Decorative circle */}
      <div className={`absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-20 transition-colors ${
        isOnline ? "bg-emerald-400" : "bg-[#E8DCCF]"
      }`} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <motion.span
              animate={isOnline ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-[#8A7C72]"}`}
            />
            <span className={`text-xs font-bold uppercase tracking-widest ${
              isOnline ? "text-emerald-700" : "text-[#8A7C72]"
            }`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <h2 className={`text-xl font-bold ${isOnline ? "text-emerald-900" : "text-[#2B2B2B]"}`}>
            {isOnline ? "Receiving requests" : "You're offline"}
          </h2>
          {isOnline && shiftLabel && (
            <p className="mt-0.5 text-xs text-emerald-600">
              Shift started at {shiftLabel}
            </p>
          )}
          {!isOnline && (
            <p className="mt-0.5 text-xs text-[#8A7C72]">
              Go online to start receiving delivery requests
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleToggle}
          className={[
            "mt-1 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
            isOnline
              ? "bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-sm"
              : "bg-[#2F1B12] text-white hover:bg-[#3D2A18] shadow-md",
          ].join(" ")}
        >
          {isOnline ? "Go Offline" : "Go Online"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
function KpiCards() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);
  const statsLoading = useDriverDeliveryStore((s) => s.statsLoading);
  const { fetchTodayStats } = useDriverDeliveryActions();

  useEffect(() => { void fetchTodayStats(); }, [fetchTodayStats]);

  const kpis = [
    {
      icon: IndianRupee,
      label: "Earnings",
      value: `₹${(stats?.todayEarnings ?? 0).toFixed(0)}`,
      sub: stats?.earningsChangePercent != null
        ? `${stats.earningsChangePercent > 0 ? "+" : ""}${stats.earningsChangePercent}% vs yesterday`
        : "Today",
      subColor: (stats?.earningsChangePercent ?? 0) >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      icon: PackageCheck,
      label: "Deliveries",
      value: String(stats?.completedCount ?? 0),
      sub: "Today",
      subColor: "text-[#8A7C72]",
    },
    {
      icon: Star,
      label: "Rating",
      value: "—",
      sub: "Coming soon",
      subColor: "text-[#8A7C72]",
    },
    {
      icon: Wallet,
      label: "Wallet",
      value: "₹0",
      sub: "Available balance",
      subColor: "text-[#8A7C72]",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          variants={card}
          custom={i}
          className="rounded-2xl border border-[#E8DCCF] bg-white p-4"
        >
          {statsLoading && !stats ? (
            <div className="animate-pulse space-y-2">
              <div className="h-7 w-7 rounded-lg bg-[#E8DCCF]" />
              <div className="h-4 w-16 rounded bg-[#E8DCCF]" />
              <div className="h-7 w-12 rounded bg-[#E8DCCF]" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0E8DF]">
                <kpi.icon className="h-3.5 w-3.5 text-[#6F4E37]" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8A7C72]">
                {kpi.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#2B2B2B] leading-none">{kpi.value}</p>
              <p className={`mt-1 text-[11px] font-medium ${kpi.subColor}`}>{kpi.sub}</p>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Active delivery ───────────────────────────────────────────────────────────
function ActiveDeliveryCard() {
  const navigate = useNavigate();
  const delivery = useDriverDeliveryStore((s) => s.activeDelivery);
  const activeLoading = useDriverDeliveryStore((s) => s.activeLoading);
  const { fetchActiveDelivery } = useDriverDeliveryActions();

  useEffect(() => { void fetchActiveDelivery(); }, [fetchActiveDelivery]);

  if (activeLoading && !delivery) {
    return (
      <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 rounded bg-[#E8DCCF]" />
          <div className="h-20 rounded-xl bg-[#E8DCCF]" />
        </div>
      </motion.div>
    );
  }

  if (!delivery) {
    return (
      <motion.div
        variants={card}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8DCCF] bg-white p-8 text-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0E8DF]"
        >
          <PackageCheck className="h-7 w-7 text-[#6F4E37]" />
        </motion.div>
        <p className="text-sm font-semibold text-[#2B2B2B]">No Active Delivery</p>
        <p className="mt-1 text-xs text-[#8A7C72]">New requests will appear when assigned to you</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white overflow-hidden">
      <div className="border-b border-[#E8DCCF] bg-[#FDF8F1] px-5 py-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6F4E37]">Active Delivery</p>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          In progress
        </span>
      </div>

      <div className="p-5">
        <p className="mb-4 text-xs font-semibold text-[#8A7C72]">Order #{delivery.orderNumber}</p>

        {/* Route */}
        <div className="mb-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#6F4E37]">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#8A7C72]">Pickup</p>
              <p className="text-sm font-semibold text-[#2B2B2B]">{delivery.store.name}</p>
              <p className="text-xs text-[#8A7C72]">{delivery.store.address}</p>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2 text-[#E8DCCF]">
            <div className="h-px flex-1 border-b border-dashed border-[#E8DCCF]" />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#8A7C72]">Drop</p>
              <p className="text-sm font-semibold text-[#2B2B2B]">{delivery.customer.name}</p>
              <p className="text-xs text-[#8A7C72]">{delivery.customer.address}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {delivery.customer.phone && (
            <a
              href={`tel:${delivery.customer.phone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E8DCCF] py-2.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#F0E8DF] transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call Customer
            </a>
          )}
          <button
            onClick={() => navigate("/driver/deliveries")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2F1B12] py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Navigation className="h-3.5 w-3.5" />
            Open Map
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Bonus progress ────────────────────────────────────────────────────────────
function BonusCard() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);
  if (!stats) return null;

  const pct = Math.min(100, (stats.currentCount / stats.dailyTarget) * 100);
  const remaining = Math.max(0, stats.dailyTarget - stats.currentCount);

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6F4E37]">Daily Bonus</p>
          <p className="mt-0.5 text-sm font-semibold text-[#2B2B2B]">
            {remaining > 0
              ? `${remaining} more to unlock ₹${stats.targetBonus}`
              : "🎉 Bonus unlocked!"}
          </p>
        </div>
        <span className="text-xs font-bold text-[#8A7C72]">
          {stats.currentCount} / {stats.dailyTarget}
        </span>
      </div>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#F0E8DF]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
        />
      </div>

      <div className="flex justify-between text-[10px] text-[#8A7C72]">
        <span>Target: {stats.dailyTarget} deliveries</span>
        <span className="font-semibold text-emerald-600">Earn ₹{stats.targetBonus}</span>
      </div>
    </motion.div>
  );
}

// ── Location + mini sparkline ─────────────────────────────────────────────────
function LocationAndChart() {
  const locationStatus = useDriverDashboardStore((s) => s.locationStatus);
  const currentArea = useDriverDashboardStore((s) => s.currentArea);

  // Placeholder weekly data — replace with real API when available
  const weekData = [
    { day: "Mon", v: 0 }, { day: "Tue", v: 0 }, { day: "Wed", v: 0 },
    { day: "Thu", v: 0 }, { day: "Fri", v: 0 }, { day: "Sat", v: 0 },
    { day: "Sun", v: 0 },
  ];

  const statusDot: Record<string, string> = {
    active: "bg-emerald-500",
    acquiring: "bg-amber-400 animate-pulse",
    denied: "bg-red-500",
    unavailable: "bg-slate-400",
    idle: "bg-slate-300",
  };

  const statusLabel: Record<string, string> = {
    active: `GPS Active${currentArea ? ` · ${currentArea}` : ""}`,
    acquiring: "Acquiring GPS…",
    denied: "Location denied — enable in browser settings",
    unavailable: "GPS unavailable",
    idle: "Go online to share location",
  };

  return (
    <div className="space-y-3">
      {/* Location */}
      <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0E8DF]">
          <Navigation className="h-4 w-4 text-[#6F4E37]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8A7C72]">Location</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[locationStatus]}`} />
            <p className="text-xs font-medium text-[#2B2B2B] truncate">{statusLabel[locationStatus]}</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly sparkline */}
      <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#8A7C72]">Weekly Earnings</p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6F4E37" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6F4E37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #E8DCCF" }}
                formatter={(v: unknown) => [`₹${v}`, "Earnings"]}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#6F4E37"
                strokeWidth={2}
                fill="url(#earningsGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[#8A7C72]">
          {weekData.map((d) => <span key={d.day}>{d.day}</span>)}
        </div>
      </motion.div>
    </div>
  );
}

// ── Quick nav ─────────────────────────────────────────────────────────────────
function QuickNav() {
  const navigate = useNavigate();
  const requests = useDriverDeliveryStore((s) => s.requests);

  return (
    <motion.div variants={card}>
      <button
        onClick={() => navigate("/driver/deliveries")}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#E8DCCF] bg-white p-4 text-left hover:bg-[#FDF8F1] transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0E8DF]">
          <PackageCheck className="h-4 w-4 text-[#6F4E37]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#2B2B2B]">View Deliveries</p>
          <p className="text-xs text-[#8A7C72]">
            {requests.length > 0 ? `${requests.length} request${requests.length > 1 ? "s" : ""} waiting` : "Manage your orders"}
          </p>
        </div>
        {requests.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {requests.length}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-[#C9A97A]" />
      </button>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverDashboard() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <HeroCard />
      <KpiCards />

      {/* 2-column grid */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <ActiveDeliveryCard />
          <QuickNav />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <BonusCard />
          <LocationAndChart />
        </div>
      </div>
    </motion.div>
  );
}