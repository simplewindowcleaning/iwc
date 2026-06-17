"use client";

import { motion } from "framer-motion";

const REVIEWS = [
  {
    name: "Sarah M.",
    location: "Westside Santa Cruz",
    rating: 5,
    text: "Booked at 9am, they were here by 10. My windows look brand new — seriously couldn't believe the difference. Worth every penny.",
  },
  {
    name: "Jake T.",
    location: "Live Oak",
    rating: 5,
    text: "No ladder drama, no mess. The water-fed pole tech they use is genuinely impressive. I'll be back every quarter.",
  },
  {
    name: "Priya K.",
    location: "Aptos",
    rating: 5,
    text: "Fast, friendly, and the windows are spotless. Loved that I could book instantly — no waiting for a quote.",
  },
  {
    name: "Marcus L.",
    location: "Capitola",
    rating: 5,
    text: "Had them do 8 windows. The estimate afterward was thorough and way more affordable than I expected. These guys are the real deal.",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ color: "#fbbf24", fontSize: 14 }}>★</span>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="relative z-10 px-4 py-12"
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ color: "#a78bfa", fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: "center" }}
      >
        What neighbors are saying ✦
      </motion.h2>

      <div className="flex flex-col gap-3 max-w-[390px] mx-auto">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.name}
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Stars n={r.rating} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>
              &ldquo;{r.text}&rdquo;
            </p>
            <div className="flex flex-col">
              <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{r.name}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{r.location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
