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
  trial_ends_at?: string; billing_end?: string;
}
interface Notification {
  id: string; type: string; title: string; body: string;
  action_url?: string; action_label?: string; read: boolean; created_at: string;
}
interface PaymentStatus {
  payment?: { id: string; plan: string; amount: number; status: string; paypal_txn: string; created_at: string; admin_note?: string };
  plan?: string; trial_ends_at?: string; billing_end?: string;
}
interface SupportMsg { id: string; from_admin: boolean; message: string; created_at: string; }

/* ── Icons ──────────────────────────────────────────────────────── */
function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bell":     return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "agent":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "leads":    return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "card":     return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "support":  return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "plus":     return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "trash":    return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case "edit":     return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "eye":      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off":  return <svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    case "back":     return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "send":     return <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "star":     return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "zap":      return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    default:         return null;
  }
}

/* ── Plan helpers ───────────────────────────────────────────────── */
const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  trial:   { label: "Trial",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  basic:   { label: "Basic",   color: "#38bdf8", bg: "rgba(56,189,248,0.1)"  },
  pro:     { label: "Pro",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)"},
  max:     { label: "Max",     color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  expired: { label: "Expired", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  admin:   { label: "Admin",   color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
};
const PLAN_LIMITS: Record<string, number> = { trial: 1, basic: 1, pro: 2, max: 3 };

function planMeta(plan: string) { return PLAN_META[plan] ?? { label: plan, color: "var(--color-dust)", bg: "rgba(255,255,255,0.05)" }; }
function daysLeft(date?: string) {
  if (!date) return null;
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return d;
}

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ label, value, icon, sub, color = "124,58,237" }: { label: string; value: string | number; icon: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `rgba(${color},0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic name={icon} size={15} color={`rgb(${color})`} />
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-starlight)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-dust)" }}>{sub}</div>}
    </div>
  );
}

/* ── Notification Panel ─────────────────────────────────────────── */
function NotifPanel({ notifs, onRead, onClose }: { notifs: Notification[]; onRead: (ids: string[]) => void; onClose: () => void }) {
  const unread = notifs.filter(n => !n.read);
  return (
    <div style={{ position: "fixed", top: 60, right: 16, width: 340, background: "rgba(10,14,26,0.97)", border: "1px solid var(--line)", borderRadius: 18, zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Notifications</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {unread.length > 0 && <button onClick={() => onRead(unread.map(n => n.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "var(--color-nebula)", fontFamily: "var(--font-sans)" }}>Mark all read</button>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-dust)", fontSize: "0.82rem" }}>No notifications yet.</div>
        ) : notifs.map(n => (
          <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", background: n.read ? "transparent" : "rgba(124,58,237,0.04)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-nebula)", flexShrink: 0, marginTop: 5 }} />}
            <div style={{ flex: 1, marginLeft: n.read ? 18 : 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-starlight)", marginBottom: 3 }}>{n.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-dust)", lineHeight: 1.5 }}>{n.body}</div>
              {n.action_url && <a href={n.action_url} style={{ fontSize: "0.72rem", color: "var(--color-nebula)", textDecoration: "none", marginTop: 4, display: "block" }}>{n.action_label || "View →"}</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Genesis Orb ────────────────────────────────────────────────── */
function GenesisOrb({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "60px 24px" }}>
      <div style={{ position: "relative", width: 160, height: 160, cursor: "pointer" }} onClick={onClick}>
        <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "conic-gradient(from 0deg,transparent,rgba(124,58,237,0.45) 30%,rgba(56,189,248,0.4) 60%,transparent)", filter: "blur(12px)", animation: "spin 5s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%,rgba(192,132,252,0.9),rgba(124,58,237,0.55) 50%,rgba(37,99,235,0.35) 75%,transparent)", boxShadow: "0 0 60px rgba(124,58,237,0.35)", animation: "breathe 3.5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4v20M4 14h20" stroke="white" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem", color: "var(--color-starlight)" }}>Build your first agent</h2>
        <p style={{ margin: "0 0 24px", fontSize: "0.86rem", color: "var(--color-dust)", lineHeight: 1.6, maxWidth: 340 }}>Your AI agent handles customer questions 24/7 — set up in minutes.</p>
        <button className="btn-genesis" onClick={onClick}>Create agent</button>
      </div>
    </div>
  );
}

/* ── Agent Card ─────────────────────────────────────────────────── */
function AgentCard({ agent, onEdit, onDelete, onViewLeads }: { agent: Agent; onEdit: () => void; onDelete: () => void; onViewLeads: () => void }) {
  const [showPin, setShowPin] = useState(false);
  const color = agent.primary_color || "#7c3aed";
  const h = color.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const pct = agent.readiness_score ?? 0;
  const health = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(${rgb},0.4)`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},#22d3ee)` }} />
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg,${color},#22d3ee)`, boxShadow: `0 0 22px rgba(${rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff" }}>
            {(agent.name || "AI").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.business_name}</p>
            {agent.tagline && <p style={{ margin: "3px 0 0", fontSize: "0.73rem", color: "var(--color-dust)", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.tagline}</p>}
          </div>
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={health} strokeWidth="3.5" strokeDasharray={`${(pct/100)*2*Math.PI*16} ${2*Math.PI*16}`} strokeLinecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 700, color: health, fontFamily: "var(--font-mono)" }}>{pct}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0, boxShadow: "0 0 6px #34d399" }} />
          <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.73rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            easybuilda.vercel.app/{agent.subdomain}
          </a>
        </div>

        {agent.leads_pin && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>Leads PIN:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.85rem", color: showPin ? "var(--color-starlight)" : "var(--color-dust)", letterSpacing: "0.1em" }}>{showPin ? agent.leads_pin : "• • • • • •"}</span>
            <button onClick={() => setShowPin(!showPin)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "var(--color-nebula)", fontFamily: "var(--font-mono)" }}>{showPin ? "hide" : "show"}</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, color, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit agent</button>
          <button onClick={onViewLeads} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>View leads</button>
          <button onClick={onDelete} title="Delete" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic name="trash" size={15} color="#f87171" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Support Chat ───────────────────────────────────────────────── */
