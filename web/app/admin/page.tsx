"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/* ── Types ─────────────────────────────────────────────────────── */
interface Stats {
  total_users: number; active_trials: number; basic_users: number;
  pro_users: number; expired_users: number; pending_payments: number;
  approved_payments: number; total_revenue: number; active_agents: number;
  agents_this_week?: number; users_this_week?: number; leads_this_week?: number;
}
interface Payment {
  id: string; user_id: string; plan: string; amount: number; paypal_txn: string;
  status: string; admin_note?: string; created_at: string;
  profiles?: { email: string; full_name: string; plan: string };
}
interface User {
  id: string; email: string; full_name: string; plan: string;
  created_at: string; trial_ends_at?: string; billing_plan?: string;
}
interface SupportConvo {
  id: string; user_id: string; message: string; created_at: string;
  profiles?: { email: string; full_name: string };
}

/* ── Icon ──────────────────────────────────────────────────────── */
function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "chart":    return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "users":    return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "card":     return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "support":  return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "x":        return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "send":     return <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "refresh":  return <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-8.5"/></svg>;
    case "trending": return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case "dollar":   return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case "agent":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "shield":   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default:         return null;
  }
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const PLAN_COLORS: Record<string, string> = {
  trial: "#fbbf24", basic: "#38bdf8", pro: "#a78bfa", expired: "#f87171", admin: "#34d399",
};

/* ── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic name={icon} size={16} color={`rgb(${color})`} />
        </div>
        <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.9rem", color: "var(--color-starlight)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

/* ── Main Admin ────────────────────────────────────────────────── */
type Tab = "stats" | "payments" | "users" | "support";

