interface RestockBannerProps {
  imageUrl?: string;
  onRestockClick?: () => void;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop";

export default function RestockBanner({ imageUrl = DEFAULT_IMAGE, onRestockClick }: RestockBannerProps) {
  return (
    <div className="flex flex-1 items-stretch overflow-hidden rounded-2xl bg-[#FEF3C7] border border-[#FCD5A0]">
      <div className="flex flex-1 flex-col justify-center gap-4 px-7 py-7">
        <h3 className="text-2xl font-bold text-[#B47800]">Inventory Low?</h3>
        <p className="text-sm leading-relaxed text-[#92400E]">
          Restock your top items with one click using AI auto-refill.
        </p>
        <button
          type="button"
          onClick={onRestockClick}
          className="w-fit rounded-full bg-[#B47800] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#92400E] cursor-pointer shadow-sm"
        >
          Restock Now
        </button>
      </div>
      <div className="hidden w-44 flex-shrink-0 items-center pr-6 sm:flex">
        <img
          src={imageUrl}
          alt="Fresh groceries ready to restock"
          className="h-[85%] w-full rounded-xl object-cover shadow-lg"
        />
      </div>
    </div>
  );
}
