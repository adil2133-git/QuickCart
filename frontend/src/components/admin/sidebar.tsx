import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    ChevronDown,
    UserCircle2,
    LogOut,
    type LucideIcon,
} from "lucide-react";

/**
 * QuickKart Admin — Sidebar Navigation
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Behavior:
 * - Always fully expanded (no collapse / icon-only mode)
 * - Accordion groups: only one group expanded at a time
 * - Active item highlighted with accent fill + left bar
 *
 * Color theme (from QuickKart Stitch reference):
 *   sidebar bg     #211712  (near-black warm brown)
 *   sidebar hover  #2E231C
 *   accent (brown) #8B6F47
 *   active fill    #3A2C20
 *   text muted     #8C7C6B
 *   text default   #EFE7DC
 */

interface NavLeaf {
    label: string;
    id: string;
}

interface NavItem {
    label: string;
    id: string;
    icon: LucideIcon;
    children?: NavLeaf[];
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    {
        label: "User Management",
        id: "user-management",
        icon: Users,
        children: [
            { label: "Customers", id: "customers" },
            { label: "Stores", id: "um-stores" },
            { label: "Drivers", id: "um-drivers" },
        ],
    },
    {
        label: "Approvals",
        id: "approvals",
        icon: ShieldCheck,
        children: [
            { label: "Store Applications", id: "store-applications" },
            { label: "Driver Applications", id: "driver-applications" },
        ],
    },
    {
        label: "Orders",
        id: "orders",
        icon: ShoppingCart,
        children: [
            { label: "Order Monitoring", id: "order-monitoring" },
            { label: "Complaints & Disputes", id: "complaints-disputes" },
        ],
    },
    {
        label: "Finance",
        id: "finance",
        icon: Wallet,
        children: [
            { label: "Revenue Overview", id: "revenue-overview" },
            { label: "COD Settlements", id: "cod-settlements" },
            { label: "Withdrawal Requests", id: "withdrawal-requests" },
        ],
    },
    {
        label: "Analytics",
        id: "analytics",
        icon: BarChart3,
        children: [
            { label: "Performance Reports", id: "performance-reports" },
            { label: "Top Stores", id: "top-stores" },
            { label: "Top Drivers", id: "top-drivers" },
        ],
    },
    { label: "Settings", id: "settings", icon: Settings },
];

export default function Sidebar() {
    const [openGroup, setOpenGroup] = useState<string | null>("dashboard");
    const [activeId, setActiveId] = useState<string>("dashboard");

    // Keep a parent group open if one of its children is active
    useEffect(() => {
        const parent = NAV_ITEMS.find((item) =>
            item.children?.some((c) => c.id === activeId)
        );
        if (parent) setOpenGroup(parent.id);
    }, [activeId]);

    const handleGroupClick = (item: NavItem) => {
        if (!item.children) {
            setActiveId(item.id);
            setOpenGroup(null);
            return;
        }
        setOpenGroup((prev) => (prev === item.id ? null : item.id));
    };

    return (
        <>
            <aside className="flex h-screen w-[264px] flex-col justify-between border-r border-black/20 bg-[#211712]">
                {/* Top: Logo */}
                <div>
                    <div className="px-4 py-5">
                        <p className="font-serif text-[17px] font-semibold tracking-tight text-[#F4EDE2]">
                            QuickKart
                        </p>
                        <p className="text-[11px] text-[#8C7C6B]">Admin Panel</p>
                    </div>

                    {/* Nav */}
                    <nav className="flex flex-col gap-1 px-3">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const hasChildren = !!item.children;
                            const isGroupOpen = openGroup === item.id;
                            const isParentActive =
                                activeId === item.id ||
                                item.children?.some((c) => c.id === activeId);

                            return (
                                <div key={item.id} className="relative">
                                    <button
                                        onClick={() => handleGroupClick(item)}
                                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${isParentActive
                                                ? "bg-[#3A2C20] text-[#F4EDE2]"
                                                : "text-[#C9BCAC] hover:bg-[#2E231C] hover:text-[#F4EDE2]"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span
                                                className={`relative flex h-5 w-5 items-center justify-center ${isParentActive ? "text-[#C8A37A]" : ""
                                                    }`}
                                            >
                                                {isParentActive && (
                                                    <span className="absolute -left-[15px] h-5 w-[3px] rounded-full bg-[#C8A37A]" />
                                                )}
                                                <Icon size={18} strokeWidth={2} />
                                            </span>
                                            <span>{item.label}</span>
                                        </span>
                                        {hasChildren && (
                                            <ChevronDown
                                                size={15}
                                                className={`text-[#8C7C6B] transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        )}
                                    </button>

                                    {/* Accordion submenu */}
                                    {hasChildren && (
                                        <div
                                            className={`grid overflow-hidden transition-all duration-200 ease-in-out ${isGroupOpen
                                                    ? "grid-rows-[1fr] opacity-100"
                                                    : "grid-rows-[0fr] opacity-0"
                                                }`}
                                        >
                                            <div className="min-h-0">
                                                <div className="ml-[26px] flex flex-col gap-0.5 border-l border-[#3A2C20] py-1 pl-4">
                                                    {item.children!.map((child) => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => setActiveId(child.id)}
                                                            className={`rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-normal transition-colors ${activeId === child.id
                                                                    ? "bg-[#3A2C20] font-medium text-[#F4EDE2]"
                                                                    : "text-[#A2937F] hover:bg-[#2E231C] hover:text-[#E4D9CB]"
                                                                }`}
                                                        >
                                                            {child.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom: Admin profile / logout */}
                <div className="flex flex-col gap-1 border-t border-[#3A2C20] px-3 py-4">
                    <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#C9BCAC] transition-colors hover:bg-[#2E231C] hover:text-[#F4EDE2]">
                        <UserCircle2 size={18} />
                        <span>Admin Profile</span>
                    </button>
                    <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#C9BCAC] transition-colors hover:bg-[#2E231C] hover:text-[#F4EDE2]">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}