'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, formatTime } from '@/lib/availability'

const HINTS = [
  '“the nearest Wednesday, please”',
  '“does it need to be shady?”',
  '“can you do a Monday after 2pm?”',
  '“how long does it take?”',
]

type Msg = { role: 'agent' | 'user'; text: string }

export function BookingAgent(props: {
  zip: string
  windowCount: number
  date: string
  time: string
  slotMap: Record<string, string[]>
  onApplySlot: (date: string, time: string) => void
}) {
  const { zip, windowCount, date, time, slotMap, onApplySlot } = props
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const openerDone = useRef(false)
  const lastNarrated = useRef('')
  const suppressNarration = useRef(false)
  const hintIdx = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const nearest = (() => {
    for (const d of Object.keys(slotMap).sort()) {
      const t = slotMap[d]
      if (t?.length) return { date: d, time: [...t].sort()[0] }
    }
    return null
  })()

  useEffect(() => {
    if (openerDone.current || !nearest) return
    openerDone.current = true
    lastNarrated.current = `${date}|${time}`
    setMessages([{
      role: 'agent',
      text: `Hi ${zip} 👋 Our nearest slot for ${windowCount} windows is ${formatDate(nearest.date)} at ${formatTime(nearest.time)}. Does that work, or would you like to try some other times?`,
    }])
  }, [nearest, zip, windowCount, date, time])

  // Narrate widget-driven changes so the chat mirrors the calendar
  useEffect(() => {
    if (!openerDone.current) return
    const key = `${date}|${time}`
    if (key === lastNarrated.current) return
    lastNarrated.current = key
    if (suppressNarration.current) { suppressNarration.current = false; return }
    const hint = HINTS[hintIdx.current++ % HINTS.length]
    setMessages(m => [...m, {
      role: 'agent',
      text: `${formatDate(date)} at ${formatTime(time)} — shall I confirm this below? Or ask me for something specific, like ${hint}`,
    }])
  }, [date, time])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages, thinking])

  function confirmNearest() {
    if (!nearest) return
    suppressNarration.current = true
    lastNarrated.current = `${nearest.date}|${nearest.time}`
    onApplySlot(nearest.date, nearest.time)
    setMessages(m => [...m,
      { role: 'user', text: 'That works!' },
      { role: 'agent', text: `Locked in: ${formatDate(nearest.date)} at ${formatTime(nearest.time)} ✓ Finish the steps below and you're set.` },
    ])
  }

  function otherTimes() {
    const hint = HINTS[hintIdx.current++ % HINTS.length]
    setMessages(m => [...m,
      { role: 'user', text: 'Show me other times' },
      { role: 'agent', text: `No problem — browse the calendar below and tap anything open; I'll follow along. Or just tell me what you need, like ${hint}` },
    ])
  }

  async function send() {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    const history: Msg[] = [...messages, { role: 'user', text }]
    setMessages(history)
    setThinking(true)
    try {
      const avail = Object.keys(slotMap).sort().slice(0, 30)
        .map(d => {
          const weekday = new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
          return `${d} (${weekday}): ${[...slotMap[d]].sort().join(', ')}`
        }).join('\n')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context:
            `You are embedded on the booking page as the Instant Booking Agent. ` +
            `Current booking state: ZIP ${zip}, ${windowCount} windows, currently selected ${formatDate(date)} at ${formatTime(time)}. ` +
            `Upcoming open slots (date (weekday): times, 24h clock) — trust the weekday labels, do not recompute them:\n${avail}\n` +
            `When multiple slots match a request, offer the earliest one (mention one alternative if useful). ` +
            `METHOD (for "how does it work / how is it done" questions): water-fed pole with reverse-osmosis + deionization filtered water — pure water dries completely spot-free, no soap residue; interiors use a traditional squeegee. When the user asks HOW the cleaning works, answer briefly and append the tag [SHOW_VIDEO] on its own line — the site will pop up a short demo video. ` +
            `You cannot change the calendar yourself — when you find a slot the customer wants, tell them to tap it in the calendar below this chat. ` +
            `If nothing fits their request, offer to have Chris text them when something opens. Keep replies to 1-3 short sentences.`,
          messages: history.map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.text })),
        }),
      })
      const d = await res.json()
      let raw = d.text || ''
      if (raw.includes('[SHOW_VIDEO]')) {
        raw = raw.replace('[SHOW_VIDEO]', '').trim()
        setVideoOpen(true)
      }
      setMessages(m => [...m, { role: 'agent', text: raw || 'Hmm, I glitched — try again, or the calendar below always works.' }])
    } catch {
      setMessages(m => [...m, { role: 'agent', text: 'Connection hiccup — the calendar below always works though!' }])
    }
    setThinking(false)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#7EC8E3', boxShadow: '0 0 8px rgba(126,200,227,0.8)', animation: 'pulse 2s infinite' }} />
        <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(126,200,227,0.75)' }}>
          Instant Booking Agent
        </p>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={m.role === 'agent' ? 'self-start' : 'self-end'}
              style={{ maxWidth: '88%' }}
            >
              <div className="px-[13px] py-[9px] text-[12.5px] leading-relaxed"
                style={m.role === 'agent'
                  ? { background: 'rgba(126,200,227,0.1)', border: '1px solid rgba(126,200,227,0.18)', borderRadius: '14px 14px 14px 4px', color: 'rgba(255,255,255,0.85)' }
                  : { background: 'rgba(126,200,227,0.85)', borderRadius: '14px 14px 4px 14px', color: '#08121c', fontWeight: 600 }}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick actions — only while the opener is the latest word */}
        {messages.length === 1 && nearest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex gap-2 self-start mt-1">
            <button onClick={confirmNearest}
              className="text-[11px] font-bold px-[14px] py-[7px] rounded-full cursor-pointer transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'rgba(126,200,227,0.85)', color: '#08121c', border: 'none' }}>
              That works ✓
            </button>
            <button onClick={otherTimes}
              className="text-[11px] font-bold px-[14px] py-[7px] rounded-full cursor-pointer transition-all hover:bg-white/10 active:scale-95"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.18)' }}>
              Other times
            </button>
          </motion.div>
        )}

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start px-[13px] py-[9px] text-[12px]"
            style={{ background: 'rgba(126,200,227,0.08)', border: '1px solid rgba(126,200,227,0.14)', borderRadius: '14px 14px 14px 4px', color: 'rgba(255,255,255,0.4)' }}>
            <span className="inline-block animate-pulse">typing…</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 pt-1 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Ask or request anything…"
          className="flex-1 min-w-0 text-[12.5px] px-[13px] py-[9px] rounded-full outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
        />
        <button onClick={send} disabled={!input.trim() || thinking}
          className="text-[12px] font-black px-[15px] rounded-full cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(126,200,227,0.85)', color: '#08121c', border: 'none' }}>
          ↑
        </button>
      </div>

      {/* How it's done — video popup, agent-summoned */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            className="fixed inset-0 z-[600] flex items-center justify-center p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              onClick={() => setVideoOpen(false)} />
            <motion.div
              className="relative z-10 w-full max-w-[560px] rounded-[16px] overflow-hidden"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ border: '1px solid rgba(126,200,227,0.3)', boxShadow: '0 16px 64px rgba(0,0,0,0.7)', background: '#05080c' }}
            >
              <button onClick={() => setVideoOpen(false)} aria-label="Close"
                className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer text-white"
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <video src="/videos/demo.mp4" autoPlay loop muted playsInline controls className="w-full block" />
              <p className="text-center text-[11px] py-[10px] px-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Reverse-osmosis purified water — nothing dissolved in it, so it dries <span className="font-black text-white">spot-free</span>. No soap, no residue.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
