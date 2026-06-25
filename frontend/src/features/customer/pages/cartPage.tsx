import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingCart,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  PackageOpen,
  Store,
  X,
  RefreshCw,
} from "lucide-react";
import { useCartStore } from "../state/cartState";

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_CHARGE = 30;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CartSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-5 border border-[#EDE6DA] flex gap-4 animate-pulse"
      >
        <div className="w-20 h-20 rounded-xl bg-[#EDE6DA] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#EDE6DA] rounded w-3/4" />
          <div className="h-3 bg-[#EDE6DA] rounded w-1/4" />
          <div className="h-4 bg-[#EDE6DA] rounded w-1/3 mt-3" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="h-4 bg-[#EDE6DA] rounded w-16" />
          <div className="h-9 bg-[#EDE6DA] rounded-xl w-24" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyCart: React.FC<{ onShop: () => void }> = ({ onShop }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <div className="w-20 h-20 rounded-full bg-[#F5EDE3] flex items-center justify-center mb-5">
      <ShoppingCart className="w-9 h-9 text-[#C9A96E]" />
    </div>
    <h2
      className="text-xl font-bold text-[#1A1208] mb-2"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      Your cart is empty
    </h2>
    <p className="text-sm text-[#7A6652] mb-8 max-w-xs">
      Browse local stores and add items to get started.
    </p>
    <button
      onClick={onShop}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6B4C2A] text-white text-sm font-semibold hover:bg-[#5A3D22] active:scale-[0.98] transition-all"
    >
      <Store className="w-4 h-4" />
      Explore Stores
    </button>
  </div>
);

// ─── Multi-store Conflict Modal ───────────────────────────────────────────────

const ConflictModal: React.FC = () => {
  const { conflict, resolveConflict, dismissConflict } = useCartStore();
  const [resolving, setResolving] = useState(false);

  if (!conflict) return null;

  const handleReplace = async () => {
    setResolving(true);
    await resolveConflict(true);
    setResolving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismissConflict}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF3E2] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#92400E]" />
          </div>
          <button
            onClick={dismissConflict}
            className="text-[#A89880] hover:text-[#6B4C2A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-bold text-[#1A1208] mb-2">
          Start a new cart?
        </h3>
        <p className="text-sm text-[#7A6652] leading-relaxed mb-6">
          Your cart has items from{" "}
          <span className="font-semibold text-[#1A1208]">
            {conflict.cartStoreName}
          </span>
          . Adding from{" "}
          <span className="font-semibold text-[#1A1208]">
            {conflict.newStoreName}
          </span>{" "}
          will clear your current cart. Orders can only be placed from a single
          store at a time.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleReplace}
            disabled={resolving}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#6B4C2A] text-white text-sm font-semibold hover:bg-[#5A3D22] disabled:opacity-60 transition-all"
          >
            {resolving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {resolving ? "Clearing cart…" : "Clear cart & add item"}
          </button>

          <button
            onClick={dismissConflict}
            className="w-full h-11 rounded-xl border border-[#E0D5C5] text-sm font-medium text-[#6B4C2A] hover:bg-[#F5EDE3] transition-all"
          >
            Keep current cart
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────

const CartItemRow: React.FC<{
  item: NonNullable<ReturnType<typeof useCartStore.getState>["cart"]>["products"][0];
}> = ({ item }) => {
  const { updateQuantity, removeItem, isUpdating } = useCartStore();
  const product = item.productId;
  const isThisUpdating = isUpdating === product._id;

  const img =
    product.images?.[0] ||
    "https://placehold.co/200x200/f3ede4/735a3e?text=No+Image";

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      removeItem(product._id);
    } else {
      updateQuantity(product._id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.quantity >= product.stockQuantity) return;
    updateQuantity(product._id, item.quantity + 1);
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE6DA] flex gap-4 transition-opacity ${
        isThisUpdating ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Product image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5EDE3]">
        <img
          src={img}
          alt={product.productName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1208] leading-snug truncate">
          {product.productName}
        </p>
        {product.unit && (
          <p className="text-xs text-[#A89880] mt-0.5">per {product.unit}</p>
        )}
        <p className="text-base font-bold text-[#6B4C2A] mt-2">
          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-[#A89880]">
          ₹{item.price.toLocaleString("en-IN")} each
        </p>
      </div>

      {/* Qty + remove */}
      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
        <button
          onClick={() => removeItem(product._id)}
          aria-label="Remove item"
          className="text-[#C9A96E] hover:text-rose-500 transition-colors"
        >
          {isThisUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>

        {/* Quantity stepper */}
        <div className="inline-flex items-center rounded-xl border border-[#E0D5C5] overflow-hidden">
          <button
            onClick={handleDecrement}
            aria-label="Decrease quantity"
            className="w-8 h-8 flex items-center justify-center text-[#6B4C2A] hover:bg-[#F5EDE3] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-[#1A1208] border-x border-[#E0D5C5]">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrement}
            aria-label="Increase quantity"
            disabled={item.quantity >= product.stockQuantity}
            className="w-8 h-8 flex items-center justify-center text-[#6B4C2A] hover:bg-[#F5EDE3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {product.stockQuantity <= 5 && (
          <span className="text-[10px] text-rose-500 font-medium">
            {product.stockQuantity} left
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Order Summary ────────────────────────────────────────────────────────────

const OrderSummary: React.FC<{
  subtotal: number;
  onCheckout: () => void;
  onContinue: () => void;
  isLoading: boolean;
}> = ({ subtotal, onCheckout, onContinue, isLoading }) => {
  const total = subtotal + (subtotal > 0 ? DELIVERY_CHARGE : 0);

  return (
    <div className="bg-white rounded-2xl border border-[#EDE6DA] p-6 space-y-5 sticky top-6">
      <h2
        className="text-xl font-bold text-[#1A1208]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Order Summary
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-[#5C4A38]">
          <span>Subtotal</span>
          <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-[#5C4A38]">
          <span>Delivery Charge</span>
          <span className="font-medium">
            {subtotal > 0 ? `₹${DELIVERY_CHARGE}` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-[#5C4A38]">
          <span>Taxes & Fees</span>
          <span className="font-medium">₹0</span>
        </div>
      </div>

      <div className="h-px bg-[#EDE6DA]" />

      <div className="flex justify-between items-center">
        <span
          className="text-base font-bold text-[#1A1208]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Total
        </span>
        <span
          className="text-xl font-bold text-[#1A1208]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ₹{total.toLocaleString("en-IN")}
        </span>
      </div>

      <button
        onClick={onCheckout}
        disabled={isLoading || subtotal === 0}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#6B4C2A] text-white text-sm font-semibold hover:bg-[#5A3D22] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E0D5C5] text-sm font-medium text-[#6B4C2A] hover:bg-[#F5EDE3] active:scale-[0.98] transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Continue Shopping
      </button>

      {/* Trust badge */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F3ED] border border-[#EDE6DA]">
        <ShieldCheck className="w-5 h-5 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#7A6652] leading-relaxed">
          Items in your cart are handled with care and come from verified
          neighbourhood artisans.
        </p>
      </div>
    </div>
  );
};

// ─── Main CartPage ────────────────────────────────────────────────────────────

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, error, fetchCart, conflict, clearError } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Dismiss errors after 4 s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 4000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  const products = cart?.products ?? [];
  const hasItems = products.length > 0;

  // Store info (all items are from the same store)
  const store = hasItems ? products[0].productId.storeId : null;

  const subtotal = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div
      className="min-h-screen bg-[#F7F3ED]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Conflict modal */}
      <ConflictModal />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FEE8E8] border border-[#FDB8B8] shadow-lg text-sm font-medium text-[#991B1B] max-w-sm w-full mx-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={clearError} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1208] tracking-tight">
            Your Shopping Cart
          </h1>
          {hasItems && (
            <p className="text-sm text-[#7A6652] mt-1">
              {products.reduce((s, i) => s + i.quantity, 0)} item
              {products.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {isLoading && !cart ? (
          // Initial load skeleton
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div>
              <div className="h-5 bg-[#EDE6DA] rounded animate-pulse w-40 mb-4" />
              <CartSkeleton />
            </div>
            <div className="h-80 bg-[#EDE6DA] rounded-2xl animate-pulse" />
          </div>
        ) : !hasItems ? (
          <EmptyCart onShop={() => navigate("/customer/home")} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: Items */}
            <div className="space-y-5">
              {/* Store label */}
              {store && (
                <button
                  onClick={() =>
                    navigate(`/customer/store/${store._id}`)
                  }
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#6B4C2A] flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#1A1208] group-hover:text-[#6B4C2A] transition-colors">
                    {store.storeName}
                  </span>
                </button>
              )}

              {/* Divider */}
              <div className="h-px bg-[#EDE6DA]" />

              {/* Items */}
              <div className="space-y-3">
                {products.map((item) => (
                  <CartItemRow key={item.productId._id} item={item} />
                ))}
              </div>

              {/* Single-store notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF3E2] border border-[#FCD5A0]">
                <AlertTriangle className="w-4 h-4 text-[#92400E] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#92400E] leading-relaxed">
                  QuickKart orders are fulfilled by a single store. Adding
                  products from another store will replace your current cart.
                </p>
              </div>

              {/* Empty state for products section */}
              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-[#D4C9B8] gap-2">
                  <PackageOpen className="w-7 h-7 text-[#C9A96E]" />
                  <p className="text-sm text-[#7A6652]">
                    No items in your cart.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <OrderSummary
              subtotal={subtotal}
              onCheckout={() => navigate("/customer/checkout")}
              onContinue={() => navigate(-1)}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;