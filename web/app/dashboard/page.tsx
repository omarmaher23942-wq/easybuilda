"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Icon({ d, size = 18, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  home:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  agent:   "M12 2a10 10 0 100 20 10 10 0 000-20zM8 12h8M12 8v8",
  leads:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  wallet:  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 14a2 2 0 110-4 2 2 0 010 4z",
  tools:   "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  support: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  plus:    "M12 5v14M5 12h14",
  arrow:   "M5 12h14M13 6l6 6-6 6",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  copy:    "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-4zM14 2v6h6",
  edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  pause:   "M10 4H6v16h4zM18 4h-4v16h4z",
  play:    "M5 3l14 9-14 9V3z",
  check:   "M20 6L9 17l-5-5",
  logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  chart:   "M18 20V10M12 20V4M6 20v-6",
  link:    "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  star:    "M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1z",
  save:    "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  x:       "M18 6L6 18M6 6l12 12",
  linkedin:"M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
};

type Tab = "overview" | "agents" | "leads" | "wallet" | "tools" | "support";

interface Profile { full_name?: string; email?: string; plan?: string; trial_ends_at?: string; }
interface Agent {
  id: string; name: string; business_name?: string; status: string;
  username?: string; subdomain?: string; readiness_score?: number;
  primary_color?: string; tagline?: string; welcome_message?: string;
  tone?: string; system_prompt?: string; knowledge?: string;
  faq?: any; suggested_questions?: any;
}
interface Lead {
  id: string; name?: string; email?: string; phone?: string;
  lead_type?: string; created_at: string;
}
interface Wallet { balance: number; currency: string; }
interface Tx { id: string; type: string; amount: number; balance_after: number; description?: string; created_at: string; }

const PLAN_COLORS: Record<string, string> = {
  trial: "#fbbf24", basic: "#38bdf8", pro: "#a78bfa", admin: "#34d399", expired: "#f87171",
};
const PLAN_LIMITS: Record<string, number> = { trial: 1, basic: 1, pro: 2, admin: 99 };

function PlanBadge({ plan }: { plan: string }) {
  const c = PLAN_COLORS[plan] ?? "#6b7280";
  return <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plan}</span>;
}

function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: string; accent: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={IC[icon as keyof typeof IC]} size={16} color={accent} />
        </div>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(237,240,247,0.45)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.8rem", color: "#edf0f7", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "rgba(237,240,247,0.4)" }}>{sub}</p>}
    </div>
  );
}

