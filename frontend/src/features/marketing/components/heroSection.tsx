import { motion, type Variants } from "framer-motion";
import { ArrowRight, MapPin, Clock3, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { scrollTo } from "../utils/scroll";
import heroBgImg from "../../../assets/hero-bg1.png";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#F7F8F5]">
      {/* Background Hero Image with Soft Lighting Gradient Blend */}
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
