"use client";

import { useState, useRef } from "react";
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

function TxRow({ tx, onDelete, pw }: { tx: Transaction; onDelete: (id: string) => void; pw: string }) {
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
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12,
    }}>
      <span style={{ color: "rgba(255,255,255,0.28)", width: 84, flexShrink: 0, fontSize: 10 }}>
        {tx.date}
      </span>
      <span style={{ color: "rgba(255,255,255,0.65)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {tx.description}
        {tx.source?.startsWith("upload") && <span style={{ marginLeft: 6, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{tx.source === "upload-acct2" ? "acct 2" : "acct 1"}</span>}
      </span>
      <span style={{
        color: tx.type === "income" ? `${TEAL}0.85)` : `${RED}0.75)`,
        fontWeight: 700, flexShrink: 0, width: 72, textAlign: "right",
      }}>
        {tx.type === "expense" ? "−" : ""}${Number(tx.amount).toFixed(2)}
      </span>
      <button onClick={del} disabled={deleting}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}

function MileRow({ entry, onDelete, pw }: { entry: MileageEntry; onDelete: (id: string) => void; pw: string }) {
  async function del() {
    await fetch("/api/admin/mileage", {
      method: "DELETE", headers: adminHeader(pw), body: JSON.stringify({ id: entry.id }),
    });
    onDelete(entry.id);
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12,
    }}>
      <span style={{ color: "rgba(255,255,255,0.28)", width: 84, flexShrink: 0, fontSize: 10 }}>{entry.date}</span>
      <span style={{ color: "rgba(255,255,255,0.65)", flex: 1 }}>{entry.description ?? "—"}</span>
      <span style={{ color: `${PURPLE}0.85)`, fontWeight: 700, flexShrink: 0, width: 72, textAlign: "right" }}>
        {Number(entry.miles).toFixed(1)} mi
      </span>
      <button onClick={del}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
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
  const [preview, setPreview]       = useState<ParsedRow[] | null>(null);
  const [previewAcct, setPreviewAcct] = useState<1 | 2>(1);
  const [importing, setImporting]   = useState(false);
  const [finTab, setFinTab] = useState<"overview" | "acct1" | "acct2">("overview");

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

  function handleFile(acct: 1 | 2) {
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
      <div style={{ display: "flex", gap: 8 }}>
        {tabBtn("overview", "Overview")}
        {tabBtn("acct1", "Account 1")}
        {tabBtn("acct2", "Account 2")}
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
              Account {previewAcct} — {preview.filter(r => r.selected).length} of {preview.length} rows selected
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
      {(finTab === "acct1" || finTab === "acct2") && (() => {
        const list = finTab === "acct1" ? acct1 : acct2;
        const label = finTab === "acct1" ? "Account 1" : "Account 2";
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
              {list.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                <TxRow key={t.id} tx={t} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Income / Expense columns */}
      {finTab === "overview" && <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>

        {/* Income */}
        <div style={col}>
          <div style={sectionLabel}>Income</div>
          <div style={totalStyle(`${TEAL}0.9)`)}>
            ${incomeYTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={() => fileRef1.current?.click()}
              style={{
                background: `${TEAL}0.08)`, border: `1px solid ${TEAL}0.2)`,
                borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700,
                padding: "7px 12px", cursor: "pointer",
              }}>
              ↑ CSV — Acct 1
            </button>
            <button onClick={() => fileRef2.current?.click()}
              style={{
                background: `${TEAL}0.08)`, border: `1px solid ${TEAL}0.2)`,
                borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700,
                padding: "7px 12px", cursor: "pointer",
              }}>
              ↑ CSV — Acct 2
            </button>
            <input ref={fileRef1} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleFile(1)} style={{ display: "none" }} />
            <input ref={fileRef2} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleFile(2)} style={{ display: "none" }} />
          </div>
          <AddRow type="income" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {income.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No income yet.</p>}
            {income.map(t => (
              <TxRow key={t.id} tx={t} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
            ))}
          </div>
        </div>

        {/* Expenses */}
        <div style={col}>
          <div style={sectionLabel}>Expenses</div>
          <div style={totalStyle(`${RED}0.85)`)}>
            ${expenseYTD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginBottom: 12, height: 34 }} /> {/* spacer to align with income button */}
          <AddRow type="expense" pw={pw} onAdd={t => onTransactionsChange([t, ...transactions])} />
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {expense.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No expenses yet.</p>}
            {expense.map(t => (
              <TxRow key={t.id} tx={t} pw={pw} onDelete={id => onTransactionsChange(transactions.filter(x => x.id !== id))} />
            ))}
          </div>
        </div>
      </div>}

      {/* Mileage */}
      {finTab === "overview" &&
      <div style={{ ...col }}>
        <div style={sectionLabel}>Mileage</div>
        <div style={totalStyle(`${PURPLE}0.9)`)}>
          {milesYTD.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <input type="date" value={mDate} onChange={e => setMDate(e.target.value)}
            style={{ ...fieldStyle, width: 130, flexShrink: 0 }} />
          <input placeholder="Trip description" value={mDesc} onChange={e => setMDesc(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMile()}
            style={{ ...fieldStyle, flex: 1, minWidth: 120 }} />
          <input placeholder="Miles" value={mMiles} onChange={e => setMMiles(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMile()}
            type="number" min="0" step="0.1"
            style={{ ...fieldStyle, width: 90, flexShrink: 0 }} />
          <button onClick={addMile} disabled={mBusy || !mMiles}
            style={{
              background: `${PURPLE}0.12)`, border: `1px solid ${PURPLE}0.28)`,
              borderRadius: 8, color: `${PURPLE}0.9)`, fontSize: 12, fontWeight: 700,
              padding: "7px 14px", cursor: mBusy ? "not-allowed" : "pointer", flexShrink: 0,
              opacity: mBusy ? 0.5 : 1,
            }}>
            {mBusy ? "…" : "Add"}
          </button>
        </div>
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {mileage.length === 0 && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No trips logged yet.</p>}
          {mileage.map(m => (
            <MileRow key={m.id} entry={m} pw={pw} onDelete={id => onMileageChange(mileage.filter(x => x.id !== id))} />
          ))}
        </div>
      </div>}

    </div>
  );
}
