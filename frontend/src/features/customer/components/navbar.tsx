import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    ChevronDown,
    Search,
    ShoppingCart,
    Bell,
    User,
    Plus,
    Home,
    Briefcase,
    Tag,
    Truck,
    Clock,
    Gift,
    BadgeCheck,
    X,
    Check,
    Leaf,
    Loader2,
    type LucideIcon,
} from "lucide-react";
import api from "../../../api/axios";
import LocationPickerModal from "./locationPickerModal";
import { useAuthStore } from "../../auth/state/authState";
import { useCartStore } from "../state/cartState";
import { useNotificationStore } from "../../shared/state/notificationState";
import { useNotifications } from "../../shared/hooks/useNotifications";


interface SavedAddress {
    _id: string;
    label: string;
    address: string;
    coordinates: { lat: number; lng: number };
}

interface SearchItem {
    type: "product" | "store";
    label: string;
    meta: string;
}

// NotificationItem is now driven by the shared notification store

interface NavLinkItem {
    label: string;
    to: string;
}

interface NavBarProps {
    cartCount?: number;
    activeOrderEta?: number;
}

/* -------------------------------------------------------------------------- */
/*  Role → home path map (mirrors ProtectedRoute + PublicOnlyRoute)          */
/* -------------------------------------------------------------------------- */

const ROLE_HOME: Record<string, string> = {
    CUSTOMER: "/customer/home",
    ADMIN: "/admin/dashboard",
    DRIVER: "/driver/dashboard",
    STORE: "/store/dashboard",
};

/* -------------------------------------------------------------------------- */
/*  Static mock data — replace when backends are ready                       */
/* -------------------------------------------------------------------------- */

const RECENT_SEARCHES: string[] = ["Free range eggs", "Wildflower honey", "Greek yogurt"];

const SEARCH_INDEX: SearchItem[] = [
    { type: "product", label: "Aged Sharp Cheddar", meta: "The Curd Shop · 200g" },
    { type: "product", label: "Estate Coffee Beans", meta: "Mountain Roast · 250g" },
    { type: "product", label: "Seedless Green Grapes", meta: "Green Garden Organics · 500g" },
    { type: "product", label: "Honey Nut Granola", meta: "Heritage Farm · 400g" },
    { type: "product", label: "Full Cream Milk", meta: "Heritage Farm · 1L" },
    { type: "store", label: "Green Garden Organics", meta: "1.2 km · 25–35 mins" },
    { type: "store", label: "Heritage Farm", meta: "0.8 km · 15–20 mins" },
    { type: "store", label: "Boutique Greens", meta: "Hydroponic · Exotics" },
];

const NAV_LINKS: NavLinkItem[] = [
    { label: "Stores", to: "/customer/stores" },
    { label: "Deals", to: "/deals" },
];

interface IdleMessage {
    icon: LucideIcon;
    text: string;
    iconBg: string;
    textColor: string;
    pillBg: string;
}

const IDLE_MESSAGES: IdleMessage[] = [
    { icon: Clock, text: "Avg delivery: 20–30 min", iconBg: "#735A3E", textColor: "#735A3E", pillBg: "#F3EAE0" },
    { icon: Gift, text: "Free delivery over ₹300", iconBg: "#A8632F", textColor: "#8A4F23", pillBg: "#FBE9D8" },
    { icon: BadgeCheck, text: "Fresh & quality assured", iconBg: "#376847", textColor: "#2F5B3D", pillBg: "#EAF2EC" },
];

/* -------------------------------------------------------------------------- */
/*  Typography tokens                                                         */
/* -------------------------------------------------------------------------- */

const FONT_BRAND = "'Fraunces', serif";
const FONT_UI = "'Inter', sans-serif";

/* -------------------------------------------------------------------------- */
/*  Label → icon map                                                          */
/* -------------------------------------------------------------------------- */

function labelIcon(label: string): LucideIcon {
    const l = label.toLowerCase();
    if (l === "home") return Home;
    if (l === "work") return Briefcase;
    return Tag;
}

/* -------------------------------------------------------------------------- */
/*  NavTextLink                                                               */
/* -------------------------------------------------------------------------- */

