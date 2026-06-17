"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

export function IPhoneSimulator({ children }: Props) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={constraintsRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        whileDrag={{ scale: 0.995 }}
        className="pointer-events-auto cursor-grab active:cursor-grabbing select-none"
        style={{
          width: 390,
          height: 844,
          borderRadius: "var(--radius-phone, 46px)",
          boxShadow: "var(--shadow-phone, 0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04))",
          background: "#0c0c18",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* iPhone frame bezel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            border: "2px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
            zIndex: 30,
          }}
        />

        {/* Dynamic Island */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 35,
            background: "#000",
            borderRadius: 20,
            zIndex: 25,
          }}
        />

        {/* Side buttons (visual only) */}
        <div style={{ position: "absolute", left: -2, top: 140, width: 3, height: 40, background: "rgba(255,255,255,0.12)", borderRadius: "0 2px 2px 0" }} />
        <div style={{ position: "absolute", left: -2, top: 196, width: 3, height: 64, background: "rgba(255,255,255,0.12)", borderRadius: "0 2px 2px 0" }} />
        <div style={{ position: "absolute", left: -2, top: 272, width: 3, height: 64, background: "rgba(255,255,255,0.12)", borderRadius: "0 2px 2px 0" }} />
        <div style={{ position: "absolute", right: -2, top: 190, width: 3, height: 86, background: "rgba(255,255,255,0.12)", borderRadius: "2px 0 0 2px" }} />

        {/* Screen content */}
        <div
          className="phone-content"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
