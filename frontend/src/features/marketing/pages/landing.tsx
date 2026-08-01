import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Bike, Search, Navigation, PackageCheck,
  Boxes, Sparkles, Radar, ArrowRight, MapPin, Clock3, Zap,
  Star, ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { scrollTo } from "../utils/scroll";

// Uploaded imagery assets
import heroProduceImg from "../../../assets/hero1.png";
import storePartnerImg from "../../../assets/store1.png";
import driverPartnerImg from "../../../assets/driver1.png";
import customerImg from "../../../assets/customer1.png";

/* ─── Motion Presets ─────────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Hero Section ───────────────────────────────────────────────────────── */

function Hero() {
  const [activeTab, setActiveTab] = useState<"stock" | "delivery" | "stores">("stock");

  return (
    <section id="top" className="relative overflow-hidden bg-[#0D2B21] px-6 pb-20 pt-14 text-white md:pb-28 md:pt-20">
      {/* Background Dot Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-[#145C43]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-[#8FCDB0]/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        {/* Left Copy Column */}
        <motion.div variants={container} initial="hidden" animate="visible" className="lg:col-span-7">
          <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8FCDB0]/30 bg-[#8FCDB0]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#8FCDB0]">
            <Radar size={13} className="animate-pulse" /> Live Stock Engine · Active in 40+ Neighborhoods
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[2.75rem] leading-[1.06] tracking-tight md:text-[3.75rem]"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Your neighborhood <br />
            grocery, <span className="italic text-[#8FCDB0]">delivered fast.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-[1.08rem] leading-relaxed text-white/70">
            QuickKart checks real-time inventory across nearby supermarkets before you order — matching you with the store that has your items in stock, guaranteed.
          </motion.p>

          {/* Action CTAs */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register/customer"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#A9CC3B] px-7 py-3.5 text-sm font-bold text-[#16241D] transition-all hover:bg-[#98B933] hover:shadow-lg hover:shadow-[#A9CC3B]/20"
            >
              Start Shopping Now <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollTo("join")}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40"
            >
              Explore Stores
            </button>
          </motion.div>

          {/* Feature Highlights Pill Strip */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 font-medium"><MapPin size={16} className="text-[#8FCDB0]" /> Hyperlocal Stores</span>
            <span className="inline-flex items-center gap-2 font-medium"><Clock3 size={16} className="text-[#8FCDB0]" /> Minute Stock Sync</span>
            <span className="inline-flex items-center gap-2 font-medium"><Zap size={16} className="text-[#8FCDB0]" /> 15-Min Express</span>
          </motion.div>
        </motion.div>

        {/* Right Interactive Preview Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="relative lg:col-span-5"
        >
          {/* Main Hero Photo Container with Gradient Border */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-[#123A2C] to-[#0A1F17] p-2 shadow-2xl shadow-black/60">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px]">
              <img
                src={heroProduceImg}
                alt="Fresh Organic Produce Basket"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F17] via-[#0A1F17]/20 to-transparent" />

              {/* Floating Overlay Badge Header */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-[#0A1F17]/90 px-3.5 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur-md shadow-lg">
                <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-ping" />
                <span>Live Supermarket Sync</span>
              </div>

              {/* Delivery ETA Counter Floating Badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-[#145C43] px-4 py-2 text-[12px] font-bold text-white shadow-xl border border-[#8FCDB0]/30">
                <Clock3 size={14} className="text-[#8FCDB0]" />
                <span>ETA: 14 min</span>
              </div>
            </div>

            {/* Interactive Live Stock Preview Tab Card */}
            <div className="mt-3 rounded-[20px] border border-white/10 bg-[#0A1F17]/95 p-4 backdrop-blur-md">
              {/* Tab Selector */}
              <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-1 text-[12px] font-medium text-white/70">
                <button
                  onClick={() => setActiveTab("stock")}
                  className={`flex-1 rounded-lg py-1.5 transition-colors ${activeTab === "stock" ? "bg-[#145C43] text-white font-semibold shadow" : "hover:text-white"}`}
                >
                  Live Stock
                </button>
                <button
                  onClick={() => setActiveTab("delivery")}
                  className={`flex-1 rounded-lg py-1.5 transition-colors ${activeTab === "delivery" ? "bg-[#145C43] text-white font-semibold shadow" : "hover:text-white"}`}
                >
                  Route Tracker
                </button>
                <button
                  onClick={() => setActiveTab("stores")}
                  className={`flex-1 rounded-lg py-1.5 transition-colors ${activeTab === "stores" ? "bg-[#145C43] text-white font-semibold shadow" : "hover:text-white"}`}
                >
                  Nearest Stores
                </button>
              </div>

              {/* Tab 1: Live Stock Status */}
              {activeTab === "stock" && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-medium text-white/90">🥑 Hass Avocado (Organic)</span>
                    <span className="rounded-full bg-[#145C43] px-2 py-0.5 font-semibold text-[#8FCDB0]">98% In Stock</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-medium text-white/90">🥛 Organic Farm Whole Milk 1L</span>
                    <span className="rounded-full bg-[#145C43] px-2 py-0.5 font-semibold text-[#8FCDB0]">14 Packs Left</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-medium text-white/90">🍞 Fresh Sourdough Bread</span>
                    <span className="rounded-full bg-[#145C43] px-2 py-0.5 font-semibold text-[#8FCDB0]">Baked 1h ago</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Route Tracker */}
              {activeTab === "delivery" && (
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#145C43] text-[#8FCDB0]">
                      <Bike size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Driver Assigned: Rajesh K.</p>
                      <p className="text-[11px] text-white/60">En route from Greenfield Supermarket</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#8FCDB0]">0.8 km</span>
                </div>
              )}

              {/* Tab 3: Nearest Stores */}
              {activeTab === "stores" && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-medium text-white">Greenfield Supermarket</span>
                    <span className="text-white/60">0.4 km · 12 min</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="font-medium text-white">FreshMart Gourmet</span>
                    <span className="text-white/60">1.1 km · 18 min</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metrics Bar */}
      <div className="mx-auto mt-16 max-w-7xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-[#8FCDB0] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>40+</p>
            <p className="mt-1 text-xs text-white/60 uppercase tracking-wider font-medium">Neighborhoods</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#8FCDB0] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>500+</p>
            <p className="mt-1 text-xs text-white/60 uppercase tracking-wider font-medium">Partner Stores</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#8FCDB0] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>99.4%</p>
            <p className="mt-1 text-xs text-white/60 uppercase tracking-wider font-medium">Stock Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#8FCDB0] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>&lt; 15 min</p>
            <p className="mt-1 text-xs text-white/60 uppercase tracking-wider font-medium">Avg Delivery Time</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Category Quick Explorer ────────────────────────────────────────────── */

const categories = [
  { icon: "🥦", name: "Fresh Vegetables", count: "120+ Items", link: "/register/customer" },
  { icon: "🍎", name: "Organic Fruits", count: "85+ Items", link: "/register/customer" },
  { icon: "🥛", name: "Dairy & Milk", count: "64+ Items", link: "/register/customer" },
  { icon: "🍞", name: "Fresh Bakery", count: "42+ Items", link: "/register/customer" },
  { icon: "🧃", name: "Cold Drinks & Juices", count: "90+ Items", link: "/register/customer" },
  { icon: "🥫", name: "Pantry & Staples", count: "210+ Items", link: "/register/customer" },
];

function CategoryExplorer() {
  return (
    <section className="bg-[#F7F8F5] border-b border-[#E3E7E1] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#145C43]">Instant Access</p>
            <h2 className="text-2xl font-semibold text-[#16241D] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>
              Explore Daily Essentials
            </h2>
          </div>
          <Link to="/register/customer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145C43] hover:underline">
            View All Categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={c.link}
              className="group flex flex-col items-center rounded-2xl border border-[#E3E7E1] bg-white p-5 text-center transition-all hover:-translate-y-1 hover:border-[#145C43] hover:shadow-md"
            >
              <span className="mb-3 text-3xl transition-transform group-hover:scale-110">{c.icon}</span>
              <p className="text-sm font-semibold text-[#16241D]">{c.name}</p>
              <p className="mt-1 text-[11px] font-medium text-[#6E7C74]">{c.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why QuickKart (4 Pillars of Excellence) ────────────────────────────── */

const pillars = [
  {
    icon: Boxes,
    title: "Real Stock, Not Guesses",
    copy: "Inventory updates from partner store POS systems every minute. If an item is in your cart, it's actually on the shelf.",
  },
  {
    icon: Sparkles,
    title: "Smart Store Matching",
    copy: "We automatically compare availability, store distance, delivery speed, and pricing to pick your optimal store match.",
  },
  {
    icon: ShieldCheck,
    title: "Store-Direct Prices",
    copy: "No inflated app markups. You pay the exact same shelf prices as walking directly into your local supermarket.",
  },
  {
    icon: Zap,
    title: "Dedicated Neighborhood Riders",
    copy: "Local delivery partners assigned to specific neighborhoods for hyper-fast 15-minute doorstep fulfillment.",
  },
];

function WhyQuickKart() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#145C43]">Built Different</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Why QuickKart is faster & more reliable
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-3xl border border-[#E3E7E1] bg-[#F5F7F3] p-7 transition-all hover:bg-white hover:border-[#145C43] hover:shadow-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145C43] text-white">
                <p.icon size={22} />
              </div>
              <h3 className="mb-2 text-lg text-[#16241D]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6E7C74]">{p.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Ecosystem Role Cards ────────────────────────────────────────────────── */

function RoleSelection() {
  return (
    <section id="join" className="bg-[#F7F8F5] px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Get Started Today</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            One platform, three ways to join
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Customer Card */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all hover:-translate-y-1.5 hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden bg-[#E8EFEC]">
              <img src={customerImg} alt="Shop Groceries" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                For Shoppers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Order Groceries</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Shop from nearby supermarkets with live stock tracking. Get exact items delivered in 15 minutes.
              </p>
              <Link
                to="/register/customer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] px-5 py-3 text-sm font-bold text-[#16241D] transition-transform hover:bg-[#98B933]"
              >
                Start Shopping <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Store Partner Card */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all hover:-translate-y-1.5 hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden bg-[#E8EFEC]">
              <img src={storePartnerImg} alt="Partner Store" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                For Supermarkets
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Partner Your Store</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Bring your store online, sync live inventory, and reach thousands of neighborhood customers daily.
              </p>
              <Link
                to="/register/store"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#145C43] px-5 py-3 text-sm font-bold text-[#145C43] transition-colors hover:bg-[#145C43] hover:text-white"
              >
                Register Store <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Delivery Partner Card */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all hover:-translate-y-1.5 hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden bg-[#E8EFEC]">
              <img src={driverPartnerImg} alt="Become a Driver" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                For Drivers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Become a Driver</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Deliver on your own schedule with competitive per-order earnings, performance bonuses, and weekly payouts.
              </p>
              <Link
                to="/register/delivery"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#145C43] px-5 py-3 text-sm font-bold text-[#145C43] transition-colors hover:bg-[#145C43] hover:text-white"
              >
                Start Delivering <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works (Timeline) ────────────────────────────────────────────── */

const steps = [
  { icon: Search, title: "1. Search Product & Check Stock", copy: "Look up what you need. QuickKart checks live inventory across nearby supermarkets." },
  { icon: Navigation, title: "2. Smart Match Best Store", copy: "Our algorithm matches you with the closest store that has 100% of your items in stock." },
  { icon: PackageCheck, title: "3. Express Doorstep Delivery", copy: "A local delivery partner picks up your packed order and arrives at your door in minutes." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F5F7F3] px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Simple 3-Step Process</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            How QuickKart works
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="relative flex flex-col items-center rounded-3xl border border-[#E3E7E1] bg-white p-8 text-center shadow-sm">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFEC] text-[#145C43]">
                <s.icon size={24} />
              </span>
              <h3 className="mb-2 text-lg font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#6E7C74]">{s.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials & Social Proof ───────────────────────────────────────── */

const reviews = [
  {
    name: "Priya Sharma",
    role: "Verified Customer · Indiranagar",
    comment: "QuickKart is the first app where out-of-stock items actually don't happen. Arrived in 12 minutes flat!",
    rating: 5,
  },
  {
    name: "Vikram Mehta",
    role: "Store Owner · Greenfield Supermarket",
    comment: "Partnering our store doubled our daily orders. The inventory POS integration runs seamlessly.",
    rating: 5,
  },
  {
    name: "Anand Nair",
    role: "Delivery Partner · HSR Layout",
    comment: "Neighborhood-focused delivery routes mean shorter trips, higher earnings, and zero time wasted.",
    rating: 5,
  },
];

function SocialProof() {
  return (
    <section className="bg-white px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Loved by Neighborhoods</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            What our community says
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="flex flex-col justify-between rounded-3xl border border-[#E3E7E1] bg-[#F5F7F3] p-7">
              <div>
                <div className="mb-4 flex items-center gap-1 text-[#B47800]">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-[#16241D] font-medium">"{r.comment}"</p>
              </div>
              <div className="mt-6 border-t border-[#E3E7E1] pt-4">
                <p className="text-sm font-bold text-[#16241D]">{r.name}</p>
                <p className="text-xs text-[#6E7C74]">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA Banner ────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0D2B21] px-6 py-20 text-white text-center">
      <div className="relative mx-auto max-w-4xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#145C43] px-4 py-1.5 text-xs font-bold text-[#8FCDB0]">
          ⚡ Ready for 15-Minute Delivery?
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Fraunces, serif" }}>
          Experience neighborhood grocery shopping done right.
        </h2>
        <p className="text-base text-white/70 max-w-xl mx-auto mb-8">
          Order now from nearby supermarkets with live stock verification. No markups, no out-of-stock surprises.
        </p>
        <Link
          to="/register/customer"
          className="inline-flex items-center gap-2.5 rounded-full bg-[#A9CC3B] px-8 py-4 text-base font-bold text-[#16241D] transition-transform hover:scale-105 hover:bg-[#98B933] shadow-xl"
        >
          Start Shopping Now <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

/* ─── Main Landing Page ──────────────────────────────────────────────────── */

export default function QuickKartLanding() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#16241D]">
      <Navbar />
      <main>
        <Hero />
        <CategoryExplorer />
        <WhyQuickKart />
        <RoleSelection />
        <HowItWorks />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}