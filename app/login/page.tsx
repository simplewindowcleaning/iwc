"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Worker { id: string; name: string; photo_url: string | null; role: "admin" | "worker"; }

const NUMPAD = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

export default function LoginPage() {
  const router = useRouter();
  const [ready, setReady]         = useState(false);
  const [hasApi, setHasApi]       = useState(false);
  const [workers, setWorkers]     = useState<Worker[]>([]);
  const [selected, setSelected]   = useState<Worker | null>(null);
  const [pin, setPin]             = useState("");
  const [shake, setShake]         = useState(false);
  const [errFlash, setErrFlash]   = useState(false);
  const [setupVal, setSetupVal]   = useState("");
  const [setupErr, setSetupErr]   = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);

  useEffect(() => {
    localStorage.removeItem("worker_authed");
    const stored = localStorage.getItem("worker_password");
    if (stored) {
      setHasApi(true);
      fetch("/api/workers").then(r => r.json()).then(d => setWorkers(d.workers ?? []));
    }
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
      const d = await fetch("/api/workers").then(r => r.json());
      setWorkers(d.workers ?? []);
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

  const attempt = async (entered: string) => {
    if (!selected) return;
    const res = await fetch("/api/workers/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, pin: entered }),
    });
    if (res.ok) {
      const { role, name } = await res.json();
      localStorage.setItem("worker_authed", "true");
      localStorage.setItem("worker_employee", name);
      if (role === "admin") sessionStorage.setItem("admin_session", "true");
      router.push(role === "admin" ? "/admin" : "/admin/job-closeout");
    } else {
      setErrFlash(true);
      setShake(true);
      setTimeout(() => { setShake(false); setErrFlash(false); setPin(""); }, 650);
    }
  };

  if (!ready) return null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif" }}>
      <video autoPlay muted loop playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        src="/bgvid.mp4" />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1 }} />

      <div style={{
        position: "relative", zIndex: 2, minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        {!hasApi ? (
          <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <div style={eyebrow}>Simple Window Cleaning</div>
            <div style={title}>Admin Setup</div>
            <div style={sub}>Enter the API access code once to configure this device.</div>
            <form onSubmit={handleSetup} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="password" value={setupVal}
                onChange={e => { setSetupVal(e.target.value); setSetupErr(false); }}
                placeholder="Access code" autoFocus
                style={{ ...glassInput, borderColor: setupErr ? "#f87171" : "rgba(255,255,255,0.12)" }} />
              {setupErr && <div style={{ color: "#f87171", fontSize: 13 }}>Incorrect — try again.</div>}
              <button type="submit" disabled={!setupVal || setupBusy} style={glassBtn(!setupVal || setupBusy)}>
                {setupBusy ? "Verifying…" : "Save & Continue"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 600 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.jpg" alt="Simple Window Cleaning"
              style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", marginBottom: 28 }} />
            <div style={eyebrow}>Simple Window Cleaning</div>
            <div style={{ ...title, marginBottom: 36 }}>Who&apos;s working today?</div>

            {/* Employee scroll */}
            <div style={{
              display: "flex", gap: 12, overflowX: "auto", width: "100%",
              paddingBottom: 8, marginBottom: 32, justifyContent: workers.length <= 3 ? "center" : "flex-start",
            }}>
              {workers.map(w => {
                const active = selected?.id === w.id;
                const initials = w.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button key={w.id}
                    onClick={() => { setSelected(w); setPin(""); setErrFlash(false); }}
                    style={{
                      flexShrink: 0,
                      background: active ? "rgba(18,120,160,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${active ? "rgba(58,170,196,0.6)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 20, padding: "16px 24px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                      transform: active ? "scale(1.03)" : "scale(1)",
                      transition: "all 0.2s", backdropFilter: "blur(12px)",
                    }}>
                    {w.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.photo_url} alt={w.name}
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
                          border: `1.5px solid ${active ? "#3AAAC4" : "rgba(255,255,255,0.12)"}` }} />
                    ) : (
                      <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: active ? "linear-gradient(135deg, #1278A0, #0A3D5C)" : "rgba(255,255,255,0.07)",
                        border: `1.5px solid ${active ? "#3AAAC4" : "rgba(255,255,255,0.12)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 800, color: active ? "white" : "rgba(255,255,255,0.5)",
                      }}>{initials}</div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? "white" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                      {w.name}
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
                  background: i < pin.length ? (errFlash ? "#f87171" : "#3AAAC4") : "rgba(255,255,255,0.15)",
                  transition: "background 0.15s",
                }} />
              ))}
            </div>

            {/* Numpad */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 76px)",
              gap: 12, opacity: selected ? 1 : 0.35,
              pointerEvents: selected ? "auto" : "none", marginBottom: 40,
            }}>
              {NUMPAD.flat().map((key, i) => key === "" ? <div key={i} /> : (
                <button key={i} onClick={() => pressKey(key)} style={{
                  height: 56, borderRadius: 14,
                  background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: key === "⌫" ? 20 : 26, fontWeight: 600, cursor: "pointer",
                }}
                  onMouseDown={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                  onMouseUp={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >{key}</button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>Simple Window Cleaning · Santa Cruz, CA</div>
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
const title: React.CSSProperties = { fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 8 };
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
  backdropFilter: "blur(12px)", border: "1px solid rgba(58,170,196,0.3)",
  borderRadius: 14, padding: "18px", fontSize: 16, fontWeight: 700,
  color: "white", cursor: disabled ? "default" : "pointer",
});
