"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SERVICE_AREAS, INITIAL_CAMERA, ZOOMED_CAMERA, DEFAULT_ZIP,
} from "@/lib/serviceAreas";
import type { Step } from "@/components/npc/types";
import { STEP_ORDER } from "@/components/npc/types";

interface Props {
  step: Step;
  selectedZip: string;
  date: string;
  time: string;
  windowCount: number;
  needsEstimate: boolean;
}

export default function MapPanel({ step, selectedZip, date, time, windowCount, needsEstimate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasFlown, setHasFlown] = useState(false);

  const zip = selectedZip || DEFAULT_ZIP;
  const stepIdx = STEP_ORDER.indexOf(step);

  // ── Init map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;

      (mapboxgl as any).accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: INITIAL_CAMERA.center,
        zoom: INITIAL_CAMERA.zoom,
        pitch: INITIAL_CAMERA.pitch,
        bearing: INITIAL_CAMERA.bearing,
        interactive: false,
        attributionControl: false,
      });

      map.on("load", () => {
        if (cancelled) return;
        setMapLoaded(true);

        // Pulsing service area markers
        Object.values(SERVICE_AREAS).forEach((area) => {
          const el = document.createElement("div");
          el.style.cssText = [
            "width:10px;height:10px;border-radius:50%;",
            "background:rgba(126,200,227,0.75);",
            "box-shadow:0 0 0 0 rgba(126,200,227,0.45);",
            "animation:mapPulse 2.4s ease-out infinite;",
          ].join("");
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(area.center)
            .addTo(map);
          markersRef.current.push(marker);
        });
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── React to step changes ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (stepIdx === 0) {
      // Zoom back out to service area overview
      map.flyTo({
        center: INITIAL_CAMERA.center,
        zoom: INITIAL_CAMERA.zoom,
        pitch: 0,
        bearing: 0,
        duration: 2200,
      });
      markersRef.current.forEach((m) => {
        m.getElement().style.display = "block";
      });
      setHasFlown(false);
    } else if (!hasFlown) {
      // First time advancing past location — fly to confirmed ZIP
      const area = SERVICE_AREAS[zip];
      if (area) {
        map.flyTo({
          center: area.center,
          zoom: ZOOMED_CAMERA.zoom,
          pitch: ZOOMED_CAMERA.pitch,
          bearing: ZOOMED_CAMERA.bearing,
          duration: ZOOMED_CAMERA.duration,
          curve: ZOOMED_CAMERA.curve,
          essential: true,
        });
        setTimeout(() => {
          markersRef.current.forEach((m) => {
            m.getElement().style.display = "none";
          });
        }, 600);
        setHasFlown(true);
      }
    }
  }, [step, zip, mapLoaded, hasFlown, stepIdx]);

  const area = SERVICE_AREAS[zip];

  // Determine which overlay to show
  type Overlay = "none" | "calendar" | "photos" | "summary";
  let overlay: Overlay = "none";
  if (stepIdx === 1) overlay = "calendar";
  else if (stepIdx === 2) overlay = "photos";
  else if (stepIdx >= 3) overlay = "summary";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#050508" }}>
      {/* Pulse keyframe */}
      <style>{`
        @keyframes mapPulse {
          0%   { box-shadow: 0 0 0 0 rgba(126,200,227,0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(126,200,227,0); }
          100% { box-shadow: 0 0 0 0 rgba(126,200,227,0); }
        }
      `}</style>

      {/* Mapbox canvas */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(5,5,8,0.45) 0%, transparent 25%, transparent 75%, rgba(5,5,8,0.55) 100%)",
        }}
      />

      {/* Step progress bar at bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.04)", pointerEvents: "none" }}>
        <motion.div
          style={{ height: "100%", background: "rgba(126,200,227,0.5)", transformOrigin: "left" }}
          animate={{ scaleX: Math.max(0.04, stepIdx / (STEP_ORDER.length - 1)) }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      {/* Confirmed location badge */}
      <AnimatePresence>
        {stepIdx > 0 && area && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              position: "absolute", top: 14, left: 16,
              background: "rgba(5,5,8,0.78)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(126,200,227,0.16)",
              borderRadius: 8, padding: "5px 12px",
              color: "rgba(126,200,227,0.8)",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", pointerEvents: "none",
            }}
          >
            ▲ {area.name} · {zip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic overlay */}
      <AnimatePresence mode="wait">
        {overlay === "calendar" && (
          <CalendarOverlay key="cal" date={date} time={time} />
        )}
        {overlay === "photos" && (
          <PhotosOverlay key="photos" windowCount={windowCount} />
        )}
        {overlay === "summary" && (
          <SummaryOverlay
            key="summary"
            date={date} time={time}
            windowCount={windowCount} needsEstimate={needsEstimate}
            zip={zip} step={step}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Calendar Overlay ──────────────────────────────────────────────────

function CalendarOverlay({ date, time }: { date: string; time: string }) {
  const d = date ? new Date(date + "T12:00:00") : new Date("2026-07-04T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const monthName = d.toLocaleString("en-US", { month: "long" });

  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let n = 1; n <= totalDays; n++) cells.push(n);

  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{
        background: "rgba(5,5,8,0.84)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(126,200,227,0.14)",
        borderRadius: 18, padding: "22px 24px 18px",
        boxShadow: "0 10px 48px rgba(0,0,0,0.6)",
        width: 258,
      }}>
        {/* Month + year header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(126,200,227,0.45)", marginBottom: 2 }}>
            {year}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
            {monthName}
          </div>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {DAY_LABELS.map((label) => (
            <div key={label} style={{ textAlign: "center", fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map((n, i) => {
            const selected = n === day;
            return (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 6,
                  fontSize: 10.5, fontWeight: selected ? 700 : 400,
                  color: n === null ? "transparent"
                    : selected ? "#050508"
                    : "rgba(255,255,255,0.45)",
                  background: selected ? "rgba(126,200,227,0.88)" : "transparent",
                  boxShadow: selected ? "0 0 14px rgba(126,200,227,0.4)" : "none",
                }}
              >
                {n ?? ""}
              </div>
            );
          })}
        </div>

        {/* Selected time */}
        {time && (
          <div style={{
            marginTop: 16, textAlign: "center",
            fontSize: 14, fontWeight: 700,
            color: "rgba(126,200,227,0.78)", letterSpacing: "0.06em",
          }}>
            ⊙ {fmt12(time)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Photos Overlay ────────────────────────────────────────────────────

const PHOTO_CARDS = [
  { label: "Crystal clear results",   grad: "rgba(126,200,227,0.18)", icon: "✦" },
  { label: "Streak-free guarantee",   grad: "rgba(167,139,250,0.18)", icon: "◈" },
  { label: "Inside & outside",        grad: "rgba(200,210,130,0.14)", icon: "⬡" },
  { label: "Any height, ladderless",  grad: "rgba(130,200,190,0.16)", icon: "▲" },
];

function PhotosOverlay({ windowCount }: { windowCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "28px 20px", gap: 14, pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 2 }}>
        What we deliver
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 380 }}>
        {PHOTO_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            style={{
              background: card.grad,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "20px 14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.65 }}>{card.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.68)", lineHeight: 1.35 }}>
              {card.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(126,200,227,0.85)", marginTop: 4 }}>
        {windowCount} window{windowCount !== 1 ? "s" : ""} · ${windowCount * 22}
      </div>
    </motion.div>
  );
}

// ── Summary Overlay ───────────────────────────────────────────────────

function SummaryOverlay({ date, time, windowCount, needsEstimate, zip, step }: {
  date: string; time: string; windowCount: number;
  needsEstimate: boolean; zip: string; step: Step;
}) {
  const area = SERVICE_AREAS[zip];
  const rows = [
    { label: "Location", value: area ? `${area.name}, CA ${zip}` : zip },
    { label: "Date",     value: date ? fmtDate(date) : "July 4, 2026" },
    { label: "Time",     value: time ? fmt12(time)   : "2:50 PM" },
    { label: "Windows",  value: `${windowCount} — $${windowCount * 22}` },
    ...(step === "complete"
      ? [{ label: "Service", value: needsEstimate ? "Full estimate" : "Windows only" }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        pointerEvents: "none",
      }}
    >
      <div style={{
        background: "rgba(5,5,8,0.84)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 22px",
        minWidth: 230,
      }}>
        {step === "complete" && (
          <div style={{ textAlign: "center", marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(126,200,227,0.7)", textTransform: "uppercase" }}>
            ✦ All Set
          </div>
        )}
        {rows.map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {label}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
