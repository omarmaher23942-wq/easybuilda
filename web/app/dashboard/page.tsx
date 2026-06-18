"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";
import { AgentEditor } from "@/components/AgentEditor";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Agent {
  id: string; name: string; business_name: string; subdomain: string;
  status: string; primary_color?: string; plan: string;
  readiness_score?: number; leads_pin?: string; created_at: string; tagline?: string;
}
interface Profile {
  id: string; full_name: string; email: string; plan: string;
  trial_ends_at?: string; billing_end?: string;
}

const PLAN_LIMITS: Record<string, number> = { trial: 1, basic: 1, pro: 2, max: 3 };
const PLAN_COLORS: Record<string, string> = { trial: "#fbbf24", basic: "#38bdf8", pro: "#a78bfa", expired: "#f87171", admin: "#34d399" };

function planColor(plan: string) { return PLAN_COLORS[plan] ?? "#6b7280"; }
function planLabel(plan: string) {
  const l: Record<string, string> = { trial: "Trial", basic: "Basic", pro: "Pro", max: "Max", expired: "Expired", admin: "Admin" };
  return l[plan] ?? plan;
}
function daysLeft(date?: string) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

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
            <span style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>PIN:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.85rem", color: showPin ? "var(--color-starlight)" : "var(--color-dust)", letterSpacing: "0.1em" }}>{showPin ? agent.leads_pin : "• • • • • •"}</span>
            <button onClick={() => setShowPin(!showPin)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "var(--color-nebula)", fontFamily: "var(--font-mono)" }}>{showPin ? "hide" : "show"}</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, color, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
          <button onClick={onViewLeads} style={{ flex: 2, padding: "9px 0", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Leads</button>
          <button onClick={onDelete} title="Delete" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 4h10M5.5 4V2.5h4V4M6.5 7v4M8.5 7v4M3.5 4l.8 8.5h6.4L11.5 4" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [token,     setToken]     = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const agentLimit  = PLAN_LIMITS[profile?.plan ?? "trial"] ?? 1;
  const isExpired   = profile?.plan === "expired";
  const canBuild    = agents.length < agentLimit && !isExpired;
  const trialLeft   = profile?.plan === "trial" ? daysLeft(profile.trial_ends_at) : null;
  const billingLeft = profile?.billing_end ? daysLeft(profile.billing_end) : null;
  const showUpgrade = profile?.plan && !["pro", "max", "admin"].includes(profile.plan);

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,   { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (aRes.ok) { const d = await aRes.json(); setAgents(d.agents ?? []); }
    } catch { setError("Failed to load."); }
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

  const editingAgent = agents.find(a => a.id === editingId);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes dashIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .btn-genesis{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0.7rem 1.4rem;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);border:none;color:#fff;font-weight:700;font-size:0.9rem;font-family:var(--font-sans);cursor:pointer;box-shadow:0 0 28px rgba(124,58,237,0.35);transition:all 0.2s;text-decoration:none}
        .btn-genesis:hover{filter:brightness(1.08);transform:translateY(-1px)}
      `}</style>
      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: "radial-gradient(900px 500px at 70% -8%,rgba(124,58,237,0.08),transparent 65%)" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            {editingId ? (
              <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-dust)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontFamily: "var(--font-sans)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Dashboard
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
              <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>
                Editing {editingAgent.name}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {profile?.plan && (
                <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: `${planColor(profile.plan)}18`, color: planColor(profile.plan), border: `1px solid ${planColor(profile.plan)}30` }}>
                  {planLabel(profile.plan)}
                </span>
              )}
              <button onClick={async () => { await createClient().auth.signOut(); window.location.href = "/auth/login"; }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-sans)" }}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", animation: "dashIn 0.3s ease both" }}>
          {error && <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.82rem", color: "#f87171" }}>{error}</div>}

          {editingId && token && <AgentEditor agentId={editingId} token={token} onClose={() => setEditingId(null)} />}

          {!editingId && (
            <>
              {/* Expired banner */}
              {isExpired && (
                <div style={{ marginBottom: 20, padding: "14px 20px", borderRadius: 14, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-starlight)", flex: 1 }}>Your plan has expired. Renew to keep your agent live.</p>
                  <a href="/pricing" className="btn-genesis" style={{ fontSize: "0.82rem", padding: "0.6rem 1.1rem" }}>Renew now →</a>
                </div>
              )}

              {/* Trial banner */}
              {profile?.plan === "trial" && trialLeft !== null && (
                <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 14, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>⏰</span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>
                    {trialLeft <= 0 ? "Trial expired." : `${trialLeft} day${trialLeft === 1 ? "" : "s"} left in your trial.`}
                  </p>
                  <a href="/pricing" style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: "#fbbf24", whiteSpace: "nowrap" }}>Upgrade →</a>
                </div>
              )}

              {/* Billing expiry banner — 7 days warning */}
              {billingLeft !== null && billingLeft <= 7 && !isExpired && profile?.plan !== "trial" && (
                <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 14, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>📅</span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", flex: 1 }}>
                    {billingLeft <= 0 ? "Subscription expired." : `${billingLeft} day${billingLeft === 1 ? "" : "s"} until subscription expires.`} Renew to stay active.
                  </p>
                  <a href={`/payment/${profile?.plan}`} style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", color: "#fbbf24", whiteSpace: "nowrap" }}>Renew →</a>
                </div>
              )}

              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>Your agents</h2>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-dust)" }}>{agents.length} of {agentLimit} used</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* Upgrade button — always visible if not on top plan */}
                  {showUpgrade && (
                    <a href="/pricing" style={{ padding: "0.62rem 1.2rem", borderRadius: 11, background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.1))", border: "1px solid rgba(124,58,237,0.35)", color: "#a78bfa", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)")}>
                      ⬆ Upgrade
                    </a>
                  )}
                  {canBuild && agents.length > 0 && (
                    <a href="/build" className="btn-genesis" style={{ fontSize: "0.86rem", padding: "0.62rem 1.2rem" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      New agent
                    </a>
                  )}
                </div>
              </div>

              {/* Agents */}
              {agents.length === 0 ? (
                <GenesisOrb onClick={() => { window.location.href = "/build"; }} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onEdit={() => setEditingId(agent.id)}
                      onDelete={() => deleteAgent(agent.id)}
                      onViewLeads={() => window.open(`/${agent.subdomain}/leads?key=${agent.id}`, "_blank")}
                    />
                  ))}
                </div>
              )}

              {/* At limit CTA */}
              {!canBuild && !isExpired && (
                <div style={{ marginTop: 24, padding: "20px 24px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)" }}>Want more agents?</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-dust)" }}>Upgrade to Pro for 2 agents, custom URL, and image support.</p>
                  </div>
                  <a href="/pricing" className="btn-genesis" style={{ fontSize: "0.86rem" }}>Upgrade to Pro →</a>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}