"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/auth";
import { AgentEditor } from "@/components/AgentEditor";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/* ── Types ─────────────────────────────────────────────────────── */
interface Agent {
  id: string; name: string; business_name: string; subdomain: string;
  status: string; primary_color?: string; plan: string;
  readiness_score?: number; leads_pin?: string; created_at: string; tagline?: string;
}
interface Profile {
  id: string; full_name: string; email: string; plan: string;
  trial_ends_at?: string; billing_plan?: string; billing_start?: string;
}
interface Notification {
  id: string; type: string; title: string; body: string;
  action_url?: string; action_label?: string; read: boolean; created_at: string;
}
interface PaymentStatus {
  payment?: { id: string; plan: string; amount: number; status: string; paypal_txn: string; created_at: string; admin_note?: string };
  plan?: string;
  trial_ends_at?: string;
}
interface SupportMessage {
  id: string; from_admin: boolean; message: string; created_at: string;
}

/* ── Icon ──────────────────────────────────────────────────────── */
function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bell":     return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "agent":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "leads":    return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "chart":    return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "card":     return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "support":  return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "plus":     return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "trash":    return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case "edit":     return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "eye":      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off":  return <svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    case "external": return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    case "back":     return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "send":     return <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "x":        return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "clock":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "trending": return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    default:         return null;
  }
}

/* ── Plan meta ─────────────────────────────────────────────────── */
const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  trial:   { label: "Trial",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)"   },
  basic:   { label: "Basic",   color: "#38bdf8", bg: "rgba(56,189,248,0.1)"   },
  pro:     { label: "Pro",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  admin:   { label: "Admin",   color: "#34d399", bg: "rgba(52,211,153,0.1)"   },
  expired: { label: "Expired", color: "#f87171", bg: "rgba(248,113,113,0.1)"  },
};

function planMeta(plan: string) {
  return PLAN_META[plan] ?? { label: plan, color: "var(--color-dust)", bg: "rgba(255,255,255,0.05)" };
}

function trialDaysLeft(trialEnds?: string): number | null {
  if (!trialEnds) return null;
  const diff = new Date(trialEnds).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ── Notification Bell ─────────────────────────────────────────── */
function NotificationPanel({ notifications, onRead, onClose }: {
  notifications: Notification[];
  onRead: (ids: string[]) => void;
  onClose: () => void;
}) {
  const unread = notifications.filter(n => !n.read);

  useEffect(() => {
    if (unread.length > 0) {
      setTimeout(() => onRead(unread.map(n => n.id)), 1000);
    }
  }, []);

  return (
    <div style={{ position: "fixed", top: 60, right: 16, width: 360, maxHeight: "80vh", background: "var(--color-surface)", border: "1px solid var(--line-bright)", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem", color: "var(--color-starlight)" }}>Notifications</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)" }}><Ic name="x" size={16} /></button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-dust)", fontSize: "0.85rem" }}>No notifications yet.</div>
        ) : notifications.map(n => (
          <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", background: n.read ? "transparent" : "rgba(124,58,237,0.04)", transition: "background 0.2s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", flexShrink: 0, marginTop: 5 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-starlight)" }}>{n.title}</p>
                <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "var(--color-dust)", lineHeight: 1.5 }}>{n.body}</p>
                {n.action_url && (
                  <a href={n.action_url} style={{ fontSize: "0.75rem", color: "var(--color-stellar)", textDecoration: "none", fontWeight: 600 }}>{n.action_label || "View"} →</a>
                )}
              </div>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "0.68rem", color: "var(--color-dust)", opacity: 0.6 }}>{timeAgo(n.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Support Chat ──────────────────────────────────────────────── */
function SupportChat({ token, onClose }: { token: string; onClose: () => void }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/support/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API}/api/support/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: input.trim() }),
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), from_admin: false, message: input.trim(), created_at: new Date().toISOString() }]);
      setInput("");
    } catch {} finally { setSending(false); }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 360, height: 480, background: "var(--color-surface)", border: "1px solid var(--line-bright)", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(124,58,237,0.06)" }}>
        <div>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.88rem", color: "var(--color-starlight)" }}>Support</p>
          <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)" }}>We reply within a few hours</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)" }}><Ic name="x" size={16} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-dust)", fontSize: "0.82rem" }}>
            Send us a message and we'll get back to you!
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from_admin ? "flex-start" : "flex-end" }}>
            <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: m.from_admin ? "14px 14px 14px 4px" : "14px 14px 4px 14px", background: m.from_admin ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#7c3aed,#2563eb)", fontSize: "0.85rem", color: "var(--color-starlight)", lineHeight: 1.5 }}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px", color: "var(--color-starlight)", fontFamily: "var(--font-sans)", fontSize: "0.85rem", outline: "none" }} />
        <button onClick={send} disabled={!input.trim() || sending} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: (!input.trim() || sending) ? 0.4 : 1 }}>
          <Ic name="send" size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ── Genesis Orb ───────────────────────────────────────────────── */
