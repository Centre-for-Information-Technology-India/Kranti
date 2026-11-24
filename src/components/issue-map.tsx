"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { IssueRecord } from "@/lib/content-types";
import type * as Leaflet from "leaflet";

type LeafletWindow = Window & { L?: typeof Leaflet };

interface IssueMapProps {
  issues: IssueRecord[];
}

export default function IssueMap({ issues }: IssueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);

  // Load Leaflet dynamically from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if leaflet is already loaded
    if ((window as LeafletWindow).L) {
      queueMicrotask(() => setLeafletLoaded(true));
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Load Script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script/css links if necessary
    };
  }, []);

  // Initialize and update Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as LeafletWindow).L;
    if (!L) return;

    // Center of India
    const defaultCenter: Leaflet.LatLngTuple = [20.5937, 78.9629];
    const defaultZoom = 5;

    // Destroy existing map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);
    mapRef.current = map;

    // Set dark theme or cream theme tiles for aesthetic excellence
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for issues
    issues.forEach((issue) => {
      // Coordinates in mockData: location [longitude, latitude]
      // Leaflet expects [latitude, longitude]
      const lat = issue.location[1];
      const lng = issue.location[0];

      if (!lat || !lng) return;

      // Custom marker icon color based on status
      const markerColor = 
        issue.status === "resolved" ? "#10b981" : 
        issue.status === "in_progress" ? "#f59e0b" : 
        issue.status === "pending_review" ? "#6b7280" : "#ef4444";

      // Create a small colored dot marker SVG
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="
            background-color: ${markerColor};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const popupContent = document.createElement("div");
      popupContent.style.fontFamily = "var(--font-sans, sans-serif)";
      popupContent.style.padding = "6px";
      popupContent.innerHTML = `
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${issue.title}</div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${issue.district}, ${issue.state}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="
            background-color: ${markerColor}20;
            color: ${markerColor};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
          ">${issue.status.replace("_", " ")}</span>
          <a href="/issues/${issue.slug}" style="
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 2px;
          ">
            View Details &rarr;
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    // Fit bounds if there are issues
    if (issues.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [leafletLoaded, issues]);

  return (
    <div className="relative h-[550px] w-full overflow-hidden rounded-3xl border border-slate-900/10 bg-white/70 shadow-inner dark:border-white/10 dark:bg-slate-900/40">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm dark:bg-slate-950/80">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white"></div>
            <p className="text-xs text-slate-500">Loading map canvas...</p>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </div>
  );
}
