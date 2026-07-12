"use client";

/**
 * NPCWidget — Orchestrator for the right-side booking guide panel.
 *
 * Skins:
 *   "game"  — FF pixel-art canvas + typewriter dialogue (GameSkin)
 *   "clean" — Step-by-step Q&A guide (CleanSkin)
 *   "power" — All-fields power console form (PowerConsoleSkin)
 *
 * ThemeMode ("dark" | "light") is owned here and passed to all skins.
 */

import { useEffect, useState } from "react";
import { formatDate, formatTime, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { calcPrice } from "@/lib/constants";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { CleanSkin } from "./npc/CleanSkin";
import { PowerConsoleSkin } from "./npc/PowerConsoleSkin";
import type { Step, Skin, SkinProps, QuestItem, ThemeMode } from "./npc/types";
import { STEP_ORDER } from "./npc/types";

// ── External props (what page.tsx passes in) ──────────────────────────
interface Props {
  // Booking state
  date: string; time: string; windowCount: number;
  needsEstimate: boolean; estimateDeadline: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onWindowCountChange: (n: number) => void;
  onNeedsEstimateChange: (v: boolean) => void;
  onEstimateDeadlineChange: (d: string) => void;

  // Contact fields (used by PowerConsoleSkin)
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

  selectedZip?: string;
  slotMap: Record<string, string[]>;
  paused: boolean;
  onResume: () => void;
  onGoToSummary: () => void;
  onStepChange?: (step: Step) => void;
  onZipChange?: (zip: string) => void;
  onBeforeCheckout?: () => void;
  goTrigger?: number;
  // Lets the parent start this panel on a step other than "location" — used
  // on desktop where the agent already handles location/timeslot/windows and
  // this panel only mounts for the final address step. Read once at mount.
  initialStep?: Step;
}

export function NPCWidget(props: Props) {
  const {
    date, time, windowCount, needsEstimate, estimateDeadline,
    onDateChange, onTimeChange, onWindowCountChange,
    onNeedsEstimateChange, onEstimateDeadlineChange,
    address, firstName, lastName, phone, email, notes,
    onAddressChange, onFirstNameChange, onLastNameChange,
    onPhoneChange, onEmailChange, onNotesChange,
    selectedZip, slotMap, paused, onResume, onGoToSummary, onStepChange, onZipChange, onBeforeCheckout,
  } = props;

  // ── Panel state ───────────────────────────────────────────────────
  const [skin, setSkin] = useState<Skin>("clean");
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [step, setStep] = useState<Step>(props.initialStep ?? "location");

  useEffect(() => {
    if (props.goTrigger && step === "location") goToStep("timeslot");
  }, [props.goTrigger]);

  function goToStep(s: Step) {
    setStep(s);
    onStepChange?.(s);
  }

  function isConfirmed(s: Step) {
    return STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(s);
  }

  const questItems: QuestItem[] = [
    { step:"location", label:"Location",   confirmed:isConfirmed("location"), value:"Santa Cruz, CA 95060" },
    { step:"timeslot", label:"Date & Time", confirmed:isConfirmed("timeslot"), value: date ? `${formatDate(date)} · ${formatTime(time)}` : `${formatDate(FALLBACK_DATE)} · ${formatTime(FALLBACK_TIME)}` },
    { step:"windows",  label:"Windows",    confirmed:isConfirmed("windows"),  value:`${windowCount}× · $${calcPrice(windowCount, SERVICE_AREAS[selectedZip ?? "95060"]?.minWindows ?? 1)}` },
    { step:"contact",  label:"Address",    confirmed:isConfirmed("contact"),  value:"On file" },
  ];

  const skinProps: SkinProps = {
    step, goToStep, questItems,
    date, time, windowCount, needsEstimate, estimateDeadline, slotMap,
    onDateChange, onTimeChange, onWindowCountChange,
    onNeedsEstimateChange, onEstimateDeadlineChange,
    paused, onResume, onGoToSummary, onZipChange, onBeforeCheckout,
    selectedZip,
    address, onAddressChange,
    firstName, phone, email,
    onFirstNameChange, onPhoneChange, onEmailChange,
    mode,
    onSkinChange: setSkin,
  };

  // ── Header styling derived from mode ─────────────────────────────
  const isDark  = mode === "dark";
  const panelBg = isDark ? "#080810" : "#f4f4fa";
  const headerBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)";
  const labelColor   = isDark ? "rgba(126,200,227,0.5)" : "rgba(109,40,217,0.5)";
  const labelText    = isDark ? "rgba(167,139,250,0.55)" : "rgba(109,40,217,0.55)";
  const headerText   = isDark ? "rgba(255,255,255,0.7)" : "rgba(17,24,39,0.7)";

  // Light/dark toggle
  const modeIcon = isDark ? "☀" : "🌙";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:panelBg }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 14px 9px", borderBottom:`1px solid ${headerBorder}`, flexShrink:0, gap:8,
      }}>
        {/* Label */}
        <div style={{ minWidth:0 }}>
          {skin === "power" ? (
            <span style={{ fontSize:10, fontWeight:600, color:labelText, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              Power Console
            </span>
          ) : (
            <span style={{ fontSize:10, fontWeight:600, color:labelText, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              Instant Booking
            </span>
          )}
        </div>

        {/* Right side: light/dark toggle + skin toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {/* ☀/🌙 mode toggle */}
          <button
            onClick={() => setMode(m => m === "dark" ? "light" : "dark")}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background: "transparent",
              border: `1px solid ${headerBorder}`,
              borderRadius: 4, padding: "3px 7px",
              fontSize: 12, lineHeight: 1, cursor: "pointer",
              color: headerText, transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >{modeIcon}</button>

        </div>
      </div>

      {/* ── Active skin ─────────────────────────────────────────── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {skin === "power" ? (
          <PowerConsoleSkin
            key="power"
            date={date} time={time} windowCount={windowCount}
            needsEstimate={needsEstimate} estimateDeadline={estimateDeadline}
            slotMap={slotMap}
            selectedZip={selectedZip}
            zipConfirmed={step !== "location"}
            onDateChange={onDateChange} onTimeChange={onTimeChange}
            onWindowCountChange={onWindowCountChange}
            onNeedsEstimateChange={onNeedsEstimateChange}
            onEstimateDeadlineChange={onEstimateDeadlineChange}
            address={address} firstName={firstName} lastName={lastName}
            phone={phone} email={email} notes={notes}
            onAddressChange={onAddressChange} onFirstNameChange={onFirstNameChange}
            onLastNameChange={onLastNameChange} onPhoneChange={onPhoneChange}
            onEmailChange={onEmailChange} onNotesChange={onNotesChange}
            onZipChange={onZipChange}
            onGoToSummary={onGoToSummary}
            mode={mode}
            onSkinChange={setSkin}
          />
        ) : (
          <CleanSkin key="clean" {...skinProps} />
        )}
      </div>
    </div>
  );
}
