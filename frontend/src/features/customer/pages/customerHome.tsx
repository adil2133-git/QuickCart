import { useState } from "react";
import NavBar from "../components/navbar"
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ArrowRight,
  Clock,
  Leaf,
} from "lucide-react";

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.07 },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── NavBar ────────────────────────────────────────────────────────────────────


// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action, actionItalic = false }: { title: string; action: string; actionItalic?: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="flex items-end justify-between mb-6"
    >
      <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>
        {title}
      </span>
      <motion.span
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
        className={`text-xs font-semibold cursor-pointer flex items-center gap-1 ${actionItalic ? "italic" : ""}`}
        style={{ fontFamily: "'DM Sans', sans-serif", color: actionItalic ? "#4E453D" : "#735A3E" }}
      >
        {action}
        <ArrowRight size={11} />
      </motion.span>
    </motion.div>
  );
}

// ─── Card Shell ────────────────────────────────────────────────────────────────
function Card({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0px 12px 32px rgba(194,163,131,0.22)" } : {}}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`rounded-xl overflow-hidden bg-white border ${className}`}
      style={{ borderColor: "#D2C4B9", boxShadow: "0px 1px 4px rgba(0,0,0,0.06)" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Add to Cart Button ────────────────────────────────────────────────────────
function AddToCartButton({ onAdd, icon = false }: { onAdd: () => void; icon?: boolean }) {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    setAdded(true);
    onAdd();
    setTimeout(() => setAdded(false), 1800);
  };

  if (icon) {
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handleClick}
        className="w-10 h-10 rounded-lg flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors duration-300"
        style={{ backgroundColor: added ? "#376847" : "#735A3E", boxShadow: "0px 2px 12px rgba(194,163,131,0.22)" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {added ? (
            <motion.span key="check" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Check size={14} color="white" />
            </motion.span>
          ) : (
            <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Plus size={14} color="white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border-none cursor-pointer text-white transition-colors duration-300"
      style={{ backgroundColor: added ? "#376847" : "#735A3E", padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span key="check" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2">
            <Check size={14} /> Added!
          </motion.span>
        ) : (
          <motion.span key="cart" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="flex items-center gap-2">
            <ShoppingCart size={14} /> Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Star size={13} fill="#C2A383" color="#C2A383" />
      <span className="text-sm font-bold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1D1B16" }}>{rating}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomerHome() {
  const [cartCount, setCartCount] = useState(0);
  const addToCart = () => setCartCount((c) => c + 1);

  const recentOrders = [
    { store: "Heritage Farm", name: "Free Range Eggs", emoji: "🥚", bg: "#E0D4C0" },
    { store: "Bumble & Bee", name: "Wildflower Honey", emoji: "🍯", bg: "#D4BC90" },
    { store: "Dairy Dreams", name: "Greek Style Yogurt", emoji: "🥛", bg: "#C4CEC0" },
    { store: "Heritage Farm", name: "Artisan Sourdough", emoji: "🍞", bg: "#8B7355" },
  ];

  const categories = [
    { name: "Fruits", emoji: "🍊" },
    { name: "Dairy", emoji: "🥛" },
    { name: "Bakery", emoji: "🍞" },
    { name: "Snacks", emoji: "🌰" },
    { name: "Vegetables", emoji: "🥕" },
    { name: "Pantry", emoji: "🫙" },
  ];

  const popularProducts = [
    { store: "The Curd Shop", name: "Aged Sharp Cheddar", weight: "200g · Farmstead Aged", price: "₹340", emoji: "🧀", bg: "#F0EBE3" },
    { store: "Mountain Roast", name: "Estate Coffee Beans", weight: "250g · Medium Roast", price: "₹495", emoji: "☕", bg: "#2C2018" },
    { store: "Green Garden Organics", name: "Seedless Green Grapes", weight: "500g · Pesticide Free", price: "₹120", emoji: "🍇", bg: "#D8E8D4" },
    { store: "Heritage Farm", name: "Honey Nut Granola", weight: "400g · Small Batch", price: "₹275", emoji: "🥣", bg: "#C8A060" },
  ];

  const recStores = [
    { initials: "AP", name: "The Artisan Pantry", rating: "4.7", tags: "Organic Staples · Spices", cardBg: "#2C2018" },
    { initials: "BG", name: "Boutique Greens", rating: "4.9", tags: "Hydroponic · Exotics", cardBg: "#1A2E1C" },
    { initials: "BH", name: "Bloom & Harvest", rating: "4.8", tags: "Fresh Fruits · Floral", cardBg: "#C49040" },
  ];

  const nearbyStores = [
    { name: "Green Garden Organics", rating: "4.8", dist: "1.2 km", time: "25–35 mins", bg: "#1A2E1C" },
    { name: "Heritage Farm", rating: "4.9", dist: "0.8 km", time: "15–20 mins", bg: "#3C2010" },
  ];

  const trending = [
    { store: "Green Garden Organics", name: "Fresh Strawberries", weight: "250g · Organic Grade A", price: "₹149", emoji: "🍓", bg: "#7C1A1A" },
    { store: "Heritage Farm", name: "Full Cream Milk", weight: "1 Litre · Glass Bottle", price: "₹68", emoji: "🥛", bg: "#2C3C4C" },
    { store: "Nature's Basket", name: "Organic Bananas", weight: "1 Dozen · Farm Fresh", price: "₹79", emoji: "🍌", bg: "#6B4E16" },
    { store: "Fresh Valley Farms", name: "Free Range Eggs", weight: "12 Pieces · Premium", price: "₹129", emoji: "🥚", bg: "#4A3B2A" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF9EF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,500&family=Playfair+Display:ital,wght@0,600;0,700;1,700&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <NavBar cartCount={cartCount} />

      <main className="mx-auto px-10 py-12 flex flex-col gap-14" style={{ maxWidth: 1200 }}>

        {/* ── HERO BANNER ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={{ height: 480, boxShadow: "0px 8px 40px rgba(194,163,131,0.30)" }}
        >
          {/* BG */}
          <div
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.02]"
            style={{ background: "linear-gradient(110deg, #6B4A20 0%, #9C7040 30%, #C8963C 55%, #D4A850 75%, #8B6020 100%)" }}
          />
          {/* Left overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,249,239,0.97) 0%, rgba(255,249,239,0.75) 38%, rgba(255,249,239,0.2) 60%, rgba(255,249,239,0) 100%)" }} />
          {/* Decorative floating emoji */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-24 top-16 text-8xl opacity-30 pointer-events-none select-none"
          >
            🌾
          </motion.div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute right-52 bottom-20 text-6xl opacity-20 pointer-events-none select-none"
          >
            🍅
          </motion.div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center" style={{ padding: 56 }}>
            <div className="flex flex-col gap-4" style={{ maxWidth: 420 }}>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex w-fit items-center gap-1.5 rounded-full px-3 py-1"
                style={{ backgroundColor: "rgba(128,180,141,0.2)" }}
              >
                <Leaf size={11} color="#376847" />
                <span className="text-xs font-medium" style={{ color: "#376847" }}>Curated Selection</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55 }}
                className="font-bold leading-tight m-0"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, letterSpacing: "-0.64px", color: "#735A3E", lineHeight: "42px" }}
              >
                Freshness Delivered<br />To Your Doorstep
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-sm m-0"
                style={{ lineHeight: "22px", color: "#4E453D", maxWidth: 384 }}
              >
                Experience the warmth of your local neighborhood market from the comfort of your home. Hand-picked with care.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center gap-4 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0px 8px 24px rgba(115,90,62,0.35)" }}
                  whileTap={{ scale: 0.96 }}
                  className="text-white rounded-xl font-semibold cursor-pointer border-none"
                  style={{ backgroundColor: "#735A3E", padding: "14px 28px", fontFamily: "'Playfair Display', serif", fontSize: 15, boxShadow: "0px 2px 12px rgba(194,163,131,0.22)" }}
                >
                  Free delivery over ₹300
                </motion.button>
                <span className="text-xs italic" style={{ color: "#80756B" }}>*Limited time, new users only</span>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ── RECENTLY ORDERED ── */}
        <section>
          <SectionHeader title="Recently Ordered" action="View Order History" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-4 gap-6"
          >
            {recentOrders.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="flex flex-row items-center gap-4 p-4">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
                    transition={{ duration: 0.4 }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                    style={{ backgroundColor: item.bg }}
                  >
                    {item.emoji}
                  </motion.div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium block" style={{ color: "#376847" }}>{item.store}</span>
                    <span className="font-semibold text-sm block mt-1 leading-5" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{item.name}</span>
                    <motion.button
                      whileHover={{ backgroundColor: "rgba(115,90,62,0.18)" }}
                      whileTap={{ scale: 0.94 }}
                      className="mt-2 w-fit rounded-full border-none cursor-pointer text-xs font-bold"
                      style={{ backgroundColor: "rgba(115,90,62,0.10)", color: "#735A3E", padding: "4px 12px", fontSize: 11 }}
                    >
                      Reorder
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── BROWSE BY CATEGORY ── */}
        <section>
          <SectionHeader title="Browse by Category" action="View All Categories" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="flex justify-between"
          >
            {categories.map((cat, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.94 }}
                className="flex flex-col items-center gap-4 cursor-pointer border-none bg-transparent"
              >
                <motion.div
                  whileHover={{ boxShadow: "0px 8px 24px rgba(194,163,131,0.30)", borderColor: "#C2A383" }}
                  className="w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-shadow"
                  style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2C4B9", boxShadow: "0px 2px 12px rgba(194,163,131,0.14)" }}
                >
                  <span className="select-none">{cat.emoji}</span>
                </motion.div>
                <span className="font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{cat.name}</span>
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* ── POPULAR IN THE NEIGHBORHOOD ── */}
        <section>
          <SectionHeader title="Popular in the Neighborhood" action="View Trending Items" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-4 gap-6"
          >
            {popularProducts.map((p, i) => (
              <motion.div key={i} variants={scaleIn}>
                <Card className="flex flex-col h-full">
                  <div className="p-[17px] pb-0">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                      className="h-48 rounded-lg flex items-center justify-center text-6xl overflow-hidden"
                      style={{ backgroundColor: p.bg }}
                    >
                      <span className="select-none">{p.emoji}</span>
                    </motion.div>
                  </div>
                  <div className="px-[17px] pt-[17px] flex flex-col gap-0.5 flex-1">
                    <span className="text-xs font-medium block" style={{ color: "#376847" }}>{p.store}</span>
                    <span className="font-semibold block" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{p.name}</span>
                    <span className="text-sm block" style={{ color: "#D2C4B9" }}>{p.weight}</span>
                  </div>
                  <div className="px-[17px] py-4 flex items-center justify-between">
                    <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#735A3E" }}>{p.price}</span>
                    <AddToCartButton onAdd={addToCart} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── RECOMMENDED FOR YOU ── */}
        <section>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex items-end justify-between mb-6"
          >
            <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>Recommended for You</span>
            <span className="text-xs italic flex items-center gap-1" style={{ color: "#4E453D" }}>
              Based on your recent organic finds
            </span>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-3 gap-6"
          >
            {recStores.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="flex flex-col">
                  <div className="relative h-40 flex items-end overflow-hidden" style={{ backgroundColor: s.cardBg }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)" }} />
                    <div className="relative z-10 flex items-center gap-3 p-6">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white" style={{ boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)" }}>
                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(115,90,62,0.1)" }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#735A3E", fontWeight: 700 }}>{s.initials}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-lg text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{s.name}</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <StarRating rating={s.rating} />
                      <span className="text-sm" style={{ color: "#4E453D" }}>{s.tags}</span>
                    </div>
                    <motion.button
                      whileHover={{ backgroundColor: "#E3CCB4" }}
                      whileTap={{ scale: 0.96 }}
                      className="w-full rounded-lg border-none cursor-pointer text-sm py-2.5 font-medium transition-colors"
                      style={{ backgroundColor: "#EEDDC7", color: "#6D614F", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Visit Store
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── NEARBY STORES ── */}
        <section>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex items-center justify-between mb-6"
          >
            <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>Nearby Stores</span>
            <div className="flex items-center gap-2">
              {[ChevronLeft, ChevronRight].map((Icon, i) => (
                <motion.button
                  key={i}
                  whileHover={{ backgroundColor: "#FDF3E3", scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-8 h-8 rounded-full bg-white border flex items-center justify-center cursor-pointer transition-colors"
                  style={{ borderColor: "#D2C4B9" }}
                >
                  <Icon size={14} color="#735A3E" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 gap-6"
          >
            {nearbyStores.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card>
                  <div className="relative h-56 flex items-center justify-center overflow-hidden" style={{ backgroundColor: s.bg }}>
                    <span className="text-8xl opacity-20 select-none">🏪</span>
                    {/* Open badge */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="absolute top-4 right-4 rounded-full px-3 py-1 flex items-center gap-1.5"
                      style={{ backgroundColor: "rgba(55,104,71,0.18)", backdropFilter: "blur(6px)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#376847] animate-pulse" />
                      <span className="text-xs font-bold" style={{ color: "#376847" }}>Open</span>
                    </motion.div>
                    {/* Distance badge */}
                    <div
                      className="absolute bottom-4 left-4 rounded-full px-3 py-1 flex items-center gap-1.5"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
                    >
                      <MapPin size={11} color="white" />
                      <span className="text-xs font-medium text-white">{s.dist}</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between p-6">
                    <div>
                      <span className="font-semibold text-lg block" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{s.name}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StarRating rating={s.rating} />
                        <span style={{ color: "#D2C4B9" }}>·</span>
                        <Clock size={12} color="#4E453D" />
                        <span className="text-sm" style={{ color: "#4E453D" }}>{s.time}</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ backgroundColor: "#E3CCB4" }}
                      whileTap={{ scale: 0.94 }}
                      className="flex-shrink-0 rounded-lg border-none cursor-pointer text-sm font-medium transition-colors"
                      style={{ backgroundColor: "#EEDDC7", padding: "8px 18px", color: "#6D614F", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      View Menu
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── TRENDING TODAY ── */}
        <section className="pb-12">
          <SectionHeader title="Trending Today" action="Explore More" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-4 gap-6"
          >
            {trending.map((item, i) => (
              <motion.div key={i} variants={scaleIn}>
                <Card className="flex flex-col h-full">
                  <div className="p-[17px] pb-0">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                      className="h-48 rounded-lg flex items-center justify-center text-6xl overflow-hidden"
                      style={{ backgroundColor: item.bg }}
                    >
                      <span className="select-none">{item.emoji}</span>
                    </motion.div>
                  </div>
                  <div className="px-[17px] pt-[17px] flex-1">
                    <span className="text-xs font-medium block" style={{ color: "#376847" }}>{item.store}</span>
                    <span className="font-semibold block" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{item.name}</span>
                    <span className="text-sm block" style={{ color: "#D2C4B9" }}>{item.weight}</span>
                  </div>
                  <div className="px-[17px] py-4 flex items-center justify-between">
                    <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#735A3E" }}>{item.price}</span>
                    <AddToCartButton onAdd={addToCart} icon />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-10" style={{ borderColor: "#D2C4B9", backgroundColor: "#FFF9EF" }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200 }}>
          <div>
            <span className="text-lg italic font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>QuickKart</span>
            <p className="text-xs mt-1" style={{ color: "#80756B" }}>© 2026 QuickKart Neighborhood Market. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            {["About Us", "Contact", "Privacy Policy", "Terms of Service"].map((link) => (
              <motion.a
                key={link}
                whileHover={{ color: "#735A3E" }}
                href="#"
                className="text-xs transition-colors"
                style={{ color: "#80756B", fontFamily: "'DM Sans', sans-serif" }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}