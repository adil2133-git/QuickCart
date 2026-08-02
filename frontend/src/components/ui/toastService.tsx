import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface ToastOptions {
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

/**
 * QuickKart Luxury Frosted Glass Toast System
 * Matches the reference design with pill-shaped glass cards, circular icon tiles,
 * serif titles, truncated subtitles, optional action links, and close buttons.
 */

// ─── SUCCESS TOAST ────────────────────────────────────────────────────────────
export function showSuccessToast(title: string, options?: ToastOptions) {
  toast.custom(
    (t) => (
      <div className="relative flex w-full max-w-md items-center justify-between gap-3.5 rounded-full border border-white/80 bg-white/85 p-3.5 pl-4 shadow-2xl shadow-black/15 backdrop-blur-xl transition-all">
        {/* Left Icon Badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#145C43] text-white shadow-sm">
          <CheckCircle2 size={18} />
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-semibold text-[#0A1F17] leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
            {title}
          </h4>
          {options?.subtitle && (
            <p className="mt-0.5 text-xs text-[#6E7C74] font-medium truncate max-w-[240px]">
              {options.subtitle}
            </p>
          )}
          {options?.actionLabel && (
            <button
              onClick={() => {
                if (options.onAction) options.onAction();
                toast.dismiss(t);
              }}
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#145C43] hover:underline"
            >
              {options.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6E7C74] hover:bg-black/5 hover:text-[#0A1F17] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration: options?.duration || 4000 }
  );
}

// ─── ERROR TOAST ──────────────────────────────────────────────────────────────
export function showErrorToast(title: string, options?: ToastOptions) {
  toast.custom(
    (t) => (
      <div className="relative flex w-full max-w-md items-center justify-between gap-3.5 rounded-full border border-red-200/80 bg-white/90 p-3.5 pl-4 shadow-2xl shadow-black/15 backdrop-blur-xl transition-all">
        {/* Left Icon Badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
          <AlertCircle size={18} />
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-semibold text-red-700 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
            {title}
          </h4>
          {options?.subtitle && (
            <p className="mt-0.5 text-xs text-red-600/90 font-medium truncate max-w-[240px]">
              {options.subtitle}
            </p>
          )}
          {options?.actionLabel && (
            <button
              onClick={() => {
                if (options.onAction) options.onAction();
                toast.dismiss(t);
              }}
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
            >
              {options.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration: options?.duration || 4500 }
  );
}

// ─── INFO TOAST ───────────────────────────────────────────────────────────────
export function showInfoToast(title: string, options?: ToastOptions) {
  toast.custom(
    (t) => (
      <div className="relative flex w-full max-w-md items-center justify-between gap-3.5 rounded-full border border-white/80 bg-[#E8EFEC]/90 p-3.5 pl-4 shadow-2xl shadow-black/15 backdrop-blur-xl transition-all">
        {/* Left Icon Badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#145C43]/15 text-[#145C43] shadow-sm">
          <Info size={18} />
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-semibold text-[#0A1F17] leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
            {title}
          </h4>
          {options?.subtitle && (
            <p className="mt-0.5 text-xs text-[#6E7C74] font-medium truncate max-w-[240px]">
              {options.subtitle}
            </p>
          )}
          {options?.actionLabel && (
            <button
              onClick={() => {
                if (options.onAction) options.onAction();
                toast.dismiss(t);
              }}
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#145C43] hover:underline"
            >
              {options.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6E7C74] hover:bg-black/5 hover:text-[#0A1F17] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration: options?.duration || 4000 }
  );
}
