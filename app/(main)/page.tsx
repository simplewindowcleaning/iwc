"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { NPCWidget } from "@/components/NPCWidget";
import { AppHeader } from "@/components/AppHeader";
import { SlotPicker } from "@/components/SlotPicker";
import { EstimateToggle } from "@/components/EstimateToggle";
import { WindowCounter } from "@/components/WindowCounter";
import { ReviewsSection } from "@/components/ReviewsSection";
import { motion } from "framer-motion";
import { FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { detectZip, DEFAULT_ZIP } from "@/lib/serviceAreas";
import type { Step } from "@/components/npc/types";

// MapPanel uses Mapbox GL — must not SSR
const MapPanel = dynamic(() => import("@/components/MapPanel"), { ssr: false });

export default function HomePage() {
  const router = useRouter();

  // ── Shared booking state ─────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(FALLBACK_DATE);
  const [selectedTime, setSelectedTime] = useState(FALLBACK_TIME);
  const [needsEstimate, setNeedsEstimate] = useState(false);
  const [estimateDeadline, setEstimateDeadline] = useState("");
  const [windowCount, setWindowCount] = useState(1);
  const [address, setAddress] = useState("Santa Cruz, CA 95060");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // ── NPC state ─────────────────────────────────────────────────
  const [npcPaused, setNpcPaused] = useState(false);
  const [activeStep, setActiveStep] = useState<Step>("location");

  const pauseNPC = useCallback(() => {
    if (!npcPaused) setNpcPaused(true);
  }, [npcPaused]);

  // Detect which service ZIP matches the address (for map flyTo)
  const selectedZip = detectZip(address) || DEFAULT_ZIP;

  // ── Booking navigation ────────────────────────────────────────
  function buildParams(extra: Record<string, string> = {}) {
    return new URLSearchParams({
      date: selectedDate, time: selectedTime,
      windows: String(windowCount),
      address, firstName, lastName, phone, email, notes,
      needsEstimate: String(needsEstimate),
      estimateDeadline,
      ...extra,
    });
  }

  function handleBook() {
    if (!selectedDate || !selectedTime || !address.trim()) return;
    router.push(`/summary?${buildParams().toString()}`);
  }

  const canBook = Boolean(selectedDate && selectedTime && address.trim());

  // ── Mobile form column ────────────────────────────────────────
  const formColumn = (
    <div
      className="flex flex-col"
      style={{ minHeight: "100dvh" }}
      onPointerDown={pauseNPC}
    >
      <AppHeader />

      <main className="flex-1 flex flex-col gap-3 px-4 pb-8" style={{ paddingTop: 72 }}>
        <SlotPicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
        />

        <EstimateToggle
          needsEstimate={needsEstimate}
          estimateDeadline={estimateDeadline}
          onChange={setNeedsEstimate}
          onDeadlineChange={setEstimateDeadline}
        />

        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <WindowCounter count={windowCount} onChange={setWindowCount} />

          <div className="mb-3">
            <label className="field-label" htmlFor="address">Service Address *</label>
            <input id="address" className="field-input mt-1" type="text"
              placeholder="123 Main St, Santa Cruz, CA 95060"
              value={address} onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address" />
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="field-label" htmlFor="firstName">First Name</label>
              <input id="firstName" className="field-input mt-1" type="text" placeholder="Sam"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
            </div>
            <div className="flex-1">
              <label className="field-label" htmlFor="lastName">Last Name</label>
              <input id="lastName" className="field-input mt-1" type="text" placeholder="Taylor"
                value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="field-label" htmlFor="phone">Phone</label>
              <input id="phone" className="field-input mt-1" type="tel" placeholder="(831) 555-0100"
                value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            <div className="flex-1">
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" className="field-input mt-1" type="email" placeholder="you@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>

          <div className="mb-4">
            <label className="field-label" htmlFor="notes">Notes</label>
            <textarea id="notes" className="field-input mt-1" rows={2}
              placeholder="Gate code, special instructions…"
              value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "none" }} />
          </div>

          <button className="book-btn w-full" onClick={handleBook} disabled={!canBook}
            style={{ opacity: canBook ? 1 : 0.45, cursor: canBook ? "pointer" : "not-allowed" }}>
            Review &amp; Book — ${windowCount * 22}
          </button>

          {!canBook && (
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textAlign: "center", marginTop: 6 }}>
              Select a slot and enter your address to continue
            </p>
          )}
        </motion.div>
      </main>

      <ReviewsSection />
    </div>
  );

  return (
    <>
      {/* ── Desktop: satellite map left · NPC guide right ── */}
      {/* position+zIndex creates a stacking context above SparkleBackground (z-index:0) */}
      <div
        className="hidden md:flex"
        style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}
      >
        {/* Map panel — fills all space left of the NPC column */}
        <div style={{ flex: 1, position: "relative", height: "100%" }}>
          <MapPanel
            step={activeStep}
            selectedZip={selectedZip}
            date={selectedDate}
            time={selectedTime}
            windowCount={windowCount}
            needsEstimate={needsEstimate}
          />
        </div>

        {/* NPC guide column */}
        <div
          style={{
            width: 360,
            flexShrink: 0,
            height: "100vh",
            overflowY: "auto",
            background: "#0a0614",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
          }}
        >
          <NPCWidget
            date={selectedDate}
            time={selectedTime}
            windowCount={windowCount}
            needsEstimate={needsEstimate}
            estimateDeadline={estimateDeadline}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onWindowCountChange={setWindowCount}
            onNeedsEstimateChange={setNeedsEstimate}
            onEstimateDeadlineChange={setEstimateDeadline}
            paused={npcPaused}
            onResume={() => setNpcPaused(false)}
            onGoToSummary={() => router.push(`/summary?${buildParams().toString()}`)}
            onStepChange={setActiveStep}
          />
        </div>
      </div>

      {/* ── Mobile: standard form flow ── */}
      <div className="md:hidden">
        {formColumn}
      </div>
    </>
  );
}