function SupportTab({ token }: { token: string }) {
  const [msgs,    setMsgs]    = useState<SupportMsg[]>([]);
  const [input,   setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/support/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMsgs(d.messages || [])).catch(() => {});
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await fetch(`${API}/api/support/message`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: input.trim() }) });
      setMsgs(prev => [...prev, { id: Date.now().toString(), from_admin: false, message: input.trim(), created_at: new Date().toISOString() }]);
      setInput("");
    } finally { setSending(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 420, background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: "var(--color-dust)", fontSize: "0.82rem", marginTop: 40 }}>Send us a message — we usually reply within a few hours.</div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from_admin ? "flex-start" : "flex-end", marginBottom: 10 }}>
            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: m.from_admin ? "4px 14px 14px 14px" : "14px 4px 14px 14px", background: m.from_admin ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.2)", border: `1px solid ${m.from_admin ? "var(--line)" : "rgba(124,58,237,0.3)"}`, fontSize: "0.83rem", color: "var(--color-starlight)", lineHeight: 1.5 }}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type your message…" style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--color-starlight)", fontSize: "0.85rem", fontFamily: "var(--font-sans)", outline: "none" }} />
        <button onClick={send} disabled={sending || !input.trim()} style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic name="send" size={16} color="var(--color-nebula)" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────── */
type Tab = "overview" | "agents" | "billing" | "support";

