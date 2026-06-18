"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Stats {
  total_users: number; trial_users: number; paid_users: number;
  pending_payments: number; approved_payments: number;
  total_revenue: number; active_agents: number;
}
interface Payment {
  id: string; user_id: string; plan: string; amount: number;
  paypal_txn: string; status: string; created_at: string;
  admin_note?: string; screenshot_b64?: string; screenshot_mime?: string;
  user_email?: string;
}
interface User {
  id: string; email: string; full_name: string; plan: string;
  created_at: string; trial_ends_at?: string; billing_end?: string;
}

function Ic({ n }: { n: string }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (n) {
    case "check": return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "x":     return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "img":   return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case "user":  return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "card":  return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "chart": return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    default:      return null;
  }
}

function planBadge(plan: string) {
  const c: Record<string, string> = { trial: "#fbbf24", basic: "#38bdf8", pro: "#a78bfa", expired: "#f87171", admin: "#34d399" };
  const color = c[plan] ?? "#6b7280";
  return <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: `${color}18`, color, border: `1px solid ${color}30` }}>{plan}</span>;
}

export default function AdminPage() {
  const [token,    setToken]    = useState("");
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users,    setUsers]    = useState<User[]>([]);
  const [tab,      setTab]      = useState<"payments" | "users" | "stats">("payments");
  const [filter,   setFilter]   = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading,  setLoading]  = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, string | null>>({});
  const [error,    setError]    = useState("");

  const load = useCallback(async (tok: string) => {
    try {
      const [sRes, pRes, uRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/admin/payments?status=${filter}`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (!sRes.ok) { setError("Access denied — admin only."); setLoading(false); return; }
      setStats((await sRes.json()).stats);
      if (pRes.ok) setPayments((await pRes.json()).payments || []);
      if (uRes.ok) setUsers((await uRes.json()).users || []);
    } catch { setError("Failed to load admin data."); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  const loadPayments = useCallback(async (tok: string, f: string) => {
    const res = await fetch(`${API}/api/admin/payments?status=${f}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (res.ok) setPayments((await res.json()).payments || []);
  }, []);

  useEffect(() => {
    if (token) loadPayments(token, filter);
  }, [filter, token, loadPayments]);

  const decide = async (id: string, approve: boolean) => {
    setDeciding(id);
    try {
      const res = await fetch(`${API}/api/admin/payments/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_id: id, approve, note: rejectNote[id] || undefined }),
      });
      if (res.ok) {
        setPayments(prev => prev.filter(p => p.id !== id));
        setExpanded(null);
      }
    } catch { /* ignore */ }
    finally { setDeciding(null); }
  };

  const loadScreenshot = async (paymentId: string) => {
    if (screenshots[paymentId] !== undefined) return;
    setScreenshots(prev => ({ ...prev, [paymentId]: null }));
    try {
      const res = await fetch(`${API}/api/admin/payments/${paymentId}/screenshot`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.screenshot_b64) {
          setScreenshots(prev => ({ ...prev, [paymentId]: `data:${d.screenshot_mime || "image/png"};base64,${d.screenshot_b64}` }));
        }
      }
    } catch { /* ignore */ }
  };

  const toggleExpand = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadScreenshot(id);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#f87171", fontSize: "1rem" }}>{error}</p>
        <a href="/dashboard" style={{ color: "var(--color-stellar)", textDecoration: "none", marginTop: 8, display: "block" }}>← Dashboard</a>
      </div>
    </div>
  );

  const pendingCount = payments.filter(p => p.status === "pending").length;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .row:hover{background:rgba(255,255,255,0.025)!important}
        .tab-btn{padding:7px 16px;border-radius:9px;border:none;cursor:pointer;font-size:0.8rem;font-family:var(--font-sans);transition:all 0.15s}
        .inp{width:100%;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:9px;color:var(--color-starlight);font-size:0.82rem;font-family:var(--font-mono);outline:none}
      `}</style>
      <div style={{ minHeight: "100vh", background: "var(--color-void)" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-starlight)", flex: 1 }}>Admin Panel</h1>
            {pendingCount > 0 && (
              <span style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", fontSize: "0.72rem", color: "#fbbf24", fontWeight: 700 }}>
                {pendingCount} pending
              </span>
            )}
            <a href="/dashboard" style={{ fontSize: "0.78rem", color: "var(--color-dust)", textDecoration: "none" }}>← Dashboard</a>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

          {/* Stats row */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 28, animation: "fadeIn 0.25s ease both" }}>
              {[
                { label: "Total users", value: stats.total_users, color: "124,58,237" },
                { label: "Paid users", value: stats.paid_users, color: "56,189,248" },
                { label: "Pending", value: stats.pending_payments, color: "251,191,36" },
                { label: "Revenue", value: `$${stats.total_revenue}`, color: "52,211,153" },
                { label: "Agents", value: stats.active_agents, color: "167,139,250" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: "1.3rem", fontFamily: "var(--font-display)", fontWeight: 700, color: `rgb(${s.color})` }}>{s.value}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-dust)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["payments", "users", "stats"] as const).map(t => (
              <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{ background: tab === t ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)", color: tab === t ? "var(--color-nebula)" : "var(--color-dust)", border: `1px solid ${tab === t ? "rgba(124,58,237,0.3)" : "var(--line)"}` }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "payments" && pendingCount > 0 && <span style={{ marginLeft: 6, background: "#fbbf24", color: "#000", borderRadius: 100, padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700 }}>{pendingCount}</span>}
              </button>
            ))}
          </div>

          {/* Payments tab */}
          {tab === "payments" && (
            <div style={{ animation: "fadeIn 0.2s ease both" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["pending", "approved", "rejected", "all"] as const).map(f => (
                  <button key={f} className="tab-btn" onClick={() => setFilter(f)} style={{ background: filter === f ? "rgba(255,255,255,0.07)" : "transparent", color: filter === f ? "var(--color-starlight)" : "var(--color-dust)", border: `1px solid ${filter === f ? "var(--line-bright)" : "var(--line)"}` }}>
                    {f}
                  </button>
                ))}
              </div>

              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-dust)", fontSize: "0.85rem" }}>No {filter} payments</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {payments.map(p => (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${expanded === p.id ? "rgba(124,58,237,0.3)" : "var(--line)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>

                      {/* Row */}
                      <div className="row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", transition: "background 0.15s" }} onClick={() => toggleExpand(p.id)}>
                        <div>
                          <div style={{ fontSize: "0.82rem", color: "var(--color-starlight)", fontWeight: 600 }}>{p.user_email || p.user_id.slice(0, 8) + "…"}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--color-dust)", marginTop: 2, fontFamily: "var(--font-mono)" }}>TXN: {p.paypal_txn}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {planBadge(p.plan)}
                          <div style={{ fontSize: "0.7rem", color: "#34d399", fontFamily: "var(--font-mono)", marginTop: 3 }}>${p.amount}</div>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: expanded === p.id ? "var(--color-nebula)" : "var(--color-dust)" }}>
                          {expanded === p.id ? "▲" : "▼"}
                        </div>
                      </div>

                      {/* Expanded */}
                      {expanded === p.id && (
                        <div style={{ borderTop: "1px solid var(--line)", padding: "16px 18px", background: "rgba(0,0,0,0.15)" }}>
                          {/* Screenshot */}
                          {screenshots[p.id] === undefined ? (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-dust)" }}>Loading screenshot…</div>
                          ) : screenshots[p.id] ? (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: "0.7rem", color: "var(--color-dust)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>PAYMENT SCREENSHOT</div>
                              <img src={screenshots[p.id]!} alt="Payment proof" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 10, border: "1px solid var(--line)", objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />
                            </div>
                          ) : (
                            <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 10, fontSize: "0.75rem", color: "#f87171" }}>
                              ⚠ No screenshot uploaded
                            </div>
                          )}

                          {/* Details */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: "0.75rem", color: "var(--color-dust)" }}>
                            <div>User ID: <span style={{ color: "var(--color-starlight)", fontFamily: "var(--font-mono)" }}>{p.user_id.slice(0, 16)}…</span></div>
                            <div>Plan: <span style={{ color: "var(--color-starlight)" }}>{p.plan} — ${p.amount}</span></div>
                            <div>TXN: <span style={{ color: "var(--color-stellar)", fontFamily: "var(--font-mono)" }}>{p.paypal_txn}</span></div>
                            <div>Date: <span style={{ color: "var(--color-starlight)" }}>{new Date(p.created_at).toLocaleString()}</span></div>
                          </div>

                          {p.status === "pending" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <textarea className="inp" rows={2} placeholder="Rejection reason (optional)…" value={rejectNote[p.id] || ""} onChange={e => setRejectNote(prev => ({ ...prev, [p.id]: e.target.value }))} style={{ resize: "none" }} />
                              <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => decide(p.id, false)} disabled={deciding === p.id} style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                  <Ic n="x" /> Reject
                                </button>
                                <button onClick={() => decide(p.id, true)} disabled={deciding === p.id} style={{ flex: 2, padding: "9px 0", borderRadius: 10, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                  <Ic n="check" /> {deciding === p.id ? "Processing…" : "Approve — Activate 30 days"}
                                </button>
                              </div>
                            </div>
                          )}

                          {p.status !== "pending" && (
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: p.status === "approved" ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${p.status === "approved" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, fontSize: "0.78rem", color: p.status === "approved" ? "#34d399" : "#f87171" }}>
                              {p.status === "approved" ? "✓ Approved" : "✗ Rejected"}{p.admin_note && ` — ${p.admin_note}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users tab */}
          {tab === "users" && (
            <div style={{ animation: "fadeIn 0.2s ease both" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
                {users.map((u, i) => (
                  <div key={u.id} className="row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: i > 0 ? "1px solid var(--line)" : "none", transition: "background 0.15s" }}>
                    <div>
                      <div style={{ fontSize: "0.82rem", color: "var(--color-starlight)" }}>{u.email}</div>
                      {u.full_name && <div style={{ fontSize: "0.7rem", color: "var(--color-dust)" }}>{u.full_name}</div>}
                    </div>
                    <div>{planBadge(u.plan)}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                      {u.billing_end && <div style={{ color: u.plan !== "expired" ? "#fbbf24" : "#f87171" }}>expires {new Date(u.billing_end).toLocaleDateString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats tab */}
          {tab === "stats" && stats && (
            <div style={{ animation: "fadeIn 0.2s ease both", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-starlight)" }}>{typeof v === "number" && k.includes("revenue") ? `$${v}` : v}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-dust)", marginTop: 4 }}>{k.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}