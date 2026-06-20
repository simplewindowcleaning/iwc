"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, formatTime, formatPhone } from "@/lib/availability";
import { calcPrice } from "@/lib/constants";
import { SERVICE_AREAS } from "@/lib/serviceAreas";

function SummaryContent() {
  const router = useRouter();
  const params = useSearchParams();

  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const windows = Number(params.get("windows") ?? 1);
  const address = params.get("address") ?? "";
  const firstName = params.get("firstName") ?? "";
  const lastName = params.get("lastName") ?? "";
  const phone = params.get("phone") ?? "";
  const email = params.get("email") ?? "";
  const notes = params.get("notes") ?? "";
  const needsEstimate = params.get("needsEstimate") === "true";
  const estimateDeadline = params.get("estimateDeadline") ?? "";
  const zip = params.get("zip") ?? "95060";
  const minWindows = SERVICE_AREAS[zip]?.minWindows ?? 1;
  const total = calcPrice(windows, minWindows);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const venmoLink = `venmo://paycharge?txn=pay&recipients=SimpleWindowCleaning&amount=${total}&note=Window+cleaning+${encodeURIComponent(date)}`;

  async function completeBooking() {
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_date: date,
        service_time: time,
        window_count: windows,
        address,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        needs_estimate: needsEstimate,
        estimate_deadline: estimateDeadline || null,
        total_price: total,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
      setError("Couldn't save booking. Please try again or text us directly.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-12 pt-24">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="glass-card p-8 text-center"
          style={{ maxWidth: 360, width: "100%" }}
        >
          <div
            className="mx-auto mb-5 flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(167,139,250,0.2)", border: "2px solid #a78bfa" }}
          >
            <Check size={28} color="#a78bfa" />
          </div>
          <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You&apos;re booked!</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            We&apos;ll see you {formatDate(date)} at {formatTime(time)}.<br />
            {email && "A confirmation is on its way."}
          </p>
          <button className="ghost-btn" onClick={() => router.push("/")}>
            Back to home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 pt-4 pb-12" style={{ paddingTop: 80 }}>
        {/* Back button */}
        <button
          className="flex items-center gap-1 mb-5"
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => router.back()}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <h1 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Review your booking</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20 }}>Confirm the details below, then pay via Venmo.</p>

        {/* Recap card */}
        <motion.div
          className="glass-card p-4 mb-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Row label="Date" value={formatDate(date)} />
          <Row label="Time" value={formatTime(time)} />
          <Row label="Windows" value={`${windows} — $${total}`} />
          <Row label="Address" value={address} />
          {(firstName || lastName) && <Row label="Name" value={`${firstName} ${lastName}`.trim()} />}
          {phone && <Row label="Phone" value={formatPhone(phone)} />}
          {email && <Row label="Email" value={email} />}
          {needsEstimate && estimateDeadline && <Row label="Estimate by" value={estimateDeadline} />}
          {notes && <Row label="Notes" value={notes} />}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

          <div className="flex justify-between items-center">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Total due</span>
            <span style={{ color: "white", fontSize: 20, fontWeight: 800 }}>${total}</span>
          </div>
        </motion.div>

        {/* Venmo CTA */}
        <motion.div
          className="solid-card p-4 mb-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginBottom: 12 }}>
            Pay now via Venmo to lock in your slot. Tap below — it opens the Venmo app pre-filled.
          </p>
          <a
            href={venmoLink}
            className="book-btn w-full block text-center"
            style={{ display: "block", textDecoration: "none" }}
          >
            Pay ${total} on Venmo
          </a>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textAlign: "center", marginTop: 8 }}>
            Venmo @SimpleWindowCleaning — or pay in person day-of
          </p>
        </motion.div>

        {/* Complete booking */}
        {error && (
          <p style={{ color: "#f87171", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</p>
        )}

        <button
          className="book-btn w-full"
          onClick={completeBooking}
          disabled={submitting}
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Complete Booking"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center", marginTop: 8 }}>
          Saves your booking — no account required
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "white", fontSize: 12, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={null}>
      <SummaryContent />
    </Suspense>
  );
}
