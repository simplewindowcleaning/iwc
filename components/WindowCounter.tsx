"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  count: number;
  onChange: (n: number) => void;
}

export function WindowCounter({ count, onChange }: Props) {
  const price = count * 22;

  return (
    <div className="flex items-center justify-between mb-5">
      {/* Left: label + price */}
      <div>
        <span className="field-label">Windows</span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span style={{ fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1 }}>
            ${price}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            total · $22/ea
          </span>
        </div>
      </div>

      {/* Right: counter */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => count > 1 && onChange(count - 1)}
          disabled={count <= 1}
          className="flex items-center justify-center rounded-full transition-opacity"
          style={{
            width: 32,
            height: 32,
            background: "rgba(167,139,250,0.15)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: count <= 1 ? "rgba(255,255,255,0.2)" : "#a78bfa",
            fontSize: 18,
            fontWeight: 700,
            cursor: count <= 1 ? "not-allowed" : "pointer",
          }}
          aria-label="Fewer windows"
        >
          −
        </button>

        <div style={{ minWidth: 24, textAlign: "center" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ fontSize: 18, fontWeight: 700, color: "white", display: "block" }}
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </div>

        <button
          onClick={() => count < 20 && onChange(count + 1)}
          disabled={count >= 20}
          className="flex items-center justify-center rounded-full transition-opacity"
          style={{
            width: 32,
            height: 32,
            background: "rgba(167,139,250,0.15)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: count >= 20 ? "rgba(255,255,255,0.2)" : "#a78bfa",
            fontSize: 18,
            fontWeight: 700,
            cursor: count >= 20 ? "not-allowed" : "pointer",
          }}
          aria-label="More windows"
        >
          +
        </button>
      </div>
    </div>
  );
}
