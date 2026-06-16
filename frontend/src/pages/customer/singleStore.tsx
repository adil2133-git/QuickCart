import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  img: string;
}

interface BestsellerProduct {
  id: number;
  name: string;
  price: string;
  unit: string;
  rating: number;
  description: string;
  img: string;
}

interface Review {
  id: number;
  initials: string;
  name: string;
  rating: number;
  timeAgo: string;
  text: string;
  avatarBg: string;
  avatarText: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const BESTSELLERS: BestsellerProduct[] = [
  {
    id: 1,
    name: "Organic Baby Spinach",
    price: "$4.50",
    unit: "200g",
    rating: 4.9,
    description: "Freshly harvested triple-washed baby spinach from local farms.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9lMwt1zQP7ILfn10vBp7RFYM9_ZRkP6J8a3ZXD8iy9M3G6pmmaW9_npEuPtxwX5xUiGQ4uLhPptRMv2-6flndEHEoyaxdp8hl1TU5nqPKQqmxTZ9-C-aSu9KE21DzEWiShddoeFvCxDLU5d_SvCx2DmH5sJio-y7fElL35fd8sbzlcS09P-luzQ688lemRB1GKIp91_FAeGLnNO7qQf_uEaR_RJoCsBOV5mzwNJaqBf4D53yADwQf-H_4EjPqrB7vymbaZfETEEBx",
  },
  {
    id: 2,
    name: "Rainbow Carrots",
    price: "$3.25",
    unit: "bunch",
    rating: 4.7,
    description: "Bunch of heirloom carrots including purple and yellow varieties.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFGhvD1fIusqXYjtTfFaUlrEuPBXKyId-70JV4WKxPX2r6plpm410_9JAocPSSjMyEr_JJqpUay-Y8BOAwYA3JvHpb53VIN4ZhQmLH48h-1QKpuP7RRdxKQ3pMwiGc0V26O4MTn99pKEdxNLfVksEQ6rg_5SLDJ9EejEoHVgV7dPDklxi17HusX096IFWWY6Qkac4egji8qFU6sozKaqvctiYH_PGDU9Tj0qKbICQ9HDP8pl6cgwVZhKYhC3V9yJ77VWRcrchqI_tI",
  },
];

const ALL_PRODUCTS: Product[] = [
  { id: 1, name: "Sourdough Bread", price: "$6.50", category: "Bakery", img: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=300" },
  { id: 2, name: "Avocado Hass", price: "$2.00", category: "Fruits", img: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=300" },
  { id: 3, name: "Greek Yogurt", price: "$4.80", category: "Dairy", img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=300" },
  { id: 4, name: "Local Honey", price: "$12.00", category: "Pantry", img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=300" },
  { id: 5, name: "Cherry Tomatoes", price: "$3.40", category: "Vegetables", img: "https://images.unsplash.com/photo-1546473427-e183b9dec75c?auto=format&fit=crop&q=80&w=300" },
  { id: 6, name: "Almond Milk", price: "$5.20", category: "Dairy", img: "https://images.unsplash.com/photo-1563636619-e9107da4a7ba?auto=format&fit=crop&q=80&w=300" },
  { id: 7, name: "Blueberries", price: "$4.00", category: "Fruits", img: "https://images.unsplash.com/photo-1497534446932-c946e7316ba1?auto=format&fit=crop&q=80&w=300" },
  { id: 8, name: "Kale Bunch", price: "$2.50", category: "Vegetables", img: "https://images.unsplash.com/photo-1524179853809-87582c7080ec?auto=format&fit=crop&q=80&w=300" },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    initials: "JD",
    name: "Jane Doe",
    rating: 5,
    timeAgo: "2 days ago",
    text: "The quality of produce here is unmatched. I specifically love their heirloom tomatoes and the sourdough bread is always fresh from the oven.",
    avatarBg: "#eeddc7",
    avatarText: "#685d4b",
  },
  {
    id: 2,
    initials: "MS",
    name: "Mark Smith",
    rating: 4,
    timeAgo: "1 week ago",
    text: "Fast delivery and great packing. The leafy greens were still crisp when they arrived. Highly recommend the subscription box.",
    avatarBg: "#e7e2d9",
    avatarText: "#735a3e",
  },
];

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Pantry"];

const KPI_STATS = [
  { value: "850+", label: "Products" },
  { value: "45", label: "Best Sellers" },
  { value: "4.8", label: "Avg Rating" },
  { value: "10k+", label: "Orders" },
  { value: "20m", label: "Delivery" },
];

const RATING_BARS = [
  { star: 5, pct: 75 },
  { star: 4, pct: 15 },
  { star: 3, pct: 5 },
  { star: 2, pct: 3 },
  { star: 1, pct: 2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRow({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <div className={`flex text-[#735a3e] ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined"
          style={{
            fontVariationSettings: `'FILL' ${i <= Math.floor(rating) ? 1 : i - 0.5 <= rating ? 0.5 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20`,
            fontSize: "inherit",
          }}
        >
          {i <= Math.floor(rating) ? "star" : i - 0.5 <= rating ? "star_half" : "star"}
        </span>
      ))}
    </div>
  );
}

function AddButton({ label = false }: { label?: boolean }) {
  const [added, setAdded] = useState(false);
  const handleClick = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return label ? (
    <button
      onClick={handleClick}
      className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-white transition-all active:scale-95"
      style={{ backgroundColor: added ? "#376847" : "#735a3e" }}
    >
      <span className="material-symbols-outlined text-sm" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
        {added ? "check" : "shopping_cart"}
      </span>
      {added ? "Added" : "Add"}
    </button>
  ) : (
    <button
      onClick={handleClick}
      className="w-12 h-12 flex items-center justify-center rounded-2xl text-white shadow-md transition-all active:scale-90"
      style={{ backgroundColor: added ? "#376847" : "#735a3e" }}
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
        {added ? "check" : "add"}
      </span>
    </button>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div
      className="relative bg-white rounded-3xl p-4 border border-[#d2c4b9]/30 hover:shadow-2xl transition-all duration-300 flex flex-col"
      onMouseEnter={() => setShowAdd(true)}
      onMouseLeave={() => setShowAdd(false)}
    >
      {/* Wishlist */}
      <button
        onClick={() => setWishlisted(!wishlisted)}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "18px",
            fontVariationSettings: `'FILL' ${wishlisted ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20`,
            color: wishlisted ? "#ba1a1a" : "#4e453d",
          }}
        >
          favorite
        </span>
      </button>

      {/* Image */}
      <div className="aspect-square rounded-2xl overflow-hidden mb-4">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 flex-grow">
        <span className="text-[10px] uppercase tracking-widest text-[#4e453d] font-bold">{product.category}</span>
        <h4 className="text-base font-semibold text-[#1d1b16]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {product.name}
        </h4>
        <div className="flex items-center justify-between mt-auto pt-4">
          <span
            className="font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#735a3e" }}
          >
            {product.price}
          </span>
          <div
            className="transition-all duration-300"
            style={{ opacity: showAdd ? 1 : 0, transform: showAdd ? "translateY(0)" : "translateY(8px)" }}
          >
            <AddButton label />
          </div>
        </div>
      </div>
    </div>
  );
}

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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FreshMartStorePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [followed, setFollowed] = useState(false);

  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>

    <NavBar />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=DM+Sans:wght@100..900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(231,215,193,0.4); }
        .reviews-scroll::-webkit-scrollbar { width: 4px; }
        .reviews-scroll::-webkit-scrollbar-track { background: transparent; }
        .reviews-scroll::-webkit-scrollbar-thumb { background: #E7D7C1; border-radius: 10px; }
        .cat-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden"
        style={{ backgroundColor: "#fff9ef", color: "#1d1b16", fontFamily: "'DM Sans', sans-serif" }}
      >
        <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-20">

          {/* ── 1. Hero ── */}
          <header className="relative mt-8 group">
            <div className="h-[400px] w-full rounded-3xl overflow-hidden relative shadow-lg">
              <div
                className="absolute inset-0 z-10"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfSSWGJHSYnVcnxNTD3pyflOerwUejrCzDGNHmfbQ70T0sPT6TltYTDKJ6etbnZIECieT34q3Nkdrh5g2boqkpC1SHEeFdHoqvalK0cVrtaD4LHtMtOTI6ebzLIRneqWtyOygqO3XXUoKL6GQQKQ3amYPKoQNMiu-I8xplUlNpABpaFuWdMSCuzJ5gpls9qA_XPZoPdIu7wysM48APVjUt3YS6Jf78F6TyvkbNMtWx89kREixVe5rj0b89rnA7eUI_yw0Ko7aUr5-S"
                alt="Fresh Mart Interior"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Store identity overlay */}
            <div className="absolute -bottom-20 left-8 md:left-12 z-20 flex items-end gap-6 w-full">
              <div
                className="w-36 h-36 rounded-full border-8 shadow-xl overflow-hidden flex-shrink-0"
                style={{ borderColor: "#fff9ef", backgroundColor: "#fff" }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPOK2dYUq-HcQWVW3LWhNwvEssc281OH2OrdzJhDWiHOL1GvHKUlYj4GloF3GzeQAi5HamCRRoNc7Y0H9SgBmyUuFI2aIsf2l-d-NVB8z5iqTibMM5e_WpfBS1pwXm5CE0wRZ7VyHRMQx2nCubPqejX6jCjELRKQxC704bamVNcUBrOupFGl-J8LqAOdhWmcNHzN7y_624ATiUr2X9NuOyklgAQHZ2ejKbjYNZ4Up94ovNrLoCgeYmAZzyV6KfSduevuCtqnkWj1Ay"
                  alt="Fresh Mart logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pb-4 flex-grow flex flex-col md:flex-row md:items-end justify-between pr-10">
                <div>
                  <h1
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em" }}
                    className="text-[#1d1b16] mb-2"
                  >
                    Fresh Mart
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(55,104,71,0.1)", color: "#376847" }}>
                      Organic Grocery
                    </span>
                    <div className="flex items-center gap-1 text-[#735a3e]">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", fontSize: "16px" }}>star</span>
                      <span className="text-xs font-bold">4.5</span>
                      <span className="text-xs text-[#4e453d]">(1.2k reviews)</span>
                    </div>
                    <span className="text-[#4e453d]">•</span>
                    <span className="text-xs text-[#4e453d]">📍 2.3 KM Away</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-white" style={{ backgroundColor: "#376847" }}>
                      OPEN NOW
                    </span>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 flex gap-3">
                  <button
                    onClick={() => setFollowed(!followed)}
                    className="px-6 py-2.5 rounded-full border text-sm font-medium transition-all active:scale-95"
                    style={{
                      borderColor: "#735a3e",
                      color: followed ? "#fff" : "#735a3e",
                      backgroundColor: followed ? "#735a3e" : "transparent",
                    }}
                  >
                    {followed ? "Following" : "Follow Store"}
                  </button>
                  <button
                    className="px-6 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95"
                    style={{ backgroundColor: "#ede7de", color: "#1d1b16" }}
                  >
                    Contact
                  </button>
                  <button
                    className="w-11 h-11 flex items-center justify-center rounded-full border text-[#4e453d] hover:text-[#735a3e] transition-all active:scale-95"
                    style={{ borderColor: "#d2c4b9" }}
                  >
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ── 2. KPI Cards ── */}
          <section className="mt-28 grid grid-cols-2 md:grid-cols-5 gap-4">
            {KPI_STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-4 rounded-2xl flex flex-col items-center text-center shadow-sm">
                <span
                  className="font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#735a3e" }}
                >
                  {stat.value}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#4e453d] mt-1 font-medium">{stat.label}</span>
              </div>
            ))}
          </section>

          {/* ── 3. Curated Bestsellers ── */}
          <section className="mt-16">
            <div className="flex justify-between items-end mb-8">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700 }}>
                Curated Bestsellers
              </h2>
              <a href="#" className="text-sm font-medium text-[#735a3e] hover:underline">
                View All
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {BESTSELLERS.map((item) => (
                <div
                  key={item.id}
                  className="flex bg-white rounded-3xl overflow-hidden border border-[#d2c4b9]/30 hover:shadow-xl transition-all duration-300 group"
                  style={{ height: "224px" }}
                >
                  <div className="w-2/5 relative overflow-hidden flex-shrink-0">
                    <span
                      className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg"
                      style={{ backgroundColor: "#735a3e" }}
                    >
                      BESTSELLER
                    </span>
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="w-3/5 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[#735a3e] mb-1">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: "14px" }}>star</span>
                        <span className="text-xs font-bold">{item.rating}</span>
                      </div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 600 }} className="text-[#1d1b16]">
                        {item.name}
                      </h3>
                      <p className="text-[#4e453d] text-sm mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 600, color: "#735a3e" }}>
                        {item.price}{" "}
                        <small className="text-[#4e453d] text-xs font-normal">/ {item.unit}</small>
                      </span>
                      <AddButton />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 4. Product Catalog ── */}
          <section className="mt-20">
            {/* Sticky toolbar */}
            <div
              className="sticky top-0 z-50 py-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#d2c4b9]/20"
              style={{ backgroundColor: "rgba(255,249,239,0.85)", backdropFilter: "blur(12px)" }}
            >
              {/* Search */}
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4e453d]" style={{ fontSize: "20px" }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "#d2c4b9", backgroundColor: "#fff", fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto cat-scroll">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                    style={{
                      backgroundColor: activeCategory === cat ? "#735a3e" : "#fff",
                      color: activeCategory === cat ? "#fff" : "#4e453d",
                      border: `1px solid ${activeCategory === cat ? "#735a3e" : "#d2c4b9"}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium text-[#4e453d] transition-all"
                  style={{ borderColor: "#d2c4b9", backgroundColor: "#fff" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>tune</span>
                  Sort
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-4 text-center py-16 text-[#4e453d]">No products found.</div>
              )}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                className="px-8 py-3 rounded-full border text-sm font-medium text-[#735a3e] hover:bg-[#735a3e]/5 transition-all active:scale-95"
                style={{ borderColor: "#735a3e" }}
              >
                Load More Products
              </button>
            </div>
          </section>

          {/* ── 5. Store Info & Reviews ── */}
          <section className="mt-24 grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left: Store Intelligence */}
            <div className="md:col-span-5 space-y-8">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700 }}>
                Store Intelligence
              </h2>
              <div className="space-y-4">
                {/* Operating Hours */}
                <div
                  className="p-6 rounded-2xl border flex items-start gap-4"
                  style={{ backgroundColor: "#f9f3ea", borderColor: "rgba(210,196,185,0.3)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(115,90,62,0.1)", color: "#735a3e" }}
                  >
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1d1b16] mb-1">Operating Hours</h4>
                    <p className="text-sm text-[#4e453d]">Mon – Fri: 08:00 AM – 09:00 PM</p>
                    <p className="text-sm text-[#4e453d]">Sat – Sun: 09:00 AM – 10:00 PM</p>
                  </div>
                </div>

                {/* Policies */}
                <div
                  className="p-6 rounded-2xl border flex items-start gap-4"
                  style={{ backgroundColor: "#f9f3ea", borderColor: "rgba(210,196,185,0.3)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(55,104,71,0.1)", color: "#376847" }}
                  >
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1d1b16] mb-1">Store Policies</h4>
                    <p className="text-sm text-[#4e453d]">100% Organic certified. Return items within 24 hours if not satisfied.</p>
                  </div>
                </div>

                {/* Map */}
                <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-[#d2c4b9]/30">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO4Acxz1ltl-21VYJxl9KNmQ_TfFmf2RAn6I9_EATE5TK4eFhhL09cgclTRmtrniN7cb6Ztfw5G79ltY4Pul4SJqzMQWmS-cxyEQJdpwZdvFNbnqDi0y3O4HntvJSCoRUY-4lu3pU3o_J2-mRkgDRa2Q6ebShF06EYkB-yCkA7beV4FqO7zLXkxOT5qjhNbMqLjWn346fF4JiqW-z_gU74UGw64WoTzvGxcTkY5UzZRfJlFuEt0kHy2jRWTxHXl-Oqr3yh16ZoP6yO"
                    alt="Store Map"
                    className="w-full h-full object-cover"
                    style={{ filter: "grayscale(1)", opacity: 0.5 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-[#735a3e]"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                      >
                        location_on
                      </span>
                      <span className="text-xs font-medium text-[#1d1b16]">123 Artisan Way, Organic Valley</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Customer Sentiment */}
            <div className="md:col-span-7 space-y-8">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700 }}>
                Customer Sentiment
              </h2>
              <div className="bg-white p-8 rounded-3xl border border-[#d2c4b9]/30 shadow-sm">
                {/* Rating summary */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div
                    className="text-center md:pr-8 flex-shrink-0"
                    style={{ borderRight: "1px solid rgba(210,196,185,0.3)" }}
                  >
                    <div
                      style={{ fontSize: "48px", fontWeight: 700, color: "#1d1b16", lineHeight: 1 }}
                      className="mb-1"
                    >
                      4.5
                    </div>
                    <StarRow rating={4.5} size="text-xl" />
                    <div className="text-[10px] uppercase tracking-widest text-[#4e453d] mt-2">1,245 Ratings</div>
                  </div>

                  <div className="flex-grow w-full space-y-2">
                    {RATING_BARS.map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs w-4 text-[#4e453d]">{star}</span>
                        <div className="flex-grow h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f3ede4" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: "#735a3e" }}
                          />
                        </div>
                        <span className="text-xs text-[#4e453d] w-8">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 reviews-scroll">
                  {REVIEWS.map((r) => (
                    <div key={r.id} className="border-t border-[#d2c4b9]/30 pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: r.avatarBg, color: r.avatarText }}
                          >
                            {r.initials}
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-[#1d1b16]">{r.name}</h5>
                            <StarRow rating={r.rating} size="text-xs" />
                          </div>
                        </div>
                        <span className="text-xs text-[#4e453d]">{r.timeAgo}</span>
                      </div>
                      <p className="text-sm text-[#4e453d] leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer
          className="border-t py-12 px-10 text-center"
          style={{ backgroundColor: "#f9f3ea", borderColor: "#d2c4b9" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <h3
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 600, color: "#735a3e" }}
              className="mb-2"
            >
              QuickKart
            </h3>
            <p className="text-sm text-[#4e453d]">Empowering local artisans and bringing fresh produce to your doorstep.</p>
            <div className="mt-8 flex justify-center gap-6">
              {["Privacy Policy", "Terms of Service", "Help Center"].map((l) => (
                <a key={l} href="#" className="text-sm text-[#4e453d] hover:text-[#735a3e] transition-colors">
                  {l}
                </a>
              ))}
            </div>
            <p className="mt-8 text-xs text-[#4e453d]">© 2024 QuickKart Marketplace. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}