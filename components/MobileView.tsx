"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type mapboxgl from "mapbox-gl";
import { NPCWidget } from "@/components/NPCWidget";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { calcPrice } from "@/lib/constants";
import type { Step } from "@/components/npc/types";

const EXAMPLE_SETS: Record<number, string[]> = {
  1: ["1a","1b","1c","1d"],
  2: ["2a","2b","2d","2a"],
  3: ["3a","3b","3c","3a"],
  4: ["4a","4b","4c","4d"],
};

const TEAL = "rgba(126,200,227,";

const PILLS = [
  "Instant booking",
  "$2M insured",
  "No minimum",
  "25 yrs exp",
  "Badged staff",
  "Text updates",
  "100% cashless",
  "Tips to tech",
];

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

const STEP_ORDER: Step[] = ["location","timeslot","windows","contact"];

export function MobileView(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const zipInputRef  = useRef<HTMLInputElement>(null);

  const [phase, setPhase]           = useState<Phase>("idle");
  const [zipInput, setZipInput]     = useState("");
  const [zipError, setZipError]     = useState(false);
  const [mobileStep, setMobileStep] = useState<Step>("location");
  const [pillIdx, setPillIdx]       = useState(0);

  // Satellite map
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
        interactive: false,
        attributionControl: false,
      });
      mapRef.current = map;
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Pill ticker (idle only)
  useEffect(() => {
    if (phase !== "idle") return;
    const id = setInterval(() => setPillIdx(i => (i + 1) % PILLS.length), 2800);
    return () => clearInterval(id);
  }, [phase]);

  function handleStepChange(s: Step) {
    setMobileStep(s);
    props.onStepChange(s);
  }

  function handleGo() {
    const zip = zipInput.trim();
    if (!SERVICE_AREAS[zip]) { setZipError(true); return; }
    setZipError(false);
    props.onZipChange(zip);
    props.onGo();
    setPhase("npc");
  }

  const stepIdx    = STEP_ORDER.indexOf(mobileStep);
  const minWindows = SERVICE_AREAS[props.selectedZip]?.minWindows ?? 5;
  const photoSet   = Math.min(4, Math.max(1, props.windowCount));
  const photos     = EXAMPLE_SETS[photoSet] ?? EXAMPLE_SETS[4];

  // Sheet height: compact at windows step (photos visible above), tall otherwise
  const sheetHeight = mobileStep === "windows" ? "44dvh" : "72dvh";

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative", overflow: "hidden", background: "#08080e" }}>

      {/* Satellite map */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(5,5,8,0.6) 0%, transparent 28%, transparent 55%, rgba(5,5,8,0.92) 100%)",
      }} />

      {/* ── IDLE ── */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            onClick={() => { setPhase("zip"); setTimeout(() => zipInputRef.current?.focus(), 320); }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "0 24px" }}
          >
            {/* Hero card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%", maxWidth: 320,
                background: "rgba(5,5,8,0.84)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: `1px solid ${TEAL}0.2)`,
                borderRadius: 22,
                padding: "26px 22px 20px",
                textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: `${TEAL}0.55)`, marginBottom: 8 }}>
                ✦ Santa Cruz County
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 4 }}>
                Simple<br />Windows
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: `${TEAL}0.45)`, marginBottom: 20 }}>
                Instant Window Cleaning
              </div>

              {/* Differentiator pill — cycles */}
              <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pillIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: `${TEAL}0.08)`,
                      border: `1px solid ${TEAL}0.2)`,
                      borderRadius: 20, padding: "5px 14px",
                      fontSize: 11, fontWeight: 700, color: `${TEAL}0.85)`,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {PILLS[pillIdx]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Book CTA */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Tap to book
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ZIP ── */}
      <AnimatePresence>
        {phase === "zip" && (
          <motion.div
            key="zip"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: "rgba(8,8,16,0.96)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              borderTop: `1px solid ${TEAL}0.14)`,
              borderRadius: "22px 22px 0 0",
              padding: "18px 22px 40px",
              zIndex: 30,
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: `${TEAL}0.25)`, margin: "0 auto 20px" }} />

            <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              Where are you?
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 18 }}>
              Enter your ZIP to check availability
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                ref={zipInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                placeholder="95060"
                value={zipInput}
                onChange={e => { setZipInput(e.target.value); setZipError(false); }}
                onKeyDown={e => e.key === "Enter" && handleGo()}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${zipError ? "rgba(251,113,133,0.5)" : TEAL + "0.22)"}`,
                  borderRadius: 14, color: "white",
                  fontSize: 22, fontWeight: 700, letterSpacing: "0.1em",
                  padding: "14px 16px", outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleGo}
                style={{
                  background: `${TEAL}0.16)`,
                  border: `1px solid ${TEAL}0.35)`,
                  borderRadius: 14,
                  color: `${TEAL}0.95)`,
                  fontSize: 16, fontWeight: 800, letterSpacing: "0.06em",
                  padding: "0 24px", cursor: "pointer", flexShrink: 0,
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

            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.values(SERVICE_AREAS).map(a => (
                <button
                  key={a.zip}
                  onClick={() => { setZipInput(a.zip); setZipError(false); }}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, color: "rgba(255,255,255,0.4)", fontSize: 10,
                    padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {a.zip} · {a.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NPC phase ── */}
      <AnimatePresence>
        {phase === "npc" && (
          <>
            {/* Top logo badge */}
            <motion.div
              key="logo"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{ position: "absolute", top: 14, left: 14, zIndex: 25, pointerEvents: "none" }}
            >
              <div style={{
                background: "rgba(5,5,8,0.78)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${TEAL}0.14)`,
                borderRadius: 10, padding: "7px 11px 6px",
              }}>
                <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `${TEAL}0.5)`, marginBottom: 2 }}>✦ Santa Cruz</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>Simple Windows</div>
              </div>
            </motion.div>

            {/* Step progress dots — top-right */}
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ position: "absolute", top: 20, right: 16, zIndex: 25, display: "flex", gap: 5, pointerEvents: "none" }}
            >
              {STEP_ORDER.map((s, i) => (
                <div
                  key={s}
                  style={{
                    width: i <= stepIdx ? 18 : 5,
                    height: 5, borderRadius: 3,
                    background: i <= stepIdx ? `${TEAL}0.7)` : "rgba(255,255,255,0.15)",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                />
              ))}
            </motion.div>

            {/* Photos overlay — visible at windows step, sits above sheet */}
            <AnimatePresence>
              {mobileStep === "windows" && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.28 }}
                  style={{
                    position: "absolute",
                    bottom: "calc(44dvh + 12px)",
                    left: 0, right: 0, margin: "0 auto",
                    zIndex: 22,
                    width: "min(300px, 88vw)",
                    background: "rgba(5,5,8,0.9)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${TEAL}0.18)`,
                    borderRadius: 16, padding: "12px 10px 10px",
                    boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textAlign: "center", marginBottom: 8 }}>
                    {photoSet} window{photoSet !== 1 ? "s" : ""} looks like this
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                    {photos.map((suffix, i) => (
                      <div key={`${photoSet}-${i}`} style={{ borderRadius: 7, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", aspectRatio: "4/3" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/examples/example${suffix}.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: `${TEAL}0.85)`, textAlign: "center", marginTop: 8, letterSpacing: "-0.01em" }}>
                    {props.windowCount} window{props.windowCount !== 1 ? "s" : ""} · ${calcPrice(props.windowCount, minWindows)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom sheet */}
            <motion.div
              key="sheet"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              style={{
                position: "fixed",
                bottom: 0, left: 0, right: 0,
                height: sheetHeight,
                background: "rgba(8,8,16,0.96)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                borderTop: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: "20px 20px 0 0",
                zIndex: 24,
                overflowY: "auto",
                transition: "height 0.38s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Sheet handle */}
              <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "10px auto 0" }} />

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
    </div>
  );
}
