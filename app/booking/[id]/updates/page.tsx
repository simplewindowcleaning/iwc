"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, formatTime } from "@/lib/availability";

function UpdatesContent() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();

  const firstName = params.get("firstName") ?? "";
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function save(skip = false) {
    setSaving(true);
    setError("");
    try {
      if (!skip && (email.trim() || phone.trim())) {
        await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim() || null,
            phone: phone.trim() || null,
          }),
        });
      }
      setDone(true);
    } catch {
      setError("Something went wrong — you're still booked, don't worry.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-12 pt-24">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="glass-card p-8 text-center"
          style={{ maxWidth: 380, width: "100%" }}
        >
          <div
            className="mx-auto mb-5 flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(167,139,250,0.2)", border: "2px solid #a78bfa" }}
          >
            <Check size={28} color="#a78bfa" />
          </div>
          <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {firstName ? `You're all set, ${firstName}!` : "You're booked!"}
          </h2>
          {date && time && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
              We&apos;ll see you {formatDate(date)} at {formatTime(time)}.
            </p>
          )}
          {email && (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>
              Confirmation heading to <span style={{ color: "rgba(167,139,250,0.9)" }}>{email}</span>
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 pb-12" style={{ paddingTop: 88, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-4"
        >
          <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {firstName ? `Almost done, ${firstName}!` : "One more thing…"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
            {email ? "Confirm your email — change it here if you need to." : "Where should we send your receipt?"}
          </p>

          <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </motion.div>

        {/* Text updates value prop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="glass-card p-6 mb-5"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>
              Want real-time text updates?
            </h2>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
            Optional — but here&apos;s what you&apos;d get:
          </p>

          {[
            ["🌅", "Morning of", "Reminder + your arrival window"],
            ["🚗", "Tech on the way", "Name, photo, car make/model & background check badge"],
            ["👋", "On arrival", "Your tech has started"],
            ["✅", "All done", "Job complete summary"],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{title}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}

          <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 16, marginBottom: 6 }}>
            Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(831) 555-0100"
            autoComplete="tel"
            style={{
              width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15,
              outline: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6 }}>
            Only used for appointment updates — never shared.
          </p>
        </motion.div>

        {error && (
          <p style={{ color: "#f87171", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</p>
        )}

        <button
          className="book-btn w-full"
          onClick={() => save(false)}
          disabled={saving}
          style={{ opacity: saving ? 0.6 : 1, marginBottom: 12 }}
        >
          {saving ? "Saving…" : "Keep me updated →"}
        </button>

        <button
          onClick={() => save(true)}
          disabled={saving}
          style={{
            width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            fontSize: 13, cursor: "pointer", padding: "8px 0",
          }}
        >
          Skip, I&apos;m all set
        </button>
      </main>
    </div>
  );
}

export default function UpdatesPage() {
  return (
    <Suspense fallback={null}>
      <UpdatesContent />
    </Suspense>
  );
}
