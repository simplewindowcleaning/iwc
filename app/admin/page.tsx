"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { ICSUploader } from "@/components/admin/ICSUploader";
import { FinanceTab } from "@/components/admin/FinanceTab";
import { motion, AnimatePresence } from "framer-motion";
import { adminHeader } from "@/lib/admin";
import { formatDateFull, formatTime } from "@/lib/availability";
import type { Booking, BlockedSlot } from "@/app/admin/types";
import { AdminChatWidget } from "@/components/AdminChatWidget";
import { StaffTab } from "@/components/admin/StaffTab";


type Tab = "calendar" | "bookings" | "data" | "ics" | "reviews" | "completions" | "settings" | "analytics" | "finance" | "chat" | "staff";

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

  const [tab, setTab]           = useState<Tab>("calendar");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked]   = useState<BlockedSlot[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);
  const [completions, setCompletions] = useState<GigCompletion[]>([]);
  const [approving, setApproving]     = useState<string | null>(null);
  const [finTx, setFinTx]       = useState<{ id: string; date: string; description: string; amount: number; type: "income" | "expense"; source: string; category: string | null }[]>([]);
  const [finMile, setFinMile]   = useState<{ id: string; date: string; miles: number; description: string | null }[]>([]);
  const [escalations, setEscalations] = useState<{ id: string; created_at: string; name: string | null; phone: string | null; summary: string | null; transcript: { role: string; content: string }[] | null }[]>([]);

  const [analytics, setAnalytics] = useState<{
    company: { completedGigs: number; totalWindows: number; avgWindowsPerGig: number; avgDailyWindows: number; avgSale: number };
    summary: { totalBookings: number; bookings30d: number; bookings7d: number; totalRevenue: number; revenue30d: number; revenue7d: number; avgTicket: number; avgWindows: number };
    byZip: { zip: string; count: number; revenue: number }[];
    dailyTrend: { date: string; count: number }[];
    byWindowCount: { windows: number; count: number }[];
  } | null>(null);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoCodes, setPromoCodes]     = useState<{ code: string; notes: string | null; discount_type: string; discount_value: number; active: boolean }[]>([]);
  const [newCode, setNewCode]           = useState("");
  const [newNotes, setNewNotes]         = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percent" | "per_window" | "flat">("percent");
  const [newDiscountValue, setNewDiscountValue] = useState("");
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
    const anRes = await fetch("/api/admin/analytics", { headers: h });
    if (anRes.ok) {
      const data = await anRes.json();
      setAnalytics(data);
    }
    const txRes = await fetch("/api/admin/transactions", { headers: h });
    if (txRes.ok) { const { transactions: d } = await txRes.json(); if (d) setFinTx(d); }
    const miRes = await fetch("/api/admin/mileage", { headers: h });
    if (miRes.ok) { const { entries: d } = await miRes.json(); if (d) setFinMile(d); }
    const esRes = await fetch("/api/chat/escalate", { headers: h });
    if (esRes.ok) { const d = await esRes.json(); if (Array.isArray(d)) setEscalations(d); }
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
    const workerPw = localStorage.getItem("worker_password");
    if (workerPw && sessionStorage.getItem("admin_session") === "true") {
      setPw(workerPw);
      setRole("owner");
      setLoggedIn(true);
      loadData(workerPw);
    }
    // else: stay on portal (loggedIn stays false)
  }, [loadData]);

  function handleLogout() {
    sessionStorage.removeItem("admin_session");
    router.push("/login");
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
    a.download = `simple-windows-jobs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCompletionsCSV() {
    const cols = ["Completed At", "Service Date", "Customer", "Worker Pre-fill", "Stars", "Customer Review", "Status"];
    const rows = completions.map(c => [
      new Date(c.completed_at).toLocaleDateString(),
      c.bookings?.service_date ? formatDateFull(c.bookings.service_date) : "",
      [c.bookings?.first_name, c.bookings?.last_name].filter(Boolean).join(" ") || "",
      c.worker_notes,
      c.customer_stars ?? "",
      c.customer_review_text ?? "",
      c.review_status,
    ]);
    const csv = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `simple-windows-completions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loggedIn) {
    return (
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif" }}>
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          src="/bgvid.mp4" />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1 }} />
        <div style={{
          position: "relative", zIndex: 2, minHeight: "100vh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.jpg" alt="Simple Window Cleaning"
            style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", marginBottom: 24 }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
            Simple Window Cleaning
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 48 }}>
            Who are you?
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const, justifyContent: "center" }}>
            {[
              { label: "Dispatcher", sub: "Admin dashboard", icon: "⚡", href: "/login" },
              { label: "Ladderless Tech", sub: "Job closeout", icon: "🪟", href: "/login" },
            ].map(card => (
              <button key={card.label} onClick={() => router.push(card.href)}
                style={{
                  background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24,
                  padding: "36px 40px", cursor: "pointer", textAlign: "center" as const,
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10,
                  transition: "all 0.2s", minWidth: 180,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={{ fontSize: 36 }}>{card.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>{card.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{card.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 64, fontSize: 11, color: "rgba(255,255,255,0.1)" }}>
            Simple Window Cleaning · Santa Cruz, CA
          </div>
        </div>
      </div>
    );
  }

  const pendingReviews = completions.filter(c => c.review_status === "pending" && c.review_submitted_at);

  const TABS: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "bookings", label: `Bookings${pending.length ? ` (${pending.length})` : ""}` },
    { id: "data",     label: `Data${batched.length ? ` (${batched.length})` : ""}` },
    { id: "ics",      label: "Import ICS" },
    { id: "reviews",      label: `Reviews${pendingReviews.length ? ` (${pendingReviews.length})` : ""}` },
    { id: "completions",  label: `Completions${completions.length ? ` (${completions.length})` : ""}` },
    { id: "settings",   label: "Settings" },
    { id: "analytics",  label: "Analytics" },
    { id: "finance",    label: "Finance" },
    { id: "chat",       label: "Chat" },
    { id: "staff",      label: "Staff" },
  ];

  const S: Record<string, React.CSSProperties> = {
    cell: { padding: "10px 12px", fontSize: 11, color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" as const },
    hdr:  { padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 700 }}>Simple Windows Admin</h1>
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

      <div className="flex gap-2 mb-6" style={{ overflowX: "auto", paddingBottom: 4 }}>
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
                      <span style={{ color: "rgba(255,255,255,0.25)", marginRight: 6 }}>Review pre-fill:</span>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: "rgba(126,200,227,0.5)" }}>✓ Approved</span>
                        <a
                          href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "https://search.google.com/local/writereview?placeid=PLACEHOLDER"}
                          target="_blank" rel="noopener"
                          style={{
                            fontSize: 10, fontWeight: 700, color: "#fff", background: "#4285F4",
                            borderRadius: 6, padding: "4px 10px", textDecoration: "none", letterSpacing: "0.03em",
                          }}
                        >
                          Post to Google ↗
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Completions spreadsheet ── */}
          {tab === "completions" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{completions.length} completed gig{completions.length !== 1 ? "s" : ""}</span>
                {completions.length > 0 && (
                  <button onClick={exportCompletionsCSV}
                    style={{
                      background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: 8, color: "#a78bfa", fontSize: 11, fontWeight: 700,
                      padding: "6px 14px", cursor: "pointer",
                    }}>
                    ↓ Export CSV
                  </button>
                )}
              </div>
              {completions.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No completed gigs yet. They'll appear here after you tap "Mark Job Complete" in the worker app.</p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                        {["Completed", "Svc Date", "Customer", "Review Pre-fill", "Stars", "Status"].map(h => (
                          <th key={h} style={S.hdr}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completions.map((c, i) => {
                        const name = [c.bookings?.first_name, c.bookings?.last_name].filter(Boolean).join(" ") || "–";
                        return (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                            <td style={S.cell}>{new Date(c.completed_at).toLocaleDateString()}</td>
                            <td style={S.cell}>{c.bookings?.service_date ? formatDateFull(c.bookings.service_date) : "–"}</td>
                            <td style={{ ...S.cell, color: "white", fontWeight: 500 }}>{name}</td>
                            <td style={{ ...S.cell, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.worker_notes}</td>
                            <td style={{ ...S.cell, textAlign: "center" as const }}>{c.customer_stars ? "★".repeat(c.customer_stars) : "–"}</td>
                            <td style={{ ...S.cell, color: c.review_status === "approved" ? "rgba(126,200,227,0.8)" : c.review_status === "rejected" ? "rgba(251,113,133,0.6)" : "rgba(255,255,255,0.3)", textTransform: "capitalize" as const }}>{c.review_status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                      const stored = pw;
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
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="CODE"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                        padding: "8px 12px", outline: "none", fontFamily: "inherit",
                        letterSpacing: "0.08em", width: 130, flexShrink: 0,
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
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={newDiscountType}
                      onChange={e => setNewDiscountType(e.target.value as "percent" | "per_window" | "flat")}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8, color: "rgba(255,255,255,0.75)", fontSize: 12,
                        padding: "8px 12px", outline: "none", fontFamily: "inherit", flex: 1,
                      }}
                    >
                      <option value="percent">% off total</option>
                      <option value="per_window">$/window (extra only)</option>
                      <option value="flat">$ off total</option>
                    </select>
                    <input
                      type="number"
                      placeholder={newDiscountType === "percent" ? "50" : newDiscountType === "flat" ? "20" : "10"}
                      value={newDiscountValue}
                      onChange={e => setNewDiscountValue(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                        padding: "8px 12px", outline: "none", fontFamily: "inherit", width: 90, flexShrink: 0,
                      }}
                    />
                    <button
                      disabled={!newCode.trim() || !newDiscountValue || addingCode}
                      onClick={async () => {
                        if (!newCode.trim() || !newDiscountValue) return;
                        setAddingCode(true);
                        const stored = pw;
                        const res = await fetch("/api/admin/promo-codes", {
                          method: "POST",
                          headers: { ...adminHeader(stored), "Content-Type": "application/json" },
                          body: JSON.stringify({
                            code: newCode.trim(),
                            notes: newNotes.trim() || null,
                            discount_type: newDiscountType,
                            discount_value: Number(newDiscountValue),
                          }),
                        });
                        if (res.ok) {
                          setPromoCodes(prev => [{ code: newCode.trim().toUpperCase(), notes: newNotes.trim() || null, discount_type: newDiscountType, discount_value: Number(newDiscountValue), active: true }, ...prev]);
                          setNewCode(""); setNewNotes(""); setNewDiscountValue("");
                        }
                        setAddingCode(false);
                      }}
                      style={{
                        padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: (newCode.trim() && newDiscountValue) ? "#a78bfa" : "rgba(167,139,250,0.1)",
                        color: (newCode.trim() && newDiscountValue) ? "#08080e" : "rgba(167,139,250,0.35)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        cursor: (newCode.trim() && newDiscountValue) ? "pointer" : "not-allowed", flexShrink: 0, fontFamily: "inherit",
                      }}
                    >
                      {addingCode ? "Adding…" : "Add"}
                    </button>
                  </div>
                </div>

                {/* Code list */}
                {promoCodes.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, paddingLeft: 4 }}>No promo codes yet.</p>
                )}
                {promoCodes.map(pc => (
                  <div key={pc.code} style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${pc.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
                    borderRadius: 10, padding: "12px 16px", marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 12,
                    opacity: pc.active ? 1 : 0.45,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.08em", minWidth: 110 }}>
                      {pc.code}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#86efac", minWidth: 90 }}>
                      {pc.discount_type === "percent" ? `-${pc.discount_value}%` : pc.discount_type === "flat" ? `-$${pc.discount_value}` : `$${pc.discount_value}/window`}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flex: 1 }}>
                      {pc.notes || ""}
                    </span>
                    <button
                      onClick={async () => {
                        const stored = pw;
                        await fetch("/api/admin/promo-codes", {
                          method: "PATCH",
                          headers: { ...adminHeader(stored), "Content-Type": "application/json" },
                          body: JSON.stringify({ code: pc.code, active: !pc.active }),
                        });
                        setPromoCodes(prev => prev.map(c => c.code === pc.code ? { ...c, active: !c.active } : c));
                      }}
                      style={{
                        background: "transparent", border: `1px solid ${pc.active ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 6, color: pc.active ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.3)", fontSize: 11,
                        padding: "4px 10px", cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      {pc.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={async () => {
                        const stored = pw;
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
                      Delete
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ── Finance ── */}
          {tab === "finance" && (
            <FinanceTab
              pw={pw}
              transactions={finTx}
              mileage={finMile}
              bookings={bookings}
              onTransactionsChange={setFinTx}
              onMileageChange={setFinMile}
            />
          )}

          {/* ── Analytics ── */}
          {tab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Vercel visitor analytics link */}
              <div style={{
                background: "rgba(126,200,227,0.04)", border: "1px solid rgba(126,200,227,0.15)",
                borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(126,200,227,0.85)", marginBottom: 3 }}>Visitor Analytics</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Page views, time on site, referrers, devices, countries — via Vercel
                  </div>
                </div>
                <a
                  href="https://vercel.com/chris-vinson-s-projects/iwc/analytics"
                  target="_blank" rel="noopener"
                  style={{
                    background: "rgba(126,200,227,0.1)", border: "1px solid rgba(126,200,227,0.25)",
                    borderRadius: 8, color: "rgba(126,200,227,0.9)", fontSize: 11, fontWeight: 700,
                    padding: "8px 16px", textDecoration: "none", flexShrink: 0, letterSpacing: "0.04em",
                  }}
                >
                  Open Dashboard →
                </a>
              </div>

              {!analytics ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>
              ) : (
                <>
                  {/* Summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    {[
                      { label: "Total Bookings", value: analytics.summary.totalBookings, sub: `${analytics.summary.bookings30d} last 30d` },
                      { label: "Total Revenue", value: `$${analytics.summary.totalRevenue.toLocaleString()}`, sub: `$${analytics.summary.revenue30d.toLocaleString()} last 30d` },
                      { label: "Avg Ticket", value: `$${analytics.summary.avgTicket}`, sub: `per booking` },
                      { label: "Avg Windows", value: analytics.summary.avgWindows, sub: `per booking` },
                      { label: "Last 7 Days", value: analytics.summary.bookings7d, sub: `bookings` },
                      { label: "Revenue 7d", value: `$${analytics.summary.revenue7d}`, sub: `this week` },
                    ].map(c => (
                      <div key={c.label} style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10, padding: "14px 16px",
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{c.value}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ZIP breakdown */}
                  {analytics.byZip.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Bookings by ZIP</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {analytics.byZip.map(z => {
                          const maxCount = analytics.byZip[0].count;
                          return (
                            <div key={z.zip} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", width: 54, flexShrink: 0 }}>{z.zip}</span>
                              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                                <div style={{ width: `${(z.count / maxCount) * 100}%`, height: "100%", background: "#a78bfa", borderRadius: 4, transition: "width 0.4s" }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#a78bfa", width: 18, textAlign: "right", flexShrink: 0 }}>{z.count}</span>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", width: 54, textAlign: "right", flexShrink: 0 }}>${z.revenue.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Window count distribution */}
                  {analytics.byWindowCount.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Windows per Booking</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {analytics.byWindowCount.map(w => (
                          <div key={w.windows} style={{
                            background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                            borderRadius: 8, padding: "8px 14px", textAlign: "center",
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#a78bfa" }}>{w.windows}w</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{w.count}×</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analytics.summary.totalBookings === 0 && (
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>No bookings yet — data will appear here once customers start booking.</p>
                  )}

                  {/* Company Performance */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Company Performance</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                      {[
                        { label: "Gigs Completed",     value: analytics.company.completedGigs,                                    sub: "all time" },
                        { label: "Total Windows",       value: analytics.company.totalWindows.toLocaleString(),                    sub: "cleaned" },
                        { label: "Avg Windows / Gig",   value: analytics.company.avgWindowsPerGig || "—",                         sub: "per completed job" },
                        { label: "Avg Daily Windows",   value: analytics.company.avgDailyWindows || "—",                          sub: "on days worked" },
                        { label: "Avg Sale",            value: analytics.company.avgSale ? `$${analytics.company.avgSale}` : "—", sub: "completed gigs" },
                        { label: "Avg Gig Length",      value: "—",  sub: "coming after TestFlight" },
                        { label: "Avg Window Time",     value: "—",  sub: "coming after TestFlight" },
                      ].map(c => (
                        <div key={c.label} style={{
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 10, padding: "14px 16px",
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>{c.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: c.value === "—" ? "rgba(255,255,255,0.15)" : "#34d399" }}>{c.value}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payroll — placeholder until TestFlight sync */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Payroll</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                      {[
                        { label: "Shift Clock",     sub: "total hours clocked in" },
                        { label: "Gig Clock",       sub: "active work time" },
                        { label: "Avg Window Time", sub: "your pace per window" },
                        { label: "Drive Time",      sub: "coming later" },
                      ].map(c => (
                        <div key={c.label} style={{
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 10, padding: "14px 16px",
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>{c.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.12)" }}>—</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>
                      Populates automatically once worker app data syncs via TestFlight.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Chat Escalations ── */}
          {tab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                Customers who asked to speak with Chris via the chat widget.
              </div>
              {escalations.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>No escalations yet.</p>
              )}
              {escalations.map(e => (
                <div key={e.id} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>{e.name ?? "Unknown"}</div>
                      <div style={{ fontSize: 12, color: "rgba(126,200,227,0.7)", marginTop: 2 }}>{e.phone ?? "No phone"}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                      {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  {e.summary && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: 8 }}>
                      &ldquo;{e.summary}&rdquo;
                    </div>
                  )}
                  {e.transcript && e.transcript.length > 0 && (
                    <details style={{ marginTop: 4 }}>
                      <summary style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                        View transcript ({e.transcript.length} messages)
                      </summary>
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {e.transcript.map((m, i) => (
                          <div key={i} style={{ fontSize: 11, color: m.role === "user" ? "rgba(126,200,227,0.7)" : "rgba(255,255,255,0.5)" }}>
                            <span style={{ fontWeight: 700, marginRight: 6 }}>{m.role === "user" ? "Customer:" : "Bot:"}</span>
                            {m.content}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Staff ── */}
          {tab === "staff" && <StaffTab pw={pw} />}

        </motion.div>
      </AnimatePresence>

      {loggedIn && <AdminChatWidget password={pw} />}
    </div>
  );
}
