import type { BestSellingItem } from "../../../features/store/types/dashboard";

interface BestSellingCardProps {
  items: BestSellingItem[];
}

export default function BestSellingCard({ items }: BestSellingCardProps) {
  const maxSold = Math.max(...items.map((item) => item.unitsSold), 1);

  return (
    <div className="rounded-2xl border border-[#EFE6DA] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-[#2B1B0E]">Best Selling Today</h3>

      {items.length === 0 ? (
        <p className="text-sm text-[#A38F7D]">No sales recorded yet today.</p>
      ) : (
        <ul className="space-y-5">
          {items.map((item) => {
            const widthPct = Math.max((item.unitsSold / maxSold) * 100, 4);
            return (
              <li key={item.productId}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-[#2B1B0E]">{item.productName}</span>
                  <span className="whitespace-nowrap text-sm font-semibold text-[#2B1B0E]">
                    {item.unitsSold} sold
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F3EAE0]">
                  <div
                    className="h-2 rounded-full bg-[#C8A37E]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
