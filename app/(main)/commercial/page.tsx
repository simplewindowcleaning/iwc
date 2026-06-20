"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// ── Camera positions ──────────────────────────────────────────────────

const OCEAN_START = {
  center: [-122.65, 36.65] as [number, number],
  zoom: 8.5,
  pitch: 0,
  bearing: 0,
};

const MONTEREY_FLY = {
  center: [-121.915, 36.608] as [number, number],
  zoom: 13,
  pitch: 55,
  bearing: 22,
  duration: 9000,
  curve: 1.5,
};

const AQUARIUM_FLY = {
  center: [-121.9018, 36.6182] as [number, number],
  zoom: 17.5,
  pitch: 65,
  bearing: -28,
  duration: 5500,
  curve: 1.4,
};

// ── Page ─────────────────────────────────────────────────────────────

type View = "choice" | "commercial";

export default function CommercialPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const [view, setView]       = useState<View>("choice");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  // ── Init map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: OCEAN_START.center,
        zoom: OCEAN_START.zoom,
        pitch: OCEAN_START.pitch,
        bearing: OCEAN_START.bearing,
        interactive: false,
        attributionControl: false,
      });

      map.on("load", () => {
        if (cancelled) return;
        map.flyTo({
          center:   MONTEREY_FLY.center,
          zoom:     MONTEREY_FLY.zoom,
          pitch:    MONTEREY_FLY.pitch,
          bearing:  MONTEREY_FLY.bearing,
          duration: MONTEREY_FLY.duration,
          curve:    MONTEREY_FLY.curve,
          essential: true,
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

  function handleCommercial() {
    setView("commercial");
    mapRef.current?.flyTo({
      center:   AQUARIUM_FLY.center,
      zoom:     AQUARIUM_FLY.zoom,
      pitch:    AQUARIUM_FLY.pitch,
      bearing:  AQUARIUM_FLY.bearing,
      duration: AQUARIUM_FLY.duration,
      curve:    AQUARIUM_FLY.curve,
      essential: true,
    });
  }

  function handleResidential() {
    mapRef.current?.flyTo({
      center:   AQUARIUM_FLY.center,
      zoom:     AQUARIUM_FLY.zoom,
      pitch:    AQUARIUM_FLY.pitch,
      bearing:  AQUARIUM_FLY.bearing,
      duration: AQUARIUM_FLY.duration,
      curve:    AQUARIUM_FLY.curve,
      essential: true,
    });
    setTimeout(() => router.push("/"), AQUARIUM_FLY.duration - 1300);
  }

  function handleBackToResidential() {
    router.push("/");
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>

      {/* Satellite map */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(5,5,8,0.55) 0%, transparent 28%, transparent 68%, rgba(5,5,8,0.65) 100%)",
      }} />

      {/* Logo — upper left */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ position: "absolute", top: 28, left: 36, pointerEvents: "none" }}
      >
        <div style={{
          background: "rgba(5,5,8,0.78)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(126,200,227,0.14)",
          borderRadius: 14,
          padding: "16px 24px 14px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(126,200,227,0.6)", marginBottom: 6 }}>
            ✦ Santa Cruz County
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 5 }}>
            Simple<br />Windows
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(126,200,227,0.55)" }}>
            Instant Window Cleaning
          </div>
        </div>
      </motion.div>

      {/* Choice cards — centered */}
      <AnimatePresence>
        {view === "choice" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.55, delay: 0.6 }}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex", gap: 20,
              pointerEvents: "auto",
            }}
          >
            {/* Residential */}
            <ChoiceCard
              icon="⌂"
              label="Residential"
              sub="Homes & condos"
              onClick={handleResidential}
            />

            {/* Commercial */}
            <ChoiceCard
              icon="◈"
              label="Commercial"
              sub="Offices & storefronts"
              onClick={handleCommercial}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commercial address form + back card */}
      <AnimatePresence>
        {view === "commercial" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            style={{
              position: "absolute",
              bottom: 48,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "flex-end",
              gap: 14,
              pointerEvents: "auto",
            }}
          >
            {/* Back to Residential card */}
            <BackCard onClick={handleBackToResidential} />

            {/* Address form */}
            <div style={{ width: 380 }}>
            <div style={{
              background: "rgba(5,5,8,0.84)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(126,200,227,0.14)",
              borderRadius: 16,
              padding: "22px 24px 20px",
              boxShadow: "0 10px 48px rgba(0,0,0,0.55)",
            }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>✦</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(126,200,227,0.9)", marginBottom: 4 }}>
                    Request received
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    We&apos;ll reach out within one business day.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(126,200,227,0.55)", marginBottom: 14 }}>
                    Commercial service address
                  </div>
                  <input
                    type="text"
                    placeholder="886 Cannery Row, Monterey, CA 93940"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(126,200,227,0.2)",
                      borderRadius: 10,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "11px 14px",
                      outline: "none",
                      fontFamily: "inherit",
                      marginBottom: 12,
                      boxSizing: "border-box",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(126,200,227,0.5)"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = "rgba(126,200,227,0.2)"; }}
                    autoFocus
                  />
                  <button
                    onClick={() => address.trim() && setSubmitted(true)}
                    style={{
                      width: "100%",
                      background: address.trim() ? "rgba(126,200,227,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${address.trim() ? "rgba(126,200,227,0.45)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10,
                      color: address.trim() ? "rgba(126,200,227,0.95)" : "rgba(255,255,255,0.2)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "11px 0",
                      cursor: address.trim() ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    REQUEST COMMERCIAL QUOTE
                  </button>
                </>
              )}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Back to Residential card ──────────────────────────────────────────

function BackCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.03 : 1 }}
      transition={{ duration: 0.18 }}
      style={{
        background: hovered ? "rgba(126,200,227,0.1)" : "rgba(5,5,8,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered ? "rgba(126,200,227,0.3)" : "rgba(126,200,227,0.1)"}`,
        borderRadius: 14,
        padding: "22px 20px",
        cursor: "pointer",
        textAlign: "center" as const,
        width: 148,
        fontFamily: "inherit",
        transition: "background 0.18s, border-color 0.18s",
        boxShadow: "0 6px 28px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 10, opacity: hovered ? 0.9 : 0.45, transition: "opacity 0.18s" }}>
        ⌂
      </div>
      <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(126,200,227,0.5)", marginBottom: 6 }}>
        Back to
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.82)", letterSpacing: "-0.01em" }}>
        Residential
      </div>
    </motion.button>
  );
}

// ── Choice card ───────────────────────────────────────────────────────

function ChoiceCard({ icon, label, sub, onClick }: {
  icon: string; label: string; sub: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.04 : 1 }}
      transition={{ duration: 0.18 }}
      style={{
        background: hovered ? "rgba(126,200,227,0.12)" : "rgba(5,5,8,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered ? "rgba(126,200,227,0.35)" : "rgba(126,200,227,0.12)"}`,
        borderRadius: 18,
        padding: "32px 40px 28px",
        cursor: "pointer",
        textAlign: "center" as const,
        width: 180,
        transition: "background 0.18s, border-color 0.18s",
        boxShadow: hovered ? "0 12px 48px rgba(0,0,0,0.55)" : "0 6px 28px rgba(0,0,0,0.4)",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 14, opacity: hovered ? 0.95 : 0.55, transition: "opacity 0.18s" }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(126,200,227,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {sub}
      </div>
    </motion.button>
  );
}
