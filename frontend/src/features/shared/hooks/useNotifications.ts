import { useEffect } from "react";
import { toast } from "sonner";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";
import {
  useNotificationStore,
  type AppNotification,
} from "../state/notificationState";

// Fetches existing notifications on mount and subscribes to the
// "notification:new" socket event. This must be called exactly ONCE per
// role (e.g. in the shell/layout component), never in a component that can
// be mounted alongside another caller of this hook — otherwise the socket
// listener registers twice and every incoming notification fires two
// toasts / double-prepends into the list.
//
// Components that just need to react to notifications (mark read, delete,
// etc.) should use `useNotificationActions()` instead, which has no
// subscriptions and is safe to call from anywhere, including multiple times.
export function useNotificationsSync() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const prependNotification = useNotificationStore((s) => s.prependNotification);

  // Fetch existing notifications on mount
  useEffect(() => {
    api
      .get<{ success: boolean; notifications: AppNotification[]; unreadCount: number }>("/notifications")
      .then(({ data }) => {
        if (data.success) setNotifications(data.notifications, data.unreadCount);
      })
      .catch(() => { });
  }, [setNotifications]);

  // Listen for new notifications via socket
  useEffect(() => {
    const socket = getSocket();

    const handleNew = (n: AppNotification) => {
      prependNotification(n);
      toast(n.title, {
        description: n.message,
        duration: 5000,
        icon: n.type === "DELIVERY" ? "🛵" : "📦",
      });
    };

    socket.on("notification:new", handleNew);
    return () => { socket.off("notification:new", handleNew); };
  }, [prependNotification]);
}

// Pure action handlers — no subscriptions, safe to call from any component
// (including ones also rendered alongside useNotificationsSync's caller).
export function useNotificationActions() {
  const { markOneRead, markAllRead, deleteOne } = useNotificationStore();

  const handleMarkRead = async (id: string) => {
    markOneRead(id);
    api.patch(`/notifications/${id}/read`).catch(() => { });
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    api.patch("/notifications/read-all").catch(() => { });
  };

  const handleDelete = async (id: string) => {
    deleteOne(id);
    api.delete(`/notifications/${id}`).catch(() => { });
  };

  return { handleMarkRead, handleMarkAllRead, handleDelete };
}