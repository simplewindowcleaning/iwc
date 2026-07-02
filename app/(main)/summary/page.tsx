"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, formatTime, formatPhone } from "@/lib/availability";
import { calcPrice, applyPromo } from "@/lib/constants";
import { SERVICE_AREAS } from "@/lib/serviceAreas";

type PromoDiscount = { code: string; discount_type: string; discount_value: number; notes: string | null };

function SummaryContent() {
  const router = useRouter();
  const params = useSearchParams();

  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const windows = Number(params.get("windows") ?? 5);
  const address = params.get("address") ?? "";
  const firstName = params.get("firstName") ?? "";
  const lastName = params.get("lastName") ?? "";
  const phone = params.get("phone") ?? "";
  const email = params.get("email") ?? "";
  const notes = params.get("notes") ?? "";
  const needsEstimate = params.get("needsEstimate") === "true";
  const estimateDeadline = params.get("estimateDeadline") ?? "";
  const zip = params.get("zip") ?? "95060";
  const minWindows = SERVICE_AREAS[zip]?.minWindows ?? 5;
  const baseTotal = calcPrice(windows, minWindows);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const total = promoDiscount
    ? applyPromo(baseTotal, windows, minWindows, promoDiscount.discount_type as "percent" | "per_window" | "flat", promoDiscount.discount_value)
    : baseTotal;

  const venmoLink = `venmo://paycharge?txn=pay&recipients=SimpleWindowCleaning&amount=${total}&note=Window+cleaning+${encodeURIComponent(date)}`;

  async function applyPromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setCheckingPromo(true);
    setPromoError("");
    const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      setPromoDiscount(data);
      setPromoInput("");
    } else {
      setPromoError("Code not recognized.");
    }
    setCheckingPromo(false);
  }

  async function completeBooking(openVenmo = false) {
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
      await res.json().catch(() => ({}));
      setError("Couldn't save booking. Please try again or text us directly.");
      setSubmitting(false);
      return;
    }

    const { id: bookingId } = await res.json();
    setSubmitting(false);

    if (openVenmo) window.location.href = venmoLink;

    const nextParams = new URLSearchParams({
      firstName,
      date,
      time,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    });
    router.push(`/booking/${bookingId}/updates?${nextParams.toString()}`);
  }

  function discountLabel(d: PromoDiscount): string {
    if (d.discount_type === "percent") return `-${d.discount_value}%`;
    if (d.discount_type === "flat") return `-$${d.discount_value}`;
    if (d.discount_type === "per_window") return `$${d.discount_value}/window`;
    return "";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 pt-4 pb-12" style={{ paddingTop: 80 }}>
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
          <Row label="Windows" value={`${windows + 1} total`} />
          <Row label="" value={`${windows} exterior · 1 interior (free)`} />
          <Row label="Address" value={address} />
          {(firstName || lastName) && <Row label="Name" value={`${firstName} ${lastName}`.trim()} />}
          {phone && <Row label="Phone" value={formatPhone(phone)} />}
          {email && <Row label="Email" value={email} />}
          {needsEstimate && estimateDeadline && <Row label="Estimate by" value={estimateDeadline} />}
          {notes && <Row label="Notes" value={notes} />}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

          <div className="flex justify-between items-center">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Total due</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {promoDiscount && (
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textDecoration: "line-through" }}>${baseTotal}</span>
              )}
              <span style={{ color: promoDiscount ? "#86efac" : "white", fontSize: 20, fontWeight: 800 }}>${total}</span>
            </div>
          </div>

          {/* Applied promo badge */}
          {promoDiscount && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#86efac", fontWeight: 700, letterSpacing: "0.06em" }}>
                {promoDiscount.code} · {discountLabel(promoDiscount)}
              </span>
              <button
                onClick={() => setPromoDiscount(null)}
                style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Remove
              </button>
            </div>
          )}
        </motion.div>

        {/* Promo code input */}
        {!promoDiscount && (
          <motion.div
            className="glass-card p-4 mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Have a promo code?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                onKeyDown={e => e.key === "Enter" && applyPromoCode()}
                placeholder="ENTER CODE"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${promoError ? "rgba(251,113,133,0.5)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                  padding: "9px 12px", outline: "none", fontFamily: "inherit", letterSpacing: "0.06em",
                }}
              />
              <button
                onClick={applyPromoCode}
                disabled={!promoInput.trim() || checkingPromo}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: promoInput.trim() ? "rgba(167,139,250,0.9)" : "rgba(167,139,250,0.1)",
                  color: promoInput.trim() ? "#08080e" : "rgba(167,139,250,0.3)",
                  border: "none", cursor: promoInput.trim() ? "pointer" : "not-allowed", flexShrink: 0,
                  fontFamily: "inherit",
                }}
              >
                {checkingPromo ? "…" : "Apply"}
              </button>
            </div>
            {promoError && (
              <p style={{ fontSize: 11, color: "rgba(251,113,133,0.8)", marginTop: 6 }}>{promoError}</p>
            )}
          </motion.div>
        )}

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
          <button
            className="book-btn w-full"
            onClick={() => completeBooking(true)}
            disabled={submitting}
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Saving…" : `Pay $${total} on Venmo`}
          </button>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textAlign: "center", marginTop: 8 }}>
            Venmo @SimpleWindowCleaning — or pay in person day-of
          </p>
        </motion.div>

        {error && (
          <p style={{ color: "#f87171", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</p>
        )}

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
