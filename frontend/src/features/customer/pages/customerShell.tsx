import { Outlet } from "react-router-dom";
import NavBar from "../components/navbar";
import ConflictModal from "../components/conflictModal";
import { useNotificationsSync } from "../../shared/hooks/useNotifications";
import { useCustomerOrderSocket } from "../hooks/useCustomerOrderSocket";

export default function CustomerShell() {
  useNotificationsSync();
  useCustomerOrderSocket();
  return (
    <div className="min-h-screen bg-white text-[#16241D]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      <Outlet />
      <ConflictModal />
    </div>
  );
}