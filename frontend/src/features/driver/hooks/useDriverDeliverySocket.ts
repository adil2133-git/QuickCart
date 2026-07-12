import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getSocket, connectSocket } from "../../../lib/socket";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";

interface DeliveryRequestPayload {
    requestId: string;
    orderId: string;
    orderNumber: string;
    storeName: string;
    storeAddress: string;
    deliveryAddress: string;
    recipientName: string;
    totalAmount: number;
    paymentMethod: string;
    itemCount: number;
    pickupDistanceKm: number;
    deliveryDistanceKm: number;
    estimatedEarnings: number;
    expiresInSeconds: number;
}

interface RequestTakenPayload {
    orderId: string;
    requestId: string;
    message: string;
}

export function useDriverDeliverySocket() {
    const addRequest = useDriverDeliveryStore((s) => s.addRequest);
    const removeRequestByOrderId = useDriverDeliveryStore((s) => s.removeRequestByOrderId);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        const socket = getSocket();
        connectSocket();

        const handleNewRequest = (payload: DeliveryRequestPayload) => {
            addRequest({
                requestId: payload.requestId,
                orderId: payload.orderId,
                orderNumber: payload.orderNumber,
                storeName: payload.storeName,
                storeAddress: payload.storeAddress,
                deliveryAddress: payload.deliveryAddress,
                recipientName: payload.recipientName,
                totalAmount: payload.totalAmount,
                paymentMethod: payload.paymentMethod,
                itemCount: payload.itemCount,
                pickupDistanceKm: payload.pickupDistanceKm,
                deliveryDistanceKm: payload.deliveryDistanceKm,
                estimatedEarnings: payload.estimatedEarnings,
                expiresInSeconds: payload.expiresInSeconds,
                createdAt: new Date().toISOString(),
            });
            toast("🛵 New delivery request!", {
                description: `Order #${payload.orderNumber} from ${payload.storeName}`,
                duration: 8000,
            });
        };

        const handleRequestTaken = (payload: RequestTakenPayload) => {
            removeRequestByOrderId(payload.orderId);
            toast("⚡ Order taken by another driver", {
                description: payload.message,
                duration: 4000,
            });
        };

        socket.on("delivery:request", handleNewRequest);
        socket.on("delivery:request:taken", handleRequestTaken);

        return () => {
            mountedRef.current = false;
            socket.off("delivery:request", handleNewRequest);
            socket.off("delivery:request:taken", handleRequestTaken);
        };
    }, [addRequest, removeRequestByOrderId]);
}