export default function AdminPage() {
  const [tab,         setTab]         = useState<Tab>("stats");
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [payments,    setPayments]    = useState<Payment[]>([]);
  const [payFilter,   setPayFilter]   = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [users,       setUsers]       = useState<User[]>([]);
  const [support,     setSupport]     = useState<SupportConvo[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [token,       setToken]       = useState("");
  const [error,       setError]       = useState("");
  const [deciding,    setDeciding]    = useState<string | null>(null);
  const [rejectNote,  setRejectNote]  = useState("");
  const [showReject,  setShowReject]  = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (tok: string) => {
    try {
      const [sRes, pRes, uRes, supRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`,   { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/admin/payments?status=${payFilter}`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/admin/users`,   { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/admin/support`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (sRes.ok)   { const d = await sRes.json();   setStats(d.stats); }
      if (pRes.ok)   { const d = await pRes.json();   setPayments(d.payments || []); }
      if (uRes.ok)   { const d = await uRes.json();   setUsers(d.users || []); }
      if (supRes.ok) { const d = await supRes.json(); setSupport(d.conversations || []); }
    } catch (e) { setError("Failed to load data."); }
    finally { setLoading(false); }
  }, [payFilter]);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  // Reload payments when filter changes
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/payments?status=${payFilter}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPayments(d.payments || [])).catch(() => {});
  }, [payFilter, token]);

  const decide = async (paymentId: string, approve: boolean, note?: string) => {
    setDeciding(paymentId);
    try {
      const res = await fetch(`${API}/api/admin/payments/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_id: paymentId, approve, note }),
      });
      if (res.ok) {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        if (!approve) setShowReject(null);
        // Refresh stats
        fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => setStats(d.stats)).catch(() => {});
      } else {
        const d = await res.json();
        setError(d.detail || "Failed.");
      }
    } catch { setError("Request failed."); }
    finally { setDeciding(null); setRejectNote(""); }
  };

  const sendReply = async (userId: string) => {
    if (!replyText.trim()) return;
    try {
      await fetch(`${API}/api/admin/support/${userId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText("");
      // Mark this convo as replied
      setSupport(prev => prev.filter(c => c.user_id !== userId));
    } catch { setError("Failed to send reply."); }
  };

  const setUserPlan = async (userId: string, plan: string) => {
    try {
      await fetch(`${API}/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
    } catch { setError("Failed to update plan."); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  const NAV: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "stats",    icon: "chart",   label: "Stats"    },
    { id: "payments", icon: "card",    label: "Payments", badge: payments.filter(p => p.status === "pending").length },
    { id: "users",    icon: "users",   label: "Users"    },
    { id: "support",  icon: "support", label: "Support",  badge: support.length },
  ];

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .row:hover{background:rgba(255,255,255,0.03)}
        .inp{background:rgba(255,255,255,0.04);border:1px solid var(--line-bright);border-radius:10px;padding:9px 12px;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.85rem;outline:none;resize:none}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
        select.inp option{background:#111827;color:#edf0f7}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: "radial-gradient(800px 400px at 80% -5%,rgba(124,58,237,0.07),transparent)" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.98rem", color: "var(--color-starlight)", flex: 1 }}>
              Admin Panel
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.67rem", fontWeight: 700, background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", fontFamily: "var(--font-mono)" }}>ADMIN</span>
              <button onClick={() => load(token)} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-sans)" }}>
                <Ic name="refresh" size={13} /> Refresh
              </button>
              <a href="/dashboard" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", textDecoration: "none", fontSize: "0.78rem", color: "var(--color-dust)" }}>
                ← Dashboard
              </a>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px 48px" }}>

          {error && (
            <div style={{ margin: "16px 0", padding: "10px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.82rem", color: "#f87171" }}>
              {error} <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 4, padding: "20px 0 0", borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
            {NAV.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "10px 10px 0 0", border: "none", background: tab === t.id ? "rgba(124,58,237,0.1)" : "transparent", color: tab === t.id ? "var(--color-nebula)" : "var(--color-dust)", fontSize: "0.84rem", fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", fontFamily: "var(--font-sans)", borderBottom: tab === t.id ? "2px solid var(--color-nebula)" : "2px solid transparent", transition: "all 0.15s" }}>
                <Ic name={t.icon} size={15} color={tab === t.id ? "var(--color-nebula)" : "var(--color-dust)"} />
                {t.label}
                {t.badge ? (
                  <span style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: "50%", background: "#7c3aed", fontSize: "0.6rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* ── STATS TAB ─────────────────────────────────────── */}
          {tab === "stats" && stats && (
            <div style={{ animation: "fadeIn 0.25s ease both" }}>
              {/* Main stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12, marginBottom: 24 }}>
                <StatCard label="Total users"    value={stats.total_users}      icon="users"    color="124,58,237" />
                <StatCard label="Active trials"  value={stats.active_trials}    icon="trending" color="251,191,36"  sub="Using free trial" />
                <StatCard label="Basic users"    value={stats.basic_users}      icon="card"     color="56,189,248"  sub="$29/mo" />
                <StatCard label="Pro users"      value={stats.pro_users}        icon="shield"   color="167,139,250" sub="$69/mo" />
                <StatCard label="Expired"        value={stats.expired_users}    icon="x"        color="248,113,113" sub="Trial ended" />
                <StatCard label="Pending payments" value={stats.pending_payments} icon="card"  color="251,191,36"  sub="Need review" />
                <StatCard label="Total revenue"  value={`$${(stats.total_revenue || 0).toFixed(0)}`} icon="dollar" color="52,211,153" sub="All time" />
                <StatCard label="Active agents"  value={stats.active_agents}   icon="agent"    color="124,58,237"  sub="Deployed" />
              </div>

              {/* Weekly stats */}
              {(stats.users_this_week !== undefined) && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
                  <p style={{ margin: "0 0 14px", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-dust)", textTransform: "uppercase", letterSpacing: "0.08em" }}>This week</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {[
                      { label: "New users",   value: stats.users_this_week  || 0, color: "#a78bfa" },
                      { label: "New agents",  value: stats.agents_this_week || 0, color: "#38bdf8" },
                      { label: "New leads",   value: stats.leads_this_week  || 0, color: "#34d399" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: s.color }}>{s.value}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: "var(--color-dust)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan distribution */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ margin: "0 0 14px", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-dust)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan distribution</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Trial",   value: stats.active_trials, total: stats.total_users, color: "#fbbf24" },
                    { label: "Basic",   value: stats.basic_users,   total: stats.total_users, color: "#38bdf8" },
                    { label: "Pro",     value: stats.pro_users,     total: stats.total_users, color: "#a78bfa" },
                    { label: "Expired", value: stats.expired_users, total: stats.total_users, color: "#f87171" },
                  ].map(p => {
                    const pct = stats.total_users > 0 ? Math.round((p.value / stats.total_users) * 100) : 0;
                    return (
                      <div key={p.label}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "0.82rem", color: p.color, fontWeight: 600 }}>{p.label}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--color-dust)" }}>{p.value} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: p.color, width: `${pct}%`, transition: "width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PAYMENTS TAB ──────────────────────────────────── */}
          {tab === "payments" && (
            <div style={{ animation: "fadeIn 0.25s ease both" }}>
              {/* Filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {(["pending", "approved", "rejected", "all"] as const).map(f => (
                  <button key={f} onClick={() => setPayFilter(f)} style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${payFilter === f ? "var(--color-nebula)" : "var(--line)"}`, background: payFilter === f ? "rgba(124,58,237,0.1)" : "transparent", color: payFilter === f ? "var(--color-nebula)" : "var(--color-dust)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
                    {f}
                  </button>
                ))}
              </div>

              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-dust)", fontSize: "0.9rem" }}>
                  No {payFilter === "all" ? "" : payFilter} payments.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {payments.map(pay => (
                    <div key={pay.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${pay.status === "pending" ? "rgba(251,191,36,0.2)" : pay.status === "approved" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 16, padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-starlight)", textTransform: "capitalize" }}>{pay.plan} plan</span>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                              background: pay.status === "approved" ? "rgba(52,211,153,0.1)" : pay.status === "rejected" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                              color: pay.status === "approved" ? "#34d399" : pay.status === "rejected" ? "#f87171" : "#fbbf24",
                              border: `1px solid ${pay.status === "approved" ? "rgba(52,211,153,0.3)" : pay.status === "rejected" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"}`,
                            }}>{pay.status}</span>
                          </div>
                          <p style={{ margin: "0 0 4px", fontSize: "0.82rem", color: "var(--color-starlight)" }}>
                            {pay.profiles?.email || pay.user_id}
                          </p>
                          <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: "var(--color-dust)" }}>
                            TXN: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-starlight)" }}>{pay.paypal_txn}</span>
                          </p>
                          <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--color-dust)" }}>
                            ${pay.amount} · {timeAgo(pay.created_at)}
                          </p>
                          {pay.admin_note && (
                            <p style={{ margin: "6px 0 0", fontSize: "0.76rem", color: "#fca5a5", fontStyle: "italic" }}>Note: {pay.admin_note}</p>
                          )}
                        </div>

                        {/* Actions for pending */}
                        {pay.status === "pending" && (
                          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                            <button onClick={() => decide(pay.id, true)}
                              disabled={deciding === pay.id}
                              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", opacity: deciding === pay.id ? 0.5 : 1 }}>
                              <Ic name="check" size={15} color="#34d399" />
                              {deciding === pay.id ? "…" : "Approve"}
                            </button>
                            <button onClick={() => setShowReject(pay.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              <Ic name="x" size={15} color="#f87171" /> Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reject note input */}
                      {showReject === pay.id && (
                        <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12 }}>
                          <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#f87171", fontWeight: 600 }}>Reason for rejection (shown to user):</p>
                          <textarea className="inp" rows={2} placeholder="e.g. Transaction ID not found, amount incorrect…" value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => decide(pay.id, false, rejectNote)} disabled={deciding === pay.id} style={{ flex: 1, padding: "8px", borderRadius: 9, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              {deciding === pay.id ? "Sending…" : "Confirm reject"}
                            </button>
                            <button onClick={() => { setShowReject(null); setRejectNote(""); }} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--line)", background: "transparent", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.84rem", fontFamily: "var(--font-sans)" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────── */}
          {tab === "users" && (
            <div style={{ animation: "fadeIn 0.25s ease both" }}>
              <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--color-dust)" }}>{users.length} users total</p>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px 100px", gap: 0, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.03)" }}>
                  {["Email", "Name", "Plan", "Joined", "Actions"].map(h => (
                    <p key={h} style={{ margin: 0, fontSize: "0.67rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</p>
                  ))}
                </div>
                {users.map((u, i) => (
                  <div key={u.id} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px 100px", gap: 0, padding: "12px 16px", borderBottom: i < users.length - 1 ? "1px solid var(--line)" : "none", transition: "background 0.15s", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-starlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{u.email}</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{u.full_name || "—"}</p>
                    <div>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, background: `rgba(${PLAN_COLORS[u.plan]?.replace("#","") || "255,255,255"},0.1)`, color: PLAN_COLORS[u.plan] || "var(--color-dust)", border: `1px solid ${PLAN_COLORS[u.plan] || "var(--line)"}33`, textTransform: "capitalize" }}>
                        {u.plan}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--color-dust)" }}>{new Date(u.created_at).toLocaleDateString()}</p>
                    <select className="inp" value={u.plan} onChange={e => setUserPlan(u.id, e.target.value)} style={{ padding: "4px 8px", fontSize: "0.76rem", borderRadius: 7 }}>
                      {["trial","basic","pro","expired","admin"].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUPPORT TAB ───────────────────────────────────── */}
          {tab === "support" && (
            <div style={{ animation: "fadeIn 0.25s ease both", display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, minHeight: 500 }}>
              {/* Conversation list */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.03)" }}>
                  <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)" }}>Open conversations ({support.length})</p>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 500 }}>
                  {support.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--color-dust)", fontSize: "0.82rem" }}>No open conversations.</div>
                  ) : support.map(c => (
                    <div key={c.id} onClick={() => setActiveConvo(c.user_id)} style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer", background: activeConvo === c.user_id ? "rgba(124,58,237,0.08)" : "transparent", transition: "background 0.15s" }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.84rem", fontWeight: 600, color: "var(--color-starlight)" }}>{c.profiles?.email || c.user_id}</p>
                      <p style={{ margin: "0 0 3px", fontSize: "0.76rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.message}</p>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)", opacity: 0.6 }}>{timeAgo(c.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply panel */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {!activeConvo ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-dust)", fontSize: "0.88rem" }}>
                    Select a conversation to reply
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.03)" }}>
                      <p style={{ margin: 0, fontSize: "0.86rem", fontWeight: 600, color: "var(--color-starlight)" }}>
                        {support.find(c => c.user_id === activeConvo)?.profiles?.email || activeConvo}
                      </p>
                    </div>
                    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
                      <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", fontSize: "0.86rem", color: "var(--color-starlight)", lineHeight: 1.5, maxWidth: "80%" }}>
                        {support.find(c => c.user_id === activeConvo)?.message}
                      </div>
                      <div ref={bottomRef} />
                    </div>
                    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
                      <textarea className="inp" rows={2} placeholder="Type your reply…" value={replyText} onChange={e => setReplyText(e.target.value)} style={{ flex: 1 }} />
                      <button onClick={() => sendReply(activeConvo)} disabled={!replyText.trim()} style={{ width: 42, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: !replyText.trim() ? 0.4 : 1, flexShrink: 0 }}>
                        <Ic name="send" size={16} color="#fff" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}