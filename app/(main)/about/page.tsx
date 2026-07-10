"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 px-5 pb-16" style={{ paddingTop: 84 }}>
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            We clean windows.<br />
            <span style={{ color: "#a78bfa" }}>Instantly.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>
            Simple Windows started with one idea: window cleaning should be as easy as ordering a coffee. No estimates, no waiting, no ladders dragging across your siding.
          </p>
        </motion.div>

        {/* Story cards */}
        {[
          {
            title: "Water-fed pole tech",
            body: "Our purified water system cleans from the ground — no ladders, no risk, better results. Windows dry spot-free because the water is stripped of all minerals.",
          },
          {
            title: "Priced per window",
            body: "$20 per window, period. No hidden fees, no surprise charges. You see the total before you book.",
          },
          {
            title: "Book in 60 seconds",
            body: "Pick your slot, enter your address, pay via Venmo. That's it. We confirm and show up. Most bookings happen same-day.",
          },
          {
            title: "Santa Cruz locals",
            body: "We live and work in Santa Cruz. We know the neighborhoods, the salt air, and how hard it can be to keep windows clear. This is personal.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            className="glass-card p-4 mb-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
          >
            <h3 style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
          </motion.div>
        ))}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8"
        >
          <Link href="/" className="book-btn block text-center" style={{ textDecoration: "none" }}>
            Book Now
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
