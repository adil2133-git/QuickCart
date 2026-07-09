import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Phone, Truck, MapPin, PackageCheck, Store } from "lucide-react";
import { useActiveDeliveryStore } from "../state/activeDeliveryState";
import { useActiveDeliveryTracking } from "../hooks/useActiveDeliveryTracking";
import { estimateEtaMinutes } from "../lib/deliveryEta";

const driverIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:40px;height:40px;border-radius:50%;
    background:#145C43;border:4px solid white;
    box-shadow:0 4px 14px rgba(20,92,67,0.5);
    display:flex;align-items:center;justify-content:center;font-size:18px;
  ">🚚</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const destinationIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:34px;height:34px;background:#B43C3C;
    border:4px solid white;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);box-shadow:0 4px 14px rgba(180,60,60,0.4);
  "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
});

const storeIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:white;border:3px solid #145C43;
    display:flex;align-items:center;justify-content:center;font-size:14px;
    box-shadow:0 2px 10px rgba(0,0,0,0.2);
  ">🏪</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function LiveMap({
    driverPos, destinationPos, storePos,
}: {
    driverPos: { lat: number; lng: number };
    destinationPos: { lat: number; lng: number } | null;
    storePos: { lat: number; lng: number } | null;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const driverMarkerRef = useRef<L.Marker | null>(null);
    const hasFitBoundsRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [driverPos.lat, driverPos.lng],
            zoom: 14,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);

        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);

        if (storePos) L.marker([storePos.lat, storePos.lng], { icon: storeIcon }).addTo(map);
        if (destinationPos) L.marker([destinationPos.lat, destinationPos.lng], { icon: destinationIcon }).addTo(map);

        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        driverMarkerRef.current?.setLatLng([driverPos.lat, driverPos.lng]);

        if (!hasFitBoundsRef.current && mapRef.current && destinationPos) {
            const points: [number, number][] = [[driverPos.lat, driverPos.lng], [destinationPos.lat, destinationPos.lng]];
            if (storePos) points.push([storePos.lat, storePos.lng]);
            mapRef.current.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
            hasFitBoundsRef.current = true;
        }
    }, [driverPos.lat, driverPos.lng, destinationPos, storePos]);

    return <div ref={containerRef} className="w-full h-full" />;
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

    const isMatchingOrder = delivery?.orderId === orderId;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F8F5", fontFamily: "'Inter', sans-serif" }}>
            <header className="flex items-center gap-3 px-5 py-4 bg-white border-b" style={{ borderColor: "#E3E7E1" }}>
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: "#F5F7F3" }}
                    aria-label="Go back"
                >
                    <ArrowLeft size={16} color="#16241D" />
                </button>
                <div>
                    <span className="text-base font-semibold block" style={{ color: "#16241D" }}>Track Order</span>
                    {isMatchingOrder && (
                        <span className="text-xs" style={{ color: "#6E7C74" }}>#{delivery!.orderNumber}</span>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm" style={{ color: "#6E7C74" }}>Loading tracking info…</span>
                </div>
            ) : !isMatchingOrder || !driverPos ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
                    <PackageCheck size={40} color="#9BAAA1" />
                    <p className="font-semibold" style={{ color: "#16241D" }}>Nothing to track right now</p>
                    <p className="text-sm max-w-xs" style={{ color: "#6E7C74" }}>
                        This order isn't out for delivery, or has already arrived. Check My Orders for its full status.
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate("/customer/orders")}
                        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white border-none cursor-pointer mt-2"
                        style={{ backgroundColor: "#145C43" }}
                    >
                        Go to My Orders
                    </motion.button>
                </div>
            ) : (
                <>
                    <div className="flex-1" style={{ minHeight: 320 }}>
                        <LiveMap driverPos={driverPos} destinationPos={destinationPos} storePos={storePos} />
                    </div>

                    <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-t-2xl border-t px-5 pt-5 pb-8 -mt-4 relative z-10"
                        style={{ borderColor: "#E3E7E1" }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <span className="text-xs block" style={{ color: "#6E7C74" }}>Arriving in</span>
                                <span className="text-2xl font-bold" style={{ color: "#145C43" }}>
                                    {eta != null ? `${eta} min` : "—"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                                <MapPin size={14} color="#9BAAA1" />
                                <span className="text-xs max-w-[220px]" style={{ color: "#6E7C74" }}>
                                    {delivery!.deliveryAddress}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: "#F5F7F3" }}>
                            <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E8EFEC" }}>
                                <Truck size={18} color="#145C43" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className="font-semibold block truncate" style={{ color: "#16241D" }}>
                                    {delivery!.driver.name}
                                </span>
                                <span className="text-xs block" style={{ color: "#9BAAA1" }}>
                                    {[delivery!.driver.vehicleType, delivery!.driver.vehicleNumber].filter(Boolean).join(" · ") || "Delivery partner"}
                                </span>
                            </div>
                            {delivery!.driver.phone && (
                                <a
                                    href={`tel:${delivery!.driver.phone}`}
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#145C43" }}
                                    aria-label="Call delivery partner"
                                >
                                    <Phone size={15} color="white" />
                                </a>
                            )}
                        </div>

                        {delivery!.store.storeName && (
                            <div className="flex items-center gap-2 mt-4">
                                <Store size={13} color="#9BAAA1" />
                                <span className="text-xs" style={{ color: "#6E7C74" }}>
                                    Picked up from {delivery!.store.storeName}
                                </span>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}