"use client";

import { useState } from "react";
import { formatDate, formatTime, getNext14Days, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import type { SkinProps, Step } from "./types";

// ── Design tokens matching the main site ──────────────────────────
const ACCENT = "#a78bfa";
const ACCENT_DIM = "rgba(167,139,250,0.15)";
const ACCENT_BORDER = "rgba(167,139,250,0.3)";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#ffffff";
const TEXT_DIM = "rgba(255,255,255,0.45)";
const TEXT_FAINT = "rgba(255,255,255,0.2)";
const GREEN = "#4ade80";

// ── Completed breadcrumb ──────────────────────────────────────────
function CompletedRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:CARD_BG, border:`1px solid ${CARD_BORDER}`, borderRadius:12, marginBottom:6 }}>
      <span style={{ fontSize:14, color:GREEN, flexShrink:0 }}>✓</span>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:TEXT_DIM }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:500, color:TEXT, marginLeft:8 }}>{value}</span>
      </div>
    </div>
  );
}

// ── Upcoming (dimmed) placeholder ─────────────────────────────────
function UpcomingRow({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:12, marginBottom:6, opacity:0.35 }}>
      <span style={{ fontSize:12, color:TEXT_DIM, flexShrink:0 }}>○</span>
      <span style={{ fontSize:11, fontWeight:500, color:TEXT_DIM, letterSpacing:"0.05em" }}>{label}</span>
    </div>
  );
}

// ── Primary action button ─────────────────────────────────────────
function AccentBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:ACCENT, color:"#08080e", border:"none", borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:12, transition:"opacity 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}
    >{label}</button>
  );
}

// ── Ghost / secondary button ──────────────────────────────────────
function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background:"transparent", border:`1px solid ${CARD_BORDER}`, borderRadius:10, color:TEXT_DIM, padding:"8px 14px", fontSize:12, cursor:"pointer", marginTop:6, transition:"border-color 0.15s, color 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT_BORDER;e.currentTarget.style.color=ACCENT;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=CARD_BORDER;e.currentTarget.style.color=TEXT_DIM;}}
    >{label}</button>
  );
}

// ── Active question card ──────────────────────────────────────────
function ActiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background:CARD_BG, border:`1px solid ${ACCENT_BORDER}`, borderRadius:16, padding:"14px 14px 16px", boxShadow:`0 0 20px rgba(167,139,250,0.08)`, marginBottom:6 }}>
      {children}
    </div>
  );
}

function CardLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:ACCENT, marginBottom:8 }}>{text}</div>
  );
}

