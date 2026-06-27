"use client";

import { useState } from "react";
import { HamburgerMenu } from "./HamburgerMenu";

function WindowPaneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="3" stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="1.5"/>
      <line x1="11" y1="1" x2="11" y2="21" stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="1.2"/>
      <line x1="1" y1="11" x2="21" y2="11" stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="1.2"/>
      <path d="M 4 5 Q 6 3.5 8 5" stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="relative z-30 flex items-center justify-between px-4 pt-14 pb-3"
        style={{ height: 72 }}
      >
        {/* Left: hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-[5px] p-2"
          aria-label="Menu"
        >
          <span style={{ width: 18, height: 1.5, background: "rgba(255,255,255,0.55)", display: "block", borderRadius: 2 }} />
          <span style={{ width: 13, height: 1.5, background: "rgba(255,255,255,0.55)", display: "block", borderRadius: 2 }} />
          <span style={{ width: 16, height: 1.5, background: "rgba(255,255,255,0.55)", display: "block", borderRadius: 2 }} />
        </button>

        {/* Center: logo */}
        <div className="flex flex-col items-center gap-0.5 select-none">
          <div className="flex items-center gap-1.5">
            <WindowPaneIcon />
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 17, color: "white", letterSpacing: "-0.3px" }}>
              Claude<span style={{ color: "#a78bfa" }}>.</span>
            </span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "1.8px", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", fontWeight: 500 }}>
Instant Window Cleaning
          </span>
        </div>

        {/* Right: about link */}
        <a href="/about" style={{ fontSize: 17, color: "rgba(255,255,255,0.28)", textDecoration: "none", padding: "8px" }} aria-label="About">
          ✕
        </a>
      </header>

      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
