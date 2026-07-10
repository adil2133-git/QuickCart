import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, MapPin, Star, ShoppingCart, ChevronDown,
  Grid3X3, List, Store, Zap, ArrowRight, BadgePercent, Leaf, Clock,
  Navigation, Check, Package, Wheat, Bell, User, ChevronRight as ChevronRightIcon,
  X, ChevronLeft, Sparkles, Filter,
} from "lucide-react";

// ─── Color tokens (HTML theme) ────────────────────────────────────────────────
const C = {
  bg:            "#FFF9EF",
  surface:       "#FFFFFF",
  surfaceCtx:    "#F3EDE4",
  surfaceCtxLow: "#F9F3EA",
  surfaceCtxHigh:"#EDE7DE",
  primary:       "#735A3E",
  primaryCont:   "#C2A383",
  onPrimary:     "#FFFFFF",
  secondary:     "#685D4B",
  secondaryCont: "#EEDDC7",
  onSecondaryCont:"#6D614F",
  tertiary:      "#376847",
  tertiaryCont:  "#80B48D",
  outline:       "#80756B",
  outlineVar:    "#D2C4B9",
  onSurface:     "#1D1B16",
  onSurfaceVar:  "#4E453D",
  error:         "#BA1A1A",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type BadgeType = "Best Price" | "Nearest" | "Top Rated" | "Open Now" | "Organic" | "Fast Delivery" | "Artisanal" | "Best Value";
type ViewMode  = "grid" | "list";

interface StoreOffer {
  id: string; name: string; rating: number; distance: string; price: number;
  badge?: BadgeType; isOpen: boolean; highlighted?: boolean;
}
interface Product {
  id: string; name: string; category: string; subtitle: string;
  emoji: string; topCompared: boolean; stores: StoreOffer[];
}
interface StoreProfile {
  name: string; emoji: string; tagline: string; rating: number;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id:"1", name:"Farm Fresh Milk (1L)", category:"Dairy & Eggs", subtitle:"Daily Essential",
    emoji:"🥛", topCompared:true,
    stores:[
      { id:"s1", name:"Fresh Mart",  rating:4.2, distance:"2 km",  price:32, badge:"Open Now",   isOpen:true },
      { id:"s2", name:"Daily Needs", rating:4.5, distance:"3 km",  price:30, badge:"Best Price", isOpen:true, highlighted:true },
      { id:"s3", name:"Green Basket",rating:4.1, distance:"1 km",  price:34, badge:"Nearest",    isOpen:false },
      { id:"s4", name:"Organic Hub", rating:4.7, distance:"2.5 km",price:36, badge:"Organic",    isOpen:true },
    ],
  },
  {
    id:"2", name:"Whole Wheat Bread", category:"Bakery", subtitle:"Freshly Baked",
    emoji:"🍞", topCompared:false,
    stores:[
      { id:"s5", name:"Artisan Bakery",rating:4.9, distance:"1.5 km",price:45, badge:"Artisanal",  isOpen:true },
      { id:"s6", name:"Fresh Mart",    rating:4.2, distance:"2 km",  price:40, badge:"Best Value", isOpen:true, highlighted:true },
      { id:"s7", name:"Nature Foods",  rating:4.3, distance:"3.2 km",price:42, isOpen:false },
    ],
  },
  {
    id:"3", name:"Organic Tomatoes", category:"Fruits & Vegetables", subtitle:"Farm to Table",
    emoji:"🍅", topCompared:true,
    stores:[
      { id:"s8",  name:"Organic Hub",  rating:4.7, distance:"2.5 km",price:28, badge:"Organic",      isOpen:true, highlighted:true },
      { id:"s9",  name:"Green Basket", rating:4.1, distance:"1 km",  price:32, badge:"Nearest",       isOpen:true },
      { id:"s10", name:"Nature Foods", rating:4.3, distance:"3.2 km",price:25, badge:"Best Price",    isOpen:false },
      { id:"s11", name:"Daily Needs",  rating:4.5, distance:"3 km",  price:30, badge:"Fast Delivery", isOpen:true },
    ],
  },
  {
    id:"4", name:"Brown Eggs (12 Pack)", category:"Dairy & Eggs", subtitle:"Free Range",
    emoji:"🥚", topCompared:false,
    stores:[
      { id:"s12", name:"Organic Hub",  rating:4.7, distance:"2.5 km",price:89, badge:"Organic",    isOpen:true },
      { id:"s13", name:"Fresh Mart",   rating:4.2, distance:"2 km",  price:79, badge:"Best Price", isOpen:true, highlighted:true },
      { id:"s14", name:"Green Basket", rating:4.1, distance:"1 km",  price:85, badge:"Nearest",    isOpen:true },
    ],
  },
  {
    id:"5", name:"Greek Yogurt", category:"Dairy & Eggs", subtitle:"Probiotic Rich",
    emoji:"🫙", topCompared:false,
    stores:[
      { id:"s15", name:"Daily Needs",  rating:4.5, distance:"3 km",  price:65, badge:"Best Price", isOpen:true, highlighted:true },
      { id:"s16", name:"Organic Hub",  rating:4.7, distance:"2.5 km",price:72, badge:"Organic",    isOpen:true },
      { id:"s17", name:"Fresh Mart",   rating:4.2, distance:"2 km",  price:68, badge:"Open Now",   isOpen:true },
    ],
  },
];

