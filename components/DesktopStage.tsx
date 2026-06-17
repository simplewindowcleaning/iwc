"use client";

import { IPhoneSimulator } from "./IPhoneSimulator";

const TEASER_REVIEWS = [
  { name: "Sarah M.", text: "Booked at 9am, they were here by 10.", stars: 5 },
  { name: "Jake T.", text: "No ladder drama, no mess. Incredible.", stars: 5 },
];

function FloatingReviews() {
  return (
    <div
      style={{
        position: "absolute",
        left: "calc(50% - 390px/2 - 24px - 220px)",
        top: "50%",
        transform: "translateY(-50%)",
        width: 200,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", marginBottom: 4 }}>
        WHAT NEIGHBORS SAY
      </div>
      {TEASER_REVIEWS.map((r) => (
        <div
          key={r.name}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "12px 14px",
          }}
        >
          <div style={{ color: "#fbbf24", fontSize: 10, marginBottom: 6 }}>{"★".repeat(r.stars)}</div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 1.55, margin: "0 0 8px" }}>
            &ldquo;{r.text}&rdquo;
          </p>
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 600 }}>{r.name}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  children: React.ReactNode;
}

export function DesktopStage({ children }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#050509",
      }}
    >
      {/* Abstract blurry background blobs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          filter: "blur(80px)",
          opacity: 0.45,
        }}
      >
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #3b0764 0%, transparent 70%)", top: "-10%", left: "5%" }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #1e1b4b 0%, transparent 70%)", bottom: "-5%", right: "10%" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #0f172a 0%, transparent 70%)", top: "30%", right: "25%" }} />
      </div>

      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating reviews */}
      <FloatingReviews />

      {/* iPhone simulator */}
      <IPhoneSimulator>{children}</IPhoneSimulator>
    </div>
  );
}
