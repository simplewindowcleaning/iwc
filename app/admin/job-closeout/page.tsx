"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@/app/admin/types";
import { techDisplayName, PRICE_PER_WINDOW, PRICE_PER_WINDOW_EXTRA } from "@/lib/constants";

type Step = 0 | 1 | 2 | 3;
type InteriorDecision = "today" | "scheduled" | "declined" | null;
type UpsellSession = {
  id: string; booking_id: string; completed_at: string;
  base_windows: number; base_total: number;
  onsite_windows_added: number; free_windows_given: number;
  total_charged: number;
  interior_windows: number | null; interior_total: number | null;
  interior_decision: string | null;
};

const ONSITE_RATE          = 12.50;
const ONSITE_WINDOW_CAP    = 40;
const DEPOSIT              = 10;
const RETAIL_RATE          = 20;
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
      background: "linear-gradient(90deg, #061C2E 0%, #0A2F48 100%)",
      borderBottom: "1px solid rgba(58,170,196,0.18)",
      padding: "14px 32px", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
    }}>
      {children}
    </div>
  );
}

function ConfirmBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(90deg, #061C2E 0%, #0A2F48 100%)",
      borderTop: "1px solid rgba(58,170,196,0.18)",
      padding: "22px 32px",
    }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function ThermometerChart({ avg, retailRate, tag, frozen }: { avg: number; retailRate: number; tag?: string; frozen?: boolean }) {
  const pos     = Math.min(1, Math.max(0, (avg / retailRate) ** 3));
  const posH    = `${(pos * 100).toFixed(2)}%`;
  const fillClr = frozen ? "#7ECAD8" : pos < 0.15 ? "#059669" : pos < 0.35 ? "#0D9488" : pos < 0.6 ? "#1278A0" : "#0A3D5C";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      width: 58, flexShrink: 0, padding: "6px 6px",
      border: "1px solid #A8D8E8", borderRadius: 6, background: "linear-gradient(180deg,#EBF7FA 0%,#D8F0F8 100%)",
      gap: 2,
    }}>
      <span style={{ fontSize: 6, color: "#0A3D5C", fontFamily: "'Courier New',monospace", letterSpacing: "0.05em", opacity: 0.5 }}>$20</span>
      <div style={{ flex: 1, width: "100%", minHeight: 90, position: "relative" }}>
        <div style={{ position: "absolute", left: 3, top: 0, bottom: 0, width: 12, border: "1px solid #7ECAD8", borderRadius: 6, overflow: "hidden", background: "rgba(10,61,92,0.04)" }}>
          {[0.25, 0.5, 0.75].map(t => (
            <div key={t} style={{ position: "absolute", bottom: `${t * 100}%`, left: 0, right: 0, height: 1, background: "rgba(18,120,160,0.2)" }} />
          ))}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: posH, background: fillClr, transition: frozen ? "none" : "height 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </div>
        <div style={{ position: "absolute", bottom: posH, left: 18, transform: "translateY(50%)", zIndex: 5, lineHeight: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#0A2740", fontFamily: "Georgia,'Times New Roman',serif", whiteSpace: "nowrap" }}>
            ${avg.toFixed(2)}
          </span>
          <span style={{ fontSize: 5, color: "#1278A0", fontFamily: "'Courier New',monospace", marginLeft: 1 }}>/win</span>
        </div>
      </div>
      <span style={{ fontSize: 6, color: "#059669", fontFamily: "'Courier New',monospace", opacity: 0.7 }}>$0</span>
      {tag && <span style={{ fontSize: 5, color: "#1278A0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>{tag}</span>}
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
  const [interiorsEnabled, setInteriorsEnabled]     = useState(false);
  const [interiorsAdded, setInteriorsAdded]         = useState(0);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [screenHandlingEnabled, setScreenHandlingEnabled] = useState(false);
  const [screenCount, setScreenCount]                     = useState(0);
  const [tookScreenLesson, setTookScreenLesson]           = useState(false);
  const [recurringAccepted, setRecurringAccepted]   = useState(false);
  const [depositCollected, setDepositCollected]     = useState(false);
  const [saving, setSaving]                         = useState(false);
  const [showThankYouModal, setShowThankYouModal]   = useState(false);
  const [lastSecondOpen, setLastSecondOpen]         = useState(false);
  const [rateAgreed, setRateAgreed]                 = useState(false);
  const [_frozenAvg, setFrozenAvg]                  = useState(0); // reserved for left thermometer re-insertion
  const [sessions, setSessions]                     = useState<UpsellSession[]>([]);
  const loadingFromSessionRef                       = useRef(false);

  // ── Beach video banner ──
  const videoRef                    = useRef<HTMLVideoElement>(null);
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => { videoRef.current?.play().catch(() => {}); }, [step]);

  type PromoCode = { code: string; notes: string | null; discount_type: string; discount_value: number; active: boolean };
  const [showPromoPanel, setShowPromoPanel] = useState(false);
  const [promoInput, setPromoInput]         = useState("");
  const [appliedPromo, setAppliedPromo]     = useState<PromoCode | null>(null);
  const [promoCodes, setPromoCodes]         = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading]     = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    if (loadingFromSessionRef.current) { loadingFromSessionRef.current = false; return; }
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
    setInteriorsEnabled(false);
    setInteriorsAdded(0);
    setShowThankYouModal(false);
    setLastSecondOpen(false);
    setRateAgreed(false);
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
    const h = { "x-admin-pw": password, "Content-Type": "application/json" };
    fetch("/api/admin/bookings", { headers: h })
      .then(r => r.json())
      .then(data => {
        const today = localToday();
        setBookings(((data.bookings ?? []) as Booking[]).filter(b => b.service_date === today));
      })
      .catch(console.error);
    fetch("/api/admin/upsell", { headers: h })
      .then(r => r.json())
      .then(data => setSessions((data.sessions ?? []) as UpsellSession[]))
      .catch(console.error);
  }, [authed, password]);

  const booking = bookings.find(b => b.id === selectedId) ?? null;

  const baseWindows     = booking?.window_count ?? 0;
  const baseTotal       = Number(booking?.total_price ?? 0);
  const discountedAdds  = Math.min(onsiteAdded, Math.max(0, ONSITE_WINDOW_CAP - baseWindows));
  const fullPriceAdds   = Math.max(0, onsiteAdded - discountedAdds);
  const screenTotal     = screenCount * SCREEN_RATE;
  const screenCredit    = tookScreenLesson ? screenCount * SCREEN_LESSON_CREDIT : 0;
  const interiorTotal   = interiorsAdded * ONSITE_RATE;
  const totalCharged    = discountedAdds * ONSITE_RATE + fullPriceAdds * RETAIL_RATE + screenTotal + interiorTotal;
  const promoDiscount   = appliedPromo
    ? appliedPromo.discount_type === "percent"
      ? totalCharged * (appliedPromo.discount_value / 100)
      : Math.min(appliedPromo.discount_value, totalCharged)
    : 0;
  const adjustedTotal   = totalCharged - promoDiscount;
  const totalRevenue    = baseTotal + adjustedTotal;
  const windowRevenue   = totalRevenue - screenTotal;
  const totalWindows = baseWindows + onsiteAdded + freeGiven + interiorsAdded;
  const avg          = totalWindows > 0 ? windowRevenue / totalWindows : 0;
  const retailFull   = totalWindows * RETAIL_RATE;
  // Next-visit offer
  const originalVisitWindows     = baseWindows + freeGiven;
  const originalVisitRetailValue = baseTotal + freeGiven * RETAIL_RATE;
  const nextVisitWindows  = baseWindows + onsiteAdded + freeGiven;
  // First Year Add-On Promo: up to min(baseWindows, 5) qualifying adds, $6.25 credit each (50% of $12.50)
  const qualifyingAdds   = Math.min(onsiteAdded, Math.min(baseWindows, 5));
  const addPromoCredit   = qualifyingAdds * (ONSITE_RATE / 2);
  // Box 1 — base booking only, never changes with on-site adds
  const nextVisitOffer   = Math.max(20, baseTotal - 2);
  // Thermometer feeds — read-only from the offer math above
  const arrivalAvg            = originalVisitWindows > 0 ? baseTotal / originalVisitWindows : 0;
  const nextVisitEffectiveAvg = nextVisitWindows > 0 ? nextVisitOffer / nextVisitWindows : 0;
  // Step 3 (review) next-visit plan
  const reviewRetailValue       = totalWindows * RETAIL_RATE;
  const reviewPreviousDiscounts = 2 + freeGiven * RETAIL_RATE;
  const reviewInteriorCarry     = interiorsAdded * ONSITE_RATE;
  const reviewBeforePrepay      = reviewRetailValue - reviewPreviousDiscounts - addPromoCredit + reviewInteriorCarry;
  const reviewThermAvg          = totalWindows > 0 ? reviewBeforePrepay / totalWindows : 0;

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
  const balanceDue   = Math.max(0, nextVisitOffer - DEPOSIT);
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
          interior_windows:     interiorsAdded || null,
          interior_total:       interiorsAdded > 0 ? Math.round(interiorTotal * 100) / 100 : null,
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
      setFrozenAvg(avg);
      setShowAgreementModal(false);
      setStep(2);
    }
  }, [
    password, selectedId, baseWindows, baseTotal, onsiteAdded, freeGiven,
    totalWindows, totalCharged, avg, recurringAccepted, depositCollected,
    interiorsAdded, interiorTotal,
    screenCount, screenTotal, tookScreenLesson, screenCredit,
  ]);

  const signOut = () => {
    localStorage.removeItem("worker_authed");
    localStorage.removeItem("worker_password");
    localStorage.removeItem("worker_employee");
    router.push("/login");
  };

  const resetFlow = () => {
    setStep(0); setSelectedId("");
    setOnsiteAdded(0); setFreeGiven(0); setInteriorsEnabled(false); setInteriorsAdded(0);
    setRecurringAccepted(false); setDepositCollected(false);
    setShowThankYouModal(false); setLastSecondOpen(false); setRateAgreed(false);
  };

  if (!authed) return null;

  // ─── STEP 0: Select today's job ────────────────────────────────────────
  if (step === 0) {
    const completedIds = new Set(sessions.map(s => s.booking_id));
    const activeBookings    = bookings.filter(b => !completedIds.has(b.id));
    const completedBookings = bookings.filter(b =>  completedIds.has(b.id));

    const openCompletedReview = (b: Booking) => {
      const session = sessions.find(s => s.booking_id === b.id)!;
      loadingFromSessionRef.current = true;
      setSelectedId(b.id);
      setOnsiteAdded(session.onsite_windows_added);
      setFreeGiven(session.free_windows_given);
      const hasInteriors = (session.interior_windows ?? 0) > 0;
      setInteriorsEnabled(hasInteriors);
      setInteriorsAdded(session.interior_windows ?? 0);
      setScreenHandlingEnabled(false);
      setScreenCount(0);
      setTookScreenLesson(false);
      setRecurringAccepted(false);
      setDepositCollected(false);
      setRateAgreed(false);
      setShowThankYouModal(false);
      setLastSecondOpen(false);
      setAppliedPromo(null);
      setPromoInput("");
      setStep(3);
    };

    const JobCard = ({ b, isCompleted }: { b: Booking; isCompleted?: boolean }) => {
      const session = isCompleted ? sessions.find(s => s.booking_id === b.id) : undefined;
      return (
        <button
          onClick={() => isCompleted ? openCompletedReview(b) : (setSelectedId(b.id), setStep(1))}
          style={{
            background: isCompleted ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isCompleted ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: 20, padding: "28px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = isCompleted ? "rgba(52,211,153,0.5)" : "rgba(22,163,74,0.5)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = isCompleted ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.09)")}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                {b.first_name} {b.last_name}
              </span>
              {isCompleted && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#34d399", border: "1px solid rgba(52,211,153,0.4)", borderRadius: 4, padding: "2px 6px" }}>
                  Closed Out
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{b.address}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
              {b.service_time} · {plural(b.window_count, "window")}
              {session && session.onsite_windows_added > 0 && (
                <span style={{ color: "rgba(52,211,153,0.6)" }}> + {session.onsite_windows_added} added</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: isCompleted ? "#34d399" : "#34d399" }}>
              ${fmtD(Number(b.total_price))}
            </div>
            {session && Number(session.total_charged) > 0 && (
              <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600, marginTop: 2 }}>
                +${fmtD(Number(session.total_charged))} adds
              </div>
            )}
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>
              {isCompleted ? "view record" : "booked total"}
            </div>
          </div>
        </button>
      );
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 35% 25%, #180a3a 0%, #06050f 45%, #080818 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
        padding: "44px 40px",
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10, fontWeight: 600 }}>
            Simple Window Cleaning
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>
            Job Closeout
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: "56px 40px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
              No jobs scheduled for today
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>
              Add a booking or check back when a job is on the calendar.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {activeBookings.length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14, fontWeight: 700 }}>
                  Select a Job
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeBookings.map(b => <JobCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
            {completedBookings.length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(52,211,153,0.5)", marginBottom: 14, fontWeight: 700 }}>
                  Completed Today
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {completedBookings.map(b => <JobCard key={b.id} b={b} isCompleted />)}
                </div>
              </div>
            )}
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
  }

  // ─── STEP 1 / 2 / 3: Service Record Document ──────────────────────────
  if (step === 1 || step === 2 || step === 3) {
    const isComplete = step === 2;
    const isReview   = step === 3;
    const canShowOffer    = baseWindows > 0;
    const depositRequired = false; // prepay logic removed; will re-add with add-credit cap
    const canProceed      = canShowOffer
      ? (recurringAccepted && (!depositRequired || depositCollected))
      : recurringAccepted;
    const docDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const delta = Math.round((1 - (totalWindows > 0 ? avg / RETAIL_RATE : 1)) * 100);

    const SummaryRow = ({ label, value, underline, valueColor }: { label: string; value: string; underline?: boolean; valueColor?: string }) => (
      <div style={{ display: "flex", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid #EBF5FA", background: underline ? "rgba(18,120,160,0.06)" : undefined }}>
        <span style={{ fontSize: 8, color: "#3AAAC4", letterSpacing: "0.1em", fontWeight: 600, minWidth: 110, textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
        <div style={{ flex: 1, borderBottom: "1px dotted #B8DCE8", margin: "0 6px 2px" }} />
        <span style={{ fontSize: 13, color: valueColor ?? "#0A2740", fontWeight: underline ? 800 : 600, textDecoration: underline ? "underline" : undefined }}>{value}</span>
      </div>
    );

    const FormCheck = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
      <label onClick={onToggle} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", flex: 1 }}>
        <div style={{
          width: 15, height: 15, border: `1.5px solid ${checked ? "#1278A0" : "#B8DCE8"}`, borderRadius: 3,
          flexShrink: 0, marginTop: 1, background: checked ? "#1278A0" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {checked && <span style={{ color: "#FFFFFF", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: 11, color: "#0A2740", lineHeight: 1.45 }}>{label}</span>
      </label>
    );

    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: isReview ? "#000000" : "linear-gradient(90deg, #061C2E 0%, #0A2F48 100%)",
        fontFamily: "var(--font-space-grotesk), -apple-system, sans-serif",
      }}>
        <style>{`
          @keyframes iwcBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }
          .iwc-blink { animation: iwcBlink 1.6s ease-in-out infinite; }
          @keyframes portholePulse { 0%,100%{opacity:0.07} 50%{opacity:0.13} }
          .porthole-ring { animation: portholePulse 8s ease-in-out infinite; }
        `}</style>

        <WorkerBar>
          {isComplete ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                onClick={() => setLastSecondOpen(p => !p)}
                style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
              >
                <div style={{
                  width: 13, height: 13, borderRadius: 3, border: "1.5px solid rgba(255,255,255,0.28)",
                  background: lastSecondOpen ? "#60a5fa" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {lastSecondOpen && <span style={{ color: "white", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Last second additions
                </span>
              </div>
              {lastSecondOpen && (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <Stepper label="On-site added" value={onsiteAdded} onChange={setOnsiteAdded} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 18, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                    <div onClick={() => { setScreenHandlingEnabled(p => { if (p) { setScreenCount(0); setTookScreenLesson(false); } return !p; }); }} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                      <div style={{ width: 13, height: 13, borderRadius: 3, border: "1.5px solid rgba(255,255,255,0.28)", background: screenHandlingEnabled ? "#60a5fa" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {screenHandlingEnabled && <span style={{ color: "white", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Screen Handling</span>
                    </div>
                    {screenHandlingEnabled && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => setScreenCount(prev => Math.max(0, prev - 1))} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
                        <span style={{ fontSize: 19, fontWeight: 800, color: "white", minWidth: 18, textAlign: "center" }}>{screenCount}</span>
                        <button onClick={() => setScreenCount(prev => prev + 1)} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em" }}>@ $2 ea</span>
                        {screenCount > 0 && <span style={{ fontSize: 10, color: "#7EC8E3", fontWeight: 700 }}>${fmtD(screenTotal)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
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
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
                      {baseWindows} screens w/ handling included
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => setScreenCount(prev => Math.max(0, prev - 1))} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
                      <span style={{ fontSize: 19, fontWeight: 800, color: "white", minWidth: 18, textAlign: "center" }}>{screenCount}</span>
                      <button onClick={() => setScreenCount(prev => prev + 1)} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em" }}>{screenCount > 0 ? "addl @ $2 ea" : "addl screens"}</span>
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
            </>
          )}

          {/* Beach video — fills middle gap */}
          <div style={{ flex: 1, minWidth: 0, height: 54, overflow: "hidden", borderRadius: 8, position: "relative", margin: "0 8px" }}>
            <video
              ref={videoRef}
              src="/beach.mp4"
              muted={videoMuted}
              playsInline
              loop
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {/* Sound toggle */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 4 }}>
                sound
              </div>
              <button
                onClick={() => setVideoMuted(m => !m)}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
                  color: videoMuted ? "rgba(255,255,255,0.3)" : "#3AAAC4",
                  fontSize: 15, cursor: "pointer", width: 30, height: 30,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                }}
              >
                {videoMuted ? "🔇" : "🔊"}
              </button>
            </div>
            <Stat label="Total windows" value={String(totalWindows)} />
            <Stat label="Charged today" value={`$${fmtD(adjustedTotal)}`} color="#34d399" />
            <Stat label="Avg / window" value={`$${fmtD(avg)}`} color="#7EC8E3" />
            <Stat label="Retail would be" value={`$${fmtI(retailFull)}`} color="rgba(255,255,255,0.3)" />
          </div>
        </WorkerBar>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", padding: "16px 32px 20px", overflowY: "auto", position: "relative" }}>
          {/* Porthole decoration */}
          <div className="porthole-ring" style={{
            position: "fixed", top: "50%", right: -110, transform: "translateY(-50%)",
            width: 340, height: 340, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
            border: "28px solid rgba(192,152,64,0.6)",
            boxShadow: "inset 0 0 0 4px rgba(192,152,64,0.2), 0 0 0 3px rgba(192,152,64,0.15)",
          }} />
          {/* ── Service Record Document ── */}
          <div style={{
            width: "100%", position: "relative", zIndex: 1,
            background: "#FFFFFF",
            borderTop: "none",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(10,47,72,0.35), 0 4px 16px rgba(10,47,72,0.18)",
            fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
            zoom: 1.18,
          }}>

            {/* Ocean accent stripe */}
            <div style={{
              height: 8,
              background: "linear-gradient(90deg, #0A3D5C 0%, #1278A0 30%, #3AAAC4 55%, #7ED8EA 75%, #3AAAC4 88%, #1278A0 100%)",
            }} />

            {/* Document Header */}
            <div style={{
              padding: "10px 20px",
              borderBottom: "1px solid #D8EFF6",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#F5FBFD",
              gap: 12,
            }}>
              {/* Left: Logo + Company */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div
                  onClick={openPromoPanel}
                  style={{
                    width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${appliedPromo ? "#059669" : showPromoPanel ? "#3AAAC4" : "#B8DCE8"}`,
                    boxShadow: appliedPromo ? "0 0 10px rgba(5,150,105,0.35)" : "0 2px 8px rgba(10,61,92,0.12)",
                  }}
                >
                  <img src="/icon.jpg" alt="Simple Window Cleaning" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0A2740", letterSpacing: "0.01em", lineHeight: 1.2 }}>
                    Simple Window Cleaning
                  </div>
                  <div style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 2 }}>
                    Santa Cruz · Silicon Valley · Est. 2016
                  </div>
                </div>
              </div>

              {/* Center: Technician card */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid #D8EFF6", borderRadius: 8, padding: "6px 12px",
                background: "#FFFFFF", boxShadow: "0 1px 6px rgba(10,61,92,0.07)", flex: 1,
              }}>
                <img src="/badge.jpg" alt="Technician" style={{ width: 38, height: 38, borderRadius: 7, objectFit: "cover", objectPosition: "top", border: "1.5px solid #D8EFF6", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 6, letterSpacing: "0.2em", color: "#1278A0", fontWeight: 700, textTransform: "uppercase", paddingBottom: 3, marginBottom: 3, borderBottom: "1px solid #EBF5FA" }}>
                    Technician
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 8px" }}>
                    {[
                      { label: "NAME",     value: techDisplayName("C.J. Vinson") },
                      { label: "VEHICLE",  value: "2016 Ford Transit · Black" },
                      { label: "CERT",     value: "Ladder-Free Specialist" },
                      { label: "BG CHECK", value: "Current (1/26)" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
                        <span style={{ fontSize: 6, color: "#3AAAC4", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: 8, color: "#0A2740", lineHeight: 1.3 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Service Record */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0A2740", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Service Record
                </div>
                <div style={{ fontSize: 9, color: "#3AAAC4", letterSpacing: "0.05em", marginTop: 2 }}>
                  {docDate} · Verified ✓
                </div>
              </div>
            </div>

            {/* Promo Panel */}
            {showPromoPanel && (
              <div style={{ borderBottom: "1px solid #D8EFF6", background: "#EBF7FA", padding: "10px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.18em", color: "#1278A0", textTransform: "uppercase", fontWeight: 600 }}>
                    Worker Exclusive · Promo Codes
                  </span>
                  <button onClick={() => setShowPromoPanel(false)} style={{ background: "none", border: "none", color: "#1278A0", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
                </div>
                {promoLoading ? (
                  <div style={{ fontSize: 10, color: "#3AAAC4", marginBottom: 8 }}>Loading…</div>
                ) : promoCodes.filter(p => p.active).length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {promoCodes.filter(p => p.active).map(pc => (
                      <button key={pc.code} onClick={() => applyPromo(pc.code)} style={{
                        background: "rgba(18,120,160,0.1)", border: "1px solid rgba(18,120,160,0.25)", borderRadius: 4,
                        padding: "4px 10px", cursor: "pointer", color: "#0A3D5C",
                        fontSize: 10, letterSpacing: "0.08em",
                      }}>
                        {pc.code}{pc.notes ? ` · ${pc.notes}` : ""}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "#3AAAC4", marginBottom: 8 }}>No active codes — add them in Admin.</div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") applyPromo(promoInput); }}
                    placeholder="ENTER CODE"
                    style={{
                      flex: 1, background: "#FFFFFF", border: "1px solid #B8DCE8",
                      borderRadius: 6, padding: "6px 10px", color: "#0A2740",
                      fontSize: 11, outline: "none", letterSpacing: "0.08em",
                    }}
                  />
                  <button onClick={() => applyPromo(promoInput)} style={{
                    background: "#1278A0", border: "none",
                    borderRadius: 6, padding: "6px 14px", color: "#FFFFFF",
                    fontSize: 10, cursor: "pointer", letterSpacing: "0.06em", fontWeight: 600,
                  }}>APPLY</button>
                </div>
              </div>
            )}

            {/* ── 2-column: Client | Transaction Module ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", borderBottom: "1px solid #D8EFF6" }}>

              {/* Client */}
              <div style={{ padding: "10px 16px", borderRight: "1px solid #D8EFF6" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.18em", color: "#1278A0", fontWeight: 700, textTransform: "uppercase", marginBottom: 7, paddingBottom: 4, borderBottom: "1px solid #D8EFF6" }}>
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
                    <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.1em", minWidth: 48, fontWeight: 600, paddingTop: 2, textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#0A2740", lineHeight: 1.35 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Transaction Module */}
              <div style={{ padding: "10px 14px", borderRight: "1px solid #D8EFF6", display: "flex", flexDirection: "column" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0A3D5C 0%, #1278A0 100%)",
                  borderRadius: 8, flex: 1, display: "flex", flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(10,61,92,0.25)",
                }}>
                  {/* Module header */}
                  <div style={{
                    padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      Transaction Summary
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 7, color: "rgba(255,255,255,0.4)" }}>
                      <span className="iwc-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#3AAAC4", display: "inline-block" }} />
                      VERIFIED
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
                          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                          <div style={{ borderRadius: 4, padding: "5px 2px", background: "rgba(0,0,0,0.2)", fontSize: 11, fontWeight: 700, color: "#7ECAD8" }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Status line */}
                  <div style={{ padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em", display: "flex", gap: 8 }}>
                    <span>RATE <strong style={{ color: "#7ECAD8" }}>${fmtD(avg)}/WIN</strong></span>
                    <span>·</span>
                    <span><strong style={{ color: "#7ECAD8" }}>{delta}%</strong> BELOW RETAIL</span>
                    {appliedPromo && <><span>·</span><span>CODE <strong style={{ color: "#7ECAD8" }}>{appliedPromo.code}</strong></span></>}
                    <span>·</span>
                    <span>CONFIRMED ✓</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── 2-column: Service Summary | Offer Box ── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", borderBottom: "1px solid #D8EFF6" }}>

              {/* Service Summary */}
              <div style={{ padding: "8px", borderRight: "1px solid #D8EFF6" }}>
                <div style={{ border: "1px solid #D8EFF6", borderRadius: 7, background: "#F5FBFD", padding: "7px 10px", height: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.18em", color: "#1278A0", fontWeight: 700, textTransform: "uppercase", marginBottom: 7, paddingBottom: 4, borderBottom: "1px solid #D8EFF6" }}>
                  Service Summary
                </div>
                <SummaryRow label="ORDERED" value={`${baseWindows} ext`} />
                <div style={{ paddingLeft: 4, paddingBottom: 4, borderBottom: "1px solid rgba(58,170,196,0.15)", marginBottom: 1 }}>
                  <span style={{ fontSize: 8, color: "#3AAAC4", fontStyle: "italic", letterSpacing: "0.04em" }}>
                    Prepaid online · ${fmtD(baseTotal)}
                  </span>
                </div>
                {onsiteAdded > 0 && (
                  <SummaryRow
                    label="ON-SITE"
                    value={fullPriceAdds > 0 ? `${discountedAdds}@$${ONSITE_RATE} · ${fullPriceAdds}@$${RETAIL_RATE}` : `${onsiteAdded} @ $${ONSITE_RATE}`}
                  />
                )}

                {/* Complimentary — inline mini tally */}
                <div style={{ padding: "5px 0", borderBottom: "1px solid #EBF5FA" }}>
                  <div style={{ fontSize: 7, color: "#1278A0", letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    Complimentary
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      1st Year Promo
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <button onClick={() => setFreeGiven(prev => Math.max(0, prev - 1))} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>−</button>
                      <span style={{ fontSize: 13, color: "#0A2740", fontWeight: 700, minWidth: 14, textAlign: "center" }}>{freeGiven}</span>
                      <button onClick={() => setFreeGiven(prev => prev + 1)} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>+</button>
                      <span style={{ fontSize: 11, color: "#0A2740", marginLeft: 3 }}>
                        {freeGiven > 0 ? `${freeGiven} win free` : "none"}
                      </span>
                    </div>
                  </div>
                </div>

                {screenCount > 0 && (
                  <div style={{ padding: "4px 0", borderBottom: "1px solid #EBF5FA" }}>
                    <SummaryRow label="SCREENS" value={`${screenCount} × $${SCREEN_RATE} = $${fmtD(screenTotal)}`} />
                    {tookScreenLesson && (
                      <div style={{ paddingLeft: 4, paddingBottom: 2 }}>
                        <span style={{ fontSize: 7, color: "#059669", fontStyle: "italic", letterSpacing: "0.04em" }}>
                          lesson credit: −${screenCredit.toFixed(2)} at next arrival (screens staged)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(([
                  { label: "TOTAL WIN",  value: String(totalWindows) },
                  ...(appliedPromo ? [
                    { label: "SUBTOTAL",     value: `$${fmtD(totalCharged)}` },
                    { label: `CODE ${appliedPromo.code}`, value: `-$${fmtD(promoDiscount)}` },
                  ] : []),
                  ...(!isComplete ? [{ label: "CHARGED", value: `$${fmtD(adjustedTotal)}`, underline: true }] : []),
                  { label: "AVG/WIN",   value: `$${fmtD(avg)}` },
                  { label: "RETAIL",   value: `$${fmtI(retailFull)}` },
                  ...(retailFull > totalRevenue ? [{ label: "SAVED", value: `$${fmtD(retailFull - totalRevenue)}`, valueColor: "#16a34a" }] : []),
                  ...(isComplete && interiorsAdded > 0 ? [{ label: "INTERIORS", value: `${interiorsAdded} × $${ONSITE_RATE} = $${fmtD(interiorTotal)}` }] : []),
                  ...(isComplete && screenCount > 0 ? [{ label: "SCREENS", value: `${screenCount} × $${SCREEN_RATE} = $${fmtD(screenTotal)}` }] : []),
                ] as Array<{ label: string; value: string; underline?: boolean; valueColor?: string }>).map(({ label, value, underline, valueColor }) => (
                  <SummaryRow key={label} label={label} value={value} underline={underline} valueColor={valueColor} />
                )))}
                </div>
              </div>

              {/* Offer Box */}
              <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                {/* Slide header */}
                <div style={{ background: "linear-gradient(90deg, #0A3D5C, #1278A0)", color: "#FFFFFF", padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase" }}>
                    {canShowOffer ? "Next Visit Offer" : "Price Analysis"}
                  </span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
                    VERIFIED ✓
                  </span>
                </div>

                {/* Slide body */}
                <div style={{ padding: "10px 12px", background: "#F0F9FC", display: "flex", gap: 8, alignItems: "stretch" }}>
                  {/* Left thermometer */}
                  <ThermometerChart avg={isReview ? reviewThermAvg : arrivalAvg} retailRate={RETAIL_RATE} tag={isReview ? "NEXT" : "TODAY"} frozen={isComplete || isReview} />

                  {/* Content box */}
                  <div style={{ flex: 1, border: "1px solid #B8DCE8", borderRadius: 6, background: "#FFFFFF", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* vs retail header */}
                    <div style={{ fontSize: 7, color: "#1278A0", letterSpacing: "0.06em", paddingBottom: 5, marginBottom: 4, borderBottom: "1px solid #EBF5FA" }}>
                      vs <span style={{ textDecoration: "line-through", color: "#B0C8D4" }}>${RETAIL_RATE}</span> retail
                      {delta > 0 && <span style={{ color: "#059669", fontWeight: 700 }}> · {delta}% BELOW</span>}
                    </div>

                    {canShowOffer ? (
                      /* ── Next visit offer breakdown ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {isReview ? (
                          /* ── Step 3: Next Visit Plan ── */
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Next visit · {totalWindows} win × $20
                              </span>
                              <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>${fmtD(reviewRetailValue)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>Previous Discounts</span>
                              <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>−${fmtD(reviewPreviousDiscounts)}</span>
                            </div>
                            {addPromoCredit > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                                <span style={{ fontSize: 7, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  Add-on credit ({qualifyingAdds} win · 50% off)
                                </span>
                                <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>−${fmtD(addPromoCredit)}</span>
                              </div>
                            )}
                            {interiorsAdded > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                                <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  Add On ({interiorsAdded} × $12.50)
                                </span>
                                <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>+${fmtD(reviewInteriorCarry)}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 5 }}>
                              <div>
                                <div style={{ fontSize: 7, color: "#0A2740", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.3 }}>
                                  Next Visit Total
                                </div>
                                <div style={{ fontSize: 6, color: "#3AAAC4", letterSpacing: "0.04em" }}>All discounts + credits applied</div>
                              </div>
                              <div style={{ fontSize: 26, fontWeight: 900, color: "#0A3D5C", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                                ${fmtD(reviewBeforePrepay)}
                              </div>
                            </div>
                          </>
                        ) : (
                          /* ── Steps 1/2: Original Math ── */
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Next visit · {originalVisitWindows} win · retail value
                              </span>
                              <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>${fmtD(originalVisitRetailValue)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Pre-book discount
                              </span>
                              <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>−$2.00</span>
                            </div>
                            {freeGiven > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px solid #EBF5FA" }}>
                                <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  Free window credit
                                </span>
                                <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>−${fmtD(freeGiven * RETAIL_RATE)}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 5 }}>
                              <div>
                                <div style={{ fontSize: 7, color: "#0A2740", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.3 }}>
                                  Next Visit Subtotal
                                </div>
                                <div style={{ fontSize: 6, color: "#3AAAC4", letterSpacing: "0.04em" }}>
                                  Includes today&apos;s free windows + addl $2 discount
                                </div>
                              </div>
                              <div style={{ fontSize: 26, fontWeight: 900, color: "#0A3D5C", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                                ${fmtD(nextVisitOffer)}
                              </div>
                            </div>
                            {screenCount > 0 && (
                              <div style={{ borderTop: "1px dashed #B8DCE8", marginTop: 5, paddingTop: 4, display: "flex", flexDirection: "column", gap: 0 }}>
                                {tookScreenLesson ? (
                                  <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0" }}>
                                      <span style={{ fontSize: 7, color: "#059669", fontStyle: "italic", letterSpacing: "0.04em" }}>− next-visit screens (staged)</span>
                                      <span style={{ fontSize: 9, color: "#059669", fontWeight: 700 }}>−${fmtD(screenTotal)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0", borderBottom: "1px solid #EBF5FA" }}>
                                      <span style={{ fontSize: 7, color: "#059669", fontStyle: "italic", letterSpacing: "0.04em" }}>− today&apos;s screens · credit</span>
                                      <span style={{ fontSize: 9, color: "#059669", fontWeight: 700 }}>−${fmtD(screenCredit)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0", borderBottom: "1px solid #EBF5FA" }}>
                                    <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>+ screen handling ({screenCount} screens)</span>
                                    <span style={{ fontSize: 9, color: "#0A2740", fontWeight: 700 }}>+${fmtD(screenTotal)}</span>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                                  <span style={{ fontSize: 7, color: "#0A2740", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                    {tookScreenLesson ? "With Staging" : "With Screens"}
                                  </span>
                                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0A3D5C", fontFamily: "Georgia,'Times New Roman',serif", lineHeight: 1 }}>
                                    ${fmtD(tookScreenLesson ? nextVisitOffer - screenCredit : nextVisitOffer + screenTotal)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      /* ── No offer ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[
                          `STANDARD VISIT · RATE ON FILE`,
                          `ADD WINDOWS TO UNLOCK SAVINGS`,
                          `YOUR RATE IS ALWAYS WAITING`,
                        ].map((pt, i) => (
                          <div key={i} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
                            <span style={{ color: "#3AAAC4", fontSize: 7, flexShrink: 0 }}>▸</span>
                            <span style={{ fontSize: 8, color: "#0A2740", letterSpacing: "0.04em", lineHeight: 1.35 }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Add-on controls (step 1 + 3) / Rate agreement (step 2) ── */}
                {(!isComplete || isReview) ? (
                  <div style={{ display: "flex", borderTop: "1px solid #D8EFF6" }}>
                    {/* Left: Box 2 (exterior) stacked on Box 3 (interior) */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Box 2: Exterior */}
                      {onsiteAdded === 0 ? (
                        <div style={{ padding: "5px 14px", borderBottom: "1px solid #D8EFF6", background: "#F5FBFD" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setOnsiteAdded(1)}>
                            <div style={{ width: 13, height: 13, borderRadius: 3, border: "1.5px solid #B8DCE8", background: "transparent", flexShrink: 0 }} />
                            <span style={{ fontSize: 8, color: "#1278A0", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              Add on-site exterior windows
                            </span>
                          </div>
                          {screenHandlingEnabled && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {screenCount > 0 ? `Screen handling — addl screens` : "Screen handling today"}
                              </span>
                              <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>
                                {screenCount > 0 ? `+$${fmtD(screenTotal)}` : `${baseWindows} incl.`}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: "5px 14px 6px", borderBottom: "1px solid #D8EFF6", background: "#F0F9FC" }}>
                          <div style={{ fontSize: 7, letterSpacing: "0.14em", fontWeight: 700, color: "#1278A0", textTransform: "uppercase", marginBottom: 4 }}>On-Site Add-Ons</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <button onClick={e => { e.stopPropagation(); setOnsiteAdded(p => Math.max(0, p - 1)); }} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>−</button>
                              <span style={{ fontSize: 11, color: "#0A2740", fontWeight: 700, minWidth: 14, textAlign: "center" }}>{onsiteAdded}</span>
                              <button onClick={e => { e.stopPropagation(); setOnsiteAdded(p => p + 1); }} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, lineHeight: 1 }}>+</button>
                              <span style={{ fontSize: 8, color: "#0A2740" }}>Windows added in extra time</span>
                            </div>
                            <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>+${fmtD(onsiteAdded * ONSITE_RATE)}</span>
                          </div>
                          {qualifyingAdds > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingLeft: 46 }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>50% off add-on special</span>
                              <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>−${fmtD(addPromoCredit)}</span>
                            </div>
                          )}
                          {screenHandlingEnabled && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingLeft: 46 }}>
                              <span style={{ fontSize: 7, color: "#3AAAC4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {screenCount > 0 ? `Screen handling — addl screens` : "Screen handling today"}
                              </span>
                              <span style={{ fontSize: 10, color: "#0A2740", fontWeight: 600 }}>
                                {screenCount > 0 ? `+$${fmtD(screenTotal)}` : `${baseWindows} incl.`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Box 3: Interior */}
                      <div style={{ padding: "6px 14px 8px", background: "#F5FBFD", flex: 1 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: interiorsEnabled ? 6 : 0 }}>
                          <div
                            onClick={() => { setInteriorsEnabled(p => { if (p) setInteriorsAdded(0); return !p; }); }}
                            style={{
                              width: 13, height: 13, borderRadius: 3,
                              border: `1.5px solid ${interiorsEnabled ? "#1278A0" : "#B8DCE8"}`,
                              background: interiorsEnabled ? "#1278A0" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              cursor: "pointer",
                            }}
                          >
                            {interiorsEnabled && <span style={{ color: "#fff", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 8, color: "#1278A0", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Add interior?
                          </span>
                        </label>
                        {interiorsEnabled && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <button onClick={() => setInteriorsAdded(p => Math.max(0, p - 1))} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
                            <span style={{ fontSize: 13, color: "#0A2740", fontWeight: 700, minWidth: 14, textAlign: "center" }}>{interiorsAdded}</span>
                            <button onClick={() => setInteriorsAdded(p => p + 1)} style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid #B8DCE8", background: "transparent", color: "#1278A0", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
                            <span style={{ fontSize: 8, color: "#3AAAC4" }}>interior win · $12.50 ea <span style={{ textDecoration: "line-through", color: "#B0C8D4" }}>$15</span></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Add-On Charges (Today) */}
                    <div style={{ width: 116, borderLeft: "1px solid #D8EFF6", padding: "7px 9px", background: "#FAFCFE", flexShrink: 0, display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 6, letterSpacing: "0.16em", color: "#1278A0", fontWeight: 700, textTransform: "uppercase", marginBottom: 5, paddingBottom: 3, borderBottom: "1px solid #D8EFF6" }}>
                        Add-On Charges
                      </div>
                      {onsiteAdded > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: "#6B8B9A" }}>{onsiteAdded} ext.</span>
                          <span style={{ fontSize: 9, color: "#0A2740", fontWeight: 600 }}>${fmtD(onsiteAdded * ONSITE_RATE)}</span>
                        </div>
                      )}
                      {interiorsAdded > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: "#6B8B9A" }}>{interiorsAdded} int.</span>
                          <span style={{ fontSize: 9, color: "#0A2740", fontWeight: 600 }}>${fmtD(interiorTotal)}</span>
                        </div>
                      )}
                      {screenCount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: "#6B8B9A" }}>{screenCount} scrn</span>
                          <span style={{ fontSize: 9, color: "#0A2740", fontWeight: 600 }}>${fmtD(screenTotal - screenCredit)}</span>
                        </div>
                      )}
                      {(onsiteAdded > 0 || interiorsAdded > 0 || screenCount > 0) ? (
                        <>
                          <div style={{ borderTop: "1px solid #D8EFF6", paddingTop: 3, marginTop: 3, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 6, color: "#0A2740", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today</span>
                            <span style={{ fontSize: 11, color: "#0A2740", fontWeight: 700 }}>${fmtD(adjustedTotal)}</span>
                          </div>
                          {addPromoCredit > 0 && (
                            <div style={{ marginTop: 5, padding: "4px 6px", background: "rgba(5,150,105,0.07)", borderRadius: 4, borderLeft: "2px solid #059669" }}>
                              <div style={{ fontSize: 6, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 1 }}>
                                Next Visit Credit
                              </div>
                              <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>−${fmtD(addPromoCredit)}</div>
                              <div style={{ fontSize: 6, color: "#059669", opacity: 0.7, lineHeight: 1.3, marginTop: 1 }}>if added to next estimate</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: 7, color: "#B0C8D4", fontStyle: "italic", paddingTop: 4 }}>No add-ons yet</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "6px 14px 8px", borderTop: "1px solid #D8EFF6", background: "#F5FBFD" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                      onClick={() => setRateAgreed(p => !p)}
                    >
                      <div style={{
                        width: 13, height: 13, borderRadius: 3,
                        border: `1.5px solid ${rateAgreed ? "#1278A0" : "#B8DCE8"}`,
                        background: rateAgreed ? "#1278A0" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {rateAgreed && <span style={{ color: "#fff", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 8, color: "#1278A0", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        I agree to the next visit rate shown above
                      </span>
                    </label>
                  </div>
                )}
              </div>

            </div>

            {/* ── Sign-Off Row ── */}
            <div style={{ padding: "8px 20px", borderBottom: "1px solid #EBF5FA" }}>
              <div style={{ fontSize: 7, letterSpacing: "0.18em", color: "#1278A0", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                Technician Sign-Off
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                {canShowOffer ? (
                  <>
                    <FormCheck
                      label={depositRequired
                        ? `Customer pre-books next visit · $${fmtD(balanceDue)} balance due at service`
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
              <button
                onClick={() => {
                  const session = sessions.find(s => s.booking_id === selectedId);
                  if (!session) return;
                  const hasInteriors = (session.interior_windows ?? 0) > 0;
                  setOnsiteAdded(session.onsite_windows_added);
                  setFreeGiven(session.free_windows_given);
                  setInteriorsEnabled(hasInteriors);
                  setInteriorsAdded(session.interior_windows ?? 0);
                  setScreenHandlingEnabled(false);
                  setScreenCount(0);
                  setTookScreenLesson(false);
                  setRecurringAccepted(false);
                  setDepositCollected(false);
                  setRateAgreed(false);
                  setShowThankYouModal(false);
                  setLastSecondOpen(false);
                  setAppliedPromo(null);
                  setPromoInput("");
                }}
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1278A0", background: "none", border: "1px solid #B8DCE8", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}
              >
                Reset
              </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: "linear-gradient(90deg, #0A3D5C 0%, #1278A0 100%)", borderRadius: "0 0 8px 8px", padding: "6px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>
                {canShowOffer
                  ? depositRequired
                    ? `Pre-book next visit · $10 deposit via Venmo · $${fmtD(balanceDue)} balance at service · Valid 7 months`
                    : `Rate locked at $${fmtD(avg)}/win · Schedule next visit now · Valid 7 months`
                  : "Thank you for your business · SimpleWindowCleaning.com"}
              </div>
            </div>
          </div>
        </div>

        {/* Thank-you modal (step 2) */}
        {showThankYouModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,47,72,0.88)", backdropFilter: "blur(8px)" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 18, padding: "32px 28px", maxWidth: 360, width: "calc(100vw - 48px)", textAlign: "center", position: "relative", boxShadow: "0 24px 64px rgba(10,47,72,0.55)" }}>
              <button onClick={() => setShowThankYouModal(false)} style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#0A2740", lineHeight: 1 }}>×</button>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0A2740", marginBottom: 8, letterSpacing: "-0.01em" }}>
                Thank You!
              </div>
              <p style={{ fontSize: 13, color: "#3AAAC4", margin: "0 0 16px", lineHeight: 1.6 }}>
                Your windows look amazing. We appreciate your business and look forward to seeing you again.
              </p>
              <p style={{ fontSize: 10, color: "#B0C8D4", margin: 0, lineHeight: 1.5 }}>
                Simple Window Cleaning · ladderlesswindows.com
              </p>
            </div>
          </div>
        )}

        {/* Agreement modal */}
        {showAgreementModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,47,72,0.82)", backdropFilter: "blur(6px)" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "24px 22px", maxWidth: 420, width: "calc(100vw - 40px)", maxHeight: "80vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 64px rgba(10,47,72,0.5)" }}>
              <button onClick={() => setShowAgreementModal(false)} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#0A2740", lineHeight: 1 }}>×</button>

              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#3AAAC4", marginBottom: 10 }}>
                Service Authorization · Additional Items
              </div>

              <p style={{ fontSize: 11, color: "#0A2740", lineHeight: 1.65, margin: "0 0 10px" }}>
                We just cleaned <strong>{baseWindows + onsiteAdded + freeGiven} exterior window{baseWindows + onsiteAdded + freeGiven !== 1 ? "s" : ""}</strong>
                {freeGiven > 0 && ` — including ${freeGiven} complimentary via 1st year promo`}.
                {baseTotal > 0 && <span style={{ color: "#3AAAC4", fontSize: 9 }}> (prepaid online · ${fmtD(baseTotal)})</span>}
              </p>

              {screenCount > 0 && (
                <div style={{ borderTop: "1px solid #EBF5FA", paddingTop: 8, marginBottom: 8 }}>
                  <p style={{ fontSize: 10, color: "#0A2740", margin: "0 0 6px", lineHeight: 1.5 }}>
                    <strong>{screenCount} screen{screenCount !== 1 ? "s" : ""}</strong> were also handled today.
                  </p>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4, opacity: 0.6, cursor: "default" }}>
                    <input type="checkbox" checked={!tookScreenLesson} readOnly style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#0A2740", lineHeight: 1.5 }}>
                      I paid $2/screen for the tech to briefly enter with shoe covers to remove and reinstall screens. Today&apos;s charge: <strong>${fmtD(screenTotal)}</strong>.
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, opacity: 0.6, cursor: "default" }}>
                    <input type="checkbox" checked={tookScreenLesson} readOnly style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#0A2740", lineHeight: 1.5 }}>
                      I took a free lesson and will stage screens myself next visit. I still pay $2/screen today, but receive a $1/screen credit at my next arrival.
                    </span>
                  </label>
                </div>
              )}

              {interiorsAdded > 0 && (
                <div style={{ borderTop: "1px solid #EBF5FA", paddingTop: 8, marginBottom: 8 }}>
                  <p style={{ fontSize: 10, color: "#0A2740", margin: 0, lineHeight: 1.5 }}>
                    I have also added <strong>{interiorsAdded} interior window{interiorsAdded !== 1 ? "s" : ""}</strong> to today&apos;s visit for <strong>${fmtD(interiorTotal)}</strong> — that&apos;s <strong>$12.50 each</strong> instead of $15 retail.
                  </p>
                </div>
              )}

              <div style={{ borderTop: "1px solid #EBF5FA", paddingTop: 10, marginTop: 2 }}>
                <p style={{ fontSize: 10, color: "#0A2740", margin: "0 0 4px", lineHeight: 1.5 }}>
                  I authorize an additional <strong>${fmtD(adjustedTotal)}</strong> for today&apos;s add-on services.
                </p>
                <p style={{ fontSize: 9, color: "#3AAAC4", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Today&apos;s additions unlock promo codes valid for the next 13 months.
                </p>
                <button
                  onClick={() => { setShowAgreementModal(false); saveAndAdvance(interiorsAdded > 0 ? "today" : "declined"); }}
                  style={{
                    width: "100%", padding: "13px",
                    background: "linear-gradient(135deg, #0A3D5C, #1278A0)",
                    border: "none", borderRadius: 10, color: "#FFFFFF",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    letterSpacing: "0.02em", boxShadow: "0 4px 14px rgba(18,120,160,0.35)",
                  }}
                >
                  I Authorize — Now Get to Work!
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmBar>
          {isReview ? (
            <button
              onClick={() => resetFlow()}
              style={{
                width: "100%", padding: "21px",
                background: "linear-gradient(135deg, #111118, #1c1c2e)",
                border: "1px solid rgba(52,211,153,0.3)", borderRadius: 16,
                fontSize: 18, fontWeight: 700, color: "#34d399",
                boxShadow: "0 4px 20px rgba(52,211,153,0.1)",
                cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.01em",
              }}
            >
              Rate Technician (Thank you!)
            </button>
          ) : isComplete ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
              <button
                onClick={() => setShowThankYouModal(true)}
                style={{
                  width: "100%", padding: "21px",
                  background: "linear-gradient(135deg, #0A3D5C, #1278A0)",
                  border: "none", borderRadius: 16,
                  fontSize: 18, fontWeight: 700, color: "white",
                  boxShadow: "0 4px 20px rgba(18,120,160,0.4)",
                  cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.01em",
                }}
              >
                It looks Great!
              </button>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em", textAlign: "center" }}>
                And I have 24 hours to report a Customer Satisfaction complaint!
              </div>
            </div>
          ) : (
            <button
              onClick={() => { if (!canProceed || saving) return; if (adjustedTotal > 0) { setShowAgreementModal(true); } else { saveAndAdvance("declined"); } }}
              disabled={!canProceed || saving}
              style={{
                width: "100%", padding: "21px",
                background: canProceed ? "linear-gradient(135deg, #0A3D5C, #1278A0)" : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 16,
                fontSize: 18, fontWeight: 700,
                color: canProceed ? "white" : "rgba(255,255,255,0.18)",
                boxShadow: canProceed ? "0 4px 20px rgba(18,120,160,0.4)" : "none",
                cursor: canProceed && !saving ? "pointer" : "default",
                transition: "all 0.2s", letterSpacing: "0.01em",
              }}
            >
              {saving ? "Saving…" : "Now Get to Work! →"}
            </button>
          )}
        </ConfirmBar>
      </div>
    );
  }

  // ─── STEP 3: Closeout Summary ───────────────────────────────────────────
  const interiorLine = interiorsAdded > 0
    ? `${interiorsAdded} interior${interiorsAdded !== 1 ? "s" : ""} · $${fmtD(interiorTotal)}`
    : "None added";

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
