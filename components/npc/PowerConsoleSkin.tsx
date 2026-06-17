"use client";

import { useState } from "react";
import { formatDate, formatTime, getNextDays } from "@/lib/availability";
import type { ThemeMode, Skin } from "./types";

// ── Token sets — mirrors CleanSkin ────────────────────────────────────
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
  ROW_BG:        "rgba(0,0,0,0.25)",
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
  ROW_BG:        "rgba(0,0,0,0.04)",
};

type Tokens = typeof DARK;

export interface PowerConsoleSkinProps {
  // Booking state (shared with NPC)
  date: string;
  time: string;
  windowCount: number;
  needsEstimate: boolean;
  estimateDeadline: string;
  slotMap: Record<string, string[]>;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onWindowCountChange: (n: number) => void;
  onNeedsEstimateChange: (v: boolean) => void;
  onEstimateDeadlineChange: (d: string) => void;

  // Contact fields (owned by page.tsx)
  address: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  onAddressChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;

  onGoToSummary: () => void;
  mode: ThemeMode;
  onSkinChange: (skin: Skin) => void;
}

export function PowerConsoleSkin({
  date, time, windowCount, needsEstimate, estimateDeadline, slotMap,
  onDateChange, onTimeChange, onWindowCountChange, onNeedsEstimateChange, onEstimateDeadlineChange,
  address, firstName, lastName, phone, email, notes,
  onAddressChange, onFirstNameChange, onLastNameChange, onPhoneChange, onEmailChange, onNotesChange,
  onGoToSummary, mode, onSkinChange,
}: PowerConsoleSkinProps) {
  const T: Tokens = mode === "light" ? LIGHT : DARK;
  const [showSlots, setShowSlots] = useState(false);

  const canBook = Boolean(date && time && address.trim());
  const total = windowCount * 22;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: T.INPUT_BG, border: `1px solid ${T.INPUT_BORDER}`,
    borderRadius: 8, color: T.INPUT_TEXT, fontSize: 12, fontWeight: 500,
    padding: "7px 10px", outline: "none", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
    color: T.TEXT_FAINT, display: "block", marginBottom: 4,
  };

  const sectionStyle: React.CSSProperties = {
    background: T.CARD_BG, border: `1px solid ${T.CARD_BORDER}`,
    borderRadius: 12, padding: "10px 12px", marginBottom: 8,
  };

  const dates = getNextDays();

  return (
    <div style={{
      padding: "14px 14px 20px", display: "flex", flexDirection: "column",
      height: "100%", overflowY: "auto", background: T.PANEL_BG,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.TEXT_FAINT, marginBottom: 2 }}>
            Power Console
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.TEXT }}>All fields — quick book</div>
        </div>
        <button
          onClick={() => onSkinChange("clean")}
          style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", background: "transparent", border: `1px solid ${T.CARD_BORDER}`, borderRadius: 6, color: T.TEXT_DIM, padding: "4px 8px", cursor: "pointer", textTransform: "uppercase" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.ACCENT_BORDER; e.currentTarget.style.color = T.ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.CARD_BORDER; e.currentTarget.style.color = T.TEXT_DIM; }}
        >← Guide</button>
      </div>

      {/* Date & Time */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, color: T.ACCENT }}>Date &amp; Time</div>
        <div style={{ fontSize: 13, color: T.TEXT, fontWeight: 500, marginBottom: 8 }}>
          {date ? `${formatDate(date)} at ${formatTime(time)}` : "No slot selected"}
        </div>
        <button
          onClick={() => setShowSlots(v => !v)}
          style={{ fontSize: 11, color: T.ACCENT, background: T.ACCENT_DIM, border: `1px solid ${T.ACCENT_BORDER}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
        >{showSlots ? "Hide slots ↑" : "Change slot ↓"}</button>
        {showSlots && (
          <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8, background: T.ROW_BG, borderRadius: 8, padding: "6px 8px" }}>
            {dates.map(d => {
              const slots = slotMap[d] ?? [];
              if (!slots.length) return null;
              return (
                <div key={d} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.TEXT_DIM, marginBottom: 3, letterSpacing: "0.08em" }}>{formatDate(d)}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {slots.map(t => (
                      <button key={t}
                        onClick={() => { onDateChange(d); onTimeChange(t); setShowSlots(false); }}
                        style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${d === date && t === time ? T.ACCENT : T.CARD_BORDER}`, background: d === date && t === time ? T.ACCENT_DIM : "transparent", color: d === date && t === time ? T.ACCENT : T.TEXT_DIM, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
                      >{formatTime(t)}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Windows + Estimate */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ ...labelStyle, color: T.ACCENT, marginBottom: 0 }}>Windows</div>
          <span style={{ fontSize: 11, color: T.ACCENT, fontWeight: 600 }}>${total}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => onWindowCountChange(Math.max(1, windowCount - 1))}
            style={{ width: 28, height: 28, borderRadius: "50%", background: T.ACCENT_DIM, border: `1px solid ${T.ACCENT_BORDER}`, color: T.ACCENT, fontSize: 16, fontWeight: 700, cursor: windowCount <= 1 ? "not-allowed" : "pointer", opacity: windowCount <= 1 ? 0.4 : 1 }}>−</button>
          <span style={{ fontSize: 18, fontWeight: 800, color: T.TEXT, minWidth: 24, textAlign: "center" }}>{windowCount}</span>
          <button onClick={() => onWindowCountChange(Math.min(20, windowCount + 1))}
            style={{ width: 28, height: 28, borderRadius: "50%", background: T.ACCENT_DIM, border: `1px solid ${T.ACCENT_BORDER}`, color: T.ACCENT, fontSize: 16, fontWeight: 700, cursor: windowCount >= 20 ? "not-allowed" : "pointer", opacity: windowCount >= 20 ? 0.4 : 1 }}>+</button>
          <span style={{ fontSize: 11, color: T.TEXT_DIM }}>$22 each</span>
        </div>
        <div style={{ ...labelStyle, color: T.ACCENT }}>Estimate</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["No — windows only", "Yes — full estimate"].map((label, i) => {
            const selected = i === 0 ? !needsEstimate : needsEstimate;
            return (
              <button key={label} onClick={() => onNeedsEstimateChange(i === 1)}
                style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${selected ? T.ACCENT : T.CARD_BORDER}`, background: selected ? T.ACCENT_DIM : "transparent", color: selected ? T.ACCENT : T.TEXT_DIM, fontSize: 10, fontWeight: selected ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Address */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, color: T.ACCENT }}>Service Address *</label>
        <input type="text" value={address} onChange={e => onAddressChange(e.target.value)}
          placeholder="123 Main St, Santa Cruz, CA 95060"
          style={inputStyle} autoComplete="street-address" />
      </div>

      {/* Contact */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, color: T.ACCENT, marginBottom: 8 }}>Contact <span style={{ color: T.TEXT_FAINT, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input type="text" value={firstName} onChange={e => onFirstNameChange(e.target.value)}
            placeholder="First" style={{ ...inputStyle, flex: 1 }} autoComplete="given-name" />
          <input type="text" value={lastName} onChange={e => onLastNameChange(e.target.value)}
            placeholder="Last" style={{ ...inputStyle, flex: 1 }} autoComplete="family-name" />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input type="tel" value={phone} onChange={e => onPhoneChange(e.target.value)}
            placeholder="Phone" style={{ ...inputStyle, flex: 1 }} autoComplete="tel" />
          <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
            placeholder="Email" style={{ ...inputStyle, flex: 1 }} autoComplete="email" />
        </div>
        <textarea value={notes} onChange={e => onNotesChange(e.target.value)}
          placeholder="Gate code, instructions…" rows={2}
          style={{ ...inputStyle, resize: "none", display: "block" }} />
      </div>

      {/* Book */}
      <button
        onClick={onGoToSummary}
        disabled={!canBook}
        style={{
          width: "100%", background: T.ACCENT, color: "#08080e", border: "none",
          borderRadius: 12, padding: "14px 16px", fontSize: 14, fontWeight: 800,
          cursor: canBook ? "pointer" : "not-allowed", opacity: canBook ? 1 : 0.4,
          transition: "opacity 0.15s", marginTop: 4,
        }}
        onMouseEnter={e => { if (canBook) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { if (canBook) e.currentTarget.style.opacity = "1"; }}
      >Review &amp; Book — ${total}</button>
      {!canBook && (
        <p style={{ fontSize: 10, color: T.TEXT_DIM, textAlign: "center", marginTop: 6 }}>
          Select a slot and enter your address to continue
        </p>
      )}
    </div>
  );
}
