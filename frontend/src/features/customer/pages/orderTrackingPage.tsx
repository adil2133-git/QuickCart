import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Phone,
  Truck,
  MapPin,
  PackageCheck,
  Check,
  Clock,
  Star,
  MessageCircle,
  Navigation,
  Store,
  ShoppingBag,
  Headphones,
  Flag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bike,
} from "lucide-react";
import { useActiveDeliveryStore } from "../state/activeDeliveryState";
import { useActiveDeliveryTracking } from "../hooks/useActiveDeliveryTracking";
import { estimateEtaMinutes, haversineKm } from "../lib/deliveryEta";

const STATUS_ORDER = [
  "PENDING",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const TIMELINE_STEPS = [
  { label: "Order Confirmed", threshold: "ACCEPTED" },
  { label: "Store Preparing", threshold: "PACKING" },
  { label: "Picked Up", threshold: "PICKED_UP" },
  { label: "On the way", threshold: "OUT_FOR_DELIVERY" },
  { label: "Delivered", threshold: "DELIVERED" },
] as const;

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:48px;height:48px;border-radius:50%;
    background:linear-gradient(145deg, #145C43, #1A7A5A);
    border:3px solid white;
    box-shadow:0 8px 32px rgba(20,92,67,0.4), 0 0 0 8px rgba(20,92,67,0.1);
    display:flex;align-items:center;justify-content:center;font-size:22px;
    transition: all 0.3s ease;
  ">🚚</div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:40px;height:40px;background:#B43C3C;
    border:4px solid white;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 4px 20px rgba(180,60,60,0.3), 0 0 0 8px rgba(180,60,60,0.08);
  "></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:white;border:3px solid #145C43;
    display:flex;align-items:center;justify-content:center;font-size:16px;
    box-shadow:0 2px 16px rgba(0,0,0,0.12);
  ">🏪</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function LiveMap({
  driverPos,
  destinationPos,
  storePos,
}: {
  driverPos: { lat: number; lng: number };
  destinationPos: { lat: number; lng: number } | null;
  storePos: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Layer | null>(null);
  const hasFitBoundsRef = useRef(false);
  const driverPosRef = useRef(driverPos);
  const destinationPosRef = useRef(destinationPos);
  const storePosRef = useRef(storePos);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    driverPosRef.current = driverPos;
    destinationPosRef.current = destinationPos;
    storePosRef.current = storePos;
  }, [destinationPos, driverPos, storePos]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialDriver = driverPosRef.current;

    const map = L.map(containerRef.current, {
      center: [initialDriver.lat, initialDriver.lng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], {
      icon: driverIcon,
    }).addTo(map);

    if (storePos)
      L.marker([storePos.lat, storePos.lng], { icon: storeIcon }).addTo(map);
    if (destinationPos)
      L.marker([destinationPos.lat, destinationPos.lng], {
        icon: destinationIcon,
      }).addTo(map);

    // Route polyline
    if (destinationPos) {
      const routePoints: L.LatLngExpression[] = [
  [driverPos.lat, driverPos.lng],
  [destinationPos.lat, destinationPos.lng],
];
      const routeLine = L.polyline(routePoints, {
  color: "#145C43",
  weight: 4,
  opacity: 0.7,
  dashArray: "8, 8",
  lineJoin: "round",
  lineCap: "round",
}).addTo(map);
      routeLayerRef.current = routeLine;

      // Animated dash offset
      let offset = 0;
      const animateRoute = () => {
        if (routeLine && routeLine.getElement()) {
          offset = (offset + 1) % 16;
          const el = routeLine.getElement();
          if (el) {
            (el as HTMLElement).style.strokeDashoffset = `-${offset}`;
          }
        }
        requestAnimationFrame(animateRoute);
      };
      animateRoute();
    }

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [destinationPos, driverPos.lat, driverPos.lng, storePos]);

  useEffect(() => {
    if (!mapRef.current) return;
    driverMarkerRef.current?.setLatLng([driverPos.lat, driverPos.lng]);

    if (!hasFitBoundsRef.current && mapRef.current && destinationPos) {
      const points: [number, number][] = [
        [driverPos.lat, driverPos.lng],
        [destinationPos.lat, destinationPos.lng],
      ];
      if (storePos) points.push([storePos.lat, storePos.lng]);
      mapRef.current.fitBounds(points, { padding: [80, 80], maxZoom: 14 });
      hasFitBoundsRef.current = true;
    }
  }, [destinationPos, driverPos.lat, driverPos.lng, storePos]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    if (!mapRef.current || !destinationPos) return;
    const points: [number, number][] = [
      [driverPos.lat, driverPos.lng],
      [destinationPos.lat, destinationPos.lng],
    ];
    if (storePos) points.push([storePos.lat, storePos.lng]);
    mapRef.current.fitBounds(points, { padding: [80, 80], maxZoom: 14 });
  };

  const toggleFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  };

  return (
    <div className={`relative ${isMapFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      <div ref={containerRef} className="w-full h-full rounded-2xl" />
      
      {/* Floating ETA Badge */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Clock size={18} color="#145C43" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Estimated Arrival</div>
            <div className="text-sm font-bold text-gray-900">4:32 PM</div>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <ZoomIn size={18} color="#16241D" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <ZoomOut size={18} color="#16241D" />
        </button>
        <button
          onClick={handleFitBounds}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          <Maximize2 size={16} color="#16241D" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
        >
          {isMapFullscreen ? <Minimize2 size={16} color="#16241D" /> : <Maximize2 size={16} color="#16241D" />}
        </button>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  useActiveDeliveryTracking();
  const delivery = useActiveDeliveryStore((s) => s.delivery);
  const isLoading = useActiveDeliveryStore((s) => s.isLoading);

  const driverPos = delivery?.driver.currentLocation ?? null;
  const destinationPos = delivery?.deliveryCoordinates ?? null;
  const storePos = delivery?.store.coordinates ?? null;
  const eta = driverPos && destinationPos ? estimateEtaMinutes(driverPos, destinationPos) : null;
  const distanceKm = driverPos && destinationPos ? haversineKm(driverPos, destinationPos) : null;

  const isMatchingOrder = delivery?.orderId === orderId;

  const statusIdx = delivery ? STATUS_ORDER.indexOf(delivery.orderStatus) : -1;
  let currentStepIdx = -1;
  TIMELINE_STEPS.forEach((step, i) => {
    if (statusIdx >= STATUS_ORDER.indexOf(step.threshold)) currentStepIdx = i;
  });

  const driverInitial =
    delivery?.driver.name?.trim().charAt(0).toUpperCase() || "D";

  // Mock order items
  const orderItems = [
    { name: "Milk", quantity: 2 },
    { name: "Bread", quantity: 1 },
    { name: "Eggs", quantity: 12 },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50/50"
      style={{ backgroundColor: "#F7F8F5" }}
    >
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100/60 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
                aria-label="Go back"
              >
                <ArrowLeft size={18} color="#16241D" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Track Order</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>#{delivery?.orderNumber || "QK1783582709147"}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100">
                On the way
              </span>
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{
                borderColor: "#145C43",
                borderTopColor: "transparent",
              }}
            />
            <span className="text-sm text-gray-500">Loading tracking info…</span>
          </div>
        </div>
      ) : !isMatchingOrder || !driverPos ? (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4 px-8 text-center max-w-md">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F5F7F3" }}
            >
              <PackageCheck size={40} color="#9BAAA1" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Nothing to track right now</h3>
            <p className="text-sm text-gray-500">
              This order isn't out for delivery, or has already arrived. Check My
              Orders for its full status.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/customer/orders")}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white border-none cursor-pointer mt-2"
              style={{ backgroundColor: "#145C43" }}
            >
              Go to My Orders
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto px-8 py-6 h-[calc(100vh-80px)]">
          <div className="grid grid-cols-[1fr_380px] gap-6 h-full">
            {/* Left Column - Map */}
            <div className="h-full">
              <div className="h-full rounded-2xl overflow-hidden shadow-lg bg-white">
                <LiveMap
                  driverPos={driverPos}
                  destinationPos={destinationPos}
                  storePos={storePos}
                />
              </div>
            </div>

            {/* Right Column - Information Panel */}
            <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="space-y-4 pb-6">
                {/* ETA Hero Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #145C43 0%, #1A7A5A 100%)",
                    boxShadow: "0 8px 32px rgba(20,92,67,0.25)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mt-12" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Truck size={22} color="white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/80">On the way</div>
                        <div className="text-xs text-white/60">Current status</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-2xl font-medium text-white/80">Arriving in</div>
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-white tracking-tight">
                          {eta != null ? eta : "—"}
                        </span>
                        <span className="text-xl font-semibold text-white/80 mb-1">min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      {distanceKm != null && (
                        <div className="text-sm text-white/80">
                          Driver is {distanceKm < 1
                            ? `${Math.round(distanceKm * 1000)} m away`
                            : `${distanceKm.toFixed(1)} km away`}
                        </div>
                      )}
                      <div className="text-sm text-white/80">
                        Estimated arrival <span className="font-semibold">4:32 PM</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Driver Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
                        style={{ backgroundColor: "#E8EFEC", color: "#145C43" }}
                      >
                        {driverInitial}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white bg-green-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-gray-900 truncate">
                          {delivery!.driver.name}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
                          <Star size={14} fill="#F59E0B" color="#F59E0B" />
                          <span className="text-xs font-medium text-amber-700">4.9</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Bike size={14} />
                          {delivery!.driver.vehicleType || "Scooter"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="font-mono text-xs">
                          {delivery!.driver.vehicleNumber || "HJ4534"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {delivery!.driver.phone && (
                      <a
                        href={`tel:${delivery!.driver.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors border border-green-100"
                      >
                        <Phone size={16} />
                        Call
                      </a>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors border border-gray-100">
                      <MessageCircle size={16} />
                      Chat
                    </button>
                  </div>
                </motion.div>

                {/* Delivery Progress Timeline */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} color="#6E7C74" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Delivery Progress
                    </span>
                  </div>
                  <div>
                    {TIMELINE_STEPS.map((step, i) => {
                      const isDone = i < currentStepIdx;
                      const isActive = i === currentStepIdx;
                      const isLast = i === TIMELINE_STEPS.length - 1;
                      return (
                        <div key={step.label} className="flex gap-4">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <motion.div
                              initial={isActive ? { scale: 0.8 } : false}
                              animate={isActive ? { scale: 1 } : false}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                                isDone || isActive
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {isDone ? (
                                <Check size={16} strokeWidth={3} />
                              ) : isActive ? (
                                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              )}
                            </motion.div>
                            {!isLast && (
                              <div
                                className="w-0.5 flex-1"
                                style={{
                                  minHeight: 32,
                                  backgroundColor: isDone ? "#16A34A" : "#E5E7EB",
                                }}
                              />
                            )}
                          </div>
                          <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                            <span
                              className={`text-sm font-medium block ${
                                isDone || isActive ? "text-gray-900" : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </span>
                            {isActive && (
                              <span className="text-xs text-green-600 mt-0.5 block">
                                In progress...
                              </span>
                            )}
                            {isDone && (
                              <span className="text-xs text-gray-400 mt-0.5 block">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Delivery Address Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} color="#145C43" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-900">
                          Delivering To
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Home
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {delivery!.deliveryAddress}
                      </p>
                      {distanceKm != null && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                          <Navigation size={12} />
                          <span>Estimated distance: {distanceKm < 1
                            ? `${Math.round(distanceKm * 1000)} m`
                            : `${distanceKm.toFixed(1)} km`}</span>
                        </div>
                      )}
                      {delivery!.store.storeName && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                          <Store size={12} />
                          <span>Picked up from {delivery!.store.storeName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Order Summary */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag size={16} color="#6E7C74" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Order Summary
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Store</span>
                      <span className="font-medium text-gray-900">{delivery!.store.storeName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Items</span>
                      <span className="font-medium text-gray-900">
                        {orderItems.map((item, index) => (
                          <span key={index}>
                            {item.name} ×{item.quantity}
                            {index < orderItems.length - 1 && ", "}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">₹340</span>
                    </div>
                  </div>
                </motion.div>

                {/* Support Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Headphones size={16} color="#6E7C74" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Need Help?
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                      <Phone size={16} color="#145C43" />
                      <span className="text-[10px] font-medium text-gray-600">Call</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                      <MessageCircle size={16} color="#145C43" />
                      <span className="text-[10px] font-medium text-gray-600">Chat</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                      <Flag size={16} color="#145C43" />
                      <span className="text-[10px] font-medium text-gray-600">Report</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}