const STORES: StoreProfile[] = [
  { name:"Fresh Mart",     emoji:"🛒", tagline:"Everyday essentials", rating:4.2 },
  { name:"Daily Needs",    emoji:"🧺", tagline:"Local convenience",   rating:4.5 },
  { name:"Green Basket",   emoji:"🥦", tagline:"Closest to you",      rating:4.1 },
  { name:"Artisan Bakery", emoji:"🥐", tagline:"Baked fresh daily",   rating:4.9 },
  { name:"Organic Hub",    emoji:"🌿", tagline:"Certified organic",   rating:4.7 },
  { name:"Nature Foods",   emoji:"🍃", tagline:"Farm direct",         rating:4.3 },
];

const CATEGORIES = ["Fruits & Vegetables","Dairy & Eggs","Bakery","Organic","Snacks","Beverages","Frozen Foods"];
const DISTANCE_OPTIONS = ["1 km","2 km","5 km","10 km"];
const RATING_OPTIONS = [4.5, 4.0, 3.5];
const SORT_OPTIONS = ["Best Match", "Distance", "Rating", "Lowest Price", "Highest Price"];

// ─── Badge Config ──────────────────────────────────────────────────────────────
const BADGE_CFG: Record<BadgeType,{bg:string;border:string;text:string;icon:React.ReactNode}> = {
  "Best Price":   { bg:"bg-[#EDF7ED]", border:"border-[#A8D5A8]", text:"text-[#376847]", icon:<Zap size={9}/> },
  "Best Value":   { bg:"bg-[#EDF7ED]", border:"border-[#A8D5A8]", text:"text-[#376847]", icon:<Zap size={9}/> },
  Nearest:        { bg:"bg-[#E8F0FB]", border:"border-[#A8C0E8]", text:"text-[#3D5A9A]", icon:<Navigation size={9}/> },
  "Top Rated":    { bg:"bg-[#FFF3CD]", border:"border-[#D4B870]", text:"text-[#7A5C00]", icon:<Star size={9}/> },
  "Open Now":     { bg:"bg-[#E8F5E9]", border:"border-[#9DC89D]", text:"text-[#2E6B2E]", icon:<Clock size={9}/> },
  Organic:        { bg:"bg-[#F0FAF0]", border:"border-[#88CC88]", text:"text-[#376847]", icon:<Leaf size={9}/> },
  "Fast Delivery":{ bg:"bg-[#FFF0E0]", border:"border-[#E0A870]", text:"text-[#8B5A00]", icon:<Zap size={9}/> },
  Artisanal:      { bg:"bg-[#F3EDE4]", border:"border-[#C2A383]", text:"text-[#735A3E]", icon:<Star size={9}/> },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          fill={i <= Math.floor(rating) ? C.primaryCont : "transparent"}
          color={C.primaryCont}
          strokeWidth={i <= Math.floor(rating) ? 0 : 1.5}
        />
      ))}
      <span className="text-[11px] ml-0.5" style={{ color: C.onSurfaceVar }}>({rating.toFixed(1)})</span>
    </div>
  );
}

