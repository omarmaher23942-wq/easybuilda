"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/auth";

const API     = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const WS_BASE = API.replace("https://", "wss://").replace("http://", "ws://");

/* ── Types ─────────────────────────────────────────────────────── */
interface Stats {
  total_users:number; trial_users:number; paid_users:number;
  basic_users:number; pro_users:number; expired_users:number;
  pending_topups:number; total_revenue:number; active_agents:number;
}
interface Topup {
  id:string; user_id:string; amount:number; payment_method:string;
  paypal_txn:string; status:string; admin_note?:string; created_at:string;
  screenshot_b64?:string; screenshot_mime?:string; note?:string;
  profiles?:{ email:string; full_name:string; plan:string };
}
interface User {
  id:string; email:string; full_name:string; plan:string;
  created_at:string; trial_ends_at?:string; billing_end?:string;
}
interface SupportConvo {
  id:string; user_id:string; message:string; created_at:string; online?:boolean;
  profiles?:{ email:string; full_name:string; plan:string };
}
interface SupportMsg { id:string; from_admin:boolean; message:string; created_at:string; }

/* ── Icons ──────────────────────────────────────────────────────── */
function Ic({ name, size=18, color }: { name:string; size?:number; color?:string }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:color||"currentColor", strokeWidth:1.65, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch (name) {
    case "chart":   return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "users":   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "wallet":  return <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
    case "support": return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "x":       return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "send":    return <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "refresh": return <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-8.5"/></svg>;
    case "bank":    return <svg {...p}><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2L2 7h20L12 2z"/></svg>;
    case "back":    return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "dot":     return <svg width={size} height={size} viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={color||"currentColor"}/></svg>;
    default:        return null;
  }
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const PLAN_COLORS: Record<string,string> = {
  trial:"#fbbf24", basic:"#38bdf8", pro:"#a78bfa", expired:"#f87171", admin:"#34d399",
};
function PlanBadge({ plan }: { plan:string }) {
  const c = PLAN_COLORS[plan] ?? "#6b7280";
  return <span style={{ padding:"2px 8px", borderRadius:100, fontSize:"0.65rem", fontWeight:700, background:`${c}18`, color:c, border:`1px solid ${c}30` }}>{plan}</span>;
}

function StatCard({ label, value, icon, color, sub }: { label:string; value:string|number; icon:string; color:string; sub?:string }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:14, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:`rgba(${color},0.1)`, border:`1px solid rgba(${color},0.2)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic name={icon} size={16} color={`rgb(${color})`}/>
        </div>
        <p style={{ margin:0, fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
      </div>
      <p style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.8rem", color:"var(--color-starlight)", lineHeight:1 }}>{value}</p>
      {sub && <p style={{ margin:"4px 0 0", fontSize:"0.7rem", color:"var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

type Tab = "stats"|"topups"|"users"|"support";

export default function AdminPage() {
  const [tab,         setTab]         = useState<Tab>("topups");
  const [stats,       setStats]       = useState<Stats|null>(null);
  const [topups,      setTopups]      = useState<Topup[]>([]);
  const [topupFilter, setTopupFilter] = useState<"pending"|"approved"|"rejected"|"all">("pending");
  const [users,       setUsers]       = useState<User[]>([]);
  const [convos,      setConvos]      = useState<SupportConvo[]>([]);
  const [activeUser,  setActiveUser]  = useState<string|null>(null);
  const [msgs,        setMsgs]        = useState<SupportMsg[]>([]);
  const [replyText,   setReplyText]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [token,       setToken]       = useState("");
  const [error,       setError]       = useState("");
  const [deciding,    setDeciding]    = useState<string|null>(null);
  const [rejectNote,  setRejectNote]  = useState<Record<string,string>>({});
  const [showReject,  setShowReject]  = useState<string|null>(null);
  const [screenshots, setScreenshots] = useState<Record<string,string|null>>({});
  const [expanded,    setExpanded]    = useState<string|null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef     = useRef<WebSocket|null>(null);
  const textRef   = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (tok: string) => {
    try {
      const [sRes, tRes, uRes, cRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`,                        { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/admin/wallet/topups?status=${topupFilter}`, { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/admin/users`,                        { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/support/admin/conversations`,        { headers:{ Authorization:`Bearer ${tok}` } }),
      ]);
      if (!sRes.ok) { setError("Access denied — admin only."); setLoading(false); return; }
      setStats((await sRes.json()).stats);
      if (tRes.ok) setTopups ((await tRes.json()).topups||[]);
      if (uRes.ok) setUsers  ((await uRes.json()).users||[]);
      if (cRes.ok) setConvos ((await cRes.json()).conversations||[]);
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  }, [topupFilter]);

  // WebSocket for real-time support chat
  const connectWS = useCallback((tok: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE}/api/support/ws/admin?token=${tok}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "online_users") {
          setOnlineUsers(new Set(data.online_users));
        } else if (data.type === "user_online") {
          setOnlineUsers(prev => new Set([...prev, data.user_id]));
        } else if (data.type === "user_offline") {
          setOnlineUsers(prev => { const s = new Set(prev); s.delete(data.user_id); return s; });
        } else if (data.type === "new_message") {
          const msg: SupportMsg = { id: Date.now().toString(), from_admin: data.from_admin, message: data.message, created_at: data.created_at || new Date().toISOString() };
          setMsgs(prev => [...prev, msg]);
          // Update conversation list
          if (!data.echo) {
            setConvos(prev => {
              const existing = prev.find(c => c.user_id === data.user_id);
              if (existing) {
                return [{ ...existing, message:data.message, created_at:msg.created_at }, ...prev.filter(c => c.user_id !== data.user_id)];
              }
              return [{ id:data.user_id, user_id:data.user_id, message:data.message, created_at:msg.created_at, profiles:data.profile }, ...prev];
            });
          }
        }
      } catch {}
    };

    ws.onclose = () => { wsRef.current = null; setTimeout(() => connectWS(tok), 3000); };
    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
      connectWS(data.session.access_token);
    });
    return () => wsRef.current?.close();
  }, [load, connectWS]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/wallet/topups?status=${topupFilter}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => setTopups(d.topups||[])).catch(()=>{});
  }, [topupFilter, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const loadUserMsgs = async (userId: string) => {
    setActiveUser(userId); setMsgs([]);
    try {
      const res = await fetch(`${API}/api/support/admin/messages/${userId}`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMsgs(d.messages||[]); }
    } catch {}
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeUser) return;
    const msg = replyText.trim();
    setReplyText("");
    if (textRef.current) textRef.current.style.height = "42px";
    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ user_id: activeUser, message: msg }));
    } else {
      // REST fallback
      await fetch(`${API}/api/support/admin/reply/${activeUser}`, {
        method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({ message: msg }),
      });
    }
  };

  const decide = async (topupId: string, approve: boolean) => {
    setDeciding(topupId);
    try {
      const res = await fetch(`${API}/api/admin/wallet/topups/${topupId}/decide`, {
        method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({ approve, note: rejectNote[topupId]||undefined }),
      });
      if (res.ok) { setTopups(prev => prev.filter(t => t.id !== topupId)); setShowReject(null); setExpanded(null); }
      else { const d = await res.json(); setError(d.detail||"Failed."); }
    } catch { setError("Request failed."); }
    finally { setDeciding(null); }
  };

  const loadScreenshot = async (id: string) => {
    if (screenshots[id] !== undefined) return;
    setScreenshots(prev => ({...prev, [id]: null}));
    try {
      const res = await fetch(`${API}/api/admin/wallet/topups/${id}/screenshot`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setScreenshots(prev => ({...prev, [id]: d.screenshot_b64?`data:${d.screenshot_mime||"image/png"};base64,${d.screenshot_b64}`:""})); }
    } catch { setScreenshots(prev => ({...prev, [id]:""})); }
  };

  const setUserPlan = async (userId: string, plan: string) => {
    try {
      await fetch(`${API}/api/admin/users/${userId}/plan`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({ plan }) });
      setUsers(prev => prev.map(u => u.id===userId?{...u,plan}:u));
    } catch { setError("Failed to update plan."); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"var(--color-nebula)", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  if (error.includes("denied")) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--color-void)", gap:12 }}>
      <p style={{ color:"#f87171" }}>Access denied — admin only.</p>
      <a href="/dashboard" style={{ color:"var(--color-stellar)", textDecoration:"none", fontSize:"0.88rem" }}>← Dashboard</a>
    </div>
  );

  const NAV: { id: Tab; icon:string; label:string; badge?:number }[] = [
    { id:"stats",   icon:"chart",   label:"Stats"   },
    { id:"topups",  icon:"wallet",  label:"Top-ups", badge:stats?.pending_topups },
    { id:"users",   icon:"users",   label:"Users"   },
    { id:"support", icon:"support", label:"Support", badge:convos.filter(c => !onlineUsers.has(c.user_id)===false && c.user_id!==activeUser).length||undefined },
  ];

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .rh:hover{background:rgba(255,255,255,0.03)!important}
        .inp{background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:10px;padding:9px 12px;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.85rem;outline:none;resize:none;width:100%}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
        select.inp option{background:#111827}
        @media(max-width:700px){.sup-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--color-void)" }}>

        {/* Header */}
        <header style={{ borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.9)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:30 }}>
          <div style={{ maxWidth:1300, margin:"0 auto", padding:"12px 22px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399" }}/>
            <h1 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.96rem", color:"var(--color-starlight)", flex:1 }}>EasyBuilda Admin</h1>
            {(stats?.pending_topups??0) > 0 && (
              <span style={{ padding:"3px 10px", borderRadius:100, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.3)", fontSize:"0.72rem", color:"#fbbf24", fontWeight:700 }}>
                {stats?.pending_topups} pending
              </span>
            )}
            <button onClick={() => load(token)} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:8, padding:"6px 11px", cursor:"pointer", fontSize:"0.76rem", color:"var(--color-dust)", fontFamily:"var(--font-sans)" }}>
              <Ic name="refresh" size={13}/> Refresh
            </button>
            <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:8, padding:"6px 11px", textDecoration:"none", fontSize:"0.76rem", color:"var(--color-dust)" }}>
              <Ic name="back" size={13}/> Dashboard
            </a>
          </div>
        </header>

        <div style={{ maxWidth:1300, margin:"0 auto", padding:"0 22px 48px" }}>
          {error && !error.includes("denied") && (
            <div style={{ margin:"14px 0", padding:"10px 14px", borderRadius:10, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", fontSize:"0.82rem", color:"#f87171", display:"flex", justifyContent:"space-between" }}>
              {error}<button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer" }}>✕</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, padding:"18px 0 0", borderBottom:"1px solid var(--line)", marginBottom:22 }}>
            {NAV.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ position:"relative", display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:"10px 10px 0 0", border:"none", background:tab===t.id?"rgba(124,58,237,0.1)":"transparent", color:tab===t.id?"var(--color-nebula)":"var(--color-dust)", fontSize:"0.84rem", fontWeight:tab===t.id?600:400, cursor:"pointer", fontFamily:"var(--font-sans)", borderBottom:tab===t.id?"2px solid var(--color-nebula)":"2px solid transparent", transition:"all 0.15s" }}>
                <Ic name={t.icon} size={15} color={tab===t.id?"var(--color-nebula)":"var(--color-dust)"}/>
                {t.label}
                {!!t.badge && t.badge>0 && <span style={{ minWidth:16, height:16, borderRadius:"50%", background:"#7c3aed", fontSize:"0.6rem", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* ── STATS ── */}
          {tab === "stats" && stats && (
            <div style={{ animation:"fadeIn 0.25s ease both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
                <StatCard label="Total users"     value={stats.total_users}      icon="users"   color="124,58,237"/>
                <StatCard label="Trial"           value={stats.trial_users}      icon="chart"   color="251,191,36"/>
                <StatCard label="Paid"            value={stats.paid_users}       icon="wallet"  color="56,189,248" sub="Basic + Pro"/>
                <StatCard label="Expired"         value={stats.expired_users}    icon="x"       color="248,113,113"/>
                <StatCard label="Pending top-ups" value={stats.pending_topups}   icon="bank"    color="251,191,36"/>
                <StatCard label="Revenue"         value={`$${(stats.total_revenue??0).toFixed(0)}`} icon="wallet" color="52,211,153"/>
                <StatCard label="Active agents"   value={stats.active_agents}    icon="support" color="167,139,250"/>
              </div>
            </div>
          )}

          {/* ── TOP-UPS ── */}
          {tab === "topups" && (
            <div style={{ animation:"fadeIn 0.25s ease both" }}>
              <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                {(["pending","approved","rejected","all"] as const).map(f => (
                  <button key={f} onClick={() => setTopupFilter(f)} style={{ padding:"6px 14px", borderRadius:999, border:`1px solid ${topupFilter===f?"var(--color-nebula)":"var(--line)"}`, background:topupFilter===f?"rgba(124,58,237,0.1)":"transparent", color:topupFilter===f?"var(--color-nebula)":"var(--color-dust)", fontSize:"0.8rem", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
                    {f}
                  </button>
                ))}
              </div>
              {topups.length === 0
                ? <div style={{ textAlign:"center", padding:48, color:"var(--color-dust)", fontSize:"0.9rem" }}>No {topupFilter} top-ups.</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {topups.map(topup => (
                    <div key={topup.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${expanded===topup.id?"rgba(124,58,237,0.3)":"var(--line)"}`, borderRadius:14, overflow:"hidden" }}>
                      <div className="rh" onClick={() => { if(expanded===topup.id){setExpanded(null);}else{setExpanded(topup.id);loadScreenshot(topup.id);} }} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", alignItems:"center", gap:12, padding:"13px 16px", cursor:"pointer" }}>
                        <div>
                          <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>{topup.profiles?.email||topup.user_id.slice(0,10)+"…"}</div>
                          <div style={{ fontSize:"0.7rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", marginTop:2 }}>
                            {topup.payment_method==="bank"?"🏦 Bank":"💳 PayPal"} · {topup.paypal_txn}
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"#34d399" }}>${topup.amount}</div>
                          {topup.profiles?.plan && <PlanBadge plan={topup.profiles.plan}/>}
                        </div>
                        <div style={{ fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" }}>{timeAgo(topup.created_at)}</div>
                        <div style={{ color:expanded===topup.id?"var(--color-nebula)":"var(--color-dust)", fontSize:"0.8rem" }}>{expanded===topup.id?"▲":"▼"}</div>
                      </div>
                      {expanded===topup.id && (
                        <div style={{ borderTop:"1px solid var(--line)", padding:"16px", background:"rgba(0,0,0,0.2)" }}>
                          <div style={{ marginBottom:14 }}>
                            <div style={{ fontSize:"0.66rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", marginBottom:8 }}>PAYMENT RECEIPT</div>
                            {screenshots[topup.id]===undefined
                              ? <div style={{ fontSize:"0.76rem", color:"var(--color-dust)" }}>Loading…</div>
                              : screenshots[topup.id]
                                ? <img src={screenshots[topup.id]!} alt="Receipt" style={{ maxWidth:"100%", maxHeight:280, borderRadius:10, border:"1px solid var(--line)", objectFit:"contain", background:"rgba(0,0,0,0.3)", display:"block" }}/>
                                : <div style={{ padding:"10px 13px", background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.18)", borderRadius:10, fontSize:"0.76rem", color:"#f87171" }}>⚠ No screenshot</div>
                            }
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12, fontSize:"0.76rem", color:"var(--color-dust)" }}>
                            <div>User: <span style={{ color:"var(--color-starlight)" }}>{topup.profiles?.email||"—"}</span></div>
                            <div>Amount: <span style={{ color:"#34d399", fontWeight:700 }}>${topup.amount} USD</span></div>
                            <div>Method: <span style={{ color:"var(--color-starlight)" }}>{topup.payment_method==="bank"?"Bank Transfer":"PayPal"}</span></div>
                            <div>Ref: <span style={{ color:"var(--color-stellar)", fontFamily:"var(--font-mono)" }}>{topup.paypal_txn}</span></div>
                            {topup.note && <div style={{ gridColumn:"1/-1" }}>Note: <span style={{ color:"var(--color-starlight)" }}>{topup.note}</span></div>}
                          </div>
                          {topup.status==="pending" && (
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                              {showReject===topup.id && (
                                <textarea className="inp" rows={2} placeholder="Reason for rejection…" value={rejectNote[topup.id]||""} onChange={e=>setRejectNote(p=>({...p,[topup.id]:e.target.value}))}/>
                              )}
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={()=>setShowReject(showReject===topup.id?null:topup.id)} style={{ flex:1, padding:"8px", borderRadius:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", cursor:"pointer", fontWeight:600, fontSize:"0.82rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                                  <Ic name="x" size={13} color="#f87171"/> {showReject===topup.id?"Confirm":"Reject"}
                                </button>
                                {showReject===topup.id && (
                                  <button onClick={()=>decide(topup.id,false)} disabled={deciding===topup.id} style={{ flex:1, padding:"8px", borderRadius:10, background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>
                                    {deciding===topup.id?"…":"Send rejection"}
                                  </button>
                                )}
                                <button onClick={()=>decide(topup.id,true)} disabled={deciding===topup.id} style={{ flex:2, padding:"8px", borderRadius:10, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontWeight:700, fontSize:"0.82rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                                  <Ic name="check" size={13} color="#34d399"/>
                                  {deciding===topup.id?"Processing…":`✓ Approve +$${topup.amount}`}
                                </button>
                              </div>
                            </div>
                          )}
                          {topup.status!=="pending" && (
                            <div style={{ padding:"9px 13px", borderRadius:10, background:topup.status==="approved"?"rgba(52,211,153,0.06)":"rgba(248,113,113,0.06)", border:`1px solid ${topup.status==="approved"?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`, fontSize:"0.8rem", color:topup.status==="approved"?"#34d399":"#f87171" }}>
                              {topup.status==="approved"?"✓ Approved":"✗ Rejected"}{topup.admin_note&&` — ${topup.admin_note}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div style={{ animation:"fadeIn 0.25s ease both" }}>
              <p style={{ margin:"0 0 14px", fontSize:"0.82rem", color:"var(--color-dust)" }}>{users.length} users</p>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:16, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px 120px 110px", padding:"9px 14px", borderBottom:"1px solid var(--line)", background:"rgba(255,255,255,0.03)" }}>
                  {["Email","Name","Plan","Billing end","Change plan"].map(h => (
                    <p key={h} style={{ margin:0, fontSize:"0.65rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</p>
                  ))}
                </div>
                {users.map((u,i) => (
                  <div key={u.id} className="rh" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px 120px 110px", padding:"11px 14px", borderBottom:i<users.length-1?"1px solid var(--line)":"none", alignItems:"center" }}>
                    <p style={{ margin:0, fontSize:"0.82rem", color:"var(--color-starlight)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{u.email}</p>
                    <p style={{ margin:0, fontSize:"0.82rem", color:"var(--color-dust)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{u.full_name||"—"}</p>
                    <div><PlanBadge plan={u.plan}/></div>
                    <p style={{ margin:0, fontSize:"0.74rem", color:u.billing_end&&new Date(u.billing_end)<new Date()?"#f87171":"var(--color-dust)" }}>
                      {u.billing_end?new Date(u.billing_end).toLocaleDateString():"—"}
                    </p>
                    <select className="inp" value={u.plan} onChange={e=>setUserPlan(u.id,e.target.value)} style={{ padding:"5px 7px", fontSize:"0.76rem", borderRadius:7, width:"auto" }}>
                      {["trial","basic","pro","expired","admin"].map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUPPORT — real-time WebSocket chat ── */}
          {tab === "support" && (
            <div className="sup-grid" style={{ animation:"fadeIn 0.25s ease both", display:"grid", gridTemplateColumns:"270px 1fr", gap:14, minHeight:540 }}>
              {/* Conversation list */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <div style={{ padding:"11px 13px", borderBottom:"1px solid var(--line)", background:"rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:"var(--color-starlight)" }}>Conversations</p>
                  <span style={{ fontSize:"0.66rem", color:"#34d399", fontFamily:"var(--font-mono)" }}>{onlineUsers.size} online</span>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {convos.length === 0
                    ? <div style={{ padding:32, textAlign:"center", color:"var(--color-dust)", fontSize:"0.82rem" }}>No conversations yet.</div>
                    : convos.map(c => {
                        const isOnline = onlineUsers.has(c.user_id);
                        return (
                          <div key={c.id} onClick={() => loadUserMsgs(c.user_id)} className="rh" style={{ padding:"11px 13px", borderBottom:"1px solid var(--line)", cursor:"pointer", background:activeUser===c.user_id?"rgba(124,58,237,0.08)":"transparent", transition:"background 0.15s" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <Ic name="dot" size={7} color={isOnline?"#34d399":"rgba(255,255,255,0.15)"}/>
                              <p style={{ margin:0, fontSize:"0.83rem", fontWeight:600, color:"var(--color-starlight)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.profiles?.email||c.user_id.slice(0,14)+"…"}</p>
                              {c.profiles?.plan && <PlanBadge plan={c.profiles.plan}/>}
                            </div>
                            <p style={{ margin:0, fontSize:"0.74rem", color:"var(--color-dust)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.message}</p>
                            <p style={{ margin:"3px 0 0", fontSize:"0.66rem", color:"var(--color-dust)", opacity:0.5 }}>{timeAgo(c.created_at)}</p>
                          </div>
                        );
                      })
                  }
                </div>
              </div>

              {/* Chat panel */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                {!activeUser ? (
                  <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, color:"var(--color-dust)" }}>
                    <Ic name="support" size={40} color="rgba(255,255,255,0.08)"/>
                    <p style={{ margin:0, fontSize:"0.88rem" }}>Select a conversation to reply</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div style={{ padding:"11px 15px", borderBottom:"1px solid var(--line)", background:"rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div>
                        <p style={{ margin:"0 0 2px", fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>
                          {convos.find(c=>c.user_id===activeUser)?.profiles?.email || activeUser}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {convos.find(c=>c.user_id===activeUser)?.profiles?.plan && <PlanBadge plan={convos.find(c=>c.user_id===activeUser)!.profiles!.plan}/>}
                          <span style={{ fontSize:"0.66rem", color:onlineUsers.has(activeUser)?"#34d399":"var(--color-dust)" }}>
                            {onlineUsers.has(activeUser)?"● online":"● offline"}
                          </span>
                        </div>
                      </div>
                      <button onClick={()=>{setActiveUser(null);setMsgs([]);}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-dust)", fontSize:18 }}>×</button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex:1, padding:"14px", overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>
                      {msgs.map(m => (
                        <div key={m.id} style={{ display:"flex", justifyContent:m.from_admin?"flex-end":"flex-start" }}>
                          <div style={{ maxWidth:"78%", padding:"9px 13px", borderRadius:m.from_admin?"14px 4px 14px 14px":"4px 14px 14px 14px", background:m.from_admin?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.06)", border:`1px solid ${m.from_admin?"rgba(124,58,237,0.3)":"var(--line)"}`, fontSize:"0.83rem", color:"var(--color-starlight)", lineHeight:1.55 }}>
                            {m.message}
                            <div style={{ fontSize:"0.62rem", color:"var(--color-dust)", marginTop:3 }}>{timeAgo(m.created_at)}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef}/>
                    </div>

                    {/* Input */}
                    <div style={{ padding:"11px 13px", borderTop:"1px solid var(--line)", display:"flex", gap:8, alignItems:"flex-end" }}>
                      <textarea ref={textRef} className="inp" rows={2} placeholder="Type reply… (Enter to send)" value={replyText}
                        onChange={e=>{setReplyText(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
                        onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendReply())} style={{ flex:1, resize:"none" }}/>
                      <button onClick={sendReply} disabled={!replyText.trim()} style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:!replyText.trim()?0.4:1, flexShrink:0 }}>
                        <Ic name="send" size={16} color="#fff"/>
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