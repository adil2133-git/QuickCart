import { motion, type Variants } from "framer-motion";
import {
  Search, Navigation, PackageCheck,
  Boxes, Sparkles, ArrowRight, MapPin, Clock3, Zap,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { scrollTo } from "../utils/scroll";

// Uploaded imagery assets
import heroProduceImg from "../../../assets/hero-bg.png";
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

/* ─── Hero Section (Restored Clean Light Paper Layout) ─────────────────────── */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#F7F8F5] px-6 pb-20 pt-12 md:pb-28 md:pt-16">
      {/* Subtle Dot Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #DCE3DC 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        {/* Left Copy Column */}
        <motion.div variants={container} initial="hidden" animate="visible" className="lg:col-span-7">
          <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#145C43]/20 bg-[#E8EFEC] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#145C43]">
            <Sparkles size={14} className="animate-pulse text-[#145C43]" /> Real-Time Neighborhood Inventory Engine
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[2.75rem] leading-[1.06] tracking-tight text-[#16241D] md:text-[3.75rem]"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Your neighborhood <br />
            grocery, <span className="italic text-[#145C43]">delivered fast.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-[1.08rem] leading-relaxed text-[#6E7C74]">
            QuickKart checks live stock across nearby supermarkets before you place an order — connecting you directly with the store that has your exact items on the shelf.
          </motion.p>

          {/* Action CTAs */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register/customer"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#145C43] px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#114E39] hover:shadow-lg hover:shadow-[#145C43]/20"
            >
              Start Shopping Now <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollTo("join")}
              className="inline-flex items-center gap-2 rounded-full border border-[#DCE3DC] bg-white px-6 py-3.5 text-sm font-semibold text-[#16241D] transition-all hover:bg-[#F5F7F3] hover:border-[#145C43]"
            >
              Explore Stores & Roles
            </button>
          </motion.div>

          {/* Feature Highlights Strip */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#E3E7E1] pt-6 text-sm text-[#6E7C74]">
            <span className="inline-flex items-center gap-2 font-medium text-[#16241D]"><MapPin size={16} className="text-[#145C43]" /> Hyperlocal Stores</span>
            <span className="inline-flex items-center gap-2 font-medium text-[#16241D]"><Clock3 size={16} className="text-[#145C43]" /> Live POS Stock Sync</span>
            <span className="inline-flex items-center gap-2 font-medium text-[#16241D]"><Zap size={16} className="text-[#145C43]" /> 15-Min Express Delivery</span>
          </motion.div>
        </motion.div>

        {/* Right Hero Image Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="relative lg:col-span-5"
        >
          {/* Clean Floating Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white shadow-xl shadow-black/[0.04]">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={heroProduceImg}
                alt="Fresh Organic Produce Basket"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />

              {/* Floating Top Badge */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#E3E7E1] bg-white/95 px-3.5 py-1.5 text-[11.5px] font-bold text-[#16241D] backdrop-blur-md shadow-md">
                <span className="h-2 w-2 rounded-full bg-[#145C43] animate-pulse" />
                <span>Live Supermarket Inventory</span>
              </div>

              {/* Floating Bottom-Right ETA Badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-[#145C43] px-4 py-2 text-[12px] font-bold text-white shadow-lg border border-white/20">
                <Clock3 size={14} className="text-[#A9CC3B]" />
                <span>Avg Delivery: 15 min</span>
              </div>

              {/* Floating Bottom-Left Quality Pill */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-[#E3E7E1] bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#16241D] shadow-md backdrop-blur-md">
                <ShieldCheck size={13} className="text-[#145C43]" />
                <span>100% Shelf Fresh</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust Metrics Bar */}
      <div className="mx-auto mt-16 max-w-7xl rounded-2xl border border-[#E3E7E1] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-[#145C43] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>40+</p>
            <p className="mt-1 text-xs text-[#6E7C74] uppercase tracking-wider font-semibold">Neighborhoods Served</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#145C43] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>500+</p>
            <p className="mt-1 text-xs text-[#6E7C74] uppercase tracking-wider font-semibold">Partner Supermarkets</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#145C43] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>99.4%</p>
            <p className="mt-1 text-xs text-[#6E7C74] uppercase tracking-wider font-semibold">Stock Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#145C43] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>&lt; 15 min</p>
            <p className="mt-1 text-xs text-[#6E7C74] uppercase tracking-wider font-semibold">Avg Delivery Time</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why QuickKart (4 Pillars of Excellence) ────────────────────────────── */

const pillars = [
  {
    icon: Boxes,
    title: "Real Stock, Not Estimates",
    copy: "Inventory updates from partner store POS systems continuously. If an item is listed, it is physically on the supermarket shelf.",
  },
  {
    icon: Sparkles,
    title: "Smart Store Matching",
    copy: "Our engine automatically evaluates item availability, store distance, and delivery speed to match your order with the optimal store.",
  },
  {
    icon: ShieldCheck,
    title: "Store-Direct Prices",
    copy: "No arbitrary app markups. You pay the exact same shelf prices as walking directly into your local supermarket.",
  },
  {
    icon: Zap,
    title: "Dedicated Neighborhood Drivers",
    copy: "Local delivery partners assigned to specific neighborhood zones for fast 15-minute doorstep fulfillment.",
  },
];

function WhyQuickKart() {
  return (
    <section className="bg-white px-6 py-20 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#145C43]">Built For Reliability</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Why QuickKart is faster & more accurate
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

/* ─── Ecosystem Role Cards (Full Head & Upper Body Framing) ─────────────── */

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
            <div className="relative h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={customerImg}
                alt="Order Groceries"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                For Shoppers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Order Groceries</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Shop from nearby supermarkets with real-time stock verification. Get exact items delivered to your door in 15 minutes.
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
            <div className="relative h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={storePartnerImg}
                alt="Partner Store"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                For Supermarkets
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Partner Your Store</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Bring your supermarket online, sync inventory live via POS integration, and reach thousands of neighborhood customers daily.
              </p>
              <Link
                to="/register/store"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#145C43] px-5 py-3 text-sm font-bold text-[#145C43] transition-colors hover:bg-[#145C43] hover:text-white"
              >
                Register Store <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Delivery Partner Card (Fixed Object-Top Framing for Full Head/Chest Visibility) */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E7E1] bg-white transition-all hover:-translate-y-1.5 hover:shadow-xl">
            <div className="relative h-64 w-full overflow-hidden bg-[#F5F7F3]">
              <img
                src={driverPartnerImg}
                alt="Become a Delivery Partner"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 rounded-full bg-[#145C43] px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                For Drivers
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="mb-2 text-xl font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>Become a Driver</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#6E7C74]">
                Deliver on your own schedule with transparent per-order earnings, performance bonuses, and weekly direct payouts.
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

/* ─── How It Works (3-Step Timeline) ─────────────────────────────────────── */

const steps = [
  { icon: Search, title: "1. Search Product & Check Stock", copy: "Look up any item. QuickKart checks real-time inventory across nearby supermarkets." },
  { icon: Navigation, title: "2. Smart Match Store", copy: "Our algorithm matches you with the closest store that has 100% of your items in stock." },
  { icon: PackageCheck, title: "3. Express Doorstep Delivery", copy: "A local delivery partner picks up your packed order and arrives at your door in 15 minutes." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Simple 3-Step Process</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            How QuickKart works
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="relative flex flex-col items-center rounded-3xl border border-[#E3E7E1] bg-[#F5F7F3] p-8 text-center shadow-sm">
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

/* ─── Main Landing Page ──────────────────────────────────────────────────── */

export default function QuickKartLanding() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#16241D]">
      <Navbar />
      <main>
        <Hero />
        <WhyQuickKart />
        <RoleSelection />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}