import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useActor } from "../hooks/useActor";

const DELHI = { lat: 28.6139, lng: 77.209 };

function severityColor(s: number): string {
  if (s >= 3) return "#ef4444";
  if (s >= 2) return "#f97316";
  return "#eab308";
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    // Load CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function CrimeHeatmap() {
  const { actor, isFetching } = useActor();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const { data: points = [] } = useQuery({
    queryKey: ["crimeHeatmap"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCrimeHeatmapData();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!mapRef.current) return;
    let mounted = true;

    loadLeaflet()
      .then((L) => {
        if (!mounted || !mapRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapRef.current).setView([DELHI.lat, DELHI.lng], 11);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "\u00a9 OpenStreetMap contributors",
        }).addTo(map);

        const mockPoints =
          points.length > 0
            ? points
            : [
                {
                  latitude: 28.63,
                  longitude: 77.22,
                  severity: BigInt(3),
                  incidentType: "sos",
                },
                {
                  latitude: 28.64,
                  longitude: 77.23,
                  severity: BigInt(2),
                  incidentType: "incident",
                },
                {
                  latitude: 28.62,
                  longitude: 77.21,
                  severity: BigInt(1),
                  incidentType: "incident",
                },
                {
                  latitude: 28.65,
                  longitude: 77.25,
                  severity: BigInt(3),
                  incidentType: "sos",
                },
                {
                  latitude: 28.61,
                  longitude: 77.2,
                  severity: BigInt(2),
                  incidentType: "incident",
                },
              ];

        for (const pt of mockPoints) {
          const color = severityColor(Number(pt.severity));
          L.circleMarker([pt.latitude, pt.longitude], {
            radius: 10 + Number(pt.severity) * 4,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.4,
          })
            .bindTooltip(
              `${pt.incidentType === "sos" ? "SOS Alert" : "Incident"} (Severity ${pt.severity})`,
            )
            .addTo(map);
        }
      })
      .catch(() => {
        /* silently fail if CDN unavailable */
      });

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display font-bold text-base text-foreground">
        Crime Heatmap
      </h2>
      <div
        ref={mapRef}
        style={{ height: "380px", borderRadius: "16px", overflow: "hidden" }}
        className="w-full bg-muted"
      />
      {/* Legend */}
      <div className="glass-card rounded-2xl p-3 flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">
          Legend:
        </span>
        {[
          { color: "#ef4444", label: "SOS Active (High)" },
          { color: "#f97316", label: "Responded (Medium)" },
          { color: "#eab308", label: "Resolved (Low)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
