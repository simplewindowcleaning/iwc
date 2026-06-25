"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@/app/admin/types";
import { techDisplayName, PRICE_PER_WINDOW, PRICE_PER_WINDOW_EXTRA } from "@/lib/constants";

type Step = 0 | 1 | 2 | 3;
type InteriorDecision = "today" | "scheduled" | "declined" | null;

const ONSITE_RATE          = 12.50;
const ONSITE_WINDOW_CAP    = 40;
const DEPOSIT              = 10;
const RETAIL_RATE          = 20;
const INT_DISCOUNT         = 0.90;
const BOGO_RATE            = 0.50;
const SCREEN_RATE          = 2;
const SCREEN_LESSON_CREDIT = 1;

function fmtD(n: number) {
  if (!isFinite(n) || isNaN(n)) return "0.00";
  return n.toFixed(2);
}
function fmtI(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
function plural(n: number, word: string) {
  return `${n} ${word}${n !== 1 ? "s" : ""}`;
}
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function displayTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
function displayDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function Stepper({
  label, value, onChange, min = 0,
}: { label: string; value: number; onChange: React.Dispatch<React.SetStateAction<number>>; min?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => onChange(prev => Math.max(min, prev - 1))}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            color: "white", fontSize: 20, lineHeight: 1, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >−</button>
        <span style={{ fontSize: 26, fontWeight: 800, color: "white", minWidth: 28, textAlign: "center" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(prev => prev + 1)}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            color: "white", fontSize: 20, lineHeight: 1, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >+</button>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "white" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function WorkerBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#0d0d1c", borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "14px 32px", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
    }}>
      {children}
    </div>
  );
}

function ConfirmBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#0d0d1c", borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "22px 32px",
    }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function ThermometerChart({ avg, retailRate }: { avg: number; retailRate: number }) {
  const pos     = Math.min(1, Math.max(0, (avg / retailRate) ** 3));
  const posH    = `${(pos * 100).toFixed(2)}%`;
  const fillClr = pos < 0.15 ? "#16a34a" : pos < 0.35 ? "#65a30d" : pos < 0.6 ? "#ca8a04" : "#581c87";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      width: 68, flexShrink: 0, padding: "8px 8px",
      border: "1px solid #c4a870", borderRadius: 3, background: "#e8e0c8",
      gap: 3,
    }}>
      <span style={{ fontSize: 6, color: "#9a4040", fontFamily: "'Courier New',monospace", letterSpacing: "0.05em" }}>$20</span>
      <div style={{ flex: 1, width: "100%", minHeight: 100, position: "relative" }}>
        {/* tube — left-aligned inside box */}
        <div style={{ position: "absolute", left: 4, top: 0, bottom: 0, width: 14, border: "1px solid #c4a870", borderRadius: 7, overflow: "hidden", background: "rgba(180,40,40,0.05)" }}>
          {[0.25, 0.5, 0.75].map(t => (
            <div key={t} style={{ position: "absolute", bottom: `${t * 100}%`, left: 0, right: 0, height: 1, background: "rgba(180,140,80,0.3)" }} />
          ))}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: posH, background: fillClr, transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </div>
        {/* avg price label rides with the marker */}
        <div style={{
          position: "absolute", bottom: posH, left: 22,
          transform: "translateY(50%)",
          zIndex: 5, lineHeight: 1,
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#1a5c2a", fontFamily: "Georgia,'Times New Roman',serif", whiteSpace: "nowrap" }}>
            ${avg.toFixed(2)}
          </span>
          <span style={{ fontSize: 6, color: "#5a7a4a", fontFamily: "'Courier New',monospace", marginLeft: 2 }}>/win</span>
        </div>
      </div>
      <span style={{ fontSize: 6, color: "#2a6a2a", fontFamily: "'Courier New',monospace" }}>$0</span>
    </div>
  );
}

function ScriptCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FAFAF8", borderRadius: 24,
      padding: "44px 52px", maxWidth: 780, margin: "0 auto",
      boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        textTransform: "uppercase", color: "#94a3b8", marginBottom: 22,
      }}>
        {heading}
      </div>
      {children}
    </div>
  );
}

