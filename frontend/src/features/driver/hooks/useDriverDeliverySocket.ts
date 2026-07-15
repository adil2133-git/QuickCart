import { useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "../../../lib/socket";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverWalletStore } from "../state/driverWalletState";
import type { WalletTransaction } from "../types/driverWallet";

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

interface WalletUpdatedPayload {
    balance: number;
    change: number;
    reason: "EARNING" | "BONUS" | "WITHDRAWAL" | "ADJUSTMENT";
    orderId?: string | null;
    transaction: WalletTransaction;
}

export function useDriverDeliverySocket() {
    const addRequest = useDriverDeliveryStore((s) => s.addRequest);
    const removeRequestByOrderId = useDriverDeliveryStore((s) => s.removeRequestByOrderId);
    const liveUpdateBalance = useDriverWalletStore((s) => s.liveUpdateBalance);
    const prependTransaction = useDriverWalletStore((s) => s.prependTransaction);
    useEffect(() => {
        const socket = getSocket();

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
                // compute the deadline once here — countdown UI reads this
                // instead of restarting from expiresInSeconds later
                expiresAt: Date.now() + payload.expiresInSeconds * 1000,
                createdAt: new Date().toISOString(),
            });
            toast("🛵 New delivery request!", {
                description: `Order #${payload.orderNumber} from ${payload.storeName}`,
                duration: 8000,
            });
        };

        const handleRequestTaken = (payload: RequestTakenPayload) => {
            // the toast for this comes from the persisted notification instead,
            // so just remove the card without showing anything here
            removeRequestByOrderId(payload.orderId);
        };

        const handleWalletUpdated = (payload: WalletUpdatedPayload) => {
            liveUpdateBalance(payload.balance);
            prependTransaction(payload.transaction);
            if (payload.reason === "EARNING" && payload.change > 0) {
                toast.success(`₹${payload.change} credited to your wallet`, {
                    description: payload.transaction.orderNumber
                        ? `Order #${payload.transaction.orderNumber}`
                        : undefined,
                });
            }
        };

        socket.on("delivery:request", handleNewRequest);
        socket.on("delivery:request:taken", handleRequestTaken);
        socket.on("wallet:updated", handleWalletUpdated);

        return () => {
            socket.off("delivery:request", handleNewRequest);
            socket.off("delivery:request:taken", handleRequestTaken);
            socket.off("wallet:updated", handleWalletUpdated);
        };
    }, [addRequest, removeRequestByOrderId, liveUpdateBalance, prependTransaction]);
}