// src/features/customer/pages/customerHome.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
    MapPin, ShoppingCart, Star, ChevronLeft, ChevronRight,
    Plus, Check, ArrowRight, Clock, Leaf,
} from "lucide-react";
import LocationPickerModal from "../components/locationPickerModal";
import api from "../../../api/axios";
import { useLocationStore } from "../state/locationState";
import { useStoresListStore } from "../state/storesListState";
import { useCartStore } from "../state/cartState";
import type { StoreProfileSummary } from "../types/store";

// ─── Animation Variants ────────────────────────────────────────────────────────
// NOTE: explicitly typed as `Variants` from framer-motion. Without this,
// TS widens `transition.ease` to `number[]` instead of the literal tuple
// Framer Motion expects, which is what was throwing the "not assignable to
// type 'Variant'" error in your terminal.

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.07 },
    }),
};
const staggerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    storeId?: { storeName: string };
    categoryId?: { name: string };
    unit?: string;
    weight?: string;
}

interface Category {
    _id: string;
    name: string;
    image?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`rounded-lg animate-pulse ${className}`}
            style={{ backgroundColor: "#EFE6D8" }}
        />
    );
}

function ProductCardSkeleton() {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#D2C4B9" }}>
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

function StoreSkeleton() {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#D2C4B9" }}>
            <Skeleton className="h-56 w-full rounded-none" />
            <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action: string }) {
    return (
        <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="flex items-end justify-between mb-6"
        >
            <span className="text-xl font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}>
                {title}
            </span>
            <motion.span
                whileHover={{ x: 3 }} transition={{ duration: 0.2 }}
                className="text-xs font-semibold cursor-pointer flex items-center gap-1"
                style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}
            >
                {action} <ArrowRight size={11} />
            </motion.span>
        </motion.div>
    );
}

// ─── Card Shell ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0px 12px 32px rgba(194,163,131,0.22)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`rounded-xl overflow-hidden bg-white border ${className}`}
            style={{ borderColor: "#D2C4B9", boxShadow: "0px 1px 4px rgba(0,0,0,0.06)" }}
        >
            {children}
        </motion.div>
    );
}

// ─── Add to Cart Button ────────────────────────────────────────────────────────

function AddToCartButton({ onAdd, icon = false, productId }: { onAdd?: () => void; icon?: boolean; productId?: string }) {
    const [added, setAdded] = useState(false);
    const addToCart = useCartStore((s) => s.addToCart);

    const handleClick = async () => {
        if (productId) {
            await addToCart(productId, 1);
        }
        setAdded(true);
        onAdd?.();
        setTimeout(() => setAdded(false), 1800);
    };

    if (icon) {
        return (
            <motion.button
                whileTap={{ scale: 0.88 }} onClick={handleClick}
                className="w-10 h-10 rounded-lg flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: added ? "#376847" : "#735A3E", boxShadow: "0px 2px 12px rgba(194,163,131,0.22)" }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {added
                        ? <motion.span key="c" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Check size={14} color="white" /></motion.span>
                        : <motion.span key="p" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Plus size={14} color="white" /></motion.span>
                    }
                </AnimatePresence>
            </motion.button>
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.94 }} onClick={handleClick}
            className="flex items-center gap-2 rounded-lg border-none cursor-pointer text-white transition-colors duration-300"
            style={{ backgroundColor: added ? "#376847" : "#735A3E", padding: "8px 16px", fontFamily: "'Inter', sans-serif", fontSize: 14 }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {added
                    ? <motion.span key="c" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2"><Check size={14} /> Added!</motion.span>
                    : <motion.span key="a" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2"><ShoppingCart size={14} /> Add to Cart</motion.span>
                }
            </AnimatePresence>
        </motion.button>
    );
}

// ─── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <Star size={13} fill="#C2A383" color="#C2A383" />
            <span className="text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif", color: "#1D1B16" }}>
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

// ─── Store Status Badge ────────────────────────────────────────────────────────

