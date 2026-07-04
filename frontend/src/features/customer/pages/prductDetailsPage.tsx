import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  MapPin,
  Package,
  ChevronRight,
  Share2,
  Shield,
  RotateCcw,
  Truck,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  Award,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  useWishlistStore,
  useProductDetailStore,
} from "../state/productState";
import { useCartStore } from "../state/cartState";
import { useProductDetail } from "../hooks/useProductDetail";
import type { Product, Review, StoreInfo } from "../types/product";

// ─── Mock reviews ─────────────────────────────────────────────────────────────

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    userName: "Priya M.",
    rating: 5,
    comment:
      "Absolutely love this! The quality is amazing and delivery was super fast. Will definitely order again.",
    date: "2024-12-10",
    verified: true,
  },
  {
    id: "r2",
    userName: "Arjun K.",
    rating: 4,
    comment:
      "Great product, very fresh. Packaging could be better but the product itself is top notch.",
    date: "2024-11-28",
    verified: true,
  },
  {
    id: "r3",
    userName: "Sneha R.",
    rating: 5,
    comment:
      "Exactly as described. Love supporting local stores through QuickKart!",
    date: "2024-11-15",
    verified: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: "sm" | "md" }> = ({
  rating,
  size = "md",
}) => {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= Math.floor(rating)
              ? "fill-[#C9A96E] text-[#C9A96E]"
              : star - 0.5 <= rating
              ? "fill-[#C9A96E]/50 text-[#C9A96E]"
              : "fill-transparent text-[#D4C9B8]"
          }`}
        />
      ))}
    </div>
  );
};

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "green" | "amber" | "red" | "brown";
}> = ({ children, variant = "green" }) => {
  const styles = {
    green: "bg-[#E8F5EE] text-[#2D6A4F] border-[#B7DFC9]",
    amber: "bg-[#FEF3E2] text-[#92400E] border-[#FCD5A0]",
    red: "bg-[#FEE8E8] text-[#991B1B] border-[#FDB8B8]",
    brown: "bg-[#F5EDE3] text-[#6B4C2A] border-[#DEC9AE]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const ProductDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F7F3ED]" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="flex items-center gap-2">
        {[120, 80, 160].map((w, i) => (
          <React.Fragment key={i}>
            <div className="h-4 bg-[#E0D5C5] rounded animate-pulse" style={{ width: w }} />
            {i < 2 && <div className="w-3 h-3 bg-[#E0D5C5] rounded animate-pulse" />}
          </React.Fragment>
        ))}
      </div>
    </div>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
        <div className="aspect-square rounded-2xl bg-[#E0D5C5] animate-pulse" />
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            {[80, 110].map((w, i) => (
              <div key={i} className="h-6 bg-[#E0D5C5] rounded-full animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-[#E0D5C5] rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-[#E0D5C5] rounded animate-pulse w-1/4" />
          </div>
          <div className="h-4 bg-[#E0D5C5] rounded animate-pulse w-1/3" />
          <div className="h-10 bg-[#E0D5C5] rounded-lg animate-pulse w-1/2" />
          <div className="h-px bg-[#EDE6DA]" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 bg-[#E0D5C5] rounded-xl animate-pulse" />
            <div className="h-12 flex-1 bg-[#E0D5C5] rounded-xl animate-pulse" />
          </div>
          <div className="h-20 bg-[#E0D5C5] rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────

const ProductDetailError: React.FC<{ message: string; onBack: () => void }> = ({
  message,
  onBack,
}) => (
  <div className="min-h-screen bg-[#F7F3ED] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-full bg-[#FEE8E8] flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-[#991B1B]" />
      </div>
      <h2 className="text-lg font-bold text-[#1A1208] mb-2">Product not found</h2>
      <p className="text-sm text-[#7A6652] mb-6">{message}</p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B4C2A] text-white text-sm font-medium hover:bg-[#5A3D22] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  </div>
);

// ─── Image Gallery ────────────────────────────────────────────────────────────

const ImageGallery: React.FC<{ images: string[]; productName: string }> = ({
  images,
  productName,
}) => {
  const { selectedImageIndex, setSelectedImageIndex } = useProductDetailStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { product } = useProductDetailStore();

  const wishlisted = product ? isWishlisted(product._id) : false;

  const handlePrev = useCallback(() => {
    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const displayImages = images.length > 0 ? images : ["/placeholder-product.jpg"];

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-6">
      <div className="relative overflow-hidden rounded-2xl bg-[#F0EAE0] aspect-square group">
        <img
          src={displayImages[selectedImageIndex]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4 text-[#1A1208]" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4 text-[#1A1208]" />
            </button>
          </>
        )}

        <button
          onClick={() => product && toggleWishlist(product._id)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? "fill-rose-500 text-rose-500" : "text-[#6B4C2A]"
            }`}
          />
        </button>

        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedImageIndex ? "w-4 bg-[#6B4C2A]" : "w-1.5 bg-[#6B4C2A]/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImageIndex(i)}
              aria-label={`Thumbnail ${i + 1}`}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === selectedImageIndex
                  ? "border-[#6B4C2A]"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Quantity Selector ────────────────────────────────────────────────────────

