import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Trophy,
  Medal,
  Star,
  Award,
  Crown,
  Lock,
  CheckCircle2,
  Truck,
  Calendar,
} from "lucide-react";
import { useDriverRewardsStore } from "../state/driverRewardsState";
import { useDriverRewardsActions } from "../hooks/useDriverRewards";
import type { DriverTierKey, TierLadderEntry } from "../types/driverRewards";

// ── Motion helpers (matches driverDashboard.tsx / driverEarningsPage.tsx) ──────
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};

// ── Tier presentation ────────────────────────────────────────────────────────────
const TIER_META: Record<
  DriverTierKey,
  { icon: React.ComponentType<{ className?: string }>; gradient: string; textColor: string; ringColor: string }
> = {
  BRONZE: {
    icon: Medal,
    gradient: "from-[#A9714A] to-[#7A4E30]",
    textColor: "text-[#A9714A]",
    ringColor: "ring-[#A9714A]/30",
  },
  SILVER: {
    icon: Award,
    gradient: "from-slate-400 to-slate-600",
    textColor: "text-slate-500",
    ringColor: "ring-slate-400/30",
  },
  GOLD: {
    icon: Trophy,
    gradient: "from-[#C9A97A] to-[#A9822E]",
    textColor: "text-[#A9822E]",
    ringColor: "ring-[#C9A97A]/40",
  },
  PLATINUM: {
    icon: Crown,
    gradient: "from-indigo-400 to-indigo-700",
    textColor: "text-indigo-500",
    ringColor: "ring-indigo-400/30",
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

// ── Hero tier card ────────────────────────────────────────────────────────────
function TierHeroCard() {
  const summary = useDriverRewardsStore((s) => s.summary);
  if (!summary) return null;

  const meta = TIER_META[summary.currentLevel];

  return (
    <motion.div
      variants={card}
      className="relative overflow-hidden rounded-3xl border border-[#E8DCCF] bg-white p-6"
    >
      <div className={`absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br ${meta.gradient} opacity-10`} />

      <div className="relative flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-sm`}>
              <meta.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8A7C72]">Current Tier</p>
              <h2 className={`text-2xl font-bold ${meta.textColor}`}>{summary.currentLevelLabel} Partner</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {summary.currentPerks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-[#F0E8DF] px-3 py-1 text-xs font-medium text-[#6F4E37]"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-shrink-0 gap-4 text-right">
          <div>
            <div className="flex items-center justify-end gap-1 text-[#8A7C72]">
              <Truck className="h-3 w-3" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Deliveries</p>
            </div>
            <p className="mt-0.5 text-xl font-bold text-[#2B1B0E]">{summary.totalDeliveries}</p>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1 text-[#8A7C72]">
              <Star className="h-3 w-3" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Rating</p>
            </div>
            <p className="mt-0.5 text-xl font-bold text-[#2B1B0E]">
              {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1 text-[#8A7C72]">
              <Calendar className="h-3 w-3" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Since</p>
            </div>
            <p className="mt-0.5 text-xl font-bold text-[#2B1B0E]">{formatDate(summary.memberSince)}</p>
          </div>
        </div>
      </div>

      {/* Progress to next tier */}
      <div className="relative mt-6">
        {summary.nextLevel ? (
          <>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#4A3E33]">
                {summary.nextLevel.deliveriesRemaining} more deliveries to reach {summary.nextLevel.label}
              </span>
              <span className="font-bold text-[#8A7C72]">{summary.progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F0E8DF]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600">
            <Crown className="h-4 w-4" />
            You've reached the highest tier — Platinum Partner!
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Tier ladder ───────────────────────────────────────────────────────────────
function TierLadderCard({ tier }: { tier: TierLadderEntry }) {
  const meta = TIER_META[tier.key];
  const locked = !tier.achieved;

  return (
    <motion.div
      variants={card}
      className={[
        "relative rounded-2xl border bg-white p-5 transition-all",
        tier.isCurrent
          ? `border-transparent ring-2 ${meta.ringColor} shadow-md`
          : "border-[#E8DCCF]",
        locked ? "opacity-60" : "",
      ].join(" ")}
    >
      {tier.isCurrent && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-[#2F1B12] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Current
        </span>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient}`}>
          <meta.icon className="h-5 w-5 text-white" />
        </div>
        {tier.achieved ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Lock className="h-4 w-4 text-[#B3A593]" />
        )}
      </div>

      <p className={`text-base font-bold ${meta.textColor}`}>{tier.label}</p>
      <p className="mb-3 text-xs text-[#8A7C72]">{tier.minDeliveries}+ deliveries</p>

      <ul className="space-y-1.5">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-1.5 text-xs text-[#4A3E33]">
            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#C9A97A]" />
            {perk}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ── Milestone badges ─────────────────────────────────────────────────────────────
function MilestonesCard() {
  const summary = useDriverRewardsStore((s) => s.summary);
  if (!summary) return null;

  return (
    <motion.div variants={card} className="rounded-2xl border border-[#E8DCCF] bg-white p-6">
      <p className="mb-1 text-base font-bold text-[#2B1B0E]">Delivery Milestones</p>
      <p className="mb-5 text-xs text-[#8A7C72]">Badges you unlock as you complete more deliveries</p>

      <div className="grid grid-cols-6 gap-3">
        {summary.milestones.map((m) => (
          <div key={m.deliveries} className="flex flex-col items-center gap-2 text-center">
            <div
              className={[
                "flex h-14 w-14 items-center justify-center rounded-full border-2",
                m.achieved
                  ? "border-[#C9A97A] bg-gradient-to-br from-[#C9A97A] to-[#A9822E]"
                  : "border-dashed border-[#E8DCCF] bg-[#FDF8F1]",
              ].join(" ")}
            >
              {m.achieved ? (
                <Trophy className="h-6 w-6 text-white" />
              ) : (
                <Lock className="h-5 w-5 text-[#C9BCAC]" />
              )}
            </div>
            <p className={`text-xs font-bold ${m.achieved ? "text-[#2B1B0E]" : "text-[#B3A593]"}`}>
              {m.deliveries}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DriverRewardsPage() {
  const summary = useDriverRewardsStore((s) => s.summary);
  const isLoading = useDriverRewardsStore((s) => s.isLoading);
  const { fetchRewardsSummary } = useDriverRewardsActions();

  useEffect(() => {
    void fetchRewardsSummary();
  }, [fetchRewardsSummary]);

  if (isLoading && !summary) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="h-48 animate-pulse rounded-3xl bg-[#F0E8DF]" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-[#F0E8DF]" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-4"
    >
      <TierHeroCard />

      <div>
        <p className="mb-3 text-base font-bold text-[#2B1B0E]">Tier Ladder</p>
        <div className="grid grid-cols-4 gap-4">
          {summary.ladder.map((tier) => (
            <TierLadderCard key={tier.key} tier={tier} />
          ))}
        </div>
      </div>

      <MilestonesCard />
    </motion.div>
  );
}
