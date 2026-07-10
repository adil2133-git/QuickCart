// components/Footer.tsx
import { Link } from "react-router-dom";
import { ShoppingCart, MapPin } from "lucide-react";
import { FaInstagram, FaTwitter } from "react-icons/fa";

export function Footer() {
  const cols = [
    { heading: "Company",      links: [{ label: "About us", to: "/about" }, { label: "Careers", to: "#" }, { label: "Blog", to: "#" }, { label: "Press", to: "#" }] },
    { heading: "For partners", links: [{ label: "Become a driver", to: "/register/delivery" }, { label: "Register your store", to: "/register/store" }, { label: "Fleet solutions", to: "#" }, { label: "Partner dashboard", to: "#" }] },
    { heading: "Legal",        links: [{ label: "Privacy policy", to: "#" }, { label: "Terms of service", to: "#" }, { label: "Cookie policy", to: "#" }, { label: "Disclaimer", to: "#" }] },
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
              <span className="text-lg font-semibold" style={{ fontFamily: "Fraunces, serif" }}>QuickKart</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#F8F2EA]/55">
              Redefining grocery delivery with real-time stock intelligence and local market expertise.
            </p>
            <div className="mt-6 flex gap-3">
              {[FaInstagram, FaTwitter].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F8F2EA]/15 text-[#F8F2EA]/70 transition-colors hover:border-[#C2825A] hover:text-[#C2825A]">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.heading}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8F2EA]/45">{c.heading}</h4>
              <ul className="flex flex-col gap-3 text-sm text-[#F8F2EA]/65">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="transition-colors hover:text-[#F8F2EA]">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F8F2EA]/10 py-6 text-xs text-[#F8F2EA]/45 md:flex-row">
          <span>© 2026 QuickKart. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> Available in select neighbourhoods</span>
        </div>
      </div>
    </footer>
  );
}