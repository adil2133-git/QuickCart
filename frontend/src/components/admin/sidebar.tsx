import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

interface NavLeaf {
    label: string;
    id: string;
    route: string; // Added route directly to leaf
}

interface NavItem {
    label: string;
    id: string;
    icon: LucideIcon;
    route?: string; // Added optional route for parent items
    children?: NavLeaf[];
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", id: "dashboard", icon: LayoutDashboard, route: "/admin/dashboard" },
    {
        label: "User Management",
        id: "user-management",
        icon: Users,
        route: "/admin/users",
        children: [
            { label: "Customers", id: "customers", route: "/admin/users/customers" },
            { label: "Stores", id: "um-stores", route: "/admin/users/stores" },
            { label: "Drivers", id: "um-drivers", route: "/admin/users/drivers" },
        ],
    },
    {
        label: "Approvals",
        id: "approvals",
        icon: ShieldCheck,
        route: "/admin/approvals/store",
        children: [
            { label: "Store Applications", id: "store-applications", route: "/admin/approvals/store" },
            { label: "Driver Applications", id: "driver-applications", route: "/admin/approvals/drivers" },
        ],
    },
    {
        label: "Orders",
        id: "orders",
        icon: ShoppingCart,
        route: "/admin/orders",
        children: [
            { label: "Order Monitoring", id: "order-monitoring", route: "/admin/orders/monitoring" },
            { label: "Complaints & Disputes", id: "complaints-disputes", route: "/admin/orders/disputes" },
        ],
    },
    {
        label: "Finance",
        id: "finance",
        icon: Wallet,
        route: "/admin/finance",
        children: [
            { label: "Revenue Overview", id: "revenue-overview", route: "/admin/finance/revenue" },
            { label: "COD Settlements", id: "cod-settlements", route: "/admin/finance/cod-settlements" },
            { label: "Withdrawal Requests", id: "withdrawal-requests", route: "/admin/finance/withdrawals" },
        ],
    },
    {
        label: "Analytics",
        id: "analytics",
        icon: BarChart3,
        route: "/admin/analytics",
        children: [
            { label: "Performance Reports", id: "performance-reports", route: "/admin/analytics/performance" },
            { label: "Top Stores", id: "top-stores", route: "/admin/analytics/top-stores" },
            { label: "Top Drivers", id: "top-drivers", route: "/admin/analytics/top-drivers" },
        ],
    },
    { label: "Settings", id: "settings", icon: Settings, route: "/admin/settings" },
];

// Helper to find parent of a child id
function findParentId(childId: string): string | null {
    for (const item of NAV_ITEMS) {
        if (item.children?.some(c => c.id === childId)) {
            return item.id;
        }
    }
    return null;
}

// Helper to check if a route matches or is a child route
function isRouteActive(currentPath: string, itemRoute: string): boolean {
    return currentPath === itemRoute || currentPath.startsWith(itemRoute + "/");
}

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    // Find which nav item is active
    const findActiveItem = () => {
        // First check if any leaf is active
        for (const item of NAV_ITEMS) {
            if (item.children) {
                for (const child of item.children) {
                    if (isRouteActive(currentPath, child.route)) {
                        return { parentId: item.id, childId: child.id };
                    }
                }
            }
            // Check if parent itself is active
            if (item.route && isRouteActive(currentPath, item.route)) {
                return { parentId: null, childId: item.id };
            }
        }
        return { parentId: null, childId: "dashboard" };
    };

    const { parentId, childId } = findActiveItem();
    const activeId = childId;

    // Initialize open group based on active parent
    const [openGroup, setOpenGroup] = useState<string | null>(parentId);

    // Keep open group in sync with route changes
    useEffect(() => {
        const newParentId = findParentId(activeId) || 
                           (NAV_ITEMS.find(item => item.id === activeId)?.children ? activeId : null);
        // Only update if different to avoid unnecessary re-renders
        if (newParentId !== openGroup) {
            setOpenGroup(newParentId);
        }
    }, [activeId]);

    const handleGroupClick = (item: NavItem) => {
        if (!item.children) {
            // Leaf item without children
            if (item.route) {
                navigate(item.route);
            }
            return;
        }

        // If clicking on the parent itself
        if (openGroup === item.id) {
            // If already open, close it
            setOpenGroup(null);
        } else {
            // Open the group and navigate to its route
            setOpenGroup(item.id);
            if (item.route) {
                navigate(item.route);
            }
        }
    };

    const handleChildClick = (child: NavLeaf) => {
        // Navigate to child route
        navigate(child.route);
        // Ensure parent stays open
        const parentId = findParentId(child.id);
        if (parentId) {
            setOpenGroup(parentId);
        }
    };

    return (
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
                        
                        // Check if this item or any of its children is active
                        const isActive = activeId === item.id || 
                                       (item.children?.some(c => c.id === activeId) ?? false);

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => handleGroupClick(item)}
                                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                                        isActive
                                            ? "bg-[#3A2C20] text-[#F4EDE2]"
                                            : "text-[#C9BCAC] hover:bg-[#2E231C] hover:text-[#F4EDE2]"
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span
                                            className={`relative flex h-5 w-5 items-center justify-center ${
                                                isActive ? "text-[#C8A37A]" : ""
                                            }`}
                                        >
                                            {isActive && (
                                                <span className="absolute -left-[15px] h-5 w-[3px] rounded-full bg-[#C8A37A]" />
                                            )}
                                            <Icon size={18} strokeWidth={2} />
                                        </span>
                                        <span>{item.label}</span>
                                    </span>
                                    {hasChildren && (
                                        <ChevronDown
                                            size={15}
                                            className={`text-[#8C7C6B] transition-transform duration-200 ${
                                                isGroupOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    )}
                                </button>

                                {/* Accordion submenu */}
                                {hasChildren && (
                                    <div
                                        className={`grid overflow-hidden transition-all duration-200 ease-in-out ${
                                            isGroupOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        }`}
                                    >
                                        <div className="min-h-0">
                                            <div className="ml-[26px] flex flex-col gap-0.5 border-l border-[#3A2C20] py-1 pl-4">
                                                {item.children!.map((child) => {
                                                    const isChildActive = activeId === child.id;
                                                    return (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => handleChildClick(child)}
                                                            className={`rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-normal transition-colors ${
                                                                isChildActive
                                                                    ? "bg-[#3A2C20] font-medium text-[#F4EDE2]"
                                                                    : "text-[#A2937F] hover:bg-[#2E231C] hover:text-[#E4D9CB]"
                                                            }`}
                                                        >
                                                            {child.label}
                                                        </button>
                                                    );
                                                })}
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
                <button
                    onClick={() => navigate("/admin/profile")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#C9BCAC] transition-colors hover:bg-[#2E231C] hover:text-[#F4EDE2]"
                >
                    <UserCircle2 size={18} />
                    <span>Admin Profile</span>
                </button>
                <button
                    onClick={() => navigate("/logout")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#C9BCAC] transition-colors hover:bg-[#2E231C] hover:text-[#F4EDE2]"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}