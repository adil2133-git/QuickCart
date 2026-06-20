/**
 * QuickKart — Landing Page
 * -------------------------------------------------------------
 * Stack: React + TypeScript + Tailwind CSS + Framer Motion + lucide-react
 *
 * Install (if not already present):
 *   npm install framer-motion lucide-react
 *
 * Fonts (add to your index.html <head>, or import via @font-face):
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
 *
 * Tailwind: this file uses arbitrary-value classes (bg-[#2A1B12] etc.) so it
 * works with zero config changes. If you want the tokens as named theme
 * colors instead, see the THEME TOKENS comment block below.
 *
 * ---------------------------------------------------------------
 * THEME TOKENS
 *  espresso   #2A1B12   – primary dark background (hero, footer, banner)
 *  espresso-2 #3A2718   – secondary dark surface (cards on dark bg)
 *  clay       #C2825A   – primary accent / signature route-line color
 *  sand       #C2A383   – secondary accent / outline buttons
 *  linen      #E7D7C1   – section background (mid-tone)
 *  cream      #F8F2EA   – lightest background
 *  ink        #241710   – body text on light backgrounds
 * ---------------------------------------------------------------
 */

import React, { useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ShoppingCart,
  Store,
  Bike,
  Search,
  Navigation,
  PackageCheck,
  Boxes,
  Sparkles,
  Radar,
  ArrowRight,
  MapPin,
  Clock3,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { FaInstagram, FaTwitter } from "react-icons/fa";

/* -------------------------------------------------------------------------- */
/*  Shared motion presets                                                     */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* -------------------------------------------------------------------------- */
/*  Signature element: animated delivery-route line                          */
/*  A dashed path representing a driver's route, with a dot that travels      */
/*  along it on a loop and a pin that "pops" at the destination.              */
/* -------------------------------------------------------------------------- */

function RouteSignature() {
  return (
    <svg
      viewBox="0 0 420 260"
      fill="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="routeFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C2825A" stopOpacity="0" />
          <stop offset="15%" stopColor="#C2825A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C2825A" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* store pin */}
      <circle cx="34" cy="56" r="5" fill="#C2825A" />
      <circle cx="34" cy="56" r="9" stroke="#C2825A" strokeWidth="1.5" opacity="0.4" />

      {/* route path */}
      <motion.path
        d="M34 56 C 110 40, 140 130, 210 130 S 320 70, 386 188"
        stroke="url(#routeFade)"
        strokeWidth="2.5"
        strokeDasharray="2 8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 0.3 }}
      />

      {/* moving courier dot */}
      <motion.circle
        r="5"
        fill="#F8F2EA"
        stroke="#C2825A"
        strokeWidth="2"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 2.1 }}
        style={{
          offsetPath:
            "path('M34 56 C 110 40, 140 130, 210 130 S 320 70, 386 188')",
        }}
      />

      {/* destination pin */}
      <motion.g
        initial={{ opacity: 0, scale: 0.4, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
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

/* -------------------------------------------------------------------------- */
/*  Nav                                                                       */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["How it works", "For Stores", "For Drivers", "About"];

  return (
    <header className="sticky top-0 z-50 border-b border-[#241710]/[0.06] bg-[#F8F2EA]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A1B12] text-[#F8F2EA]">
            <ShoppingCart size={16} strokeWidth={2.25} />
          </span>
          <span
            className="text-[1.15rem] font-semibold tracking-tight text-[#241710]"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QuickKart
          </span>
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-[#241710]/70 md:flex">
          {links.map((l) => (
            <li key={l}>
              <a href="#" className="transition-colors hover:text-[#241710]">
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 md:flex">
          <a
            href="#"
            className="text-sm font-medium text-[#241710]/70 transition-colors hover:text-[#241710]"
          >
            Log in
          </a>
          <a
            href="#join"
            className="rounded-full bg-[#C2825A] px-5 py-2.5 text-sm font-semibold text-[#241710] shadow-sm shadow-[#C2825A]/30 transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            Get started
          </a>
        </div>

        <button
          className="text-[#241710] md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-[#241710]/[0.06] bg-[#F8F2EA] px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-4 text-sm font-medium text-[#241710]/80">
            {links.map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#join"
                className="block rounded-full bg-[#C2825A] px-5 py-2.5 text-center font-semibold text-[#241710]"
              >
                Get started
              </a>
            </li>
          </ul>
        </motion.div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-[#2A1B12] px-6 pb-20 pt-16 text-[#F8F2EA] md:pb-28 md:pt-20"
    >
      {/* faint texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #F8F2EA 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
        >
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

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[#F8F2EA]/65"
          >
            QuickKart checks real stock across nearby supermarkets in real
            time — so you order from the store that actually has it, not just
            the closest one.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#join"
              className="group inline-flex items-center gap-2 rounded-full bg-[#C2825A] px-6 py-3.5 text-sm font-semibold text-[#241710] transition-transform hover:-translate-y-0.5"
            >
              Order now
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#join"
              className="inline-flex items-center gap-2 rounded-full border border-[#F8F2EA]/25 px-6 py-3.5 text-sm font-semibold text-[#F8F2EA] transition-colors hover:bg-[#F8F2EA]/10"
            >
              Explore stores
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#F8F2EA]/60"
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-[#E3B894]" /> Hyperlocal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={15} className="text-[#E3B894]" /> Real-time stock
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap size={15} className="text-[#E3B894]" /> Fast delivery
            </span>
          </motion.div>
        </motion.div>

        {/* Signature visual: route trace inside a soft card, phone optional */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
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

/* -------------------------------------------------------------------------- */
/*  Role selection                                                            */
/* -------------------------------------------------------------------------- */

const roles = [
  {
    icon: ShoppingCart,
    title: "Order groceries",
    copy: "Shop from nearby supermarkets and track every item until it's at your door.",
    cta: "Start shopping",
    primary: true,
  },
  {
    icon: Store,
    title: "Partner your store",
    copy: "Bring your supermarket online, manage inventory live, and reach new customers.",
    cta: "Register your store",
    primary: false,
  },
  {
    icon: Bike,
    title: "Become a driver",
    copy: "Deliver on your schedule and earn through commissions, bonuses and levels.",
    cta: "Start delivering",
    primary: false,
  },
];

function RoleSelection() {
  return (
    <section id="join" className="bg-[#F8F2EA] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2825A]">
            Join the ecosystem
          </p>
          <h2
            className="text-3xl text-[#241710] md:text-4xl"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            One platform, three ways in
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {roles.map((r, i) => (
            <motion.div
              key={r.title}
              custom={i}
              variants={fadeUp}
              className="group flex flex-col rounded-3xl border border-[#241710]/[0.07] bg-white p-8 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#241710]/[0.06]"
            >
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2825A]/15 text-[#C2825A] transition-colors group-hover:bg-[#C2825A] group-hover:text-white">
                <r.icon size={22} strokeWidth={2} />
              </span>
              <h3
                className="mb-2 text-xl text-[#241710]"
                style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}
              >
                {r.title}
              </h3>
              <p className="mb-7 flex-1 text-[0.95rem] leading-relaxed text-[#241710]/60">
                {r.copy}
              </p>
              <a
                href="#"
                className={
                  r.primary
                    ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#241710] px-5 py-3 text-sm font-semibold text-[#F8F2EA] transition-transform hover:-translate-y-0.5"
                    : "inline-flex items-center justify-center gap-2 rounded-full border border-[#241710]/15 px-5 py-3 text-sm font-semibold text-[#241710] transition-colors hover:bg-[#241710]/[0.04]"
                }
              >
                {r.cta}
                <ArrowRight size={15} />
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                              */
/* -------------------------------------------------------------------------- */

const steps = [
  {
    icon: Search,
    title: "Search a product",
    copy: "Look up exactly what you need — we check live stock, not guesses.",
  },
  {
    icon: Navigation,
    title: "Find the nearest stock",
    copy: "We rank stores by availability, distance, rating and price.",
  },
  {
    icon: PackageCheck,
    title: "Get it delivered",
    copy: "A nearby driver picks up and tracks the route to your door.",
  },
];

function HowItWorks() {
  return (
    <section className="relative bg-[#E7D7C1] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8C5A37]">
            From search to doorstep
          </p>
          <h2
            className="text-3xl text-[#241710] md:text-4xl"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            How QuickKart works
          </h2>
        </motion.div>

        <div className="relative grid gap-12 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-[#241710]/15 md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center"
            >
              <span className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F2EA] text-[#241710] shadow-sm ring-1 ring-[#241710]/10">
                <s.icon size={22} strokeWidth={1.8} />
              </span>
              <h3
                className="mb-2 text-lg text-[#241710]"
                style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}
              >
                {s.title}
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-[#241710]/60">
                {s.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Why QuickKart                                                             */
/* -------------------------------------------------------------------------- */

const reasons = [
  {
    icon: Boxes,
    title: "Real stock, not estimates",
    copy: "Inventory syncs with every partner store roughly once a minute. No more arriving to an out-of-stock surprise.",
  },
  {
    icon: Sparkles,
    title: "Smart store ranking",
    copy: "We weigh availability, distance, delivery speed, rating and price to find your best match — automatically.",
  },
  {
    icon: Radar,
    title: "Live route tracking",
    copy: "Watch your order move in real time, from pickup at the store to your doorstep.",
  },
];

function WhyQuickKart() {
  return (
    <section className="bg-[#F8F2EA] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2825A]">
            Why it's different
          </p>
          <h2
            className="text-3xl text-[#241710] md:text-4xl"
            style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
          >
            Built around availability, not guesswork
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-px overflow-hidden rounded-3xl border border-[#241710]/[0.08] bg-[#241710]/[0.08] md:grid-cols-3"
        >
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              custom={i}
              variants={fadeUp}
              className="bg-[#F8F2EA] p-8"
            >
              <r.icon size={22} className="mb-4 text-[#C2825A]" strokeWidth={1.8} />
              <h3
                className="mb-2 text-lg text-[#241710]"
                style={{ fontFamily: "Fraunces, serif", fontWeight: 500 }}
              >
                {r.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#241710]/60">
                {r.copy}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Partner banner                                                            */
/* -------------------------------------------------------------------------- */

function PartnerBanner() {
  return (
    <section className="bg-[#2A1B12] px-6 py-20 text-[#F8F2EA]">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-[#F8F2EA]/10 bg-[#F8F2EA]/10 md:grid-cols-2">
        {[
          {
            icon: Store,
            title: "Own a supermarket?",
            copy: "Reach more customers nearby and manage orders without extra delivery overhead.",
            cta: "Apply to be a store partner",
          },
          {
            icon: Bike,
            title: "Have a vehicle?",
            copy: "Earn flexibly with distance-based pay, daily bonuses, and driver levels.",
            cta: "Join the delivery fleet",
          },
        ].map((b) => (
          <motion.div
            key={b.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[#2A1B12] p-10"
          >
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#C2825A]/15 text-[#E3B894]">
              <b.icon size={20} />
            </span>
            <h3
              className="mb-2 text-2xl"
              style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
            >
              {b.title}
            </h3>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#F8F2EA]/60">
              {b.copy}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E3B894] transition-colors hover:text-[#F8F2EA]"
            >
              {b.cta}
              <ArrowRight size={15} />
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  const cols = [
    {
      heading: "Company",
      links: ["About us", "Careers", "Blog", "Press"],
    },
    {
      heading: "For partners",
      links: ["Become a driver", "Register your store", "Fleet solutions", "Partner dashboard"],
    },
    {
      heading: "Legal",
      links: ["Privacy policy", "Terms of service", "Cookie policy", "Disclaimer"],
    },
  ];

  return (
    <footer className="bg-[#241710] px-6 pt-16 text-[#F8F2EA]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2825A] text-[#241710]">
                <ShoppingCart size={16} />
              </span>
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                QuickKart
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#F8F2EA]/55">
              Redefining grocery delivery with real-time stock intelligence
              and local market expertise.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F8F2EA]/15 text-[#F8F2EA]/70 transition-colors hover:border-[#C2825A] hover:text-[#C2825A]"
              >
                <FaInstagram size={15} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F8F2EA]/15 text-[#F8F2EA]/70 transition-colors hover:border-[#C2825A] hover:text-[#C2825A]"
              >
                <FaTwitter size={15} />
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.heading}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8F2EA]/45">
                {c.heading}
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-[#F8F2EA]/65">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition-colors hover:text-[#F8F2EA]">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F8F2EA]/10 py-6 text-xs text-[#F8F2EA]/45 md:flex-row">
          <span>© 2026 QuickKart. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} /> Available in select neighbourhoods
          </span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

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