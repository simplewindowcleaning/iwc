'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, formatTime, MIN_BOOKING_DATE } from '@/lib/availability'
import { SERVICE_AREAS } from '@/lib/serviceAreas'

const HINTS = [
  '“the nearest Wednesday, please”',
  '“does it need to be shady?”',
  '“can you do a Monday after 2pm?”',
  '“how long does it take?”',
]

type Msg = { role: 'agent' | 'user'; text: string }

// Next 4 weeks at a glance — green days have availability, red are full,
// clicking a green day jumps the shared date/time (which the map's own
// week calendar re-centers on automatically) without narrating every tap.
function WeeksAheadCalendar({ slotMap, selectedDate, onPick }: {
  slotMap: Record<string, string[]>
  selectedDate: string
  onPick: (day: string) => void
}) {
  // Anchor to the same "effective today" the rest of the app uses (bookings
  // don't open until MIN_BOOKING_DATE) — otherwise every day in the grid
  // falls before that threshold and shows red/unavailable regardless of
  // real slotMap data.
  const realToday = new Date().toISOString().split('T')[0]
  const today = realToday > MIN_BOOKING_DATE ? realToday : MIN_BOOKING_DATE

  const monday = (() => {
    const d = new Date(today + 'T12:00:00')
    const dow = d.getDay()
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    return d.toISOString().split('T')[0]
  })()

  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(monday + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const monthLabel = (() => {
    const first = new Date(days[0] + 'T12:00:00')
    const last = new Date(days[days.length - 1] + 'T12:00:00')
    const f = first.toLocaleString('en-US', { month: 'short' })
    const l = last.toLocaleString('en-US', { month: 'short' })
    return f === l ? f : `${f} – ${l}`
  })()

  return (
    <div className="rounded-[12px] p-[10px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[9px] font-black tracking-[0.12em] uppercase text-center mb-[7px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {monthLabel} — next 4 weeks
      </p>
      <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(l => (
          <div key={l} className="text-center text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {days.map(day => {
          const isPast = day < today
          const hasSlots = (slotMap[day] ?? []).length > 0
          const isSelected = day === selectedDate
          const dayNum = new Date(day + 'T12:00:00').getDate()
          return (
            <button
              key={day}
              disabled={isPast || !hasSlots}
              onClick={() => onPick(day)}
              className="aspect-square rounded-[6px] text-[10px] font-bold flex items-center justify-center transition-all"
              style={{
                cursor: (isPast || !hasSlots) ? 'default' : 'pointer',
                background: isPast ? 'rgba(255,255,255,0.03)'
                  : isSelected ? 'rgba(126,200,227,0.9)'
                  : hasSlots ? 'rgba(0,217,126,0.16)'
                  : 'rgba(220,38,38,0.14)',
                border: isPast ? '1px solid rgba(255,255,255,0.05)'
                  : isSelected ? '1px solid rgba(126,200,227,0.9)'
                  : hasSlots ? '1px solid rgba(0,217,126,0.4)'
                  : '1px solid rgba(220,38,38,0.3)',
                color: isPast ? 'rgba(255,255,255,0.15)'
                  : isSelected ? '#08121c'
                  : hasSlots ? 'rgba(0,217,126,0.95)'
                  : 'rgba(220,38,38,0.8)',
              }}
            >
              {dayNum}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookingAgent(props: {
  zip: string
  windowCount: number
  date: string
  time: string
  slotMap: Record<string, string[]>
  onApplySlot: (date: string, time: string) => void
  // When true, the agent opens by asking the customer to pick a ZIP instead
  // of jumping straight to a slot suggestion (used for homepage-referred visits).
  awaitZip?: boolean
  // True once a zip has been confirmed via ANY path (including the traditional
  // map dot / zip-selector GO button) — lets the agent's zip-pick phase resolve
  // even if the customer bypassed its own buttons.
  zipConfirmedExternally?: boolean
  onZipPick?: (zip: string) => void
  // Fired when the customer confirms a slot — parent uses this to reveal the
  // traditional widget ("main panel"), which isn't needed until then.
  onSlotConfirmed?: () => void
}) {
  const { zip, windowCount, date, time, slotMap, onApplySlot, awaitZip, zipConfirmedExternally, onZipPick, onSlotConfirmed } = props
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [offTopicFollowup, setOffTopicFollowup] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [browsingCalendar, setBrowsingCalendar] = useState(false)
  const [zipChosen, setZipChosen] = useState(!awaitZip)
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

  // Zip-pick phase resolves if the customer confirms a zip via ANY path —
  // its own buttons, or the traditional map dot / zip-selector GO button.
  useEffect(() => {
    if (zipConfirmedExternally) setZipChosen(true)
  }, [zipConfirmedExternally])

  useEffect(() => {
    if (!awaitZip || zipChosen || messages.length > 0) return
    setMessages([{ role: 'agent', text: 'Please select your Zip Code to begin.' }])
  }, [awaitZip, zipChosen, messages.length])

  useEffect(() => {
    if (openerDone.current || !nearest) return
    if (awaitZip && !zipChosen) return
    openerDone.current = true
    // MapPanel's CalendarOverlay auto-selects this same nearest slot into
    // date/time independently (its own effect on slotMap) — pre-register
    // the value it will converge to, so the narration effect below
    // recognizes that change as already-known instead of re-narrating it
    // and wiping out these quick-action buttons a beat after they appear.
    lastNarrated.current = `${nearest.date}|${nearest.time}`
    setMessages(m => [...m, {
      role: 'agent',
      text: `Hi ${zip} 👋 Our nearest slot for ${windowCount} windows is ${formatDate(nearest.date)} at ${formatTime(nearest.time)}. Does that work, or would you like to try some other times?`,
    }])
    setShowQuickActions(true)
  }, [nearest, zip, windowCount, date, time, awaitZip, zipChosen])

  function pickZip(z: string) {
    onZipPick?.(z)
    setMessages(m => [...m, { role: 'user', text: `${SERVICE_AREAS[z]?.name ?? z} (${z})` }])
    setZipChosen(true)
  }

  // Narrate widget-driven changes so the chat mirrors the calendar — but stay
  // quiet while browsing the 4-week picker; the Confirm button handles that.
  useEffect(() => {
    if (!openerDone.current || browsingCalendar) return
    const key = `${date}|${time}`
    if (key === lastNarrated.current) return
    lastNarrated.current = key
    if (suppressNarration.current) { suppressNarration.current = false; return }
    setOffTopicFollowup(false)
    setShowQuickActions(false)
    const hint = HINTS[hintIdx.current++ % HINTS.length]
    setMessages(m => [...m, {
      role: 'agent',
      text: `${formatDate(date)} at ${formatTime(time)} — shall I confirm this below? Or ask me for something specific, like ${hint}`,
    }])
  }, [date, time, browsingCalendar])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages, thinking])

  function confirmNearest() {
    if (!nearest) return
    setOffTopicFollowup(false)
    setShowQuickActions(false)
    suppressNarration.current = true
    lastNarrated.current = `${nearest.date}|${nearest.time}`
    onApplySlot(nearest.date, nearest.time)
    setMessages(m => [...m,
      { role: 'user', text: 'That works!' },
      { role: 'agent', text: `Locked in: ${formatDate(nearest.date)} at ${formatTime(nearest.time)} ✓ Finish the steps below and you're set.` },
    ])
    onSlotConfirmed?.()
  }

  function askLadder() {
    setMessages(m => [...m,
      { role: 'user', text: 'How is there no ladder for the 2nd story outside?' },
      {
        role: 'agent',
        text: 'Our water-fed pole reaches 2nd-story glass right from the ground — reverse-osmosis purified water goes up the pole, soft brushes scrub, and the pure water rinse dries completely spot-free. No ladder, no risk, no marks. On the rare window where a ladder is truly needed (over a roof, tricky access), that one isn’t discounted and may even be extra. Here’s a quick look 👇',
      },
    ])
    setVideoOpen(true)
    setOffTopicFollowup(true)
    setShowQuickActions(false)
  }

  function askFees() {
    setMessages(m => [...m,
      { role: 'user', text: 'Are there any extra fees or taxes?' },
      {
        role: 'agent',
        text: 'No hidden fees or taxes — the price you see at checkout is what you pay. The only possible add-on is a small screen removal/reinstallation fee if you\'d like the tech to handle that for you. A full breakdown on screens is coming soon!',
      },
    ])
    setOffTopicFollowup(true)
    setShowQuickActions(false)
  }

  function otherTimes() {
    setOffTopicFollowup(false)
    setShowQuickActions(false)
    setBrowsingCalendar(true)
    const hint = HINTS[hintIdx.current++ % HINTS.length]
    setMessages(m => [...m,
      { role: 'user', text: 'Show me other times' },
      { role: 'agent', text: `No problem — pick anything green below, or use the calendar in the middle if it's this week. Tap Confirm this whenever you're ready. Or just tell me what you need, like ${hint}` },
    ])
  }

  function pickCalendarDay(day: string) {
    const slots = slotMap[day] ?? []
    if (!slots.length) return
    onApplySlot(day, slots[0])
  }

  function confirmSelected() {
    setOffTopicFollowup(false)
    setShowQuickActions(false)
    setBrowsingCalendar(false)
    lastNarrated.current = `${date}|${time}`
    setMessages(m => [...m,
      { role: 'user', text: 'Confirm this' },
      { role: 'agent', text: `Locked in: ${formatDate(date)} at ${formatTime(time)} ✓ Finish the steps below and you're set.` },
    ])
    onSlotConfirmed?.()
  }

  async function send() {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    const history: Msg[] = [...messages, { role: 'user', text }]
    setMessages(history)
    setOffTopicFollowup(false)
    setShowQuickActions(false)
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
            `CONVERSATION TRACKING: if — and only if — the user's question is NOT about picking a booking date, time, or window count (e.g. it's about pricing, screens, the cleaning method, policies, or anything general), answer it normally, then append the tag [OFFTOPIC] on its own line at the very end. Do NOT add this tag for questions about dates, times, availability, or window count — those are on-topic. ` +
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
      if (raw.includes('[OFFTOPIC]')) {
        raw = raw.replace('[OFFTOPIC]', '').trim()
        setOffTopicFollowup(true)
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

        {/* Zip picker — homepage-referred visits start here instead of a slot suggestion */}
        {awaitZip && !zipChosen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-[6px] self-start mt-1">
            {Object.values(SERVICE_AREAS).map(area => (
              <button key={area.zip} onClick={() => pickZip(area.zip)}
                className="text-[10.5px] font-bold px-[11px] py-[6px] rounded-full cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'rgba(126,200,227,0.14)', color: 'rgba(126,200,227,0.9)', border: '1px solid rgba(126,200,227,0.3)' }}>
                {area.zip} — {area.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Quick actions — shown right after the opener (however many messages
            preceded it, e.g. the zip-pick exchange), and again after any
            off-topic detour (free-text question or a persistent chip). Hidden
            once browsing the 4-week calendar — that has its own Confirm. */}
        {(showQuickActions || offTopicFollowup) && nearest && !browsingCalendar && (
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

        {/* 4-week-ahead picker — quiet while browsing; Confirm this ✓ is the
            only thing that speaks for the customer until they're ready */}
        {browsingCalendar && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="self-stretch w-full mt-1 flex flex-col gap-[8px]">
            <WeeksAheadCalendar slotMap={slotMap} selectedDate={date} onPick={pickCalendarDay} />
            <button onClick={confirmSelected}
              className="text-[11px] font-bold px-[14px] py-[8px] rounded-full cursor-pointer transition-all hover:brightness-110 active:scale-95 self-center"
              style={{ background: 'rgba(126,200,227,0.85)', color: '#08121c', border: 'none' }}>
              Confirm this ✓
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

      {/* Persistent suggested questions — pinned above the input for every state */}
      <div className="px-3 pb-1 flex-shrink-0 flex flex-col gap-[5px]">
        <button onClick={askLadder}
          className="w-full text-[10.5px] font-bold px-[12px] py-[6px] rounded-full cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98] truncate"
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(126,200,227,0.3)' }}>
          &ldquo;How is there no ladder for the 2nd story outside?&rdquo;
        </button>
        <button onClick={askFees}
          className="w-full text-[10.5px] font-bold px-[12px] py-[6px] rounded-full cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98] truncate"
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(126,200,227,0.3)' }}>
          &ldquo;Are there any extra fees or taxes?&rdquo;
        </button>
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

      {/* How it's done — companion video popup, docked top-left; portaled to
          <body> because the agent panel's transform would trap position:fixed */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            className="fixed left-4 top-4 z-[600] w-[min(360px,78vw)] rounded-[16px] overflow-hidden"
            initial={{ opacity: 0, x: -24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ border: '1px solid rgba(126,200,227,0.3)', boxShadow: '0 16px 64px rgba(0,0,0,0.7)', background: '#05080c' }}
          >
            <button onClick={() => setVideoOpen(false)} aria-label="Close"
              className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer text-white"
              style={{ background: 'rgba(0,0,0,0.6)', border: 'none' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <video src="/videos/demo.mp4" autoPlay loop muted playsInline controls className="w-full block" />
            <p className="text-center text-[10px] py-[8px] px-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Reverse-osmosis purified water dries <span className="font-black text-white">spot-free</span>. No soap, no residue.
            </p>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
    </div>
  )
}
