import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "delivery",
      label: "Delivery Partner",
      description: "Deliver orders and earn commissions",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="M15 6H3v11.5" />
          <path d="M3 9h10l2 5h3l1-5" />
        </svg>
      ),
    },
    {
      id: "store",
      label: "Store / Supermarket",
      description: "List your store and manage orders online",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l1-5h16l1 5" />
          <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
          <path d="M9 9v12" />
          <path d="M15 9v12" />
        </svg>
      ),
    },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(200,185,170,0.45)" }}
    >
      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 px-7 py-7"
        style={{ boxShadow: "0 8px 40px rgba(80,50,20,0.18)" }}
      >
        {/* Close */}
        <button
          onClick={() => navigate("/login")}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">Create an Account</h2>
        <p className="text-sm text-gray-500 mb-5">Choose the type of account you want to create</p>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-5">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className="flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 transition-all"
                style={{
                  border: isSelected ? "1.5px solid #C9A97A" : "1.5px solid #EAE0D5",
                  backgroundColor: isSelected ? "#FBF7F2" : "#FDFCFB",
                }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5EDE0" }}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">{opt.description}</p>
                </div>
                <div
                  className="flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                  style={{ width: 18, height: 18, borderColor: isSelected ? "#C9A97A" : "#C8B9A8", backgroundColor: "white" }}
                >
                  {isSelected && (
                    <div className="rounded-full" style={{ width: 9, height: 9, backgroundColor: "#C9A97A" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          disabled={!selected}
          onClick={handleContinue}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            backgroundColor: selected ? "#C9A97A" : "#DDD0C0",
            color: selected ? "#fff" : "#A8967E",
            cursor: selected ? "pointer" : "default",
          }}
        >
          Continue
        </button>

        {/* Login Link */}
        <p className="text-center text-sm mt-4">
          <span className="text-gray-500">Already have an account? </span>
          <button
            onClick={() => navigate("/login")}
            className="font-medium hover:underline"
            style={{ color: "#C9A97A" }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
