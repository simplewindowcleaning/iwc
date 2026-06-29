"use client";

import dynamic from "next/dynamic";

const FullCalendar = dynamic(() => import("@fullcalendar/react").then((m) => m.default), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { adminHeader } from "@/lib/admin";
import { getTownColor, extractTown } from "@/lib/townColors";
import type { Booking, BlockedSlot } from "@/app/admin/types";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";

interface Props {
  bookings: Booking[];
  blocked: BlockedSlot[];
  onRefresh: () => void;
  role?: "owner" | "staff";
  adminPw: string;
}

export function AdminCalendar({ bookings, blocked, onRefresh, role = "owner", adminPw }: Props) {
  const isOwner = role === "owner";

  function toEvents() {
    const bookingEvents = bookings.map((b) => {
      const town = isOwner ? extractTown(b.address) : null;
      const color = town ? getTownColor(town) : "#7c3aed";
      const isHold = b.status === "hold";
      return {
        id: `booking-${b.id}`,
        title: isOwner
          ? isHold
            ? `HOLD — ${b.address.split(",")[0]}`
            : `${b.window_count}w — ${b.address.split(",")[0]}`
          : "Busy",
        start: `${b.service_date}T${b.service_time}`,
        backgroundColor: isOwner ? (isHold ? `${color}55` : color) : "#374151",
        borderColor:     isOwner ? (isHold ? `${color}88` : color) : "#4b5563",
        textColor: isHold ? "rgba(255,255,255,0.5)" : "#fff",
      };
    });

    const blockedEvents = blocked.map((bl) => ({
      id: `blocked-${bl.id}`,
      title: isOwner ? (bl.reason ?? "Blocked") : "Busy",
      start: bl.time_slot ? `${bl.date}T${bl.time_slot}` : bl.date,
      allDay: !bl.time_slot,
      backgroundColor: "#374151",
      borderColor: "#4b5563",
      textColor: "#9ca3af",
    }));

    return [...bookingEvents, ...blockedEvents];
  }

  async function handleDateClick(arg: DateClickArg) {
    if (!isOwner) return;
    const dateStr = arg.dateStr.split("T")[0];
    if (!window.confirm(`Block all of ${dateStr}?`)) return;
    await fetch("/api/admin/block", {
      method: "POST",
      headers: adminHeader(adminPw),
      body: JSON.stringify({ date: dateStr, time_slot: null, reason: "Manually blocked" }),
    });
    onRefresh();
  }

  async function handleEventDrop(arg: EventDropArg) {
    if (!isOwner) { arg.revert(); return; }
    const id = arg.event.id;
    if (!id.startsWith("booking-")) { arg.revert(); return; }
    const bookingId = id.replace("booking-", "");
    const newStart  = arg.event.start;
    if (!newStart) { arg.revert(); return; }

    const newDate = newStart.toISOString().split("T")[0];
    const newTime = newStart.toTimeString().slice(0, 5);

    const draggedBooking = bookings.find((b) => `booking-${b.id}` === id);
    const draggedTown = extractTown(draggedBooking?.address);
    const conflict = bookings.find(
      (b) => b.service_date === newDate && `booking-${b.id}` !== id && b.status !== "cancelled" && extractTown(b.address) !== draggedTown
    );
    if (conflict) {
      arg.revert();
      alert(`Can't move here — ${newDate} already has a ${extractTown(conflict.address) ?? "different-town"} booking.`);
      return;
    }

    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: adminHeader(adminPw),
      body: JSON.stringify({ id: bookingId, service_date: newDate, service_time: newTime }),
    });

    if (!res.ok) { arg.revert(); alert("Couldn't save — try again."); }
    else onRefresh();
  }

  async function handleEventClick(arg: EventClickArg) {
    const id = arg.event.id;
    if (id.startsWith("blocked-")) {
      if (!isOwner) return;
      if (!window.confirm("Remove this block?")) return;
      const realId = id.replace("blocked-", "");
      await fetch("/api/admin/block", {
        method: "DELETE",
        headers: adminHeader(adminPw),
        body: JSON.stringify({ id: realId }),
      });
      onRefresh();
    } else if (isOwner) {
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
        editable={isOwner}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height={540}
      />
    </div>
  );
}
