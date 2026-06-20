"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Agent {
  id: string; name: string; business_name: string; subdomain: string;
  status: string; primary_color?: string; plan: string; readiness_score?: number; leads_pin?: string;
}
interface Profile { id: string; full_name: string; email: string; plan: string; }
interface Wallet  { balance: number; }

function Ic({ name, size=16, color }: { name:string; size?:number; color?:string }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:color||"currentColor", strokeWidth:1.65, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch (name) {
    case "grid":     return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    case "agent":    return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "wallet":   return <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
    case "leads":    return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "content":  return <svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
    case "explore":  return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "zap":      return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "build":    return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "gift":     return <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "arrow":    return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    default:         return null;
  }
}

const PLAN_COLORS: Record<string,string> = {
  trial:"#fbbf24", basic:"#38bdf8", pro:"#a78bfa", max:"#34d399", expired:"#f87171", admin:"#34d399"
};

const TOOLS = [
  { id:"agents",    icon:"agent",   label:"My Agents",       desc:"Manage your AI agents",    href:"/dashboard?tab=agents",  color:"124,58,237" },
  { id:"leads",     icon:"leads",   label:"Leads",           desc:"View all your leads",       href:"#leads",                 color:"248,113,113" },
  { id:"wallet",    icon:"wallet",  label:"Wallet",          desc:"Balance & transactions",    href:"/wallet",                color:"52,211,153"  },
  { id:"build",     icon:"build",   label:"Build Agent",     desc:"Create a new AI agent",     href:"/build",                 color:"56,189,248"  },
  { id:"explore",   icon:"explore", label:"Explore",         desc:"Browse all agents",         href:"/explore",               color:"251,191,36"  },
  { id:"casestudy", icon:"content", label:"Case Study",      desc:"Generate content",          href:"/tools/case-study",      color:"236,72,153"  },
  { id:"referral",  icon:"gift",    label:"Referral",        desc:"Earn $10 per referral",     href:"/tools/referral",        color:"167,139,250" },
  { id:"settings",  icon:"settings",label:"Settings",        desc:"Account & billing",         href:"/dashboard?tab=wallet",  color:"139,143,168" },
];

