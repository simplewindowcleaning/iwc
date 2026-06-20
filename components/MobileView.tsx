"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type mapboxgl from "mapbox-gl";
import { NPCWidget } from "@/components/NPCWidget";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { calcPrice } from "@/lib/constants";
import type { Step } from "@/components/npc/types";

// Same example sets as MapPanel
const EXAMPLE_SETS: Record<number, string[]> = {
  1: ["1a","1b","1c","1d"],
  2: ["2a","2b","2d","2a"],
  3: ["3a","3b","3c","3a"],
  4: ["4a","4b","4c","4d"],
};

const TEAL = "rgba(126,200,227,";

interface Props {
  date: string; time: string; windowCount: number;
  needsEstimate: boolean; estimateDeadline: string;
  address: string; firstName: string; lastName: string;
  phone: string; email: string; notes: string;
  slotMap: Record<string, string[]>;
  selectedZip: string;
  goTrigger: number;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onWindowCountChange: (v: number) => void;
  onNeedsEstimateChange: (v: boolean) => void;
  onEstimateDeadlineChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onZipChange: (zip: string) => void;
  onGo: () => void;
  onStepChange: (s: Step) => void;
  onGoToSummary: () => void;
  onBeforeCheckout?: () => void;
}

type Phase = "idle" | "zip" | "npc";

