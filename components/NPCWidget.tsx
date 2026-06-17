"use client";

/**
 * NPCWidget — Orchestrator for the right-side booking guide panel.
 *
 * Architecture:
 *   NPCWidget (this file) — owns step state, quest log, skin toggle, slot fetch
 *     └─ GameSkin  — FF-style canvas + typewriter dialogue (components/npc/GameSkin.tsx)
 *     └─ CleanSkin — modern glass-card Q&A   (components/npc/CleanSkin.tsx)
 *
 * Adding a new "season skin":
 *   1. Create components/npc/YourSkin.tsx implementing SkinProps.
 *   2. Add it to the `Skin` type and the renderSkin() switch below.
 *   3. Add a toggle option to the header row.
 */

import { useEffect, useState } from "react";
import { getAvailableSlots, formatDate, formatTime, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { GameSkin } from "./npc/GameSkin";
import { CleanSkin } from "./npc/CleanSkin";
import type { Step, Skin, SkinProps, QuestItem } from "./npc/types";
import { STEP_ORDER } from "./npc/types";

// ── External props (what page.tsx passes in) ──────────────────────
interface Props {
  date: string; time: string; windowCount: number;
  needsEstimate: boolean; estimateDeadline: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onWindowCountChange: (n: number) => void;
  onNeedsEstimateChange: (v: boolean) => void;
  onEstimateDeadlineChange: (d: string) => void;
  paused: boolean;
  onResume: () => void;
  onGoToSummary: () => void;
  // Map panel reacts to step changes
  onStepChange?: (step: Step) => void;
}

export function NPCWidget(props: Props) {
  const { date, time, windowCount, needsEstimate, estimateDeadline,
          onDateChange, onTimeChange, onWindowCountChange,
          onNeedsEstimateChange, onEstimateDeadlineChange,
          paused, onResume, onGoToSummary, onStepChange } = props;

  // ── Panel state ───────────────────────────────────────────────
  const [skin, setSkin] = useState<Skin>("game");
  const [step, setStep] = useState<Step>("location");
  const [slotMap, setSlotMap] = useState<Record<string, string[]>>({});

  useEffect(() => { getAvailableSlots().then(setSlotMap); }, []);

  // Wrapped so MapPanel can react to step changes
  function goToStep(s: Step) {
    setStep(s);
    onStepChange?.(s);
  }

  // ── Step helpers ──────────────────────────────────────────────
  function isConfirmed(s: Step) {
    return STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(s);
  }

  const questItems: QuestItem[] = [
    { step:"location", label:"Location",  confirmed:isConfirmed("location"), value:"Santa Cruz, CA 95060" },
    { step:"timeslot", label:"Date & Time", confirmed:isConfirmed("timeslot"), value: date ? `${formatDate(date)} · ${formatTime(time)}` : `${formatDate(FALLBACK_DATE)} · ${formatTime(FALLBACK_TIME)}` },
    { step:"windows",  label:"Windows",   confirmed:isConfirmed("windows"),  value:`${windowCount}× · $${windowCount * 22}` },
    { step:"estimate", label:"Estimate",  confirmed:isConfirmed("estimate"),  value:needsEstimate ? "Full house" : "Windows only" },
    { step:"contact",  label:"Contact",   confirmed:isConfirmed("contact"),   value:"On file" },
  ];

  // ── Shared skin props ─────────────────────────────────────────
  const skinProps: SkinProps = {
    step, goToStep, questItems,
    date, time, windowCount, needsEstimate, estimateDeadline, slotMap,
    onDateChange, onTimeChange, onWindowCountChange,
    onNeedsEstimateChange, onEstimateDeadlineChange,
    paused, onResume, onGoToSummary,
  };

  // ── Skin backgrounds ──────────────────────────────────────────
  const bgColor = skin === "game" ? "#0a0614" : "#080810";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:bgColor }}>

      {/* ── Panel header + toggle ─────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px 9px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
        <div>
          {skin === "game" ? (
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:9, color:"rgba(126,200,227,0.5)", letterSpacing:2, textTransform:"uppercase" }}>
              ✦ Quest Mode
            </span>
          ) : (
            <span style={{ fontSize:10, fontWeight:600, color:"rgba(167,139,250,0.55)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
              Booking Guide
            </span>
          )}
        </div>

        {/* Toggle: OFF (from game) ↔ GAME (from clean) */}
        <button
          onClick={() => setSkin(s => s === "game" ? "clean" : "game")}
          title={skin === "game" ? "Switch to clean view" : "Switch to game mode"}
          style={{
            fontFamily: skin === "game" ? "'Cinzel',serif" : "inherit",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: skin === "game" ? "0.12em" : "0.08em",
            border: `1px solid ${skin === "game" ? "rgba(204,51,51,0.6)" : "rgba(167,139,250,0.35)"}`,
            background: "transparent",
            color: skin === "game" ? "#cc3333" : "rgba(167,139,250,0.8)",
            padding: "4px 10px",
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget;
            b.style.background = skin === "game" ? "#cc3333" : "rgba(167,139,250,0.15)";
            b.style.color = skin === "game" ? "#fff" : "#a78bfa";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget;
            b.style.background = "transparent";
            b.style.color = skin === "game" ? "#cc3333" : "rgba(167,139,250,0.8)";
          }}
        >
          {skin === "game" ? "OFF" : "▶ GAME"}
        </button>
      </div>

      {/* ── Active skin (remounts on switch, which is intentional) ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {skin === "game"
          ? <GameSkin  key="game"  {...skinProps} />
          : <CleanSkin key="clean" {...skinProps} />
        }
      </div>
    </div>
  );
}
