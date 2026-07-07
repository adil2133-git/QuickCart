import { useEffect } from "react";
import { toast } from "sonner";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";
import {
  useNotificationStore,
  type AppNotification,
} from "../state/notificationState";

export function useNotifications() {
  const { setNotifications, prependNotification, markOneRead, markAllRead, deleteOne } =
    useNotificationStore();

  // Fetch existing notifications on mount
  useEffect(() => {
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>("/notifications")
      .then(({ data }) => {
        if (data.success) setNotifications(data.notifications, data.unreadCount);
      })
      .catch(() => {});
  }, []);

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

  const handleMarkRead = async (id: string) => {
    markOneRead(id);
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    api.patch("/notifications/read-all").catch(() => {});
  };

  const handleDelete = async (id: string) => {
    deleteOne(id);
    api.delete(`/notifications/${id}`).catch(() => {});
  };

  return { handleMarkRead, handleMarkAllRead, handleDelete };
}