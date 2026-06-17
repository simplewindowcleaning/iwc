"use client";

const ORBS = [
  { w: 620, h: 620, left: "8%",  top: "4%",  color: "#3b0764", delay: "0s",   dur: "7s"  },
  { w: 520, h: 520, left: "58%", top: "18%", color: "#1e1b4b", delay: "-3.5s", dur: "9s"  },
  { w: 480, h: 480, left: "28%", top: "52%", color: "#4c1d95", delay: "-5s",   dur: "11s" },
];

const SPARKLES = [
  { top: "9%",  left: "18%", s: 3, d: "0s",    c: "#a78bfa" },
  { top: "6%",  left: "72%", s: 2, d: "0.6s",  c: "#c4b5fd" },
  { top: "14%", left: "43%", s: 3, d: "1.1s",  c: "#818cf8" },
  { top: "22%", left: "85%", s: 2, d: "0.3s",  c: "#fff"    },
  { top: "31%", left: "9%",  s: 3, d: "1.5s",  c: "#a78bfa" },
  { top: "28%", left: "61%", s: 2, d: "0.9s",  c: "#c4b5fd" },
  { top: "40%", left: "29%", s: 4, d: "0.2s",  c: "#a78bfa" },
  { top: "38%", left: "79%", s: 2, d: "1.8s",  c: "#818cf8" },
  { top: "50%", left: "52%", s: 3, d: "0.7s",  c: "#fff"    },
  { top: "55%", left: "14%", s: 2, d: "1.3s",  c: "#c4b5fd" },
  { top: "48%", left: "91%", s: 3, d: "0.4s",  c: "#a78bfa" },
  { top: "63%", left: "37%", s: 2, d: "2.0s",  c: "#818cf8" },
  { top: "67%", left: "68%", s: 4, d: "0.8s",  c: "#a78bfa" },
  { top: "74%", left: "23%", s: 2, d: "1.6s",  c: "#fff"    },
  { top: "72%", left: "82%", s: 3, d: "0.5s",  c: "#c4b5fd" },
  { top: "81%", left: "47%", s: 2, d: "1.1s",  c: "#a78bfa" },
  { top: "85%", left: "7%",  s: 3, d: "1.9s",  c: "#818cf8" },
  { top: "88%", left: "88%", s: 2, d: "0.3s",  c: "#c4b5fd" },
  { top: "93%", left: "33%", s: 3, d: "2.2s",  c: "#a78bfa" },
  { top: "96%", left: "65%", s: 2, d: "0.7s",  c: "#fff"    },
];

export function SparkleBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0, background: "#080810" }}
      aria-hidden
    >
      {/* Orbs */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: o.w,
            height: o.h,
            left: o.left,
            top: o.top,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: "blur(80px)",
            opacity: 0.7,
            animation: `orbFloat ${o.dur} ${o.delay} ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Sparkle dots */}
      {SPARKLES.map((sp, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: sp.top,
            left: sp.left,
            width: sp.s,
            height: sp.s,
            background: sp.c,
            animation: `sparklePulse ${2 + (i % 4) * 0.4}s ${sp.d} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
