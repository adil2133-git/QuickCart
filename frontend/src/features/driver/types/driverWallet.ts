// ─── Wallet Balance tab ────────────────────────────────────────────────────────

export type WalletTransactionType = "EARNING" | "BONUS" | "WITHDRAWAL" | "ADJUSTMENT";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number; // always positive — `type` gives direction
  description: string;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
}

export interface DriverWalletSummary {
  availableBalance: number;
  earnedThisMonth: number;
  nextPayoutDate: string; // ISO string
  transactions: WalletTransaction[];
}

export interface GetWalletSummaryResponse {
  success: boolean;
  wallet: DriverWalletSummary;
}

export interface WithdrawFundsResponse {
  success: boolean;
  message: string;
  availableBalance: number;
  transaction: WalletTransaction;
}

// ─── COD Settlement tab ────────────────────────────────────────────────────────

export type CodSettlementStatus = "PENDING" | "SETTLED";

export interface CodOrderEntry {
  orderId: string;
  orderNumber: string;
  amountCollected: number;
  status: CodSettlementStatus;
  settledAt: string | null;
  date: string; // ISO string
}

export interface DriverCodSummary {
  totalCashCollected: number;   // lifetime
  pendingSettlement: number;    // currently owed
  settlementDueAmount: number;
  orders: CodOrderEntry[];
  total: number;
  page: number;
  pages: number;
}

export interface GetCodSummaryResponse {
  success: boolean;
  cod: DriverCodSummary;
}

export interface SettleCodResponse {
  success: boolean;
  message: string;
  settledAmount: number;
  pendingSettlement: number;
}