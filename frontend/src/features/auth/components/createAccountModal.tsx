import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Bike, Store, ArrowRight, Check, X } from "lucide-react";

// Same kitchen background asset used on the login page
import loginBgImg from "../../../assets/login-bg.webp";

type AccountType = "customer" | "delivery" | "store" | null;

interface CreateAccountModalProps {
  onClose?: () => void;
  standalone?: boolean;
}

export default function CreateAccountModal({ onClose, standalone = false }: CreateAccountModalProps) {
  const [selected, setSelected] = useState<AccountType>(null);
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

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
      icon: <ShoppingBag size={18} className="text-[#145C43]" />,
    },
    {
      id: "delivery",
      label: "Delivery Partner",
      description: "Deliver orders and earn commissions",
      icon: <Bike size={18} className="text-[#145C43]" />,
    },
    {
      id: "store",
      label: "Store / Supermarket",
      description: "List your store and manage orders online",
      icon: <Store size={18} className="text-[#145C43]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-[#16241D]">
      
      {/* Darkened Backdrop with Blur */}
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-md transition-opacity" 
      />

      {/* Standalone Full-Screen Background Image if accessed directly */}
      {standalone && (
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
          <img
            src={loginBgImg}
            alt="Sunlit Kitchen Produce Background"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-center opacity-85 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-white/35 to-transparent" />
        </div>
      )}

      {/* Centered Compact Glassmorphic Modal Card */}
      <div className="relative z-10 w-full max-w-[380px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-7">
        
        {/* Top Right Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-[#6E7C74] transition-colors hover:bg-black/10 hover:text-[#16241D]"
        >
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div>
          <span className="text-xl font-bold tracking-tight text-[#0A1F17]" style={{ fontFamily: "Fraunces, serif" }}>
            QuickKart
          </span>
        </div>

        {/* Modal Title & Subtitle */}
        <h2 className="mt-1 text-2xl font-semibold text-[#0A1F17]" style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}>
          Create an Account
        </h2>
        <p className="mt-1 text-xs leading-snug text-[#6E7C74]">
          Choose the type of account you want to create to get started.
        </p>

        {/* 3 Selectable Account Types */}
        <div className="mt-5 space-y-2.5 text-left">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? "border-[#145C43] bg-white shadow-sm ring-1 ring-[#145C43]/20"
                    : "border-black/5 bg-white/60 hover:border-[#145C43]/40 hover:bg-white/80"
                }`}
              >
                {/* Icon Tile */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isSelected ? "bg-[#E8EFEC]" : "bg-[#F5F7F3]"
                }`}>
                  {opt.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0A1F17]">{opt.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[#6E7C74]">{opt.description}</p>
                </div>

                {/* Radio Indicator Circle */}
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-[#145C43] bg-[#145C43] text-white"
                      : "border-[#C2CCC6] bg-transparent group-hover:border-[#145C43]"
                  }`}
                >
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Action Button */}
        <button
          disabled={!selected}
          onClick={handleContinue}
          className={`group mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white shadow-md transition-all ${
            selected
              ? "bg-[#0A1F17] hover:bg-[#145C43] shadow-lg active:bg-[#0E402F]"
              : "bg-[#9BAAA1] cursor-not-allowed opacity-50"
          }`}
        >
          Continue <ArrowRight size={14} className={`transition-transform ${selected ? "group-hover:translate-x-1" : ""}`} />
        </button>

        {/* Footer Link */}
        <div className="mt-4 text-center text-[11px] text-[#6E7C74]">
          Already have an account?{" "}
          <button
            onClick={() => {
              if (onClose) onClose();
              navigate("/login");
            }}
            className="font-bold text-[#0A1F17] hover:underline"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}