function AgentStatusDot({ status }: { status: string }) {
  const color = status === "active" ? "#34d399" : "#f87171";
  return <div style={{ width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}`, flexShrink:0 }}/>;
}

export default function OSPage() {
  const [profile, setProfile] = useState<Profile|null>(null);
  const [agents,  setAgents]  = useState<Agent[]>([]);
  const [wallet,  setWallet]  = useState<Wallet|null>(null);
  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const load = useCallback(async (tok: string) => {
    const [pRes, aRes, wRes] = await Promise.all([
      fetch(`${API}/api/auth/me`,   { headers: { Authorization: `Bearer ${tok}` } }),
      fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${tok}` } }),
      fetch(`${API}/api/wallet`,    { headers: { Authorization: `Bearer ${tok}` } }),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile ?? d); }
    if (aRes.ok) { const d = await aRes.json(); setAgents(d.agents ?? []); }
    if (wRes.ok) { setWallet(await wRes.json()); }
    setLoading(false);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  const planColor = PLAN_COLORS[profile?.plan || "trial"] || "#8891a8";
  const activeAgents = agents.filter(a => a.status === "active");
  const walletBal = wallet?.balance ?? 0;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#030408" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .tool-card:hover{transform:translateY(-2px)!important;border-color:rgba(255,255,255,0.15)!important}
        .tool-card{transition:all 0.15s}
        @media(max-width:600px){.os-grid{grid-template-columns:repeat(2,1fr)!important}.os-sidebar{display:none!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#030408", color:"#edf0f7", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased" }}>

        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(3,4,8,0.95)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:30 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>E</div>
            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.82rem", color:"#edf0f7" }}>EasyBuilda OS</span>
          </div>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", color:"rgba(237,240,247,0.35)" }}>
            {time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
          </span>
          <span style={{ padding:"2px 9px", borderRadius:100, fontSize:"0.65rem", fontWeight:700, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", background:`${planColor}18`, color:planColor, border:`1px solid ${planColor}33` }}>
            {profile?.plan?.toUpperCase() || "TRIAL"}
          </span>
          <a href="/dashboard" style={{ padding:"5px 11px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.74rem" }}>Classic UI</a>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", minHeight:"calc(100vh - 48px)" }}>

          {/* Sidebar */}
          <div className="os-sidebar" style={{ borderRight:"1px solid rgba(255,255,255,0.06)", padding:"20px 14px", display:"flex", flexDirection:"column", gap:4 }}>
            <p style={{ margin:"0 0 12px 8px", fontSize:"0.6rem", color:"rgba(237,240,247,0.3)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", letterSpacing:"0.15em", textTransform:"uppercase" }}>Navigation</p>
            {TOOLS.map(t => (
              <a key={t.id} href={t.href} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, textDecoration:"none", color:"rgba(237,240,247,0.6)", fontSize:"0.82rem", transition:"all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLAnchorElement).style.color = "#edf0f7"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(237,240,247,0.6)"; }}>
                <Ic name={t.icon} size={15} color={`rgb(${t.color})`}/>
                {t.label}
              </a>
            ))}

            <div style={{ flex:1 }}/>

            {/* Profile */}
            <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {(profile?.full_name||profile?.email||"?").slice(0,2).toUpperCase()}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ margin:0, fontSize:"0.76rem", fontWeight:600, color:"#edf0f7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile?.full_name || "User"}</p>
                  <p style={{ margin:0, fontSize:"0.64rem", color:"rgba(237,240,247,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ padding:"28px 24px", animation:"fadeIn 0.3s ease both" }}>

            {/* Welcome */}
            <div style={{ marginBottom:28 }}>
              <h1 style={{ margin:"0 0 4px", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.4rem", color:"#edf0f7", letterSpacing:"-0.02em" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {(profile?.full_name||"").split(" ")[0] || "there"}.
              </h1>
              <p style={{ margin:0, fontSize:"0.84rem", color:"rgba(237,240,247,0.45)" }}>
                {activeAgents.length > 0
                  ? `${activeAgents.length} agent${activeAgents.length>1?"s":""} running — answering customers right now.`
                  : "No agents running yet — build your first one below."}
              </p>
            </div>

            {/* Status bar */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:activeAgents.length>0?"#34d399":"rgba(255,255,255,0.2)", animation:activeAgents.length>0?"pulse 2s infinite":undefined, boxShadow:activeAgents.length>0?"0 0 6px #34d399":undefined }}/>
                <span style={{ fontSize:"0.78rem", color:"rgba(237,240,247,0.7)" }}>{activeAgents.length} agent{activeAgents.length!==1?"s":""} active</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <Ic name="wallet" size={13} color={walletBal < 5 ? "#fbbf24" : "#34d399"}/>
                <span style={{ fontSize:"0.78rem", color:"rgba(237,240,247,0.7)" }}>${walletBal.toFixed(2)} wallet</span>
              </div>
              <a href="/wallet/topup" style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.25)", textDecoration:"none", fontSize:"0.78rem", color:"#a78bfa" }}>
                <Ic name="build" size={13} color="#a78bfa"/> Add funds
              </a>
            </div>

            {/* Active Agents */}
            {agents.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <p style={{ margin:"0 0 12px", fontSize:"0.65rem", color:"rgba(237,240,247,0.35)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", letterSpacing:"0.15em", textTransform:"uppercase" }}>Your agents</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {agents.map(agent => {
                    const color = agent.primary_color || "#7c3aed";
                    const pct   = agent.readiness_score ?? 0;
                    return (
                      <div key={agent.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, transition:"all 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                        <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${color},#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                          {(agent.name||"AI").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <AgentStatusDot status={agent.status}/>
                            <span style={{ fontSize:"0.85rem", fontWeight:600, color:"#edf0f7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name}</span>
                          </div>
                          <p style={{ margin:0, fontSize:"0.7rem", color:"rgba(237,240,247,0.4)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            easybuilda.com/{agent.subdomain}
                          </p>
                        </div>
                        <div style={{ fontSize:"0.68rem", color:pct>=75?"#34d399":pct>=50?"#fbbf24":"#f87171", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontWeight:700 }}>{pct}%</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <a href={`/${agent.subdomain}/leads?key=${agent.id}`} target="_blank" rel="noopener noreferrer" style={{ padding:"5px 10px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.72rem" }}>Leads</a>
                          <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer" style={{ padding:"5px 10px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.72rem" }}>View</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tools Grid */}
            <div>
              <p style={{ margin:"0 0 14px", fontSize:"0.65rem", color:"rgba(237,240,247,0.35)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", letterSpacing:"0.15em", textTransform:"uppercase" }}>All tools</p>
              <div className="os-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {TOOLS.map(t => (
                  <a key={t.id} href={t.href} className="tool-card" style={{ padding:"16px 14px", borderRadius:14, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", textDecoration:"none", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:`rgba(${t.color},0.12)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Ic name={t.icon} size={16} color={`rgb(${t.color})`}/>
                    </div>
                    <div>
                      <p style={{ margin:"0 0 2px", fontSize:"0.82rem", fontWeight:600, color:"#edf0f7" }}>{t.label}</p>
                      <p style={{ margin:0, fontSize:"0.7rem", color:"rgba(237,240,247,0.4)", lineHeight:1.4 }}>{t.desc}</p>
                    </div>
                    <Ic name="arrow" size={13} color="rgba(237,240,247,0.2)"/>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}