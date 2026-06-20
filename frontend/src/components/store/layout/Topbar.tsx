import { Bell } from "lucide-react";

interface TopbarProps {
  title: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function Topbar({ title, notificationCount = 0, onNotificationClick }: TopbarProps) {
  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-[#EADFD3] bg-[#FBF1E9] px-8">
      <h2 className="text-2xl font-bold text-[#2B1B0E]">{title}</h2>

      <button
        type="button"
        onClick={onNotificationClick}
        aria-label={
          notificationCount > 0 ? `Notifications, ${notificationCount} unread` : "Notifications"
        }
        className="relative rounded-full p-2 text-[#2B1B0E] transition-colors hover:bg-black/5"
      >
        <Bell className="h-6 w-6" />
        {notificationCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#FBF1E9]" />
        )}
      </button>
    </header>
  );
}