export default function DashboardPage() {
  const [tab,          setTab]          = useState<Tab>("overview");
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [agents,       setAgents]       = useState<Agent[]>([]);
  const [notifs,       setNotifs]       = useState<Notification[]>([]);
  const [payStatus,    setPayStatus]    = useState<PaymentStatus | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [token,        setToken]        = useState("");
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [error,        setError]        = useState("");

  const agentLimit   = PLAN_LIMITS[profile?.plan ?? "trial"] ?? 1;
  const periodUsed = (profile as any)?.period_agents_created ?? agents.length;
  const canBuild     = agents.length < agentLimit && profile?.plan !== "expired";
  const pm           = planMeta(profile?.plan ?? "trial");
  const unreadCount  = notifs.filter(n => !n.read).length;
  const trialLeft    = profile?.plan === "trial" ? daysLeft(profile.trial_ends_at) : null;
  const billingLeft  = profile?.billing_end ? daysLeft(profile.billing_end) : null;
  const isExpired    = profile?.plan === "expired";
  const showUpgrade  = profile?.plan && !["pro", "max", "admin"].includes(profile.plan);
  const editingAgent = agents.find(a => a.id === editingId);

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes, nRes, pyRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,          { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,        { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/notifications`,    { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/payments/status`,  { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile ?? d); }
      if (aRes.ok)  { const d = await aRes.json(); setAgents(d.agents ?? []); }
      if (nRes.ok)  { const d = await nRes.json(); setNotifs(d.notifications ?? []); }
      if (pyRes.ok) setPayStatus(await pyRes.json());
    } catch { setError("Failed to load dashboard."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`${API}/api/agents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setAgents(prev => prev.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const markRead = (ids: string[]) => {
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    fetch(`${API}/api/notifications/read`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ notification_ids: ids }) }).catch(() => {});
  };

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "overview", icon: "zap",     label: "Overview" },
    { id: "agents",   icon: "agent",   label: "Agents"   },
    { id: "billing",  icon: "card",    label: "Billing"  },
    { id: "support",  icon: "support", label: "Support"  },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes dashIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .btn-genesis { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0.7rem 1.4rem;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);border:none;color:#fff;font-weight:700;font-size:0.9rem;font-family:var(--font-sans);cursor:pointer;box-shadow:0 0 28px rgba(124,58,237,0.35);transition:all 0.2s;text-decoration:none }
        .btn-genesis:hover { filter:brightness(1.08);transform:translateY(-1px) }
        .tab-btn { display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:10px;border:none;cursor:pointer;font-size:0.82rem;font-family:var(--font-sans);transition:all 0.15s;background:transparent;color:var(--color-dust) }
        .tab-btn.active { background:rgba(255,255,255,0.06);color:var(--color-starlight) }
        .tab-btn:hover { background:rgba(255,255,255,0.04);color:var(--color-starlight) }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: "radial-gradient(900px 500px at 70% -8%,rgba(124,58,237,0.08),transparent 65%)" }}
        onClick={() => showNotifs && setShowNotifs(false)}>

        {showNotifs && <NotifPanel notifs={notifs} onRead={markRead} onClose={() => setShowNotifs(false)} />}

        {/* ── Header ── */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 14 }}>

            {editingId ? (
              <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontFamily: "var(--font-sans)" }}>
                <Ic name="back" size={14} /> Dashboard
              </button>
            ) : (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-nebula)", boxShadow: "0 0 10px var(--color-nebula)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-starlight)", flex: 1 }}>
                  {profile?.full_name ? `${profile.full_name.split(" ")[0]}'s dashboard` : "Dashboard"}
                </span>
              </>
            )}

            {editingId && editingAgent && (
              <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Editing {editingAgent.name}</span>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Upgrade button — always visible */}
              {showUpgrade && !editingId && (
                <a href="/pricing" style={{ padding: "6px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(37,99,235,0.15))", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Ic name="star" size={13} color="#a78bfa" /> Upgrade
                </a>
              )}

              {/* Plan badge */}
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: pm.bg, color: pm.color, border: `1px solid ${pm.color}33` }}>
                {pm.label}
              </span>

              {/* Notifications bell */}
              <button onClick={e => { e.stopPropagation(); setShowNotifs(!showNotifs); }} style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 9, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-dust)" }}>
                <Ic name="bell" size={16} />
                {unreadCount > 0 && <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "var(--color-nebula)", boxShadow: "0 0 6px var(--color-nebula)" }} />}
              </button>

              <button onClick={async () => { await createClient().auth.signOut(); window.location.href = "/auth/login"; }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-sans)" }}>
                Sign out
              </button>
            </div>
          </div>

          {/* Tabs — hidden in edit mode */}
          {!editingId && (
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 0", display: "flex", gap: 4, borderTop: "1px solid var(--line)" }}>
              {TABS.map(t => (
                <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                  <Ic name={t.icon} size={14} />
                  {t.label}
                  {t.id === "support" && unreadCount > 0 && <span style={{ background: "var(--color-nebula)", color: "#fff", borderRadius: 100, padding: "1px 6px", fontSize: "0.6rem", fontWeight: 700 }}>{unreadCount}</span>}
                </button>
              ))}
            </div>
          )}
        </header>

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", animation: "dashIn 0.3s ease both" }}>
          {error && <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.82rem", color: "#f87171" }}>{error}</div>}

          {/* Edit mode */}
          {editingId && token && <AgentEditor agentId={editingId} token={token} onClose={() => setEditingId(null)} />}

          {!editingId && (
            <>
              {/* Banners */}
              {isExpired && (
                <div style={{ marginBottom: 20, padding: "14px 20px", borderRadius: 14, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span>⚠️</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-starlight)", flex: 1 }}>Your plan has expired. Renew to keep your agent live.</p>
                  <a href="/pricing" className="btn-genesis" style={{ fontSize: "0.82rem", padding: "0.6rem 1.1rem" }}>Renew now →</a>
                </div>
              )}

              {profile?.plan === "trial" && trialLeft !== null && (
                <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 14, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>⏰</span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>
                    {trialLeft <= 0 ? "Your trial has expired." : `${trialLeft} day${trialLeft === 1 ? "" : "s"} left in your trial.`}
                  </p>
                  <a href="/pricing" style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: "#fbbf24" }}>Upgrade →</a>
                </div>
              )}

              {billingLeft !== null && billingLeft <= 7 && !isExpired && profile?.plan !== "trial" && (
                <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 14, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>📅</span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>{billingLeft <= 0 ? "Subscription expired." : `${billingLeft} day${billingLeft === 1 ? "" : "s"} until renewal.`} Renew to stay active.</p>
                  <a href={`/payment/${profile?.plan}`} style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: "#fbbf24" }}>Renew →</a>
                </div>
              )}

              {payStatus?.payment?.status === "pending" && (
                <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 14, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span>🕐</span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>
                    Your <strong>{payStatus.payment.plan}</strong> plan payment is under review. We'll activate it within 24h.
                  </p>
                </div>
              )}

              {/* ── APPROVED → BUILD CTA ── */}
              {profile?.plan && ["basic","pro","max"].includes(profile.plan) && agents.length === 0 && (
                <div style={{ marginBottom: 24, padding: "22px 24px", borderRadius: 18, background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(37,99,235,0.08))", border: "1px solid rgba(124,58,237,0.35)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
                  {/* Glow */}
                  <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, boxShadow: "0 0 24px rgba(124,58,237,0.4)" }}>
                    🚀
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>
                      Your {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} plan is active!
                    </p>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-dust)" }}>
                      You're ready to build your AI agent. It takes less than 5 minutes.
                    </p>
                  </div>
                  <a href="/build" style={{ padding: "0.75rem 1.5rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 0 28px rgba(124,58,237,0.4)", whiteSpace: "nowrap" }}>
                    Build my agent →
                  </a>
                </div>
              )}

              {/* ── OVERVIEW TAB ── */}
              {tab === "overview" && (
                <div>
                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
                    <StatCard label="Active agents"    value={agents.length}       icon="agent"   color="124,58,237"  sub={`of ${agentLimit} allowed`} />
                    <StatCard label="Plan"             value={pm.label}            icon="star"    color="167,139,250" sub={trialLeft !== null ? `${trialLeft} days left` : billingLeft !== null ? `${billingLeft} days left` : "Active"} />
                    <StatCard label="Notifications"    value={unreadCount}         icon="bell"    color="56,189,248"  sub="unread" />
                    <StatCard label="Payment status"   value={payStatus?.payment?.status || "—"} icon="card" color="52,211,153" sub={payStatus?.payment?.plan ? `${payStatus.payment.plan} plan` : "No pending"} />
                  </div>

                  {/* Recent notifications */}
                  {notifs.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-starlight)" }}>Recent activity</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {notifs.slice(0, 4).map(n => (
                          <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 12 }}>
                            {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-nebula)", flexShrink: 0 }} />}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-starlight)" }}>{n.title}</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--color-dust)" }}>{n.body.slice(0, 80)}{n.body.length > 80 ? "…" : ""}</div>
                            </div>
                            {n.action_url && <a href={n.action_url} style={{ fontSize: "0.72rem", color: "var(--color-nebula)", textDecoration: "none", whiteSpace: "nowrap" }}>{n.action_label || "→"}</a>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                    {canBuild && (
                      <a href="/build" style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)")}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Ic name="plus" size={18} color="var(--color-nebula)" />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-starlight)" }}>Build agent</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-dust)" }}>Set up in minutes</div>
                        </div>
                      </a>
                    )}
                    <a href="/pricing" style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", textDecoration: "none", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.18)")}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic name="star" size={18} color="#a78bfa" />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-starlight)" }}>Upgrade plan</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-dust)" }}>More agents & features</div>
                      </div>
                    </a>
                    <button onClick={() => setTab("support")} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.35)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.18)")}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic name="support" size={18} color="#34d399" />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-starlight)" }}>Get support</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-dust)" }}>We reply within hours</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ── AGENTS TAB ── */}
              {tab === "agents" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Your agents</h2>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)" }}>
                        {agents.length} active · {periodUsed}/{agentLimit} used this period
                      </p>
                    </div>
                    {canBuild && agents.length > 0 && (
                      <a href="/build" className="btn-genesis" style={{ fontSize: "0.86rem", padding: "0.62rem 1.2rem" }}>
                        <Ic name="plus" size={14} color="white" /> New agent
                      </a>
                    )}
                  </div>

                  {agents.length === 0 ? (
                    <GenesisOrb onClick={() => { window.location.href = "/build"; }} />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                      {agents.map(agent => (
                        <AgentCard key={agent.id} agent={agent}
                          onEdit={() => setEditingId(agent.id)}
                          onDelete={() => deleteAgent(agent.id)}
                          onViewLeads={() => window.open(`/${agent.subdomain}/leads?key=${agent.id}`, "_blank")}
                        />
                      ))}
                    </div>
                  )}

                  {!canBuild && !isExpired && (
                    <div style={{ marginTop: 24, padding: "20px 24px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)" }}>Want more agents?</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-dust)" }}>Upgrade to Pro for 2 agents, custom URL, and image support.</p>
                      </div>
                      <a href="/pricing" className="btn-genesis" style={{ fontSize: "0.86rem" }}>Upgrade to Pro →</a>
                    </div>
                  )}
                </div>
              )}

              {/* ── BILLING TAB ── */}
              {tab === "billing" && (
                <div style={{ maxWidth: 600 }}>
                  <h2 style={{ margin: "0 0 20px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Billing & Plan</h2>

                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>CURRENT PLAN</div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-starlight)" }}>{pm.label}</div>
                      </div>
                      <span style={{ padding: "4px 12px", borderRadius: 100, background: pm.bg, color: pm.color, border: `1px solid ${pm.color}33`, fontWeight: 700, fontSize: "0.78rem" }}>{pm.label}</span>
                    </div>

                    {profile?.plan === "trial" && trialLeft !== null && (
                      <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", fontSize: "0.82rem", color: "#fbbf24", marginBottom: 14 }}>
                        ⏰ {trialLeft <= 0 ? "Trial expired." : `${trialLeft} days remaining in trial.`}
                      </div>
                    )}

                    {profile?.billing_end && profile.plan !== "trial" && (
                      <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)", fontSize: "0.82rem", color: "#38bdf8", marginBottom: 14 }}>
                        📅 Subscription active until {new Date(profile.billing_end).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    )}

                    {payStatus?.payment && (
                      <div style={{ padding: "10px 14px", borderRadius: 10, background: payStatus.payment.status === "approved" ? "rgba(52,211,153,0.06)" : payStatus.payment.status === "pending" ? "rgba(56,189,248,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${payStatus.payment.status === "approved" ? "rgba(52,211,153,0.2)" : payStatus.payment.status === "pending" ? "rgba(56,189,248,0.2)" : "rgba(248,113,113,0.2)"}`, fontSize: "0.8rem", color: "var(--color-starlight)", marginBottom: 14 }}>
                        Last payment: <strong>{payStatus.payment.plan}</strong> — ${payStatus.payment.amount} —
                        <span style={{ color: payStatus.payment.status === "approved" ? "#34d399" : payStatus.payment.status === "pending" ? "#38bdf8" : "#f87171", fontWeight: 600 }}> {payStatus.payment.status}</span>
                        {payStatus.payment.admin_note && <div style={{ marginTop: 4, fontSize: "0.75rem", color: "var(--color-dust)" }}>{payStatus.payment.admin_note}</div>}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {profile?.plan && !["max", "admin"].includes(profile.plan) && (
                        <a href="/pricing" className="btn-genesis" style={{ fontSize: "0.86rem", padding: "0.65rem 1.2rem" }}>
                          ⬆ Upgrade plan
                        </a>
                      )}
                      {profile?.plan && ["basic", "pro", "max"].includes(profile.plan) && (
                        <a href={`/payment/${profile.plan}`} style={{ padding: "0.65rem 1.2rem", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.86rem", textDecoration: "none", fontWeight: 600 }}>
                          🔄 Renew subscription
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px", fontSize: "0.8rem", color: "var(--color-dust)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--color-starlight)" }}>How billing works:</strong><br />
                    Payment is manual via PayPal. After sending payment and submitting your transaction ID + screenshot, our team verifies and activates your plan within 24h. Plans last 30 days and must be renewed manually.
                  </div>
                </div>
              )}

              {/* ── SUPPORT TAB ── */}
              {tab === "support" && (
                <div style={{ maxWidth: 600 }}>
                  <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Support</h2>
                  <SupportTab token={token} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}