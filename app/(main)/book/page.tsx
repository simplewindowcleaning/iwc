'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import HomePage from '../page'

const cards = [
  {
    num: '01',
    label: 'We know this is different',
    headline: 'JUST WINDOWS.',
    sub: 'Exterior only. Automated pricing for average families and renters. No gutters, no solar, no confusion.',
    color: '#00C4E8',
  },
  {
    num: '02',
    label: 'What changes for you',
    headline: 'AVAILABLE NOW.',
    sub: 'Exteriors fast, then automated — not 2–3 months out. Interiors handled separately by our vetted affiliate.',
    color: '#FFB020',
  },
  {
    num: '03',
    label: 'Why switch',
    headline: 'SAVES YOU TIME.',
    sub: 'Seamless booking for regular maintenance. The more often you book, the lower your cost per window.',
    color: '#00D97E',
  },
]

function RodeoOverlay() {
  const params = useSearchParams()
  const [open, setOpen] = useState(params.get('ref') === 'sw')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center px-5 py-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(8,12,18,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-[480px]">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-[9px] font-black tracking-[3px] text-white/25 uppercase mb-1">Before you book</p>
                <h2 className="text-[28px] font-black text-white tracking-tight leading-none">
                  Not Your First Rodeo?
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] font-black tracking-[2px] text-white/20 uppercase hover:text-white/50 transition-colors ml-4 flex-shrink-0"
              >
                ← Back
              </button>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
              {cards.map((card, i) => (
                <motion.div
                  key={card.num}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl px-6 py-5 flex items-center gap-5"
                  style={{ background: 'rgba(14,26,40,0.85)', border: `1px solid ${card.color}22` }}
                >
                  <span className="text-[52px] font-black leading-none flex-shrink-0 w-[56px] text-center"
                    style={{ color: `${card.color}30` }}>
                    {card.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black tracking-[2.5px] uppercase mb-[5px]"
                      style={{ color: `${card.color}70` }}>
                      {card.label}
                    </p>
                    <p className="text-[22px] font-black leading-tight tracking-tight text-white mb-1">
                      {card.headline}
                    </p>
                    <p className="text-[12px] text-white/40 leading-relaxed">{card.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Continue */}
            <div className="mt-5">
              <button
                onClick={() => setOpen(false)}
                className="w-full font-black text-[16px] tracking-tight py-[17px] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                style={{ background: '#00C4E8', color: '#080C12' }}
              >
                Got it — show me the calendar →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function BookPage() {
  return (
    <>
      <HomePage />
      <Suspense fallback={null}>
        <RodeoOverlay />
      </Suspense>
    </>
  )
}
