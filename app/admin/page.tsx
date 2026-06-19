"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { ICSUploader } from "@/components/admin/ICSUploader";
import { motion, AnimatePresence } from "framer-motion";
import { adminHeader } from "@/lib/admin";
import { formatDateFull, formatTime } from "@/lib/availability";
import type { Booking, BlockedSlot } from "@/app/admin/types";

const SESSION_KEY = "iwc_admin";
const PW_KEY = "iwc_admin_pw";

type Tab = "calendar" | "bookings" | "data" | "ics" | "reviews" | "settings";

interface GigCompletion {
  id: string;
  created_at: string;
  booking_id: string;
  worker_notes: string;
  completed_at: string;
  review_token: string;
  review_status: "pending" | "approved" | "rejected";
  customer_review_text: string | null;
  customer_stars: number | null;
  review_submitted_at: string | null;
  bookings: { first_name: string | null; last_name: string | null; service_date: string; phone: string | null } | null;
}


export default function AdminPage() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole]         = useState<"owner" | "staff">("owner");
  const [pw, setPw]             = useState("");
  const [pwError, setPwError]   = useState(false);

  const [tab, setTab]           = useState<Tab>("calendar");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked]   = useState<BlockedSlot[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);
  const [completions, setCompletions] = useState<GigCompletion[]>([]);
  const [approving, setApproving]     = useState<string | null>(null);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoCodes, setPromoCodes]     = useState<{ code: string; notes: string | null }[]>([]);
  const [newCode, setNewCode]           = useState("");
  const [newNotes, setNewNotes]         = useState("");
  const [addingCode, setAddingCode]     = useState(false);

  const pending = bookings.filter(b => b.status === "pending");
  const batched = bookings.filter(b => b.status === "batched");

  const loadData = useCallback(async (password: string) => {
    const h = adminHeader(password);
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
    const rRes = await fetch("/api/admin/reviews", { headers: h });
    if (rRes.ok) {
      const { completions: data } = await rRes.json();
      if (data) setCompletions(data as GigCompletion[]);
    }
    const sRes = await fetch("/api/admin/settings", { headers: h });
    if (sRes.ok) {
      const data = await sRes.json();
      setPromoEnabled(data.promo_enabled === "true");
    }
    const pcRes = await fetch("/api/admin/promo-codes", { headers: h });
    if (pcRes.ok) {
      const { codes } = await pcRes.json();
      if (codes) setPromoCodes(codes);
    }
  }, []);

  async function handleReviewStatus(id: string, status: "approved" | "rejected") {
    setApproving(id);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: adminHeader(pw),
      body: JSON.stringify({ id, review_status: status }),
    });
    await loadData(pw);
    setApproving(null);
  }

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
    const trimmed = pw.trim();
    if (trimmed.toLowerCase() === "staff") {
      sessionStorage.setItem(SESSION_KEY, "staff");
      setRole("staff"); setLoggedIn(true); loadData(trimmed);
      return;
    }
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: adminHeader(trimmed),
    });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "owner");
      sessionStorage.setItem(PW_KEY, trimmed);
      setRole("owner"); setLoggedIn(true); loadData(trimmed);
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

  const pendingReviews = completions.filter(c => c.review_status === "pending" && c.review_submitted_at);

  const TABS: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "bookings", label: `Bookings${pending.length ? ` (${pending.length})` : ""}` },
    { id: "data",     label: `Data${batched.length ? ` (${batched.length})` : ""}` },
    { id: "ics",      label: "Import ICS" },
    { id: "reviews",  label: `Reviews${pendingReviews.length ? ` (${pendingReviews.length})` : ""}` },
    { id: "settings", label: "Settings" },
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => router.push("/admin/worker")}
            style={{
              background: "rgba(126,200,227,0.1)", border: "1px solid rgba(126,200,227,0.25)",
              borderRadius: 8, color: "rgba(126,200,227,0.8)", fontSize: 11, fontWeight: 700,
              padding: "6px 14px", cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            Worker App
          </button>
          <button className="ghost-btn" onClick={handleLogout}>Sign out</button>
        </div>
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

          {/* ── Reviews ── */}
          {tab === "reviews" && (
            <div>
              {completions.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No gig completions yet.</p>
              )}
              {completions.map(c => {
                const name = [c.bookings?.first_name, c.bookings?.last_name].filter(Boolean).join(" ");
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ladderlesswindows.com";
                const reviewUrl = `${siteUrl}/review/${c.review_token}`;
                const statusColor =
                  c.review_status === "approved" ? "rgba(126,200,227,0.7)" :
                  c.review_status === "rejected" ? "rgba(251,113,133,0.6)" :
                  "rgba(255,255,255,0.3)";
                return (
                  <div key={c.id} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>{name || "Unknown customer"}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                          {c.bookings?.service_date ? formatDateFull(c.bookings.service_date) : "–"}
                          {" · "}completed {new Date(c.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: statusColor }}>
                        {c.review_status}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                      <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 6 }}>Worker:</span>
                      {c.worker_notes}
                    </div>

                    {c.customer_review_text && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                        <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 6 }}>Customer:</span>
                        {c.customer_stars ? "★".repeat(c.customer_stars) + " · " : ""}{c.customer_review_text}
                      </div>
                    )}
                    {!c.customer_review_text && (
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>
                        Customer hasn't submitted yet · <a
                          href={reviewUrl} target="_blank" rel="noopener"
                          style={{ color: "rgba(126,200,227,0.5)", textDecoration: "none" }}
                        >{reviewUrl.replace("https://", "")}</a>
                      </div>
                    )}

                    {c.review_status === "pending" && c.customer_review_text && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          onClick={() => handleReviewStatus(c.id, "approved")}
                          disabled={approving === c.id}
                          style={{
                            background: "rgba(126,200,227,0.15)", border: "1px solid rgba(126,200,227,0.3)",
                            borderRadius: 7, color: "rgba(126,200,227,0.9)", fontSize: 11, fontWeight: 700,
                            padding: "6px 14px", cursor: approving === c.id ? "not-allowed" : "pointer",
                            opacity: approving === c.id ? 0.5 : 1,
                          }}
                        >
                          {approving === c.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReviewStatus(c.id, "rejected")}
                          disabled={approving === c.id}
                          style={{
                            background: "transparent", border: "1px solid rgba(251,113,133,0.3)",
                            borderRadius: 7, color: "rgba(251,113,133,0.6)", fontSize: 11, fontWeight: 700,
                            padding: "6px 14px", cursor: approving === c.id ? "not-allowed" : "pointer",
                            opacity: approving === c.id ? 0.5 : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {c.review_status === "approved" && (
                      <div style={{ fontSize: 10, color: "rgba(126,200,227,0.5)", marginTop: 8 }}>
                        ✓ Approved — customer can now post to Google via their link
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Settings ── */}
          {tab === "settings" && (
            <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Promo Code Box toggle */}
              <div>
                <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Site Settings</div>
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>Promo Code Box</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {promoEnabled
                        ? "Customers see the promo code field when they select more than the minimum windows"
                        : "Promo code field is hidden from customers"}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = !promoEnabled;
                      setPromoEnabled(next);
                      const stored = localStorage.getItem(PW_KEY) ?? "";
                      await fetch("/api/admin/settings", {
                        method: "PATCH",
                        headers: { ...adminHeader(stored), "Content-Type": "application/json" },
                        body: JSON.stringify({ promo_enabled: String(next) }),
                      });
                    }}
                    style={{
                      padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                      background: promoEnabled ? "#a78bfa" : "rgba(167,139,250,0.1)",
                      color: promoEnabled ? "#08080e" : "#a78bfa",
                      border: `1px solid ${promoEnabled ? "#a78bfa" : "rgba(167,139,250,0.25)"}`,
                      cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                    }}
                  >
                    {promoEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Promo code list */}
              <div>
                <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Active Promo Codes</div>

                {/* Add new code */}
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "16px 20px", marginBottom: 10,
                  display: "flex", gap: 8, alignItems: "center",
                }}>
                  <input
                    placeholder="CODE"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    onKeyDown={async e => { if (e.key === "Enter") { e.preventDefault(); (document.activeElement as HTMLElement)?.blur(); } }}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                      padding: "8px 12px", outline: "none", fontFamily: "inherit",
                      letterSpacing: "0.08em", width: 140, flexShrink: 0,
                    }}
                  />
                  <input
                    placeholder="Notes (optional)"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8, color: "rgba(255,255,255,0.75)", fontSize: 12,
                      padding: "8px 12px", outline: "none", fontFamily: "inherit", flex: 1,
                    }}
                  />
                  <button
                    disabled={!newCode.trim() || addingCode}
                    onClick={async () => {
                      if (!newCode.trim()) return;
                      setAddingCode(true);
                      const stored = localStorage.getItem(PW_KEY) ?? "";
                      const res = await fetch("/api/admin/promo-codes", {
                        method: "POST",
                        headers: { ...adminHeader(stored), "Content-Type": "application/json" },
                        body: JSON.stringify({ code: newCode.trim(), notes: newNotes.trim() || null }),
                      });
                      if (res.ok) {
                        setPromoCodes(prev => [{ code: newCode.trim().toUpperCase(), notes: newNotes.trim() || null }, ...prev]);
                        setNewCode(""); setNewNotes("");
                      }
                      setAddingCode(false);
                    }}
                    style={{
                      padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: newCode.trim() ? "#a78bfa" : "rgba(167,139,250,0.1)",
                      color: newCode.trim() ? "#08080e" : "rgba(167,139,250,0.35)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      cursor: newCode.trim() ? "pointer" : "not-allowed", flexShrink: 0,
                    }}
                  >
                    {addingCode ? "Adding…" : "Add"}
                  </button>
                </div>

                {/* Code list */}
                {promoCodes.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, paddingLeft: 4 }}>No promo codes yet.</p>
                )}
                {promoCodes.map(pc => (
                  <div key={pc.code} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.08em", minWidth: 120 }}>
                      {pc.code}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flex: 1 }}>
                      {pc.notes || <span style={{ opacity: 0.4 }}>no notes</span>}
                    </span>
                    <button
                      onClick={async () => {
                        const stored = localStorage.getItem(PW_KEY) ?? "";
                        const res = await fetch("/api/admin/promo-codes", {
                          method: "DELETE",
                          headers: { ...adminHeader(stored), "Content-Type": "application/json" },
                          body: JSON.stringify({ code: pc.code }),
                        });
                        if (res.ok) setPromoCodes(prev => prev.filter(c => c.code !== pc.code));
                      }}
                      style={{
                        background: "transparent", border: "1px solid rgba(251,113,133,0.25)",
                        borderRadius: 6, color: "rgba(251,113,133,0.5)", fontSize: 11,
                        padding: "4px 10px", cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
