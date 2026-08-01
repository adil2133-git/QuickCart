export default function PasswordStrengthBar({ password }: { password: string }) {
  const len = password.length;
  const getColor = (index: number) => {
    if (len === 0) return "#E3E7E1";
    if (len <= 4) return index < 1 ? "#BA1A1A" : "#E3E7E1";
    if (len <= 8) return index < 2 ? "#B47800" : "#E3E7E1";
    if (len <= 12) return index < 3 ? "#16A34A" : "#E3E7E1";
    return "#16A34A";
  };
  return (
    <div className="flex gap-1 mt-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-sm transition-all duration-300"
          style={{ backgroundColor: getColor(i) }}
        />
      ))}
    </div>
  );
}