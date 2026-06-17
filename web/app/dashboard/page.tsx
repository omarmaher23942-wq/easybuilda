"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient, signOut } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

interface Agent {
  id: string; name: string; business_name: string; tagline?: string;
  username: string; primary_color?: string; plan: string; status: string;
  readiness_score?: number; readiness_notes?: string; leads_pin?: string; created_at?: string;
}
interface Profile { plan: string; trial_ends_at?: string; full_name?: string; }

function daysLeft(iso?: string) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}
function hexToRgb(hex: string) {
  const h = (hex || "#7c3aed").replace("#", "");
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}
function planColor(plan: string) {
  if (plan === "trial") return "#fbbf24";
  if (plan === "basic") return "#7c3aed";
  if (plan === "pro")   return "#38bdf8";
  if (plan === "max")   return "#22d3ee";
  return "#fbbf24";
}

// ── Readiness ring ────────────────────────────────────────────────────────────
function ReadinessRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
  const R = 20, circ = 2 * Math.PI * R;
  return (
    <div style={{ position:"relative", width:50, height:50, flexShrink:0 }}>
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
        <circle cx="25" cy="25" r={R} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 25 25)"
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:"0.62rem",fontWeight:700,color,fontFamily:"var(--font-mono,'monospace')",lineHeight:1}}>{pct}</span>
      </div>
    </div>
  );
}

