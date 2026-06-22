"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { NPCWidget } from "@/components/NPCWidget";
import { AppHeader } from "@/components/AppHeader";
import { MobileView } from "@/components/MobileView";
import { motion, AnimatePresence } from "framer-motion";
import { FALLBACK_DATE, FALLBACK_TIME, formatDate, formatTime, getAvailableSlots } from "@/lib/availability";
import { calcPrice } from "@/lib/constants";
import { DEFAULT_ZIP, SERVICE_AREAS } from "@/lib/serviceAreas";
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

  const [promoCode, setPromoCode]       = useState("");
  const [promoEnabled, setPromoEnabled] = useState(false);

  // ── Slot availability (fetched once, passed to both desktop NPC and mobile) ──
  const [slotMap, setSlotMap] = useState<Record<string, string[]>>({});
  useEffect(() => { getAvailableSlots().then(setSlotMap); }, []);
  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.promo_enabled) setPromoEnabled(true);
    }).catch(() => {});
  }, []);

  // ── NPC state ─────────────────────────────────────────────────
  const [npcPaused, setNpcPaused] = useState(false);
  const [activeStep, setActiveStep] = useState<Step>("location");
  const [selectedZip, setSelectedZip] = useState(DEFAULT_ZIP);
  const [goTrigger, setGoTrigger] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);
  const [reviewMode, setReviewMode]       = useState(false);
  const [rodeoModal, setRodeoModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);

  function initiateCheckout() { setContactModal(true); }

  function handleGoToReview() {
    setPanelVisible(false);
    setReviewMode(true);
  }

  function goToSummary() {
    router.push(`/summary?${buildParams().toString()}`);
  }

  // ── Booking navigation ────────────────────────────────────────
  function buildParams(extra: Record<string, string> = {}) {
    return new URLSearchParams({
      date: selectedDate, time: selectedTime,
      windows: String(windowCount),
      zip: selectedZip,
      address, firstName, lastName, phone, email, notes,
      needsEstimate: String(needsEstimate),
      estimateDeadline,
      ...extra,
    });
  }

  return (
    <>
      {/* ── Desktop: full-screen map + floating NPC panel ── */}
      <div className="hidden md:block" style={{ width: "100vw", height: "100vh" }}>
        {/* Map fills the entire viewport */}
        <MapPanel
          step={reviewMode ? "timeslot" : activeStep}
          selectedZip={selectedZip}
          date={selectedDate}
          time={selectedTime}
          windowCount={windowCount}
          needsEstimate={needsEstimate}
          onZipChange={setSelectedZip}
          onGo={() => { setPanelVisible(true); setGoTrigger(t => t + 1); }}
          onOpen={() => setPanelVisible(true)}
          address={address}
          onWindowCountChange={setWindowCount}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          slotMap={slotMap}
          showSlideshow={reviewMode}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          promoEnabled={promoEnabled}
        />

        {/* Floating NPC panel — slides in on GO! */}
        <AnimatePresence>
          {panelVisible && (
            <motion.div
              initial={{ x: 390, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 390, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "fixed",
                top: 16,
                right: 16,
                bottom: 16,
                width: 360,
                zIndex: 10,
                borderRadius: 16,
                background: "rgba(10, 6, 20, 0.80)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
                overflowY: "auto",
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
                address={address}
                firstName={firstName}
                lastName={lastName}
                phone={phone}
                email={email}
                notes={notes}
                onAddressChange={setAddress}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onPhoneChange={setPhone}
                onEmailChange={setEmail}
                onNotesChange={setNotes}
                selectedZip={selectedZip}
                paused={npcPaused}
                onResume={() => setNpcPaused(false)}
                onGoToSummary={handleGoToReview}
                onStepChange={setActiveStep}
                onZipChange={setSelectedZip}
                onBeforeCheckout={() => setRodeoModal(true)}
                slotMap={slotMap}
                goTrigger={goTrigger}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Review overlay — appears instead of routing directly to /summary ── */}
      <AnimatePresence>
        {reviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: 36,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              width: 500,
              maxWidth: "calc(100vw - 120px)",
            }}
          >
            <div style={{
              background: "rgba(5,5,8,0.90)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(126,200,227,0.2)",
              borderRadius: 18,
              padding: "20px 24px 18px",
              boxShadow: "0 12px 56px rgba(0,0,0,0.65)",
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "rgba(126,200,227,0.45)", marginBottom: 14 }}>
                Booking Summary
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
                  <span style={{ color: "rgba(126,200,227,0.5)", marginRight: 10 }}>📅</span>
                  {selectedDate ? formatDate(selectedDate) : "Date TBD"} · {selectedTime ? formatTime(selectedTime) : "Time TBD"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
                  <span style={{ color: "rgba(126,200,227,0.5)", marginRight: 10 }}>🪟</span>
                  {windowCount} window{windowCount !== 1 ? "s" : ""} ·{" "}
                  <span style={{ color: "rgba(126,200,227,0.85)", fontWeight: 700 }}>${calcPrice(windowCount, SERVICE_AREAS[selectedZip]?.minWindows ?? 1)}</span>
                </div>
                {address.trim() && !/^Santa Cruz/.test(address) && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ color: "rgba(126,200,227,0.5)", marginRight: 10 }}>📍</span>
                    {address}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setReviewMode(false); setPanelVisible(true); }}
                  style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, color: "rgba(255,255,255,0.4)",
                    fontSize: 12, fontWeight: 600, padding: "10px 18px",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(126,200,227,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >← Edit</button>
                <button
                  onClick={initiateCheckout}
                  style={{
                    flex: 1, background: "rgba(126,200,227,0.16)",
                    border: "1px solid rgba(126,200,227,0.42)",
                    borderRadius: 10, color: "rgba(126,200,227,0.95)",
                    fontSize: 13, fontWeight: 700, padding: "10px 18px",
                    cursor: "pointer", fontFamily: "inherit",
                    letterSpacing: "0.04em", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(126,200,227,0.26)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(126,200,227,0.16)"}
                >Confirm &amp; Book →</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Not Your First Rodeo modal ── */}
      <AnimatePresence>
        {rodeoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(5,5,8,0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 20px",
            }}
            onClick={() => setRodeoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "min(640px, 100%)",
                background: "rgba(8,8,18,0.97)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(126,200,227,0.18)",
                borderRadius: 22,
                padding: "36px 36px 32px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(126,200,227,0.45)", marginBottom: 12 }}>
                A note before you book
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em", marginBottom: 22, lineHeight: 1.15 }}>
                Not Your First Rodeo
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.62)", lineHeight: 1.7, marginBottom: 10 }}>
                We know you usually book windows in a different way — so to be clear, here&apos;s what&apos;s different:
              </p>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, marginBottom: 8 }}>
                We&apos;re converting our no-obligation free estimates into a <strong style={{ color: "rgba(126,200,227,0.9)" }}>1-window minimum</strong> — meaning the estimate itself comes with at least one window cleaned, on us at cost.
              </p>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.62)", lineHeight: 1.7, marginBottom: 28 }}>
                We believe this system lets us lower your overall prices for long-term maintenance — and it means every visit actually moves the needle on your windows.
              </p>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 24, lineHeight: 1.6 }}>
                * Minimums vary by distance — 1 window for Santa Cruz &amp; Live Oak, 2 windows for Capitola &amp; UCSC, 3 windows for Aptos, Soquel, Scotts Valley, Felton &amp; Pleasure Point.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setRodeoModal(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, color: "rgba(255,255,255,0.35)",
                    fontSize: 13, fontWeight: 600, padding: "12px 20px",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  ← Go back
                </button>
                <button
                  onClick={() => { setRodeoModal(false); initiateCheckout(); }}
                  style={{
                    background: "rgba(126,200,227,0.16)",
                    border: "1px solid rgba(126,200,227,0.42)",
                    borderRadius: 12, color: "rgba(126,200,227,0.95)",
                    fontSize: 13, fontWeight: 700, padding: "12px 24px",
                    cursor: "pointer", fontFamily: "inherit",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(126,200,227,0.26)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(126,200,227,0.16)"}
                >
                  Got it — continue →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contact capture modal ── */}
      <AnimatePresence>
        {contactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(5,5,8,0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 20px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                background: "rgba(8,8,18,0.97)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(126,200,227,0.18)",
                borderRadius: 22,
                padding: "36px 36px 32px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(126,200,227,0.45)", marginBottom: 12 }}>
                Almost there
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.15 }}>
                How should we reach you?
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 24 }}>
                We need a way to notify you about dispatch.
              </p>

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(126,200,227,0.22)",
                  borderRadius: 12, color: "white",
                  fontSize: 15, padding: "13px 16px",
                  fontFamily: "inherit", outline: "none",
                  marginBottom: 12,
                }}
              />

              {/* Phone */}
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Mobile number"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "white",
                  fontSize: 15, padding: "13px 16px",
                  fontFamily: "inherit", outline: "none",
                  marginBottom: 20,
                }}
              />

              {/* Text benefits */}
              <div style={{ marginBottom: 28 }}>
                {[
                  "Know who's en route and what vehicle before they arrive",
                  "Arrival and job-complete notifications",
                  "Recurring visit scheduling — one text away",
                ].map(item => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ color: "rgba(126,200,227,0.6)", fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setContactModal(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, color: "rgba(255,255,255,0.35)",
                    fontSize: 13, fontWeight: 600, padding: "12px 20px",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => { setContactModal(false); goToSummary(); }}
                  disabled={!email.trim()}
                  style={{
                    background: email.trim() ? "rgba(126,200,227,0.16)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${email.trim() ? "rgba(126,200,227,0.42)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12,
                    color: email.trim() ? "rgba(126,200,227,0.95)" : "rgba(255,255,255,0.2)",
                    fontSize: 13, fontWeight: 700, padding: "12px 24px",
                    cursor: email.trim() ? "pointer" : "not-allowed",
                    fontFamily: "inherit", letterSpacing: "0.04em",
                    transition: "all 0.15s",
                  }}
                >
                  Continue to checkout →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: satellite map + bottom-sheet PowerConsole ── */}
      <div className="md:hidden">
        <MobileView
          date={selectedDate}
          time={selectedTime}
          windowCount={windowCount}
          needsEstimate={needsEstimate}
          estimateDeadline={estimateDeadline}
          address={address}
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          email={email}
          notes={notes}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onWindowCountChange={setWindowCount}
          onNeedsEstimateChange={setNeedsEstimate}
          onEstimateDeadlineChange={setEstimateDeadline}
          onAddressChange={setAddress}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPhoneChange={setPhone}
          onEmailChange={setEmail}
          onNotesChange={setNotes}
          slotMap={slotMap}
          selectedZip={selectedZip}
          onZipChange={setSelectedZip}
          goTrigger={goTrigger}
          onGo={() => setGoTrigger(t => t + 1)}
          onStepChange={setActiveStep}
          onGoToSummary={initiateCheckout}
          onBeforeCheckout={() => setRodeoModal(true)}
        />
      </div>
    </>
  );
}
