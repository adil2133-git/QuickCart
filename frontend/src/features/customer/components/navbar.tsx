import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Truck,
  Clock,
  X,
  Check,
  Leaf,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Address {
  id: string;
  label: string;
  line: string;
  icon: LucideIcon;
  active: boolean;
}

interface SearchItem {
  type: "product" | "store";
  label: string;
  meta: string;
}

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

interface NavLinkItem {
  label: string;
  to: string;
}

interface NavBarProps {
  cartCount?: number;
  /** Minutes until the customer's active order arrives. Omit/0 when there's no active order. */
  activeOrderEta?: number;
}

/* -------------------------------------------------------------------------- */
/*  Mock data — replace with real API calls when wiring this up              */
/* -------------------------------------------------------------------------- */

const SAVED_ADDRESSES: Address[] = [
  { id: "home", label: "Home", line: "12th Cross, Indiranagar, Bengaluru", icon: Home, active: true },
  { id: "work", label: "Work", line: "Brigade Towers, MG Road, Bengaluru", icon: Briefcase, active: false },
];

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

const NOTIFICATIONS: NotificationItem[] = [
  { id: 1, title: "Order delivered", body: "Your order from Heritage Farm has arrived.", time: "2m ago", unread: true },
  { id: 2, title: "Price drop", body: "Estate Coffee Beans is now ₹449.", time: "1h ago", unread: true },
  { id: 3, title: "Welcome back", body: "Here's ₹50 off your next order over ₹500.", time: "1d ago", unread: false },
];

const NAV_LINKS: NavLinkItem[] = [
  { label: "Stores", to: "/stores" },
  { label: "Deals", to: "/deals" },
];

/* -------------------------------------------------------------------------- */
/*  NavTextLink — text link that knows when its route is active              */
/* -------------------------------------------------------------------------- */

function NavTextLink({ label, to }: NavLinkItem) {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      aria-current={isActive ? "page" : undefined}
      className="relative cursor-pointer px-1 py-1 text-xs font-medium transition-colors"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        color: isActive ? "#735A3E" : "#4E453D",
      }}
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
/*  useClickOutside — shared by every popover                                */
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
/*  Location popover                                                         */
/* -------------------------------------------------------------------------- */

