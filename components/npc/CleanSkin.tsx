"use client";

import { useState } from "react";
import { formatDate, formatTime, getNextDays, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { SERVICE_AREAS, DEFAULT_ZIP } from "@/lib/serviceAreas";
import type { SkinProps, Step } from "./types";

// ── Theme token sets ──────────────────────────────────────────────────
const DARK = {
  ACCENT:        "#a78bfa",
  ACCENT_DIM:    "rgba(167,139,250,0.15)",
  ACCENT_BORDER: "rgba(167,139,250,0.3)",
  CARD_BG:       "rgba(255,255,255,0.04)",
  CARD_BORDER:   "rgba(255,255,255,0.08)",
  TEXT:          "#ffffff",
  TEXT_DIM:      "rgba(255,255,255,0.45)",
  TEXT_FAINT:    "rgba(255,255,255,0.2)",
  GREEN:         "#4ade80",
  PANEL_BG:      "#080810",
  INPUT_BG:      "rgba(255,255,255,0.05)",
  INPUT_BORDER:  "rgba(255,255,255,0.1)",
  INPUT_TEXT:    "white",
  SLOT_BG:       "rgba(0,0,0,0.2)",
};

const LIGHT = {
  ACCENT:        "#6d28d9",
  ACCENT_DIM:    "rgba(109,40,217,0.1)",
  ACCENT_BORDER: "rgba(109,40,217,0.22)",
  CARD_BG:       "rgba(0,0,0,0.028)",
  CARD_BORDER:   "rgba(0,0,0,0.1)",
  TEXT:          "#111827",
  TEXT_DIM:      "rgba(17,24,39,0.5)",
  TEXT_FAINT:    "rgba(17,24,39,0.28)",
  GREEN:         "#16a34a",
  PANEL_BG:      "#f4f4fa",
  INPUT_BG:      "rgba(0,0,0,0.04)",
  INPUT_BORDER:  "rgba(0,0,0,0.12)",
  INPUT_TEXT:    "#111827",
  SLOT_BG:       "rgba(0,0,0,0.04)",
};

type Tokens = typeof DARK;

// ── Main CleanSkin component ──────────────────────────────────────────
export function CleanSkin(props: SkinProps) {
  const { step, goToStep, questItems, date, time, windowCount, needsEstimate,
          onDateChange, onTimeChange, onWindowCountChange, onNeedsEstimateChange,
          slotMap, onGoToSummary, onZipChange, mode, onSkinChange } = props;

  const T: Tokens = mode === "light" ? LIGHT : DARK;

  const [showSlots, setShowSlots]       = useState(false);
  const [localEstimate, setLocalEstimate] = useState(needsEstimate);
  const [showZipInput, setShowZipInput]  = useState(false);
  const [zipInputValue, setZipInputValue] = useState("");
  const [zipError, setZipError]          = useState("");

  // ── Sub-components close over T ──────────────────────────────────

  function CompletedRow({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:T.CARD_BG, border:`1px solid ${T.CARD_BORDER}`, borderRadius:12, marginBottom:6 }}>
        <span style={{ fontSize:14, color:T.GREEN, flexShrink:0 }}>✓</span>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:T.TEXT_DIM }}>{label}</span>
          <span style={{ fontSize:12, fontWeight:500, color:T.TEXT, marginLeft:8 }}>{value}</span>
        </div>
      </div>
    );
  }

  function UpcomingRow({ label }: { label: string }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:12, marginBottom:6, opacity:0.35 }}>
        <span style={{ fontSize:12, color:T.TEXT_DIM, flexShrink:0 }}>○</span>
        <span style={{ fontSize:11, fontWeight:500, color:T.TEXT_DIM, letterSpacing:"0.05em" }}>{label}</span>
      </div>
    );
  }

  function AccentBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button onClick={onClick}
        style={{ width:"100%", background:T.ACCENT, color:"#f9f9ff", border:"none", borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:12, transition:"opacity 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >{label}</button>
    );
  }

  function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button onClick={onClick}
        style={{ background:"transparent", border:`1px solid ${T.CARD_BORDER}`, borderRadius:10, color:T.TEXT_DIM, padding:"8px 14px", fontSize:12, cursor:"pointer", marginTop:6, transition:"border-color 0.15s, color 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.ACCENT_BORDER; e.currentTarget.style.color = T.ACCENT; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.CARD_BORDER; e.currentTarget.style.color = T.TEXT_DIM; }}
      >{label}</button>
    );
  }

  function ActiveCard({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ background:T.CARD_BG, border:`1px solid ${T.ACCENT_BORDER}`, borderRadius:16, padding:"14px 14px 16px", boxShadow:`0 0 20px ${T.ACCENT_DIM}`, marginBottom:6 }}>
        {children}
      </div>
    );
  }

  function CardLabel({ text }: { text: string }) {
    return (
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase" as const, color:T.ACCENT, marginBottom:8 }}>{text}</div>
    );
  }

  function Counter({ count, onChange }: { count: number; onChange: (n: number) => void }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:14, margin:"12px 0" }}>
        <button onClick={() => onChange(Math.max(1, count - 1))}
          style={{ width:32, height:32, borderRadius:"50%", background:T.ACCENT_DIM, border:`1px solid ${T.ACCENT_BORDER}`, color:T.ACCENT, fontSize:18, fontWeight:700, cursor:count<=1?"not-allowed":"pointer", opacity:count<=1?0.4:1 }}>−</button>
        <span style={{ fontSize:20, fontWeight:800, color:T.TEXT, minWidth:24, textAlign:"center" as const }}>{count}</span>
        <button onClick={() => onChange(Math.min(20, count + 1))}
          style={{ width:32, height:32, borderRadius:"50%", background:T.ACCENT_DIM, border:`1px solid ${T.ACCENT_BORDER}`, color:T.ACCENT, fontSize:18, fontWeight:700, cursor:count>=20?"not-allowed":"pointer", opacity:count>=20?0.4:1 }}>+</button>
        <span style={{ fontSize:12, color:T.TEXT_DIM, marginLeft:4 }}>${count*22} total</span>
      </div>
    );
  }

  function OptionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick}
        style={{ padding:"9px 14px", borderRadius:10, border:`1px solid ${selected?T.ACCENT:T.CARD_BORDER}`, background:selected?T.ACCENT_DIM:"transparent", color:selected?T.ACCENT:T.TEXT_DIM, fontSize:12, fontWeight:selected?600:400, cursor:"pointer", marginRight:6, marginBottom:6, transition:"all 0.15s" }}
      >{label}</button>
    );
  }

  const fieldInput: React.CSSProperties = {
    width:"100%", background:T.INPUT_BG, border:`1px solid ${T.INPUT_BORDER}`,
    borderRadius:10, color:T.INPUT_TEXT, fontSize:13, fontWeight:500, padding:"9px 12px",
    outline:"none", fontFamily:"inherit", marginBottom:6,
  };

  // ── Step helpers ──────────────────────────────────────────────────

  const slot = date
    ? `${formatDate(date)} at ${formatTime(time)}`
    : `${formatDate(FALLBACK_DATE)} at ${formatTime(FALLBACK_TIME)}`;

  function advance(s: Step) {
    setShowSlots(false);
    setShowZipInput(false);
    setZipInputValue("");
    setZipError("");
    goToStep(s);
  }

  function startOver() {
    setShowZipInput(false);
    setZipInputValue("");
    setZipError("");
    onZipChange?.(DEFAULT_ZIP);
    advance("location");
  }

  function handleZipSubmit() {
    const z = zipInputValue.trim();
    if (!SERVICE_AREAS[z]) {
      setZipError("ZIP not in service area. Try: 95060, 95062, 95003, 95018, 95066, 95073, 95064, 95065, 95010");
      return;
    }
    onZipChange?.(z);
    advance("timeslot");
  }

  const STEPS: Step[] = ["location","timeslot","windows","estimate","contact","complete"];
  const currentIdx = STEPS.indexOf(step);

  const STEP_LABELS: Record<Step, string> = {
    location:"Service area", timeslot:"Date & time", windows:"Window count",
    estimate:"Estimate", contact:"Contact info", complete:"Complete",
  };

  // ── Question cards ────────────────────────────────────────────────

  function renderCurrentQuestion() {
    switch (step) {
      case "location": return (
        <>
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.ACCENT_DIM}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.TEXT, lineHeight:1.4, marginBottom:5 }}>
              Welcome to Instant Window Cleaning for Ladderless Windows
            </div>
            <div style={{ fontSize:11, color:T.TEXT_DIM, lineHeight:1.45 }}>
              Book a window cleaning + full estimate in 30 seconds!
            </div>
          </div>
          <ActiveCard>
            <CardLabel text="Service Area" />
            <p style={{ fontSize:13, color:T.TEXT, marginBottom:4 }}>Is <strong style={{ color:T.ACCENT }}>Santa Cruz, CA 95060</strong> the correct service area?</p>
            <p style={{ fontSize:11, color:T.TEXT_DIM, marginBottom:12 }}>We'll zoom in and confirm the location on the map.</p>
            <AccentBtn label="✓ Yes, that's my area (95060)" onClick={() => advance("timeslot")} />
            <div style={{ display:"flex", marginTop:8 }}>
              <GhostBtn label="Enter a different ZIP" onClick={() => { setShowZipInput(true); setZipError(""); }} />
            </div>
            {showZipInput && (
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${T.CARD_BORDER}` }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", color:T.ACCENT, marginBottom:8, textTransform:"uppercase" as const }}>Enter your ZIP code</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input type="text" placeholder="e.g. 95062" maxLength={5}
                    value={zipInputValue}
                    onChange={e => { setZipInputValue(e.target.value.replace(/\D/g,"")); setZipError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleZipSubmit()}
                    style={{ ...fieldInput, flex:1, marginBottom:0, fontSize:14, fontWeight:600 }}
                  />
                  <button onClick={handleZipSubmit}
                    style={{ flexShrink:0, background:T.ACCENT, color:"#f9f9ff", border:"none", borderRadius:10, padding:"9px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}
                  >Go →</button>
                </div>
                {zipError && <p style={{ fontSize:10, color:"#f87171", marginTop:6, lineHeight:1.5 }}>{zipError}</p>}
              </div>
            )}
          </ActiveCard>
        </>
      );

      case "timeslot": return (
        <ActiveCard>
          <CardLabel text="Date & Time" />
          <p style={{ fontSize:13, color:T.TEXT, marginBottom:12 }}>Your slot: <strong style={{ color:T.ACCENT }}>{slot}</strong></p>
          <AccentBtn label="✓ Keep this time" onClick={() => advance("windows")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label={showSlots ? "Hide times ↑" : "See other slots ↓"} onClick={() => setShowSlots(v => !v)} />
          </div>
          {showSlots && (
            <div style={{ maxHeight:140, overflowY:"auto", marginTop:10, border:`1px solid ${T.CARD_BORDER}`, borderRadius:10, padding:"8px 10px", background:T.SLOT_BG }}>
              {getNextDays().map(d => {
                const slots = slotMap[d] ?? [];
                if (!slots.length) return null;
                return (
                  <div key={d} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:T.TEXT_DIM, marginBottom:4, letterSpacing:"0.08em" }}>{formatDate(d)}</div>
                    <div style={{ display:"flex", flexWrap:"wrap" as const, gap:4 }}>
                      {slots.map(t => (
                        <button key={t}
                          onClick={() => { onDateChange(d); onTimeChange(t); setShowSlots(false); advance("windows"); }}
                          style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${d===date&&t===time?T.ACCENT:T.CARD_BORDER}`, background:d===date&&t===time?T.ACCENT_DIM:"transparent", color:d===date&&t===time?T.ACCENT:T.TEXT_DIM, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}
                        >{formatTime(t)}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ActiveCard>
      );

      case "windows": return (
        <ActiveCard>
          <CardLabel text="Windows" />
          <p style={{ fontSize:13, color:T.TEXT_DIM, marginBottom:0 }}>How many windows today? <span style={{ color:T.ACCENT }}>$22 each</span></p>
          <Counter count={windowCount} onChange={onWindowCountChange} />
          <AccentBtn label={`✓ Confirm ${windowCount} window${windowCount!==1?"s":""} — $${windowCount*22}`} onClick={() => advance("estimate")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label="← Back" onClick={() => advance("timeslot")} />
          </div>
        </ActiveCard>
      );

      case "estimate": return (
        <ActiveCard>
          <CardLabel text="Estimate" />
          <p style={{ fontSize:13, color:T.TEXT, marginBottom:12 }}>Include a full-house estimate? <span style={{ color:T.TEXT_DIM, fontSize:11 }}>No extra charge for the visit.</span></p>
          <div>
            <OptionPill label="No — windows only" selected={!localEstimate} onClick={() => setLocalEstimate(false)} />
            <OptionPill label="Yes — full estimate" selected={localEstimate} onClick={() => setLocalEstimate(true)} />
          </div>
          <AccentBtn label="✓ Confirm preference" onClick={() => { onNeedsEstimateChange(localEstimate); advance("contact"); }} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label="← Back" onClick={() => advance("windows")} />
          </div>
        </ActiveCard>
      );

      case "contact": return (
        <ActiveCard>
          <CardLabel text="Contact Info" />
          <p style={{ fontSize:12, color:T.TEXT_DIM, marginBottom:10 }}>Optional — we'll find you by address.</p>
          <input type="text" placeholder="First name" style={fieldInput} />
          <input type="tel" placeholder="Phone (optional)" style={fieldInput} />
          <input type="email" placeholder="Email (optional)" style={{ ...fieldInput, marginBottom:0 }} />
          <AccentBtn label="✓ Done — review booking" onClick={() => advance("complete")} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <GhostBtn label="Skip" onClick={() => advance("complete")} />
            <GhostBtn label="← Back" onClick={() => advance("estimate")} />
          </div>
        </ActiveCard>
      );

      case "complete": return (
        <ActiveCard>
          <CardLabel text="✦ All Set!" />
          <p style={{ fontSize:13, color:T.TEXT, marginBottom:4 }}>Your booking details are ready.</p>
          <p style={{ fontSize:11, color:T.TEXT_DIM, marginBottom:12 }}>Hit <strong>Book Now</strong> on the form, or go straight to checkout below.</p>
          <AccentBtn label="→ Go straight to checkout" onClick={onGoToSummary} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label="Start over" onClick={() => advance("location")} />
          </div>
        </ActiveCard>
      );
    }
  }

  return (
    <div style={{ padding:"16px 14px 20px", display:"flex", flexDirection:"column", height:"100%", overflowY:"auto", background:T.PANEL_BG }}>

      {/* Header row */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:T.TEXT_FAINT, marginBottom:2 }}>
            Booking Guide
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:T.TEXT }}>Complete your booking below</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:2, flexShrink:0 }}>
          {onSkinChange && (
            <button onClick={() => onSkinChange("power")}
              title="Switch to full form"
              style={{ background:"transparent", border:`1px solid ${T.CARD_BORDER}`, borderRadius:6, color:T.TEXT_DIM, fontSize:9, fontWeight:600, letterSpacing:"0.06em", padding:"3px 7px", cursor:"pointer", textTransform:"uppercase" as const, fontFamily:"inherit" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.ACCENT_BORDER; e.currentTarget.style.color = T.ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.CARD_BORDER; e.currentTarget.style.color = T.TEXT_DIM; }}
            >Full Form</button>
          )}
          {step !== "location" && (
            <button onClick={startOver}
              style={{ background:"transparent", border:"none", color:T.TEXT_DIM, fontSize:10, cursor:"pointer", whiteSpace:"nowrap" as const, textDecoration:"underline", textUnderlineOffset:2, fontFamily:"inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = T.ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = T.TEXT_DIM}
            >↩ New ZIP</button>
          )}
        </div>
      </div>

      {/* Completed steps */}
      {questItems.filter(q => q.confirmed).map(q => (
        <CompletedRow key={q.step} label={q.label} value={q.value} />
      ))}

      {questItems.some(q => q.confirmed) && step !== "complete" && (
        <div style={{ height:1, background:T.ACCENT_DIM, margin:"8px 0 12px" }} />
      )}

      {/* Active question */}
      {renderCurrentQuestion()}

      {/* Upcoming steps */}
      {STEPS.slice(currentIdx + 1).filter(s => s !== "complete").map(s => (
        <UpcomingRow key={s} label={STEP_LABELS[s]} />
      ))}
    </div>
  );
}
