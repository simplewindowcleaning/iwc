"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getAvailableSlots, formatTime, formatDate, getNext14Days } from "@/lib/availability";

interface Props {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
}

export function SlotPicker({ selectedDate, selectedTime, onDateChange, onTimeChange }: Props) {
  const [slotMap, setSlotMap] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableSlots().then((map) => {
      setSlotMap(map);
      // Only auto-select if no date already chosen (e.g. from NPC or defaults)
      if (!selectedDate) {
        const dates = getNext14Days();
        for (const d of dates) {
          if (map[d]?.length > 0) {
            onDateChange(d);
            onTimeChange(map[d][0]);
            break;
          }
        }
      }
      setLoading(false);
    });
  }, []);

  const dates = getNext14Days();
  const timesForSelected = selectedDate ? (slotMap[selectedDate] ?? []) : [];

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Label */}
      <span className="field-label" style={{ color: "rgba(167,139,250,0.55)" }}>
        Nearest Instant Booking
      </span>

      {/* Main slot display */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>
          {loading
            ? "Finding next slot…"
            : selectedDate
            ? `${formatDate(selectedDate)} at`
            : "No slots available"}
        </span>

        {selectedDate && timesForSelected.length > 0 && (
          <div className="relative">
            <button
              className="pill"
              onClick={() => setShowTimeDropdown((v) => !v)}
            >
              {selectedTime ? formatTime(selectedTime) : "Pick time"}
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showTimeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 top-8 z-20 rounded-xl overflow-hidden"
                  style={{ background: "#1a1a2e", border: "1px solid rgba(167,139,250,0.2)", minWidth: 130 }}
                >
                  {timesForSelected.map((t) => (
                    <button
                      key={t}
                      className="block w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors"
                      style={{ color: t === selectedTime ? "#a78bfa" : "white", fontSize: 13, fontWeight: 500 }}
                      onClick={() => { onTimeChange(t); setShowTimeDropdown(false); }}
                    >
                      {formatTime(t)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* See more button */}
      <button
        className="ghost-btn flex items-center gap-1.5"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Hide times / days" : "See more times / days"}
        <ChevronDown
          size={12}
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {/* Expanded date picker */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-1.5">
              {dates.map((d) => {
                const slots = slotMap[d] ?? [];
                if (slots.length === 0) return null;
                return (
                  <div key={d} className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: d === selectedDate ? "#a78bfa" : "rgba(255,255,255,0.55)",
                        minWidth: 110,
                      }}
                    >
                      {formatDate(d)}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {slots.map((t) => (
                        <button
                          key={t}
                          className="pill"
                          style={{
                            background: d === selectedDate && t === selectedTime
                              ? "#a78bfa"
                              : "rgba(167,139,250,0.12)",
                            color: d === selectedDate && t === selectedTime
                              ? "#08080e"
                              : "#a78bfa",
                            fontSize: 11,
                            padding: "3px 10px",
                          }}
                          onClick={() => { onDateChange(d); onTimeChange(t); setExpanded(false); }}
                        >
                          {formatTime(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