function GenesisOrb({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "48px 24px" }}>
      <div style={{ position: "relative", width: 140, height: 140, cursor: "pointer" }} onClick={onClick}>
        <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "conic-gradient(from 0deg,transparent,rgba(124,58,237,0.45) 30%,rgba(56,189,248,0.4) 60%,transparent)", filter: "blur(10px)", animation: "spin 5s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%,rgba(192,132,252,0.9),rgba(124,58,237,0.55) 50%,rgba(37,99,235,0.35) 75%,transparent)", boxShadow: "0 0 50px rgba(124,58,237,0.35)", animation: "breathe 3.5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Ic name="plus" size={28} color="#fff" />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color: "var(--color-starlight)" }}>Build your first AI agent</h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.86rem", color: "var(--color-dust)", lineHeight: 1.6, maxWidth: 340 }}>Answers customers, captures leads, works 24/7 — live in minutes.</p>
        <a href="/build" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.8rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.92rem", textDecoration: "none", fontFamily: "var(--font-sans)", boxShadow: "0 0 28px rgba(124,58,237,0.4)" }}>
          Create agent →
        </a>
      </div>
    </div>
  );
}

/* ── Agent Card ────────────────────────────────────────────────── */
function AgentCard({ agent, onEdit, onDelete, onViewLeads }: { agent: Agent; onEdit: () => void; onDelete: () => void; onViewLeads: () => void }) {
  const [showPin, setShowPin] = useState(false);
  const color = agent.primary_color || "#7c3aed";
  const h = color.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const pct    = agent.readiness_score ?? 0;
  const health = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.4)`}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)"}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},#22d3ee)` }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg,${color},#22d3ee)`, boxShadow: `0 0 18px rgba(${rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#fff" }}>
            {(agent.name || "AI").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.97rem", color: "var(--color-starlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.business_name}</p>
          </div>
          <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="19" cy="19" r="15" fill="none" stroke={health} strokeWidth="3" strokeDasharray={`${(pct/100)*2*Math.PI*15} ${2*Math.PI*15}`} strokeLinecap="round" transform="rotate(-90 19 19)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: health, fontFamily: "var(--font-mono)" }}>{pct}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 9, marginBottom: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 5px #34d399", flexShrink: 0 }} />
          <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.71rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            easybuilda.vercel.app/{agent.subdomain}
          </a>
          <Ic name="external" size={10} color="var(--color-stellar)" />
        </div>

        {agent.leads_pin && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>PIN:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.82rem", color: showPin ? "var(--color-starlight)" : "var(--color-dust)", letterSpacing: "0.12em" }}>
              {showPin ? agent.leads_pin : "• • • • • •"}
            </span>
            <button onClick={() => setShowPin(!showPin)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-nebula)", display: "flex", alignItems: "center" }}>
              <Ic name={showPin ? "eye-off" : "eye"} size={13} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={onEdit} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, color, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-sans)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.18)`}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.1)`}>
            <Ic name="edit" size={13} /> Edit
          </button>
          <button onClick={onViewLeads} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.8rem", cursor: "pointer", transition: "border-color 0.15s", fontFamily: "var(--font-sans)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line-bright)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)"}>
            <Ic name="leads" size={13} /> Leads
          </button>
          <button onClick={onDelete} title="Delete" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.06)"}>
            <Ic name="trash" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, icon, sub, color }: { label: string; value: string | number; icon: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${color || "124,58,237"},0.1)`, border: `1px solid rgba(${color || "124,58,237"},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: `rgb(${color || "167,139,250"})` }}>
        <Ic name={icon} size={17} color={`rgb(${color || "167,139,250"})`} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--color-starlight)", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: "3px 0 0", fontSize: "0.7rem", color: "var(--color-dust)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────── */
type Tab = "overview" | "agents" | "billing" | "support";

