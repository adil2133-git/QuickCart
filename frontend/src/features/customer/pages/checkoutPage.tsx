import { Check, ChevronDown, Loader2, Lock, MapPin, ShoppingBag, Tag } from "lucide-react";
import {
  useAddressDropdown,
  useCartItems,
  useCoupon,
  useDeliveryInstructions,
  useLoadCheckoutSummary,
  useOrderTotals,
  usePayment,
  usePlaceOrder,
} from "../hooks/useCheckout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SavedAddress } from "../types/checkout";

// ─── StepBadge ────────────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#6B4226] text-white text-sm font-semibold shrink-0">
      {n}
    </span>
  );
}

// ─── AddressDropdown ──────────────────────────────────────────────────────────
// Addresses are now flat strings from the backend (label + address + optional
// coordinates) rather than the old structured mock shape — no name/city/zip
// fields exist server-side, so the dropdown renders what's actually there.

function AddressRow({ addr }: { addr: SavedAddress }) {
  return (
    <div className="flex-1 min-w-0">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-[#6B4226] bg-[#F5EBE0] px-2 py-0.5 rounded-full">
        {addr.label || "Address"}
      </span>
      <p className="text-sm font-medium text-[#1A1108] mt-0.5 truncate">{addr.address}</p>
    </div>
  );
}

function AddressDropdown() {
  const { addresses, selectedAddressId, setSelectedAddressId, selected } = useAddressDropdown();
  const [open, setOpen] = useState(false);

  if (addresses.length === 0) {
    return (
      <div className="border border-dashed border-[#D6C4AE] rounded-xl px-4 py-5 text-center">
        <p className="text-sm text-[#9C7E5F]">No saved addresses yet.</p>
        <button className="mt-2 text-sm font-medium text-[#6B4226] hover:underline">
          + Add a delivery address
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 border border-[#D6C4AE] rounded-xl px-4 py-3.5 bg-white hover:border-[#6B4226] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B4226]/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <MapPin size={16} className="text-[#6B4226] shrink-0" />
          {selected ? (
            <AddressRow addr={selected} />
          ) : (
            <p className="text-sm text-[#9C7E5F]">Select a delivery address</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-[#9C7E5F] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#D6C4AE] rounded-xl shadow-xl overflow-hidden">
          {addresses.map((addr) => (
            <button
              key={addr._id}
              onClick={() => {
                setSelectedAddressId(addr._id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FAF5EF] transition-colors ${
                addr._id === selectedAddressId ? "bg-[#FAF5EF]" : ""
              }`}
            >
              <AddressRow addr={addr} />
              {addr._id === selectedAddressId && (
                <Check size={16} className="text-[#6B4226] shrink-0" />
              )}
            </button>
          ))}
          <div className="border-t border-[#EDE0D4]">
            <button className="w-full px-4 py-3 text-sm font-medium text-[#6B4226] hover:bg-[#FAF5EF] transition-colors text-left">
              + Add new address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DeliveryInstructions ─────────────────────────────────────────────────────

function DeliveryInstructions() {
  const { deliveryInstructions, setDeliveryInstructions } = useDeliveryInstructions();

  return (
    <section className="bg-white rounded-2xl border border-[#E8D8C8] p-6">
      <div className="flex items-center gap-3 mb-5">
        <StepBadge n={2} />
        <h2 className="text-lg font-semibold text-[#1A1108]">Delivery Instructions</h2>
      </div>
      <p className="text-sm text-[#9C7E5F] mb-3">Special requests for the delivery partner</p>
      <textarea
        value={deliveryInstructions}
        onChange={(e) => setDeliveryInstructions(e.target.value)}
        rows={3}
        placeholder="e.g. Leave at the gate, Call upon arrival, Ring the bell twice…"
        className="w-full border border-[#D6C4AE] rounded-xl px-4 py-3 text-sm text-[#3D2B1F] placeholder-[#C4A882] resize-none focus:outline-none focus:ring-2 focus:ring-[#6B4226]/30 focus:border-[#6B4226] transition-colors bg-[#FDFAF7]"
      />
    </section>
  );
}

// ─── PaymentMethod ────────────────────────────────────────────────────────────
// Online payment isn't wired up on the backend yet — that option is shown
// but disabled, so it's clear it's coming rather than silently broken.

function PaymentMethod() {
  const { paymentMethod, setPaymentMethod } = usePayment();

  return (
    <section className="bg-white rounded-2xl border border-[#E8D8C8] p-6">
      <div className="flex items-center gap-3 mb-5">
        <StepBadge n={3} />
        <h2 className="text-lg font-semibold text-[#1A1108]">Payment Method</h2>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-4 border rounded-xl px-4 py-4 cursor-not-allowed opacity-50 border-[#D6C4AE] bg-white">
          <input type="radio" name="payment" value="online" disabled className="accent-[#6B4226] w-4 h-4" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1A1108]">Online Payment</p>
            <p className="text-xs text-[#9C7E5F]">Coming soon</p>
          </div>
          <div className="flex gap-1.5">
            <span className="text-lg">💳</span>
            <span className="text-lg">📱</span>
          </div>
        </label>

        <label
          className={`flex items-center gap-4 border rounded-xl px-4 py-4 cursor-pointer transition-colors ${
            paymentMethod === "COD" ? "border-[#6B4226] bg-[#FAF5EF]" : "border-[#D6C4AE] bg-white hover:bg-[#FDFAF7]"
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            className="accent-[#6B4226] w-4 h-4"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1A1108]">Cash on Delivery (COD)</p>
            <p className="text-xs text-[#9C7E5F]">Pay when you receive the items</p>
          </div>
          <span className="text-lg">💵</span>
        </label>
      </div>
    </section>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────

function OrderSummary() {
  const { couponCode, setCouponCode, couponApplied, applyCoupon } = useCoupon();
  const totals = useOrderTotals();
  const cartItems = useCartItems();
  const { submit, isPlacingOrder } = usePlaceOrder();
  const navigate = useNavigate();

  const isEmpty = cartItems.length === 0;

  const handlePlaceOrder = async () => {
    const order = await submit();
    if (order) {
      navigate("/customer/orders");
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <div className="bg-white rounded-2xl border border-[#E8D8C8] p-6">
        <h2 className="text-lg font-semibold text-[#1A1108] mb-5">Order Summary</h2>

        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={14} className="text-[#9C7E5F]" />
          <span className="text-sm italic text-[#9C7E5F]">
            {cartItems[0]?.productId.storeId?.storeName ?? "Your cart"}
          </span>
        </div>

        {isEmpty ? (
          <p className="text-sm text-[#9C7E5F] py-6 text-center">Your cart is empty.</p>
        ) : (
          <div className="space-y-4 mb-5">
            {cartItems.map((item) => (
              <div key={item.productId._id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#F5EBE0] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {item.productId.images?.[0] ? (
                    <img
                      src={item.productId.images[0]}
                      alt={item.productId.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🛒"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1108] leading-tight">
                    {item.productId.productName}
                  </p>
                  <p className="text-xs text-[#9C7E5F]">
                    {item.productId.unit ? `${item.productId.unit} · ` : ""}Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#3D2B1F] shrink-0">
                  ₹{(item.productId.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#EDE0D4] pt-4 space-y-2">
          <div className="flex justify-between text-sm text-[#5C3D2E]">
            <span>Product Total</span>
            <span>₹{totals.productTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#5C3D2E]">
            <span>Delivery Charge</span>
            <span className="font-semibold">₹{totals.deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#5C3D2E]">
            <span>Packaging Fee</span>
            <span>₹{totals.packagingFee.toFixed(2)}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Coupon Discount</span>
              <span>−₹{totals.couponDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#EDE0D4] mt-4 pt-4 flex justify-between items-center">
          <span className="font-semibold text-[#1A1108]">Grand Total</span>
          <span className="text-lg font-bold text-[#6B4226]">₹{totals.grandTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isEmpty || isPlacingOrder}
          className="mt-5 w-full bg-[#6B4226] hover:bg-[#5A3520] active:bg-[#4A2A18] text-white rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B4226]/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPlacingOrder && <Loader2 size={16} className="animate-spin" />}
          {isPlacingOrder ? "Placing order…" : "Place Order"}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#9C7E5F]">
          <Lock size={11} />
          <span>Secure encrypted checkout</span>
        </div>
      </div>

      {/* Coupon — local-only placeholder until real coupon validation exists server-side */}
      <div className="bg-white rounded-2xl border border-[#E8D8C8] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-[#6B4226]" />
          <span className="text-sm font-semibold text-[#1A1108]">Offers &amp; Coupons</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={couponApplied}
            className="flex-1 border border-[#D6C4AE] rounded-lg px-3 py-2 text-sm text-[#3D2B1F] placeholder-[#C4A882] focus:outline-none focus:ring-2 focus:ring-[#6B4226]/30 focus:border-[#6B4226] disabled:bg-[#F9F5F0] disabled:text-[#9C7E5F] transition-colors"
          />
          <button
            onClick={applyCoupon}
            disabled={couponApplied || !couponCode.trim()}
            className="px-4 py-2 text-sm font-semibold text-[#6B4226] border border-[#6B4226] rounded-lg hover:bg-[#6B4226] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {couponApplied ? "Applied" : "Apply"}
          </button>
        </div>
        {couponApplied && (
          <p className="text-xs text-green-600 mt-2 font-medium">🎉 ₹50 off applied!</p>
        )}
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { isLoadingSummary, summaryError } = useLoadCheckoutSummary();

  return (
    <div className="min-h-screen bg-[#F7F0E8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-[#EDE0D4] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span
            className="text-xl font-bold text-[#3D2B1F] tracking-tight italic"
            style={{ fontFamily: "Georgia, serif" }}
          >
            QuickKart
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B4226] uppercase tracking-widest">
            <Lock size={12} />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoadingSummary ? (
          <div className="flex items-center justify-center py-24 text-[#9C7E5F] gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading your checkout…</span>
          </div>
        ) : summaryError ? (
          <div className="text-center py-24">
            <p className="text-sm text-[#9C7E5F]">{summaryError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-[#6B4226] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Left */}
            <div className="space-y-5">
              <section className="bg-white rounded-2xl border border-[#E8D8C8] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <StepBadge n={1} />
                  <h2 className="text-lg font-semibold text-[#1A1108]">Select Delivery Address</h2>
                </div>
                <AddressDropdown />
              </section>
              <DeliveryInstructions />
              <PaymentMethod />
            </div>

            {/* Right */}
            <OrderSummary />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#B89A7A]">
        © 2024 QuickKart. Digital Craftsmanship.
      </footer>
    </div>
  );
}