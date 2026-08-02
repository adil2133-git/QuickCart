import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Bike, Store, ArrowRight, Check } from "lucide-react";

// Same kitchen background asset used on the login page
import loginBgImg from "../../../assets/login-bg.png";

type AccountType = "customer" | "delivery" | "store" | null;

export default function CreateAccountModal() {
  const [selected, setSelected] = useState<AccountType>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected === "customer") navigate("/register/customer");
    else if (selected === "delivery") navigate("/register/delivery");
    else if (selected === "store") navigate("/register/store");
  };

  const options: { id: AccountType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: "customer",
      label: "Customer",
      description: "Shop for groceries from nearby stores",
      icon: <ShoppingBag size={20} className="text-[#145C43]" />,
    },
    {
      id: "delivery",
      label: "Delivery Partner",
      description: "Deliver orders and earn commissions",
      icon: <Bike size={20} className="text-[#145C43]" />,
    },
    {
      id: "store",
      label: "Store / Supermarket",
      description: "List your store and manage orders online",
      icon: <Store size={20} className="text-[#145C43]" />,
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F0F2ED] font-sans p-4 text-[#16241D]">
      
      {/* Full-Screen Background Image matching Login Page */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <img
          src={loginBgImg}
          alt="Sunlit Kitchen Produce Background"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center opacity-85 blur-[2px] transition-opacity duration-300"
        />
        {/* Soft Radial & Linear Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-white/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#F0F2ED]/60" />
      </div>

      {/* Centered Glassmorphic Modal Card */}
      <div className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-[36px] border border-white/80 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
        
        {/* Brand Header */}
        <div className="mb-2">
          <span className="text-2xl font-bold tracking-tight text-[#0A1F17]" style={{ fontFamily: "Fraunces, serif" }}>
            QuickKart
          </span>
        </div>

        {/* Modal Title & Subtitle */}
        <h2 className="text-3xl font-semibold text-[#0A1F17] sm:text-4xl" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
          Create an Account
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#6E7C74] sm:text-sm">
          Choose the type of account you want to create to get started.
        </p>

        {/* 3 Selectable Account Types */}
        <div className="mt-8 space-y-3.5 text-left">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`group relative flex w-full items-center gap-4 rounded-3xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? "border-[#145C43] bg-white/95 shadow-md ring-2 ring-[#145C43]/15"
                    : "border-white/60 bg-white/60 hover:border-[#145C43]/40 hover:bg-white/80"
                }`}
              >
                {/* Icon Tile */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  isSelected ? "bg-[#E8EFEC]" : "bg-[#F5F7F3]"
                }`}>
                  {opt.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0A1F17]">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-[#6E7C74]">{opt.description}</p>
                </div>

                {/* Radio Indicator Circle */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-[#145C43] bg-[#145C43] text-white"
                      : "border-[#C2CCC6] bg-transparent group-hover:border-[#145C43]"
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Action Button */}
        <button
          disabled={!selected}
          onClick={handleContinue}
          className={`group mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-lg transition-all ${
            selected
              ? "bg-[#708B7F] hover:bg-[#145C43] hover:shadow-xl active:bg-[#0E402F]"
              : "bg-[#9BAAA1] cursor-not-allowed opacity-60"
          }`}
        >
          Continue <ArrowRight size={16} className={`transition-transform ${selected ? "group-hover:translate-x-1" : ""}`} />
        </button>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[#6E7C74]">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-bold text-[#0A1F17] hover:underline"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}
