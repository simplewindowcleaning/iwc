"use client";

import type { Booking } from "@/app/admin/types";
import { getTownColor, extractTown } from "@/lib/townColors";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  bookings: Booking[];
}

export function DateStrip({ bookings }: Props) {
  // Build date → town map (skip cancelled)
  const bookingByDate: Record<string, string> = {};
  for (const b of bookings) {
    if (b.service_date && b.status !== "cancelled") {
      const town = extractTown(b.address);
      if (town) bookingByDate[b.service_date] = town;
    }
  }

  // 2 years of dates from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows: { date: Date; monthHeader: boolean }[] = [];
  let cur = new Date(today);
  const end = new Date(today);
  end.setFullYear(today.getFullYear() + 2);
  let lastMonth = -1;
  while (cur <= end) {
    const monthHeader = cur.getMonth() !== lastMonth;
    if (monthHeader) lastMonth = cur.getMonth();
    rows.push({ date: new Date(cur), monthHeader });
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div style={{
      width: 128,
      flexShrink: 0,
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(0,0,0,0.18)",
    }}>
      {rows.map(({ date, monthHeader }) => {
        const dateStr = toLocalDateStr(date);
        const town = bookingByDate[dateStr];
        const color = town ? getTownColor(town) : null;
        const isToday = dateStr === toLocalDateStr(today);

        return (
          <div key={dateStr}>
            {monthHeader && (
              <div style={{
                padding: "6px 8px 4px",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
              }}>
                {MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
              </div>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px",
              height: 22,
              background: color
                ? `${color}22`
                : isToday
                ? "rgba(255,255,255,0.06)"
                : undefined,
              borderLeft: isToday ? "2px solid rgba(255,255,255,0.35)" : color ? `2px solid ${color}88` : "2px solid transparent",
              transition: "background 0.15s",
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: isToday ? 800 : town ? 700 : 400,
                color: color ?? (isToday ? "white" : "rgba(255,255,255,0.25)"),
                minWidth: 18,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}>
                {date.getDate()}
              </span>
              {town && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: color ?? undefined,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}>
                  {town}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