// ── Field input (matching site design) ────────────────────────────
const fieldInput: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid rgba(255,255,255,0.1)`,
  borderRadius:10, color:"white", fontSize:13, fontWeight:500, padding:"9px 12px",
  outline:"none", fontFamily:"inherit", marginBottom:6,
};

// ── Counter control ───────────────────────────────────────────────
function Counter({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, margin:"12px 0" }}>
      <button onClick={()=>onChange(Math.max(1,count-1))}
        style={{ width:32, height:32, borderRadius:"50%", background:ACCENT_DIM, border:`1px solid ${ACCENT_BORDER}`, color:ACCENT, fontSize:18, fontWeight:700, cursor:count<=1?"not-allowed":"pointer", opacity:count<=1?0.4:1 }}>−</button>
      <span style={{ fontSize:20, fontWeight:800, color:TEXT, minWidth:24, textAlign:"center" }}>{count}</span>
      <button onClick={()=>onChange(Math.min(20,count+1))}
        style={{ width:32, height:32, borderRadius:"50%", background:ACCENT_DIM, border:`1px solid ${ACCENT_BORDER}`, color:ACCENT, fontSize:18, fontWeight:700, cursor:count>=20?"not-allowed":"pointer", opacity:count>=20?0.4:1 }}>+</button>
      <span style={{ fontSize:12, color:TEXT_DIM, marginLeft:4 }}>${count*22} total</span>
    </div>
  );
}

// ── Option pill ───────────────────────────────────────────────────
function OptionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding:"9px 14px", borderRadius:10, border:`1px solid ${selected?ACCENT:CARD_BORDER}`, background:selected?ACCENT_DIM:"transparent", color:selected?ACCENT:TEXT_DIM, fontSize:12, fontWeight:selected?600:400, cursor:"pointer", marginRight:6, marginBottom:6, transition:"all 0.15s" }}
    >{label}</button>
  );
}

// ── Main CleanSkin component ──────────────────────────────────────
export function CleanSkin(props: SkinProps) {
  const { step, goToStep, questItems, date, time, windowCount, needsEstimate,
          onDateChange, onTimeChange, onWindowCountChange, onNeedsEstimateChange,
          slotMap, onGoToSummary } = props;

  const [showSlots, setShowSlots] = useState(false);
  const [localEstimate, setLocalEstimate] = useState(needsEstimate);

  const slot = date
    ? `${formatDate(date)} at ${formatTime(time)}`
    : `${formatDate(FALLBACK_DATE)} at ${formatTime(FALLBACK_TIME)}`;

  function advance(s: Step) { setShowSlots(false); goToStep(s); }

  // ── Step: what's completed vs current vs upcoming ─────────────
  const STEPS: Step[] = ["location","timeslot","windows","estimate","contact","complete"];
  const currentIdx = STEPS.indexOf(step);

  function renderCurrentQuestion() {
    switch (step) {
      case "location": return (
        <ActiveCard>
          <CardLabel text="Service Area" />
          <p style={{ fontSize:13, color:TEXT, marginBottom:4 }}>Is <strong style={{ color:ACCENT }}>Santa Cruz, CA 95060</strong> the correct service area?</p>
          <p style={{ fontSize:11, color:TEXT_DIM, marginBottom:12 }}>We'll confirm the exact address on the next screen.</p>
          <AccentBtn label="✓ Yes, that's correct" onClick={() => advance("timeslot")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label="Use a different city / ZIP" onClick={() => advance("timeslot")} />
          </div>
        </ActiveCard>
      );

      case "timeslot": return (
        <ActiveCard>
          <CardLabel text="Date & Time" />
          <p style={{ fontSize:13, color:TEXT, marginBottom:12 }}>Your slot: <strong style={{ color:ACCENT }}>{slot}</strong></p>
          <AccentBtn label="✓ Keep this time" onClick={() => advance("windows")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label={showSlots ? "Hide times ↑" : "See other slots ↓"} onClick={() => setShowSlots(v=>!v)} />
          </div>
          {showSlots && (
            <div style={{ maxHeight:140, overflowY:"auto", marginTop:10, border:`1px solid ${CARD_BORDER}`, borderRadius:10, padding:"8px 10px", background:"rgba(0,0,0,0.2)" }}>
              {getNext14Days().map(d => {
                const slots = slotMap[d] ?? [];
                if (!slots.length) return null;
                return (
                  <div key={d} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:TEXT_DIM, marginBottom:4, letterSpacing:"0.08em" }}>{formatDate(d)}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {slots.map(t => (
                        <button key={t}
                          onClick={() => { onDateChange(d); onTimeChange(t); setShowSlots(false); advance("windows"); }}
                          style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${d===date&&t===time?ACCENT:CARD_BORDER}`, background:d===date&&t===time?ACCENT_DIM:"transparent", color:d===date&&t===time?ACCENT:TEXT_DIM, fontSize:11, cursor:"pointer" }}
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
          <p style={{ fontSize:13, color:TEXT_DIM, marginBottom:0 }}>How many windows today? <span style={{ color:ACCENT }}>$22 each</span></p>
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
          <p style={{ fontSize:13, color:TEXT, marginBottom:12 }}>Include a full-house estimate? <span style={{ color:TEXT_DIM, fontSize:11 }}>No extra charge for the visit.</span></p>
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
          <p style={{ fontSize:12, color:TEXT_DIM, marginBottom:10 }}>Optional — we'll find you by address.</p>
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
          <p style={{ fontSize:13, color:TEXT, marginBottom:4 }}>Your booking details are ready.</p>
          <p style={{ fontSize:11, color:TEXT_DIM, marginBottom:12 }}>Hit <strong>Book Now</strong> on the form, or go straight to checkout below.</p>
          <AccentBtn label="→ Go straight to checkout" onClick={onGoToSummary} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn label="Start over" onClick={() => advance("location")} />
          </div>
        </ActiveCard>
      );
    }
  }

  // ── Label for each step ───────────────────────────────────────
  const STEP_LABELS: Record<Step, string> = {
    location: "Service area", timeslot: "Date & time", windows: "Window count",
    estimate: "Estimate", contact: "Contact info", complete: "Complete",
  };

  return (
    <div style={{ padding:"16px 14px 20px", display:"flex", flexDirection:"column", gap:0, height:"100%", overflowY:"auto", background:"#080810" }}>
      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:TEXT_FAINT, marginBottom:2 }}>
          Booking Guide
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>Complete your booking below</div>
      </div>

      {/* Completed steps */}
      {questItems.filter(q => q.confirmed).map(q => (
        <CompletedRow key={q.step} label={q.label} value={q.value} />
      ))}

      {/* Divider if anything is completed */}
      {questItems.some(q => q.confirmed) && step !== "complete" && (
        <div style={{ height:1, background:`rgba(167,139,250,0.12)`, margin:"8px 0 12px" }} />
      )}

      {/* Current active question */}
      {renderCurrentQuestion()}

      {/* Upcoming steps */}
      {STEPS.slice(currentIdx + 1).filter(s => s !== "complete").map(s => (
        <UpcomingRow key={s} label={STEP_LABELS[s]} />
      ))}
    </div>
  );
}
