import { useState } from "react";
import {
  AlertCircle,
  Clock,
  TimerReset,
  ArrowRight,
  Store,
  Bike,
  Check,
  X,
  UserPlus2,
  Banknote,
  Download,
} from "lucide-react";

/**
 * QuickOps Admin — Action Rail (right column)
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Sticky right rail: Needs Attention feed, Approval Queue (tabbed),
 * and Quick Actions grid. This is the "what needs a decision now"
 * zone, separate from the monitoring feed on the left.
 */

type Severity = "critical" | "warning";

interface AttentionItem {
  id: string;
  severity: Severity;
  icon: typeof AlertCircle;
  title: string;
  description: string;
  actionLabel: string;
}

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "complaints",
    severity: "critical",
    icon: AlertCircle,
    title: "5 Unresolved Complaints",
    description: "High priority tickets pending for > 2 hours.",
    actionLabel: "Review Tickets",
  },
  {
    id: "cod",
    severity: "warning",
    icon: Clock,
    title: "14 COD Overdue",
    description: "Remittance pending from fleet zone 4.",
    actionLabel: "Reconcile Now",
  },
  {
    id: "sla",
    severity: "warning",
    icon: TimerReset,
    title: "12 Deliveries past SLA",
    description: "Traffic surge in South Delhi affecting TAT.",
    actionLabel: "Notify Fleet",
  },
];

const SEVERITY_STYLES: Record<Severity, { border: string; iconBg: string; iconColor: string }> = {
  critical: { border: "border-l-[#D94F4F]", iconBg: "bg-[#FBEAEA]", iconColor: "text-[#D94F4F]" },
  warning: { border: "border-l-[#D9A441]", iconBg: "bg-[#FBF1DD]", iconColor: "text-[#B8860B]" },
};

interface ApplicationCard {
  id: string;
  name: string;
  category: string;
  submittedDate: string;
}

const STORE_APPLICATIONS: ApplicationCard[] = [
  { id: "s1", name: "Organic Gourmet", category: "Gourmet Food", submittedDate: "Jan 22, 2024" },
  { id: "s2", name: "Blue Tokai", category: "Beverages", submittedDate: "Jan 21, 2024" },
  { id: "s3", name: "Daily Greens", category: "Fresh Produce", submittedDate: "Jan 20, 2024" },
];

const DRIVER_APPLICATIONS: ApplicationCard[] = [
  { id: "d1", name: "Ravi Kumar", category: "2-Wheeler", submittedDate: "Jan 22, 2024" },
  { id: "d2", name: "Suresh Patil", category: "2-Wheeler", submittedDate: "Jan 21, 2024" },
];

function NeedsAttentionFeed() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#2A1F18]">Needs Attention</h2>
        <span className="rounded-full bg-[#D94F4F] px-2.5 py-1 text-[10.5px] font-bold text-white">
          3 NEW
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {ATTENTION_ITEMS.map((item) => {
          const Icon = item.icon;
          const styles = SEVERITY_STYLES[item.severity];
          return (
            <div
              key={item.id}
              className={`rounded-xl border border-[#EBE1D2] border-l-4 bg-white p-4 ${styles.border}`}
            >
              <div className="flex gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}
                >
                  <Icon size={14} />
                </span>
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-[#2A1F18]">{item.title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#8C7C6B]">
                    {item.description}
                  </p>
                  <button className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-[#8B6F47] hover:underline">
                    {item.actionLabel}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalQueue() {
  const [tab, setTab] = useState<"stores" | "drivers">("stores");
  const applications = tab === "stores" ? STORE_APPLICATIONS : DRIVER_APPLICATIONS;

  return (
    <div>
      <div className="mb-3 flex rounded-xl bg-[#F0E6D6] p-1">
        <button
          onClick={() => setTab("stores")}
          className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition-colors ${
            tab === "stores"
              ? "bg-white text-[#2A1F18] shadow-sm"
              : "text-[#8C7C6B] hover:text-[#5A4A3A]"
          }`}
        >
          Stores ({STORE_APPLICATIONS.length})
        </button>
        <button
          onClick={() => setTab("drivers")}
          className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition-colors ${
            tab === "drivers"
              ? "bg-white text-[#2A1F18] shadow-sm"
              : "text-[#8C7C6B] hover:text-[#5A4A3A]"
          }`}
        >
          Drivers ({DRIVER_APPLICATIONS.length})
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {applications.slice(0, 3).map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-3 rounded-xl border border-[#EBE1D2] bg-white p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0E6D6] text-[#8B6F47]">
              {tab === "stores" ? <Store size={16} /> : <Bike size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#2A1F18]">{app.name}</p>
              <p className="truncate text-[11.5px] text-[#8C7C6B]">
                {app.category} · {app.submittedDate}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                aria-label="Approve"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E6F4EC] text-[#2E8B57] transition-colors hover:bg-[#D2EDDC]"
              >
                <Check size={13} />
              </button>
              <button
                aria-label="Reject"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBEAEA] text-[#D94F4F] transition-colors hover:bg-[#F5D8D8]"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12.5px] font-semibold text-[#8B6F47] hover:underline">
        View All Applications →
      </button>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Approve Stores", icon: Store },
    { label: "Approve Drivers", icon: UserPlus2 },
    { label: "Review COD", icon: Banknote },
    { label: "Export Reports", icon: Download },
  ];

  return (
    <div>
      <h2 className="mb-3 text-[15px] font-semibold text-[#2A1F18]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 rounded-xl bg-[#F0E6D6] px-3 py-4 text-center text-[12.5px] font-semibold text-[#5A4A3A] transition-colors hover:bg-[#E8D9C2]"
            >
              <Icon size={18} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ActionRail() {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col gap-7 rounded-2xl bg-[#F5EEE2] p-5">
      <NeedsAttentionFeed />
      <div className="h-px bg-[#EBDFC9]" />
      <ApprovalQueue />
      <div className="h-px bg-[#EBDFC9]" />
      <QuickActions />
    </aside>
  );
}