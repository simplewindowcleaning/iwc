"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  needsEstimate: boolean;
  estimateDeadline: string;
  onChange: (v: boolean) => void;
  onDeadlineChange: (d: string) => void;
}

function deadlineDates(): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`custom-check ${checked ? "checked" : ""}`}>
      {checked && <Check size={12} color="#08080e" strokeWidth={3} />}
    </div>
  );
}

export function EstimateToggle({ needsEstimate, estimateDeadline, onChange, onDeadlineChange }: Props) {
  return (
    <motion.div
      className="glass-card p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
    >
      {/* Option A: No estimate */}
      <button
        className="flex items-start gap-3 text-left w-full"
        onClick={() => onChange(false)}
      >
        <Checkbox checked={!needsEstimate} />
        <div>
          <p style={{ color: "white", fontSize: 13, fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
            No full house estimate needed, just these window(s) please!
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>
            Still available upon request
          </p>
        </div>
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Option B: Needs estimate */}
      <button
        className="flex items-start gap-3 text-left w-full"
        onClick={() => onChange(true)}
      >
        <Checkbox checked={needsEstimate} />
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <p style={{ color: "white", fontSize: 13, fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
              Estimate needed, but I need it done by
            </p>
            {needsEstimate && (
              <select
                className="field-select"
                style={{ width: "auto", fontSize: 12, padding: "4px 28px 4px 10px" }}
                value={estimateDeadline}
                onChange={(e) => { e.stopPropagation(); onDeadlineChange(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select date…</option>
                {deadlineDates().map((d) => (
                  <option key={d} value={d}>{fmtDate(d)}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
