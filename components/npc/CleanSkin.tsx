"use client";

import { useState, useEffect } from "react";
import { formatDate, formatTime, getNextDays, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { SERVICE_AREAS, DEFAULT_ZIP } from "@/lib/serviceAreas";
import { calcPrice, MIN_WINDOWS, MAX_WINDOWS } from "@/lib/constants";
import { DARK, LIGHT, type Tokens } from "./theme";
import type { SkinProps, Step } from "./types";
import { AdminQuickAccess } from "./AdminQuickAccess";

// ── Module-level step order and labels ───────────────────────────────
const STEPS: Step[] = ["location", "timeslot", "windows", "contact", "complete"];
const STEP_LABELS: Record<Step, string> = {
  location: "Service area", timeslot: "Date & time", windows: "Window count",
  estimate: "Estimate", contact: "Service address", complete: "Complete",
};

// ── Module-level sub-components (stable refs — no focus-loss on re-render) ──

function CompletedRow({ T, label, value }: { T: Tokens; label: string; value: string }) {
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

function UpcomingRow({ T, label }: { T: Tokens; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:12, marginBottom:6, opacity:0.35 }}>
      <span style={{ fontSize:12, color:T.TEXT_DIM, flexShrink:0 }}>○</span>
      <span style={{ fontSize:11, fontWeight:500, color:T.TEXT_DIM, letterSpacing:"0.05em" }}>{label}</span>
    </div>
  );
}

function AccentBtn({ T, label, onClick }: { T: Tokens; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", background:T.ACCENT, color:"#f9f9ff", border:"none", borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:12, transition:"opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >{label}</button>
  );
}

function GhostBtn({ T, label, onClick }: { T: Tokens; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background:"transparent", border:`1px solid ${T.CARD_BORDER}`, borderRadius:10, color:T.TEXT_DIM, padding:"8px 14px", fontSize:12, cursor:"pointer", marginTop:6, transition:"border-color 0.15s, color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.ACCENT_BORDER; e.currentTarget.style.color = T.ACCENT; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.CARD_BORDER; e.currentTarget.style.color = T.TEXT_DIM; }}
    >{label}</button>
  );
}

function ActiveCard({ T, children }: { T: Tokens; children: React.ReactNode }) {
  return (
    <div style={{ background:T.CARD_BG, border:`1px solid ${T.ACCENT_BORDER}`, borderRadius:16, padding:"14px 14px 16px", boxShadow:`0 0 20px ${T.ACCENT_DIM}`, marginBottom:6 }}>
      {children}
    </div>
  );
}

function CardLabel({ T, text }: { T: Tokens; text: string }) {
  return (
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase" as const, color:T.ACCENT, marginBottom:8 }}>{text}</div>
  );
}

function Counter({ T, count, min, onChange }: { T: Tokens; count: number; min: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, margin:"12px 0" }}>
      <button onClick={() => onChange(Math.max(min, count - 1))}
        style={{ width:32, height:32, borderRadius:"50%", background:T.ACCENT_DIM, border:`1px solid ${T.ACCENT_BORDER}`, color:T.ACCENT, fontSize:18, fontWeight:700, cursor:count<=min?"not-allowed":"pointer", opacity:count<=min?0.4:1 }}>−</button>
      <span style={{ fontSize:20, fontWeight:800, color:T.TEXT, minWidth:24, textAlign:"center" as const }}>{count}</span>
      <button onClick={() => onChange(Math.min(MAX_WINDOWS, count + 1))}
        style={{ width:32, height:32, borderRadius:"50%", background:T.ACCENT_DIM, border:`1px solid ${T.ACCENT_BORDER}`, color:T.ACCENT, fontSize:18, fontWeight:700, cursor:count>=MAX_WINDOWS?"not-allowed":"pointer", opacity:count>=MAX_WINDOWS?0.4:1 }}>+</button>
      <span style={{ fontSize:12, color:T.TEXT_DIM, marginLeft:4 }}>${calcPrice(count, min)} total</span>
    </div>
  );
}

