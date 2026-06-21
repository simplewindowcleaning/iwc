"use client";

import React, { useState, useRef } from "react";
import { adminHeader } from "@/lib/admin";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string;
  category: string | null;
}

interface MileageEntry {
  id: string;
  date: string;
  miles: number;
  description: string | null;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  selected: boolean;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function findCol(headers: string[], ...terms: string[]): number {
  const h = headers.map(s => s.toLowerCase().replace(/[^a-z]/g, ""));
  return h.findIndex(col => terms.some(t => col.includes(t)));
}

function parseDate(raw: string): string {
  // Handle MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY
  const clean = raw.replace(/['"]/g, "").trim();
  const mdy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdy) {
    const y = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${y}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }
  const iso = clean.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function bankCSVtoRows(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const dateIdx   = findCol(headers, "date", "posted", "trans");
  const descIdx   = findCol(headers, "desc", "payee", "memo", "name", "narr", "detail");
  const amtIdx    = findCol(headers, "amount", "amt");
  const debitIdx  = findCol(headers, "debit", "withdrawal", "charge");
  const creditIdx = findCol(headers, "credit", "deposit", "payment");

  if (dateIdx === -1) return [];

  const rows: ParsedRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    const date = parseDate(cells[dateIdx] ?? "");
    const desc = (cells[descIdx] ?? cells.find((_, i) => i !== dateIdx && i !== amtIdx && i !== debitIdx && i !== creditIdx) ?? "").replace(/"/g, "");

    let amount = 0;
    if (amtIdx !== -1) {
      amount = parseFloat((cells[amtIdx] ?? "0").replace(/[$,\s"]/g, ""));
    } else if (debitIdx !== -1 || creditIdx !== -1) {
      const debit  = debitIdx  !== -1 ? parseFloat((cells[debitIdx]  ?? "0").replace(/[$,\s"]/g, "")) || 0 : 0;
      const credit = creditIdx !== -1 ? parseFloat((cells[creditIdx] ?? "0").replace(/[$,\s"]/g, "")) || 0 : 0;
      amount = credit - debit;
    }

    if (!amount || !desc || !date) continue;
    rows.push({
      date,
      description: desc.trim(),
      amount: Math.abs(amount),
      type: amount >= 0 ? "income" : "expense",
      selected: true,
    });
  }
  return rows;
}

const ACCT_NAMES: Record<1 | 2 | 3, string> = { 1: "Shark", 2: "IC", 3: "PayPal" };

// ── Schedule C categories ─────────────────────────────────────────────────────

export const SCHED_C_INCOME = [
  "Service Revenue",
  "Tips Received",
  "Other Income",
];

export const SCHED_C_EXPENSES = [
  "Advertising & Marketing",
  "Car & Truck (Actual)",
  "Commissions & Fees",
  "Contract Labor",
  "Insurance (Business)",
  "Legal & Professional",
  "Office Supplies",
  "Repairs & Maintenance",
  "Supplies",
  "Taxes & Licenses",
  "Travel",
  "Meals (50% deductible)",
  "Utilities",
  "Other Expenses",
];

const ALL_CATEGORIES = [...SCHED_C_INCOME, ...SCHED_C_EXPENSES];

// ── Styles ────────────────────────────────────────────────────────────────────

const TEAL   = "rgba(126,200,227,";
const PURPLE = "rgba(167,139,250,";
const RED    = "rgba(251,113,133,";

const fieldStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, color: "rgba(255,255,255,0.85)", fontSize: 12,
  padding: "7px 10px", outline: "none", fontFamily: "inherit",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AddRow({ onAdd, type, pw }: {
  type: "income" | "expense";
  pw: string;
  onAdd: (t: Transaction) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]   = useState(today);
  const [desc, setDesc]   = useState("");
  const [amt,  setAmt]    = useState("");
  const [busy, setBusy]   = useState(false);

  async function save() {
    const amount = parseFloat(amt);
    if (!desc.trim() || !amount || !date) return;
    setBusy(true);
    const res = await fetch("/api/admin/transactions", {
      method: "POST",
      headers: adminHeader(pw),
      body: JSON.stringify({ date, description: desc.trim(), amount, type, source: "manual" }),
    });
    if (res.ok) {
      const { transactions } = await res.json();
      onAdd(transactions[0]);
      setDesc(""); setAmt(""); setDate(today);
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ ...fieldStyle, width: 130, flexShrink: 0 }} />
      <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
        onKeyDown={e => e.key === "Enter" && save()}
        style={{ ...fieldStyle, flex: 1, minWidth: 120 }} />
      <input placeholder="$0.00" value={amt} onChange={e => setAmt(e.target.value)}
        onKeyDown={e => e.key === "Enter" && save()}
        type="number" min="0" step="0.01"
        style={{ ...fieldStyle, width: 90, flexShrink: 0 }} />
      <button onClick={save} disabled={busy || !desc.trim() || !amt}
        style={{
          background: type === "income" ? `${TEAL}0.15)` : `${RED}0.15)`,
          border: `1px solid ${type === "income" ? TEAL : RED}0.3)`,
          color: type === "income" ? `${TEAL}0.9)` : `${RED}0.9)`,
          borderRadius: 8, fontSize: 12, fontWeight: 700, padding: "7px 14px",
          cursor: busy ? "not-allowed" : "pointer", flexShrink: 0,
          opacity: busy ? 0.5 : 1,
        }}>
        {busy ? "…" : "Add"}
      </button>
    </div>
  );
}

function TxRow({ tx, onDelete, pw, compact }: { tx: Transaction; onDelete: (id: string) => void; pw: string; compact?: boolean }) {
  const [deleting, setDeleting] = useState(false);
  async function del() {
    setDeleting(true);
    await fetch("/api/admin/transactions", {
      method: "DELETE", headers: adminHeader(pw), body: JSON.stringify({ id: tx.id }),
    });
    onDelete(tx.id);
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, minHeight: 35,
    }}>
      {!compact && <span style={{ color: "rgba(255,255,255,0.28)", width: 84, flexShrink: 0, fontSize: 10 }}>{tx.date}</span>}
      <span style={{ color: "rgba(255,255,255,0.65)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {tx.description}
        {tx.source?.startsWith("upload-acct") && <span style={{ marginLeft: 6, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{ACCT_NAMES[Number(tx.source.slice(-1)) as 1|2|3] ?? tx.source}</span>}
      </span>
      <span style={{ color: tx.type === "income" ? `${TEAL}0.85)` : `${RED}0.75)`, fontWeight: 700, flexShrink: 0, width: 64, textAlign: "right" }}>
        {tx.type === "expense" ? "−" : ""}${Number(tx.amount).toFixed(2)}
      </span>
      <button onClick={del} disabled={deleting}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}

function MileRow({ entry, onDelete, pw, compact }: { entry: MileageEntry; onDelete: (id: string) => void; pw: string; compact?: boolean }) {
  async function del() {
    await fetch("/api/admin/mileage", {
      method: "DELETE", headers: adminHeader(pw), body: JSON.stringify({ id: entry.id }),
    });
    onDelete(entry.id);
  }
  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, padding: "7px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", minHeight: 35 }}>
        <span style={{ color: `${PURPLE}0.85)`, fontWeight: 700, fontSize: 12 }}>{Number(entry.miles).toFixed(1)}</span>
        <button onClick={del} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 13, padding: "0 2px", flexShrink: 0 }}>×</button>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, minHeight: 35,
    }}>
      <span style={{ color: "rgba(255,255,255,0.28)", width: 84, flexShrink: 0, fontSize: 10 }}>{entry.date}</span>
      <span style={{ color: "rgba(255,255,255,0.55)", flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description ?? "—"}</span>
      <span style={{ color: `${PURPLE}0.85)`, fontWeight: 700, flexShrink: 0, width: 58, textAlign: "right", fontSize: 12 }}>
        {Number(entry.miles).toFixed(1)} mi
      </span>
      <button onClick={del}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}

function EmptyCell() {
  return <div style={{ minHeight: 35, borderBottom: "1px solid rgba(255,255,255,0.02)" }} />;
}

// ── Month separator helpers ───────────────────────────────────────────────────

const MONTH_COLORS = [
  "rgba(126,200,227,", // Jan — teal
  "rgba(167,139,250,", // Feb — purple
  "rgba(251,191,36,",  // Mar — amber
  "rgba(52,211,153,",  // Apr — emerald
  "rgba(251,113,133,", // May — rose
  "rgba(99,179,237,",  // Jun — sky
  "rgba(251,146,60,",  // Jul — orange
  "rgba(163,230,53,",  // Aug — lime
  "rgba(232,121,249,", // Sep — fuchsia
  "rgba(94,234,212,",  // Oct — cyan
  "rgba(250,204,21,",  // Nov — yellow
  "rgba(248,113,113,", // Dec — red
];

function monthColor(date: string) {
  const m = parseInt(date.slice(5, 7), 10) - 1;
  return MONTH_COLORS[m] ?? MONTH_COLORS[0];
}

function MonthSeparator({ date }: { date: string }) {
  const c = monthColor(date);
  const label = new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 10px 4px", marginTop: 4,
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: `${c}0.8)` }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `${c}0.15)` }} />
    </div>
  );
}

function sortedByDate(list: Transaction[]) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

function TxListWithSeparators({ list, pw, onDelete }: {
  list: Transaction[];
  pw: string;
  onDelete: (id: string) => void;
}) {
  const sorted = sortedByDate(list);
  const items: React.ReactNode[] = [];
  let lastMonth = "";
  sorted.forEach(tx => {
    const month = tx.date.slice(0, 7);
    if (month !== lastMonth) {
      items.push(<MonthSeparator key={`sep-${month}`} date={tx.date} />);
      lastMonth = month;
    }
    items.push(<TxRow key={tx.id} tx={tx} pw={pw} onDelete={onDelete} />);
  });
  return <>{items}</>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function FinanceTab({ pw, transactions, mileage, onTransactionsChange, onMileageChange }: {
  pw: string;
  transactions: Transaction[];
  mileage: MileageEntry[];
  onTransactionsChange: (t: Transaction[]) => void;
  onMileageChange: (m: MileageEntry[]) => void;
}) {
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const [preview, setPreview]       = useState<ParsedRow[] | null>(null);
  const [previewAcct, setPreviewAcct] = useState<1 | 2 | 3>(1);
  const [importing, setImporting]   = useState(false);
  const [finTab, setFinTab] = useState<"overview" | "acct1" | "acct2" | "acct3" | "taxes" | "inc-list" | "exp-list" | "mile-list">("overview");
  const [search, setSearch] = useState("");
  const [mileInlineDate, setMileInlineDate] = useState<string | null>(null);
  const [mileInlineVal, setMileInlineVal]   = useState("");
  const [mileInlineDesc, setMileInlineDesc] = useState("");

  // Mileage add form state
  const today = new Date().toISOString().slice(0, 10);
  const [mDate, setMDate] = useState(today);
  const [mMiles, setMMiles] = useState("");
  const [mDesc, setMDesc]   = useState("");
  const [mBusy, setMBusy]   = useState(false);

  const ytdYear = new Date().getFullYear();
  const ytd = (list: Transaction[], type: "income" | "expense") =>
    list.filter(t => t.type === type && t.date.startsWith(String(ytdYear)))
        .reduce((s, t) => s + Number(t.amount), 0);

  const incomeYTD  = ytd(transactions, "income");
  const expenseYTD = ytd(transactions, "expense");
  const netYTD     = incomeYTD - expenseYTD;
  const milesYTD   = mileage
    .filter(m => m.date.startsWith(String(ytdYear)))
    .reduce((s, m) => s + Number(m.miles), 0);

  function handleFile(acct: 1 | 2 | 3) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      const allRows: ParsedRow[] = [];
      let done = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const rows = bankCSVtoRows(ev.target?.result as string);
          allRows.push(...rows);
          done++;
          if (done === files.length) {
            setPreviewAcct(acct);
            setPreview(allRows);
          }
        };
        reader.readAsText(file);
      });
      e.target.value = "";
    };
  }

  async function importSelected() {
    if (!preview) return;
    const selected = preview.filter(r => r.selected);
    if (!selected.length) return;
    setImporting(true);
    const payload = selected.map(({ date, description, amount, type }) => ({
      date, description, amount, type, source: `upload-acct${previewAcct}`,
    }));
    const res = await fetch("/api/admin/transactions", {
      method: "POST", headers: adminHeader(pw), body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { transactions: added } = await res.json();
      onTransactionsChange([...added, ...transactions]);
    }
    setPreview(null);
    setImporting(false);
  }

  function togglePreviewRow(i: number) {
    setPreview(prev => prev ? prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r) : null);
  }

  async function updateCategory(id: string, category: string) {
    await fetch("/api/admin/transactions", {
      method: "PATCH", headers: adminHeader(pw), body: JSON.stringify({ id, category }),
    });
    onTransactionsChange(transactions.map(t => t.id === id ? { ...t, category } : t));
  }

  async function bulkCategory(ids: string[], category: string) {
    await Promise.all(ids.map(id =>
      fetch("/api/admin/transactions", {
        method: "PATCH", headers: adminHeader(pw), body: JSON.stringify({ id, category }),
      })
    ));
    onTransactionsChange(transactions.map(t => ids.includes(t.id) ? { ...t, category } : t));
  }

  async function submitInlineMile(date: string) {
    const miles = parseFloat(mileInlineVal);
    if (!miles) return;
    setMBusy(true);
    const res = await fetch("/api/admin/mileage", {
      method: "POST", headers: adminHeader(pw),
      body: JSON.stringify({ date, miles, description: mileInlineDesc.trim() || null }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      onMileageChange([entry, ...mileage]);
    }
    setMileInlineDate(null); setMileInlineVal(""); setMileInlineDesc("");
    setMBusy(false);
  }

  async function addMile() {
    const miles = parseFloat(mMiles);
    if (!miles || !mDate) return;
    setMBusy(true);
    const res = await fetch("/api/admin/mileage", {
      method: "POST", headers: adminHeader(pw),
      body: JSON.stringify({ date: mDate, miles, description: mDesc.trim() || null }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      onMileageChange([entry, ...mileage]);
      setMMiles(""); setMDesc(""); setMDate(today);
    }
    setMBusy(false);
  }

  const income  = transactions.filter(t => t.type === "income");
  const expense = transactions.filter(t => t.type === "expense");

  const col: React.CSSProperties = {
    flex: 1, minWidth: 0,
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: 16,
  };

  const totalStyle = (color: string): React.CSSProperties => ({
    fontSize: 26, fontWeight: 800, color, marginBottom: 12,
  });

  const acct1 = transactions.filter(t => t.source === "upload-acct1" || t.source === "manual");
  const acct2 = transactions.filter(t => t.source === "upload-acct2");
  const acct3 = transactions.filter(t => t.source === "upload-acct3");

  const tabBtn = (id: typeof finTab, label: string) => (
    <button
      onClick={() => setFinTab(id)}
      style={{
        background: finTab === id ? "rgba(126,200,227,0.14)" : "transparent",
        border: `1px solid ${finTab === id ? "rgba(126,200,227,0.35)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 8, color: finTab === id ? "rgba(126,200,227,0.95)" : "rgba(255,255,255,0.4)",
        fontSize: 11, fontWeight: 700, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabBtn("overview", "Overview")}
        {tabBtn("acct1", "Shark")}
        {tabBtn("acct2", "IC")}
        {tabBtn("acct3", "PayPal")}
        {tabBtn("taxes", "Taxes / Sched C")}
        {tabBtn("inc-list", "Income")}
        {tabBtn("exp-list", "Expenses")}
        {tabBtn("mile-list", "Mileage")}
      </div>

      {/* YTD summary strip */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: `Income ${ytdYear}`,  value: `$${incomeYTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,  color: `${TEAL}0.85)` },
          { label: `Expenses ${ytdYear}`, value: `$${expenseYTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: `${RED}0.75)` },
          { label: "Net",   value: `${netYTD >= 0 ? "+" : "−"}$${Math.abs(netYTD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: netYTD >= 0 ? `${TEAL}0.85)` : `${RED}0.75)` },
          { label: "Miles YTD", value: `${milesYTD.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`, color: `${PURPLE}0.85)` },
        ].map(c => (
          <div key={c.label} style={{
            flex: "1 1 140px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 5 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* CSV preview modal */}
      {preview && (
        <div style={{
          background: "rgba(10,10,18,0.97)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
              {ACCT_NAMES[previewAcct]} — {preview.filter(r => r.selected).length} of {preview.length} rows selected
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPreview(null)}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 7, color: "rgba(255,255,255,0.5)", fontSize: 11, padding: "5px 12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={importSelected} disabled={importing || preview.filter(r => r.selected).length === 0}
                style={{
                  background: `${TEAL}0.15)`, border: `1px solid ${TEAL}0.3)`,
                  borderRadius: 7, color: `${TEAL}0.9)`, fontSize: 11, fontWeight: 700,
                  padding: "5px 14px", cursor: "pointer",
                }}>
                {importing ? "Importing…" : "Import Selected"}
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {preview.map((row, i) => (
              <div key={i} onClick={() => togglePreviewRow(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", cursor: "pointer",
                  background: row.selected ? "rgba(255,255,255,0.04)" : "transparent",
                  borderRadius: 6, marginBottom: 2,
                  opacity: row.selected ? 1 : 0.35,
                }}>
                <input type="checkbox" checked={row.selected} onChange={() => togglePreviewRow(i)}
                  onClick={e => e.stopPropagation()} style={{ accentColor: "#7ec8e3", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.3)", width: 84, flexShrink: 0, fontSize: 10 }}>{row.date}</span>
                <span style={{ color: "rgba(255,255,255,0.65)", flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</span>
                <select value={row.type}
                  onChange={e => setPreview(prev => prev ? prev.map((r, idx) => idx === i ? { ...r, type: e.target.value as "income" | "expense" } : r) : null)}
                  onClick={e => e.stopPropagation()}
                  style={{ ...fieldStyle, fontSize: 10, padding: "4px 6px", width: 84, flexShrink: 0 }}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <span style={{
                  color: row.type === "income" ? `${TEAL}0.85)` : `${RED}0.75)`,
                  fontWeight: 700, width: 72, textAlign: "right", flexShrink: 0, fontSize: 12,
                }}>
                  ${row.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account views */}
      {(finTab === "acct1" || finTab === "acct2" || finTab === "acct3") && (() => {
        const list = finTab === "acct1" ? acct1 : finTab === "acct2" ? acct2 : acct3;
        const label = finTab === "acct1" ? ACCT_NAMES[1] : finTab === "acct2" ? ACCT_NAMES[2] : ACCT_NAMES[3];
        const acctIncome  = list.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const acctExpense = list.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        return (
          <div style={col}>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 3 }}>{label} — In</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: `${TEAL}0.9)` }}>${acctIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 3 }}>{label} — Out</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: `${RED}0.85)` }}>${acctExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {list.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No transactions for this account yet.</p>}
              <TxListWithSeparators list={list} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
            </div>
          </div>
        );
      })()}

      {/* Search + categorize */}
      {finTab === "overview" && (() => {
        const term = search.trim().toLowerCase();
        const hits = term ? transactions.filter(t => t.description.toLowerCase().includes(term)) : [];
        const hitIds = hits.map(h => h.id);
        return (
          <div style={col}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                placeholder="Search transactions (e.g. safeway, instacart…)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...fieldStyle, flex: 1 }}
              />
              {search && <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>×</button>}
            </div>
            {term && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{hits.length} result{hits.length !== 1 ? "s" : ""}</span>
                  {hits.length > 1 && (
                    <>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>· tag all as</span>
                      <select
                        defaultValue=""
                        onChange={async e => {
                          if (!e.target.value) return;
                          await bulkCategory(hitIds, e.target.value);
                          e.target.value = "";
                        }}
                        style={{ ...fieldStyle, fontSize: 10, padding: "4px 8px" }}
                      >
                        <option value="">choose category…</option>
                        <optgroup label="Income">{SCHED_C_INCOME.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                        <optgroup label="Expenses">{SCHED_C_EXPENSES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                      </select>
                    </>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {hits.length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No matches.</p>}
                  {sortedByDate(hits).map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "rgba(255,255,255,0.28)", width: 84, flexShrink: 0, fontSize: 10 }}>{t.date}</span>
                      <span style={{ flex: 1, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</span>
                      <span style={{ color: t.type === "income" ? `${TEAL}0.85)` : `${RED}0.75)`, fontWeight: 700, flexShrink: 0, width: 72, textAlign: "right" }}>
                        {t.type === "expense" ? "−" : ""}${Number(t.amount).toFixed(2)}
                      </span>
                      <select
                        value={t.category ?? ""}
                        onChange={e => updateCategory(t.id, e.target.value)}
                        style={{ ...fieldStyle, fontSize: 10, padding: "3px 6px", width: 150, flexShrink: 0 }}
                      >
                        <option value="">uncategorized</option>
                        <optgroup label="Income">{SCHED_C_INCOME.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                        <optgroup label="Expenses">{SCHED_C_EXPENSES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Date-aligned three-column view */}
      {finTab === "overview" && (() => {
        const allDates = [...new Set([
          ...income.map(t => t.date),
          ...expense.map(t => t.date),
          ...mileage.map(m => m.date),
        ])].sort((a, b) => b.localeCompare(a));

        let lastMonth3 = "";

        const colHead = (label: string, color: string) => (
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color, padding: "6px 10px" }}>{label}</div>
        );

        return (
          <div style={col}>
            {/* Upload / add controls */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={() => fileRef1.current?.click()} style={{ background: `${TEAL}0.08)`, border: `1px solid ${TEAL}0.2)`, borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700, padding: "6px 11px", cursor: "pointer" }}>↑ CSV — Shark</button>
              <button onClick={() => fileRef2.current?.click()} style={{ background: `${TEAL}0.08)`, border: `1px solid ${TEAL}0.2)`, borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700, padding: "6px 11px", cursor: "pointer" }}>↑ CSV — IC</button>
              <button onClick={() => fileRef3.current?.click()} style={{ background: `${TEAL}0.08)`, border: `1px solid ${TEAL}0.2)`, borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700, padding: "6px 11px", cursor: "pointer" }}>↑ CSV — PayPal</button>
              <input ref={fileRef1} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleFile(1)} style={{ display: "none" }} />
              <input ref={fileRef2} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleFile(2)} style={{ display: "none" }} />
              <input ref={fileRef3} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleFile(3)} style={{ display: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px", gap: 8, marginBottom: 8 }}>
              <AddRow type="income" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
              <AddRow type="expense" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
              {/* Mileage add */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={{ ...fieldStyle, flex: 1, fontSize: 11, padding: "6px 8px" }} />
                  <input placeholder="Mi" value={mMiles} onChange={e => setMMiles(e.target.value)} onKeyDown={e => e.key === "Enter" && addMile()} type="number" min="0" step="0.1" style={{ ...fieldStyle, width: 52, fontSize: 11, padding: "6px 6px" }} />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input placeholder="Trip description" value={mDesc} onChange={e => setMDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && addMile()} style={{ ...fieldStyle, flex: 1, fontSize: 11, padding: "6px 8px" }} />
                  <button onClick={addMile} disabled={mBusy || !mMiles} style={{ background: `${PURPLE}0.12)`, border: `1px solid ${PURPLE}0.28)`, borderRadius: 8, color: `${PURPLE}0.9)`, fontSize: 11, fontWeight: 700, padding: "6px 10px", cursor: mBusy ? "not-allowed" : "pointer", flexShrink: 0, opacity: mBusy ? 0.5 : 1 }}>{mBusy ? "…" : "Add"}</button>
                </div>
              </div>
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 78px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
              {colHead("Income", `${TEAL}0.6)`)}
              {colHead("Expenses", `${RED}0.6)`)}
              {colHead("Mi", `${PURPLE}0.6)`)}
            </div>

            {/* Date-aligned rows */}
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {allDates.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, padding: 10 }}>No transactions yet.</p>}
              {allDates.map(date => {
                const month = date.slice(0, 7);
                const showSep = month !== lastMonth3;
                lastMonth3 = month;
                const dayInc  = income.filter(t => t.date === date);
                const dayExp  = expense.filter(t => t.date === date);
                const dayMile = mileage.filter(m => m.date === date);
                const mileTotal = dayMile.reduce((s, m) => s + Number(m.miles), 0);
                // +1 so there's always a "+" row at the end of the mileage column
                const maxRows = Math.max(dayInc.length, dayExp.length, dayMile.length + 1);
                const mc = monthColor(date);
                const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

                const mileCell = (i: number) => {
                  if (i < dayMile.length) {
                    return <MileRow compact entry={dayMile[i]} pw={pw} onDelete={id => onMileageChange(mileage.filter(x => x.id !== id))} />;
                  }
                  if (i === dayMile.length) {
                    // "+" button or inline add form
                    if (mileInlineDate === date) {
                      return (
                        <div style={{ padding: "5px 6px", minHeight: 35, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                            <input
                              autoFocus type="number" min="0" step="0.1" placeholder="mi"
                              value={mileInlineVal}
                              onChange={e => setMileInlineVal(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") submitInlineMile(date); if (e.key === "Escape") { setMileInlineDate(null); setMileInlineVal(""); setMileInlineDesc(""); } }}
                              style={{ ...fieldStyle, width: 38, fontSize: 11, padding: "3px 4px" }}
                            />
                            <button onClick={() => submitInlineMile(date)} disabled={!mileInlineVal}
                              style={{ background: `${PURPLE}0.2)`, border: `1px solid ${PURPLE}0.3)`, borderRadius: 5, color: `${PURPLE}0.9)`, fontSize: 11, padding: "3px 5px", cursor: "pointer", opacity: mileInlineVal ? 1 : 0.4 }}>✓</button>
                            <button onClick={() => { setMileInlineDate(null); setMileInlineVal(""); setMileInlineDesc(""); }}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", padding: "0 1px" }}>×</button>
                          </div>
                          <input placeholder="desc (optional)"
                            value={mileInlineDesc} onChange={e => setMileInlineDesc(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && submitInlineMile(date)}
                            style={{ ...fieldStyle, width: "100%", fontSize: 10, padding: "2px 4px", marginTop: 3 }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div style={{ minHeight: 35, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <button
                          onClick={() => { setMileInlineDate(date); setMileInlineVal(""); setMileInlineDesc(""); }}
                          style={{ background: "none", border: "none", color: `${PURPLE}0.22)`, cursor: "pointer", fontSize: 15, padding: "2px 10px", lineHeight: 1, fontWeight: 700 }}
                        >+</button>
                      </div>
                    );
                  }
                  return <EmptyCell />;
                };

                return (
                  <React.Fragment key={date}>
                    {showSep && <MonthSeparator date={date} />}
                    {/* Date label row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 2px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: `${mc}0.5)`, width: 110, flexShrink: 0 }}>{dateLabel}</span>
                      {dayMile.length > 1 && <span style={{ fontSize: 9, color: `${PURPLE}0.45)`, marginLeft: "auto" }}>{mileTotal.toFixed(1)} mi</span>}
                    </div>
                    {/* Aligned rows */}
                    {Array.from({ length: maxRows }).map((_, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 78px" }}>
                        <div>{dayInc[i]
                          ? <TxRow compact tx={dayInc[i]} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
                          : <EmptyCell />}
                        </div>
                        <div>{dayExp[i]
                          ? <TxRow compact tx={dayExp[i]} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
                          : <EmptyCell />}
                        </div>
                        <div>{mileCell(i)}</div>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Income list tab */}
      {finTab === "inc-list" && (
        <div style={col}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={sectionLabel}>All Income</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: `${TEAL}0.9)` }}>${incomeYTD.toLocaleString("en-US", { minimumFractionDigits: 2 })} YTD</div>
          </div>
          <AddRow type="income" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {income.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No income yet.</p>}
            <TxListWithSeparators list={income} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
          </div>
        </div>
      )}

      {/* Expense list tab */}
      {finTab === "exp-list" && (
        <div style={col}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={sectionLabel}>All Expenses</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: `${RED}0.85)` }}>${expenseYTD.toLocaleString("en-US", { minimumFractionDigits: 2 })} YTD</div>
          </div>
          <AddRow type="expense" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {expense.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No expenses yet.</p>}
            <TxListWithSeparators list={expense} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
          </div>
        </div>
      )}

      {/* Mileage list tab */}
      {finTab === "mile-list" && (
        <div style={col}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={sectionLabel}>All Mileage</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: `${PURPLE}0.9)` }}>{milesYTD.toFixed(1)} mi YTD</div>
          </div>
          {/* Add form */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={{ ...fieldStyle, width: 130, flexShrink: 0 }} />
            <input placeholder="Miles" value={mMiles} onChange={e => setMMiles(e.target.value)} onKeyDown={e => e.key === "Enter" && addMile()} type="number" min="0" step="0.1" style={{ ...fieldStyle, width: 80, flexShrink: 0 }} />
            <input placeholder="Description (optional)" value={mDesc} onChange={e => setMDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && addMile()} style={{ ...fieldStyle, flex: 1, minWidth: 120 }} />
            <button onClick={addMile} disabled={mBusy || !mMiles} style={{ background: `${PURPLE}0.12)`, border: `1px solid ${PURPLE}0.28)`, borderRadius: 8, color: `${PURPLE}0.9)`, fontSize: 12, fontWeight: 700, padding: "7px 14px", cursor: mBusy ? "not-allowed" : "pointer", flexShrink: 0, opacity: mBusy ? 0.5 : 1 }}>{mBusy ? "…" : "Add"}</button>
          </div>
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {mileage.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No trips logged yet.</p>}
            {[...mileage].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
              <MileRow key={entry.id} entry={entry} pw={pw} onDelete={id => onMileageChange(mileage.filter(x => x.id !== id))} />
            ))}
          </div>
        </div>
      )}

      {/* Taxes / Schedule C */}
      {finTab === "taxes" && (() => {
        const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const catTotal = (cat: string) =>
          transactions.filter(t => t.category === cat).reduce((s, t) => s + Number(t.amount), 0);
        const uncategorized = transactions.filter(t => !t.category || t.category === "");
        const totalIncome  = SCHED_C_INCOME.reduce((s, c) => s + catTotal(c), 0);
        const totalExpense = SCHED_C_EXPENSES.reduce((s, c) => s + catTotal(c), 0);
        const mileDeduction = milesYTD * 0.67;
        const netProfit = totalIncome - totalExpense - mileDeduction;

        const Section = ({ title, cats, color }: { title: string; cats: string[]; color: string }) => (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color, marginBottom: 8 }}>{title}</div>
            {cats.map(cat => {
              const total = catTotal(cat);
              if (total === 0) return null;
              return (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>{cat}</span>
                  <span style={{ fontWeight: 700, color }}>{fmt(total)}</span>
                </div>
              );
            })}
          </div>
        );

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Total Income",      value: fmt(totalIncome),     color: `${TEAL}0.9)` },
                { label: "Total Expenses",    value: fmt(totalExpense),    color: `${RED}0.8)` },
                { label: "Mileage Deduction", value: fmt(mileDeduction),   color: `${PURPLE}0.85)` },
                { label: "Est. Net Profit",   value: fmt(netProfit),       color: netProfit >= 0 ? `${TEAL}0.9)` : `${RED}0.8)` },
              ].map(c => (
                <div key={c.label} style={{ flex: "1 1 140px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 5 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={col}>
              <Section title="Part I — Income" cats={SCHED_C_INCOME} color={`${TEAL}0.85)`} />
              <Section title="Part II — Expenses" cats={SCHED_C_EXPENSES} color={`${RED}0.75)`} />
              {milesYTD > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: `${PURPLE}0.7)`, marginBottom: 8 }}>Part II Line 9 — Car & Truck (Mileage Method)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{milesYTD.toFixed(1)} mi × $0.67</span>
                    <span style={{ fontWeight: 700, color: `${PURPLE}0.85)` }}>{fmt(mileDeduction)}</span>
                  </div>
                </div>
              )}
              {uncategorized.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,150,50,0.7)", marginBottom: 8 }}>
                    ⚠ Uncategorized ({uncategorized.length})
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Search these in Overview to tag them.</p>
                  {uncategorized.slice(0, 8).map(t => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{t.description}</span>
                      <span style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{fmt(Number(t.amount))}</span>
                    </div>
                  ))}
                  {uncategorized.length > 8 && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>…and {uncategorized.length - 8} more</p>}
                </div>
              )}
            </div>

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              Mileage uses IRS standard rate ($0.67/mi). Meals are 50% deductible — adjust at tax time. Not tax advice.
            </p>
          </div>
        );
      })()}

    </div>
  );
}
