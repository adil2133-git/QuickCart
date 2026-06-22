// QuickKartLanding.tsx (main page)
import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  ShoppingCart, Store, Bike, Search, Navigation, PackageCheck,
  Boxes, Sparkles, Radar, ArrowRight, MapPin, Clock3, Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { scrollTo } from "../utils/scroll";

/* ─── motion presets ─────────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── RouteSignature SVG ─────────────────────────────────────────────────── */

function RouteSignature() {
  return (
    <svg viewBox="0 0 420 260" fill="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="routeFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C2825A" stopOpacity="0" />
          <stop offset="15%" stopColor="#C2825A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C2825A" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <circle cx="34" cy="56" r="5" fill="#C2825A" />
      <circle cx="34" cy="56" r="9" stroke="#C2825A" strokeWidth="1.5" opacity="0.4" />
      <motion.path
        d="M34 56 C 110 40, 140 130, 210 130 S 320 70, 386 188"
        stroke="url(#routeFade)" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.circle
        r="5" fill="#F8F2EA" stroke="#C2825A" strokeWidth="2"
        initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 2.1 }}
        style={{ offsetPath: "path('M34 56 C 110 40, 140 130, 210 130 S 320 70, 386 188')" }}
      />
      <motion.g
        initial={{ opacity: 0, scale: 0.4, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.4, ease: "backOut" }}
      >
        <circle cx="386" cy="188" r="6" fill="#241710" />
        <circle cx="386" cy="188" r="6" fill="#C2825A" opacity="0.5">
          <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </motion.g>
    </svg>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#2A1B12] px-6 pb-20 pt-16 text-[#F8F2EA] md:pb-28 md:pt-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #F8F2EA 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.span
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C2825A]/30 bg-[#C2825A]/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#E3B894]"
          >
            <Radar size={13} /> Live across 40+ neighbourhoods
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-[2.6rem] leading-[1.08] tracking-tight md:text-[3.4rem]"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Your neighbourhood
            <br />
            grocery, <span className="italic text-[#E3B894]">delivered fast.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[#F8F2EA]/65">
            QuickKart checks real stock across nearby supermarkets in real time — so you order from the store that actually has it, not just the closest one.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => scrollTo("join")}
              className="group inline-flex items-center gap-2 rounded-full bg-[#C2825A] px-6 py-3.5 text-sm font-semibold text-[#241710] transition-transform hover:-translate-y-0.5"
            >
              Order now <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollTo("join")}
              className="inline-flex items-center gap-2 rounded-full border border-[#F8F2EA]/25 px-6 py-3.5 text-sm font-semibold text-[#F8F2EA] transition-colors hover:bg-[#F8F2EA]/10"
            >
              Explore stores
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#F8F2EA]/60">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[#E3B894]" /> Hyperlocal</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-[#E3B894]" /> Real-time stock</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={15} className="text-[#E3B894]" /> Fast delivery</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto aspect-[4/3] w-full max-w-md rounded-[28px] border border-[#F8F2EA]/10 bg-[#3A2718] p-2 shadow-2xl shadow-black/40"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#241710]">
            <RouteSignature />
            <div className="absolute left-4 top-4 rounded-full bg-[#F8F2EA]/95 px-3 py-1.5 text-[11px] font-semibold text-[#241710] shadow">
              Greenfield Mart · 0.6 km
            </div>
            <div className="absolute bottom-4 right-4 rounded-full bg-[#C2825A] px-3 py-1.5 text-[11px] font-semibold text-[#241710] shadow">
              Arriving in 14 min
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Role Selection ─────────────────────────────────────────────────────── */

const roles = [
  {
    icon: ShoppingCart,
    title: "Order groceries",
    copy: "Shop from nearby supermarkets and track every item until it's at your door.",
    cta: "Start shopping",
    route: "/register/customer",
    primary: true,
  },
  {
    icon: Store,
    title: "Partner your store",
    copy: "Bring your supermarket online, manage inventory live, and reach new customers.",
    cta: "Register your store",
    route: "/register/store",
    primary: false,
  },
  {
    icon: Bike,
    title: "Become a driver",
    copy: "Deliver on your schedule and earn through commissions, bonuses and levels.",
    cta: "Start delivering",
    route: "/register/delivery",
    primary: false,
  },
];