function NavTextLink({ label, to }: NavLinkItem) {
    const { pathname } = useLocation();
    const isActive = pathname === to || pathname.startsWith(`${to}/`);

    return (
        <Link
            to={to}
            aria-current={isActive ? "page" : undefined}
            className="relative cursor-pointer px-1 py-1 text-[13px] font-medium tracking-wide transition-colors"
            style={{ fontFamily: FONT_UI, color: isActive ? "#735A3E" : "#4E453D", letterSpacing: "0.01em" }}
        >
            {label}
            <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                style={{ backgroundColor: "#735A3E" }}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0.6 }}
                transition={{ duration: 0.18 }}
            />
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/*  usePrefersReducedMotion                                                   */
/* -------------------------------------------------------------------------- */

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return reduced;
}

/* -------------------------------------------------------------------------- */
/*  useClickOutside                                                           */
/* -------------------------------------------------------------------------- */

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], onOutside: () => void) {
    useEffect(() => {
        function handle(e: MouseEvent | TouchEvent) {
            const target = e.target as Node;
            const inside = refs.some((r) => r.current && r.current.contains(target));
            if (!inside) onOutside();
        }
        document.addEventListener("mousedown", handle);
        document.addEventListener("touchstart", handle);
        return () => {
            document.removeEventListener("mousedown", handle);
            document.removeEventListener("touchstart", handle);
        };
    }, [refs, onOutside]);
}

/* -------------------------------------------------------------------------- */
/*  LocationPicker                                                            */
/* -------------------------------------------------------------------------- */

