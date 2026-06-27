"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const EMPLOYEES = [
  { name: "Flynn Vin", pin: "0000", role: "admin"  as const },
  { name: "CJ Vin",   pin: "9999", role: "worker" as const },
];

const NUMPAD = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

export default function LoginPage() {
  const router = useRouter();
  const [ready, setReady]       = useState(false);
  const [hasApi, setHasApi]     = useState(false);
  const [selected, setSelected] = useState<typeof EMPLOYEES[0] | null>(null);
  const [pin, setPin]           = useState("");
  const [shake, setShake]       = useState(false);
  const [errFlash, setErrFlash] = useState(false);
  const [setupVal, setSetupVal] = useState("");
  const [setupErr, setSetupErr] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.removeItem("worker_authed");
    const stored = localStorage.getItem("worker_password");
    if (stored) setHasApi(true);
    setReady(true);
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupVal || setupBusy) return;
    setSetupBusy(true);
    setSetupErr(false);
    const res = await fetch("/api/admin/bookings", { headers: { "x-admin-pw": setupVal } });
    if (res.ok) {
      localStorage.setItem("worker_password", setupVal);
      setHasApi(true);
    } else {
      setSetupErr(true);
    }
    setSetupBusy(false);
  };

  const pressKey = (key: string) => {
    if (!selected) return;
    if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) attempt(next);
  };

  const attempt = (entered: string) => {
    if (!selected) return;
    if (entered === selected.pin) {
      localStorage.setItem("worker_authed", "true");
      localStorage.setItem("worker_employee", selected.name);
      if (selected.role === "admin") sessionStorage.setItem("admin_session", "true");
      router.push(selected.role === "admin" ? "/admin" : "/admin/job-closeout");
    } else {
      setErrFlash(true);
      setShake(true);
      setTimeout(() => { setShake(false); setErrFlash(false); setPin(""); }, 650);
    }
  };

  if (!ready) return null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif" }}>
      {/* Beach video */}
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        src="/bgvid.mp4"
      />
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1 }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>

        {!hasApi ? (
          /* ── One-time setup ── */
          <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <div style={eyebrow}>Simple Window Cleaning</div>
            <div style={title}>Admin Setup</div>
            <div style={sub}>Enter the API access code once to configure this device.</div>
            <form onSubmit={handleSetup} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password" value={setupVal}
                onChange={e => { setSetupVal(e.target.value); setSetupErr(false); }}
                placeholder="Access code" autoFocus
                style={{
                  ...glassInput,
                  borderColor: setupErr ? "#f87171" : "rgba(255,255,255,0.12)",
                }}
              />
              {setupErr && <div style={{ color: "#f87171", fontSize: 13 }}>Incorrect — try again.</div>}
              <button type="submit" disabled={!setupVal || setupBusy} style={glassBtn(!setupVal || setupBusy)}>
                {setupBusy ? "Verifying…" : "Save & Continue"}
              </button>
            </form>
          </div>
        ) : (
          /* ── Employee login ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 520 }}>
            {/* Icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.jpg" alt="Simple Window Cleaning"
              style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)", marginBottom: 28 }} />

            <div style={eyebrow}>Simple Window Cleaning</div>
            <div style={{ ...title, marginBottom: 36 }}>Who's working today?</div>

            {/* Employee cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
              {EMPLOYEES.map(emp => {
                const active = selected?.name === emp.name;
                return (
                  <button key={emp.name}
                    onClick={() => { setSelected(emp); setPin(""); setErrFlash(false); }}
                    style={{
                      background: active ? "rgba(18,120,160,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${active ? "rgba(58,170,196,0.6)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 20, padding: "20px 32px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                      transform: active ? "scale(1.03)" : "scale(1)",
                      transition: "all 0.2s", backdropFilter: "blur(12px)",
                    }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: active
                        ? "linear-gradient(135deg, #1278A0, #0A3D5C)"
                        : "rgba(255,255,255,0.07)",
                      border: `1.5px solid ${active ? "#3AAAC4" : "rgba(255,255,255,0.12)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 26, fontWeight: 800,
                      color: active ? "white" : "rgba(255,255,255,0.5)",
                    }}>{emp.name[0]}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? "white" : "rgba(255,255,255,0.4)" }}>
                      {emp.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PIN dots */}
            <div style={{
              display: "flex", gap: 18, marginBottom: 28,
              transform: shake ? "translateX(-8px)" : "translateX(0)",
              transition: shake ? "none" : "transform 0.15s",
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: i < pin.length
                    ? (errFlash ? "#f87171" : "#3AAAC4")
                    : "rgba(255,255,255,0.15)",
                  transition: "background 0.15s",
                }} />
              ))}
            </div>

            {/* Numpad */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 76px)",
              gap: 12, opacity: selected ? 1 : 0.35,
              pointerEvents: selected ? "auto" : "none",
              marginBottom: 40,
            }}>
              {NUMPAD.flat().map((key, i) => key === "" ? (
                <div key={i} />
              ) : (
                <button key={i} onClick={() => pressKey(key)}
                  style={{
                    height: 56, borderRadius: 14,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: key === "⌫" ? 20 : 26, fontWeight: 600,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseDown={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                  onMouseUp={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >{key}</button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>
              Simple Window Cleaning · Santa Cruz, CA
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.3em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8,
};
const title: React.CSSProperties = {
  fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-0.02em",
};
const sub: React.CSSProperties = {
  fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 8,
};
const glassInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
  border: "1.5px solid rgba(255,255,255,0.12)",
  borderRadius: 12, padding: "17px 20px",
  fontSize: 18, letterSpacing: "0.2em", color: "white", outline: "none",
};
const glassBtn = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  background: disabled ? "rgba(18,120,160,0.25)" : "rgba(18,120,160,0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(58,170,196,0.3)",
  borderRadius: 14, padding: "18px",
  fontSize: 16, fontWeight: 700, color: "white",
  cursor: disabled ? "default" : "pointer", transition: "background 0.2s",
});
