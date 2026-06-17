"use client";

/**
 * PowerUserPanel — The original full booking form interface.
 * Saved for returning-customer / authenticated fast-checkout flow.
 * Not rendered in the main app (replaced by MapPanel + NPCWidget).
 * Wire back in at app/(main)/page.tsx when auth is added.
 */

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SlotPicker } from "@/components/SlotPicker";
import { EstimateToggle } from "@/components/EstimateToggle";
import { WindowCounter } from "@/components/WindowCounter";
import { ReviewsSection } from "@/components/ReviewsSection";
import { motion } from "framer-motion";

interface Props {
  selectedDate: string;
  selectedTime: string;
  needsEstimate: boolean;
  estimateDeadline: string;
  windowCount: number;
  address: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;

  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onNeedsEstimateChange: (v: boolean) => void;
  onEstimateDeadlineChange: (d: string) => void;
  onWindowCountChange: (n: number) => void;
  onAddressChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;

  onPointerDown?: () => void;
}

export function PowerUserPanel({
  selectedDate, selectedTime, needsEstimate, estimateDeadline,
  windowCount, address, firstName, lastName, phone, email, notes,
  onDateChange, onTimeChange, onNeedsEstimateChange, onEstimateDeadlineChange,
  onWindowCountChange, onAddressChange, onFirstNameChange, onLastNameChange,
  onPhoneChange, onEmailChange, onNotesChange, onPointerDown,
}: Props) {
  const router = useRouter();
  const canBook = Boolean(selectedDate && selectedTime && address.trim());

  function handleBook() {
    if (!canBook) return;
    const p = new URLSearchParams({
      date: selectedDate, time: selectedTime,
      windows: String(windowCount), address,
      firstName, lastName, phone, email, notes,
      needsEstimate: String(needsEstimate), estimateDeadline,
    });
    router.push(`/summary?${p.toString()}`);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }} onPointerDown={onPointerDown}>
      <AppHeader />

      <main className="flex-1 flex flex-col gap-3 px-4 pb-8" style={{ paddingTop: 72 }}>
        <SlotPicker
          selectedDate={selectedDate} selectedTime={selectedTime}
          onDateChange={onDateChange} onTimeChange={onTimeChange}
        />

        <EstimateToggle
          needsEstimate={needsEstimate} estimateDeadline={estimateDeadline}
          onChange={onNeedsEstimateChange} onDeadlineChange={onEstimateDeadlineChange}
        />

        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <WindowCounter count={windowCount} onChange={onWindowCountChange} />

          <div className="mb-3">
            <label className="field-label" htmlFor="pu-address">Service Address *</label>
            <input id="pu-address" className="field-input mt-1" type="text"
              placeholder="123 Main St, Santa Cruz, CA 95060"
              value={address} onChange={(e) => onAddressChange(e.target.value)}
              autoComplete="street-address" />
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="field-label" htmlFor="pu-first">First Name</label>
              <input id="pu-first" className="field-input mt-1" type="text" placeholder="Sam"
                value={firstName} onChange={(e) => onFirstNameChange(e.target.value)}
                autoComplete="given-name" />
            </div>
            <div className="flex-1">
              <label className="field-label" htmlFor="pu-last">Last Name</label>
              <input id="pu-last" className="field-input mt-1" type="text" placeholder="Taylor"
                value={lastName} onChange={(e) => onLastNameChange(e.target.value)}
                autoComplete="family-name" />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="field-label" htmlFor="pu-phone">Phone</label>
              <input id="pu-phone" className="field-input mt-1" type="tel" placeholder="(831) 555-0100"
                value={phone} onChange={(e) => onPhoneChange(e.target.value)}
                autoComplete="tel" />
            </div>
            <div className="flex-1">
              <label className="field-label" htmlFor="pu-email">Email</label>
              <input id="pu-email" className="field-input mt-1" type="email" placeholder="you@email.com"
                value={email} onChange={(e) => onEmailChange(e.target.value)}
                autoComplete="email" />
            </div>
          </div>

          <div className="mb-4">
            <label className="field-label" htmlFor="pu-notes">Notes</label>
            <textarea id="pu-notes" className="field-input mt-1" rows={2}
              placeholder="Gate code, special instructions…"
              value={notes} onChange={(e) => onNotesChange(e.target.value)}
              style={{ resize: "none" }} />
          </div>

          <button className="book-btn w-full" onClick={handleBook} disabled={!canBook}
            style={{ opacity: canBook ? 1 : 0.45, cursor: canBook ? "pointer" : "not-allowed" }}>
            Review &amp; Book — ${windowCount * 22}
          </button>

          {!canBook && (
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textAlign: "center", marginTop: 6 }}>
              Select a slot and enter your address to continue
            </p>
          )}
        </motion.div>
      </main>

      <ReviewsSection />
    </div>
  );
}
