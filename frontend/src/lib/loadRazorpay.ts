// Loads the Razorpay Checkout.js script once and caches the in-flight
// promise, so calling this from multiple places (e.g. a retry) never injects
// the <script> tag twice.
let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null; // allow retrying on next call
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

// Minimal shape of what we actually use from the Razorpay Checkout options —
// not the full SDK surface, just enough for type safety on our call site.
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}