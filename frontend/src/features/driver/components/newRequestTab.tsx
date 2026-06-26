// src/features/driver/components/NewRequestsTab.tsx
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryRequest } from "../types/driverDelivery";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";

// ─── Stats Cards ─────────────────────────────────────────────────────────────

function StatsCards() {
  const stats = useDriverDeliveryStore((s) => s.todayStats);

  if (!stats) return null;

  const progress = Math.min((stats.currentCount / stats.dailyTarget) * 100, 100);
  const remaining = Math.max(stats.dailyTarget - stats.currentCount, 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      {/* Today's Earnings */}
      <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-[#A38F7D]">
            Today's Earnings
          </p>
          {stats.earningsChangePercent !== 0 && (
            <span className="text-xs font-semibold text-emerald-600">
              +{stats.earningsChangePercent}% vs yesterday
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-[#2B1B0E]">
          ₹{stats.todayEarnings.toFixed(2)}
        </p>
      </div>

      {/* Completed */}
      <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#A38F7D]">
          Completed
        </p>
        <p className="text-3xl font-bold text-[#2B1B0E]">
          {stats.completedCount}{" "}
          <span className="text-base font-normal text-[#A38F7D]">Deliveries</span>
        </p>
      </div>

      {/* Daily Target Bonus */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-800">Daily Target Bonus</p>
          <span className="text-xs font-bold text-emerald-800">
            {stats.currentCount} / {stats.dailyTarget}
          </span>
        </div>
        {remaining > 0 ? (
          <p className="mb-3 text-sm text-emerald-700">
            Deliver {remaining} more to unlock ₹{stats.targetBonus} bonus.
          </p>
        ) : (
          <p className="mb-3 text-sm font-semibold text-emerald-700">
            🎉 Target reached! Bonus earned.
          </p>
        )}
        <div className="h-2 overflow-hidden rounded-full bg-emerald-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-emerald-700">
          <span>Daily Target: {stats.dailyTarget}</span>
          <span>Earn: ₹{stats.targetBonus}.00</span>
        </div>
      </div>
    </div>
  );
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({
  totalSeconds,
  onExpire,
}: {
  totalSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const called = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!called.current) { called.current = true; onExpire(); }
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const frac = remaining / totalSeconds;
  const dash = circ * frac;
  const color = remaining > 15 ? "#2B7A3E" : remaining > 5 ? "#D97706" : "#DC2626";

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#EADFD3" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="relative text-xs font-bold" style={{ color }}>
        {remaining}s
      </span>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request }: { request: DeliveryRequest }) {
  const { acceptRequest, declineRequest } = useDriverDeliveryActions();
  const removeRequest = useDriverDeliveryStore((s) => s.removeRequest);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptRequest(request.requestId);
      toast.success("Delivery accepted!");
    } catch {
      toast.error("Failed to accept. Try again.");
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await declineRequest(request.requestId);
    } catch {
      toast.error("Failed to decline.");
      setDeclining(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#EADFD3] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="mb-0.5 text-xs text-[#A38F7D]">#{request.orderNumber}</p>
          <h3 className="text-base font-bold text-[#2B1B0E]">{request.storeName}</h3>
        </div>
        <CountdownRing
          totalSeconds={request.expiresInSeconds}
          onExpire={() => removeRequest(request.requestId)}
        />
      </div>

      {/* Distance info */}
      <div className="mb-4 space-y-1.5 border-b border-[#F0E8DF] pb-4">
        <div className="flex items-center gap-2 text-sm text-[#5C4A38]">
          <MapPin className="h-4 w-4 text-[#A38F7D]" />
          <span>Pickup: {request.pickupDistanceKm} km away</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5C4A38]">
          <Navigation className="h-4 w-4 text-[#A38F7D]" />
          <span>Delivery: {request.deliveryDistanceKm} km distance</span>
        </div>
      </div>

      {/* Earnings */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[#7A6350]">Est. Earnings</span>
        <span className="flex items-center text-base font-bold text-[#2B7A3E]">
          <IndianRupee className="h-3.5 w-3.5" />
          {request.estimatedEarnings.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting || declining}
          className="flex-1 rounded-xl bg-[#2B1B0E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D2A18] disabled:opacity-60"
        >
          {accepting ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={accepting || declining}
          className="flex-1 rounded-xl border border-[#EADFD3] py-2.5 text-sm font-semibold text-[#5C4A38] transition-colors hover:bg-[#F5EDE5] disabled:opacity-60"
        >
          {declining ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface NewRequestsTabProps {
  requests: DeliveryRequest[];
  loading: boolean;
  error: string | null;
}

export default function NewRequestsTab({ requests, loading, error }: NewRequestsTabProps) {
  return (
    <div>
      <StatsCards />

      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#7A6350]">
        Available Requests
      </h3>

      {loading && (
        <div className="flex h-40 items-center justify-center text-[#A38F7D]">
          Loading requests…
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#EADFD3] text-center">
          <p className="font-medium text-[#7A6350]">No requests right now</p>
          <p className="text-sm text-[#A38F7D]">Stay online to receive new delivery requests.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requests.map((r) => (
          <RequestCard key={r.requestId} request={r} />
        ))}
      </div>
    </div>
  );
}