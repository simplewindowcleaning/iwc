"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { ICSUploader } from "@/components/admin/ICSUploader";
import { motion, AnimatePresence } from "framer-motion";
import { adminHeader } from "@/lib/admin";
import { formatDateFull, formatTime } from "@/lib/availability";
import type { Booking, BlockedSlot } from "@/app/admin/types";

const SESSION_KEY = "iwc_admin";
const PW_KEY = "iwc_admin_pw";

type Tab = "calendar" | "bookings" | "data" | "ics";


export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole]         = useState<"owner" | "staff">("owner");
  const [pw, setPw]             = useState("");
  const [pwError, setPwError]   = useState(false);

  const [tab, setTab]           = useState<Tab>("calendar");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked]   = useState<BlockedSlot[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);

  const pending = bookings.filter(b => b.status === "pending");
  const batched = bookings.filter(b => b.status === "batched");

  const loadData = useCallback(async (password: string) => {
    const h = adminHeader(password);
    // Try API routes (service client bypasses RLS); fall back to anon for staff
    const bRes = await fetch("/api/admin/bookings", { headers: h });
    if (bRes.ok) {
      const { bookings: data } = await bRes.json();
      if (data) setBookings(data as Booking[]);
    } else {
      const { data } = await supabase.from("bookings").select("*").order("service_date", { ascending: true });
      if (data) setBookings(data as Booking[]);
    }
    const blRes = await fetch("/api/admin/block", { headers: h });
    if (blRes.ok) {
      const { blocked: data } = await blRes.json();
      if (data) setBlocked(data as BlockedSlot[]);
    } else {
      const { data } = await supabase.from("availability").select("*").eq("is_blocked", true);
      if (data) setBlocked(data as BlockedSlot[]);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const storedPw = sessionStorage.getItem(PW_KEY) ?? "";
    if (stored === "owner" || stored === "staff") {
      setRole(stored as "owner" | "staff");
      setPw(storedPw);
      setLoggedIn(true);
      loadData(storedPw);
    }
  }, [loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const entered = pw.trim().toLowerCase();
    if (entered === "staff") {
      sessionStorage.setItem(SESSION_KEY, "staff");
      setRole("staff"); setLoggedIn(true); loadData(entered);
      return;
    }
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: adminHeader(entered),
    });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "owner");
      sessionStorage.setItem(PW_KEY, entered);
      setRole("owner"); setLoggedIn(true); loadData(entered);
    } else {
      setPwError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PW_KEY);
    setLoggedIn(false); setRole("owner"); setPw("");
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => prev.size === pending.length ? new Set() : new Set(pending.map(b => b.id)));
  }

  async function batchSelected() {
    if (!selected.size) return;
    setBatching(true);
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: adminHeader(pw),
      body: JSON.stringify({ ids: [...selected], status: "batched" }),
    });
    setSelected(new Set());
    await loadData(pw);
    setBatching(false);
    setTab("data");
  }

  function exportCSV() {
    const cols = ["Date", "Time", "Name", "Address", "Windows", "Total", "Estimate", "Phone", "Email", "Booked"];
    const rows = batched.map(b => [
      formatDateFull(b.service_date),
      formatTime(b.service_time),
      `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim(),
      b.address,
      b.window_count,
      `$${b.total_price}`,
      b.needs_estimate ? "Yes" : "No",
      b.phone ?? "",
      b.email ?? "",
      new Date(b.created_at).toLocaleDateString(),
    ]);
    const csv = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ladderless-jobs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div className="w-full max-w-xs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20 }}>Ladderless Windows dashboard</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="field-label">Password</label>
              <input className="field-input mt-1" type="password" value={pw}
                onChange={e => { setPw(e.target.value); setPwError(false); }}
                autoFocus autoComplete="current-password" />
            </div>
            {pwError && <p style={{ color: "#f87171", fontSize: 12 }}>Incorrect password.</p>}
            <button className="book-btn" type="submit">Enter</button>
          </form>
        </motion.div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "bookings", label: `Bookings${pending.length ? ` (${pending.length})` : ""}` },
    { id: "data",     label: `Data${batched.length ? ` (${batched.length})` : ""}` },
    { id: "ics",      label: "Import ICS" },
  ];

  const S: Record<string, React.CSSProperties> = {
    cell: { padding: "10px 12px", fontSize: 11, color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" as const },
    hdr:  { padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 700 }}>Ladderless Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
            {pending.length} pending · {batched.length} batched
          </p>
        </div>
        <button className="ghost-btn" onClick={handleLogout}>Sign out</button>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} className="admin-tab"
            style={{
              background: tab === t.id ? "#a78bfa" : "rgba(167,139,250,0.1)",
              color:      tab === t.id ? "#08080e" : "#a78bfa",
              border:     `1px solid ${tab === t.id ? "#a78bfa" : "rgba(167,139,250,0.2)"}`,
            }}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* ── Calendar ── */}
          {tab === "calendar" && (
            <AdminCalendar bookings={bookings} blocked={blocked} onRefresh={() => loadData(pw)} role={role} adminPw={pw} />
          )}

          {/* ── Bookings ── */}
          {tab === "bookings" && (
            <div>
              {/* Batch toolbar */}
              {pending.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    <input type="checkbox" checked={selected.size === pending.length && pending.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor: "#a78bfa", width: 14, height: 14 }} />
                    Select all
                  </label>
                  {selected.size > 0 && (
                    <button onClick={batchSelected} disabled={batching}
                      style={{
                        background: "#a78bfa", color: "#08080e", border: "none",
                        borderRadius: 8, padding: "6px 16px", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", opacity: batching ? 0.6 : 1,
                      }}>
                      {batching ? "Moving…" : `Batch ${selected.size} → Data`}
                    </button>
                  )}
                </div>
              )}

              {pending.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No pending bookings.</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pending.map(b => (
                  <div key={b.id}
                    onClick={() => toggleSelect(b.id)}
                    style={{
                      background: selected.has(b.id) ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selected.has(b.id) ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 12, padding: "12px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12, transition: "all 0.12s",
                    }}>
                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ accentColor: "#a78bfa", width: 15, height: 15, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                          {b.first_name ?? ""} {b.last_name ?? ""}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                          {formatDateFull(b.service_date)} · {formatTime(b.service_time)}
                        </span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.address}
                        {b.phone && <span style={{ marginLeft: 10 }}>{b.phone}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: "#a78bfa", fontSize: 14, fontWeight: 700 }}>${b.total_price}</div>
                      <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10 }}>{b.window_count}w{b.needs_estimate ? " · est." : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Data (spreadsheet) ── */}
          {tab === "data" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{batched.length} batched job{batched.length !== 1 ? "s" : ""}</span>
                {batched.length > 0 && (
                  <button onClick={exportCSV}
                    style={{
                      background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: 8, color: "#a78bfa", fontSize: 11, fontWeight: 700,
                      padding: "6px 14px", cursor: "pointer",
                    }}>
                    ↓ Export CSV
                  </button>
                )}
              </div>

              {batched.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  No batched jobs yet. Select bookings and click "Batch → Data".
                </p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                        {["Date", "Time", "Name", "Address", "Win", "Total", "Est?", "Phone", "Email"].map(h => (
                          <th key={h} style={S.hdr}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {batched.map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                          <td style={S.cell}>{formatDateFull(b.service_date)}</td>
                          <td style={S.cell}>{formatTime(b.service_time)}</td>
                          <td style={{ ...S.cell, color: "white", fontWeight: 500 }}>{b.first_name ?? ""} {b.last_name ?? ""}</td>
                          <td style={{ ...S.cell, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{b.address}</td>
                          <td style={{ ...S.cell, textAlign: "center" as const }}>{b.window_count}</td>
                          <td style={{ ...S.cell, color: "#a78bfa", fontWeight: 700 }}>${b.total_price}</td>
                          <td style={{ ...S.cell, textAlign: "center" as const }}>{b.needs_estimate ? "✓" : "—"}</td>
                          <td style={S.cell}>{b.phone ?? "—"}</td>
                          <td style={S.cell}>{b.email ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ICS Import ── */}
          {tab === "ics" && (
            <ICSUploader onRefresh={() => loadData(pw)} adminPw={pw} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
