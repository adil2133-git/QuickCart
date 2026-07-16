export type DriverTierKey = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface TierLadderEntry {
  key: DriverTierKey;
  label: string;
  minDeliveries: number;
  perks: string[];
  achieved: boolean;
  isCurrent: boolean;
}

export interface RewardMilestone {
  deliveries: number;
  achieved: boolean;
}

export interface NextTierInfo {
  key: DriverTierKey;
  label: string;
  deliveriesRemaining: number;
}

export interface DriverRewardsSummary {
  currentLevel: DriverTierKey;
  currentLevelLabel: string;
  currentPerks: string[];
  totalDeliveries: number;
  averageRating: number;
  memberSince: string; // ISO string
  nextLevel: NextTierInfo | null; // null once at the highest tier
  progressPercent: number; // 0-100, progress toward nextLevel
  ladder: TierLadderEntry[];
  milestones: RewardMilestone[];
}

export interface GetRewardsSummaryResponse {
  success: boolean;
  rewards: DriverRewardsSummary;
}