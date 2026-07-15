import { useCallback } from "react";
import api from "../../../api/axios";
import { useDriverWalletStore } from "../state/driverWalletState";
import type {
  GetWalletSummaryResponse,
  WithdrawFundsResponse,
  GetCodSummaryResponse,
  SettleCodResponse,
} from "../types/driverWallet";

const getErrorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export function useDriverWalletActions() {
  // Same reasoning as useDriverDeliveryActions: read via getState() (no
  // subscription) so these callbacks keep a stable identity across renders.
  const store = useDriverWalletStore.getState;

  // ── Wallet Balance ───────────────────────────────────────────────────────────
  const fetchWalletSummary = useCallback(async () => {
    store().setLoading(true);
    store().setError(null);
    try {
      const { data } = await api.get<GetWalletSummaryResponse>("/driver/wallet");
      store().setSummary(data.wallet);
    } catch {
      store().setError("Failed to load wallet.");
    } finally {
      store().setLoading(false);
    }
  }, [store]);

  const withdrawFunds = useCallback(async (amount?: number) => {
    store().setWithdrawing(true);
    try {
      const { data } = await api.post<WithdrawFundsResponse>(
        "/driver/wallet/withdraw",
        amount ? { amount } : {}
      );
      store().prependTransaction(data.transaction);
      store().liveUpdateBalance(data.availableBalance);
      return data.availableBalance;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Withdrawal failed. Please try again."));
    } finally {
      store().setWithdrawing(false);
    }
  }, [store]);

  // ── COD Settlement ───────────────────────────────────────────────────────────
  const fetchCodSummary = useCallback(async (page = 1) => {
    store().setCodLoading(true);
    store().setCodError(null);
    try {
      const { data } = await api.get<GetCodSummaryResponse>(
        `/driver/wallet/cod?page=${page}&limit=6`
      );
      store().setCod(data.cod);
    } catch {
      store().setCodError("Failed to load COD settlement data.");
    } finally {
      store().setCodLoading(false);
    }
  }, [store]);

  const settleCod = useCallback(async () => {
    store().setSettling(true);
    try {
      const { data } = await api.post<SettleCodResponse>("/driver/wallet/cod/settle");
      await fetchCodSummary(1);
      return data.settledAmount;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Settlement failed. Please try again."));
    } finally {
      store().setSettling(false);
    }
  }, [store, fetchCodSummary]);

  return { fetchWalletSummary, withdrawFunds, fetchCodSummary, settleCod };
}