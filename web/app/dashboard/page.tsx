"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";
import { AgentEditor } from "@/components/AgentEditor";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Agent {
  id: string; name: string; business_name: string; subdomain: string;
  status: string; primary_color?: string; plan: string;
  readiness_score?: number; leads_pin?: string; created_at: string;
  tagline?: string; welcome_message?: string;
}
interface Profile {
  id: string; full_name: string; email: string;
  plan: string; trial_ends_at?: string;
}

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  trial_basic: { label: "Trial",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)"   },
  trial_pro:   { label: "Trial · Pro", color: "#a78bfa", bg: "rgba(167,139,250,0.1)"  },
  basic:       { label: "Basic",  color: "#38bdf8", bg: "rgba(56,189,248,0.1)"   },
  pro:         { label: "Pro",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  admin:       { label: "Admin",  color: "#34d399", bg: "rgba(52,211,153,0.1)"   },
};

function planMeta(plan: string) {
  return PLAN_META[plan] ?? { label: plan, color: "var(--color-dust)", bg: "rgba(255,255,255,0.05)" };
}

function trialDaysLeft(trialEnds?: string) {
  if (!trialEnds) return null;
  const diff = new Date(trialEnds).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

/* ── Genesis Orb ──────────────────────────────────────────────────── */
function GenesisOrb({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "56px 24px" }}>
      <div style={{ position: "relative", width: 160, height: 160, cursor: "pointer" }} onClick={onClick}>
        <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "conic-gradient(from 0deg,transparent 0%,rgba(124,58,237,0.45) 30%,rgba(56,189,248,0.4) 60%,transparent 100%)", filter: "blur(12px)", animation: "spin 5s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%,rgba(192,132,252,0.9),rgba(124,58,237,0.55) 50%,rgba(37,99,235,0.35) 75%,transparent)", boxShadow: "0 0 60px rgba(124,58,237,0.35),inset 0 0 30px rgba(56,189,248,0.12)", animation: "breathe 3.5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><path d="M14 4v20M4 14h20" stroke="white" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>Build your first agent</h2>
        <p style={{ margin: "0 0 28px", fontSize: "0.88rem", color: "var(--color-dust)", lineHeight: 1.65, maxWidth: 360 }}>Your AI agent answers customers, captures leads, and works 24/7 — live in minutes.</p>
        <a href="/build" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.78rem 1.8rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", textDecoration: "none", fontFamily: "var(--font-sans)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
          Create agent →
        </a>
      </div>
    </div>
  );
}

/* ── Agent Card ───────────────────────────────────────────────────── */
function AgentCard({ agent, onEdit, onDelete, onViewLeads }: { agent: Agent; onEdit: () => void; onDelete: () => void; onViewLeads: () => void }) {
  const [showPin, setShowPin] = useState(false);
  const color = agent.primary_color || "#7c3aed";
  const h = color.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const pct = agent.readiness_score ?? 0;
  const health = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.4)`}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)"}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},#22d3ee)` }} />
      <div style={{ padding: "20px 22px" }}>
        {/* Top */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg,${color},#22d3ee)`, boxShadow: `0 0 22px rgba(${rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff" }}>
            {(agent.name || "AI").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.business_name}</p>
            {agent.tagline && <p style={{ margin: "3px 0 0", fontSize: "0.73rem", color: "var(--color-dust)", opacity: 0.65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.tagline}</p>}
          </div>
          {/* Readiness ring */}
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={health} strokeWidth="3.5" strokeDasharray={`${(pct/100)*2*Math.PI*16} ${2*Math.PI*16}`} strokeLinecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 700, color: health, fontFamily: "var(--font-mono)" }}>{pct}</div>
          </div>
        </div>

        {/* URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0, boxShadow: "0 0 6px #34d399" }} />
          <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, fontSize: "0.73rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            easybuilda.vercel.app/{agent.subdomain}
          </a>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke="var(--color-stellar)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>

        {/* PIN */}
        {agent.leads_pin && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>Leads PIN:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.85rem", color: showPin ? "var(--color-starlight)" : "var(--color-dust)", letterSpacing: "0.1em" }}>{showPin ? agent.leads_pin : "• • • • • •"}</span>
            <button onClick={() => setShowPin(!showPin)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: "0.68rem", color: "var(--color-nebula)", fontFamily: "var(--font-mono)" }}>{showPin ? "hide" : "show"}</button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, color, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-sans)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.18)`}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.1)`}>
            Edit agent
          </button>
          <button onClick={onViewLeads} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.82rem", cursor: "pointer", transition: "border-color 0.15s", fontFamily: "var(--font-sans)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line-bright)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)"}>
            View leads
          </button>
          <button onClick={onDelete} title="Delete agent" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.06)"}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 4h10M5.5 4V2.5h4V4M6.5 7v4M8.5 7v4M3.5 4l.8 8.5h6.4L11.5 4" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Trial Banner ─────────────────────────────────────────────────── */
