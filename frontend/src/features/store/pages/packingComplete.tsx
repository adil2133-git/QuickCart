import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Printer } from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import { useFetchOrderDetail } from "../hooks/useStoreOrders";

// ─── Confetti particle ────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
  shape: "square" | "diamond";
  opacity: number;
}

const CONFETTI_COLORS = ["#C8A37E", "#2B1B0E", "#D9CCBE", "#A38F7D", "#F5EDE3", "#7A6352"];

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rotation: Math.random() * 360,
      vr: (Math.random() - 0.5) * 6,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: Math.random() > 0.5 ? "square" : "diamond",
      opacity: 0.7 + Math.random() * 0.3,
    }));

    let animId: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, 0);
          ctx.lineTo(0, p.size / 2);
          ctx.lineTo(-p.size / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackingCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchDetail = useFetchOrderDetail();
const canvasRef = useRef<HTMLCanvasElement | null>(null);

useConfetti(canvasRef as React.RefObject<HTMLCanvasElement>);

  const { selectedOrder, packingItems } = useStoreOrdersStore();

  useEffect(() => {
    if (id && !selectedOrder) fetchDetail(id);
  }, [id, selectedOrder, fetchDetail]);

  const order = selectedOrder;
  const totalItemsPacked = packingItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#FBF1E9] font-['Inter',sans-serif]">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* ── Completion card ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6">
        {/* Badge chip at top */}
        {order && (
          <div className="mb-6 flex items-center gap-2 rounded-full border border-[#EADFD3] bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-[#2B1B0E]">
              Order #{order.orderNumber}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#C8A37E]" />
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Packing Checklist Completed
            </span>
          </div>
        )}

        {/* Check icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C8A37E] shadow-lg">
          <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-[#2B1B0E]">Order Ready for Pickup</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-[#7A6352]">
          Excellent work! Order #{order?.orderNumber ?? "—"} has been meticulously packed and
          verified for quality.
        </p>

        {/* Confirmation details card */}
        <div className="mt-6 w-full rounded-2xl border border-[#EADFD3] bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5EDE3]">
              <span className="text-sm">ℹ️</span>
            </div>
            <span className="text-sm font-bold text-[#2B1B0E]">Confirmation Details</span>
          </div>
          <p className="text-sm leading-relaxed text-[#7A6352]">
            Order #{order?.orderNumber ?? "—"} has been marked as ready. The customer and the
            courier service have been automatically notified via SMS and App alert.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#FBF1E9] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#A38F7D]">
                Customer
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2B1B0E]">
                {order?.recipientName ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF1E9] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#A38F7D]">
                Items Packed
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2B1B0E]">
                {totalItemsPacked > 0 ? `${totalItemsPacked} Products` : `${order?.itemCount ?? 0} Products`}
              </p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => navigate("/store/orders")}
            className="rounded-full bg-[#2B1B0E] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Back to Orders
          </button>
          <button className="flex items-center gap-2 rounded-full border border-[#EADFD3] bg-white px-7 py-3 text-sm font-medium text-[#5C4A37] shadow-sm transition-colors hover:bg-[#F5EDE3]">
            <Printer className="h-4 w-4" />
            Print Shipping Label
          </button>
        </div>

        {/* Pickup time */}
        <div className="mt-5 flex items-center gap-2 rounded-full border border-[#EADFD3] bg-white/80 px-5 py-2.5 text-sm text-[#7A6352] shadow-sm backdrop-blur-sm">
          <Clock className="h-4 w-4" />
          <span>Scheduled for pickup at 4:30 PM Today</span>
        </div>
      </div>
    </div>
  );
}