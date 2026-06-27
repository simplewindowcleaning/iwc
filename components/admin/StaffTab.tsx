"use client";
import { useEffect, useRef, useState } from "react";
import { adminHeader } from "@/lib/admin";

interface StaffProfile {
  id: string;
  name: string;
  provider_number: string | null;
  preferred_zip: string | null;
  pro_level: number | null;
  phone_text: string | null;
  email: string | null;
  phone_voice: string | null;
  photo_url: string | null;
  pin: string | null;
  role: "admin" | "worker";
  active: boolean;
}

const EMPTY: Omit<StaffProfile, "id" | "active"> = {
  name: "", provider_number: "", preferred_zip: "",
  pro_level: 1, phone_text: "", email: "", phone_voice: "", photo_url: null,
  pin: "", role: "worker",
};

const TEAL  = "rgba(126,200,227,";
const GREEN = "rgba(52,211,153,";

function Stars({ level, onChange }: { level: number; onChange?: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={() => onChange?.(n)}
          style={{
            fontSize: 14, cursor: onChange ? "pointer" : "default",
            color: n <= level ? "#fbbf24" : "rgba(255,255,255,0.15)",
          }}>★</span>
      ))}
    </div>
  );
}

function Avatar({ url, name, size = 64 }: { url: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(126,200,227,0.3)" }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #1278A0, #0A3D5C)",
      border: "2px solid rgba(126,200,227,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 800, color: "rgba(255,255,255,0.85)",
    }}>{initials}</div>
  );
}

export function StaffTab({ pw }: { pw: string }) {
  const [staff, setStaff]     = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [form, setForm]       = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = adminHeader(pw);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/staff", { headers });
    const { staff: data } = await res.json();
    setStaff(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(s: StaffProfile) {
    setEditing(s);
    setIsNew(false);
    setForm({
      name: s.name, provider_number: s.provider_number ?? "",
      preferred_zip: s.preferred_zip ?? "", pro_level: s.pro_level ?? 1,
      phone_text: s.phone_text ?? "", email: s.email ?? "",
      phone_voice: s.phone_voice ?? "", photo_url: s.photo_url,
      pin: s.pin ?? "", role: s.role ?? "worker",
    });
  }

  function openNew() {
    setEditing({ id: "", active: true, ...EMPTY } as StaffProfile);
    setIsNew(true);
    setForm({ ...EMPTY });
  }

  async function save() {
    if (!editing || !form.name.trim()) return;
    setSaving(true);
    const body = isNew ? form : { id: editing.id, ...form };
    await fetch("/api/admin/staff", {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setSaving(false);
    setEditing(null);
  }

  async function remove() {
    if (!editing || isNew) return;
    if (!confirm(`Remove ${editing.name}?`)) return;
    await fetch("/api/admin/staff", {
      method: "DELETE", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id }),
    });
    await load();
    setEditing(null);
  }

  async function uploadPhoto(file: File) {
    if (!editing || isNew) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(`/api/admin/staff/${editing.id}/photo`, { method: "POST", headers, body: fd });
    const { url } = await res.json();
    setForm(f => ({ ...f, photo_url: url }));
    await load();
    setUploading(false);
  }

  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "white", outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{staff.length} staff members</span>
        <button onClick={openNew} style={{
          background: `${GREEN}0.15)`, border: `1px solid ${GREEN}0.35)`,
          borderRadius: 8, color: `${GREEN}0.9)`, fontSize: 12, fontWeight: 700,
          padding: "7px 16px", cursor: "pointer", fontFamily: "inherit",
        }}>+ Add Staff</button>
      </div>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {staff.map(s => (
            <div key={s.id} onClick={() => openEdit(s)} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "18px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            >
              <Avatar url={s.photo_url} name={s.name} size={72} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 3 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: `${TEAL}0.5)`, marginBottom: 6 }}>{s.provider_number ?? "—"}</div>
                <Stars level={s.pro_level ?? 1} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                {s.preferred_zip ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New modal */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }} onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div style={{
            background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, padding: 28, width: "min(480px, 95vw)", maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{isNew ? "New Staff Member" : editing.name}</span>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Photo */}
            {!isNew && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <Avatar url={form.photo_url} name={form.name || editing.name} size={72} />
                <div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                    background: `${TEAL}0.1)`, border: `1px solid ${TEAL}0.25)`,
                    borderRadius: 8, color: `${TEAL}0.8)`, fontSize: 11, fontWeight: 700,
                    padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
                  }}>{uploading ? "Uploading…" : "Upload Photo"}</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>JPG, PNG, HEIC · max 10 MB</p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>NAME</label>
                <input style={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>PROVIDER #</label>
                  <input style={field} value={form.provider_number ?? ""} onChange={e => setForm(f => ({ ...f, provider_number: e.target.value }))} placeholder="PRO-001" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>PREFERRED ZIP</label>
                  <input style={field} value={form.preferred_zip ?? ""} onChange={e => setForm(f => ({ ...f, preferred_zip: e.target.value }))} placeholder="95060" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 8 }}>PRO LEVEL</label>
                <Stars level={form.pro_level ?? 1} onChange={n => setForm(f => ({ ...f, pro_level: n }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>EMAIL</label>
                <input style={field} type="email" value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@company.com" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>TEXT #</label>
                  <input style={field} value={form.phone_text ?? ""} onChange={e => setForm(f => ({ ...f, phone_text: e.target.value }))} placeholder="831-555-0000" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>VOICE #</label>
                  <input style={field} value={form.phone_voice ?? ""} onChange={e => setForm(f => ({ ...f, phone_voice: e.target.value }))} placeholder="831-555-0000" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>LOGIN PIN</label>
                  <input style={field} value={form.pin ?? ""} maxLength={4}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="4 digits" inputMode="numeric" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5 }}>ROLE</label>
                  <select style={{ ...field, cursor: "pointer" }} value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as "admin" | "worker" }))}>
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button onClick={save} disabled={saving || !form.name.trim()} style={{
                width: "100%", background: `${GREEN}0.2)`, border: `1px solid ${GREEN}0.4)`,
                borderRadius: 10, color: `${GREEN}0.95)`, fontSize: 13, fontWeight: 700,
                padding: "11px", cursor: "pointer", fontFamily: "inherit",
                opacity: saving || !form.name.trim() ? 0.5 : 1,
              }}>{saving ? "Saving…" : "Save"}</button>
              {!isNew && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button onClick={remove} style={{
                    background: "none", border: "none", color: "rgba(239,68,68,0.4)",
                    fontSize: 11, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
                  }}>Remove staff member</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
