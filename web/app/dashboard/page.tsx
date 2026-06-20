"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// ── Icons ──────────────────────────────────────────────────────────
function Icon({ d, size = 18, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IC = {
  grid:     "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  agent:    "M12 2a10 10 0 100 20 10 10 0 000-20zM8 12h8M12 8v8",
  wallet:   "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 14a2 2 0 110-4 2 2 0 010 4z",
  leads:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  support:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  plus:     "M12 5v14M5 12h14",
  arrow:    "M5 12h14M13 6l6 6-6 6",
  check:    "M20 6L9 17l-5-5",
  pause:    "M10 4H6v16h4zM18 4h-4v16h4z",
  play:     "M5 3l14 9-14 9V3z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  copy:     "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-4zM14 2v6h6M10 12h4M10 16h4M10 8h1",
  link:     "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  bell:     "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  chart:    "M18 20V10M12 20V4M6 20v-6",
  star:     "M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1z",
  linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
  referral: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11l-4 4-2-2",
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  briefcase:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
};

type Tab = "overview" | "agents" | "leads" | "wallet" | "tools" | "support";

interface Profile {
  full_name?: string; email?: string; plan?: string;
  trial_ends_at?: string; billing_end?: string;
}
interface Agent {
  id: string; name: string; business_name?: string; status: string;
  username?: string; subdomain?: string; plan?: string;
  readiness_score?: number; primary_color?: string;
  created_at?: string; tagline?: string;
}
interface Lead {
  id: string; name?: string; email?: string; phone?: string;
  lead_type?: string; created_at: string; agent_id?: string;
  summary?: string; sentiment?: string;
}
interface WalletData {
  balance: number; currency: string; pending_topup?: { amount: number; status: string } | null;
}
interface Transaction {
  id: string; type: string; amount: number; balance_after: number;
  description?: string; created_at: string;
}
interface SupportMsg { id: string; from_admin: boolean; message: string; created_at: string; }

const PLAN_COLORS: Record<string, string> = {
  trial: "#fbbf24", basic: "#38bdf8", pro: "#a78bfa",
  max: "#34d399", expired: "#f87171", admin: "#34d399",
};
const PLAN_LIMITS: Record<string, number> = {
  trial: 1, basic: 1, pro: 2, max: 3, admin: 99,
};

function PlanBadge({ plan }: { plan: string }) {
  const c = PLAN_COLORS[plan] ?? "#6b7280";
  return (
    <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {plan}
    </span>
  );
}

function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: string; accent: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
          <Icon d={IC[icon as keyof typeof IC]} size={17} color={accent} />
        </div>
        <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(237,240,247,0.5)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.9rem", color: "#edf0f7", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "0.74rem", color: "rgba(237,240,247,0.4)" }}>{sub}</p>}
    </div>
  );
}

