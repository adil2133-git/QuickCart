import { useEffect } from "react";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";
import { useActiveDeliveryStore, type ActiveDelivery } from "../state/activeDeliveryState";

interface GetActiveDeliveryResponse {
  success: boolean;
  activeDelivery: ActiveDelivery | null;
}

interface DriverLocationPayload {
  orderId: string;
  lat: number;
  lng: number;
}

interface OrderStatusChangedPayload {
  orderId: string;
  orderStatus: string;
}

export function useActiveDeliveryTracking() {
  const setDelivery = useActiveDeliveryStore((s) => s.setDelivery);
  const setLoading = useActiveDeliveryStore((s) => s.setLoading);
  const updateDriverLocation = useActiveDeliveryStore((s) => s.updateDriverLocation);
  const updateStatus = useActiveDeliveryStore((s) => s.updateStatus);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    api
      .get<GetActiveDeliveryResponse>("/customer/orders/active-delivery")
      .then(({ data }) => {
        if (!cancelled) setDelivery(data.activeDelivery);
      })
      .catch(() => {
        if (!cancelled) setDelivery(null);
      });

    return () => {
      cancelled = true;
    };
  }, [setDelivery, setLoading]);

  useEffect(() => {
    const socket = getSocket();

    const handleLocation = (p: DriverLocationPayload) => {
      updateDriverLocation(p.orderId, p.lat, p.lng);
    };

    const handleStatusChanged = (p: OrderStatusChangedPayload) => {
      if (p.orderStatus === "OUT_FOR_DELIVERY") {
        api
          .get<GetActiveDeliveryResponse>("/customer/orders/active-delivery")
          .then(({ data }) => setDelivery(data.activeDelivery))
          .catch(() => {});
      } else {
        updateStatus(p.orderId, p.orderStatus);
      }
    };

    socket.on("driver:location", handleLocation);
    socket.on("order:statusChanged", handleStatusChanged);

    return () => {
      socket.off("driver:location", handleLocation);
      socket.off("order:statusChanged", handleStatusChanged);
    };
  }, [updateDriverLocation, updateStatus, setDelivery]);
}