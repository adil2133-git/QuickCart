import { create } from "zustand";
import type { DriverWalletSummary, DriverCodSummary, WalletTransaction } from "../types/driverWallet";

export type WalletTab = "BALANCE" | "COD_SETTLEMENT";

interface DriverWalletState {
  // ── Tab ──────────────────────────────────────────────────────────────────────
  activeTab: WalletTab;
  setActiveTab: (tab: WalletTab) => void;

  // ── Wallet Balance ───────────────────────────────────────────────────────────
  summary: DriverWalletSummary | null;
  isLoading: boolean;
  error: string | null;
  isWithdrawing: boolean;
  setSummary: (summary: DriverWalletSummary) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  setWithdrawing: (value: boolean) => void;
  prependTransaction: (txn: WalletTransaction) => void;
  liveUpdateBalance: (balance: number) => void;

  // ── COD Settlement ───────────────────────────────────────────────────────────
  cod: DriverCodSummary | null;
  codLoading: boolean;
  codError: string | null;
  isSettling: boolean;
  setCod: (cod: DriverCodSummary) => void;
  setCodLoading: (value: boolean) => void;
  setCodError: (message: string | null) => void;
  setSettling: (value: boolean) => void;
}

export const useDriverWalletStore = create<DriverWalletState>((set) => ({
  // ── Tab ──────────────────────────────────────────────────────────────────────
  activeTab: "BALANCE",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Wallet Balance ───────────────────────────────────────────────────────────
  summary: null,
  isLoading: false,
  error: null,
  isWithdrawing: false,
  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setWithdrawing: (isWithdrawing) => set({ isWithdrawing }),
  prependTransaction: (txn) =>
    set((s) => ({
      summary: s.summary
        ? { ...s.summary, transactions: [txn, ...s.summary.transactions].slice(0, 10) }
        : s.summary,
    })),
  liveUpdateBalance: (balance) =>
    set((s) => ({
      summary: s.summary ? { ...s.summary, availableBalance: balance } : s.summary,
    })),

  // ── COD Settlement ───────────────────────────────────────────────────────────
  cod: null,
  codLoading: false,
  codError: null,
  isSettling: false,
  setCod: (cod) => set({ cod }),
  setCodLoading: (codLoading) => set({ codLoading }),
  setCodError: (codError) => set({ codError }),
  setSettling: (isSettling) => set({ isSettling }),
}));