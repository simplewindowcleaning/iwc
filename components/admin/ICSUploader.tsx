"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ICSEvent {
  start: string;
  end: string;
  summary: string;
}

function parseICS(text: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const blocks = text.split("BEGIN:VEVENT");
  blocks.shift(); // remove header

  for (const block of blocks) {
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : "";
    };

    const dtstart = get("DTSTART");
    const dtend = get("DTEND");
    const summary = get("SUMMARY");

    if (!dtstart) continue;

    const parseDate = (s: string) => {
      // Handle YYYYMMDD or YYYYMMDDTHHMMSS
      const clean = s.replace(/[TZ]/g, "").replace(/(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/, (_, y, mo, d, h = "00", mi = "00") => `${y}-${mo}-${d}T${h}:${mi}:00`);
      return clean.includes("T") ? clean : clean.split("T")[0];
    };

    events.push({
      start: parseDate(dtstart),
      end: parseDate(dtend || dtstart),
      summary,
    });
  }

  return events;
}

interface Props {
  onRefresh: () => void;
}

export function ICSUploader({ onRefresh }: Props) {
  const [status, setStatus] = useState<"idle" | "parsing" | "uploading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("parsing");

    const text = await file.text();
    const events = parseICS(text);

    if (events.length === 0) {
      setStatus("error");
      setErrorMsg("No VEVENT blocks found in file.");
      return;
    }

    setStatus("uploading");

    // Map ICS events to blocked availability rows
    const rows = events.map((ev) => ({
      date: ev.start.split("T")[0],
      time_slot: ev.start.includes("T") ? ev.start.split("T")[1].slice(0, 5) : null,
      is_blocked: true,
      reason: ev.summary || "ICS import",
    }));

    const { error } = await supabase.from("availability").upsert(rows, { onConflict: "date,time_slot" });

    if (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setCount(rows.length);
    setStatus("done");
    onRefresh();
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 24,
        maxWidth: 400,
      }}
    >
      <h3 style={{ color: "white", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Import .ics file</h3>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
        Upload a calendar export to block dates. Each VEVENT becomes a blocked slot.
      </p>

      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "28px 16px",
          border: "1.5px dashed rgba(167,139,250,0.25)",
          borderRadius: 12,
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        <Upload size={24} color="#a78bfa" />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          {status === "idle" ? "Click to upload .ics" :
           status === "parsing" ? "Reading file…" :
           status === "uploading" ? "Saving to Supabase…" :
           status === "done" ? `✓ Imported ${count} events` :
           `Error: ${errorMsg}`}
        </span>
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </label>

      {status === "done" && (
        <button
          className="ghost-btn mt-4 w-full"
          onClick={() => setStatus("idle")}
        >
          Upload another
        </button>
      )}
    </div>
  );
}
