"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminHeader } from "@/lib/admin";
import { formatDateFull, formatTime } from "@/lib/availability";
import type { Booking } from "@/app/admin/types";

const SESSION_KEY = "iwc_admin";
const PW_KEY     = "iwc_admin_pw";

const ACTIVE_STATUSES = ["pending", "batched", "confirmed"];

const S = {
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
  } as React.CSSProperties,
  label: { fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 3 } as React.CSSProperties,
  val:   { fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 500 } as React.CSSProperties,
};

function btnStyle(accent: string): React.CSSProperties {
  return {
    background: "transparent", border: `1px solid ${accent}`,
    borderRadius: 8, color: accent, fontSize: 11, fontWeight: 700,
    padding: "6px 14px", cursor: "pointer", letterSpacing: "0.04em",
    transition: "all 0.15s", fontFamily: "inherit",
  };
}

function btnFillStyle(accent: string): React.CSSProperties {
  return {
    background: accent, border: "none", borderRadius: 8,
    color: "#08080e", fontSize: 12, fontWeight: 800,
    padding: "10px 20px", cursor: "pointer", letterSpacing: "0.04em",
    transition: "opacity 0.15s", fontFamily: "inherit",
  };
}

export default function WorkerPage() {
  const router = useRouter();
  const [pw, setPw]           = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGig, setActiveGig] = useState<string | null>(null);
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [copied, setCopied]   = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    const storedPw = sessionStorage.getItem(PW_KEY) ?? "";
    if (!session) { router.push("/admin"); return; }
    setPw(storedPw);
    loadJobs(storedPw);
  }, []);

  async function loadJobs(password: string) {
    setLoading(true);
    const res = await fetch("/api/admin/bookings", { headers: adminHeader(password) });
    if (res.ok) {
      const { bookings: data } = await res.json();
      setBookings((data ?? []) as Booking[]);
    }
    setLoading(false);
  }

  async function handleCantMakeIt(id: string) {
    setFlagging(id);
    await fetch("/api/worker/cant-make-it", {
      method: "PATCH",
      headers: adminHeader(pw),
      body: JSON.stringify({ booking_id: id }),
    });
    await loadJobs(pw);
    setFlagging(null);
  }

  async function handleEndGig(bookingId: string) {
    if (!notes.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/worker/end-gig", {
      method: "POST",
      headers: adminHeader(pw),
      body: JSON.stringify({ booking_id: bookingId, worker_notes: notes.trim() }),
    });
    if (res.ok) {
      const { review_url } = await res.json();
      setReviewLinks(prev => ({ ...prev, [bookingId]: review_url }));
      setActiveGig(null);
      setNotes("");
      await loadJobs(pw);
    }
    setSubmitting(false);
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2200);
  }

  const jobs = bookings
    .filter(b => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => a.service_date.localeCompare(b.service_date));

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <button onClick={() => router.push("/admin")}
            style={{ ...btnStyle("rgba(255,255,255,0.25)"), marginBottom: 8 }}>← Admin</button>
          <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>Worker App</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>Simple Windows crew</p>
        </div>

        {/* Clock Out — placeholder */}
        <button
          disabled
          title="Clock out coming soon"
          style={{ ...btnStyle("rgba(255,255,255,0.15)"), opacity: 0.45, cursor: "not-allowed" }}
        >
          Clock Out
        </button>
      </div>

      {/* Jobs list */}
      <div style={{ marginBottom: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
        Active Jobs
      </div>

      {loading && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>}
      {!loading && jobs.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No active jobs.</p>
      )}

      {jobs.map(job => {
        const isToday   = job.service_date === today;
        const isExpanded = activeGig === job.id;
        const reviewUrl  = reviewLinks[job.id];

        return (
          <div key={job.id} style={{ ...S.card, borderColor: isToday ? "rgba(126,200,227,0.25)" : "rgba(255,255,255,0.08)" }}>

            {/* Top row: date badge + status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: isToday ? "rgba(126,200,227,0.9)" : "rgba(255,255,255,0.3)",
                background: isToday ? "rgba(126,200,227,0.1)" : "transparent",
                border: isToday ? "1px solid rgba(126,200,227,0.2)" : "none",
                borderRadius: 5, padding: isToday ? "2px 7px" : "0",
              }}>
                {isToday ? "Today" : formatDateFull(job.service_date)}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {job.status}
              </span>
            </div>

            {/* Job details */}
            <div style={{ marginBottom: 10 }}>
              {!isToday && (
                <div style={{ ...S.val, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>
                  {formatDateFull(job.service_date)} · {formatTime(job.service_time)}
                </div>
              )}
              {isToday && (
                <div style={{ ...S.val, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {formatTime(job.service_time)}
                </div>
              )}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{job.address}</div>
              <div style={{ fontSize: 11, color: "rgba(167,139,250,0.7)", marginTop: 4 }}>
                {job.window_count} window{job.window_count !== 1 ? "s" : ""} · ${job.total_price}
                {job.needs_estimate && " · estimate requested"}
              </div>
            </div>

            {/* Review link if already completed */}
            {reviewUrl && (
              <div style={{ padding: "10px 12px", background: "rgba(126,200,227,0.07)", border: "1px solid rgba(126,200,227,0.18)", borderRadius: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "rgba(126,200,227,0.6)", marginBottom: 5 }}>✓ Gig ended · review link ready</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", wordBreak: "break-all", marginBottom: 8 }}>{reviewUrl}</div>
                <button onClick={() => copyLink(reviewUrl, job.id)} style={{ ...btnStyle("rgba(126,200,227,0.6)"), fontSize: 10 }}>
                  {copied === job.id ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}

            {/* Inline End Gig form */}
            {isExpanded && !reviewUrl && (
              <div style={{ marginBottom: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ ...S.label, marginBottom: 6 }}>How'd it go?</div>
                <textarea
                  autoFocus
                  placeholder="e.g. 4 windows in 30 minutes, just booked yesterday!"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                    color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "10px 12px",
                    resize: "vertical", fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => handleEndGig(job.id)}
                    disabled={!notes.trim() || submitting}
                    style={{
                      ...btnFillStyle("rgba(126,200,227,0.9)"),
                      opacity: (!notes.trim() || submitting) ? 0.4 : 1,
                      cursor: (!notes.trim() || submitting) ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Ending…" : "End Gig ▶"}
                  </button>
                  <button onClick={() => { setActiveGig(null); setNotes(""); }} style={btnStyle("rgba(255,255,255,0.2)")}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!reviewUrl && (
              <div style={{ display: "flex", gap: 8 }}>
                {!isExpanded && (
                  <button onClick={() => { setActiveGig(job.id); setNotes(""); }} style={btnStyle("rgba(126,200,227,0.6)")}>
                    End Gig
                  </button>
                )}
                <button
                  onClick={() => handleCantMakeIt(job.id)}
                  disabled={flagging === job.id}
                  style={{ ...btnStyle("rgba(251,113,133,0.6)"), opacity: flagging === job.id ? 0.5 : 1 }}
                >
                  {flagging === job.id ? "Flagging…" : "Can't Make It"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
