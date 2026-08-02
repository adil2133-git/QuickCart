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
import heroBgImg from "../../../assets/hero-bg1.png";
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

/* ─── Hero Section (Full-Bleed Widescreen Background Layout) ───────────── */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#F7F8F5]">
      {/* Background Hero Image (hero-bg1.png) with Soft Lighting Gradient Blend */}
      <div className="absolute inset-0 z-0 min-h-full w-full overflow-hidden">
        <img
          src={heroBgImg}
          alt="Fresh Organic Produce Background"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center opacity-85 transition-opacity duration-300"
        />
        {/* Soft Radial & Linear Gradient Overlay for perfect text contrast & full produce image visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/50 to-[#F7F8F5]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/50 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center md:pb-28 md:pt-24">
        {/* Top Floating Pill Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#145C43]/20 bg-white/80 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#145C43] shadow-sm backdrop-blur-md"
        >
          <span className="h-2 w-2 rounded-full bg-[#145C43] animate-pulse" />
          Hyperlocal Neighborhood Inventory
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-4xl text-4xl leading-[1.08] tracking-tight text-[#0D2B21] md:text-6xl"
          style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
        >
          Your neighborhood grocery, <br />
          <span className="italic font-serif text-[#145C43]">delivered fresh.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 max-w-2xl text-base leading-relaxed text-[#16241D]/80 md:text-lg"
        >
          Real-time stock tracking from your local supermarkets. No more missing items—just the freshest harvest from your community, delivered in 15 minutes.
        </motion.p>

        {/* Action Buttons Row */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/register/customer"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#0D2B21] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#145C43] hover:shadow-xl hover:shadow-[#0D2B21]/20"
          >
            Start Shopping Now <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            onClick={() => scrollTo("how-it-works")}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-8 py-4 text-sm font-semibold text-[#16241D] shadow-md backdrop-blur-md transition-all hover:bg-white hover:shadow-lg"
          >
            How it Works
          </button>
        </motion.div>

        {/* 3 Feature Badges at Bottom of Hero */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-8 border-t border-[#E3E7E1]/60 pt-10 sm:grid-cols-3"
        >
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <MapPin size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">Hyperlocal Stores</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">500+ Partner Supermarkets</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <Clock3 size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">99.4% Accuracy</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">Live POS Stock Sync</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#A7F3D0]/70 text-[#047857] shadow-sm backdrop-blur-sm">
              <Zap size={20} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#145C43]">Express Delivery</p>
            <p className="mt-1 text-xs text-[#6E7C74] font-medium">Avg 15 Min Delivery</p>
          </div>
        </motion.div>
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