"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { ICSUploader } from "@/components/admin/ICSUploader";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "calendar" | "ics" | "bookings";

interface Booking {
  id: string;
  service_date: string;
  service_time: string;
  address: string;
  first_name: string | null;
  last_name: string | null;
  window_count: number;
  total_price: number;
  status: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  time_slot: string | null;
  reason: string | null;
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("calendar");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);

  const loadData = useCallback(async () => {
    const [bRes, blRes] = await Promise.all([
      supabase.from("bookings").select("*").order("service_date", { ascending: true }),
      supabase.from("availability").select("*").eq("is_blocked", true),
    ]);
    if (bRes.data) setBookings(bRes.data as Booking[]);
    if (blRes.data) setBlocked(blRes.data as BlockedSlot[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      if (data.session) loadData();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isIn = !!session;
      setLoggedIn(isIn);
      if (isIn) loadData();
    });

    return () => listener.subscription.unsubscribe();
  }, [loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Loading state
  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading…</span>
      </div>
    );
  }

  // Login form
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Login</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20 }}>Ladderless Windows dashboard</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="field-label">Email</label>
              <input
                className="field-input mt-1"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                className="field-input mt-1"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p style={{ color: "#f87171", fontSize: 12 }}>{loginError}</p>
            )}
            <button
              className="book-btn"
              type="submit"
              disabled={loginLoading}
              style={{ opacity: loginLoading ? 0.6 : 1 }}
            >
              {loginLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  const TABS: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "bookings", label: "Bookings" },
    { id: "ics", label: "Import ICS" },
  ];

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: 700 }}>Ladderless Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{bookings.length} upcoming bookings</p>
        </div>
        <button className="ghost-btn" onClick={handleLogout}>Sign out</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="admin-tab"
            style={{
              background: tab === t.id ? "#a78bfa" : "rgba(167,139,250,0.1)",
              color: tab === t.id ? "#08080e" : "#a78bfa",
              border: `1px solid ${tab === t.id ? "#a78bfa" : "rgba(167,139,250,0.2)"}`,
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "calendar" && (
            <AdminCalendar bookings={bookings} blocked={blocked} onRefresh={loadData} />
          )}

          {tab === "bookings" && (
            <div className="flex flex-col gap-3">
              {bookings.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No bookings yet.</p>
              )}
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ color: "white", fontSize: 13, fontWeight: 600, margin: 0 }}>
                      {b.first_name ?? ""} {b.last_name ?? ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0" }}>
                      {b.service_date} · {b.service_time} · {b.address}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: "#a78bfa", fontSize: 14, fontWeight: 700, margin: 0 }}>${b.total_price}</p>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, margin: "2px 0 0" }}>{b.window_count}w</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "ics" && (
            <ICSUploader onRefresh={loadData} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