function LocationPicker() {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(SAVED_ADDRESSES);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside([btnRef, panelRef], () => setOpen(false));

  const active = addresses.find((a) => a.active) ?? addresses[0];

  return (
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
        <MapPin size={14} color="#735A3E" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium" style={{ fontFamily: "'DM Sans', sans-serif", color: "#9C8C7C" }}>
            Deliver to
          </span>
          <span
            className="max-w-[150px] truncate text-xs font-semibold"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}
          >
            {active.label} · {active.line.split(",")[0]}
          </span>
        </span>
        <ChevronDown size={13} color="#4E453D" className={`transition-transform ${open ? "rotate-180" : ""}`} />
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
            className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-lg"
            style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
          >
            <div className="px-4 pt-3.5 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9C8C7C" }}>
                Saved addresses
              </p>
            </div>
            <ul role="list">
              {addresses.map((addr) => {
                const Icon = addr.icon;
                return (
                  <li key={addr.id}>
                    <button
                      onClick={() => {
                        setAddresses((prev) => prev.map((a) => ({ ...a, active: a.id === addr.id })));
                        setOpen(false);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9F3EA] focus-visible:bg-[#F9F3EA] focus-visible:outline-none"
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: addr.active ? "#735A3E" : "#EFE6D8", color: addr.active ? "#fff" : "#735A3E" }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: "#4E453D" }}>
                            {addr.label}
                          </span>
                          {addr.active && <Check size={13} color="#376847" />}
                        </span>
                        <span className="block truncate text-xs" style={{ color: "#9C8C7C" }}>
                          {addr.line}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t px-2 py-2" style={{ borderColor: "#EFE6D8" }}>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-[#F9F3EA] focus-visible:bg-[#F9F3EA] focus-visible:outline-none"
                style={{ color: "#735A3E" }}
              >
                <Plus size={15} /> Add new address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Search with suggestions                                                  */
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && highlight >= 0) {
      const picked = showResults ? results[highlight]?.label : (list[highlight] as string | undefined);
      if (picked) {
        setQuery(picked);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative flex-1" style={{ maxWidth: 420 }}>
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
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products & stores…"
          aria-label="Search products and stores"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-lg"
            style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
          >
            {showRecent && (
              <div className="py-2">
                <p className="px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9C8C7C" }}>
                  Recent searches
                </p>
                {RECENT_SEARCHES.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-[#F9F3EA]"
                    style={{ backgroundColor: highlight === i ? "#F9F3EA" : "transparent", color: "#4E453D" }}
                  >
                    <Clock size={13} color="#9C8C7C" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {showResults && (
              <div className="py-2">
                {results.length === 0 ? (
                  <p className="px-4 py-3 text-sm" style={{ color: "#9C8C7C" }}>
                    No matches for "{query}"
                  </p>
                ) : (
                  results.map((item, i) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setQuery(item.label);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9F3EA]"
                      style={{ backgroundColor: highlight === i ? "#F9F3EA" : "transparent" }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium" style={{ color: "#4E453D" }}>
                          {item.label}
                        </span>
                        <span className="block truncate text-xs" style={{ color: "#9C8C7C" }}>
                          {item.meta}
                        </span>
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
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
/*  Live order pill — only renders when there's an active order              */
/* -------------------------------------------------------------------------- */

function LiveOrderPill({ etaMinutes }: { etaMinutes?: number }) {
  if (!etaMinutes) return null;
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex"
      style={{ backgroundColor: "#EAF2EC" }}
    >
      <motion.span
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: "#376847" }}
      >
        <Truck size={11} color="#fff" />
      </motion.span>
      <span className="text-xs font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#2F5B3D" }}>
        Arriving in {etaMinutes} min
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notification bell with popover                                           */
/* -------------------------------------------------------------------------- */

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(NOTIFICATIONS);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useClickOutside([btnRef, panelRef], () => setOpen(false));

  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="relative flex-shrink-0">
      <motion.button
        ref={btnRef}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative cursor-pointer rounded-full p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: "#C2A383" }}
      >
        <Bell size={18} color="#735A3E" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: "#C24B3F", boxShadow: "0 0 0 2px #FFF9EF" }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-lg"
            style={{ borderColor: "#E5DAC9", backgroundColor: "#FFFDF9" }}
          >
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9C8C7C" }}>
                Notifications
              </p>
              {unread > 0 && (
                <button
                  onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: "#735A3E" }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul role="list" className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-t first:border-t-0" style={{ borderColor: "#F3EDE2" }}>
                  <button
                    onClick={() =>
                      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
                    }
                    className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F9F3EA]"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: n.unread ? "#C24B3F" : "transparent" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: "#4E453D" }}>
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[11px]" style={{ color: "#B3A593" }}>
                          {n.time}
                        </span>
                      </span>
                      <span className="block text-xs leading-snug" style={{ color: "#80756B" }}>
                        {n.body}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  NavBar                                                                    */
/* -------------------------------------------------------------------------- */

export default function NavBar({ cartCount = 2, activeOrderEta = 12 }: NavBarProps) {
  const { pathname } = useLocation();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: "#FFF9EF", borderColor: "#D2C4B9", boxShadow: "0px 1px 8px rgba(0,0,0,0.06)" }}
    >
      <div
        className="mx-auto flex items-center gap-4 px-5 sm:px-8 lg:px-10"
        style={{ maxWidth: 1280, height: 80 }}
      >
        {/* Logo */}
        <Link to="/" className="flex flex-shrink-0 items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: -6 }}
            transition={{ duration: 0.2 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#735A3E" }}
          >
            <Leaf size={18} color="#FFF9EF" strokeWidth={2.25} />
          </motion.span>
          <motion.span
            whileHover={{ letterSpacing: "0.2px" }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer text-[22px] font-bold leading-none tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#4E453D" }}
          >
            QuickKart
          </motion.span>
        </Link>

        {/* Location */}
        <LocationPicker />

        {/* Search */}
        <SearchBar />

        {/* Nav Links */}
        <nav className="hidden flex-shrink-0 items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavTextLink key={link.to} label={link.label} to={link.to} />
          ))}
        </nav>

        {/* Live order pill */}
        <LiveOrderPill etaMinutes={activeOrderEta} />

        {/* Action Icons */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-4 sm:ml-0">
          <NotificationBell />

          <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="relative">
            <Link
              to="/cart"
              aria-label={`Cart, ${cartCount} items`}
              aria-current={pathname === "/cart" ? "page" : undefined}
              className="flex items-center justify-center rounded-full p-1"
              style={{ backgroundColor: pathname === "/cart" ? "rgba(115,90,62,0.1)" : "transparent" }}
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
                  <span className="font-bold text-white" style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>
                    {cartCount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}>
            <Link
              to="/profile"
              aria-label="Profile"
              aria-current={pathname === "/profile" ? "page" : undefined}
              className="flex items-center justify-center rounded-full p-1"
              style={{ backgroundColor: pathname === "/profile" ? "rgba(115,90,62,0.1)" : "transparent" }}
            >
              <User size={18} color="#735A3E" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}