const QuantitySelector: React.FC = () => {
  const { quantity, incrementQuantity, decrementQuantity } = useProductDetailStore();
  return (
    <div className="inline-flex items-center gap-0 rounded-xl border border-[#E0D5C5] overflow-hidden">
      <button
        onClick={decrementQuantity}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="w-10 h-10 flex items-center justify-center text-[#6B4C2A] hover:bg-[#F5EDE3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#1A1208] border-x border-[#E0D5C5]">
        {quantity}
      </span>
      <button
        onClick={incrementQuantity}
        aria-label="Increase quantity"
        className="w-10 h-10 flex items-center justify-center text-[#6B4C2A] hover:bg-[#F5EDE3] transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

const InfoPill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-sm text-[#7A6652]">
    <span className="text-[#6B4C2A]">{icon}</span>
    {label}
  </div>
);

// ─── Store Card ───────────────────────────────────────────────────────────────

const StoreCard: React.FC<{ store: StoreInfo; onViewStore?: (id: string) => void }> = ({
  store,
  onViewStore,
}) => (
  <div
    onClick={() => onViewStore?.(store._id)}
    className="flex items-center justify-between p-4 rounded-2xl border border-[#E8DDD0] bg-[#FDFAF7] hover:border-[#C9A96E]/50 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-[#6B4C2A] flex items-center justify-center">
        <span className="text-white font-bold text-sm">
          {store.storeName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
      </div>
      <div>
        <p className="font-semibold text-[#1A1208] text-sm">{store.storeName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {store.distance && (
            <div className="flex items-center gap-1 text-xs text-[#7A6652]">
              <MapPin className="w-3 h-3" />
              {store.distance}
            </div>
          )}
          {store.rating && (
            <>
              <span className="text-[#D4C9B8]">•</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-[#C9A96E] text-[#C9A96E]" />
                <span className="text-xs font-medium text-[#7A6652]">{store.rating}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs font-medium text-[#6B4C2A] group-hover:gap-2 transition-all">
      View Store
      <ChevronRight className="w-3.5 h-3.5" />
    </div>
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div className="py-4 border-b border-[#EDE6DA] last:border-0">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#F0EAE0] flex items-center justify-center">
          <span className="text-xs font-semibold text-[#6B4C2A]">{review.userName[0]}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1A1208]">{review.userName}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2D6A4F] bg-[#E8F5EE] px-1.5 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" />
                Verified
              </span>
            )}
          </div>
          <span className="text-xs text-[#A89880]">
            {new Date(review.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <StarRating rating={review.rating} size="sm" />
    </div>
    <p className="text-sm text-[#5C4A38] leading-relaxed pl-10">{review.comment}</p>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TabKey = "description" | "details" | "reviews";

const buildStoreInfo = (product: Product): StoreInfo => {
  const s = product.storeId as unknown as {
    _id: string;
    storeName?: string;
    averageRating?: number;
  } | null;

  return {
    _id: s?._id ?? "",
    storeName: s?.storeName ?? "Unknown Store",
    rating: s?.averageRating,
    totalRatings: undefined,
    distance: undefined,
  };
};

// ─── Main ProductDetailPage ───────────────────────────────────────────────────

const ProductDetailPage: React.FC = () => {
  const { storeId = "", productId = "" } = useParams<{ storeId: string; productId: string }>();
  const navigate = useNavigate();

  const { product, isLoading, error } = useProductDetail(productId, storeId);
  const { quantity, reset } = useProductDetailStore();

  // ✅ Only pull what actually exists in your cart store
  const addToCartAction = useCartStore((s) => s.addToCart);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const fetchCart = useCartStore((s) => s.fetchCart);

  // Cart item count for NavBar badge
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    void fetchCart();
    return () => reset();
  }, [fetchCart, reset]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (error || !product) {
    return (
      <ProductDetailError
        message={error ?? "This product could not be loaded."}
        onBack={() => navigate(-1)}
      />
    );
  }

  const storeInfo    = buildStoreInfo(product);
  const cartQuantity = getItemQuantity(product._id);
  const isAvailable  = product.availabilityStatus === "AVAILABLE";

  const averageRating = 4.8;
  const totalReviews  = 124;

  // ✅ Synchronous — no async/await, no conflict check, pass full product object
  const handleAddToCart = () => {
    addToCartAction(product._id, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    toast.success("Added to cart", {
      description: `${product.productName} · ${quantity} × ₹${product.price.toLocaleString("en-IN")}`,
    });
  };

  const handleViewStore = (id: string) => navigate(`/customer/store/${id}`);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "details",     label: "Details" },
    { key: "reviews",     label: `Reviews (${totalReviews})` },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3ED]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-[#A89880]">
          {[
            { label: "Home",    path: "/customer/home" },
            { label: product.categoryId?.categoryName ?? "Category", path: "/customer/discovery" },
            { label: product.productName, path: "#" },
          ].map((crumb, i, arr) => (
            <React.Fragment key={crumb.path}>
              {i < arr.length - 1 ? (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="hover:text-[#6B4C2A] transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-[#1A1208] font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              )}
              {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* ── Main Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

          <ImageGallery images={product.images} productName={product.productName} />

          <div className="flex flex-col gap-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isBestseller && (
                <Badge variant="amber"><Award className="w-3 h-3" /> Bestseller</Badge>
              )}
              {product.availabilityStatus === "AVAILABLE" && (
                <Badge variant="green"><Check className="w-3 h-3" /> In Stock · Ready to Ship</Badge>
              )}
              {product.availabilityStatus === "OUT_OF_STOCK" && (
                <Badge variant="red">Out of Stock</Badge>
              )}
              {product.categoryId?.categoryName && (
                <Badge variant="brown"><Tag className="w-3 h-3" /> {product.categoryId.categoryName}</Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1208] leading-tight tracking-tight">
                {product.productName}
              </h1>
              {product.unit && (
                <p className="text-sm text-[#A89880] mt-1">per {product.unit}</p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={averageRating} />
              <span className="text-sm font-semibold text-[#1A1208]">{averageRating}</span>
              <button
                onClick={() => setActiveTab("reviews")}
                className="text-sm text-[#6B4C2A] underline-offset-2 hover:underline"
              >
                ({totalReviews} reviews)
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#1A1208]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="h-px bg-[#EDE6DA]" />

            {/* Quantity + CTA */}
            {isAvailable && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#5C4A38]">Qty</span>
                  <QuantitySelector />
                  {product.stockQuantity <= 10 && product.stockQuantity > 0 && (
                    <span className="text-xs text-rose-600 font-medium">
                      Only {product.stockQuantity} left!
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {/* ✅ Add to Cart — synchronous, no isAddingThis / conflict */}
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm border-2 transition-all ${
                      addedToCart
                        ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                        : "bg-white border-[#6B4C2A] text-[#6B4C2A] hover:bg-[#F5EDE3]"
                    }`}
                  >
                    {addedToCart ? (
                      <><Check className="w-4 h-4" /> Added to Cart</>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                        {cartQuantity > 0 && (
                          <span className="bg-[#6B4C2A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {cartQuantity}
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm bg-[#6B4C2A] text-white hover:bg-[#5A3D22] active:scale-[0.98] transition-all">
                    <Zap className="w-4 h-4" /> Buy Now
                  </button>

                  <button
                    aria-label="Share product"
                    className="w-12 h-12 rounded-xl border border-[#E0D5C5] flex items-center justify-center text-[#7A6652] hover:bg-[#F0EAE0] transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!isAvailable && (
              <div className="h-12 rounded-xl bg-[#F0EAE0] flex items-center justify-center text-sm text-[#A89880] font-medium">
                Currently unavailable
              </div>
            )}

            {/* Trust pills */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FDFAF7] border border-[#EDE6DA]">
              <InfoPill icon={<Truck className="w-4 h-4" />} label="Fast Delivery" />
              <InfoPill icon={<Shield className="w-4 h-4" />} label="Secure Pay" />
              <InfoPill icon={<RotateCcw className="w-4 h-4" />} label="Easy Returns" />
            </div>

            {/* Stock info */}
            <div className="flex items-center gap-2 text-sm text-[#7A6652]">
              <Package className="w-4 h-4 text-[#6B4C2A]" />
              <span>
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} ${product.unit ?? "units"} available`
                  : "Out of stock"}
              </span>
            </div>

            <div className="h-px bg-[#EDE6DA]" />

            {/* Store card */}
            {storeInfo._id && (
              <div>
                <p className="text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
                  Sold by
                </p>
                <StoreCard store={storeInfo} onViewStore={handleViewStore} />
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-10 bg-white rounded-2xl border border-[#EDE6DA] overflow-hidden">
          <div className="flex border-b border-[#EDE6DA]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
                  activeTab === tab.key ? "text-[#6B4C2A]" : "text-[#A89880] hover:text-[#6B4C2A]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B4C2A] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "description" && (
              <p className="text-[#5C4A38] leading-relaxed text-sm sm:text-base">
                {product.description || "No description available for this product."}
              </p>
            )}

            {activeTab === "details" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Product Name",   value: product.productName },
                  { label: "Category",       value: product.categoryId?.categoryName ?? "—" },
                  { label: "Unit",           value: product.unit ?? "—" },
                  { label: "Stock Quantity", value: `${product.stockQuantity} ${product.unit ?? "units"}` },
                  { label: "Availability",   value: product.availabilityStatus.replace("_", " ") },
                  {
                    label: "Added On",
                    value: product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric",
                        })
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between py-2.5 px-3 rounded-lg bg-[#FDFAF7] border border-[#EDE6DA]"
                  >
                    <span className="text-xs font-medium text-[#A89880] uppercase tracking-wide">{label}</span>
                    <span className="text-sm font-medium text-[#1A1208] text-right capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center gap-6 mb-6 pb-5 border-b border-[#EDE6DA]">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#1A1208]">{averageRating}</p>
                    <StarRating rating={averageRating} />
                    <p className="text-xs text-[#A89880] mt-1">{totalReviews} reviews</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-[#A89880] w-2">{star}</span>
                        <Star className="w-3 h-3 fill-[#C9A96E] text-[#C9A96E]" />
                        <div className="flex-1 h-1.5 rounded-full bg-[#EDE6DA] overflow-hidden">
                          <div
                            className="h-full bg-[#C9A96E] rounded-full"
                            style={{
                              width: `${star === 5 ? 68 : star === 4 ? 20 : star === 3 ? 8 : star === 2 ? 3 : 1}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  {MOCK_REVIEWS.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;