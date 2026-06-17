"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// FullCalendar must not SSR
const FullCalendar = dynamic(() => import("@fullcalendar/react").then((m) => m.default), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";

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

interface Props {
  bookings: Booking[];
  blocked: BlockedSlot[];
  onRefresh: () => void;
}

export function AdminCalendar({ bookings, blocked, onRefresh }: Props) {
  function toEvents() {
    const bookingEvents = bookings.map((b) => ({
      id: `booking-${b.id}`,
      title: `${b.window_count}w — ${b.address.split(",")[0]}`,
      start: `${b.service_date}T${b.service_time}`,
      backgroundColor: "#7c3aed",
      borderColor: "#6d28d9",
      textColor: "#fff",
    }));

    const blockedEvents = blocked.map((bl) => ({
      id: `blocked-${bl.id}`,
      title: bl.reason ?? "Blocked",
      start: bl.time_slot ? `${bl.date}T${bl.time_slot}` : bl.date,
      allDay: !bl.time_slot,
      backgroundColor: "#374151",
      borderColor: "#4b5563",
      textColor: "#9ca3af",
    }));

    return [...bookingEvents, ...blockedEvents];
  }

  async function handleDateClick(arg: DateClickArg) {
    const dateStr = arg.dateStr.split("T")[0];
    const confirm = window.confirm(`Block ${dateStr}?`);
    if (!confirm) return;

    await supabase.from("availability").insert({
      date: dateStr,
      time_slot: null,
      is_blocked: true,
      reason: "Manually blocked",
    });
    onRefresh();
  }

  async function handleEventClick(arg: EventClickArg) {
    const id = arg.event.id;
    if (id.startsWith("blocked-")) {
      const confirm = window.confirm("Remove this block?");
      if (!confirm) return;
      const realId = id.replace("blocked-", "");
      await supabase.from("availability").delete().eq("id", realId);
      onRefresh();
    } else {
      const booking = bookings.find((b) => `booking-${b.id}` === id);
      if (booking) {
        alert(
          `Booking:\n${booking.first_name ?? ""} ${booking.last_name ?? ""}\n${booking.address}\n${booking.window_count} windows · $${booking.total_price}\nStatus: ${booking.status}`
        );
      }
    }
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <style>{`
        .fc { color: rgba(255,255,255,0.8); font-size: 12px; }
        .fc .fc-toolbar-title { color: white; font-size: 14px; font-weight: 700; }
        .fc .fc-button { background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.25); color: #a78bfa; font-size: 11px; border-radius: 8px; }
        .fc .fc-button:hover { background: rgba(167,139,250,0.25); }
        .fc .fc-button-primary:not(.fc-button-active):not(.fc-button-group > .fc-button) { background: rgba(167,139,250,0.15); }
        .fc .fc-daygrid-day-frame { min-height: 60px; }
        .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number { color: rgba(255,255,255,0.5); font-size: 11px; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.06); }
        .fc-scrollgrid { border: none !important; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
        events={toEvents()}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height={540}
      />
    </div>
  );
}
