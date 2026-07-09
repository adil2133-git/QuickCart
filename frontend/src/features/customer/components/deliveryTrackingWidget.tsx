import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, X, ChevronRight, MapPin } from "lucide-react";
import { useActiveDeliveryStore } from "../state/activeDeliveryState";
import { useActiveDeliveryTracking } from "../hooks/useActiveDeliveryTracking";
import { estimateEtaMinutes } from "../lib/deliveryEta";

const driverIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:#145C43;border:3px solid white;
    box-shadow:0 2px 10px rgba(20,92,67,0.5);
    display:flex;align-items:center;justify-content:center;
  ">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const destinationIcon = L.divIcon({
    className: "",
    html: `<div style="
    width:26px;height:26px;background:#B43C3C;
    border:3px solid white;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);box-shadow:0 2px 10px rgba(180,60,60,0.4);
  "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
});

function MiniMap({
    driverPos, destinationPos,
}: {
    driverPos: { lat: number; lng: number };
    destinationPos: { lat: number; lng: number } | null;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const driverMarkerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [driverPos.lat, driverPos.lng],
            zoom: 14,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);

        if (destinationPos) {
            L.marker([destinationPos.lat, destinationPos.lng], { icon: destinationIcon }).addTo(map);
            map.fitBounds(
                [[driverPos.lat, driverPos.lng], [destinationPos.lat, destinationPos.lng]],
                { padding: [24, 24], maxZoom: 15 }
            );
        }

        mapRef.current = map;
        requestAnimationFrame(() => map.invalidateSize());
        return () => { map.remove(); mapRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        driverMarkerRef.current?.setLatLng([driverPos.lat, driverPos.lng]);
    }, [driverPos.lat, driverPos.lng]);

    return <div ref={containerRef} className="w-full h-full" />;
}

export default function DeliveryTrackingWidget() {
    const navigate = useNavigate();
    useActiveDeliveryTracking();
    const delivery = useActiveDeliveryStore((s) => s.delivery);
    const isMinimized = useActiveDeliveryStore((s) => s.isMinimized);
    const setMinimized = useActiveDeliveryStore((s) => s.setMinimized);

    if (!delivery) return null;

    const driverPos = delivery.driver.currentLocation;
    const destinationPos = delivery.deliveryCoordinates;
    const eta = driverPos && destinationPos ? estimateEtaMinutes(driverPos, destinationPos) : null;

    const openFullTracking = () => navigate(`/customer/track/${delivery.orderId}`);

    return (
        <AnimatePresence>
            {isMinimized ? (
                <motion.button
                    key="tab"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 40, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={() => setMinimized(false)}
                    className="fixed right-0 bottom-28 z-40 flex items-center gap-1.5 rounded-l-xl border border-r-0 cursor-pointer"
                    style={{
                        backgroundColor: "#145C43",
                        borderColor: "#0F4633",
                        padding: "12px 10px",
                        boxShadow: "0px 6px 20px rgba(20,92,67,0.35)",
                    }}
                    aria-label="Show order tracking"
                >
                    <Truck size={16} color="white" />
                    <ChevronRight size={14} color="white" style={{ opacity: 0.8 }} />
                </motion.button>
            ) : (
                <motion.div
                    key="card"
                    initial={{ x: 24, opacity: 0, scale: 0.96 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 24, opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="fixed right-6 bottom-6 z-40 rounded-2xl bg-white border overflow-hidden"
                    style={{ borderColor: "#E3E7E1", width: 280, boxShadow: "0px 16px 40px rgba(20,92,67,0.28)" }}
                >
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#E8EFEC" }}
                            >
                                <Truck size={14} color="#145C43" />
                            </span>
                            <span className="text-[13px] font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: "#16241D" }}>
                                Your order is on the way
                            </span>
                        </div>
                        <button
                            onClick={() => setMinimized(true)}
                            className="w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: "transparent" }}
                            aria-label="Minimize tracking card"
                        >
                            <X size={14} color="#9BAAA1" />
                        </button>
                    </div>

                    <div onClick={openFullTracking} className="cursor-pointer">
                        <div className="mx-4 rounded-lg overflow-hidden" style={{ height: 120, backgroundColor: "#F5F7F3" }}>
                            {driverPos
                                ? <MiniMap driverPos={driverPos} destinationPos={destinationPos} />
                                : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <MapPin size={22} color="#9BAAA1" />
                                    </div>
                                )
                            }
                        </div>

                        <div className="px-4 py-3.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs block" style={{ color: "#6E7C74" }}>
                                    {delivery.driver.name} · #{delivery.orderNumber}
                                </span>
                                <span className="text-lg font-bold block" style={{ fontFamily: "'Inter', sans-serif", color: "#145C43" }}>
                                    {eta != null ? `${eta} min away` : "Tracking…"}
                                </span>
                            </div>
                            <ChevronRight size={18} color="#145C43" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}