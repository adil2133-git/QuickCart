// storeShell.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/storeSidebar";
import Topbar from "../components/storeTopbar";

export function StoreShell({
  children,
  notificationCount = 0,
}: {
  children: React.ReactNode;
  notificationCount?: number;
}) {

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FBF1E9]">
      <Sidebar storeName="QuickKart" />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar notificationCount={notificationCount} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}