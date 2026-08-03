export default function PasswordStrengthBar({ password }: { password: string }) {
  const len = password.length;
  if (!password) return null;

  const getStrength = () => {
    if (len <= 4) return { label: "Weak", color: "#EF4444", count: 1 };
    if (len <= 8) return { label: "Fair", color: "#F59E0B", count: 2 };
    if (len <= 11) return { label: "Good", color: "#10B981", count: 3 };
    return { label: "Strong", color: "#059669", count: 4 };
  };

  const { label, color, count } = getStrength();

  return (
    <div className="mt-1.5 pl-1">
      <div className="flex items-center justify-between text-[10px] font-semibold mb-1" style={{ color }}>
        <span>Password Strength</span>
        <span>{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= count ? color : "#E5E7EB" }}
          />
        ))}
      </div>
    </div>
  );
}