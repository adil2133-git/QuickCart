export default function PasswordStrengthBar({ password }: { password: string }) {
  const len = password.length;
  const getColor = (index: number) => {
    if (len === 0) return "#e8e1dd";
    if (len <= 4) return index < 1 ? "#ba1a1a" : "#e8e1dd";
    if (len <= 8) return index < 2 ? "#f1e0ca" : "#e8e1dd";
    if (len <= 12) return index < 3 ? "#735a3e" : "#e8e1dd";
    return "#4f6072";
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