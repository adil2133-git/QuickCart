import { motion, type Variants } from "framer-motion";
import { Boxes, Sparkles, ShieldCheck, Zap } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

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

export function WhyQuickKartSection() {
  return (
    <section className="bg-white px-6 py-20 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-xl text-center"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#145C43]">Built For Reliability</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            Why QuickKart is faster & more accurate
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group rounded-3xl border border-[#E3E7E1] bg-[#F5F7F3] p-7 transition-all duration-300 hover:bg-white hover:border-[#145C43] hover:shadow-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145C43] text-white transition-transform duration-300 group-hover:scale-110">
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
