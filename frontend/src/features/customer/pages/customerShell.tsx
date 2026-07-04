import { Outlet } from "react-router-dom";
import NavBar from "../components/navbar";

// Shared layout for all standard customer pages.
// Pages that need their own full-page header (checkout, productDiscovery)
// are routed outside this shell.
export default function CustomerShell() {
  return (
    <div className="min-h-screen bg-[#F7F3ED]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      <Outlet />
    </div>
  );
}