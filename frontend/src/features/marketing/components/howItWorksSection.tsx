import { motion } from "framer-motion";
import { Search, Navigation, PackageCheck } from "lucide-react";

const steps = [
  { icon: Search, title: "1. Search Product & Check Stock", copy: "Look up any item. QuickKart checks real-time inventory across nearby supermarkets." },
  { icon: Navigation, title: "2. Smart Match Store", copy: "Our algorithm matches you with the closest store that has 100% of your items in stock." },
  { icon: PackageCheck, title: "3. Express Doorstep Delivery", copy: "A local delivery partner picks up your packed order and arrives at your door in 15 minutes." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-24 border-t border-[#E3E7E1]">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-xl text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#145C43]">Simple 3-Step Process</p>
          <h2 className="text-3xl text-[#16241D] md:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
            How QuickKart works
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative flex flex-col items-center rounded-3xl border border-[#E3E7E1] bg-[#F5F7F3] p-8 text-center shadow-sm transition-all duration-300 hover:bg-white hover:border-[#145C43] hover:shadow-xl"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFEC] text-[#145C43] transition-all duration-300 group-hover:bg-[#145C43] group-hover:text-white group-hover:scale-110">
                <s.icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#6E7C74]">{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
