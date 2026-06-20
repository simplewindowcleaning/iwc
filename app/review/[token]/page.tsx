"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatDateFull } from "@/lib/availability";

interface ReviewData {
  worker_notes: string;
  customer_review_text: string | null;
  customer_stars: number | null;
  review_status: "pending" | "approved" | "rejected";
  review_submitted_at: string | null;
  bookings: { first_name: string | null; service_date: string } | null;
}

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "#";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 34, background: "none", border: "none", cursor: "pointer",
            color: n <= (hovered || value) ? "#facc15" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s, transform 0.1s",
            transform: n <= (hovered || value) ? "scale(1.15)" : "scale(1)",
            lineHeight: 1,
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]       = useState<ReviewData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [text, setText]       = useState("");
  const [stars, setStars]     = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setNotFound(true); return; }
        setData(d);
        setText(d.customer_review_text ?? d.worker_notes);
        setStars(d.customer_stars ?? 0);
        if (d.review_submitted_at) setSubmitted(true);
      });
  }, [token]);

  async function handleSubmit() {
    if (!stars || !text.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/review/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_review_text: text.trim(), customer_stars: stars }),
    });
    if (res.ok) {
      setSubmitted(true);
      setData(prev => prev ? { ...prev, review_submitted_at: new Date().toISOString() } : prev);
    }
    setSubmitting(false);
  }

  function handlePostToGoogle() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener");
  }

  // ── Styles ──────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px", background: "#08080e",
  };
  const card: React.CSSProperties = {
    width: "100%", maxWidth: 440,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: "28px 24px",
  };

  if (notFound) return (
    <div style={page}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚠</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>This review link wasn't found or has expired.</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={page}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>
    </div>
  );

  const isApproved = data.review_status === "approved";
  const customerName = data.bookings?.first_name;
  const serviceDate  = data.bookings?.service_date;

  return (
    <div style={page}>
      <div style={card}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(126,200,227,0.6)", marginBottom: 4 }}>
            Simple Windows
          </div>
          <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
            {customerName ? `Thanks, ${customerName}!` : "Job Complete"}
          </h1>
          {serviceDate && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>
              Service on {formatDateFull(serviceDate)}
            </p>
          )}
        </div>

        {/* Review form */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, textAlign: "center", marginBottom: 18 }}>
            Use this or write your own review — and please select a star rating.
          </p>

          {/* Stars */}
          <div style={{ marginBottom: 18 }}>
            <StarPicker value={stars} onChange={setStars} />
            {stars > 0 && (
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][stars]}
              </p>
            )}
          </div>

          {/* Review text */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
              color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "12px 14px",
              resize: "vertical", fontFamily: "inherit", outline: "none",
              boxSizing: "border-box", lineHeight: 1.55,
            }}
          />
        </div>

        {/* Submit button */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!stars || !text.trim() || submitting}
            style={{
              width: "100%", background: "rgba(167,139,250,0.9)", border: "none",
              borderRadius: 10, color: "#08080e", fontSize: 13, fontWeight: 800,
              padding: "13px 0", cursor: (!stars || !text.trim() || submitting) ? "not-allowed" : "pointer",
              opacity: (!stars || !text.trim() || submitting) ? 0.45 : 1,
              transition: "opacity 0.15s", letterSpacing: "0.04em", marginBottom: 12,
            }}
          >
            {submitting ? "Saving…" : "Submit Review"}
          </button>
        ) : (
          <div style={{
            textAlign: "center", padding: "12px", background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, marginBottom: 12,
            fontSize: 12, color: "rgba(167,139,250,0.8)",
          }}>
            ✓ Review saved — thank you!
          </div>
        )}

        {/* Post to Google — only active after admin approval */}
        {isApproved ? (
          <div>
            <button
              onClick={handlePostToGoogle}
              style={{
                width: "100%", background: "rgba(126,200,227,0.12)",
                border: "1px solid rgba(126,200,227,0.35)", borderRadius: 10,
                color: "rgba(126,200,227,0.9)", fontSize: 13, fontWeight: 700,
                padding: "12px 0", cursor: "pointer", transition: "all 0.15s",
                letterSpacing: "0.04em",
              }}
            >
              {copied ? "✓ Text copied — just paste on Google!" : "Post to Google ↗"}
            </button>
            {copied && (
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                Your review text is copied — paste it when you get there.
              </p>
            )}
          </div>
        ) : submitted ? (
          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
            A Google posting link will be available here after review.
          </p>
        ) : null}

      </div>
    </div>
  );
}
