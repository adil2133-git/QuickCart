import { useState } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="15" viewBox="0 0 20 20" fill="#C2A383">
    <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
  </svg>
);

const ChevronRight = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="#735A3E" strokeWidth="1.5" strokeLinecap="round"><polyline points="1 1 6 6 1 11" /></svg>
);

const ChevronLeft = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="#735A3E" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 1 1 6 6 11" /></svg>
);

// ── NavBar ─────────────────────────────────────────────────────────────────────
function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#FFF9EF", borderColor: "#D2C4B9", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      <div className="mx-auto flex items-center justify-between gap-6 px-10" style={{ maxWidth: 1200, height: 89 }}>

        {/* Logo */}
        <span className="flex-shrink-0 text-2xl italic font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>
          QuickKart
        </span>

        {/* Location */}
        <button className="flex-shrink-0 flex items-center gap-1">
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7zm0 9.5C5.62 9.5 4.5 8.38 4.5 7S5.62 4.5 7 4.5 9.5 5.62 9.5 7 8.38 9.5 7 9.5z" fill="#4E453D" />
          </svg>
          <span className="text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>Bengaluru</span>
          <svg width="10" height="5" viewBox="0 0 10 5" className="ml-0.5"><path d="M0 0l5 5 5-5H0z" fill="#4E453D" /></svg>
        </button>

        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-full border px-4 py-2.5" style={{ backgroundColor: "#F9F3EA", borderColor: "#D2C4B9", maxWidth: 380 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4E453D" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#80756B" }}
          />
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
          {["Categories", "Stores", "Offers"].map(l => (
            <span key={l} className="text-xs font-medium cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>{l}</span>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Cart with badge */}
          <div className="relative cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#735A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#376847" }}>
              <span className="text-white font-bold" style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>3</span>
            </div>
          </div>
          {/* Bell */}
          <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="#735A3E" strokeWidth="2" strokeLinecap="round" className="cursor-pointer">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {/* User */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#735A3E" strokeWidth="2" strokeLinecap="round" className="cursor-pointer">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>

      </div>
    </header>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, action, actionItalic = false }: { title: string; action: string; actionItalic?: boolean }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E", lineHeight: "26px" }}>
        {title}
      </span>
      <span className={`text-xs font-semibold cursor-pointer ${actionItalic ? "italic" : ""}`} style={{ fontFamily: "'DM Sans', sans-serif", color: actionItalic ? "#4E453D" : "#735A3E" }}>
        {action}
      </span>
    </div>
  );
}