function RoleSelection() {
  return (
    <section id="join" className="bg-[#F8F2EA] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2825A]">Join the ecosystem</p>
          <h2 className="text-3xl text-[#241710] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            One platform, three ways in
          </h2>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid gap-6 md:grid-cols-3">
          {roles.map((r, i) => (
            <motion.div
              key={r.title} custom={i} variants={fadeUp}
              className="group flex flex-col rounded-3xl border border-[#241710]/[0.07] bg-white p-8 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#241710]/[0.06]"
            >
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2825A]/15 text-[#C2825A] transition-colors group-hover:bg-[#C2825A] group-hover:text-white">
                <r.icon size={22} strokeWidth={2} />
              </span>
              <h3 className="mb-2 text-xl text-[#241710]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>{r.title}</h3>
              <p className="mb-7 flex-1 text-[0.95rem] leading-relaxed text-[#241710]/60">{r.copy}</p>
              <Link
                to={r.route}
                className={
                  r.primary
                    ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#241710] px-5 py-3 text-sm font-semibold text-[#F8F2EA] transition-transform hover:-translate-y-0.5"
                    : "inline-flex items-center justify-center gap-2 rounded-full border border-[#241710]/15 px-5 py-3 text-sm font-semibold text-[#241710] transition-colors hover:bg-[#241710]/[0.04]"
                }
              >
                {r.cta} <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────────────────── */

const steps = [
  { icon: Search,      title: "Search a product",      copy: "Look up exactly what you need — we check live stock, not guesses." },
  { icon: Navigation,  title: "Find the nearest stock", copy: "We rank stores by availability, distance, rating and price." },
  { icon: PackageCheck,title: "Get it delivered",       copy: "A nearby driver picks up and tracks the route to your door." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[#E7D7C1] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8C5A37]">From search to doorstep</p>
          <h2 className="text-3xl text-[#241710] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            How QuickKart works
          </h2>
        </motion.div>

        <div className="relative grid gap-12 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-[#241710]/15 md:block" />
          {steps.map((s, i) => (
            <motion.div key={s.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F2EA] text-[#241710] shadow-sm ring-1 ring-[#241710]/10">
                <s.icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mb-2 text-lg text-[#241710]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>{s.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-[#241710]/60">{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why QuickKart ──────────────────────────────────────────────────────── */

const reasons = [
  { icon: Boxes,    title: "Real stock, not estimates",  copy: "Inventory syncs with every partner store roughly once a minute. No more arriving to an out-of-stock surprise." },
  { icon: Sparkles, title: "Smart store ranking",         copy: "We weigh availability, distance, delivery speed, rating and price to find your best match — automatically." },
  { icon: Radar,    title: "Live route tracking",         copy: "Watch your order move in real time, from pickup at the store to your doorstep." },
];

function WhyQuickKart() {
  return (
    <section className="bg-[#F8F2EA] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2825A]">Why it's different</p>
          <h2 className="text-3xl text-[#241710] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Built around availability, not guesswork
          </h2>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          className="grid gap-px overflow-hidden rounded-3xl border border-[#241710]/[0.08] bg-[#241710]/[0.08] md:grid-cols-3"
        >
          {reasons.map((r, i) => (
            <motion.div key={r.title} custom={i} variants={fadeUp} className="bg-[#F8F2EA] p-8">
              <r.icon size={22} className="mb-4 text-[#C2825A]" strokeWidth={1.8} />
              <h3 className="mb-2 text-lg text-[#241710]" style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}>{r.title}</h3>
              <p className="text-sm leading-relaxed text-[#241710]/60">{r.copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Partner Banner ─────────────────────────────────────────────────────── */

const bannerItems = [
  { icon: Store, title: "Own a supermarket?",  copy: "Reach more customers nearby and manage orders without extra delivery overhead.", cta: "Apply to be a store partner", route: "/register/store" },
  { icon: Bike,  title: "Have a vehicle?",     copy: "Earn flexibly with distance-based pay, daily bonuses, and driver levels.",      cta: "Join the delivery fleet",      route: "/register/delivery" },
];

function PartnerBanner() {
  return (
    <section className="bg-[#2A1B12] px-6 py-20 text-[#F8F2EA]">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-[#F8F2EA]/10 bg-[#F8F2EA]/10 md:grid-cols-2">
        {bannerItems.map((b) => (
          <motion.div key={b.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-[#2A1B12] p-10">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#C2825A]/15 text-[#E3B894]">
              <b.icon size={20} />
            </span>
            <h3 className="mb-2 text-2xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>{b.title}</h3>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#F8F2EA]/60">{b.copy}</p>
            <Link to={b.route} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E3B894] transition-colors hover:text-[#F8F2EA]">
              {b.cta} <ArrowRight size={15} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function QuickKartLanding() {
  return (
    <div className="min-h-screen bg-[#F8F2EA] font-[Inter] text-[#241710] antialiased">
      <Navbar />
      <Hero />
      <RoleSelection />
      <HowItWorks />
      <WhyQuickKart />
      <PartnerBanner />
      <Footer />
    </div>
  );
}