function AgentCard({ agent, onToggle, onDelete, onEdit }: { agent: Agent; onToggle: () => void; onDelete: () => void; onEdit: () => void; }) {
  const [copied, setCopied] = useState(false);
  const slug  = agent.username || agent.subdomain || agent.id.slice(0, 8);
  const url   = `https://easybuilda.com/${slug}`;
  const color = agent.primary_color || "#7c3aed";
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},${color}66)` }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1rem", color: "#fff", flexShrink: 0 }}>
              {(agent.name || "AI").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "#edf0f7" }}>{agent.name}</p>
              {agent.business_name && <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "rgba(237,240,247,0.45)" }}>{agent.business_name}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: agent.status === "active" ? "#34d399" : "#6b7280", boxShadow: agent.status === "active" ? "0 0 5px #34d399" : "none" }} />
            <span style={{ fontSize: "0.7rem", color: agent.status === "active" ? "#34d399" : "#6b7280", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>{agent.status}</span>
          </div>
        </div>
        {/* URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", background: "rgba(0,0,0,0.2)", borderRadius: 9, marginBottom: 14 }}>
          <Icon d={IC.link} size={12} color="rgba(237,240,247,0.3)" />
          <span style={{ flex: 1, fontSize: "0.75rem", color: "rgba(237,240,247,0.45)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>easybuilda.com/{slug}</span>
          <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: copied ? "#34d399" : "rgba(237,240,247,0.3)", display: "flex" }}>
            <Icon d={IC.copy} size={12} color={copied ? "#34d399" : "rgba(237,240,247,0.3)"} />
          </button>
        </div>
        {/* Readiness */}
        {agent.readiness_score !== undefined && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "0.68rem", color: "rgba(237,240,247,0.38)" }}>Readiness</span>
              <span style={{ fontSize: "0.68rem", color: "#edf0f7", fontWeight: 600 }}>{agent.readiness_score}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${agent.readiness_score}%`, background: agent.readiness_score >= 75 ? "#34d399" : "#fbbf24", borderRadius: 99 }} />
            </div>
          </div>
        )}
        {/* Actions */}
        <div style={{ display: "flex", gap: 7 }}>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, color, fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>
            <Icon d={IC.eye} size={13} color={color} /> Preview
          </a>
          <button onClick={onEdit}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon d={IC.edit} size={13} color="#a78bfa" /> Edit
          </button>
          <button onClick={onToggle}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,240,247,0.65)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon d={agent.status === "active" ? IC.pause : IC.play} size={13} />
            {agent.status === "active" ? "Pause" : "Start"}
          </button>
          <button onClick={onDelete}
            style={{ width: 36, borderRadius: 10, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={IC.trash} size={13} color="#f87171" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentEditor({ agent, token, onSave, onClose }: { agent: Agent; token: string; onSave: (a: Agent) => void; onClose: () => void; }) {
  const [form, setForm]   = useState({ name: agent.name || "", tagline: agent.tagline || "", welcome_message: agent.welcome_message || "", tone: agent.tone || "friendly", primary_color: agent.primary_color || "#7c3aed", system_prompt: agent.system_prompt || "", knowledge: agent.knowledge || "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const save = async () => {
    setSaving(true); setError("");
    const res = await fetch(`${API}/api/agents/${agent.id}/fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSave({ ...agent, ...form }); onClose(); }
    else { const d = await res.json(); setError(d.detail || "Save failed"); }
    setSaving(false);
  };

  const line = "rgba(255,255,255,0.07)";
  const inp  = { width: "100%", padding: "10px 13px", background: "rgba(255,255,255,0.04)", border: `1px solid ${line}`, borderRadius: 11, color: "#edf0f7", fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, resize: "none" as const };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 580, background: "#0d1117", border: `1px solid ${line}`, borderRadius: 20, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1rem", color: "#edf0f7" }}>Edit Agent — {agent.name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(237,240,247,0.4)", display: "flex" }}>
            <Icon d={IC.x} size={18} />
          </button>
        </div>
        <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Agent Name",        key: "name",            rows: 0 },
            { label: "Tagline",           key: "tagline",         rows: 0 },
            { label: "Welcome Message",   key: "welcome_message", rows: 2 },
            { label: "System Prompt",     key: "system_prompt",   rows: 5 },
            { label: "Knowledge Base",    key: "knowledge",       rows: 5 },
          ].map(({ label, key, rows }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "0.72rem", color: "rgba(237,240,247,0.45)", marginBottom: 6, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
              {rows > 0 ? (
                <textarea rows={rows} style={inp} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              ) : (
                <input type="text" style={inp} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", color: "rgba(237,240,247,0.45)", marginBottom: 6, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tone</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}>
                {["friendly", "professional", "luxury", "energetic", "casual"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", color: "rgba(237,240,247,0.45)", marginBottom: 6, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Brand Color</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} style={{ width: 44, height: 40, borderRadius: 10, border: `1px solid ${line}`, background: "none", cursor: "pointer", padding: 2 }} />
                <input type="text" style={{ ...inp, flex: 1 }} value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} />
              </div>
            </div>
          </div>
          {error && <p style={{ color: "#f87171", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${line}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${line}`, color: "rgba(237,240,247,0.7)", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 12, background: saving ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Icon d={IC.save} size={14} color="#fff" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab,       setTab]       = useState<Tab>("overview");
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [leads,     setLeads]     = useState<Lead[]>([]);
  const [wallet,    setWallet]    = useState<Wallet | null>(null);
  const [txs,       setTxs]       = useState<Tx[]>([]);
  const [token,     setToken]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const [billing, setBilling] = useState<any>(null);

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes, wRes, tRes, lRes, bRes] = await Promise.all([
        fetch(`${API}/api/profile/me`,          { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,           { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet`,              { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/leads/all`,           { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/billing/status`,      { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile || d); }
      if (aRes.ok) { const d = await aRes.json(); setAgents(d.agents || []); }
      if (wRes.ok) setWallet(await wRes.json());
      if (tRes.ok) { const d = await tRes.json(); setTxs(d.transactions || []); }
      if (lRes.ok) { const d = await lRes.json(); setLeads(d.leads || []); }
      if (bRes.ok) setBilling(await bRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  const toggleAgent = async (a: Agent) => {
    const ns = a.status === "active" ? "inactive" : "active";
    await fetch(`${API}/api/agents/${a.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: ns }) });
    setAgents(p => p.map(x => x.id === a.id ? { ...x, status: ns } : x));
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`${API}/api/agents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setAgents(p => p.filter(x => x.id !== id));
  };

  const signOut = async () => { await createClient().auth.signOut(); window.location.href = "/"; };

  const plan      = profile?.plan || "trial";
  const maxAgents = PLAN_LIMITS[plan] ?? 1;
  const trialEnd  = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const daysLeft  = trialEnd && plan === "trial" ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;
  const isExpired = daysLeft === 0 && plan === "trial";
  const line      = "rgba(255,255,255,0.07)";

  const TABS = [
    { id: "overview" as Tab, label: "Overview",  icon: "home"    },
    { id: "agents"   as Tab, label: "Agents",    icon: "agent"   },
    { id: "leads"    as Tab, label: "Leads",     icon: "leads"   },
    { id: "wallet"   as Tab, label: "Wallet",    icon: "wallet"  },
    { id: "tools"    as Tab, label: "Tools",     icon: "tools"   },
    { id: "support"  as Tab, label: "Support",   icon: "support" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)", display: "flex" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:11px;cursor:pointer;font-size:0.85rem;color:rgba(237,240,247,0.5);background:none;border:none;font-family:inherit;width:100%;transition:all 0.15s}
        .tab-btn:hover{background:rgba(255,255,255,0.04);color:rgba(237,240,247,0.85)}
        .tab-btn.active{background:rgba(124,58,237,0.12);color:#edf0f7;font-weight:600}
        .btn-p{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:11px;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;font-weight:700;font-size:0.86rem;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.15s}
        .btn-p:hover{filter:brightness(1.08)}
        .btn-g{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(237,240,247,0.75);font-weight:600;font-size:0.86rem;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.15s}
        .btn-g:hover{background:rgba(255,255,255,0.09);color:#edf0f7}
        .inp{width:100%;padding:10px 13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:11px;color:#edf0f7;font-size:0.87rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
      `}</style>

      {/* ── Billing banners ── */}
      {billing && !billing.is_pro && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "none" }}>
          {billing.is_expired && (
            <div style={{ pointerEvents: "all", background: "rgba(248,113,113,0.95)", backdropFilter: "blur(8px)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>
                Your trial has ended — your agent is paused.
              </p>
              <a href="/wallet/topup" style={{ padding: "5px 14px", borderRadius: 8, background: "#fff", color: "#ef4444", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                Add funds →
              </a>
            </div>
          )}
          {billing.is_trial && billing.days_left !== null && billing.days_left <= 3 && (
            <div style={{ pointerEvents: "all", background: "rgba(245,158,11,0.95)", backdropFilter: "blur(8px)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>
                ⚡ {billing.days_left} day{billing.days_left !== 1 ? "s" : ""} left in trial — upgrade before your agent pauses
              </p>
              <a href="/pricing" style={{ padding: "5px 14px", borderRadius: 8, background: "#fff", color: "#b45309", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                Upgrade →
              </a>
            </div>
          )}
          {billing.is_trial && billing.days_left !== null && billing.days_left > 3 && (
            <div style={{ pointerEvents: "all", background: "rgba(17,24,39,0.9)", borderBottom: "1px solid rgba(251,191,36,0.3)", backdropFilter: "blur(8px)", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "#fbbf24" }}>
                Trial: {billing.days_left} days remaining
              </p>
              <a href="/pricing" style={{ fontSize: "0.8rem", color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}>Upgrade to Pro →</a>
            </div>
          )}
        </div>
      )}
      {billing?.is_pro && billing?.balance < 5 && billing?.balance > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "all", background: "rgba(245,158,11,0.9)", backdropFilter: "blur(8px)", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600, color: "#fff" }}>
            ⚠️ Low balance (${billing.balance.toFixed(2)}) — add funds to keep your agent live
          </p>
          <a href="/wallet/topup" style={{ fontSize: "0.8rem", color: "#fff", textDecoration: "none", fontWeight: 700, textDecoration: "underline" }}>Add funds →</a>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 230, flexShrink: 0, borderRight: `1px solid ${line}`, display: "flex", flexDirection: "column", padding: "18px 12px", position: "sticky", top: 0, height: "100vh", overflowY: "auto", background: "rgba(5,7,15,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", marginBottom: 24 }}>
          <svg viewBox="0 0 1024 1024" width={24} height={24}><defs><linearGradient id="sl" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs><path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#sl)"/></svg>
          <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.92rem", color: "#edf0f7" }}>EasyBuilda</span>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn${tab === t.id ? " active" : ""}`}>
              <Icon d={IC[t.icon as keyof typeof IC]} size={16} color={tab === t.id ? "#a78bfa" : undefined} />
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${line}` }}>
          {daysLeft !== null && !isExpired && (
            <div style={{ padding: "8px 11px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#fbbf24", fontWeight: 600 }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial</p>
              <a href="/pricing" style={{ fontSize: "0.69rem", color: "#fbbf24", textDecoration: "none", opacity: 0.75 }}>Upgrade now →</a>
            </div>
          )}
          {isExpired && (
            <div style={{ padding: "8px 11px", borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>Trial expired</p>
              <a href="/pricing" style={{ fontSize: "0.69rem", color: "#f87171", textDecoration: "none" }}>Upgrade to continue →</a>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#edf0f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name || "My Account"}</p>
              <PlanBadge plan={plan} />
            </div>
          </div>
          <button onClick={signOut} className="tab-btn" style={{ marginTop: 2, color: "rgba(248,113,113,0.65)" }}>
            <Icon d={IC.logout} size={15} color="rgba(248,113,113,0.65)" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "rgba(5,7,15,0.92)", backdropFilter: "blur(12px)", zIndex: 10 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1rem", color: "#edf0f7" }}>
            {TABS.find(t => t.id === tab)?.label}
          </h1>
          <div style={{ display: "flex", gap: 9 }}>
            {tab === "agents" && agents.length < maxAgents && <a href="/build" className="btn-p"><Icon d={IC.plus} size={14} color="#fff" /> New agent</a>}
            {tab === "wallet" && <a href="/wallet/topup" className="btn-p"><Icon d={IC.plus} size={14} color="#fff" /> Add funds</a>}
          </div>
        </header>

        <div style={{ padding: "22px 24px", animation: "fadeIn 0.2s ease both" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 11, marginBottom: 22 }}>
                <StatCard label="Agents"       value={`${agents.filter(a=>a.status==="active").length}/${maxAgents}`} sub={`${plan} plan`} icon="agent"  accent="#a78bfa" />
                <StatCard label="Balance"      value={`$${(wallet?.balance??0).toFixed(2)}`}                          sub="Available"      icon="wallet" accent="#34d399" />
                <StatCard label="Total leads"  value={leads.length}                                                   sub="All time"       icon="leads"  accent="#38bdf8" />
                <StatCard label="Plan"         value={plan.charAt(0).toUpperCase()+plan.slice(1)}                    sub={daysLeft !== null ? `${daysLeft}d left` : undefined} icon="star" accent="#fbbf24" />
              </div>
              <div style={{ marginBottom: 22 }}>
                <p style={{ margin: "0 0 12px", fontSize: "0.7rem", color: "rgba(237,240,247,0.38)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick actions</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 9 }}>
                  {[
                    { label: "Build agent",   href: "/build",        icon: "plus",    color: "#7c3aed" },
                    { label: "Add funds",     href: "/wallet/topup", icon: "wallet",  color: "#34d399" },
                    { label: "Upgrade plan",  href: "/pricing",      icon: "star",    color: "#fbbf24" },
                    { label: "LinkedIn tool", href: "/tools/linkedin",icon: "linkedin",color: "#0A66C2" },
                    { label: "Explore agents",href: "/explore",      icon: "eye",     color: "#ec4899" },
                    { label: "Support email", href: "mailto:omar@easybuilda.com",icon: "support",color: "#f97316" },
                  ].map(qa => (
                    <a key={qa.label} href={qa.href}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", background: "rgba(255,255,255,0.03)", border: `1px solid ${line}`, borderRadius: 12, textDecoration: "none", color: "#edf0f7", transition: "all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.13)"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor=line}}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${qa.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon d={IC[qa.icon as keyof typeof IC]} size={14} color={qa.color} />
                      </div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{qa.label}</span>
                    </a>
                  ))}
                </div>
              </div>
              {agents.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(237,240,247,0.38)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your agents</p>
                    <button onClick={()=>setTab("agents")} style={{ background:"none",border:"none",color:"rgba(237,240,247,0.38)",fontSize:"0.78rem",cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>View all <Icon d={IC.arrow} size={12}/></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                    {agents.slice(0,2).map(a => <AgentCard key={a.id} agent={a} onToggle={()=>toggleAgent(a)} onDelete={()=>deleteAgent(a.id)} onEdit={()=>setEditAgent(a)} />)}
                  </div>
                </div>
              )}
              {agents.length === 0 && (
                <div style={{ textAlign:"center",padding:"50px 20px",background:"rgba(255,255,255,0.02)",border:`1px dashed ${line}`,borderRadius:18 }}>
                  <p style={{ margin:"0 0 14px",fontSize:"0.92rem",color:"rgba(237,240,247,0.45)" }}>No agents yet</p>
                  <a href="/build" className="btn-p">Build my first agent</a>
                </div>
              )}
            </div>
          )}

          {/* AGENTS */}
          {tab === "agents" && (
            <div>
              {agents.length < maxAgents && <a href="/build" className="btn-p" style={{ marginBottom: 18, display: "inline-flex" }}><Icon d={IC.plus} size={14} color="#fff" /> Build new agent</a>}
              {agents.length >= maxAgents && (
                <div style={{ padding:"11px 15px",borderRadius:12,background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.18)",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <p style={{ margin:0,fontSize:"0.84rem",color:"#fbbf24" }}>Agent limit reached on {plan} plan</p>
                  <a href="/pricing" style={{ fontSize:"0.8rem",color:"#fbbf24",fontWeight:700,textDecoration:"none" }}>Upgrade →</a>
                </div>
              )}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:13 }}>
                {agents.map(a => <AgentCard key={a.id} agent={a} onToggle={()=>toggleAgent(a)} onDelete={()=>deleteAgent(a.id)} onEdit={()=>setEditAgent(a)} />)}
              </div>
              {agents.length===0 && <p style={{ color:"rgba(237,240,247,0.38)",fontSize:"0.88rem" }}>No agents yet. <a href="/build" style={{ color:"#a78bfa",textDecoration:"none" }}>Build one →</a></p>}
            </div>
          )}

          {/* LEADS */}
          {tab === "leads" && (
            <div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20 }}>
                <StatCard label="Total"      value={leads.length}                                         icon="leads" accent="#38bdf8" />
                <StatCard label="Hot leads"  value={leads.filter(l=>l.lead_type==="hot").length}          icon="star"  accent="#f97316" />
                <StatCard label="Cold leads" value={leads.filter(l=>l.lead_type==="cold").length}         icon="chart" accent="#38bdf8" />
              </div>
              {leads.length === 0 ? (
                <div style={{ textAlign:"center",padding:"60px 20px",color:"rgba(237,240,247,0.35)" }}>
                  <p>No leads yet. Share your agent link to start capturing.</p>
                </div>
              ) : (
                <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${line}`,borderRadius:16,overflow:"hidden" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 90px 110px",padding:"9px 15px",borderBottom:`1px solid ${line}`,background:"rgba(255,255,255,0.03)" }}>
                    {["Name","Email","Phone","Type","Date"].map(h=><p key={h} style={{ margin:0,fontSize:"0.67rem",color:"rgba(237,240,247,0.38)",fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</p>)}
                  </div>
                  {leads.slice(0,50).map((l,i)=>(
                    <div key={l.id} style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 90px 110px",padding:"11px 15px",borderBottom:i<leads.length-1?`1px solid ${line}`:"none",alignItems:"center" }}>
                      <p style={{ margin:0,fontSize:"0.84rem",color:"#edf0f7",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.name||"—"}</p>
                      <p style={{ margin:0,fontSize:"0.81rem",color:"rgba(237,240,247,0.55)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.email||"—"}</p>
                      <p style={{ margin:0,fontSize:"0.81rem",color:"rgba(237,240,247,0.55)" }}>{l.phone||"—"}</p>
                      <span style={{ padding:"2px 7px",borderRadius:100,fontSize:"0.67rem",fontWeight:700,background:l.lead_type==="hot"?"rgba(249,115,22,0.12)":"rgba(56,189,248,0.12)",color:l.lead_type==="hot"?"#f97316":"#38bdf8",display:"inline-block" }}>{l.lead_type||"cold"}</span>
                      <p style={{ margin:0,fontSize:"0.74rem",color:"rgba(237,240,247,0.38)" }}>{new Date(l.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WALLET */}
          {tab === "wallet" && (
            <div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:11,marginBottom:22 }}>
                <div style={{ padding:"22px",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:18 }}>
                  <p style={{ margin:"0 0 7px",fontSize:"0.7rem",color:"rgba(52,211,153,0.65)",fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",textTransform:"uppercase",letterSpacing:"0.1em" }}>Available balance</p>
                  <p style={{ margin:0,fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:"2.6rem",color:"#34d399",lineHeight:1 }}>${(wallet?.balance??0).toFixed(2)}</p>
                  <p style={{ margin:"5px 0 0",fontSize:"0.74rem",color:"rgba(52,211,153,0.45)" }}>{wallet?.currency||"USD"}</p>
                </div>
              </div>
              <a href="/wallet/topup" className="btn-p" style={{ marginBottom:22,display:"inline-flex" }}><Icon d={IC.plus} size={14} color="#fff"/>Add funds</a>
              <p style={{ margin:"0 0 10px",fontSize:"0.7rem",color:"rgba(237,240,247,0.38)",fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",textTransform:"uppercase",letterSpacing:"0.1em" }}>Transactions</p>
              {txs.length===0 ? <p style={{ color:"rgba(237,240,247,0.35)",fontSize:"0.86rem" }}>No transactions yet.</p> : (
                <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${line}`,borderRadius:16,overflow:"hidden" }}>
                  {txs.map((tx,i)=>{
                    const isC=tx.amount>0;
                    return (
                      <div key={tx.id} style={{ display:"flex",alignItems:"center",gap:13,padding:"12px 17px",borderBottom:i<txs.length-1?`1px solid ${line}`:"none" }}>
                        <div style={{ width:34,height:34,borderRadius:10,background:isC?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          <Icon d={isC?IC.plus:IC.arrow} size={14} color={isC?"#34d399":"#f87171"}/>
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ margin:0,fontSize:"0.84rem",color:"#edf0f7",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.description||tx.type}</p>
                          <p style={{ margin:"2px 0 0",fontSize:"0.7rem",color:"rgba(237,240,247,0.38)" }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign:"right",flexShrink:0 }}>
                          <p style={{ margin:0,fontWeight:700,color:isC?"#34d399":"#f87171",fontFamily:"var(--font-mono,'JetBrains Mono',monospace)" }}>{isC?"+":""}{tx.amount.toFixed(2)}</p>
                          <p style={{ margin:"2px 0 0",fontSize:"0.7rem",color:"rgba(237,240,247,0.3)" }}>${tx.balance_after.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop:20,padding:"15px 18px",background:"rgba(255,255,255,0.02)",border:`1px solid ${line}`,borderRadius:13 }}>
                <p style={{ margin:"0 0 9px",fontSize:"0.78rem",fontWeight:600,color:"#edf0f7" }}>Payment methods</p>
                <p style={{ margin:"0 0 5px",fontSize:"0.8rem",color:"rgba(237,240,247,0.5)" }}><strong style={{ color:"#edf0f7" }}>Bank transfer</strong> — Mashreq Bank Egypt (USD only)</p>
                <p style={{ margin:0,fontSize:"0.8rem",color:"rgba(237,240,247,0.5)" }}><strong style={{ color:"#edf0f7" }}>PayPal</strong> — paypal.me/Ahmedmaher1728399</p>
              </div>
            </div>
          )}

          {/* TOOLS */}
          {tab === "tools" && (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:13 }}>
              {[
                { title:"LinkedIn Content", desc:"Generate ready-to-post LinkedIn content from your agent data", href:"/tools/linkedin", icon:"linkedin", color:"#0A66C2", badge:"AI" },
                { title:"Case Study Builder", desc:"Turn your lead results into a professional case study", href:"/tools/case-study", icon:"tools", color:"#a78bfa", badge:"AI" },
                { title:"Explore Agents", desc:"Browse all live AI agents from other EasyBuilda businesses", href:"/explore", icon:"eye", color:"#38bdf8", badge:null },
                { title:"Pricing & Upgrade", desc:"View plans and upgrade for more agents and features", href:"/pricing", icon:"star", color:"#fbbf24", badge:null },
              ].map(tool=>(
                <a key={tool.title} href={tool.href} style={{ textDecoration:"none",display:"block",padding:"20px",background:"rgba(255,255,255,0.03)",border:`1px solid ${line}`,borderRadius:16,transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.13)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor=line}}>
                  <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
                    <div style={{ width:40,height:40,borderRadius:12,background:`${tool.color}14`,border:`1px solid ${tool.color}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon d={IC[tool.icon as keyof typeof IC]} size={19} color={tool.color}/>
                    </div>
                    {tool.badge&&<span style={{ padding:"2px 8px",borderRadius:100,fontSize:"0.66rem",fontWeight:700,background:`${tool.color}18`,color:tool.color,border:`1px solid ${tool.color}28` }}>{tool.badge}</span>}
                  </div>
                  <h3 style={{ margin:"0 0 5px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"0.93rem",color:"#edf0f7" }}>{tool.title}</h3>
                  <p style={{ margin:0,fontSize:"0.81rem",color:"rgba(237,240,247,0.5)",lineHeight:1.6 }}>{tool.desc}</p>
                </a>
              ))}
            </div>
          )}

          {/* SUPPORT */}
          {tab === "support" && (
            <div style={{ maxWidth:520 }}>
              <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${line}`,borderRadius:20,padding:"32px",textAlign:"center" }}>
                <div style={{ width:52,height:52,borderRadius:15,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
                  <Icon d={IC.support} size={22} color="#a78bfa"/>
                </div>
                <h3 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.05rem",color:"#edf0f7",marginBottom:8 }}>Need help?</h3>
                <p style={{ fontSize:"0.88rem",color:"rgba(237,240,247,0.5)",lineHeight:1.65,marginBottom:22 }}>Send us an email and we'll get back to you within a few hours.</p>
                <a href="mailto:omar@easybuilda.com?subject=Support Request" className="btn-p">Send email</a>
                <p style={{ marginTop:14,fontSize:"0.76rem",color:"rgba(237,240,247,0.3)" }}>omar@easybuilda.com</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Agent Editor Modal */}
      {editAgent && (
        <AgentEditor
          agent={editAgent}
          token={token}
          onSave={updated => setAgents(p => p.map(a => a.id === updated.id ? updated : a))}
          onClose={() => setEditAgent(null)}
        />
      )}
    </div>
  );
}
