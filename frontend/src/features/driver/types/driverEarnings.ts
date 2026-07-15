// ─── Earnings summary (Earnings page) ─────────────────────────────────────────

export interface WeeklyChallenge {
  target: number;   // deliveries needed to unlock the bonus
  current: number;  // deliveries completed this week
  bonus: number;     // bonus amount (₹) on hitting target
}

export interface DailyEarningPoint {
  label: string; // e.g. "Mon"
  total: number;
}

export interface DriverEarningsSummary {
  today: number;
  todayChangePercent: number; // vs yesterday
  thisWeek: number;
  weekChangePercent: number;  // vs last week
  thisMonth: number;
  monthChangePercent: number; // vs last month
  total: number;               // all-time
  totalDeliveries: number;     // all-time delivery count
  monthDeliveries: number;     // deliveries completed this month
  monthlyGoalAmount: number;   // target for this month's progress bar
  walletBalance: number;
  cashPendingSettlement: number;
  weeklyChallenge: WeeklyChallenge;
  last7Days: DailyEarningPoint[];
}

export interface GetEarningsSummaryResponse {
  success: boolean;
  earnings: DriverEarningsSummary;
}
