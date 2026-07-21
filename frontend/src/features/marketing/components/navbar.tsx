// components/Navbar.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X } from "lucide-react";
import { scrollTo } from "../utils/scroll";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks: { label: string; action: () => void }[] = [
    { label: "How it works", action: () => { setOpen(false); scrollTo("how-it-works"); } },
    { label: "For Stores",   action: () => { setOpen(false); scrollTo("join"); } },
    { label: "For Drivers",  action: () => { setOpen(false); scrollTo("join"); } },
    { label: "About",        action: () => { setOpen(false); navigate("/about"); } },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#16241D]/[0.06] bg-[#F7F8F5]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <button onClick={() => scrollTo("top")} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A1F17] text-[#FFFFFF]">
            <ShoppingCart size={16} strokeWidth={2.25} />
          </span>
          <span className="text-[1.15rem] font-semibold tracking-tight text-[#16241D]" style={{ fontFamily: "Fraunces, serif" }}>
            QuickKart
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 text-sm font-medium text-[#16241D]/70 md:flex">
          {navLinks.map((l) => (
            <li key={l.label}>
              <button onClick={l.action} className="transition-colors hover:text-[#16241D]">
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-5 md:flex">
          <Link to="/login" className="text-sm font-medium text-[#16241D]/70 transition-colors hover:text-[#16241D]">
            Log in
          </Link>
          <button
            onClick={() => scrollTo("join")}
            className="rounded-full bg-[#145C43] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#145C43]/30 transition-transform hover:-translate-y-0.5 hover:shadow-md hover:bg-[#114E39]"
          >
            Get started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="text-[#16241D] md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-[#16241D]/[0.06] bg-[#F7F8F5] px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-4 text-sm font-medium text-[#16241D]/80">
            {navLinks.map((l) => (
              <li key={l.label}>
                <button onClick={l.action} className="w-full text-left">
                  {l.label}
                </button>
              </li>
            ))}
            <li className="pt-1">
              <Link to="/login" className="block text-[#16241D]/70" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </li>
            <li>
              <button
                onClick={() => { setOpen(false); scrollTo("join"); }}
                className="block w-full rounded-full bg-[#145C43] px-5 py-2.5 text-center font-semibold text-white"
              >
                Get started
              </button>
            </li>
          </ul>
        </motion.div>
      )}
    </header>
  );
}