// ── Card Shell ─────────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-white border ${className}`} style={{ borderColor: "#D2C4B9", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CustomerHome() {

  const recentOrders = [
    { store: "Heritage Farm", name: "Free Range Eggs", emoji: "🥚", bg: "#E0D4C0" },
    { store: "Bumble & Bee", name: "Wildflower Honey", emoji: "🍯", bg: "#D4BC90" },
    { store: "Dairy Dreams", name: "Greek Style Yogurt", emoji: "🥛", bg: "#C4CEC0" },
    { store: "Heritage Farm", name: "Artisan Sourdough", emoji: "🍞", bg: "#8B7355" },
  ];

  const categories = [
    { name: "Fruits", emoji: "🍊" },
    { name: "Dairy", emoji: "🥛" },
    { name: "Bakery", emoji: "🍞" },
    { name: "Snacks", emoji: "🌰" },
    { name: "Vegetables", emoji: "🥕" },
    { name: "Pantry", emoji: "🫙" },
  ];

  const popularProducts = [
    { store: "The Curd Shop", name: "Aged Sharp Cheddar", weight: "200g • Farmstead Aged", price: "₹340", emoji: "🧀", bg: "#F0EBE3" },
    { store: "Mountain Roast", name: "Estate Coffee Beans", weight: "250g • Medium Roast", price: "₹495", emoji: "☕", bg: "#2C2018" },
    { store: "Green Garden Organics", name: "Seedless Green Grapes", weight: "500g • Pesticide Free", price: "₹120", emoji: "🍇", bg: "#D8E8D4" },
    { store: "Heritage Farm", name: "Honey Nut Granola", weight: "400g • Small Batch", price: "₹275", emoji: "🥣", bg: "#C8A060" },
  ];

  const recStores = [
    { initials: "AP", name: "The Artisan Pantry", rating: "4.7", tags: "Organic Staples • Spices", cardBg: "#2C2018" },
    { initials: "BG", name: "Boutique Greens", rating: "4.9", tags: "Hydroponic • Exotics", cardBg: "#1A2E1C" },
    { initials: "BH", name: "Bloom & Harvest", rating: "4.8", tags: "Fresh Fruits • Floral", cardBg: "#C49040" },
  ];

  const nearbyStores = [
    { name: "Green Garden Organics", rating: "4.8", dist: "1.2 km", time: "25–35 mins", bg: "#1A2E1C" },
    { name: "Heritage Farm", rating: "4.9", dist: "0.8 km", time: "15–20 mins", bg: "#3C2010" },
  ];

  const trending = [
    { store: "Green Garden Organics", name: "Fresh Strawberries", weight: "250g • Organic Grade A", price: "₹149", emoji: "🍓", bg: "#7C1A1A" },
    { store: "Heritage Farm", name: "Full Cream Milk", weight: "1 Litre • Glass Bottle", price: "₹68", emoji: "🥛", bg: "#2C3C4C" },
    { store: "Nature's Basket", name: "Organic Bananas", weight: "1 Dozen • Farm Fresh", price: "₹79", emoji: "🍌", bg: "#6B4E16" },
    { store: "Fresh Valley Farms", name: "Free Range Eggs", weight: "12 Pieces • Premium Quality", price: "₹129", emoji: "🥚", bg: "#4A3B2A" }, 
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF9EF", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,500&family=Playfair+Display:ital,wght@0,600;0,700;1,700&display=swap');`}</style>

      <NavBar />

      <main className="mx-auto px-10 py-12 flex flex-col gap-12" style={{ maxWidth: 1200 }}>

        {/* ── HERO BANNER ── */}
        <section
          className="relative rounded-2xl overflow-hidden"
          style={{ height: 480, boxShadow: "0px 8px 32px rgba(194,163,131,0.28)" }}
        >
          {/* BG gradient simulating produce photo */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(110deg, #6B4A20 0%, #9C7040 30%, #C8963C 55%, #D4A850 75%, #8B6020 100%)" }} />
          {/* Left fade overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,249,239,0.97) 0%, rgba(255,249,239,0.75) 38%, rgba(255,249,239,0.2) 60%, rgba(255,249,239,0) 100%)" }} />

          {/* Content */}
          <div className="absolute inset-0 flex items-center" style={{ padding: 48 }}>
            <div className="flex flex-col gap-4" style={{ maxWidth: 420 }}>
              {/* Badge */}
              <div className="flex w-fit items-center rounded-full px-3 py-1" style={{ backgroundColor: "rgba(128,180,141,0.2)" }}>
                <span className="text-xs font-medium" style={{ color: "#376847", fontFamily: "'DM Sans', sans-serif" }}>Curated Selection</span>
              </div>

              {/* Heading */}
              <h1 className="font-bold leading-tight m-0" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, letterSpacing: "-0.64px", color: "#735A3E", lineHeight: "40px", paddingTop: 8 }}>
                Freshness Delivered<br />To Your Doorstep
              </h1>

              {/* Sub */}
              <p className="text-sm m-0" style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: "22px", color: "#4E453D", maxWidth: 384 }}>
                Experience the warmth of your local neighborhood market from the comfort of your home. Hand-picked with care.
              </p>

              {/* CTA Row */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  className="text-white rounded-lg font-semibold cursor-pointer border-none"
                  style={{ backgroundColor: "#735A3E", padding: "15px 32px", fontFamily: "'Playfair Display', serif", fontSize: 16, lineHeight: "22px", boxShadow: "0px 2px 12px rgba(194,163,131,0.18)" }}
                >
                  Free delivery over ₹300
                </button>
                <span className="text-xs italic" style={{ fontFamily: "'DM Sans', sans-serif", color: "#80756B" }}>
                  *Limited time, new users only
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── RECENTLY ORDERED ── */}
        <section>
          <SectionHeader title="Recently Ordered" action="View Order History" />
          <div className="grid grid-cols-4 gap-6">
            {recentOrders.map((item, i) => (
              <Card key={i} className="flex flex-row items-center gap-4 p-4">
                <div className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center text-4xl" style={{ backgroundColor: item.bg }}>
                  {item.emoji}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium block" style={{ fontFamily: "'DM Sans', sans-serif", color: "#376847", lineHeight: "12px" }}>{item.store}</span>
                  <span className="font-semibold text-sm block mt-1 leading-5" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{item.name}</span>
                  <button
                    className="mt-2 w-fit rounded-full border-none cursor-pointer text-xs font-bold"
                    style={{ backgroundColor: "rgba(115,90,62,0.1)", color: "#735A3E", padding: "4px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: "16px" }}
                  >
                    Reorder
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── BROWSE BY CATEGORY ── */}
        <section>
          <SectionHeader title="Browse by Category" action="View All Categories" />
          <div className="flex justify-between">
            {categories.map((cat, i) => (
              <button key={i} className="flex flex-col items-center gap-4 cursor-pointer border-none bg-transparent group">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2C4B9", boxShadow: "0px 2px 12px rgba(194,163,131,0.18)" }}
                >
                  {cat.emoji}
                </div>
                <span className="font-semibold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── POPULAR IN THE NEIGHBORHOOD ── */}
        <section>
          <SectionHeader title="Popular in the Neighborhood" action="View Trending Items" />
          <div className="grid grid-cols-4 gap-6">
            {popularProducts.map((p, i) => (
              <Card key={i} className="flex flex-col">
                {/* Image */}
                <div className="p-[17px] pb-0">
                  <div className="h-48 rounded-lg flex items-center justify-center text-6xl" style={{ backgroundColor: p.bg }}>
                    {p.emoji}
                  </div>
                </div>
                {/* Info */}
                <div className="px-[17px] pt-[17px] flex flex-col gap-0.5">
                  <span className="text-xs font-medium block" style={{ fontFamily: "'DM Sans', sans-serif", color: "#376847", lineHeight: "12px" }}>{p.store}</span>
                  <span className="font-semibold block" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{p.name}</span>
                  <span className="text-sm block" style={{ fontFamily: "'DM Sans', sans-serif", color: "#D2C4B9", lineHeight: "22px" }}>{p.weight}</span>
                </div>
                {/* Price + Cart */}
                <div className="px-[17px] py-4 flex items-center justify-between">
                  <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#735A3E" }}>{p.price}</span>
                  <button
                    className="flex items-center gap-2 rounded-lg border-none cursor-pointer text-white"
                    style={{ backgroundColor: "#735A3E", padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 16 }}
                  >
                    <CartIcon /> Add to Cart
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── RECOMMENDED FOR YOU ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>Recommended for You</span>
            <span className="text-xs italic" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>Based on your recent organic finds</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {recStores.map((s, i) => (
              <Card key={i} className="flex flex-col">
                {/* Dark image top */}
                <div className="relative h-40 flex items-end" style={{ backgroundColor: s.cardBg }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)" }} />
                  <div className="relative z-10 flex items-center gap-3 p-6">
                    {/* Badge */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white" style={{ boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)" }}>
                      <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(115,90,62,0.1)" }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#735A3E" }}>{s.initials}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-lg text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{s.name}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    <StarIcon />
                    <span className="text-sm font-bold ml-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1D1B16" }}>{s.rating}</span>
                    <span className="text-sm ml-2" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>{s.tags}</span>
                  </div>
                  <button
                    className="w-full rounded-lg border-none cursor-pointer text-base py-2"
                    style={{ backgroundColor: "#EEDDC7", fontFamily: "'DM Sans', sans-serif", color: "#6D614F" }}
                  >
                    Visit Store
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── NEARBY STORES ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#735A3E" }}>Nearby Stores</span>
            <div className="flex items-center gap-2">
              {[<ChevronLeft key="l" />, <ChevronRight key="r" />].map((icon, i) => (
                <button key={i} className="w-[30px] h-[30px] rounded-full bg-white border flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors" style={{ borderColor: "#D2C4B9" }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {nearbyStores.map((s, i) => (
              <Card key={i} className="flex flex-col">
                {/* Store image */}
                <div className="relative h-56 flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <span className="text-8xl opacity-20">🏪</span>
                  {/* Open badge */}
                  <div
                    className="absolute top-4 right-4 rounded-full px-3 py-1"
                    style={{ backgroundColor: "rgba(55,104,71,0.15)", backdropFilter: "blur(6px)" }}
                  >
                    <span className="text-xs font-bold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#376847" }}>Open</span>
                  </div>
                </div>
                {/* Info */}
                <div className="flex items-start justify-between p-6">
                  <div>
                    <span className="font-semibold text-lg block" style={{ fontFamily: "'Playfair Display', serif", color: "#1D1B16" }}>{s.name}</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StarIcon />
                      <span className="text-sm font-bold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1D1B16" }}>{s.rating}</span>
                      <span className="text-sm" style={{ color: "#D2C4B9" }}>·</span>
                      <span className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>{s.dist}</span>
                      <span className="text-sm" style={{ color: "#D2C4B9" }}>·</span>
                      <span className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "#4E453D" }}>{s.time}</span>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 rounded-lg border-none cursor-pointer text-base"
                    style={{ backgroundColor: "#EEDDC7", padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", color: "#6D614F" }}
                  >
                    View Menu
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── TRENDING TODAY ── */}
        <section className="pb-12">
          <SectionHeader title="Trending Today" action="Explore More" />
          <div className="grid grid-cols-4 gap-6">
            {trending.map((item, i) => (
              <Card key={i} className="flex flex-col">
                {item.name ? (
                  <>
                    <div className="p-[17px] pb-0">
                      <div className="h-48 rounded-lg flex items-center justify-center text-6xl" style={{ backgroundColor: item.bg }}>
                        {item.emoji}
                      </div>
                    </div>
                    <div className="px-[17px] pt-[17px]">
                      <span className="text-xs font-medium block" style={{ fontFamily: "'DM Sans', sans-serif", color: "#376847" }}>{item.store}</span>
                      <span className="font-semibold block" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#1D1B16", lineHeight: "22px", marginTop: 3 }}>{item.name}</span>
                      <span className="text-sm block" style={{ fontFamily: "'DM Sans', sans-serif", color: "#D2C4B9" }}>{item.weight}</span>
                    </div>
                    <div className="px-[17px] py-4 flex items-center justify-between">
                      <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#735A3E" }}>{item.price}</span>
                      <button
                        className="w-10 h-10 rounded-lg flex items-center justify-center border-none cursor-pointer"
                        style={{ backgroundColor: "#735A3E", boxShadow: "0px 2px 12px rgba(194,163,131,0.18)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-[362px] rounded-xl" style={{ backgroundColor: "#F3EDE4" }} />
                )}
              </Card>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}