function TrialBanner({ plan, daysLeft }: { plan: string; daysLeft: number | null }) {
  if (!plan.startsWith("trial") || daysLeft === null) return null;
  const expired = daysLeft <= 0;
  return (
    <div style={{ padding: "12px 18px", borderRadius: 14, marginBottom: 24, background: expired ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.07)", border: `1px solid ${expired ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.22)"}`, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 18 }}>{expired ? "⚠️" : "⏰"}</span>
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>
        {expired ? "Your trial has expired. Upgrade to keep your agent live." : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial.`}
      </p>
      <a href="/pricing" style={{ padding: "7px 14px", borderRadius: 9, background: expired ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.12)", border: `1px solid ${expired ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`, fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: expired ? "#f87171" : "#fbbf24", whiteSpace: "nowrap" }}>
        Upgrade →
      </a>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [token,     setToken]     = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const PLAN_LIMITS: Record<string, number> = { trial_basic: 1, trial_pro: 1, basic: 1, pro: 2 };
  const agentLimit = PLAN_LIMITS[profile?.plan ?? "basic"] ?? 1;
  const canBuild = agents.length < agentLimit;

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (aRes.ok) { const d = await aRes.json(); setAgents(d.agents ?? []); }
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

  const editingAgent = agents.find(a => a.id === editingId);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes dashIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: "radial-gradient(900px 500px at 70% -8%,rgba(124,58,237,0.09),transparent 65%)" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            {editingId && (
              <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontFamily: "var(--font-sans)", padding: "4px 0" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Dashboard
              </button>
            )}
            {!editingId && (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-nebula)", boxShadow: "0 0 10px var(--color-nebula)", flexShrink: 0 }} />
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)", flex: 1 }}>
                  {profile?.full_name ? `${profile.full_name.split(" ")[0]}'s dashboard` : "Dashboard"}
                </h1>
              </>
            )}
            {editingId && editingAgent && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem", color: "var(--color-starlight)" }}>Editing {editingAgent.name}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>Auto-saves</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {profile?.plan && (() => { const m = planMeta(profile.plan); return (
                <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: m.bg, color: m.color, border: `1px solid ${m.color}33` }}>{m.label}</span>
              ); })()}
              <button onClick={async () => { const sb = createClient(); await sb.auth.signOut(); window.location.href = "/auth/login"; }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-sans)" }}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 24px", animation: "dashIn 0.3s ease both" }}>
          {error && <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.82rem", color: "#f87171" }}>{error}</div>}

          {/* Edit mode */}
          {editingId && token && <AgentEditor agentId={editingId} token={token} onClose={() => setEditingId(null)} />}

          {/* Dashboard mode */}
          {!editingId && (
            <>
              <TrialBanner plan={profile?.plan ?? ""} daysLeft={trialDaysLeft(profile?.trial_ends_at)} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-starlight)" }}>Your agents</h2>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)" }}>{agents.length} of {agentLimit} agent{agentLimit !== 1 ? "s" : ""} used</p>
                </div>
                {canBuild && agents.length > 0 && (
                  <a href="/build" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.62rem 1.2rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.86rem", cursor: "pointer", textDecoration: "none", fontFamily: "var(--font-sans)", boxShadow: "0 0 22px rgba(124,58,237,0.35)" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    New agent
                  </a>
                )}
              </div>

              {agents.length === 0 ? (
                <GenesisOrb onClick={() => window.location.href = "/build"} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                  {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent}
                      onEdit={() => setEditingId(agent.id)}
                      onDelete={() => deleteAgent(agent.id)}
                      onViewLeads={() => window.open(`/${agent.subdomain}/leads?key=${agent.id}`, "_blank")} />
                  ))}
                </div>
              )}

              {!canBuild && (
                <div style={{ marginTop: 24, padding: "20px 24px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)" }}>Want more agents?</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-dust)" }}>Upgrade to Pro for 2 agents, custom URL, and image support in chat.</p>
                  </div>
                  <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.7rem 1.4rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.86rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                    Upgrade to Pro →
                  </a>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}