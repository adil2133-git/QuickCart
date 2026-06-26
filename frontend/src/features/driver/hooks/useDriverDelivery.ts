import { useCallback } from "react";
import api from "../../../api/axios";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import type {
  DeliveryRequest,
  ActiveDelivery,
  CompletedDelivery,
  DriverTodayStats,
  DeliveryStage,
} from "../types/driverDelivery";

// ─── Helpers to build the progress steps from an order status ────────────────

export const STAGE_ORDER: DeliveryStage[] = [
  "NAVIGATE_TO_STORE",
  "REACHED_STORE",
  "PICKED_UP",
  "NAVIGATE_TO_CUSTOMER",
  "REACHED_CUSTOMER",
  "DELIVERED",
];

export const STAGE_LABELS: Record<DeliveryStage, string> = {
  NAVIGATE_TO_STORE: "Order Assigned",
  REACHED_STORE:     "Reached Store",
  PICKED_UP:         "Pickup Confirmed",
  NAVIGATE_TO_CUSTOMER: "Out For Delivery",
  REACHED_CUSTOMER:  "Reached Customer",
  DELIVERED:         "Delivered",
};

// ─── Map order-status → driver stage ─────────────────────────────────────────

export function orderStatusToStage(status: string): DeliveryStage {
  switch (status) {
    case "DRIVER_ASSIGNED": return "NAVIGATE_TO_STORE";
    case "PICKED_UP":       return "PICKED_UP";
    case "OUT_FOR_DELIVERY":return "NAVIGATE_TO_CUSTOMER";
    case "DELIVERED":       return "DELIVERED";
    default:                return "NAVIGATE_TO_STORE";
  }
}

// ─── Hook: fetch new delivery requests ───────────────────────────────────────

export function useDriverDeliveryActions() {
  const store = useDriverDeliveryStore();

  // ── Fetch new requests ──────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    store.setRequestsLoading(true);
    store.setRequestsError(null);
    try {
      const { data } = await api.get<{ success: boolean; requests: DeliveryRequest[] }>(
        "/driver/deliveries/requests"
      );
      store.setRequests(data.requests);
    } catch {
      store.setRequestsError("Failed to load delivery requests.");
    } finally {
      store.setRequestsLoading(false);
    }
  }, []);

  // ── Accept a request ────────────────────────────────────────────────────────
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const { data } = await api.post<{ success: boolean; activeDelivery: ActiveDelivery }>(
        `/driver/deliveries/requests/${requestId}/accept`
      );
      store.removeRequest(requestId);
      store.setActiveDelivery(data.activeDelivery);
      store.setActiveTab("ACTIVE_DELIVERY");
    } catch {
      // surface via toast in component
      throw new Error("Failed to accept delivery request.");
    }
  }, []);

  // ── Decline a request ───────────────────────────────────────────────────────
  const declineRequest = useCallback(async (requestId: string) => {
    try {
      await api.post(`/driver/deliveries/requests/${requestId}/decline`);
      store.removeRequest(requestId);
    } catch {
      throw new Error("Failed to decline delivery request.");
    }
  }, []);

  // ── Fetch active delivery ───────────────────────────────────────────────────
  const fetchActiveDelivery = useCallback(async () => {
    store.setActiveLoading(true);
    store.setActiveError(null);
    try {
      const { data } = await api.get<{ success: boolean; activeDelivery: ActiveDelivery | null }>(
        "/driver/deliveries/active"
      );
      store.setActiveDelivery(data.activeDelivery);
    } catch {
      store.setActiveError("Failed to load active delivery.");
    } finally {
      store.setActiveLoading(false);
    }
  }, []);

  // ── Advance delivery stage ──────────────────────────────────────────────────
  const advanceStage = useCallback(async (orderId: string, newStage: DeliveryStage) => {
    try {
      const { data } = await api.patch<{
        success: boolean;
        completedAt: string;
        currentStage: DeliveryStage;
      }>(`/driver/deliveries/${orderId}/stage`, { stage: newStage });

      store.advanceStage(data.currentStage, data.completedAt);

      // If delivered — move to completed tab after a brief moment
      if (newStage === "DELIVERED") {
        setTimeout(() => {
          store.clearActiveDelivery();
          store.setActiveTab("COMPLETED_HISTORY");
          fetchCompleted(1);
        }, 2000);
      }
    } catch {
      throw new Error("Failed to update delivery stage.");
    }
  }, []);

  // ── Confirm cash collected ──────────────────────────────────────────────────
  const confirmCashCollected = useCallback(async (orderId: string) => {
    try {
      await api.post(`/driver/deliveries/${orderId}/cash-collected`);
      store.markCashCollected();
    } catch {
      throw new Error("Failed to confirm cash collection.");
    }
  }, []);

  // ── Fetch completed history ─────────────────────────────────────────────────
  const fetchCompleted = useCallback(async (page = 1) => {
    store.setCompletedLoading(true);
    store.setCompletedError(null);
    try {
      const { data } = await api.get<{
        success: boolean;
        deliveries: CompletedDelivery[];
        total: number;
        page: number;
        pages: number;
      }>(`/driver/deliveries/completed?page=${page}&limit=10`);

      if (page === 1) {
        store.setCompleted(data);
      } else {
        store.appendCompleted(data.deliveries);
      }
    } catch {
      store.setCompletedError("Failed to load delivery history.");
    } finally {
      store.setCompletedLoading(false);
    }
  }, []);

  // ── Fetch today's stats ─────────────────────────────────────────────────────
  const fetchTodayStats = useCallback(async () => {
    store.setStatsLoading(true);
    try {
      const { data } = await api.get<{ success: boolean; stats: DriverTodayStats }>(
        "/driver/deliveries/stats/today"
      );
      store.setTodayStats(data.stats);
    } catch {
      // non-critical, swallow silently
    } finally {
      store.setStatsLoading(false);
    }
  }, []);

  // ── Toggle online/offline ───────────────────────────────────────────────────
  const toggleAvailability = useCallback(async (goOnline: boolean) => {
    try {
      await api.patch("/driver/availability", {
        status: goOnline ? "ONLINE" : "OFFLINE",
      });
      store.setIsOnline(goOnline);
    } catch {
      throw new Error("Failed to update availability.");
    }
  }, []);

  return {
    fetchRequests,
    acceptRequest,
    declineRequest,
    fetchActiveDelivery,
    advanceStage,
    confirmCashCollected,
    fetchCompleted,
    fetchTodayStats,
    toggleAvailability,
  };
}