function AgentCard({ agent, onToggle, onDelete }: { agent: Agent; onToggle: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const slug = agent.username || agent.subdomain || agent.id.slice(0, 8);
  const url  = `https://easybuilda.com/${slug}`;
  const color = agent.primary_color || "#7c3aed";

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>

      {/* Color bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},${color}88)` }} />

      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.1rem", color: "#fff", flexShrink: 0 }}>
              {(agent.name || "AI").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.95rem", color: "#edf0f7" }}>{agent.name}</p>
              {agent.business_name && <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(237,240,247,0.5)" }}>{agent.business_name}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.status === "active" ? "#34d399" : "#6b7280", boxShadow: agent.status === "active" ? "0 0 6px #34d399" : "none" }} />
            <span style={{ fontSize: "0.72rem", color: agent.status === "active" ? "#34d399" : "#6b7280", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>
              {agent.status}
            </span>
          </div>
        </div>

        {/* Agent URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 9, marginBottom: 16 }}>
          <Icon d={IC.link} size={13} color="rgba(237,240,247,0.35)" />
          <span style={{ flex: 1, fontSize: "0.78rem", color: "rgba(237,240,247,0.5)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            easybuilda.com/{slug}
          </span>
          <button onClick={copyUrl} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#34d399" : "rgba(237,240,247,0.3)", padding: 0, display: "flex" }}>
            <Icon d={IC.copy} size={13} color={copied ? "#34d399" : "rgba(237,240,247,0.35)"} />
          </button>
        </div>

        {/* Readiness */}
        {agent.readiness_score !== undefined && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(237,240,247,0.4)" }}>Agent readiness</span>
              <span style={{ fontSize: "0.7rem", color: "#edf0f7", fontWeight: 600 }}>{agent.readiness_score}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${agent.readiness_score}%`, background: agent.readiness_score >= 75 ? "#34d399" : agent.readiness_score >= 50 ? "#fbbf24" : "#f87171", borderRadius: 99, transition: "width 0.8s ease" }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, color, fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}>
            <Icon d={IC.eye} size={14} color={color} /> Preview
          </a>
          <button onClick={onToggle}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,240,247,0.7)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            <Icon d={agent.status === "active" ? IC.pause : IC.play} size={14} />
            {agent.status === "active" ? "Pause" : "Activate"}
          </button>
          <button onClick={onDelete}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
            <Icon d={IC.trash} size={14} color="#f87171" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab,          setTab]          = useState<Tab>("overview");
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [agents,       setAgents]       = useState<Agent[]>([]);
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [wallet,       setWallet]       = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [supportMsgs,  setSupportMsgs]  = useState<SupportMsg[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [token,        setToken]        = useState("");
  const [userId,       setUserId]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [notifCount,   setNotifCount]   = useState(0);
  const [copied,       setCopied]       = useState(false);

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes, wRes, tRes, lRes, nRes] = await Promise.all([
        fetch(`${API}/api/profile/me`,               { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,                { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet`,                   { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet/transactions`,      { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/leads/all`,                { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/notifications`,            { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok) setProfile((await pRes.json()).profile || (await pRes.json()));
      if (aRes.ok) setAgents((await aRes.json()).agents || []);
      if (wRes.ok) setWallet(await wRes.json());
      if (tRes.ok) setTransactions((await tRes.json()).transactions || []);
      if (lRes.ok) setLeads((await lRes.json()).leads || []);
      if (nRes.ok) setNotifCount(((await nRes.json()).notifications || []).filter((n: any) => !n.read).length);
    } catch {}
    setLoading(false);
  }, []);

  const loadSupport = useCallback(async (tok: string) => {
    try {
      const r = await fetch(`${API}/api/support/messages`, { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) setSupportMsgs((await r.json()).messages || []);
    } catch {}
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      setUserId(data.session.user.id);
      load(data.session.access_token);
    });
  }, [load]);

  useEffect(() => {
    if (tab === "support" && token) loadSupport(token);
  }, [tab, token, loadSupport]);

  const toggleAgent = async (agent: Agent) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    await fetch(`${API}/api/agents/${agent.id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`${API}/api/agents/${agentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const sendSupport = async () => {
    if (!supportInput.trim()) return;
    const msg = supportInput.trim();
    setSupportInput("");
    const optimistic: SupportMsg = { id: Date.now().toString(), from_admin: false, message: msg, created_at: new Date().toISOString() };
    setSupportMsgs(prev => [...prev, optimistic]);
    await fetch(`${API}/api/support/message`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg }),
    });
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  const plan      = profile?.plan || "trial";
  const maxAgents = PLAN_LIMITS[plan] ?? 1;
  const trialEnd  = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isExpired = trialEnd ? trialEnd < new Date() && plan === "trial" : false;
  const daysLeft  = trialEnd && plan === "trial" ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview",  icon: "home"      },
    { id: "agents",   label: "Agents",    icon: "agent"     },
    { id: "leads",    label: "Leads",     icon: "leads"     },
    { id: "wallet",   label: "Wallet",    icon: "wallet"    },
    { id: "tools",    label: "Tools",     icon: "star"      },
    { id: "support",  label: "Support",   icon: "support"   },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  const line = "rgba(255,255,255,0.07)";

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)", display: "flex" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .tab-item{display:flex;align-items:center;gap:9px;padding:9px 14px;border-radius:11px;cursor:pointer;transition:all 0.15s;font-size:0.86rem;color:rgba(237,240,247,0.5);text-decoration:none;border:none;background:none;font-family:inherit;width:100%;text-align:left}
        .tab-item:hover{background:rgba(255,255,255,0.04);color:rgba(237,240,247,0.8)}
        .tab-item.active{background:rgba(124,58,237,0.12);color:#edf0f7;font-weight:600}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:11px;font-size:0.86rem;font-weight:600;cursor:pointer;font-family:inherit;border:none;transition:all 0.15s;text-decoration:none}
        .btn-primary{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff}
        .btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .btn-ghost{background:rgba(255,255,255,0.05);border:1px solid ${line};color:rgba(237,240,247,0.7)}
        .btn-ghost:hover{background:rgba(255,255,255,0.09);color:#edf0f7}
        .inp{background:rgba(255,255,255,0.04);border:1px solid ${line};border-radius:11px;padding:10px 14px;color:#edf0f7;font-size:0.87rem;font-family:inherit;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.15s}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(237,240,247,0.2)}
        @media(max-width:768px){.sidebar{display:none!important}}
      `}</style>

      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${line}`, display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh", overflowY: "auto", background: "rgba(5,7,15,0.95)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px", marginBottom: 28 }}>
          <svg viewBox="0 0 1024 1024" width={26} height={26}>
            <defs><linearGradient id="sdLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
            <path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#sdLogo)"/>
          </svg>
          <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.95rem", color: "#edf0f7" }}>EasyBuilda</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-item${tab === t.id ? " active" : ""}`}>
              <Icon d={IC[t.icon as keyof typeof IC]} size={17} color={tab === t.id ? "#a78bfa" : undefined} />
              {t.label}
              {t.id === "support" && notifCount > 0 && (
                <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: "50%", background: "#7c3aed", fontSize: "0.65rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{notifCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User + Plan */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${line}` }}>
          {daysLeft !== null && !isExpired && (
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#fbbf24", fontWeight: 600 }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial</p>
              <a href="/pricing" style={{ fontSize: "0.7rem", color: "#fbbf24", textDecoration: "none", opacity: 0.8 }}>Upgrade now →</a>
            </div>
          )}
          {isExpired && (
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>Trial expired</p>
              <a href="/pricing" style={{ fontSize: "0.7rem", color: "#f87171", textDecoration: "none" }}>Upgrade to continue →</a>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#edf0f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.full_name || "My Account"}
              </p>
              <PlanBadge plan={plan} />
            </div>
          </div>
          <button onClick={signOut} className="tab-item" style={{ marginTop: 4, color: "rgba(248,113,113,0.7)", width: "100%" }}>
            <Icon d={IC.logout} size={16} color="rgba(248,113,113,0.7)" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>

        {/* Header */}
        <header style={{ padding: "18px 28px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, position: "sticky", top: 0, background: "rgba(5,7,15,0.9)", backdropFilter: "blur(12px)", zIndex: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.05rem", color: "#edf0f7" }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {tab === "agents" && agents.length < maxAgents && (
              <a href="/build" className="btn btn-primary">
                <Icon d={IC.plus} size={15} color="#fff" /> New agent
              </a>
            )}
            {tab === "wallet" && (
              <a href="/wallet/topup" className="btn btn-primary">
                <Icon d={IC.plus} size={15} color="#fff" /> Add funds
              </a>
            )}
          </div>
        </header>

        <div style={{ padding: "24px 28px", animation: "fadeIn 0.25s ease both" }}>

          {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div>
              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
                <StatCard label="Active agents"    value={`${agents.filter(a=>a.status==="active").length}/${maxAgents}`} sub={`${plan} plan`} icon="agent"  accent="#a78bfa" />
                <StatCard label="Wallet balance"   value={`$${(wallet?.balance ?? 0).toFixed(2)}`}                       sub="Available"     icon="wallet" accent="#34d399" />
                <StatCard label="Total leads"      value={leads.length}                                                  sub="All time"      icon="leads"  accent="#38bdf8" />
                <StatCard label="Plan"             value={plan.charAt(0).toUpperCase()+plan.slice(1)}                   sub={daysLeft !== null ? `${daysLeft} days left` : undefined} icon="star" accent="#fbbf24" />
              </div>

              {/* Quick actions */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "rgba(237,240,247,0.4)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick actions</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                  {[
                    { label: "Build agent",    href: "/build",        icon: "plus",     color: "#7c3aed" },
                    { label: "View leads",     action: ()=>setTab("leads"),   icon: "leads",    color: "#38bdf8" },
                    { label: "Add funds",      href: "/wallet/topup", icon: "wallet",   color: "#34d399" },
                    { label: "Upgrade plan",   href: "/pricing",      icon: "star",     color: "#fbbf24" },
                    { label: "LinkedIn posts", href: "/tools/linkedin",icon: "linkedin",  color: "#0A66C2" },
                    { label: "Referral link",  href: "/tools/referral",icon: "referral", color: "#a78bfa" },
                    { label: "Explore agents", href: "/explore",      icon: "eye",      color: "#ec4899" },
                    { label: "Support",        action: ()=>setTab("support"), icon: "support",  color: "#f97316" },
                  ].map(qa => {
                    const inner = (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, cursor: "pointer", transition: "all 0.15s", textDecoration: "none", color: "#edf0f7" }}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.14)"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${qa.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon d={IC[qa.icon as keyof typeof IC]} size={15} color={qa.color} />
                        </div>
                        <span style={{ fontSize: "0.83rem", fontWeight: 500, color: "#edf0f7" }}>{qa.label}</span>
                      </div>
                    );
                    if (qa.href) return <a key={qa.label} href={qa.href}>{inner}</a>;
                    return <div key={qa.label} onClick={qa.action}>{inner}</div>;
                  })}
                </div>
              </div>

              {/* Agents preview */}
              {agents.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(237,240,247,0.4)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your agents</p>
                    <button onClick={() => setTab("agents")} style={{ background: "none", border: "none", color: "rgba(237,240,247,0.4)", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      View all <Icon d={IC.arrow} size={13} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                    {agents.slice(0, 2).map(a => (
                      <AgentCard key={a.id} agent={a} onToggle={() => toggleAgent(a)} onDelete={() => deleteAgent(a.id)} />
                    ))}
                  </div>
                </div>
              )}

              {agents.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 24px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Icon d={IC.plus} size={24} color="#a78bfa" />
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.05rem", color: "#edf0f7" }}>No agents yet</h3>
                  <p style={{ margin: "0 0 20px", fontSize: "0.88rem", color: "rgba(237,240,247,0.5)" }}>Build your first AI agent in 2 minutes</p>
                  <a href="/build" className="btn btn-primary">Build my agent</a>
                </div>
              )}
            </div>
          )}

          {/* ══ AGENTS ════════════════════════════════════════════════ */}
          {tab === "agents" && (
            <div>
              {agents.length < maxAgents && (
                <a href="/build" className="btn btn-primary" style={{ marginBottom: 20, display: "inline-flex" }}>
                  <Icon d={IC.plus} size={15} color="#fff" /> Build new agent
                </a>
              )}
              {agents.length >= maxAgents && (
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "#fbbf24" }}>Agent limit reached on {plan} plan</p>
                  <a href="/pricing" style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 700, textDecoration: "none" }}>Upgrade →</a>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
                {agents.map(a => (
                  <AgentCard key={a.id} agent={a} onToggle={() => toggleAgent(a)} onDelete={() => deleteAgent(a.id)} />
                ))}
              </div>
              {agents.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(237,240,247,0.4)" }}>
                  <p>No agents yet. <a href="/build" style={{ color: "#a78bfa", textDecoration: "none" }}>Build your first one →</a></p>
                </div>
              )}
            </div>
          )}

          {/* ══ LEADS ═════════════════════════════════════════════════ */}
          {tab === "leads" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
                <StatCard label="Total leads" value={leads.length} icon="leads" accent="#38bdf8" />
                <StatCard label="Hot leads"   value={leads.filter(l=>l.lead_type==="hot").length}  icon="star"  accent="#f97316" />
                <StatCard label="Cold leads"  value={leads.filter(l=>l.lead_type==="cold").length} icon="chart" accent="#38bdf8" />
              </div>
              {leads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(237,240,247,0.4)" }}>
                  <Icon d={IC.leads} size={36} color="rgba(255,255,255,0.1)" />
                  <p style={{ marginTop: 12 }}>No leads yet. Share your agent link to start capturing.</p>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px 120px", padding: "10px 16px", borderBottom: `1px solid ${line}`, background: "rgba(255,255,255,0.03)" }}>
                    {["Name", "Email", "Phone", "Type", "Date"].map(h => (
                      <p key={h} style={{ margin: 0, fontSize: "0.68rem", color: "rgba(237,240,247,0.4)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</p>
                    ))}
                  </div>
                  {leads.slice(0, 50).map((l, i) => (
                    <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px 120px", padding: "12px 16px", borderBottom: i < leads.length - 1 ? `1px solid ${line}` : "none", alignItems: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#edf0f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name || "—"}</p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(237,240,247,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email || "—"}</p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(237,240,247,0.6)" }}>{l.phone || "—"}</p>
                      <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, background: l.lead_type === "hot" ? "rgba(249,115,22,0.12)" : "rgba(56,189,248,0.12)", color: l.lead_type === "hot" ? "#f97316" : "#38bdf8", display: "inline-block" }}>
                        {l.lead_type || "cold"}
                      </span>
                      <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(237,240,247,0.4)" }}>{new Date(l.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ WALLET ════════════════════════════════════════════════ */}
          {tab === "wallet" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
                <div style={{ padding: "24px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 18 }}>
                  <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "rgba(52,211,153,0.7)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Available balance</p>
                  <p style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.8rem", color: "#34d399", lineHeight: 1 }}>${(wallet?.balance ?? 0).toFixed(2)}</p>
                  <p style={{ margin: "6px 0 0", fontSize: "0.76rem", color: "rgba(52,211,153,0.5)" }}>{wallet?.currency || "USD"}</p>
                </div>
                {wallet?.pending_topup && (
                  <div style={{ padding: "24px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 18 }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "rgba(251,191,36,0.7)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pending top-up</p>
                    <p style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.8rem", color: "#fbbf24", lineHeight: 1 }}>${wallet.pending_topup.amount}</p>
                    <p style={{ margin: "6px 0 0", fontSize: "0.76rem", color: "rgba(251,191,36,0.5)" }}>Under review</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                <a href="/wallet/topup" className="btn btn-primary">
                  <Icon d={IC.plus} size={15} color="#fff" /> Add funds
                </a>
              </div>

              <div style={{ marginBottom: 10, fontSize: "0.78rem", color: "rgba(237,240,247,0.4)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Transaction history</div>
              {transactions.length === 0 ? (
                <p style={{ color: "rgba(237,240,247,0.35)", fontSize: "0.86rem" }}>No transactions yet.</p>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 16, overflow: "hidden" }}>
                  {transactions.map((tx, i) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i < transactions.length - 1 ? `1px solid ${line}` : "none" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: isCredit ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon d={isCredit ? IC.plus : IC.arrow} size={15} color={isCredit ? "#34d399" : "#f87171"} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#edf0f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description || tx.type}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(237,240,247,0.4)" }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: isCredit ? "#34d399" : "#f87171", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>
                            {isCredit ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "rgba(237,240,247,0.3)" }}>Balance: ${tx.balance_after.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 14 }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.8rem", fontWeight: 600, color: "#edf0f7" }}>Payment methods accepted</p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: "0.8rem", color: "rgba(237,240,247,0.5)" }}>
                    <span style={{ color: "#edf0f7", fontWeight: 600 }}>Bank transfer</span> — Mashreq Bank Egypt (USD)
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(237,240,247,0.5)" }}>
                    <span style={{ color: "#edf0f7", fontWeight: 600 }}>PayPal</span> — paypal.me/Ahmedmaher1728399
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ TOOLS ═════════════════════════════════════════════════ */}
          {tab === "tools" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {[
                { title: "LinkedIn Content", desc: "Generate 3 ready-to-post LinkedIn variations from your agent data", href: "/tools/linkedin", icon: "linkedin", color: "#0A66C2", badge: "AI" },
                { title: "Case Study Builder", desc: "Turn your lead results into a professional case study PDF", href: "/tools/case-study", icon: "briefcase", color: "#a78bfa", badge: "AI" },
                { title: "Referral Program", desc: "Share your referral link and earn $10 wallet credit per signup", href: "/tools/referral", icon: "referral", color: "#34d399", badge: "Earn $10" },
                { title: "Explore Agents", desc: "Browse all live AI agents from other EasyBuilda businesses", href: "/explore", icon: "eye", color: "#38bdf8", badge: null },
                { title: "Partner Program", desc: "Become an agency partner and manage client accounts", href: "/partners", icon: "star", color: "#f59e0b", badge: "Agency" },
                { title: "Pricing & Upgrade", desc: "View plans and upgrade your account for more agents and features", href: "/pricing", icon: "chart", color: "#7c3aed", badge: null },
              ].map(tool => (
                <a key={tool.title} href={tool.href} style={{ textDecoration: "none", display: "block", padding: "22px", background: "rgba(255,255,255,0.03)", border: `1px solid ${line}`, borderRadius: 16, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = line; }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${tool.color}15`, border: `1px solid ${tool.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon d={IC[tool.icon as keyof typeof IC]} size={20} color={tool.color} />
                    </div>
                    {tool.badge && (
                      <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.66rem", fontWeight: 700, background: `${tool.color}18`, color: tool.color, border: `1px solid ${tool.color}30` }}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.95rem", color: "#edf0f7" }}>{tool.title}</h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(237,240,247,0.5)", lineHeight: 1.6 }}>{tool.desc}</p>
                </a>
              ))}
            </div>
          )}

          {/* ══ SUPPORT ═══════════════════════════════════════════════ */}
          {tab === "support" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 20, padding: "32px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Icon d={IC.support} size={24} color="#a78bfa" />
                </div>
                <h3 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.1rem", color: "#edf0f7", marginBottom: 8 }}>Need help?</h3>
                <p style={{ fontSize: "0.88rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.65, marginBottom: 24 }}>
                  Send us an email and we'll get back to you within a few hours.
                </p>
                <a href="mailto:omar@easybuilda.com?subject=Support Request"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
                  Email support
                </a>
                <p style={{ marginTop: 16, fontSize: "0.78rem", color: "rgba(237,240,247,0.3)" }}>omar@easybuilda.com</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
