"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkerLogin() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(false);

    const res = await fetch("/api/admin/bookings", {
      headers: { "x-admin-pw": password, "Content-Type": "application/json" },
    });

    if (res.ok) {
      localStorage.setItem("worker_authed", "true");
      localStorage.setItem("worker_password", password);
      router.push("/admin/job-closeout");
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const base: React.CSSProperties = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 35% 25%, #180a3a 0%, #06050f 45%, #080818 100%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
    padding: 24,
  };

  return (
    <div style={base}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 14, fontWeight: 600 }}>
          Simple Window Cleaning
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
          Worker Login
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
          Job Closeout & Upsell Portal
        </div>
      </div>

      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 24, padding: "44px 40px",
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
            Technician
          </div>
          <div style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "15px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>C.J. Vinson</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.18)" }}>▾</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
              Password
            </div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="••••••"
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.06)",
                border: `1.5px solid ${error ? "#f87171" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, padding: "17px 20px",
                fontSize: 22, letterSpacing: "0.25em",
                color: "white", outline: "none",
                transition: "border-color 0.15s",
              }}
            />
            {error && <div style={{ fontSize: 13, color: "#f87171", marginTop: 10 }}>Incorrect password — try again.</div>}
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            style={{
              width: "100%",
              background: !password || loading ? "rgba(22,163,74,0.35)" : "#16a34a",
              border: "none", borderRadius: 14,
              padding: "19px", fontSize: 17, fontWeight: 700,
              color: "white", cursor: !password || loading ? "default" : "pointer",
              transition: "background 0.2s", letterSpacing: "0.02em",
            }}
          >
            {loading ? "Signing in…" : "Start Session"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 36, fontSize: 12, color: "rgba(255,255,255,0.12)" }}>
        Simple Window Cleaning · Santa Cruz, CA
      </div>
    </div>
  );
}
