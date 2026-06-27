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

function SoftLaunchModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = email.includes("@") && emailConsent;

  async function handleSignUp() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (_) {}
    setSubmitted(true);
    setSaving(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[500] flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500" />
          <div className="bg-[#07111c] px-7 py-7">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-teal-400/10 border border-teal-400/25 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-teal-300 text-xs font-bold tracking-widest uppercase">Soft Launch</span>
              </div>
              <p className="text-white text-xl font-bold leading-snug mb-2">
                You discovered something early! 🎉
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Live in <span className="text-white font-semibold">Santa Cruz</span> now.{" "}
                <span className="text-teal-300 font-semibold">More zips Sept 15</span>,{" "}
                <span className="text-teal-300 font-semibold">all 15 areas Oct 1</span>.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-4">
                <p className="text-teal-300 text-lg font-bold mb-1">You&apos;re on the list ✓</p>
                <p className="text-white/40 text-xs">We&apos;ll reach out when your area opens.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Email field */}
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-teal-500/50 transition-colors"
                  />
                  <AnimatePresence>
                    {email.length > 0 && (
                      <motion.label
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 mt-2 cursor-pointer overflow-hidden"
                      >
                        <input
                          type="checkbox"
                          checked={emailConsent}
                          onChange={e => setEmailConsent(e.target.checked)}
                          className="mt-0.5 flex-shrink-0 accent-teal-400"
                        />
                        <span className="text-white/40 text-xs leading-relaxed">
                          I&apos;d like to receive launch updates and promotions from Simple Windows. Unsubscribe anytime.
                        </span>
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone field — coming soon */}
                <div>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Phone number"
                      disabled
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/20 placeholder-white/15 outline-none cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest uppercase text-teal-400/50 bg-teal-400/10 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-white/25 text-xs mt-2 leading-relaxed px-1">
                    SMS appointment alerts coming soon. You&apos;ll opt in at booking — msg &amp; data rates may apply, reply STOP to unsubscribe.
                  </p>
                </div>

                {/* Buttons */}
                <button
                  onClick={handleSignUp}
                  disabled={!canSubmit || saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm tracking-wide transition-opacity disabled:opacity-30 hover:opacity-90"
                >
                  {saving ? "Saving…" : "Notify me when my area opens"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  I&apos;m already in Santa Cruz — let&apos;s book
                </button>
              </div>
            )}

            {submitted && (
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
              >
                Got it — let&apos;s book
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
  const [softLaunchModal, setSoftLaunchModal] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("soft_launch_seen")) {
      const t = setTimeout(() => setSoftLaunchModal(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

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
        {softLaunchModal && <SoftLaunchModal onClose={() => { setSoftLaunchModal(false); sessionStorage.setItem("soft_launch_seen", "1"); }} />}
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
                padding: "28px clamp(18px, 5vw, 36px) 24px",
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
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
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

              {/* SMS consent */}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.6, marginBottom: 20, marginTop: -8 }}>
                By providing your mobile number you agree to receive service notifications via SMS (dispatch updates, arrival alerts, job-complete confirmations). Msg &amp; data rates may apply. Reply STOP to opt out at any time.
              </p>

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
      <div className="md:hidden" style={{ position: "relative" }}>
        {softLaunchModal && <SoftLaunchModal onClose={() => { setSoftLaunchModal(false); sessionStorage.setItem("soft_launch_seen", "1"); }} />}
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

      {/* Desktop soft-launch popup — inside desktop section via the hidden/block wrapper above */}
    </>
  );
}
