import { useEffect, useRef, useState } from "react";
import type { OrderStatus } from "../types/storeOrders";

// Watches an order's status and flags only a *live* transition into
// CANCELLED — i.e. it was something else a moment ago and just flipped,
// while this page was open. Deliberately does NOT fire if the page loads an
// order that's already CANCELLED (e.g. someone opens an old cancelled order
// from the list on purpose) — that's expected browsing, not a surprise.
export function useOrderCancelledWatcher(status: OrderStatus | undefined) {
  const [justCancelled, setJustCancelled] = useState(false);
  const prevStatus = useRef<OrderStatus | undefined>(status);

  useEffect(() => {
    if (
      prevStatus.current &&
      prevStatus.current !== "CANCELLED" &&
      status === "CANCELLED"
    ) {
      setJustCancelled(true);
    }
    prevStatus.current = status;
  }, [status]);

  return { justCancelled, dismiss: () => setJustCancelled(false) };
}