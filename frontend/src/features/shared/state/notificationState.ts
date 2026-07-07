import { create } from "zustand";

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