// ── Main CleanSkin component ──────────────────────────────────────────
export function CleanSkin(props: SkinProps) {
  const { step, goToStep, questItems, date, time, windowCount, needsEstimate,
          onDateChange, onTimeChange, onWindowCountChange, onNeedsEstimateChange,
          slotMap, onGoToSummary, onZipChange, onAddressChange, selectedZip,
          mode, onSkinChange } = props;

  const T: Tokens = mode === "light" ? LIGHT : DARK;

  const [showSlots, setShowSlots]         = useState(false);
  const [localEstimate, setLocalEstimate] = useState(true);
  const [currentZip, setCurrentZip]       = useState(selectedZip ?? DEFAULT_ZIP);

  useEffect(() => {
    if (selectedZip && selectedZip !== currentZip) setCurrentZip(selectedZip);
  }, [selectedZip]);
  const [streetLine, setStreetLine]       = useState("");
  const [apt, setApt]                     = useState("");
  const [town, setTown]                   = useState("");

  const fieldInput: React.CSSProperties = {
    width:"100%", background:T.INPUT_BG, border:`1px solid ${T.INPUT_BORDER}`,
    borderRadius:10, color:T.INPUT_TEXT, fontSize:13, fontWeight:500, padding:"9px 12px",
    outline:"none", fontFamily:"inherit", marginBottom:6,
  };

  const slot = date
    ? `${formatDate(date)} at ${formatTime(time)}`
    : `${formatDate(FALLBACK_DATE)} at ${formatTime(FALLBACK_TIME)}`;

  function advance(s: Step) {
    setShowSlots(false);
    goToStep(s);
  }

  function startOver() {
    setCurrentZip(DEFAULT_ZIP);
    setStreetLine("");
    setApt("");
    setTown("");
    onZipChange?.(DEFAULT_ZIP);
    advance("location");
  }

  function pushAddress(sl: string, a: string, t: string, zip: string) {
    if (!sl.trim() || !t.trim()) return;
    const full = [sl.trim(), a.trim()].filter(Boolean).join(" ") + `, ${t.trim()}, CA ${zip}`;
    onAddressChange?.(full);
  }

  const currentIdx = STEPS.indexOf(step);

  function renderCurrentQuestion() {
    switch (step) {
      case "location": return (
        <>
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.ACCENT_DIM}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.TEXT, lineHeight:1.4, marginBottom:5 }}>
              Welcome to Instant Window Cleaning for Simple Windows
            </div>
            <div style={{ fontSize:11, color:T.TEXT_DIM, lineHeight:1.45 }}>
              Book some no-hassle windows. Full house estimates too.
            </div>
          </div>
          <ActiveCard T={T}>
            <CardLabel T={T} text="Service Zip Code" />
            <select
              value={currentZip}
              onChange={e => { setCurrentZip(e.target.value); onZipChange?.(e.target.value); }}
              style={{ ...fieldInput, cursor:"pointer", marginBottom:14 }}
            >
              {Object.entries(SERVICE_AREAS).map(([zip, area]) => (
                <option key={zip} value={zip} style={{ background:"#080810" }}>
                  {zip} — {area.name}
                </option>
              ))}
            </select>

            <div style={{ display:"flex", flexDirection:"column" as const, gap:10, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={localEstimate} onChange={() => setLocalEstimate(true)}
                  style={{ marginTop:2, accentColor:T.ACCENT, flexShrink:0, width:15, height:15 }} />
                <span style={{ fontSize:12, color:T.TEXT, lineHeight:1.4 }}>
                  Include full estimate when on site please.
                </span>
              </label>
              <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={!localEstimate} onChange={() => setLocalEstimate(false)}
                  style={{ marginTop:2, accentColor:T.ACCENT, flexShrink:0, width:15, height:15 }} />
                <span style={{ fontSize:12, color:T.TEXT_DIM, lineHeight:1.4 }}>
                  No estimate needed, just these windows, please.{" "}
                  <span style={{ color:T.TEXT_FAINT, fontSize:11 }}>(avail on request)</span>
                </span>
              </label>
            </div>

            <AccentBtn T={T} label="→ Book My Windows" onClick={() => { onNeedsEstimateChange(localEstimate); advance("timeslot"); }} />
          </ActiveCard>
        </>
      );

      case "timeslot": return (
        <>
          <div style={{ fontSize: 11, color: T.TEXT_DIM, lineHeight: 1.55, marginBottom: 10 }}>
            Here is the nearest available time for a{" "}
            <span style={{ color: T.TEXT, fontWeight: 700 }}>{windowCount}-window</span> cleaning visit.
            {" "}Please Accept or choose another available time.
          </div>
          <ActiveCard T={T}>
          <CardLabel T={T} text="Date & Time" />
          <p style={{ fontSize:13, color:T.TEXT, marginBottom:12 }}>Your slot: <strong style={{ color:T.ACCENT }}>{slot}</strong></p>
          <AccentBtn T={T} label="✓ Keep this time" onClick={() => advance("windows")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn T={T} label={showSlots ? "Hide times ↑" : "See other slots ↓"} onClick={() => setShowSlots(v => !v)} />
          </div>
          {showSlots && (
            <div style={{ maxHeight:140, overflowY:"auto", marginTop:10, border:`1px solid ${T.CARD_BORDER}`, borderRadius:10, padding:"8px 10px", background:T.TRAY_BG }}>
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
        </>
      );

      case "windows": return (
        <ActiveCard T={T}>
          <CardLabel T={T} text="Windows" />
          <p style={{ fontSize:13, color:T.TEXT_DIM, marginBottom:0 }}>How many windows today? <span style={{ color:T.ACCENT }}>from $20/window</span></p>
          <Counter T={T} count={windowCount} min={SERVICE_AREAS[currentZip]?.minWindows ?? MIN_WINDOWS} onChange={onWindowCountChange} />
          <AccentBtn T={T} label={`✓ Confirm ${windowCount} window${windowCount!==1?"s":""} — $${calcPrice(windowCount, SERVICE_AREAS[currentZip]?.minWindows ?? MIN_WINDOWS)}`} onClick={() => advance("contact")} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn T={T} label="← Back" onClick={() => advance("timeslot")} />
          </div>
        </ActiveCard>
      );

      case "contact": return (
        <ActiveCard T={T}>
          <CardLabel T={T} text="Service Address" />
          <div style={{ display:"flex", gap:8, marginBottom:6 }}>
            <input type="text" placeholder="Street address" value={streetLine} autoComplete="address-line1"
              onChange={e => { setStreetLine(e.target.value); pushAddress(e.target.value, apt, town, currentZip); }}
              style={{ ...fieldInput, flex:1, marginBottom:0 }}
            />
            <input type="text" placeholder="Apt" value={apt} autoComplete="address-line2"
              onChange={e => { setApt(e.target.value); pushAddress(streetLine, e.target.value, town, currentZip); }}
              style={{ ...fieldInput, width:64, flexShrink:0, marginBottom:0 }}
            />
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14 }}>
            <input type="text" placeholder="City / Town" value={town} autoComplete="address-level2"
              onChange={e => { setTown(e.target.value); pushAddress(streetLine, apt, e.target.value, currentZip); }}
              style={{ ...fieldInput, flex:1, marginBottom:0 }}
            />
            <div style={{ fontSize:12, fontWeight:600, color:T.TEXT_DIM, flexShrink:0, whiteSpace:"nowrap" as const }}>
              CA&nbsp;&nbsp;{currentZip}
            </div>
          </div>
          <AccentBtn T={T} label="✓ Done — review booking" onClick={() => { pushAddress(streetLine, apt, town, currentZip); advance("complete"); props.onBeforeCheckout?.(); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <GhostBtn T={T} label="Skip" onClick={() => advance("complete")} />
            <GhostBtn T={T} label="← Back" onClick={() => advance("windows")} />
          </div>
        </ActiveCard>
      );

      case "complete": return (
        <ActiveCard T={T}>
          <CardLabel T={T} text="✦ All Set!" />
          <p style={{ fontSize:13, color:T.TEXT, marginBottom:4 }}>Your booking details are ready.</p>
          <p style={{ fontSize:11, color:T.TEXT_DIM, marginBottom:12 }}>Hit <strong>Book Now</strong> on the form, or go straight to checkout below.</p>
          <AccentBtn T={T} label="→ Go straight to checkout" onClick={onGoToSummary} />
          <div style={{ display:"flex", marginTop:8 }}>
            <GhostBtn T={T} label="Start over" onClick={() => advance("location")} />
          </div>
        </ActiveCard>
      );
    }
  }

  return (
    <div style={{ padding:"16px 14px 20px", display:"flex", flexDirection:"column", height:"100%", overflowY:"auto", background:T.PANEL_BG }}>

      {/* Toolbar */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6 }}>
        {onSkinChange && STEPS.indexOf(step) >= 2 && (
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
          >↩ Start over</button>
        )}
      </div>

      {/* Completed steps */}
      {questItems.filter(q => q.confirmed).map(q => (
        <CompletedRow key={q.step} T={T} label={q.label} value={q.value} />
      ))}

      {questItems.some(q => q.confirmed) && step !== "complete" && (
        <div style={{ height:1, background:T.ACCENT_DIM, margin:"8px 0 12px" }} />
      )}

      {/* Active question */}
      {renderCurrentQuestion()}

      {/* Upcoming steps */}
      {STEPS.slice(currentIdx + 1).filter(s => s !== "complete").map(s => (
        <UpcomingRow key={s} T={T} label={STEP_LABELS[s]} />
      ))}

      <AdminQuickAccess />
    </div>
  );
}