function ReadoutField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      <div style={{
        fontSize: 8, color: "#4a8a5a", letterSpacing: "0.2em",
        fontFamily: "'Courier New', monospace", textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        border: "1px solid rgba(0,150,40,0.45)",
        borderRadius: 3,
        padding: "8px 10px",
        background: "rgba(0,20,0,0.5)",
        fontFamily: "'Courier New', monospace",
        fontSize: 18, fontWeight: 700,
        color: "#7ecc8e",
        letterSpacing: "0.02em",
        textAlign: "center",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function JobCloseout() {
  const router = useRouter();
  const [authed, setAuthed]       = useState(false);
  const [password, setPassword]   = useState("");
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [step, setStep]           = useState<Step>(0);

  const [onsiteAdded, setOnsiteAdded]               = useState(0);
  const [freeGiven, setFreeGiven]                   = useState(0);
  const [remainingInteriors, setRemainingInteriors] = useState(0);
  const [screenHandlingEnabled, setScreenHandlingEnabled] = useState(false);
  const [screenCount, setScreenCount]                     = useState(0);
  const [tookScreenLesson, setTookScreenLesson]           = useState(false);
  const [recurringAccepted, setRecurringAccepted]   = useState(false);
  const [depositCollected, setDepositCollected]     = useState(false);
  const [interiorDecision, setInteriorDecision]     = useState<InteriorDecision>(null);
  const [saving, setSaving]                         = useState(false);

  type PromoCode = { code: string; notes: string | null; discount_type: string; discount_value: number; active: boolean };
  const [showPromoPanel, setShowPromoPanel] = useState(false);
  const [promoInput, setPromoInput]         = useState("");
  const [appliedPromo, setAppliedPromo]     = useState<PromoCode | null>(null);
  const [promoCodes, setPromoCodes]         = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading]     = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    const b = bookings.find(b => b.id === selectedId);
    if (!b) return;
    const bTotal   = Number(b.total_price ?? 0);
    const bWindows = b.window_count ?? 0;
    const minW = Math.max(1, Math.round(
      (bTotal - PRICE_PER_WINDOW_EXTRA * bWindows) / (PRICE_PER_WINDOW - PRICE_PER_WINDOW_EXTRA)
    ));
    setFreeGiven(minW);
    setScreenHandlingEnabled(false);
    setScreenCount(0);
    setTookScreenLesson(false);
  }, [selectedId, bookings]);

  useEffect(() => {
    const a = localStorage.getItem("worker_authed");
    const p = localStorage.getItem("worker_password") ?? "";
    if (!a) { router.replace("/login"); return; }
    setAuthed(true);
    setPassword(p);
  }, [router]);

  useEffect(() => {
    if (!authed || !password) return;
    fetch("/api/admin/bookings", {
      headers: { "x-admin-pw": password, "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(data => {
        const today = localToday();
        const jobs = ((data.bookings ?? []) as Booking[]).filter(
          b => b.service_date === today
        );
        setBookings(jobs);
      })
      .catch(console.error);
  }, [authed, password]);

  const booking = bookings.find(b => b.id === selectedId) ?? null;

  const baseWindows     = booking?.window_count ?? 0;
  const baseTotal       = Number(booking?.total_price ?? 0);
  const discountedAdds  = Math.min(onsiteAdded, Math.max(0, ONSITE_WINDOW_CAP - baseWindows));
  const fullPriceAdds   = Math.max(0, onsiteAdded - discountedAdds);
  const screenTotal     = screenCount * SCREEN_RATE;
  const screenCredit    = tookScreenLesson ? screenCount * SCREEN_LESSON_CREDIT : 0;
  const totalCharged    = discountedAdds * ONSITE_RATE + fullPriceAdds * RETAIL_RATE + screenTotal;
  const promoDiscount   = appliedPromo
    ? appliedPromo.discount_type === "percent"
      ? totalCharged * (appliedPromo.discount_value / 100)
      : Math.min(appliedPromo.discount_value, totalCharged)
    : 0;
  const adjustedTotal   = totalCharged - promoDiscount;
  const totalRevenue    = baseTotal + adjustedTotal;
  const totalWindows = baseWindows + onsiteAdded + freeGiven;
  const avg          = totalWindows > 0 ? totalRevenue / totalWindows : 0;
  const retailFull   = totalWindows * RETAIL_RATE;
  const nextPrice        = onsiteAdded * avg;
  const nextVisitGross   = totalWindows * avg;
  const firstOrderCredit = baseWindows * avg;

  const openPromoPanel = () => {
    setShowPromoPanel(p => !p);
    if (promoCodes.length === 0 && !promoLoading) {
      setPromoLoading(true);
      fetch("/api/admin/promo-codes", { headers: { "x-admin-pw": password } })
        .then(r => r.json())
        .then(d => { setPromoCodes(d.codes ?? []); setPromoLoading(false); })
        .catch(() => setPromoLoading(false));
    }
  };
  const applyPromo = (code: string) => {
    const found = promoCodes.find(p => p.code === code.trim().toUpperCase() && p.active);
    if (found) { setAppliedPromo(found); setShowPromoPanel(false); setPromoInput(""); }
  };
  const balanceDue   = Math.max(0, nextVisitGross - firstOrderCredit - DEPOSIT);
  const interiorTotal  = remainingInteriors * avg * INT_DISCOUNT;
  const interiorBogo   = interiorTotal * BOGO_RATE;
  const fullHouseNext  = nextPrice + interiorBogo;
  const fullHouseRetail = (totalWindows + remainingInteriors) * RETAIL_RATE;

  const saveAndAdvance = useCallback(async (decision: InteriorDecision) => {
    setSaving(true);
    try {
      await fetch("/api/admin/upsell", {
        method: "POST",
        headers: { "x-admin-pw": password, "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id:           selectedId,
          base_windows:         baseWindows,
          base_total:           baseTotal,
          onsite_windows_added: onsiteAdded,
          free_windows_given:   freeGiven,
          total_windows:        totalWindows,
          total_charged:        adjustedTotal,
          promo_code:           appliedPromo?.code ?? null,
          promo_discount:       promoDiscount || null,
          avg_per_window:       Math.round(avg * 100) / 100,
          recurring_accepted:   recurringAccepted,
          deposit_collected:    depositCollected,
          interior_decision:    decision,
          interior_windows:     remainingInteriors || null,
          interior_total:       decision === "today" ? Math.round(interiorTotal * 100) / 100 : null,
          screen_count:         screenCount || null,
          screen_total:         screenTotal || null,
          took_screen_lesson:   tookScreenLesson || null,
          screen_credit:        screenCredit || null,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setInteriorDecision(decision);
      setStep(3);
    }
  }, [
    password, selectedId, baseWindows, baseTotal, onsiteAdded, freeGiven,
    totalWindows, totalCharged, avg, recurringAccepted, depositCollected,
    remainingInteriors, interiorTotal,
    screenCount, screenTotal, tookScreenLesson, screenCredit,
  ]);

  const signOut = () => {
    localStorage.removeItem("worker_authed");
    localStorage.removeItem("worker_password");
    router.push("/login");
  };

  const resetFlow = () => {
    setStep(0); setSelectedId("");
    setOnsiteAdded(0); setFreeGiven(0); setRemainingInteriors(0);
    setRecurringAccepted(false); setDepositCollected(false); setInteriorDecision(null);
  };

  if (!authed) return null;

  // ─── STEP 0: Select today's job ────────────────────────────────────────
  if (step === 0) return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 35% 25%, #180a3a 0%, #06050f 45%, #080818 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
      padding: "44px 40px",
    }}>
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10, fontWeight: 600 }}>
          Simple Window Cleaning
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>
          Job Closeout
        </div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", marginTop: 8 }}>
          Select today&rsquo;s job to begin the closeout flow
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "56px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
            No jobs scheduled for today
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>
            Add a booking or check back when a job is on the calendar.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bookings.map(b => (
            <button
              key={b.id}
              onClick={() => { setSelectedId(b.id); setStep(1); }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20, padding: "30px 36px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(22,163,74,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 6 }}>
                  {b.first_name} {b.last_name}
                </div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)" }}>{b.address}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 5 }}>
                  {b.service_time} · {plural(b.window_count, "window")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#34d399" }}>
                  ${fmtD(Number(b.total_price))}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginTop: 4 }}>
                  booked total
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 40, textAlign: "center" }}>
        <button onClick={signOut} style={{
          background: "none", border: "none",
          color: "rgba(255,255,255,0.18)", fontSize: 13, cursor: "pointer",
        }}>
          Sign out
        </button>
      </div>
    </div>
  );

  // ─── STEP 1: Service Record Document ───────────────────────────────────
  if (step === 1) {
    const canShowOffer    = onsiteAdded > 0 || freeGiven > 0;
    const depositRequired = onsiteAdded > 0;
    const canProceed      = canShowOffer
      ? (recurringAccepted && (!depositRequired || depositCollected))
      : recurringAccepted;
    const docDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const delta = Math.round((1 - (totalWindows > 0 ? avg / RETAIL_RATE : 1)) * 100);

    const SummaryRow = ({ label, value, underline, valueColor }: { label: string; value: string; underline?: boolean; valueColor?: string }) => (
      <div style={{ display: "flex", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid rgba(196,168,112,0.3)", background: underline ? "rgba(196,168,112,0.1)" : undefined }}>
        <span style={{ fontSize: 8, color: "#9a7a48", letterSpacing: "0.12em", fontWeight: 700, minWidth: 110, fontFamily: "'Courier New',monospace", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
        <div style={{ flex: 1, borderBottom: "1px dotted #c8aa74", margin: "0 6px 2px" }} />
        <span style={{ fontSize: 13, color: valueColor ?? "#000", fontFamily: "'Courier New',monospace", fontWeight: underline ? 800 : 600, textDecoration: underline ? "underline" : undefined }}>{value}</span>
      </div>
    );

    const FormCheck = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
      <label onClick={onToggle} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", flex: 1 }}>
        <div style={{
          width: 15, height: 15, border: "1.5px solid #9a7a48", borderRadius: 2,
          flexShrink: 0, marginTop: 1, background: checked ? "#2d5a1b" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {checked && <span style={{ color: "#d4f0c0", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: 11, color: "#000", fontFamily: "'Courier New',monospace", lineHeight: 1.45 }}>{label}</span>
      </label>
    );

    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: "#070712",
        fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
      }}>
        <style>{`
          @keyframes iwcBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }
          .iwc-blink { animation: iwcBlink 1.6s ease-in-out infinite; }
        `}</style>

        <WorkerBar>
          <Stepper label="On-site added" value={onsiteAdded} onChange={setOnsiteAdded} />

          {/* Screen Handling */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 18, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
            <div
              onClick={() => { setScreenHandlingEnabled(p => { if (p) { setScreenCount(0); setTookScreenLesson(false); } return !p; }); }}
              style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
            >
              <div style={{
                width: 13, height: 13, borderRadius: 3, border: "1.5px solid rgba(255,255,255,0.28)",
                background: screenHandlingEnabled ? "#60a5fa" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {screenHandlingEnabled && <span style={{ color: "white", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                Screen Handling
              </span>
            </div>

            {screenHandlingEnabled && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => setScreenCount(prev => Math.max(0, prev - 1))} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
                  <span style={{ fontSize: 19, fontWeight: 800, color: "white", minWidth: 18, textAlign: "center" }}>{screenCount}</span>
                  <button onClick={() => setScreenCount(prev => prev + 1)} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em" }}>@ $2 ea</span>
                  {screenCount > 0 && <span style={{ fontSize: 10, color: "#7EC8E3", fontWeight: 700 }}>${fmtD(screenTotal)}</span>}
                </div>

                <div
                  onClick={() => setTookScreenLesson(p => !p)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 7, cursor: "pointer" }}
                >
                  <div style={{
                    width: 11, height: 11, borderRadius: 2, border: "1.5px solid rgba(255,255,255,0.2)",
                    background: tookScreenLesson ? "#10b981" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>
                    {tookScreenLesson && <span style={{ color: "white", fontSize: 7, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 8, color: tookScreenLesson ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
                    Took lesson · stages next visit
                    {tookScreenLesson && screenCount > 0 && (
                      <span style={{ color: "rgba(52,211,153,0.55)", display: "block" }}>removes screens from next visit + credits today</span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
            <Stat label="Total windows" value={String(totalWindows)} />
            <Stat label="Charged today" value={`$${fmtD(adjustedTotal)}`} color="#34d399" />
            <Stat label="Avg / window" value={`$${fmtD(avg)}`} color="#7EC8E3" />
            <Stat label="Retail would be" value={`$${fmtI(retailFull)}`} color="rgba(255,255,255,0.3)" />
          </div>
        </WorkerBar>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", padding: "16px 32px 20px", overflowY: "auto" }}>
          {/* ── Clipboard Document ── */}
          <div style={{
            width: "100%",
            background: "#f8f2e2",
            border: "1.5px solid #b59565",
            borderRadius: 4,
            boxShadow: "3px 5px 20px rgba(0,0,0,0.45)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            zoom: 1.18,
          }}>

            {/* Perforations */}
            <div style={{
              height: 14, borderRadius: "3px 3px 0 0",
              background: "#ece5cc", borderBottom: "1px solid #c4a870",
              display: "flex", alignItems: "center", paddingLeft: 8, gap: 6, overflow: "hidden",
            }}>
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#b09060", opacity: 0.5, flexShrink: 0 }} />
              ))}
            </div>

            {/* Document Header */}
            <div style={{
              padding: "10px 20px 8px",
              borderBottom: "2px solid #b59565",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  onClick={openPromoPanel}
                  style={{
                    width: 36, height: 36, borderRadius: 5, overflow: "hidden", flexShrink: 0, cursor: "pointer",
                    border: `1.5px solid ${appliedPromo ? "#1e8a3a" : showPromoPanel ? "#5a9a6a" : "#b59565"}`,
                    boxShadow: appliedPromo ? "0 0 8px rgba(0,160,60,0.5)" : "none",
                  }}
                >
                  <img src="/icon.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1208", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Georgia,serif" }}>
                    Simple Window Cleaning
                  </div>
                  <div style={{ fontSize: 8, color: "#7a5e30", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Courier New',monospace" }}>
                    Santa Cruz · Silicon Valley · Est. 2016
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1208", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Georgia,serif" }}>
                  Service Record
                </div>
                <div style={{ fontSize: 9, color: "#7a5e30", fontFamily: "'Courier New',monospace", letterSpacing: "0.08em" }}>
                  {docDate} · IWC·NET VERIFIED
                </div>
              </div>
            </div>

            {/* Promo Panel */}
            {showPromoPanel && (
              <div style={{ borderBottom: "1px solid #c4a870", background: "#0a160a", padding: "10px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#4a8060", fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>
                    Worker Exclusive · Promo Codes
                  </span>
                  <button onClick={() => setShowPromoPanel(false)} style={{ background: "none", border: "none", color: "#4a8060", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
                </div>
                {promoLoading ? (
                  <div style={{ fontSize: 10, color: "#4a7060", fontFamily: "'Courier New',monospace", marginBottom: 8 }}>Loading…</div>
                ) : promoCodes.filter(p => p.active).length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {promoCodes.filter(p => p.active).map(pc => (
                      <button key={pc.code} onClick={() => applyPromo(pc.code)} style={{
                        background: "rgba(0,140,40,0.15)", border: "1px solid rgba(0,140,40,0.3)", borderRadius: 3,
                        padding: "4px 10px", cursor: "pointer", color: "#7ecc8e",
                        fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: "0.1em",
                      }}>
                        {pc.code}{pc.notes ? ` · ${pc.notes}` : ""}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "#4a7060", fontFamily: "'Courier New',monospace", marginBottom: 8 }}>No active codes — add them in Admin.</div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") applyPromo(promoInput); }}
                    placeholder="ENTER CODE"
                    style={{
                      flex: 1, background: "rgba(0,30,0,0.5)", border: "1px solid rgba(0,140,40,0.3)",
                      borderRadius: 3, padding: "6px 10px", color: "#7ecc8e",
                      fontFamily: "'Courier New',monospace", fontSize: 11, outline: "none", letterSpacing: "0.1em",
                    }}
                  />
                  <button onClick={() => applyPromo(promoInput)} style={{
                    background: "rgba(0,140,40,0.2)", border: "1px solid rgba(0,140,40,0.3)",
                    borderRadius: 3, padding: "6px 14px", color: "#7ecc8e",
                    fontFamily: "'Courier New',monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em",
                  }}>APPLY</button>
                </div>
              </div>
            )}

            {/* ── 3-column: Client | Transaction Module | Technician ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", borderBottom: "1px solid #c4a870" }}>

              {/* Client */}
              <div style={{ padding: "10px 16px", borderRight: "1px solid #c4a870" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "#7a5e30", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Courier New',monospace", marginBottom: 7, paddingBottom: 4, borderBottom: "1px solid #d4b880" }}>
                  Client Information
                </div>
                {[
                  { label: "NAME",    value: `${booking?.first_name ?? "—"} ${booking?.last_name ?? ""}`.trim() },
                  { label: "ADDRESS", value: booking?.address ?? "—" },
                  { label: "DATE",    value: displayDate(booking?.service_date ?? "") },
                  { label: "TIME",    value: displayTime(booking?.service_time ?? "") },
                  { label: "WINDOWS", value: `${baseWindows} exterior` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 7, color: "#9a7a48", letterSpacing: "0.12em", minWidth: 48, fontWeight: 700, paddingTop: 2, fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#000", fontFamily: "'Courier New',monospace", lineHeight: 1.35 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Transaction Module */}
              <div style={{ padding: "10px 14px", borderRight: "1px solid #c4a870", display: "flex", flexDirection: "column" }}>
                <div style={{
                  background: "#0a160a", border: "1px solid rgba(0,140,40,0.35)",
                  borderRadius: 4, flex: 1, display: "flex", flexDirection: "column",
                }}>
                  {/* Module header */}
                  <div style={{
                    padding: "6px 10px", borderBottom: "1px solid rgba(0,140,40,0.2)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 7, color: "#4a8060", letterSpacing: "0.2em", fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>
                      Transaction Module
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 7, color: "#4a8060", fontFamily: "'Courier New',monospace" }}>
                      <span className="iwc-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#3cb85c", display: "inline-block" }} />
                      CONNECTED
                    </span>
                  </div>
                  {/* Data grid */}
                  <div style={{ padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
                      {(appliedPromo ? [
                        { label: "WINDOWS",  value: String(totalWindows) },
                        { label: "ORIGINAL", value: `$${fmtD(totalCharged)}` },
                        { label: "PROMO OFF", value: `-$${fmtD(promoDiscount)}` },
                        { label: "FINAL",    value: `$${fmtD(adjustedTotal)}` },
                        { label: "SAVINGS",  value: `$${fmtD(retailFull - totalRevenue)}` },
                      ] : [
                        { label: "WINDOWS", value: String(totalWindows) },
                        { label: "CHARGED", value: `$${fmtD(adjustedTotal)}` },
                        { label: "AVG/WIN", value: `$${fmtD(avg)}` },
                        { label: "RETAIL",  value: `$${fmtI(retailFull)}` },
                        { label: "SAVINGS", value: `$${fmtD(retailFull - totalRevenue)}` },
                      ]).map(({ label, value }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 6, color: "#4a7a58", letterSpacing: "0.12em", marginBottom: 3, fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>{label}</div>
                          <div style={{ border: "1px solid rgba(0,140,40,0.3)", borderRadius: 2, padding: "5px 2px", background: "rgba(0,12,0,0.45)", fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700, color: "#7ecc8e" }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Status line */}
                  <div style={{ padding: "5px 10px", borderTop: "1px solid rgba(0,140,40,0.2)", fontFamily: "'Courier New',monospace", fontSize: 7, color: "#4a7a58", letterSpacing: "0.08em", display: "flex", gap: 8 }}>
                    <span>RATE <strong style={{ color: "#7ecc8e" }}>${fmtD(avg)}/WIN</strong></span>
                    <span>·</span>
                    <span><strong style={{ color: "#7ecc8e" }}>{delta}%</strong> BELOW RETAIL</span>
                    {appliedPromo && <><span>·</span><span>CODE <strong style={{ color: "#7ecc8e" }}>{appliedPromo.code}</strong></span></>}
                    <span>·</span>
                    <span>VERIFIED ✓</span>
                  </div>
                </div>
              </div>

              {/* Technician */}
              <div style={{ padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <img src="/badge.jpg" alt="Technician" style={{ width: 56, height: 56, borderRadius: 5, objectFit: "cover", objectPosition: "top", border: "1.5px solid #b59565", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "#7a5e30", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Courier New',monospace", marginBottom: 7, paddingBottom: 4, borderBottom: "1px solid #d4b880" }}>
                    Technician
                  </div>
                  {[
                    { label: "NAME",     value: techDisplayName("C.J. Vinson") },
                    { label: "VEHICLE",  value: "2016 Ford Transit · Black" },
                    { label: "BG CHECK", value: "Current (1/26)" },
                    { label: "CERT",     value: "Ladder-Free Specialist" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 7, color: "#9a7a48", letterSpacing: "0.12em", minWidth: 48, fontWeight: 700, paddingTop: 2, fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>{label}</span>
                      <span style={{ fontSize: 13, color: "#000", fontFamily: "'Courier New',monospace", lineHeight: 1.35 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 2-column: Service Summary | Offer Box ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #c4a870" }}>

              {/* Service Summary */}
              <div style={{ padding: "10px 16px", borderRight: "1px solid #c4a870" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "#7a5e30", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Courier New',monospace", marginBottom: 7, paddingBottom: 4, borderBottom: "1px solid #d4b880" }}>
                  Service Summary
                </div>
                <SummaryRow label="WINDOWS ORDERED" value={`${baseWindows} exterior`} />
                <div style={{ paddingLeft: 4, paddingBottom: 4, borderBottom: "1px solid rgba(196,168,112,0.2)", marginBottom: 1 }}>
                  <span style={{ fontSize: 8, color: "#7a5e30", fontFamily: "'Courier New',monospace", fontStyle: "italic", letterSpacing: "0.06em" }}>
                    Prepaid online · ${fmtD(baseTotal)}
                  </span>
                </div>
                {onsiteAdded > 0 && (
                  <SummaryRow
                    label="ADDED ON-SITE"
                    value={fullPriceAdds > 0 ? `${discountedAdds} at $${ONSITE_RATE} · ${fullPriceAdds} at $${RETAIL_RATE}` : `${onsiteAdded} at $${ONSITE_RATE} each`}
                  />
                )}

                {/* Complimentary — inline mini tally */}
                <div style={{ padding: "5px 0", borderBottom: "1px solid rgba(196,168,112,0.3)" }}>
                  <div style={{ fontSize: 7, color: "#7a5e30", letterSpacing: "0.14em", fontWeight: 700, fontFamily: "'Courier New',monospace", textTransform: "uppercase", marginBottom: 4 }}>
                    Complimentary
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 7, color: "#9a7a48", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>
                      1st Year Promo
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <button onClick={() => setFreeGiven(prev => Math.max(0, prev - 1))} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #c4a870", background: "transparent", color: "#9a7a48", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>−</button>
                      <span style={{ fontSize: 13, color: "#000", fontFamily: "'Courier New',monospace", fontWeight: 700, minWidth: 14, textAlign: "center" }}>{freeGiven}</span>
                      <button onClick={() => setFreeGiven(prev => prev + 1)} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #c4a870", background: "transparent", color: "#9a7a48", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>+</button>
                      <span style={{ fontSize: 11, color: "#000", fontFamily: "'Courier New',monospace", marginLeft: 3 }}>
                        {freeGiven > 0 ? `${freeGiven} win free` : "none"}
                      </span>
                    </div>
                  </div>
                </div>

                {screenCount > 0 && (
                  <div style={{ padding: "4px 0", borderBottom: "1px solid rgba(196,168,112,0.3)" }}>
                    <SummaryRow label="SCREEN HANDLING" value={`${screenCount} × $${SCREEN_RATE} = $${fmtD(screenTotal)}`} />
                    {tookScreenLesson && (
                      <div style={{ paddingLeft: 4, paddingBottom: 2 }}>
                        <span style={{ fontSize: 7, color: "#5a7a50", fontFamily: "'Courier New',monospace", fontStyle: "italic", letterSpacing: "0.06em" }}>
                          lesson credit: −${screenCredit.toFixed(2)} at next arrival (screens staged)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(([
                  { label: "TOTAL WINDOWS",  value: String(totalWindows) },
                  ...(appliedPromo ? [
                    { label: "SUBTOTAL",     value: `$${fmtD(totalCharged)}` },
                    { label: `CODE ${appliedPromo.code}`, value: `-$${fmtD(promoDiscount)}` },
                  ] : []),
                  { label: "TOTAL CHARGED",  value: `$${fmtD(adjustedTotal)}`, underline: true },
                  { label: "AVG / WINDOW",   value: `$${fmtD(avg)}` },
                  { label: "RETAIL VALUE",   value: `$${fmtI(retailFull)}` },
                  ...(retailFull > totalRevenue ? [{ label: "YOUR SAVINGS", value: `$${fmtD(retailFull - totalRevenue)}`, valueColor: "#16a34a" }] : []),
                ] as Array<{ label: string; value: string; underline?: boolean; valueColor?: string }>).map(({ label, value, underline, valueColor }) => (
                  <SummaryRow key={label} label={label} value={value} underline={underline} valueColor={valueColor} />
                )))}
              </div>

              {/* Offer Box — PowerPoint Slide */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Slide header */}
                <div style={{ background: "#1e4a14", color: "#d4f0c0", padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Courier New',monospace" }}>
                    {canShowOffer ? (depositRequired ? "Six-Month Locked Rate Offer" : "Next Visit — Book Now!") : "Price Analysis"}
                  </span>
                  <span style={{ fontSize: 7, fontFamily: "'Courier New',monospace", color: "rgba(212,240,192,0.5)", letterSpacing: "0.08em" }}>
                    IWC·NET AUTHORIZED
                  </span>
                </div>

                {/* Slide body */}
                <div style={{ padding: "10px 12px", background: "#f0ead4", display: "flex", gap: 10, alignItems: "stretch" }}>
                  {/* Thermometer box */}
                  <ThermometerChart avg={avg} retailRate={RETAIL_RATE} />

                  {/* Content box */}
                  <div style={{ flex: 1, border: "1px solid #c4a870", borderRadius: 3, background: "#e8e0c8", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* vs retail header */}
                    <div style={{ fontSize: 7, color: "#9a4040", fontFamily: "'Courier New',monospace", letterSpacing: "0.06em", paddingBottom: 5, marginBottom: 4, borderBottom: "1px solid rgba(196,168,112,0.4)" }}>
                      vs <span style={{ textDecoration: "line-through" }}>${RETAIL_RATE}</span> retail
                      {delta > 0 && <span style={{ color: "#16a34a", fontWeight: 700 }}> · {delta}% BELOW</span>}
                    </div>

                    {canShowOffer ? (
                      depositRequired ? (
                        /* ── Deposit offer: full breakdown ── */
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {/* Today's total vs retail */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid rgba(196,168,112,0.25)" }}>
                            <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              Today&apos;s total
                            </span>
                            <span style={{ fontSize: 10, color: "#1a1208", fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
                              ${fmtD(adjustedTotal)}<span style={{ fontSize: 7, color: "#9a7a48", fontWeight: 400, textDecoration: "line-through", marginLeft: 5 }}>${fmtI(retailFull)} retail</span>
                            </span>
                          </div>
                          {/* Gross */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid rgba(196,168,112,0.25)" }}>
                            <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              Next visit · {totalWindows} win
                            </span>
                            <span style={{ fontSize: 10, color: "#1a1208", fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
                              ${fmtD(nextVisitGross)}
                            </span>
                          </div>
                          {/* First order credit */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid rgba(196,168,112,0.25)" }}>
                            <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              First order total
                            </span>
                            <span style={{ fontSize: 10, color: "#1a5c2a", fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
                              −${fmtD(firstOrderCredit)}
                            </span>
                          </div>
                          {/* Prepay deposit */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px dashed #c4a870" }}>
                            <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              Prepay ${DEPOSIT}
                            </span>
                            <span style={{ fontSize: 10, color: "#1a5c2a", fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
                              −${fmtD(DEPOSIT)}
                            </span>
                          </div>
                          {/* Final total */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 5 }}>
                            <div>
                              <div style={{ fontSize: 7, color: "#1e4a14", fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.3 }}>
                                Next Visit Booked Now
                              </div>
                              <div style={{ fontSize: 6, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.06em" }}>
                                ${DEPOSIT} deposit · balance at service
                              </div>
                              <div style={{ fontSize: 6, color: "#9a7a48", fontFamily: "'Courier New',monospace", fontStyle: "italic", marginTop: 3 }}>
                                *valid 7 months
                              </div>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: "#1a5c2a", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                              ${fmtD(balanceDue)}
                            </div>
                          </div>

                          {/* Screen handling on next visit */}
                          {screenCount > 0 && (
                            <div style={{ borderTop: "1px dashed #c4a870", marginTop: 5, paddingTop: 4, display: "flex", flexDirection: "column", gap: 0 }}>
                              {tookScreenLesson ? (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0" }}>
                                    <span style={{ fontSize: 7, color: "#5a7a50", fontFamily: "'Courier New',monospace", fontStyle: "italic", letterSpacing: "0.06em" }}>− next-visit screens (staged)</span>
                                    <span style={{ fontSize: 9, color: "#1a5c2a", fontFamily: "'Courier New',monospace", fontWeight: 700 }}>−${fmtD(screenTotal)}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0", borderBottom: "1px solid rgba(196,168,112,0.3)" }}>
                                    <span style={{ fontSize: 7, color: "#5a7a50", fontFamily: "'Courier New',monospace", fontStyle: "italic", letterSpacing: "0.06em" }}>− today&apos;s screens · credit</span>
                                    <span style={{ fontSize: 9, color: "#1a5c2a", fontFamily: "'Courier New',monospace", fontWeight: 700 }}>−${fmtD(screenTotal)}</span>
                                  </div>
                                </>
                              ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0", borderBottom: "1px solid rgba(196,168,112,0.3)" }}>
                                  <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>+ screen handling ({screenCount} screens)</span>
                                  <span style={{ fontSize: 9, color: "#1a1208", fontFamily: "'Courier New',monospace", fontWeight: 700 }}>+${fmtD(screenTotal)}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                                <span style={{ fontSize: 7, color: "#1e4a14", fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                  {tookScreenLesson ? "With Staging" : "With Screens"}
                                </span>
                                <div style={{ fontSize: 22, fontWeight: 900, color: "#1a5c2a", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                                  ${fmtD(tookScreenLesson ? balanceDue - screenTotal : balanceDue + screenTotal)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── No-deposit offer (freeGiven only) ── */
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px dashed #c4a870" }}>
                            <span style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                              Next visit · {totalWindows} win
                            </span>
                            <span style={{ fontSize: 10, color: "#1a1208", fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
                              ${fmtD(nextVisitGross)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 5 }}>
                            <div>
                              <div style={{ fontSize: 7, color: "#1e4a14", fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.3 }}>
                                Next Visit Booked Now
                              </div>
                              <div style={{ fontSize: 6, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.06em" }}>
                                Rate locked · no deposit
                              </div>
                              <div style={{ fontSize: 6, color: "#9a7a48", fontFamily: "'Courier New',monospace", fontStyle: "italic", marginTop: 3 }}>
                                *valid 7 months
                              </div>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: "#1a5c2a", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                              ${fmtD(nextVisitGross)}
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      /* ── No offer ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[
                          `STANDARD VISIT · RATE ON FILE`,
                          `ADD WINDOWS TO UNLOCK SAVINGS`,
                          `YOUR RATE IS ALWAYS WAITING`,
                        ].map((pt, i) => (
                          <div key={i} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
                            <span style={{ color: "#1e4a14", fontSize: 7, flexShrink: 0 }}>▸</span>
                            <span style={{ fontSize: 8, color: "#1a1208", fontFamily: "'Courier New',monospace", letterSpacing: "0.04em", lineHeight: 1.35 }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sign-Off Row ── */}
            <div style={{ padding: "8px 20px", borderBottom: "1px dashed #c4a870" }}>
              <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "#7a5e30", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Courier New',monospace", marginBottom: 6 }}>
                Technician Sign-Off
              </div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                {canShowOffer ? (
                  <>
                    <FormCheck
                      label={depositRequired
                        ? `Customer confirms next exterior at $${fmtD(balanceDue)} due at service`
                        : "Customer schedules next visit now to lock this rate"}
                      checked={recurringAccepted}
                      onToggle={() => setRecurringAccepted(!recurringAccepted)}
                    />
                    {depositRequired && (
                      <FormCheck
                        label="$10 deposit collected via Venmo"
                        checked={depositCollected}
                        onToggle={() => setDepositCollected(!depositCollected)}
                      />
                    )}
                  </>
                ) : (
                  <FormCheck
                    label="Service complete — locked-rate offer not applicable (no on-site additions)"
                    checked={recurringAccepted}
                    onToggle={() => setRecurringAccepted(!recurringAccepted)}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: "#ece5cc", borderRadius: "0 0 3px 3px", padding: "5px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.12em" }}>
                {canShowOffer
                  ? depositRequired
                    ? `$10 deposit due today via Venmo · $${fmtD(balanceDue)} balance due at service · Valid 7 months`
                    : `Rate locked at $${fmtD(avg)}/win · Schedule next visit now · Valid 7 months`
                  : "Thank you for your business · SimpleWindowCleaning.com"}
              </div>
              <div style={{ fontSize: 7, color: "#9a7a48", fontFamily: "'Courier New',monospace", letterSpacing: "0.16em" }}>
                COPY 1 OF 5
              </div>
            </div>
          </div>
        </div>

        <ConfirmBar>
          <button
            onClick={() => canProceed && setStep(2)}
            disabled={!canProceed}
            style={{
              width: "100%", padding: "21px",
              background: canProceed ? "#16a34a" : "rgba(255,255,255,0.05)",
              border: "none", borderRadius: 16,
              fontSize: 18, fontWeight: 700,
              color: canProceed ? "white" : "rgba(255,255,255,0.18)",
              cursor: canProceed ? "pointer" : "default",
              transition: "all 0.2s", letterSpacing: "0.01em",
            }}
          >
            {canShowOffer ? "Lock This Rate & Collect Deposit →" : "Finish & Move to Interior Check →"}
          </button>
        </ConfirmBar>
      </div>
    );
  }

  // ─── STEP 2: Interior Upsell ────────────────────────────────────────────
  if (step === 2) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#070712",
      fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
    }}>
      <WorkerBar>
        <Stepper label="Remaining interiors" value={remainingInteriors} onChange={setRemainingInteriors} />
        {remainingInteriors > 0 && (
          <div style={{ display: "flex", gap: 24 }}>
            <Stat label="On-site price" value={`$${fmtD(interiorTotal)}`} color="#34d399" />
            <Stat label="BOGO next visit" value={`$${fmtD(interiorBogo)}`} color="#7EC8E3" />
            <Stat label="Full house next" value={`$${fmtD(fullHouseNext)}`} color="#a78bfa" />
          </div>
        )}
      </WorkerBar>

      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <ScriptCard heading="Interior Opportunity">
          {remainingInteriors === 0 ? (
            <p style={{ fontSize: 19, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              Set the number of remaining interior windows above to see the offer, or skip below.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 20, color: "#1e293b", lineHeight: 1.75, margin: "0 0 28px" }}>
                One more thing — you noticed how well we do interiors. I actually have time today
                and can do the remaining <strong>{plural(remainingInteriors, "window")}</strong> for{" "}
                <span style={{ fontSize: 26, fontWeight: 800, color: "#16a34a" }}>${fmtD(interiorTotal)}</span>{" "}
                with an on-site promo — that&rsquo;s 10% off today&rsquo;s average since I&rsquo;m already here.
                It&rsquo;s more labor-intensive so the price doesn&rsquo;t get much better than that, but I&rsquo;ll
                rinse the tracks and show you the maintenance routine too.
              </p>

              <div style={{
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                border: "1.5px solid #93c5fd",
                borderRadius: 18, padding: "26px 30px", marginBottom: 20,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: "#1d4ed8", marginBottom: 12,
                }}>
                  The Bonus
                </div>
                <p style={{ fontSize: 19, color: "#1e293b", lineHeight: 1.75, margin: 0 }}>
                  Doing them today also unlocks a <strong>50% interior bonus</strong> — next visit those{" "}
                  {remainingInteriors} windows come back for only{" "}
                  <strong>${fmtD(interiorBogo)}</strong>. Combined with your locked exterior, your
                  entire home next time would be just{" "}
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>${fmtD(fullHouseNext)}</span>{" "}
                  instead of{" "}
                  <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>${fmtI(fullHouseRetail)}</span>.
                </p>
              </div>
            </>
          )}
        </ScriptCard>
      </div>

      <ConfirmBar>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {remainingInteriors > 0 && (
            <button
              onClick={() => saveAndAdvance("today")}
              disabled={saving}
              style={{
                width: "100%", padding: "21px",
                background: "#16a34a", border: "none", borderRadius: 16,
                fontSize: 18, fontWeight: 700, color: "white",
                cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              Yes — Add Interiors Today (${fmtD(interiorTotal)})
            </button>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => saveAndAdvance("scheduled")}
              disabled={saving}
              style={{
                flex: 1, padding: "18px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16, fontSize: 15, fontWeight: 600,
                color: "rgba(255,255,255,0.75)", cursor: "pointer",
              }}
            >
              Schedule for Later This Week
            </button>
            <button
              onClick={() => saveAndAdvance("declined")}
              disabled={saving}
              style={{
                flex: 1, padding: "18px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, fontSize: 15, fontWeight: 600,
                color: "rgba(255,255,255,0.3)", cursor: "pointer",
              }}
            >
              No Thanks
            </button>
          </div>
        </div>
      </ConfirmBar>
    </div>
  );

  // ─── STEP 3: Closeout Summary ───────────────────────────────────────────
  const interiorLine = interiorDecision === "today"
    ? `Added today · $${fmtD(interiorTotal)} · BOGO credits active`
    : interiorDecision === "scheduled" ? "Scheduling for later this week"
    : "Declined";

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 30%, #0a200a 0%, #050510 40%, #080818 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
      padding: "44px 32px",
    }}>
      <div style={{ width: "100%", maxWidth: 660 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(22,163,74,0.15)", border: "2px solid #16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 32,
          }}>
            ✓
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>
            Closeout Complete
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
            {booking?.first_name} {booking?.last_name} · {booking?.address}
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 24, padding: "40px 44px", marginBottom: 24,
        }}>
          {[
            { label: "Windows cleaned",    value: plural(totalWindows, "window") },
            { label: "Total charged",      value: `$${fmtD(totalCharged)}` },
            { label: "Avg per window",     value: `$${fmtD(avg)}` },
            { label: "Recurring locked",   value: recurringAccepted ? `$${fmtD(balanceDue)} next visit` : "Not locked" },
            { label: "Deposit",            value: depositCollected ? "$10 collected" : "Not collected" },
            { label: "Interior decision",  value: interiorLine },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", letterSpacing: "0.05em" }}>
                {label}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={resetFlow}
          style={{
            width: "100%", padding: "20px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, fontSize: 16, fontWeight: 600,
            color: "rgba(255,255,255,0.5)", cursor: "pointer",
          }}
        >
          Start Next Job
        </button>
      </div>
    </div>
  );
}
