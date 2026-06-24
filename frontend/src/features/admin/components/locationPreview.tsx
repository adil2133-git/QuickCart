// src/components/common/LocationPreviewMap.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
  className?: string;
};

// Read-only map: shows a single fixed pin. No click/drag handlers —
// this is for *displaying* an already-confirmed location (pending approval
// page, admin review page), not for picking one. Use LocationStep
// (in StoreRegistration) for that.
export default function LocationPreviewMap({
  lat,
  lng,
  height = 220,
  zoom = 16,
  className = "",
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:32px;height:32px;
          background:#c2a383;
          border:3px solid #291803;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 4px 12px rgba(41,24,3,0.35);
        "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([lat, lng], { icon, draggable: false }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If coordinates change identity (e.g. switching between applications
  // in the admin review page without unmounting), re-center.
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      // Re-add marker at new position
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) layer.setLatLng([lat, lng]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div
      className={`overflow-hidden rounded-xl border ${className}`}
      style={{ borderColor: "#EBE1D2" }}
    >
      <div ref={mapRef} style={{ height, width: "100%" }} />
    </div>
  );
}