function StoreStatusBadge({ status, index }: { status: StoreProfileSummary["status"]; index: number }) {
    const config = {
        OPEN:   { bg: "rgba(55,104,71,0.18)",   dot: "#376847", text: "#376847", label: "Open" },
        BUSY:   { bg: "rgba(180,120,0,0.18)",    dot: "#B47800", text: "#B47800", label: "Busy" },
        CLOSED: { bg: "rgba(180,60,60,0.18)",    dot: "#B43C3C", text: "#B43C3C", label: "Closed" },
    }[status];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="absolute top-4 right-4 rounded-full px-3 py-1 flex items-center gap-1.5"
            style={{ backgroundColor: config.bg, backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: config.dot }}
            />
            <span className="text-xs font-bold" style={{ color: config.text }}>
                {config.label}
            </span>
        </motion.div>
    );
}

// ─── Category emoji fallback map ──────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
    fruits: "🍊", dairy: "🥛", bakery: "🍞", snacks: "🌰",
    vegetables: "🥕", pantry: "🫙", meat: "🥩", beverages: "☕",
    default: "🛒",
};
function categoryEmoji(name: string): string {
    return CATEGORY_EMOJI[name.toLowerCase()] ?? CATEGORY_EMOJI.default;
}

// ─── Store card background (deterministic from name) ─────────────────────────

const STORE_CARD_COLORS = ["#2C2018", "#1A2E1C", "#1C1A2E", "#2E1C1A", "#18282E"];
function storeCardColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return STORE_CARD_COLORS[Math.abs(hash) % STORE_CARD_COLORS.length];
}

// ─── Product emoji from category name ─────────────────────────────────────────

const PRODUCT_EMOJI: Record<string, string> = {
    dairy: "🧀", fruits: "🍇", bakery: "🍞", snacks: "🥣",
    vegetables: "🥕", pantry: "🫙", meat: "🥩", beverages: "☕",
    default: "🛒",
};
function productEmoji(cat?: string): string {
    if (!cat) return PRODUCT_EMOJI.default;
    return PRODUCT_EMOJI[cat.toLowerCase()] ?? PRODUCT_EMOJI.default;
}

const PRODUCT_BG: Record<string, string> = {
    dairy: "#F0EBE3", fruits: "#D8E8D4", bakery: "#8B7355", snacks: "#C8A060",
    vegetables: "#D8E8D4", beverages: "#2C2018", default: "#EFE6D8",
};
function productBg(cat?: string): string {
    if (!cat) return PRODUCT_BG.default;
    return PRODUCT_BG[cat.toLowerCase()] ?? PRODUCT_BG.default;
}

// ─── Estimated delivery window, derived from distance ─────────────────────────