// ── Trial Banner ──────────────────────────────────────────────────────────────
function TrialBanner({ profile }: { profile: Profile }) {
  if (profile.plan !== "trial") return null;
  const left = daysLeft(profile.trial_ends_at);
  if (left === null) return null;
  const expired = left === 0;
  const col = expired ? "#f87171" : "#fbbf24";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"11px 18px",
      borderRadius:12, marginBottom:24,
      background:`rgba(${expired?"248,113,113":"251,191,36"},0.07)`,
      border:`1px solid rgba(${expired?"248,113,113":"251,191,36"},0.2)`,
    }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{flexShrink:0}}>
        <circle cx="7.5" cy="7.5" r="6" stroke={col} strokeWidth="1.3"/>
        <path d="M7.5 4v4l2.5 1.5" stroke={col} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <p style={{margin:0,fontSize:"0.81rem",color:col,flex:1}}>
        {expired
          ? "Trial ended — upgrade to keep agents active."
          : `Trial ends in ${left} day${left!==1?"s":""}. Upgrade to continue.`}
      </p>
      <a href="/pricing" style={{fontSize:"0.74rem",fontWeight:700,color:col,textDecoration:"none",fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>
        UPGRADE →
      </a>
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, token, onDelete }: { agent: Agent; token: string; onDelete:(id:string)=>void }) {
  const [pinVis,   setPinVis]   = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const color = agent.primary_color || "#7c3aed";
  const rgb   = hexToRgb(color);
  const score = agent.readiness_score ?? 0;
  const active = agent.status === "active";
  const initials = agent.name.slice(0,2).toUpperCase();
  const agentUrl = `${typeof window !== "undefined" ? window.location.origin : "https://easybuilda.vercel.app"}/${agent.username}`;
  const leadsUrl = `/${agent.username}/leads`;

  const copyUrl = async () => {
    await navigator.clipboard.writeText(agentUrl);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const del = async () => {
    if (!confirm(`Delete "${agent.name}"?\nThis cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/agents/${agent.id}`, {
        method:"DELETE",
        headers:{ Authorization:`Bearer ${token}` }
      });
      onDelete(agent.id);
    } catch { setDeleting(false); }
  };

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        position:"relative", borderRadius:20, overflow:"hidden",
        background:"rgba(10,14,26,0.9)",
        border:`1px solid ${hovered ? `rgba(${rgb},0.4)` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(${rgb},0.15), 0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(${rgb},0.12)`
          : "0 4px 24px rgba(0,0,0,0.3)",
        transition:"border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        transform: hovered ? "translateY(-3px)" : "none",
        display:"flex", flexDirection:"column",
      }}
    >
      {/* Aura glow */}
      <div style={{
        position:"absolute", top:-40, right:-40,
        width:160, height:160, borderRadius:"50%", pointerEvents:"none",
        background:`radial-gradient(circle, rgba(${rgb},${hovered?0.22:0.1}) 0%, transparent 70%)`,
        transition:"opacity 0.3s",
      }}/>

      {/* Top accent line */}
      <div style={{height:2,background:`linear-gradient(90deg,transparent,${color},#22d3ee,transparent)`}}/>

      <div style={{padding:"22px 22px 18px",flex:1,display:"flex",flexDirection:"column",gap:16}}>

        {/* Header */}
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{
            width:46,height:46,borderRadius:"50%",flexShrink:0,
            background:`linear-gradient(135deg,${color},#22d3ee)`,
            boxShadow:`0 0 ${hovered?28:16}px rgba(${rgb},${hovered?0.6:0.4})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:15,color:"#fff",
            transition:"box-shadow 0.25s",
          }}>
            {initials}
          </div>

          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"0.97rem",color:"#edf0f7"}}>
                {agent.name}
              </span>
              <span style={{
                fontSize:"0.58rem",padding:"2px 8px",borderRadius:100,
                fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.08em",textTransform:"uppercase",
                background:active?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)",
                color:active?"#34d399":"#f87171",
                border:`1px solid ${active?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"}`,
              }}>
                {agent.status}
              </span>
            </div>
            <p style={{margin:0,fontSize:"0.74rem",color:"rgba(136,145,168,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {agent.business_name}{agent.tagline?` · ${agent.tagline}`:""}
            </p>
          </div>

          <ReadinessRing score={score}/>
        </div>

        {/* Agent URL row */}
        <div style={{
          display:"flex",alignItems:"center",gap:8,
          background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:10,padding:"8px 12px",
        }}>
          <span style={{flex:1,fontSize:"0.71rem",color:"rgba(136,145,168,0.7)",fontFamily:"var(--font-mono,'monospace')",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            easybuilda.vercel.app/<span style={{color}}>{agent.username}</span>
          </span>
          <button onClick={copyUrl} title="Copy URL"
            style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",color:copied?"#34d399":"rgba(136,145,168,0.6)",transition:"color 0.18s"}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              {copied
                ?<path d="M2 6.5l3 3L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                :<path d="M9 1H4a1 1 0 00-1 1v7m8-5v7a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1h5a1 1 0 011 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              }
            </svg>
          </button>
          <a href={agentUrl} target="_blank" rel="noopener noreferrer"
            style={{color:"rgba(136,145,168,0.6)",display:"flex",transition:"color 0.18s"}}
            onMouseEnter={e=>(e.currentTarget.style.color=color)}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(136,145,168,0.6)")}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        {/* Readiness bar */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:"0.62rem",color:"rgba(136,145,168,0.55)",fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.1em",textTransform:"uppercase"}}>Agent readiness</span>
            <span style={{fontSize:"0.62rem",color:score>=75?"#34d399":score>=50?"#fbbf24":"#f87171",fontFamily:"var(--font-mono,'monospace')",fontWeight:700}}>{score}/100</span>
          </div>
          <div style={{height:3,borderRadius:4,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <div style={{
              height:"100%", width:`${score}%`, borderRadius:4,
              background:score>=75?"linear-gradient(90deg,#34d399,#22d3ee)":score>=50?"linear-gradient(90deg,#fbbf24,#f59e0b)":"linear-gradient(90deg,#f87171,#ef4444)",
              transition:"width 1.2s cubic-bezier(0.22,1,0.36,1)",
              boxShadow:`0 0 8px ${score>=75?"#34d399":score>=50?"#fbbf24":"#f87171"}`,
            }}/>
          </div>
        </div>

        {/* PIN block */}
        {agent.leads_pin && (
          <div style={{
            borderRadius:12,padding:"12px 14px",
            background:`rgba(${rgb},0.06)`,
            border:`1px solid rgba(${rgb},0.18)`,
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="1" y="4.5" width="9" height="5.5" rx="1.5" stroke={color} strokeWidth="1.2"/>
                  <path d="M3 4.5V3.5a2.5 2.5 0 015 0v1" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span style={{fontSize:"0.6rem",color,fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>Leads PIN — Save this</span>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <button onClick={()=>setPinVis(!pinVis)}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.66rem",color:"rgba(136,145,168,0.6)",fontFamily:"var(--font-mono,'monospace')",transition:"color 0.15s",padding:0}}
                  onMouseEnter={e=>(e.currentTarget.style.color="#edf0f7")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(136,145,168,0.6)")}>
                  {pinVis?"hide":"reveal"}
                </button>
              </div>
            </div>
            <div style={{fontFamily:"var(--font-mono,'monospace')",fontWeight:700,fontSize:"1.45rem",color:"#edf0f7",letterSpacing:"0.2em"}}>
              {pinVis ? agent.leads_pin.split("").join("  ") : "●  ●  ●  ●  ●  ●"}
            </div>
            <p style={{margin:"8px 0 0",fontSize:"0.65rem",color:"rgba(136,145,168,0.5)"}}>
              This PIN protects your leads dashboard. Copy it now — it won't be shown again in full.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{padding:"12px 22px 18px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:8}}>
        <a href={agentUrl} target="_blank" rel="noopener noreferrer"
          style={{flex:1,padding:"9px 0",borderRadius:10,textDecoration:"none",textAlign:"center",fontSize:"0.78rem",fontWeight:500,fontFamily:"var(--font-sans,'Inter',sans-serif)",transition:"all 0.18s",background:`rgba(${rgb},0.1)`,border:`1px solid rgba(${rgb},0.2)`,color}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`rgba(${rgb},0.18)`;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`rgba(${rgb},0.1)`;}}
        >View agent ↗</a>
        <a href={leadsUrl} target="_blank" rel="noopener noreferrer"
          style={{flex:1,padding:"9px 0",borderRadius:10,textDecoration:"none",textAlign:"center",fontSize:"0.78rem",fontWeight:500,fontFamily:"var(--font-sans,'Inter',sans-serif)",transition:"all 0.18s",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",color:"#edf0f7"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.08)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
        >Leads</a>
        <button onClick={del} disabled={deleting}
          style={{padding:"9px 13px",borderRadius:10,border:"1px solid rgba(248,113,113,0.18)",background:"rgba(248,113,113,0.06)",color:"rgba(248,113,113,0.8)",cursor:"pointer",opacity:deleting?0.5:1,transition:"all 0.18s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(248,113,113,0.14)";(e.currentTarget as HTMLElement).style.color="#f87171";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(248,113,113,0.06)";(e.currentTarget as HTMLElement).style.color="rgba(248,113,113,0.8)";}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 4h9M5.5 4V3a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M6 6.5v4M8 6.5v4M3.5 4l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      padding:"72px 40px 64px", textAlign:"center", borderRadius:20,
      border:"1px solid rgba(124,58,237,0.14)",
      background:"radial-gradient(ellipse 70% 55% at 50% 35%, rgba(124,58,237,0.09), transparent 65%), #07091a",
      position:"relative", overflow:"hidden",
    }}>
      <style>{`
        @keyframes genesis-breathe { 0%,100%{transform:scale(1);opacity:0.92} 50%{transform:scale(1.05);opacity:1} }
        @keyframes ring-spin-cw  { to{transform:rotate(360deg)} }
        @keyframes ring-spin-ccw { to{transform:rotate(-360deg)} }
        @keyframes particle-float { 0%,100%{transform:translateY(0) scale(1);opacity:0.6} 50%{transform:translateY(-8px) scale(1.2);opacity:1} }
      `}</style>
      {[[8,12],[92,8],[4,88],[94,82],[48,4],[50,96]].map(([x,y],i)=>(
        <div key={i} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:i%2===0?2:1.5,height:i%2===0?2:1.5,borderRadius:"50%",background:"rgba(200,216,255,0.5)",animation:`particle-float ${3.5+i*.4}s ease-in-out infinite`,animationDelay:`${i*.6}s`}}/>
      ))}
      <div style={{position:"relative",width:120,height:120,margin:"0 auto 36px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:-16,borderRadius:"50%",border:"1px solid rgba(124,58,237,0.18)",animation:"ring-spin-cw 18s linear infinite"}}>
          {[0,120,240].map((deg,i)=>(
            <div key={i} style={{position:"absolute",left:"50%",top:0,width:5,height:5,borderRadius:"50%",background:i===0?"#a855f7":i===1?"#38bdf8":"#22d3ee",boxShadow:`0 0 8px ${i===0?"#a855f7":i===1?"#38bdf8":"#22d3ee"}`,transform:`rotate(${deg}deg) translateX(-50%) translateY(-50%)`,transformOrigin:"0 76px"}}/>
          ))}
        </div>
        <div style={{position:"absolute",inset:4,borderRadius:"50%",border:"1px dashed rgba(56,189,248,0.2)",animation:"ring-spin-ccw 8s linear infinite"}}/>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg, #a855f7 0%, #7c3aed 30%, #2563eb 65%, #22d3ee 100%)",boxShadow:"0 0 0 1px rgba(168,85,247,0.3), 0 0 24px rgba(124,58,237,0.7), 0 0 56px rgba(124,58,237,0.35), 0 0 90px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.25)",animation:"genesis-breathe 4s ease-in-out infinite",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
          <div style={{position:"absolute",top:10,left:14,width:28,height:14,borderRadius:"50%",background:"rgba(255,255,255,0.22)",filter:"blur(4px)"}}/>
          <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:28,color:"rgba(255,255,255,0.95)",letterSpacing:"-0.04em",lineHeight:1,position:"relative",zIndex:1}}>E</span>
        </div>
      </div>
      <p style={{margin:"0 0 6px",fontSize:"0.6rem",color:"rgba(168,85,247,0.8)",fontFamily:"var(--font-mono,monospace)",letterSpacing:"0.22em",textTransform:"uppercase",fontWeight:600}}>Ready to create</p>
      <h2 style={{margin:"0 0 12px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.35rem",color:"#edf0f7",letterSpacing:"-0.025em",lineHeight:1.2}}>
        Your first agent is<br/>
        <span style={{background:"linear-gradient(90deg,#a78bfa,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>waiting to be born.</span>
      </h2>
      <p style={{margin:"0 0 32px",fontSize:"0.83rem",color:"rgba(136,145,168,0.65)",lineHeight:1.7,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>
        Describe your business. In 60 seconds, you'll have an AI agent answering customers and capturing leads — live on your website.
      </p>
      <a href="/build" style={{display:"inline-flex",alignItems:"center",gap:9,padding:"13px 28px",borderRadius:12,textDecoration:"none",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"0.92rem",color:"#fff",background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",boxShadow:"0 0 36px rgba(124,58,237,0.55), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",transition:"filter 0.2s, transform 0.2s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.filter="brightness(1.12)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.filter="none";(e.currentTarget as HTMLElement).style.transform="none";}}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5v12M1.5 7.5h12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        Build your first agent
      </a>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [token,   setToken]   = useState("");
  const [user,    setUser]    = useState<{email?:string}|null>(null);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [agents,  setAgents]  = useState<Agent[]>([]);
  const [status,  setStatus]  = useState<"loading"|"ready"|"error">("loading");
  const sb = createClient();

  const load = useCallback(async () => {
    try {
      // getUser() checks with Supabase server directly — works with cookies
      const { data: { user }, error } = await sb.auth.getUser();
      
      if (error || !user) {
        window.location.href = "/auth/login";
        return;
      }
  
      // Get session for the access token
      const { data: { session } } = await sb.auth.getSession();
      const accessToken = session?.access_token ?? "";
      
      setToken(accessToken);
      setUser({ email: user.email });
  
      if (!accessToken) {
        setStatus("ready");
        return;
      }
  
      const h = { Authorization: `Bearer ${accessToken}` };
  
      const [meRes, agentsRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,   { headers: h }),
        fetch(`${API}/api/agents/me`, { headers: h }),
      ]);
  
      if (meRes.ok)     { const d = await meRes.json();     setProfile(d.profile); }
      if (agentsRes.ok) { const d = await agentsRes.json(); setAgents(d.agents ?? []); }
  
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const removeAgent = (id:string) => setAgents(p=>p.filter(a=>a.id!==id));

  if (status === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#05070f"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.15)",borderTopColor:"#7c3aed",animation:"spin 0.75s linear infinite"}}/>
        <p style={{margin:0,fontSize:"0.75rem",color:"rgba(136,145,168,0.5)",fontFamily:"var(--font-mono,'monospace')"}}>Loading workspace…</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#05070f",flexDirection:"column",gap:16}}>
      <p style={{color:"#f87171",fontFamily:"var(--font-sans,'Inter',sans-serif)"}}>Something went wrong loading your workspace.</p>
      <button onClick={load} style={{padding:"10px 24px",borderRadius:10,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",color:"#a78bfa",cursor:"pointer",fontFamily:"var(--font-sans,'Inter',sans-serif)"}}>
        Try again
      </button>
    </div>
  );

  const planLabel = profile?.plan ?? "trial";
  const left = daysLeft(profile?.trial_ends_at);
  const pc = planColor(planLabel);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform:rotate(360deg) } }
        .dash-in { animation: fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div style={{minHeight:"100vh",background:"#05070f",fontFamily:"var(--font-sans,'Inter',sans-serif)"}}>

        {/* Ambient bg */}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
          <div style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 65%)"}}/>
          <div style={{position:"absolute",bottom:"-15%",left:"-5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,0.05) 0%,transparent 65%)"}}/>
        </div>

        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:20,borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(5,7,15,0.85)",backdropFilter:"blur(24px) saturate(180%)"}}>
          <div style={{maxWidth:1120,margin:"0 auto",padding:"0 28px",height:58,display:"flex",alignItems:"center",gap:16}}>
            {/* Logo */}
            <a href="/" style={{display:"flex",alignItems:"center",gap:9,textDecoration:"none",marginRight:8}}>
              <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#a855f7,#7c3aed 40%,#2563eb 72%,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px rgba(124,58,237,0.45)"}}>
                <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:14,color:"#fff",letterSpacing:"-0.03em"}}>E</span>
              </div>
              <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"0.92rem",color:"#edf0f7",letterSpacing:"-0.01em"}}>EasyBuilda</span>
            </a>

            <div style={{flex:1}}/>

            {/* Plan chip */}
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px 4px 8px",borderRadius:100,background:`rgba(${hexToRgb(pc)},0.08)`,border:`1px solid rgba(${hexToRgb(pc)},0.2)`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:pc,boxShadow:`0 0 6px ${pc}`}}/>
              <span style={{fontSize:"0.67rem",fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.08em",textTransform:"uppercase",color:pc,fontWeight:600}}>
                {planLabel}{planLabel==="trial"&&left!==null?` · ${left}d left`:""}
              </span>
            </div>

            {/* Upgrade link (only for trial) */}
            {planLabel === "trial" && (
              <a href="/pricing" style={{fontSize:"0.75rem",fontWeight:600,color:"#fbbf24",textDecoration:"none",fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.05em",padding:"5px 12px",borderRadius:8,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",transition:"all 0.18s"}}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(251,191,36,0.14)")}
                onMouseLeave={e=>(e.currentTarget.style.background="rgba(251,191,36,0.08)")}>
                Upgrade
              </a>
            )}

            {/* User */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:700,color:"#fff",flexShrink:0}}>
                {user?.email?.slice(0,1).toUpperCase()}
              </div>
              <span style={{fontSize:"0.74rem",color:"rgba(136,145,168,0.8)",fontFamily:"var(--font-mono,'monospace')",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {user?.email}
              </span>
            </div>

            <button onClick={()=>signOut()}
              style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(136,145,168,0.8)",fontSize:"0.76rem",cursor:"pointer",fontFamily:"var(--font-sans,'Inter',sans-serif)",transition:"all 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget.style.background="rgba(255,255,255,0.08)");(e.currentTarget.style.color="#edf0f7");}}
              onMouseLeave={e=>{(e.currentTarget.style.background="rgba(255,255,255,0.04)");(e.currentTarget.style.color="rgba(136,145,168,0.8)");}}>
              Sign out
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={{maxWidth:1120,margin:"0 auto",padding:"36px 28px 60px",position:"relative",zIndex:1}}>
          <div className="dash-in">

            {profile && <TrialBanner profile={profile}/>}

            {/* Page header */}
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:16}}>
              <div>
                <p style={{margin:"0 0 5px",fontSize:"0.6rem",color:"rgba(124,58,237,0.9)",fontFamily:"var(--font-mono,'monospace')",letterSpacing:"0.22em",textTransform:"uppercase",fontWeight:600}}>
                  Mission Control
                </p>
                <h1 style={{margin:"0 0 6px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.85rem",color:"#edf0f7",letterSpacing:"-0.03em",lineHeight:1.15}}>
                  {profile?.full_name
                    ? <>{profile.full_name.split(" ")[0]}&apos;s <span style={{background:"linear-gradient(90deg,#a78bfa,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>workspace</span></>
                    : <>Your <span style={{background:"linear-gradient(90deg,#a78bfa,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>workspace</span></>
                  }
                </h1>
                <p style={{margin:0,fontSize:"0.8rem",color:"rgba(136,145,168,0.65)"}}>
                  {agents.length===0
                    ? "No agents yet. Build your first one and watch it work."
                    : `${agents.length} agent${agents.length!==1?"s":""} active and capturing leads.`}
                </p>
              </div>

              <a href="/build" style={{
                display:"inline-flex",alignItems:"center",gap:8,padding:"11px 22px",borderRadius:12,
                textDecoration:"none",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:600,fontSize:"0.9rem",color:"#fff",
                background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",
                boxShadow:"0 0 28px rgba(124,58,237,0.45),0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.15)",
                transition:"filter 0.18s, transform 0.18s",
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.filter="brightness(1.1)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.filter="none";(e.currentTarget as HTMLElement).style.transform="none";}}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M1.5 7h11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                Build new agent
              </a>
            </div>

            {/* Agent grid */}
            {agents.length===0
              ? <EmptyState/>
              : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:18}}>
                  {agents.map(agent=>(
                    <AgentCard key={agent.id} agent={agent} token={token} onDelete={removeAgent}/>
                  ))}
                </div>
              )
            }

            {/* Support footer */}
            <div style={{marginTop:48,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",flexWrap:"wrap",gap:16,alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                <a href="/pricing" style={{fontSize:"0.78rem",color:"rgba(136,145,168,0.6)",textDecoration:"none",transition:"color 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="#edf0f7")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(136,145,168,0.6)")}>
                  Pricing
                </a>
                <a href="/build" style={{fontSize:"0.78rem",color:"rgba(136,145,168,0.6)",textDecoration:"none",transition:"color 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="#edf0f7")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(136,145,168,0.6)")}>
                  Build new agent
                </a>
                <a href="mailto:support@easybuilda.com" style={{fontSize:"0.78rem",color:"rgba(136,145,168,0.6)",textDecoration:"none",transition:"color 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="#edf0f7")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(136,145,168,0.6)")}>
                  Support
                </a>
              </div>
              <p style={{margin:0,fontSize:"0.72rem",color:"rgba(136,145,168,0.35)",fontFamily:"var(--font-mono,'monospace')"}}>
                © 2026 EasyBuilda
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}