function StoreBadge({ badge }: { badge: BadgeType }) {
  const c = BADGE_CFG[badge];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${c.bg} ${c.border} ${c.text}`}>
      {c.icon}{badge}
    </span>
  );
}

// ─── Store Card ────────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreOffer }) {
  const [added, setAdded] = useState(false);
  const hi = store.highlighted;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: hi ? `0 16px 48px rgba(115,90,62,0.22)` : "0 8px 32px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`relative flex flex-col justify-between rounded-xl p-4 flex-1 min-w-[180px] overflow-hidden ${
        hi ? "border-2 shadow-md" : "border shadow-sm"
      }`}
      style={{
        backgroundColor: hi ? C.surfaceCtxHigh : C.surface,
        borderColor: hi ? C.primaryCont : C.outlineVar,
      }}
    >
      {hi && store.badge && (
        <div
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-wider"
          style={{ backgroundColor: C.primaryCont, color: C.onSurface }}
        >
          {store.badge}
        </div>
      )}
      {!hi && store.badge && (
        <div className="absolute top-2.5 right-2.5">
          <StoreBadge badge={store.badge} />
        </div>
      )}

      <div className="mb-3 mt-0.5">
        <p className="font-semibold text-sm pr-16" style={{ fontFamily:"'Playfair Display',serif", color: C.secondary }}>
          {store.name}
        </p>
        <div className="mt-1.5">
          <StarRow rating={store.rating} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="text-lg font-bold leading-none" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>₹{store.price}</p>
          <p className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: C.onSurfaceVar }}>
            <Navigation size={10} /> {store.distance} Away
            {!store.isOpen && <span className="ml-1 text-[#BA1A1A] font-medium">· Closed</span>}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setAdded(true); setTimeout(()=>setAdded(false),1900); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300"
          style={{ backgroundColor: added ? C.tertiary : C.primary, color: C.onPrimary }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span key="c" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}} className="flex items-center gap-1">
                <Check size={12}/> Done
              </motion.span>
            ) : (
              <motion.span key="a" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}} className="flex items-center gap-1">
                <ShoppingCart size={12}/> Add
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

function ViewMoreCard({ count }: { count: number }) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: C.primary }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 flex-1 min-w-[160px] cursor-pointer group"
      style={{ borderColor: C.outlineVar, backgroundColor: C.surfaceCtxLow }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200"
        style={{ backgroundColor: C.surfaceCtx }}
      >
        <Store size={22} style={{ color: C.outline }} className="group-hover:scale-110 transition-transform" />
      </div>
      <p className="text-sm font-semibold text-center" style={{ color: C.secondary }}>
        View {count} more stores
      </p>
      <p className="text-[11px] text-center mt-0.5" style={{ color: C.onSurfaceVar }}>
        carrying this item nearby
      </p>
    </motion.div>
  );
}

// ─── Product Section ───────────────────────────────────────────────────────────
function ProductSection({ product, viewMode }: { product: Product; viewMode: ViewMode }) {
  const visible = product.stores.slice(0, 3);
  const extra   = product.stores.length - 3;

  return (
    <motion.section
      initial={{ opacity:0, y:20 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:"-50px" }}
      transition={{ duration:0.45, ease:"easeOut" }}
    >
      <div className="flex items-end justify-between mb-4 pb-3 border-b" style={{ borderColor: C.outlineVar }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border overflow-hidden flex-shrink-0"
            style={{ backgroundColor:`${C.primaryCont}22`, borderColor: C.outlineVar }}
          >
            {product.emoji}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
              {product.name}
            </h2>
            <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>
              {product.category === "Dairy & Eggs" ? <Package size={12}/> : product.category === "Bakery" ? <Wheat size={12}/> : <Leaf size={12}/>}
              {product.category} · {product.subtitle}
            </p>
          </div>
        </div>
        {product.topCompared && (
          <span
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ backgroundColor:`${C.primaryCont}18`, color: C.primary }}
          >
            Top Compared
          </span>
        )}
      </div>

      <div className={`flex gap-4 ${viewMode === "list" ? "flex-col sm:flex-row" : "flex-wrap sm:flex-nowrap"} overflow-x-auto pb-1`}>
        {visible.map(s => <StoreCard key={s.id} store={s} />)}
        {extra > 0 && <ViewMoreCard count={extra} />}
      </div>
    </motion.section>
  );
}

// ─── Quick filter pill ─────────────────────────────────────────────────────────
function QuickPill({
  icon, label, active, onClick, badgeCount,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badgeCount?: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors duration-150 flex-shrink-0"
      style={{
        backgroundColor: active ? C.primary : C.surface,
        borderColor:     active ? C.primary : C.outlineVar,
        color:           active ? "#FFFFFF" : C.onSurfaceVar,
        boxShadow:       active ? "0 2px 10px rgba(115,90,62,0.25)" : "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {icon}
      {label}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span
          className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black"
          style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : C.primaryCont, color: active ? "#FFFFFF" : C.onSurface }}
        >
          {badgeCount}
        </span>
      )}
    </motion.button>
  );
}

// ─── Active filter chip ────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: C.secondaryCont, borderColor: `${C.primaryCont}80`, color: C.onSecondaryCont }}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
        style={{ backgroundColor: `${C.primary}1A` }}
      >
        <X size={10} style={{ color: C.primary }} />
      </button>
    </motion.span>
  );
}

// ─── Compact Featured Store Card ──────────────────────────────────────────────
function FeaturedStoreCard({ profile, active, onClick }: { profile: StoreProfile; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      aria-pressed={active}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border flex-shrink-0 min-w-[90px] transition-colors duration-150 snap-start relative"
      style={{
        backgroundColor: active ? C.surfaceCtxHigh : C.surface,
        borderColor: active ? C.primaryCont : C.outlineVar,
        boxShadow: active ? "0 4px 16px rgba(115,90,62,0.16)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border"
        style={{ backgroundColor: `${C.primaryCont}22`, borderColor: C.outlineVar }}
      >
        {profile.emoji}
      </div>
      <p className="text-xs font-bold leading-tight text-center" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
        {profile.name}
      </p>
      <div className="flex items-center gap-1">
        <Star size={10} fill={C.primaryCont} color={C.primaryCont} />
        <span className="text-[10px]" style={{ color: C.onSurfaceVar }}>{profile.rating.toFixed(1)}</span>
      </div>
      {active && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.tertiary }}
        >
          <Check size={11} color="#FFFFFF" />
        </span>
      )}
    </motion.button>
  );
}

function FeaturedStoresRail({
  selectedStores, toggleStore,
}: { selectedStores: string[]; toggleStore: (s: string) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => railRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section className="relative py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
          <Sparkles size={14} style={{ color: C.primary }} /> Featured Stores
        </h3>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scrollBy(-200)}
            aria-label="Scroll stores left"
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ borderColor: C.outlineVar, color: C.onSurfaceVar }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollBy(200)}
            aria-label="Scroll stores right"
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ borderColor: C.outlineVar, color: C.onSurfaceVar }}
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
      <div ref={railRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x">
        {STORES.map(s => (
          <FeaturedStoreCard
            key={s.name}
            profile={s}
            active={selectedStores.includes(s.name)}
            onClick={() => toggleStore(s.name)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Filter drawer ──────────────────────────────────────────────────────────────
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedStores: string[];
  toggleStore: (s: string) => void;
  selectedCategories: string[];
  toggleCategory: (c: string) => void;
  minRating: number | null;
  setMinRating: (r: number | null) => void;
  maxDistance: string | null;
  setMaxDistance: (d: string | null) => void;
  openNow: boolean;
  setOpenNow: (v: boolean) => void;
  onClear: () => void;
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b" style={{ borderColor: C.outlineVar }}>
      <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.onSurfaceVar }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function CheckRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer group">
      <span className="flex items-center gap-3">
        <span
          className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-150 flex-shrink-0"
          style={{ backgroundColor: checked ? C.primary : "transparent", borderColor: checked ? C.primary : C.outlineVar }}
        >
          {checked && <Check size={13} color="#FFFFFF" />}
        </span>
        <span>
          <span className="text-sm font-medium block" style={{ color: C.onSurface }}>{label}</span>
          {sub && <span className="text-[11px] block" style={{ color: C.onSurfaceVar }}>{sub}</span>}
        </span>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

function FilterDrawer(props: FilterDrawerProps) {
  const {
    open, onClose, selectedStores, toggleStore, selectedCategories, toggleCategory,
    minRating, setMinRating, maxDistance, setMaxDistance, openNow, setOpenNow, onClear,
  } = props;
  const [storeQuery, setStoreQuery] = useState("");

  const filteredStores = STORES.filter(s => s.name.toLowerCase().includes(storeQuery.toLowerCase()));

  const activeCount =
    selectedStores.length + selectedCategories.length + (minRating ? 1 : 0) + (maxDistance ? 1 : 0) + (openNow ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(29,27,22,0.45)" }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed z-[61] flex flex-col
                       inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
                       sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-full sm:w-[400px] sm:rounded-t-none sm:rounded-l-3xl"
            style={{ backgroundColor: C.surface, boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" }}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: C.outlineVar }} />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              <h3 className="text-lg font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
                Filters {activeCount > 0 && <span style={{ color: C.primary }}>({activeCount})</span>}
              </h3>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ backgroundColor: C.surfaceCtx, color: C.onSurfaceVar }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <DrawerSection title="Availability">
                <CheckRow label="Open Now" sub="Only show stores currently open" checked={openNow} onChange={() => setOpenNow(!openNow)} />
              </DrawerSection>

              <DrawerSection title="Rating">
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? null : r)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      style={{
                        backgroundColor: minRating === r ? C.primary : C.surfaceCtxLow,
                        borderColor: minRating === r ? C.primary : C.outlineVar,
                        color: minRating === r ? "#FFFFFF" : C.onSurfaceVar,
                      }}
                    >
                      <Star size={12} fill={minRating === r ? "#FFFFFF" : "none"} /> {r.toFixed(1)}+
                    </button>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Distance">
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setMaxDistance(maxDistance === d ? null : d)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      style={{
                        backgroundColor: maxDistance === d ? C.primary : C.surfaceCtxLow,
                        borderColor: maxDistance === d ? C.primary : C.outlineVar,
                        color: maxDistance === d ? "#FFFFFF" : C.onSurfaceVar,
                      }}
                    >
                      Within {d}
                    </button>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Categories">
                <div className="space-y-0.5">
                  {CATEGORIES.map(c => (
                    <CheckRow key={c} label={c} checked={selectedCategories.includes(c)} onChange={() => toggleCategory(c)} />
                  ))}
                </div>
              </DrawerSection>

              <div className="py-5">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.onSurfaceVar }}>
                  Stores
                </h4>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.outline }} />
                  <input
                    value={storeQuery}
                    onChange={e => setStoreQuery(e.target.value)}
                    placeholder="Search stores..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: C.surfaceCtxLow, borderColor: C.outlineVar, color: C.onSurface }}
                  />
                </div>
                <div className="space-y-0.5 max-h-56 overflow-y-auto">
                  {filteredStores.length > 0 ? filteredStores.map(s => (
                    <CheckRow
                      key={s.name}
                      label={s.name}
                      sub={s.tagline}
                      checked={selectedStores.includes(s.name)}
                      onChange={() => toggleStore(s.name)}
                    />
                  )) : (
                    <p className="text-xs py-3" style={{ color: C.onSurfaceVar }}>No stores match “{storeQuery}”.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              <button
                onClick={onClear}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-colors hover:opacity-80"
                style={{ borderColor: C.outlineVar, color: C.onSurfaceVar, backgroundColor: C.surface }}
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ backgroundColor: C.primary, color: C.onPrimary }}
              >
                Show results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────
function SortDropdown({ sortBy, setSortBy }: { sortBy: string; setSortBy: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
        style={{ backgroundColor: C.surface, borderColor: C.outlineVar, color: C.onSurface }}
      >
        <Filter size={14} style={{ color: C.outline }} />
        Sort by: {sortBy}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 rounded-xl border py-1 z-40 min-w-[170px] shadow-lg"
            style={{ backgroundColor: C.surface, borderColor: C.outlineVar }}
          >
            {SORT_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => { setSortBy(option); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: sortBy === option ? C.primary : C.onSurfaceVar }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function MarketplaceFinal() {
  const [search,             setSearch]             = useState("");
  const [selectedStores,     setSelectedStores]     = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openNow,            setOpenNow]            = useState(false);
  const [minRating,          setMinRating]          = useState<number | null>(null);
  const [maxDistance,        setMaxDistance]        = useState<string | null>(null);
  const [viewMode,           setViewMode]           = useState<ViewMode>("grid");
  const [sortBy,             setSortBy]             = useState("Best Match");
  const [cartCount] = useState(3);
  const [drawerOpen,         setDrawerOpen]         = useState(false);

  const toggleStore = (s: string) =>
    setSelectedStores(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleCategory = (c: string) =>
    setSelectedCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const clearAll = () => {
    setSelectedStores([]);
    setSelectedCategories([]);
    setOpenNow(false);
    setMinRating(null);
    setMaxDistance(null);
  };

  const distanceKm = (d: string) => parseFloat(d);
  const storeDistanceKm = (d: string) => parseFloat(d);

  const filtered = useMemo(() => {
    let results = PRODUCTS.filter(p => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase());
      const mc = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const mo = !openNow || p.stores.some(s => s.isOpen);
      const mx = selectedStores.length === 0 || p.stores.some(s => selectedStores.includes(s.name));
      const mr = minRating === null || p.stores.some(s => s.rating >= minRating);
      const md = maxDistance === null || p.stores.some(s => storeDistanceKm(s.distance) <= distanceKm(maxDistance));
      return ms && mc && mo && mx && mr && md;
    });

    // Sort
    switch (sortBy) {
      case "Rating":
        results = [...results].sort((a, b) => {
          const maxA = Math.max(...a.stores.map(s => s.rating));
          const maxB = Math.max(...b.stores.map(s => s.rating));
          return maxB - maxA;
        });
        break;
      case "Lowest Price":
        results = [...results].sort((a, b) => {
          const minA = Math.min(...a.stores.map(s => s.price));
          const minB = Math.min(...b.stores.map(s => s.price));
          return minA - minB;
        });
        break;
      case "Highest Price":
        results = [...results].sort((a, b) => {
          const maxA = Math.max(...a.stores.map(s => s.price));
          const maxB = Math.max(...b.stores.map(s => s.price));
          return maxB - maxA;
        });
        break;
      case "Distance":
        results = [...results].sort((a, b) => {
          const minA = Math.min(...a.stores.map(s => storeDistanceKm(s.distance)));
          const minB = Math.min(...b.stores.map(s => storeDistanceKm(s.distance)));
          return minA - minB;
        });
        break;
      default: // Best Match - keep original order
        break;
    }
    return results;
  }, [search, selectedCategories, openNow, selectedStores, minRating, maxDistance, sortBy]);

  const totalActiveFilters =
    selectedStores.length + selectedCategories.length + (minRating ? 1 : 0) + (maxDistance ? 1 : 0) + (openNow ? 1 : 0);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedStores.map(s => ({ key: `store-${s}`, label: s, onRemove: () => toggleStore(s) })),
    ...selectedCategories.map(c => ({ key: `cat-${c}`, label: c, onRemove: () => toggleCategory(c) })),
    ...(minRating ? [{ key: "rating", label: `${minRating.toFixed(1)}★+`, onRemove: () => setMinRating(null) }] : []),
    ...(maxDistance ? [{ key: "distance", label: `Within ${maxDistance}`, onRemove: () => setMaxDistance(null) }] : []),
    ...(openNow ? [{ key: "open", label: "Open Now", onRemove: () => setOpenNow(false) }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y:-12, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ duration:0.45, ease:"easeOut" }}
        className="sticky top-0 z-50 border-b w-full"
        style={{ backgroundColor: C.surface, borderColor: C.outlineVar, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="mx-auto flex items-center justify-between gap-4 px-10 h-16" style={{ maxWidth:1200 }}>
          <div className="flex items-center gap-5 flex-shrink-0">
            <span className="text-xl font-bold italic" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
              QuickKart
            </span>
            <motion.button
              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors"
              style={{ color: C.secondary, borderColor: C.outlineVar, backgroundColor:`${C.surfaceCtxLow}` }}
            >
              <MapPin size={12} color={C.secondary}/> Bengaluru <ChevronDown size={11} color={C.secondary}/>
            </motion.button>
          </div>

          {/* Search in navbar */}
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="flex items-center gap-2 rounded-full px-4 py-2 border" style={{ backgroundColor: C.surfaceCtx, borderColor: C.outlineVar }}>
              <Search size={15} color={C.outline}/>
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groceries, stores and more..." 
                className="flex-1 bg-transparent outline-none text-xs" 
                style={{ color: C.onSurfaceVar }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <nav className="hidden md:flex items-center gap-5">
              {["Categories","Stores","Offers"].map(l => (
                <motion.a key={l} whileHover={{ color: C.primary }} href="#"
                  className="text-xs font-medium transition-colors" style={{ color: C.secondary }}>
                  {l}
                </motion.a>
              ))}
            </nav>
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} className="relative p-1.5" style={{ color: C.secondary }}>
              <Bell size={18}/>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"/>
            </motion.button>
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} className="relative p-1.5" style={{ color: C.secondary }}>
              <ShoppingCart size={18}/>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ backgroundColor: C.primary }}
                >{cartCount}</motion.span>
              )}
            </motion.button>
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} className="p-1.5" style={{ color: C.secondary }}>
              <User size={18}/>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto px-10 py-8" style={{ maxWidth:1200 }}>

        {/* ── COMPACT HERO ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, ease:"easeOut" }}
          className="mb-5 space-y-1.5"
        >
          <h1 className="text-2xl font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
            Global Product Discovery
            <span 
              className="inline-flex items-center gap-1.5 ml-3 px-3 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor:`${C.tertiaryCont}18`, borderColor:`${C.tertiaryCont}60`, color: C.tertiary }}
            >
              <Check size={12}/> Neighborhood Prices
            </span>
          </h1>
          <p className="text-sm" style={{ color: C.onSurfaceVar }}>
            Compare prices and distance across all artisanal local merchants near you.
          </p>
        </motion.div>

        {/* ── QUICK FILTERS ───────────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 -mx-10 px-10 py-3" style={{ backgroundColor:`${C.bg}EE`, backdropFilter:"blur(16px)" }}>
          <motion.div
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.05, duration:0.35 }}
          >
            {/* Quick filter pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-2">
              <QuickPill icon={<Clock size={14} />} label="Open Now" active={openNow} onClick={() => setOpenNow(o => !o)} />
              <QuickPill
                icon={<Navigation size={14} />}
                label={maxDistance ? `Within ${maxDistance}` : "Distance"}
                active={!!maxDistance}
                onClick={() => setDrawerOpen(true)}
              />
              <QuickPill
                icon={<Star size={14} />}
                label={minRating ? `${minRating.toFixed(1)}★+` : "Rating"}
                active={!!minRating}
                onClick={() => setDrawerOpen(true)}
              />
              <QuickPill
                icon={<SlidersHorizontal size={14} />}
                label="Filters"
                active={totalActiveFilters > 0}
                badgeCount={totalActiveFilters}
                onClick={() => setDrawerOpen(true)}
              />
            </div>

            {/* Active filter chips */}
            <AnimatePresence>
              {activeChips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 flex-wrap pt-2 overflow-hidden"
                >
                  {activeChips.map(chip => (
                    <ActiveChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                  ))}
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold underline-offset-2 hover:underline px-1"
                    style={{ color: C.primary }}
                  >
                    Clear all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── FEATURED STORES RAIL (compact) ────────────────────────────── */}
        <div className="mt-1">
          <FeaturedStoresRail selectedStores={selectedStores} toggleStore={toggleStore} />
        </div>

        {/* ── PRODUCT LIST HEADER with Sort & View Toggle ────────────────── */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
              Products
              <span className="ml-2 text-sm font-normal" style={{ color: C.onSurfaceVar }}>
                ({filtered.length})
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            <div className="flex rounded-xl border overflow-hidden flex-shrink-0" style={{ borderColor: C.outlineVar }}>
              {(["grid","list"] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  aria-pressed={viewMode === m}
                  aria-label={m === "grid" ? "Grid view" : "List view"}
                  className="px-3.5 py-2 transition-colors duration-150 flex items-center"
                  style={{ backgroundColor: viewMode===m ? C.primary : C.surface, color: viewMode===m ? "#FFFFFF" : C.outline }}
                >
                  {m==="grid" ? <Grid3X3 size={15}/> : <List size={15}/>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: C.outlineVar }} />

        {/* ── PRODUCT COMPARISON LIST ──────────────────────────────────────── */}
        <div className="space-y-8 mt-8">
          <AnimatePresence>
            {filtered.length > 0 ? filtered.map((p, i) => (
              <div key={p.id}>
                <ProductSection product={p} viewMode={viewMode}/>
                {i < filtered.length-1 && (
                  <div className="mt-8 h-px" style={{ backgroundColor: C.outlineVar }}/>
                )}
              </div>
            )) : (
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.surfaceCtx }}>
                  <Search size={22} color={C.outline}/>
                </div>
                <h3 className="font-bold" style={{ color: C.onSurface }}>No products found</h3>
                <p className="text-sm mt-1" style={{ color: C.onSurfaceVar }}>Try adjusting your filters or search terms</p>
                <motion.button
                  whileTap={{ scale:0.95 }}
                  onClick={()=>{ setSearch(""); clearAll(); }}
                  className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: C.primary, color: C.onPrimary }}
                >
                  Clear filters
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── DISCOVER MORE LOCALLY ────────────────────────────────────────── */}
        <section className="mt-14 mb-4">
          <h3 className="text-xl font-bold mb-5" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
            Discover More Locally
          </h3>

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns:"repeat(12,1fr)", height:400 }}
          >
            <motion.div
              initial={{ opacity:0, x:-20 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.5 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-end"
              style={{ gridColumn:"span 8", background:"linear-gradient(135deg,#1A3D2B 0%,#2D6B4A 40%,#4A9B6F 70%,#6AB88A 100%)" }}
            >
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]"
                style={{ background:"linear-gradient(135deg,#1A3D2B 0%,#2D6B4A 40%,#4A9B6F 70%,#6AB88A 100%)" }}
              />
              <motion.div animate={{ y:[0,-7,0] }} transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}
                className="absolute top-8 right-16 text-8xl opacity-25 select-none pointer-events-none">🥬</motion.div>
              <motion.div animate={{ y:[0,6,0] }} transition={{ duration:5.5, repeat:Infinity, ease:"easeInOut", delay:1 }}
                className="absolute top-12 right-36 text-5xl opacity-20 select-none pointer-events-none">🍅</motion.div>
              <motion.div animate={{ y:[0,-5,0] }} transition={{ duration:3.8, repeat:Infinity, ease:"easeInOut", delay:0.5 }}
                className="absolute bottom-24 right-10 text-6xl opacity-15 select-none pointer-events-none">🌿</motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"/>

              <div className="relative z-10 p-8 max-w-sm">
                <span
                  className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3 text-white"
                  style={{ backgroundColor: C.tertiary }}
                >
                  Flash Deal
                </span>
                <h4 className="text-2xl font-bold text-white mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>
                  Artisanal Organic Week
                </h4>
                <p className="text-white/75 text-sm leading-relaxed mb-5">
                  Get up to 40% off on verified organic farm products from Green Basket and Fresh Mart.
                </p>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
                  style={{ backgroundColor: C.tertiary, color:"#FFFFFF" }}
                >
                  Shop the Collection <ArrowRight size={13}/>
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity:0, x:20 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.5, delay:0.1 }}
              className="relative rounded-2xl flex flex-col items-center justify-center text-center p-8"
              style={{ gridColumn:"span 4", backgroundColor: C.secondaryCont }}
            >
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full blur-2xl opacity-40" style={{ backgroundColor: C.primaryCont }}/>

              <motion.div
                whileHover={{ scale:1.08, rotate:5 }}
                transition={{ duration:0.3 }}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-5 relative z-10"
                style={{ boxShadow:"0 4px 20px rgba(115,90,62,0.18)" }}
              >
                <BadgePercent size={36} color={C.primary}/>
              </motion.div>

              <h4 className="text-lg font-bold mb-2 relative z-10" style={{ fontFamily:"'Playfair Display',serif", color: C.onSurface }}>
                Market Rewards
              </h4>
              <p className="text-sm leading-relaxed mb-5 relative z-10" style={{ color: C.onSecondaryCont }}>
                Earn points for every purchase from local Bengaluru merchants.
              </p>
              <motion.a
                href="#"
                whileHover={{ letterSpacing:"0.04em" }}
                transition={{ duration:0.2 }}
                className="text-sm font-black underline decoration-2 underline-offset-4 relative z-10"
                style={{ color: C.primary }}
              >
                Learn More
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: C.outlineVar, backgroundColor: C.surfaceCtxLow }}>
        <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-10" style={{ maxWidth:1200 }}>
          <div>
            <span className="text-base font-bold italic" style={{ fontFamily:"'Playfair Display',serif", color: C.primary }}>
              QuickKart
            </span>
            <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>
              © 2026 QuickKart Neighborhood Market. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            {["About Us","Contact","Privacy Policy","Terms of Service"].map(l => (
              <motion.a
                key={l} href="#"
                whileHover={{ color: C.primary }}
                className="text-xs transition-colors"
                style={{ color: C.onSurfaceVar }}
              >{l}</motion.a>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile FAB */}
      <motion.button
        whileHover={{ scale:1.06 }} whileTap={{ scale:0.92 }}
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 md:hidden"
        style={{ backgroundColor: C.primary, color: C.onPrimary }}
        aria-label="Open filters"
      >
        <SlidersHorizontal size={20}/>
      </motion.button>

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedStores={selectedStores}
        toggleStore={toggleStore}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        minRating={minRating}
        setMinRating={setMinRating}
        maxDistance={maxDistance}
        setMaxDistance={setMaxDistance}
        openNow={openNow}
        setOpenNow={setOpenNow}
        onClear={clearAll}
      />
    </div>
  );
}