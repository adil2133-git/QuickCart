import { create } from "zustand";

// Some pages (e.g. checkout) show an instant toast right off the REST
// response, before the backend's socket notification for the same event
// arrives a moment later. Without this, both toasts land within the same
// second and stack/collide. A page can call suppressNextOrderToast(orderId)
// right after its own toast so the notification system skips just that one
// toast — the notification itself still gets saved to the bell/list as normal.
const suppressedOrderToastIds = new Set<string>();

export function suppressNextOrderToast(orderId: string) {
  suppressedOrderToastIds.add(orderId);
  // Safety cleanup in case the matching notification never arrives (e.g. the
  // socket event got lost) so we don't leak entries forever.
  setTimeout(() => suppressedOrderToastIds.delete(orderId), 15000);
}

export function consumeOrderToastSuppression(orderId: string | null): boolean {
  if (!orderId) return false;
  if (suppressedOrderToastIds.has(orderId)) {
    suppressedOrderToastIds.delete(orderId);
    return true;
  }
  return false;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: "ORDER" | "DELIVERY" | "SYSTEM";
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (n: AppNotification[], unread: number) => void;
  prependNotification: (n: AppNotification) => void;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
  deleteOne: (id: string) => void;
  setOpen: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  prependNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  markOneRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  deleteOne: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n._id !== id),
      unreadCount: s.notifications.find((n) => n._id === id && !n.isRead)
        ? Math.max(0, s.unreadCount - 1)
        : s.unreadCount,
    })),

  setOpen: (isOpen) => set({ isOpen }),
}));