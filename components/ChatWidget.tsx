"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TEAL = "rgba(126,200,227,";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Escalation {
  name: string;
  phone: string;
}

function parseEscalation(text: string): { clean: string; escalation: Escalation | null } {
  const match = text.match(/\[ESCALATE:name=([^,]+),phone=([^\]]+)\]/);
  if (!match) return { clean: text, escalation: null };
  const clean = text.replace(match[0], "").trim();
  return { clean, escalation: { name: match[1].trim(), phone: match[2].trim() } };
}

export function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hey! What can I help you with?",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      const { clean, escalation } = parseEscalation(data.text ?? "");
      setMessages(m => [...m, { role: "assistant", content: clean }]);

      if (escalation) {
        setEscalated(true);
        const transcript = [...next, { role: "assistant" as const, content: clean }];
        await fetch("/api/chat/escalate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: escalation.name,
            phone: escalation.phone,
            summary: text,
            transcript,
          }),
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { role: "assistant", content: "Something went wrong — try again or text (831) 331-1133" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          width: 52, height: 52, borderRadius: "50%",
          background: `${TEAL}0.18)`,
          border: `1.5px solid ${TEAL}0.45)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px ${TEAL}0.1)`,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: `${TEAL}0.9)`,
          fontSize: 22,
          transition: "background 0.2s",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "×" : "💬"}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", bottom: 88, right: 24, zIndex: 200,
              width: "min(360px, calc(100vw - 32px))",
              height: "min(520px, calc(100dvh - 120px))",
              background: "rgba(8,8,18,0.97)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: `1px solid ${TEAL}0.18)`,
              borderRadius: 20,
              boxShadow: "0 16px 60px rgba(0,0,0,0.65)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "14px 18px 12px",
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `${TEAL}0.45)`, marginBottom: 2 }}>
                Simple Windows
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                Customer Service
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                AI · Ask for a person  M–S 6am–5pm exc. holidays
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "82%",
                    padding: "9px 13px",
                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: m.role === "user"
                      ? `${TEAL}0.16)`
                      : "rgba(255,255,255,0.06)",
                    border: m.role === "user"
                      ? `1px solid ${TEAL}0.28)`
                      : "1px solid rgba(255,255,255,0.08)",
                    color: m.role === "user" ? `${TEAL}0.95)` : "rgba(255,255,255,0.82)",
                    fontSize: 13,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    padding: "9px 14px",
                    borderRadius: "14px 14px 14px 4px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 18,
                    letterSpacing: 3,
                  }}>
                    ···
                  </div>
                </div>
              )}
              {escalated && (
                <div style={{
                  fontSize: 11, color: `${TEAL}0.55)`,
                  textAlign: "center", padding: "4px 0",
                }}>
                  ✓ Chris has been notified and will reach out
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              display: "flex", gap: 8,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything…"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${TEAL}0.18)`,
                  borderRadius: 12,
                  color: "white",
                  fontSize: 13,
                  padding: "10px 14px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? `${TEAL}0.18)` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${input.trim() && !loading ? TEAL + "0.35)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12,
                  color: input.trim() && !loading ? `${TEAL}0.95)` : "rgba(255,255,255,0.2)",
                  fontSize: 16,
                  padding: "10px 14px",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