export default function DashboardPage() {
  const [tab,           setTab]           = useState<Tab>("overview");
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [agents,        setAgents]        = useState<Agent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payStatus,     setPayStatus]     = useState<PaymentStatus | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [token,         setToken]         = useState("");
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showSupport,   setShowSupport]   = useState(false);
  const [error,         setError]         = useState("");

  const PLAN_LIMITS: Record<string, number> = { trial: 1, basic: 1, pro: 2 };
  const agentLimit = PLAN_LIMITS[profile?.plan ?? "trial"] ?? 0;
  const canBuild   = (profile?.plan === "trial" || profile?.plan === "basic" || profile?.plan === "pro") && agents.length < agentLimit;
  const unreadCount = notifications.filter(n => !n.read).length;

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes, nRes, payRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,          { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,        { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/notifications`,    { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/payments/status`,  { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok)   setProfile(await pRes.json());
      if (aRes.ok)   { const d = await aRes.json();  setAgents(d.agents ?? []); }
      if (nRes.ok)   { const d = await nRes.json();  setNotifications(d.notifications ?? []); }
      if (payRes.ok) setPayStatus(await payRes.json());
    } catch { setError("Failed to load data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    try {
      await fetch(`${API}/api/agents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setAgents(prev => prev.filter(a => a.id !== id));
      if (editingId === id) setEditingId(null);
    } catch { setError("Delete failed."); }
  };

  const markRead = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    fetch(`${API}/api/notifications/read`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ notification_ids: ids }) }).catch(() => {});
  };

  const editingAgent = agents.find(a => a.id === editingId);
  const daysLeft     = trialDaysLeft(profile?.trial_ends_at);
  const pm           = planMeta(profile?.plan ?? "trial");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  const NAV_TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "overview", icon: "chart",    label: "Overview"  },
    { id: "agents",   icon: "agent",    label: "Agents"    },
    { id: "billing",  icon: "card",     label: "Billing"   },
    { id: "support",  icon: "support",  label: "Support"   },
  ];

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes dashIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)" }}>

        {/* Notification panel */}
        {showNotifs && (
          <NotificationPanel notifications={notifications} onRead={markRead} onClose={() => setShowNotifs(false)} />
        )}

        {/* Support chat */}
        {showSupport && <SupportChat token={token} onClose={() => setShowSupport(false)} />}

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>

            {editingId ? (
              <>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontFamily: "var(--font-sans)" }}>
                  <Ic name="back" size={16} /> Dashboard
                </button>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Editing {editingAgent?.name}</span>
                  <span style={{ fontSize: "0.67rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>Auto-saves</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-nebula)", boxShadow: "0 0 10px var(--color-nebula)" }} />
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.98rem", color: "var(--color-starlight)", flex: 1 }}>
                  {profile?.full_name ? `${profile.full_name.split(" ")[0]}'s dashboard` : "Dashboard"}
                </h1>
              </>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Plan badge */}
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.67rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: pm.bg, color: pm.color, border: `1px solid ${pm.color}33` }}>{pm.label}</span>

              {/* Notification bell */}
              <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 9, padding: "6px 9px", cursor: "pointer", color: "var(--color-dust)", display: "flex", alignItems: "center", transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--line-bright)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
                <Ic name="bell" size={16} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#7c3aed", fontSize: "0.6rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--color-void)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Sign out */}
              <button onClick={async () => { const sb = createClient(); await sb.auth.signOut(); window.location.href = "/auth/login"; }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-sans)" }}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Edit Mode */}
        {editingId && token && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
            <AgentEditor agentId={editingId} token={token} onClose={() => setEditingId(null)} />
          </div>
        )}

        {/* Main */}
        {!editingId && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>

            {/* Trial/Expired Banner */}
            {(profile?.plan === "trial" || profile?.plan === "expired") && (
              <div style={{ margin: "20px 0", padding: "14px 18px", borderRadius: 14, background: profile.plan === "expired" ? "rgba(248,113,113,0.08)" : daysLeft !== null && daysLeft <= 1 ? "rgba(248,113,113,0.06)" : "rgba(251,191,36,0.07)", border: `1px solid ${profile.plan === "expired" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.22)"}`, display: "flex", alignItems: "center", gap: 12 }}>
                <Ic name="clock" size={18} color={profile.plan === "expired" ? "#f87171" : "#fbbf24"} />
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--color-starlight)", flex: 1 }}>
                  {profile.plan === "expired"
                    ? "Your trial has expired. Upgrade to keep your agent live."
                    : daysLeft !== null
                      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial.`
                      : "Your trial is active."}
                </p>
                <a href="/pricing" style={{ padding: "7px 14px", borderRadius: 9, background: profile.plan === "expired" ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.12)", border: `1px solid ${profile.plan === "expired" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`, fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: profile.plan === "expired" ? "#f87171" : "#fbbf24", whiteSpace: "nowrap" }}>
                  Upgrade →
                </a>
              </div>
            )}

            {/* Payment pending banner */}
            {payStatus?.payment?.status === "pending" && (
              <div style={{ margin: "20px 0", padding: "14px 18px", borderRadius: 14, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <Ic name="clock" size={18} color="#38bdf8" />
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--color-starlight)", flex: 1 }}>
                  Your <strong>{payStatus.payment.plan}</strong> plan payment is pending verification. We'll notify you when it's approved (usually 2–4 hours).
                </p>
              </div>
            )}

            {/* Tab nav */}
            <div style={{ display: "flex", gap: 4, padding: "20px 0 0", borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
              {NAV_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "10px 10px 0 0", border: "none", background: tab === t.id ? "rgba(124,58,237,0.1)" : "transparent", color: tab === t.id ? "var(--color-nebula)" : "var(--color-dust)", fontSize: "0.84rem", fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", fontFamily: "var(--font-sans)", borderBottom: tab === t.id ? "2px solid var(--color-nebula)" : "2px solid transparent", transition: "all 0.15s" }}>
                  <Ic name={t.icon} size={15} color={tab === t.id ? "var(--color-nebula)" : "var(--color-dust)"} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ──────────────────────────────────── */}
            {tab === "overview" && (
              <div style={{ animation: "dashIn 0.25s ease both" }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
                  <StatCard label="Active agents"   value={agents.length}   icon="agent"   color="124,58,237"   sub={`of ${agentLimit} allowed`} />
                  <StatCard label="Plan"             value={pm.label}        icon="card"    color="56,189,248"   sub={profile?.plan === "trial" && daysLeft !== null ? `${daysLeft} days left` : undefined} />
                  <StatCard label="Notifications"    value={unreadCount}     icon="bell"    color="167,139,250"  sub="unread" />
                  <StatCard label="Payment status"   value={payStatus?.payment?.status || "—"} icon="trending" color="52,211,153" sub={payStatus?.payment?.plan ? `${payStatus.payment.plan} plan` : undefined} />
                </div>

                {/* Recent notifications */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Recent activity</p>
                    <button onClick={() => setShowNotifs(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.76rem", color: "var(--color-stellar)" }}>View all</button>
                  </div>
                  {notifications.slice(0, 4).length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--color-dust)" }}>No activity yet.</p>
                  ) : notifications.slice(0, 4).map(n => (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", flexShrink: 0, marginTop: 6 }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "0.84rem", fontWeight: 600, color: "var(--color-starlight)" }}>{n.title}</p>
                        <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--color-dust)" }}>{n.body}</p>
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "var(--color-dust)", whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</span>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                  {canBuild && (
                    <a href="/build" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", textDecoration: "none", color: "var(--color-starlight)", transition: "border-color 0.15s" }}>
                      <Ic name="plus" size={18} color="#a78bfa" />
                      <div>
                        <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600 }}>Build new agent</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-dust)" }}>Set up in minutes</p>
                      </div>
                    </a>
                  )}
                  <a href="/pricing" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)", textDecoration: "none", color: "var(--color-starlight)", transition: "border-color 0.15s" }}>
                    <Ic name="card" size={18} color="#38bdf8" />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600 }}>View plans</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-dust)" }}>Basic $29 · Pro $69</p>
                    </div>
                  </a>
                  <button onClick={() => setShowSupport(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.18)", cursor: "pointer", color: "var(--color-starlight)", textAlign: "left", fontFamily: "var(--font-sans)" }}>
                    <Ic name="support" size={18} color="#34d399" />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600 }}>Get support</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-dust)" }}>We reply in hours</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── AGENTS TAB ────────────────────────────────────── */}
            {tab === "agents" && (
              <div style={{ animation: "dashIn 0.25s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Your agents</h2>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)" }}>{agents.length} of {agentLimit} used</p>
                  </div>
                  {canBuild && agents.length > 0 && (
                    <a href="/build" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "0.6rem 1.2rem", borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.84rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                      <Ic name="plus" size={14} color="#fff" /> New agent
                    </a>
                  )}
                </div>

                {agents.length === 0 ? (
                  <GenesisOrb onClick={() => window.location.href = "/build"} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
                    {agents.map(agent => (
                      <AgentCard key={agent.id} agent={agent}
                        onEdit={() => setEditingId(agent.id)}
                        onDelete={() => deleteAgent(agent.id)}
                        onViewLeads={() => window.open(`/${agent.subdomain}/leads?key=${agent.id}`, "_blank")} />
                    ))}
                  </div>
                )}

                {!canBuild && agents.length > 0 && (
                  <div style={{ marginTop: 20, padding: "18px 22px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem", color: "var(--color-starlight)" }}>Agent limit reached</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-dust)" }}>Upgrade to Pro for 2 agents, custom URL, and image support in chat.</p>
                    </div>
                    <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.68rem 1.3rem", borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.84rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                      Upgrade to Pro →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── BILLING TAB ───────────────────────────────────── */}
            {tab === "billing" && (
              <div style={{ animation: "dashIn 0.25s ease both", maxWidth: 600 }}>
                <h2 style={{ margin: "0 0 20px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Billing & plan</h2>

                {/* Current plan */}
                <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${pm.color}33`, borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: pm.color }}>{pm.label} plan</span>
                    {profile?.plan === "trial" && daysLeft !== null && (
                      <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 999, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                        {daysLeft}d remaining
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 14px", fontSize: "0.84rem", color: "var(--color-dust)", lineHeight: 1.5 }}>
                    {profile?.plan === "trial" && "You're on a 4-day Pro trial. Build your agent and see the results before committing."}
                    {profile?.plan === "basic" && "1 AI agent, unlimited replies, full leads dashboard."}
                    {profile?.plan === "pro" && "2 AI agents, custom URL, image upload, analytics, priority support."}
                    {profile?.plan === "expired" && "Your trial has ended. Choose a plan to reactivate your agent."}
                  </p>
                  {(profile?.plan === "trial" || profile?.plan === "expired") && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <a href="/payment/basic" style={{ flex: 1, textAlign: "center", padding: "0.7rem", borderRadius: 11, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                        Basic — $29/mo
                      </a>
                      <a href="/payment/pro" style={{ flex: 1, textAlign: "center", padding: "0.7rem", borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                        Pro — $69/mo
                      </a>
                    </div>
                  )}
                </div>

                {/* Payment history */}
                {payStatus?.payment && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
                    <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-dust)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Latest payment</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--color-starlight)", textTransform: "capitalize" }}>{payStatus.payment.plan} plan</p>
                        <p style={{ margin: "3px 0 0", fontSize: "0.76rem", color: "var(--color-dust)" }}>
                          TXN: {payStatus.payment.paypal_txn} · ${payStatus.payment.amount}/mo
                        </p>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase",
                        background: payStatus.payment.status === "approved" ? "rgba(52,211,153,0.1)" : payStatus.payment.status === "rejected" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                        color: payStatus.payment.status === "approved" ? "#34d399" : payStatus.payment.status === "rejected" ? "#f87171" : "#fbbf24",
                        border: `1px solid ${payStatus.payment.status === "approved" ? "rgba(52,211,153,0.25)" : payStatus.payment.status === "rejected" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"}`,
                      }}>
                        {payStatus.payment.status}
                      </span>
                    </div>
                    {payStatus.payment.admin_note && payStatus.payment.status === "rejected" && (
                      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", fontSize: "0.8rem", color: "#fca5a5" }}>
                        {payStatus.payment.admin_note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── SUPPORT TAB ───────────────────────────────────── */}
            {tab === "support" && (
              <div style={{ animation: "dashIn 0.25s ease both", maxWidth: 600 }}>
                <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Support</h2>
                <p style={{ margin: "0 0 20px", fontSize: "0.84rem", color: "var(--color-dust)" }}>Questions, issues, or feedback — we're here to help. Usually reply within a few hours.</p>
                <button onClick={() => setShowSupport(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.6rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  <Ic name="support" size={17} color="#fff" /> Open chat
                </button>
                <div style={{ marginTop: 24, padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-starlight)" }}>Other ways to reach us</p>
                  <a href="mailto:omarmaher23942@gmail.com" style={{ fontSize: "0.82rem", color: "var(--color-stellar)", textDecoration: "none" }}>omarmaher23942@gmail.com</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}