export function MobileView(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const zipInputRef  = useRef<HTMLInputElement>(null);

  const [phase, setPhase]         = useState<Phase>("idle");
  const [zipInput, setZipInput]   = useState("");
  const [zipError, setZipError]   = useState(false);
  const [mobileStep, setMobileStep] = useState<Step>("location");
  const [videoVisible, setVideoVisible] = useState(false);

  // ── Satellite map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [-121.9900, 37.0050],
        zoom: 10.5,
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
      });

      // SAVED — Aquarium intro flyTo:
      // center: [-121.9018, 36.6182], zoom: 17.5, pitch: 65, bearing: -28
      // map.flyTo({ center: [-121.9900, 37.0050], zoom: 10.5, ... });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Show video once user hits "npc" phase at timeslot step
  useEffect(() => {
    if (mobileStep === "timeslot") setVideoVisible(true);
    if (mobileStep === "windows" || mobileStep === "contact") setVideoVisible(false);
  }, [mobileStep]);

  function handleStepChange(s: Step) {
    setMobileStep(s);
    props.onStepChange(s);
  }

  function handleTapIdle() {
    setPhase("zip");
    setTimeout(() => zipInputRef.current?.focus(), 300);
  }

  function handleGo() {
    const zip = zipInput.trim();
    if (!SERVICE_AREAS[zip]) { setZipError(true); return; }
    setZipError(false);
    props.onZipChange(zip);
    props.onGo();
    setPhase("npc");
  }

  const minWindows = SERVICE_AREAS[props.selectedZip]?.minWindows ?? 1;
  const photoSet   = Math.min(4, Math.max(1, props.windowCount));
  const photos     = EXAMPLE_SETS[photoSet] ?? EXAMPLE_SETS[4];

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative", overflow: "hidden" }}>

      {/* Satellite map */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(5,5,8,0.48) 0%, transparent 30%, transparent 50%, rgba(5,5,8,0.82) 100%)",
      }} />

      {/* ── IDLE phase — tap anywhere ── */}
      {phase === "idle" && (
        <div
          onClick={handleTapIdle}
          style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              background: "rgba(5,5,8,0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${TEAL}0.18)`,
              borderRadius: 18,
              padding: "22px 28px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: `${TEAL}0.55)`, marginBottom: 6 }}>
              ✦ Santa Cruz County
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 6 }}>
              Simple Windows
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: `${TEAL}0.5)`, marginBottom: 16 }}>
              Instant Window Cleaning
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", letterSpacing: "0.04em" }}>
              Tap to book
            </div>
          </motion.div>
        </div>
      )}

      {/* ── ZIP phase — input slides up ── */}
      <AnimatePresence>
        {phase === "zip" && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: "rgba(8,8,16,0.94)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderTop: `1px solid ${TEAL}0.14)`,
              borderRadius: "20px 20px 0 0",
              padding: "20px 22px 36px",
              zIndex: 20,
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: `${TEAL}0.28)`, margin: "0 auto 18px" }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `${TEAL}0.5)`, marginBottom: 10 }}>
              Your ZIP code
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                ref={zipInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                placeholder="e.g. 95060"
                value={zipInput}
                onChange={e => { setZipInput(e.target.value); setZipError(false); }}
                onKeyDown={e => e.key === "Enter" && handleGo()}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${zipError ? "rgba(251,113,133,0.5)" : TEAL + "0.22)"}`,
                  borderRadius: 12,
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "14px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleGo}
                style={{
                  background: `${TEAL}0.16)`,
                  border: `1px solid ${TEAL}0.35)`,
                  borderRadius: 12,
                  color: `${TEAL}0.95)`,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  padding: "14px 22px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                GO
              </button>
            </div>
            {zipError && (
              <div style={{ fontSize: 11, color: "rgba(251,113,133,0.8)", marginTop: 8 }}>
                That ZIP isn&apos;t in our service area yet.
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              {Object.values(SERVICE_AREAS).map(a => a.name).join(" · ")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NPC phase ── */}
      <AnimatePresence>
        {phase === "npc" && (
          <>
            {/* Video — top of screen at timeslot step */}
            <AnimatePresence>
              {videoVisible && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    position: "absolute", top: 12, left: 12, right: 12,
                    zIndex: 12, borderRadius: 14,
                    border: `1px solid ${TEAL}0.22)`,
                    overflow: "hidden",
                    boxShadow: "0 6px 28px rgba(0,0,0,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  <video
                    src="/videos/demo.mp4"
                    autoPlay loop muted playsInline
                    style={{ width: "100%", display: "block" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Photos card — windows step */}
            <AnimatePresence>
              {mobileStep === "windows" && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -58%)",
                    zIndex: 12,
                    width: "min(340px, 90vw)",
                    background: "rgba(5,5,8,0.88)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${TEAL}0.2)`,
                    borderRadius: 16,
                    padding: "16px 14px",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 10 }}>
                    What counts as {photoSet} window{photoSet !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {photos.map((suffix, i) => (
                      <div key={`${photoSet}-${i}`} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "4/3" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/examples/example${suffix}.jpg`}
                          alt={`${photoSet}-window example`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: `${TEAL}0.85)`, textAlign: "center", marginTop: 10 }}>
                    {props.windowCount} window{props.windowCount !== 1 ? "s" : ""} · ${calcPrice(props.windowCount, minWindows)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NPC panel — bottom sheet */}
            <motion.div
              key="npc"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              style={{
                position: "fixed",
                bottom: 0, left: 0, right: 0,
                height: mobileStep === "windows" ? "42dvh" : "72dvh",
                background: "rgba(8,8,16,0.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderTop: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: "18px 18px 0 0",
                zIndex: 20,
                overflowY: "auto",
                transition: "height 0.35s ease",
              }}
            >
              <NPCWidget
                date={props.date}
                time={props.time}
                windowCount={props.windowCount}
                needsEstimate={props.needsEstimate}
                estimateDeadline={props.estimateDeadline}
                onDateChange={props.onDateChange}
                onTimeChange={props.onTimeChange}
                onWindowCountChange={props.onWindowCountChange}
                onNeedsEstimateChange={props.onNeedsEstimateChange}
                onEstimateDeadlineChange={props.onEstimateDeadlineChange}
                address={props.address}
                firstName={props.firstName}
                lastName={props.lastName}
                phone={props.phone}
                email={props.email}
                notes={props.notes}
                onAddressChange={props.onAddressChange}
                onFirstNameChange={props.onFirstNameChange}
                onLastNameChange={props.onLastNameChange}
                onPhoneChange={props.onPhoneChange}
                onEmailChange={props.onEmailChange}
                onNotesChange={props.onNotesChange}
                selectedZip={props.selectedZip}
                paused={false}
                onResume={() => {}}
                onGoToSummary={props.onGoToSummary}
                onBeforeCheckout={props.onBeforeCheckout}
                onStepChange={handleStepChange}
                onZipChange={props.onZipChange}
                slotMap={props.slotMap}
                goTrigger={props.goTrigger}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logo — top-left, always visible in npc phase */}
      {phase === "npc" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: "absolute", top: 14, left: 14, zIndex: 11, pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(5,5,8,0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${TEAL}0.12)`,
            borderRadius: 10,
            padding: "8px 12px 6px",
          }}>
            <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `${TEAL}0.55)`, marginBottom: 3 }}>✦ Santa Cruz</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>Simple Windows</div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
