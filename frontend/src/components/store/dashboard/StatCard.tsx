import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  /** Top-right pill, e.g. "+12% vs yesterday" or "High Priority" */
  badge?: {
    text: string;
    tone?: "neutral" | "muted" | "danger";
  };
}

const BADGE_TONE_CLASSES: Record<NonNullable<StatCardProps["badge"]>["tone"] & string, string> = {
  neutral: "text-[#7A6A5A]",
  muted: "text-[#B9AB9B]",
  danger: "bg-red-100 text-red-600",
};

export default function StatCard({ icon, label, value, badge }: StatCardProps) {
  const tone = badge?.tone ?? "neutral";
  const isPill = tone === "danger";

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-[#EFE6DA] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6EDE3] text-[#8A6A4D]">
          {icon}
        </div>
        {badge && (
          <span
            className={[
              "text-sm font-medium",
              isPill ? "rounded-full px-2.5 py-1 text-xs font-semibold" : "",
              BADGE_TONE_CLASSES[tone],
            ].join(" ")}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-sm text-[#8A7B6C]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#2B1B0E]">{value}</p>
    </div>
  );
}
