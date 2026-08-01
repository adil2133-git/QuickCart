import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, UserCircle2, Settings, LogOut } from "lucide-react";

import { useLogout } from "../../auth/hooks/useLogout";

interface TopBarProps {
    /** Page-specific title, e.g. "Dashboard", "Approvals", "Finance" */
    pageTitle: string;
    /** Set to false on pages that don't need the global search bar */
    showSearch?: boolean;
    searchPlaceholder?: string;
    adminName?: string;
    adminInitials?: string;
    unreadCount?: number;
    /** Optional page-specific controls rendered before the date/bell/avatar cluster, e.g. a "Bulk Review" button on Approvals */
    rightSlot?: React.ReactNode;
}

function getFormattedDate(): string {
    return new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function TopBar({
    pageTitle,
    showSearch = true,
    searchPlaceholder = "Search orders, stores, or drivers...",
    adminName = "Admin",
    adminInitials = "AD",
    unreadCount = 3,
    rightSlot,
}: TopBarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { logout, isLoggingOut } = useLogout();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="flex h-[76px] w-full items-center justify-between gap-6 border-b border-[#E3E7E1] bg-white px-7">
            {/* Left: page title + optional search — only these change per page */}
            <div className="flex flex-1 items-center gap-6">
                <h1 className="whitespace-nowrap text-[22px] font-semibold tracking-tight text-[#16241D]">
                    {pageTitle}
                </h1>
                {showSearch && (
            <div className="flex w-full max-w-[280px] items-center gap-2.5 rounded-xl border border-[#E3E7E1] bg-[#FAFCFA] px-3.5 py-2.5">
                        <Search size={16} className="shrink-0 text-[#5F7166]" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent text-[13.5px] text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Optional page-specific action button(s) */}
            {rightSlot && <div className="flex items-center">{rightSlot}</div>}

            {/* Right: date, notifications, profile — identical on every page */}
            <div className="flex items-center gap-5">
                <span className="whitespace-nowrap text-[13.5px] text-[#6E7C74]">
                    {getFormattedDate()}
                </span>

                <div className="h-5 w-px bg-[#E3E7E1]" />

                <button
                    aria-label="Notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
                >
                    <Bell size={18} strokeWidth={2} />
                    {unreadCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-[#BA1A1A] ring-2 ring-white" />
                    )}
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#F5F7F3]"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145C43] text-[12px] font-semibold text-white">
                            {adminInitials}
                        </span>
                        <ChevronDown
                            size={15}
                            className={`text-[#6E7C74] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[#E3E7E1] bg-white p-1.5 shadow-lg">
                            <div className="px-3 py-2">
                                <p className="text-[13px] font-semibold text-[#16241D]">
                                    {adminName}
                                </p>
                                <p className="text-[11.5px] text-[#6E7C74]">Super Admin</p>
                            </div>
                            <div className="my-1 h-px bg-[#E3E7E1]" />
                            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
                                <UserCircle2 size={16} />
                                Admin Profile
                            </button>
                            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
                                <Settings size={16} />
                                Platform Settings
                            </button>
                            <div className="my-1 h-px bg-[#E3E7E1]" />
                            <button
                                onClick={logout}
                                disabled={isLoggingOut}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[#BA1A1A] transition-colors hover:bg-[#FBEAEA]"
                            >
                                <LogOut size={16} />
                                {isLoggingOut ? "Logging out…" : "Logout"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}