function etaWindow(distanceKm: number | null): string {
    if (distanceKm == null) return "—";
    if (distanceKm < 1) return "10–15";
    if (distanceKm < 3) return "15–25";
    return "25–40";
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerHome() {
    const navigate = useNavigate();

    // ── Location / profile state, from useLocationStore ───────────────────────
    const activeAddress = useLocationStore((s) => s.activeAddress);
    const activeCoords = useLocationStore((s) => s.activeCoords);
    const profileLoading = useLocationStore((s) => s.profileLoading);
    const showLocationModal = useLocationStore((s) => s.showLocationModal);
    const fetchProfile = useLocationStore((s) => s.fetchProfile);
    const onLocationSaved = useLocationStore((s) => s.onLocationSaved);
    const openLocationModal = useLocationStore((s) => s.openLocationModal);

    // ── Nearby stores, from useStoresListStore ─────────────────────────────────
    const nearbyStores = useStoresListStore((s) => s.stores);
    const loadingNearby = useStoresListStore((s) => s.storesLoading);
    const fetchNearbyStores = useStoresListStore((s) => s.fetchNearbyStores);

    // ── Categories / products — no shared store yet, kept local for now ───────
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingTrending, setLoadingTrending] = useState(true);

    // ── 1. Fetch profile on mount ─────────────────────────────────────────────
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ── 2. Fetch nearby stores when we have coordinates ───────────────────────
    useEffect(() => {
        if (!activeCoords) return;
        fetchNearbyStores(activeCoords.lat, activeCoords.lng, 10);
    }, [activeCoords, fetchNearbyStores]);

    // ── 3. Fetch categories, popular, trending in parallel ────────────────────
    useEffect(() => {
        api.get("/customer/categories")
            .then(({ data }) => setCategories(data.categories ?? []))
            .catch(console.error)
            .finally(() => setLoadingCategories(false));

        api.get("/customer/products/popular")
            .then(({ data }) => setPopularProducts(data.products ?? []))
            .catch(console.error)
            .finally(() => setLoadingPopular(false));

        api.get("/customer/products/trending")
            .then(({ data }) => setTrendingProducts(data.products ?? []))
            .catch(console.error)
            .finally(() => setLoadingTrending(false));
    }, []);

    // ── Navigate to a store's menu page ────────────────────────────────────────
    const goToStore = (storeId: string) => {
        navigate(`/customer/store/${storeId}`);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#FFF9EF", fontFamily: "'Inter', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            {/* Location picker modal */}
            <AnimatePresence>
                {showLocationModal && (
                    <LocationPickerModal onSaved={onLocationSaved} />
                )}
            </AnimatePresence>

            <main className="mx-auto px-10 py-12 flex flex-col gap-14" style={{ maxWidth: 1200 }}>

                {/* ── HERO BANNER ── */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ height: 480, boxShadow: "0px 8px 40px rgba(194,163,131,0.30)" }}
                >
                    <div
                        className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.02]"
                        style={{ background: "linear-gradient(110deg, #6B4A20 0%, #9C7040 30%, #C8963C 55%, #D4A850 75%, #8B6020 100%)" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,249,239,0.97) 0%, rgba(255,249,239,0.75) 38%, rgba(255,249,239,0.2) 60%, rgba(255,249,239,0) 100%)" }} />
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-24 top-16 text-8xl opacity-30 pointer-events-none select-none">🌾</motion.div>
                    <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                        className="absolute right-52 bottom-20 text-6xl opacity-20 pointer-events-none select-none">🍅</motion.div>

                    <div className="absolute inset-0 flex items-center" style={{ padding: 56 }}>
                        <div className="flex flex-col gap-4" style={{ maxWidth: 420 }}>
                            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                                className="flex w-fit items-center gap-1.5 rounded-full px-3 py-1"
                                style={{ backgroundColor: "rgba(128,180,141,0.2)" }}>
                                <Leaf size={11} color="#376847" />
                                <span className="text-xs font-medium" style={{ color: "#376847" }}>Curated Selection</span>
                            </motion.div>

                            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.55 }}
                                className="font-bold leading-tight m-0"
                                style={{ fontFamily: "'Inter', sans-serif", fontSize: 34, color: "#735A3E", lineHeight: "42px" }}>
                                {activeAddress
                                    ? <>Delivering to <br /><span style={{ color: "#4E453D" }}>{activeAddress.label}</span></>
                                    : <>Freshness Delivered<br />To Your Doorstep</>
                                }
                            </motion.h1>

                            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-sm m-0" style={{ lineHeight: "22px", color: "#4E453D", maxWidth: 384 }}>
                                {activeAddress
                                    ? activeAddress.address
                                    : "Experience the warmth of your local neighbourhood market from the comfort of your home."
                                }
                            </motion.p>

                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                                className="flex items-center gap-4 pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.04, boxShadow: "0px 8px 24px rgba(115,90,62,0.35)" }}
                                    whileTap={{ scale: 0.96 }}
                                    className="text-white rounded-xl font-semibold cursor-pointer border-none"
                                    style={{ backgroundColor: "#735A3E", padding: "14px 28px", fontFamily: "'Inter', sans-serif", fontSize: 15 }}
                                    onClick={() => !activeAddress && openLocationModal()}
                                >
                                    {activeAddress ? "Free delivery over ₹300" : "Set delivery location"}
                                </motion.button>
                                {activeAddress && (
                                    <span className="text-xs italic" style={{ color: "#80756B" }}>*Limited time, new users only</span>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* ── BROWSE BY CATEGORY ── */}
                <section>
                    <SectionHeader title="Browse by Category" action="View All Categories" />
                    {loadingCategories ? (
                        <div className="flex justify-between gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-4">
                                    <Skeleton className="w-32 h-32 rounded-full" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#9C8C7C" }}>No categories yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="flex justify-between flex-wrap gap-4">
                            {categories.slice(0, 6).map((cat, i) => (
                                <motion.button key={cat._id} variants={fadeUp} custom={i}
                                    whileHover={{ y: -6 }} whileTap={{ scale: 0.94 }}
                                    className="flex flex-col items-center gap-4 cursor-pointer border-none bg-transparent">
                                    <motion.div whileHover={{ boxShadow: "0px 8px 24px rgba(194,163,131,0.30)", borderColor: "#C2A383" }}
                                        className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden transition-shadow"
                                        style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2C4B9", boxShadow: "0px 2px 12px rgba(194,163,131,0.14)" }}>
                                        {cat.image
                                            ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                            : <span className="text-5xl select-none">{categoryEmoji(cat.name)}</span>
                                        }
                                    </motion.div>
                                    <span className="font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#1D1B16" }}>{cat.name}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* ── POPULAR IN THE NEIGHBORHOOD ── */}
                <section>
                    <SectionHeader title="Popular in the Neighborhood" action="View All" />
                    {loadingPopular ? (
                        <div className="grid grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : popularProducts.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#9C8C7C" }}>No products available yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-4 gap-6">
                            {popularProducts.slice(0, 4).map((p) => {
                                const catName = p.categoryId?.name;
                                return (
                                    <motion.div key={p._id} variants={scaleIn}>
                                        <Card className="flex flex-col h-full">
                                            <div className="p-[17px] pb-0">
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                                                    className="h-48 rounded-lg flex items-center justify-center text-6xl overflow-hidden"
                                                    style={{ backgroundColor: productBg(catName) }}>
                                                    {p.images?.[0]
                                                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                                        : <span className="select-none">{productEmoji(catName)}</span>
                                                    }
                                                </motion.div>
                                            </div>
                                            <div className="px-[17px] pt-[17px] flex flex-col gap-0.5 flex-1">
                                                <span className="text-xs font-medium block" style={{ color: "#376847" }}>{p.storeId?.storeName}</span>
                                                <span className="font-semibold block" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{p.name}</span>
                                                <span className="text-sm block" style={{ color: "#D2C4B9" }}>{p.unit || p.weight || catName}</span>
                                            </div>
                                            <div className="px-[17px] py-4 flex items-center justify-between">
                                                <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "#735A3E" }}>₹{p.price}</span>
                                                <AddToCartButton productId={p._id} />
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

                {/* ── NEARBY STORES ── */}
                <section>
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex items-center justify-between mb-6">
                        <span className="text-xl font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}>
                            Nearby Stores
                            {activeCoords && (
                                <span className="ml-2 text-sm font-normal" style={{ color: "#9C8C7C" }}>
                                    within 10 km
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {[ChevronLeft, ChevronRight].map((Icon, i) => (
                                <motion.button key={i}
                                    whileHover={{ backgroundColor: "#FDF3E3", scale: 1.06 }}
                                    whileTap={{ scale: 0.92 }}
                                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center cursor-pointer transition-colors"
                                    style={{ borderColor: "#D2C4B9" }}>
                                    <Icon size={14} color="#735A3E" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {!activeCoords && !profileLoading ? (
                        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                            className="rounded-xl border p-8 text-center"
                            style={{ borderColor: "#D2C4B9", backgroundColor: "#F9F3EA" }}>
                            <MapPin size={32} color="#C2A383" className="mx-auto mb-3" />
                            <p className="font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}>
                                Set your location to see nearby stores
                            </p>
                            <p className="text-sm mb-4" style={{ color: "#80756B" }}>
                                We'll show you stores that deliver to your area.
                            </p>
                            <motion.button whileTap={{ scale: 0.96 }}
                                onClick={openLocationModal}
                                className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                                style={{ backgroundColor: "#735A3E", color: "#FFF9EF" }}>
                                Add delivery address
                            </motion.button>
                        </motion.div>
                    ) : loadingNearby ? (
                        <div className="grid grid-cols-2 gap-6">
                            <StoreSkeleton /><StoreSkeleton />
                        </div>
                    ) : nearbyStores.length === 0 ? (
                        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "#D2C4B9", backgroundColor: "#F9F3EA" }}>
                            <p className="font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}>No stores nearby yet</p>
                            <p className="text-sm" style={{ color: "#80756B" }}>We're growing! Check back soon for stores in your area.</p>
                        </div>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-2 gap-6">
                            {nearbyStores.slice(0, 4).map((s, i) => (
                                <motion.div key={s._id} variants={fadeUp} custom={i}>
                                    <Card>
                                        <div
                                            onClick={() => goToStore(s._id)}
                                            className="relative h-56 flex items-center justify-center overflow-hidden cursor-pointer"
                                            style={{ backgroundColor: storeCardColor(s.storeName) }}>

                                            {s.logoUrl
                                                ? <img src={s.logoUrl} alt={s.storeName} className="w-full h-full object-cover" />
                                                : <span className="text-8xl opacity-20 select-none">🏪</span>
                                            }

                                            <StoreStatusBadge status={s.status} index={i} />

                                            <div className="absolute bottom-4 left-4 rounded-full px-3 py-1 flex items-center gap-1.5"
                                                style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
                                                <MapPin size={11} color="white" />
                                                <span className="text-xs font-medium text-white">
                                                    {s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : "—"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between p-6">
                                            <div
                                                onClick={() => goToStore(s._id)}
                                                className="cursor-pointer"
                                            >
                                                <span className="font-semibold text-lg block" style={{ fontFamily: "'Inter', sans-serif", color: "#1D1B16" }}>{s.storeName}</span>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {s.averageRating > 0 && (
                                                        <StarRating rating={s.averageRating} />
                                                    )}
                                                    <span style={{ color: "#D2C4B9" }}>·</span>
                                                    <Clock size={12} color="#4E453D" />
                                                    <span className="text-sm" style={{ color: "#4E453D" }}>
                                                        {etaWindow(s.distanceKm)} mins
                                                    </span>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ backgroundColor: "#E3CCB4" }}
                                                whileTap={{ scale: 0.94 }}
                                                disabled={s.status === "CLOSED"}
                                                onClick={() => goToStore(s._id)}
                                                className="flex-shrink-0 rounded-lg border-none cursor-pointer text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ backgroundColor: "#EEDDC7", padding: "8px 18px", color: "#6D614F", fontFamily: "'Inter', sans-serif" }}>
                                                {s.status === "CLOSED" ? "Closed" : "View Menu"}
                                            </motion.button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* ── TRENDING TODAY ── */}
                <section className="pb-12">
                    <SectionHeader title="Trending Today" action="Explore More" />
                    {loadingTrending ? (
                        <div className="grid grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : trendingProducts.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "#9C8C7C" }}>No products yet.</p>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="show"
                            viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-4 gap-6">
                            {trendingProducts.slice(0, 4).map((item) => {
                                const catName = item.categoryId?.name;
                                return (
                                    <motion.div key={item._id} variants={scaleIn}>
                                        <Card className="flex flex-col h-full">
                                            <div className="p-[17px] pb-0">
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                                                    className="h-48 rounded-lg flex items-center justify-center text-6xl overflow-hidden"
                                                    style={{ backgroundColor: productBg(catName) }}>
                                                    {item.images?.[0]
                                                        ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                        : <span className="select-none">{productEmoji(catName)}</span>
                                                    }
                                                </motion.div>
                                            </div>
                                            <div className="px-[17px] pt-[17px] flex-1">
                                                <span className="text-xs font-medium block" style={{ color: "#376847" }}>{item.storeId?.storeName}</span>
                                                <span className="font-semibold block" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{item.name}</span>
                                                <span className="text-sm block" style={{ color: "#D2C4B9" }}>{item.unit || item.weight || catName}</span>
                                            </div>
                                            <div className="px-[17px] py-4 flex items-center justify-between">
                                                <span className="font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "#735A3E" }}>₹{item.price}</span>
                                                <AddToCartButton productId={item._id} icon />
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

            </main>

            {/* ── Footer ── */}
            <footer className="border-t py-8 px-10" style={{ borderColor: "#D2C4B9", backgroundColor: "#FFF9EF" }}>
                <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200 }}>
                    <div>
                        <span className="text-lg italic font-bold" style={{ fontFamily: "'Inter', sans-serif", color: "#735A3E" }}>QuickKart</span>
                        <p className="text-xs mt-1" style={{ color: "#80756B" }}>© 2026 QuickKart Neighbourhood Market. All rights reserved.</p>
                    </div>
                    <div className="flex gap-6">
                        {["About Us", "Contact", "Privacy Policy", "Terms of Service"].map((link) => (
                            <motion.a key={link} whileHover={{ color: "#735A3E" }} href="#"
                                className="text-xs transition-colors" style={{ color: "#80756B", fontFamily: "'Inter', sans-serif" }}>
                                {link}
                            </motion.a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}