// storeShell.tsx
import React from "react";
import { useNotifications } from "../../shared/hooks/useNotifications";
import Sidebar from "../components/storeSidebar";
import Topbar from "../components/storeTopbar";

export function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Subscribes once (fetches existing notifications + listens for
  // socket "notification:new" events); Topbar reads from the shared
  // notification store directly, so no props need to be threaded here.
  useNotifications();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FBF1E9]">
      <Sidebar storeName="QuickKart" />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}