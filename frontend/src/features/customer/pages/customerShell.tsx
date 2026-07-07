import { Outlet } from "react-router-dom";
import NavBar from "../components/navbar";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useCustomerOrderSocket } from "../hooks/useCustomerOrderSocket";

export default function CustomerShell() {
  useNotifications();
  useCustomerOrderSocket();
  return (
    <div className="min-h-screen bg-[#F7F3ED]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      <Outlet />
    </div>
  );
}