// ─── Utility: what action buttons to show for each stage ─────────────────────

export interface StageButtonConfig {
  primary: { label: string; variant: "dark" | "green" | "outline" };
  secondary?: { label: string; variant: "outline" | "muted" };
  nextStage?: DeliveryStage;
  isFinalAction?: boolean;
}

export function getStageButtonConfig(
  stage: DeliveryStage,
  cashCollected: boolean,
  paymentMethod: "COD" | "ONLINE"
): StageButtonConfig {
  switch (stage) {
    case "NAVIGATE_TO_STORE":
      return {
        primary:   { label: "Navigate To Store", variant: "outline" },
        secondary: { label: "Reached Store", variant: "dark" },
        nextStage: "REACHED_STORE",
      };
    case "REACHED_STORE":
      return {
        primary:   { label: "Navigate To Store", variant: "outline" },
        secondary: { label: "Reached Store", variant: "muted" },
        nextStage: "PICKED_UP",
      };
    case "PICKED_UP":
      return {
        primary:   { label: "Navigate to Customer", variant: "outline" },
        secondary: { label: "Reached Customer", variant: "dark" },
        nextStage: "NAVIGATE_TO_CUSTOMER",
      };
    case "NAVIGATE_TO_CUSTOMER":
      return {
        primary:   { label: "Navigate to Customer", variant: "outline" },
        secondary: { label: "Arrived", variant: "green" },
        nextStage: "REACHED_CUSTOMER",
      };
    case "REACHED_CUSTOMER":
      if (paymentMethod === "COD" && !cashCollected) {
        return {
          primary:    { label: "Navigate to Customer", variant: "outline" },
          secondary:  { label: "Arrived", variant: "green" },
          isFinalAction: true, // triggers cash collection first
        };
      }
      return {
        primary:   { label: "Navigate to Customer", variant: "outline" },
        secondary: { label: "Mark Delivered", variant: "green" },
        nextStage: "DELIVERED",
        isFinalAction: true,
      };
    case "DELIVERED":
      return {
        primary: { label: "Back to Dashboard", variant: "dark" },
      };
    default:
      return { primary: { label: "Navigate To Store", variant: "outline" } };
  }
}