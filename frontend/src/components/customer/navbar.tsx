import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronDown,
  Search,
  ShoppingCart,
  Bell,
  User,
} from "lucide-react";

export default function NavBar({ cartCount }: { cartCount: number }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: "#FFF9EF", borderColor: "#D2C4B9", boxShadow: "0px 1px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto flex items-center justify-between gap-6 px-10" style={{ maxWidth: 1200, height: 89 }}>

        {/* Logo */}
        <motion.span
          whileHover={{ letterSpacing: "-0.5px" }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-2xl italic font-bold cursor-pointer"
          style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}
        >
          QuickKart
        </motion.span>

        {/* Location */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{ borderColor: "#D2C4B9", backgroundColor: "rgba(211,196,185,0.12)" }}
        >
          <MapPin size={13} color="#4E453D" />
          <span className="text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>Bengaluru</span>
          <ChevronDown size={11} color="#4E453D" />
        </motion.button>

        {/* Search */}
        <motion.div
          whileFocusWithin={{ boxShadow: "0 0 0 2px #C2A38333" }}
          className="flex flex-1 items-center gap-2 rounded-full border px-4 py-2.5 transition-shadow"
          style={{ backgroundColor: "#F9F3EA", borderColor: "#D2C4B9", maxWidth: 380 }}
        >
          <Search size={16} color="#4E453D" />
          <input
            placeholder="Search groceries, stores and more..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#80756B" }}
          />
        </motion.div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
          {["Categories", "Stores", "Offers"].map((l) => (
            <motion.span
              key={l}
              whileHover={{ color: "#735A3E" }}
              className="text-xs font-medium cursor-pointer transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}
            >
              {l}
            </motion.span>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Cart */}
          <motion.div
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            className="relative cursor-pointer"
          >
            <ShoppingCart size={20} color="#735A3E" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#376847" }}
                >
                  <span className="text-white font-bold" style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>
                    {cartCount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="cursor-pointer">
            <Bell size={18} color="#735A3E" />
          </motion.div>
          <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} className="cursor-pointer">
            <User size={18} color="#735A3E" />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}