function LocationPicker() {
    const [open, setOpen] = useState(false);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [defaultId, setDefaultId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [switching, setSwitching] = useState<string | null>(null);

    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([btnRef, panelRef], () => setOpen(false));

    useEffect(() => {
        api.get("/customer/profile")
            .then(({ data }) => {
                setAddresses(data.profile.savedAddresses ?? []);
                setDefaultId(data.profile.defaultAddress ?? null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const active = addresses.find((a) => a._id === defaultId) ?? addresses[0];

    const handleSwitch = async (id: string) => {
        if (id === defaultId) { setOpen(false); return; }
        setSwitching(id);
        try {
            await api.patch(`/customer/address/${id}/default`);
            setDefaultId(id);
        } catch (err) {
            console.error("Failed to update default address", err);
        } finally {
            setSwitching(null);
            setOpen(false);
        }
    };

    const handleAddressSaved = async () => {
        setShowAddModal(false);
        try {
            const { data } = await api.get("/customer/profile");
            setAddresses(data.profile.savedAddresses ?? []);
            setDefaultId(data.profile.defaultAddress ?? null);
        } catch (err) {
            console.error("Failed to reload addresses", err);
        }
    };

    const pillText = loading
        ? "Loading…"
        : active
            ? `${active.label} · ${active.address.split(",")[0]}`
            : "Add address";

    return (
        <>
            <AnimatePresence>
                {showAddModal && (
                    <LocationPickerModal
                        onSaved={handleAddressSaved}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </AnimatePresence>

            <div className="relative flex-shrink-0">
                <motion.button
                    ref={btnRef}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                        borderColor: "#D2C4B9",
                        backgroundColor: open ? "rgba(211,196,185,0.22)" : "rgba(211,196,185,0.12)",
                        outlineColor: "#C2A383",
                    }}
                >
                    <MapPin size={14} color="#735A3E" className="shrink-0" />
                    <span className="flex min-w-0 flex-col leading-tight">
                        <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ fontFamily: FONT_UI, color: "#9C8C7C", letterSpacing: "0.08em" }}
                        >
                            Deliver to
                        </span>
                        <span
                            className="block max-w-[100px] truncate text-[12px] font-semibold sm:max-w-[140px] lg:max-w-[220px]"
                            style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                            title={active ? `${active.label} · ${active.address}` : undefined}
                        >
                            {pillText}
                        </span>
                    </span>
                    <ChevronDown size={13} color="#4E453D" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={panelRef}
                            role="dialog"
                            aria-label="Choose delivery address"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,90vw)] overflow-hidden rounded-2xl border shadow-lg"
                            style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
                        >
                            <div className="px-4 pt-3.5 pb-2">
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ fontFamily: FONT_UI, color: "#9C8C7C", letterSpacing: "0.1em" }}
                                >
                                    Saved addresses
                                </p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 size={18} className="animate-spin" style={{ color: "#C2A383" }} />
                                </div>
                            ) : addresses.length === 0 ? (
                                <p className="px-4 pb-4 text-xs" style={{ fontFamily: FONT_UI, color: "#9C8C7C" }}>
                                    No saved addresses yet.
                                </p>
                            ) : (
                                <ul role="list">
                                    {addresses.map((addr) => {
                                        const Icon = labelIcon(addr.label);
                                        const isActive = addr._id === defaultId;
                                        const isSwitching = switching === addr._id;

                                        return (
                                            <li key={addr._id}>
                                                <button
                                                    onClick={() => handleSwitch(addr._id)}
                                                    disabled={!!switching}
                                                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9F3EA] focus-visible:bg-[#F9F3EA] focus-visible:outline-none disabled:opacity-60"
                                                >
                                                    <span
                                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                        style={{
                                                            backgroundColor: isActive ? "#735A3E" : "#EFE6D8",
                                                            color: isActive ? "#fff" : "#735A3E",
                                                        }}
                                                    >
                                                        {isSwitching
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Icon size={14} />
                                                        }
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <span
                                                                className="text-[13px] font-semibold"
                                                                style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                                                            >
                                                                {addr.label}
                                                            </span>
                                                            {isActive && <Check size={13} color="#376847" />}
                                                        </span>
                                                        <span
                                                            className="block truncate text-xs"
                                                            style={{ fontFamily: FONT_UI, color: "#9C8C7C" }}
                                                        >
                                                            {addr.address}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <div className="border-t px-2 py-2" style={{ borderColor: "#EFE6D8" }}>
                                <button
                                    onClick={() => { setOpen(false); setShowAddModal(true); }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-[#F9F3EA] focus-visible:bg-[#F9F3EA] focus-visible:outline-none"
                                    style={{ fontFamily: FONT_UI, color: "#735A3E" }}
                                >
                                    <Plus size={15} /> Add new address
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  SearchBar                                                                 */
/* -------------------------------------------------------------------------- */

function SearchBar() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useClickOutside([wrapRef], () => setOpen(false));

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.trim().toLowerCase();
        return SEARCH_INDEX.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
    }, [query]);

    const showRecent = open && !query.trim();
    const showResults = open && query.trim().length > 0;

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const list: (SearchItem | string)[] = showResults ? results : showRecent ? RECENT_SEARCHES : [];
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, list.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        else if (e.key === "Enter" && highlight >= 0) {
            const picked = showResults ? results[highlight]?.label : (list[highlight] as string | undefined);
            if (picked) { setQuery(picked); setOpen(false); }
        }
    };

    return (
        <div ref={wrapRef} className="relative w-full min-w-[160px] max-w-[440px] flex-1">
            <motion.div
                animate={open ? { boxShadow: "0 0 0 2px #C2A38355" } : { boxShadow: "0 0 0 0px transparent" }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 rounded-full border px-4 py-2.5"
                style={{ backgroundColor: "#F9F3EA", borderColor: "#D2C4B9" }}
            >
                <Search size={16} color="#4E453D" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setHighlight(-1); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder="Search products & stores…"
                    aria-label="Search products and stores"
                    className="flex-1 bg-transparent text-[13px] outline-none"
                    style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                        aria-label="Clear search"
                        className="rounded-full p-0.5 hover:bg-[#EFE6D8]"
                    >
                        <X size={14} color="#9C8C7C" />
                    </button>
                )}
            </motion.div>

            <AnimatePresence>
                {(showRecent || showResults) && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-lg"
                        style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
                    >
                        {showRecent && (
                            <div className="py-2">
                                <p
                                    className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ fontFamily: FONT_UI, color: "#9C8C7C", letterSpacing: "0.1em" }}
                                >
                                    Recent searches
                                </p>
                                {RECENT_SEARCHES.map((term, i) => (
                                    <button
                                        key={term}
                                        onClick={() => { setQuery(term); setOpen(false); }}
                                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-colors hover:bg-[#F9F3EA]"
                                        style={{
                                            fontFamily: FONT_UI,
                                            backgroundColor: highlight === i ? "#F9F3EA" : "transparent",
                                            color: "#4E453D",
                                        }}
                                    >
                                        <Clock size={13} color="#9C8C7C" /> {term}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showResults && (
                            <div className="py-2">
                                {results.length === 0 ? (
                                    <p className="px-4 py-3 text-[13px]" style={{ fontFamily: FONT_UI, color: "#9C8C7C" }}>
                                        No matches for "{query}"
                                    </p>
                                ) : (
                                    results.map((item, i) => (
                                        <button
                                            key={item.label}
                                            onClick={() => { setQuery(item.label); setOpen(false); }}
                                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9F3EA]"
                                            style={{ backgroundColor: highlight === i ? "#F9F3EA" : "transparent" }}
                                        >
                                            <span className="min-w-0">
                                                <span
                                                    className="block truncate text-[13px] font-medium"
                                                    style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                                                >
                                                    {item.label}
                                                </span>
                                                <span
                                                    className="block truncate text-[11px]"
                                                    style={{ fontFamily: FONT_UI, color: "#9C8C7C" }}
                                                >
                                                    {item.meta}
                                                </span>
                                            </span>
                                            <span
                                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                style={{
                                                    fontFamily: FONT_UI,
                                                    letterSpacing: "0.06em",
                                                    backgroundColor: item.type === "store" ? "#EAF2EC" : "#F3EAE0",
                                                    color: item.type === "store" ? "#376847" : "#735A3E",
                                                }}
                                            >
                                                {item.type}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  DeliveryStatusPill                                                        */
/* -------------------------------------------------------------------------- */

const IDLE_ROTATE_MS = 7000;

function DeliveryStatusPill({ etaMinutes }: { etaMinutes?: number }) {
    const isLive = !!etaMinutes;
    const reducedMotion = usePrefersReducedMotion();
    const [idleIndex, setIdleIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (isLive || paused || reducedMotion) return;
        const id = setInterval(() => {
            setIdleIndex((i) => (i + 1) % IDLE_MESSAGES.length);
        }, IDLE_ROTATE_MS);
        return () => clearInterval(id);
    }, [isLive, paused, reducedMotion]);

    useEffect(() => {
        if (!isLive) setIdleIndex(0);
    }, [isLive]);

    const idle = IDLE_MESSAGES[idleIndex];
    const Icon = isLive ? Truck : idle.icon;
    const pillBg = isLive ? "#EAF2EC" : idle.pillBg;
    const iconBg = isLive ? "#376847" : idle.iconBg;
    const textColor = isLive ? "#2F5B3D" : idle.textColor;
    const label = isLive ? `Arriving in ${etaMinutes} min` : idle.text;

    return (
        <motion.div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            animate={{ backgroundColor: pillBg }}
            transition={{ duration: 0.25 }}
            whileHover={{ scale: 1.03 }}
            className="hidden flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 sm:flex"
        >
            <motion.span
                animate={isLive
                    ? { scale: [1, 1.25, 1], backgroundColor: iconBg }
                    : { backgroundColor: iconBg }
                }
                transition={{
                    scale: { duration: 1.6, repeat: isLive ? Infinity : 0, ease: "easeInOut" },
                    backgroundColor: { duration: 0.25 },
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isLive ? "live-icon" : `idle-icon-${idleIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-center"
                    >
                        <Icon size={11} color="#fff" />
                    </motion.span>
                </AnimatePresence>
            </motion.span>

            <span className="relative inline-grid">
                <span
                    aria-hidden="true"
                    className="invisible col-start-1 row-start-1 text-[12px] font-semibold"
                    style={{ fontFamily: FONT_UI }}
                >
                    {[...IDLE_MESSAGES.map((m) => m.text), `Arriving in ${etaMinutes ?? 99} min`].sort(
                        (a, b) => b.length - a.length
                    )[0]}
                </span>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isLive ? "live-text" : `idle-text-${idleIndex}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="col-start-1 row-start-1 text-[12px] font-semibold"
                        style={{ fontFamily: FONT_UI, color: textColor }}
                    >
                        {label}
                    </motion.span>
                </AnimatePresence>
            </span>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/*  NotificationBell                                                          */
/* -------------------------------------------------------------------------- */

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function NotificationBell() {
    const { notifications, unreadCount, isOpen, setOpen } = useNotificationStore();
    const { handleMarkRead, handleMarkAllRead } = useNotifications();
    const navigate = useNavigate();
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([btnRef, panelRef], () => setOpen(false));

    const unread = unreadCount;

    return (
        <div className="relative flex-shrink-0">
            <motion.button
                ref={btnRef}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!isOpen)}
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative cursor-pointer rounded-full p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "#C2A383" }}
            >
                <Bell size={18} color="#735A3E" />
                {unread > 0 && (
                    <span
                        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                        style={{ backgroundColor: "#C24B3F", boxShadow: "0 0 0 2px #FFF9EF" }}
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,90vw)] overflow-hidden rounded-2xl border shadow-lg"
                        style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
                    >
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                            <p
                                className="text-[10px] font-semibold uppercase tracking-widest"
                                style={{ fontFamily: FONT_UI, color: "#9C8C7C", letterSpacing: "0.1em" }}
                            >
                                Notifications
                            </p>
                            {unread > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] font-semibold hover:underline"
                                    style={{ fontFamily: FONT_UI, color: "#735A3E" }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <ul role="list" className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <li className="flex flex-col items-center justify-center gap-2 py-10">
                                    <Bell size={28} color="#D6C5B0" />
                                    <span className="text-[13px]" style={{ color: "#B3A593" }}>
                                        No notifications yet
                                    </span>
                                </li>
                            ) : (
                                notifications.map((n) => (
                                    <li key={n._id} className="border-t first:border-t-0" style={{ borderColor: "#F3EDE2" }}>
                                        <button
                                            onClick={() => {
                                                if (!n.isRead) handleMarkRead(n._id);
                                                setOpen(false);
                                                if (n.orderId) navigate(`/customer/orders`);
                                            }}
                                            className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F9F3EA]"
                                            style={{ background: !n.isRead ? "#FDF8F2" : undefined }}
                                        >
                                            <span
                                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: !n.isRead ? "#C24B3F" : "transparent" }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-baseline justify-between gap-2">
                                                    <span className="text-[13px] font-semibold" style={{ fontFamily: FONT_UI, color: "#4E453D" }}>
                                                        {n.title}
                                                    </span>
                                                    <span className="shrink-0 text-[11px]" style={{ fontFamily: FONT_UI, color: "#B3A593" }}>
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                </span>
                                                <span className="block text-[12px] leading-snug" style={{ fontFamily: FONT_UI, color: "#80756B" }}>
                                                    {n.message}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  MobileMenu                                                                */
/* -------------------------------------------------------------------------- */

function MobileMenu({ onClose }: { onClose: () => void }) {
    const panelRef = useRef<HTMLDivElement>(null);
    useClickOutside([panelRef], onClose);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/30 lg:hidden"
        >
            <motion.div
                ref={panelRef}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col gap-5 overflow-y-auto px-5 py-5"
                style={{ backgroundColor: "#FFF9EF" }}
            >
                <div className="flex items-center justify-between">
                    <span
                        className="text-[15px] font-semibold"
                        style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                    >
                        Menu
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-full p-1.5 hover:bg-[#EFE6D8]"
                    >
                        <X size={18} color="#4E453D" />
                    </button>
                </div>

                <SearchBar />
                <LocationPicker />

                <Link
                    to="/customer/profile"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#F9F3EA]"
                    style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                >
                    <User size={16} /> Profile
                </Link>

                <nav className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: "#EFE6D8" }}>
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={onClose}
                            className="rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#F9F3EA]"
                            style={{ fontFamily: FONT_UI, color: "#4E453D" }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/*  NavBar                                                                    */
/* -------------------------------------------------------------------------- */

export default function NavBar({ cartCount: _cartCount, activeOrderEta }: NavBarProps) {
    const { pathname } = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, isAuthenticated } = useAuthStore();
    const cartCountFromStore = useCartStore((s) => s.cartItemCount());
    const fetchCart = useCartStore((s) => s.fetchCart);
    const cartCount = _cartCount ?? cartCountFromStore;

    const logoHref = isAuthenticated && user
        ? (ROLE_HOME[user.role] ?? "/customer/home")
        : "/landing";

    useEffect(() => {
        if (isAuthenticated) {
            void fetchCart();
        }
    }, [fetchCart, isAuthenticated]);

    // ── Fixed routes ──────────────────────────────────────────────────────────
    const CART_PATH = "/customer/cart";
    const PROFILE_PATH = "/customer/profile";

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="sticky top-0 z-50 border-b"
            style={{
                backgroundColor: "#FFF9EF",
                borderColor: "#D2C4B9",
                boxShadow: "0px 1px 8px rgba(0,0,0,0.06)",
            }}
        >
            <div
                className="mx-auto flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-10"
                style={{ maxWidth: 1280, height: 72 }}
            >
                {/* ── Logo ── */}
                <Link to={logoHref} className="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
                    <motion.span
                        whileHover={{ rotate: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl sm:h-9 sm:w-9"
                        style={{ backgroundColor: "#735A3E" }}
                    >
                        <Leaf size={16} color="#FFF9EF" strokeWidth={2.25} className="sm:hidden" />
                        <Leaf size={18} color="#FFF9EF" strokeWidth={2.25} className="hidden sm:block" />
                    </motion.span>
                    <span
                        className="hidden cursor-pointer text-[19px] font-semibold leading-none tracking-tight sm:block lg:text-[21px]"
                        style={{
                            fontFamily: FONT_BRAND,
                            fontWeight: 480,
                            color: "#4E453D",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        QuickKart
                    </span>
                </Link>

                {/* Location — visible from sm up; lives in the mobile drawer below sm */}
                <div className="hidden sm:block">
                    <LocationPicker />
                </div>

                {/* Search — visible from md up; lives in the mobile drawer below md */}
                <div className="hidden md:block md:flex-1">
                    <SearchBar />
                </div>

                {/* Nav Links — desktop only */}
                <nav className="hidden flex-shrink-0 items-center gap-6 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <NavTextLink key={link.to} label={link.label} to={link.to} />
                    ))}
                </nav>

                {/* Delivery status pill — desktop only */}
                <div className="hidden lg:block">
                    <DeliveryStatusPill etaMinutes={activeOrderEta} />
                </div>

                {/* Action icons */}
                <div className="ml-auto flex flex-shrink-0 items-center gap-2.5 sm:gap-4">
                    {/* Search trigger — opens the drawer below md, where the inline search bar is hidden */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open search"
                        className="flex items-center justify-center rounded-full p-1 md:hidden"
                    >
                        <Search size={19} color="#735A3E" />
                    </button>

                    <NotificationBell />

                    {/* ── Cart ── */}
                    <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="relative">
                        <Link
                            to={CART_PATH}
                            aria-label={`Cart, ${cartCount} items`}
                            aria-current={pathname === CART_PATH ? "page" : undefined}
                            className="flex items-center justify-center rounded-full p-1"
                            style={{
                                backgroundColor: pathname === CART_PATH
                                    ? "rgba(115,90,62,0.1)"
                                    : "transparent",
                            }}
                        >
                            <ShoppingCart size={20} color="#735A3E" />
                        </Link>
                        <AnimatePresence>
                            {cartCount > 0 && (
                                <motion.div
                                    key="badge"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
                                    style={{ backgroundColor: "#376847" }}
                                >
                                    <span
                                        className="font-bold text-white"
                                        style={{ fontSize: 9, fontFamily: FONT_UI }}
                                    >
                                        {cartCount}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── Profile — hidden below sm; reachable via drawer instead ── */}
                    <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="hidden lg:block">
                        <Link
                            to={PROFILE_PATH}
                            aria-label="Profile"
                            aria-current={pathname === PROFILE_PATH ? "page" : undefined}
                            className="flex items-center justify-center rounded-full p-1"
                            style={{
                                backgroundColor: pathname === PROFILE_PATH
                                    ? "rgba(115,90,62,0.1)"
                                    : "transparent",
                            }}
                        >
                            <User size={18} color="#735A3E" />
                        </Link>
                    </motion.div>

                    {/* ── Hamburger — mobile/tablet only ── */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        className="flex flex-col items-center justify-center gap-[3px] rounded-full p-1.5 lg:hidden"
                    >
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#735A3E" }} />
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#735A3E" }} />
                        <span className="block h-[1.5px] w-[18px]" style={{ backgroundColor: "#735A3E" }} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
            </AnimatePresence>
        </motion.header>
    );
}