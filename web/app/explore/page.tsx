"use client";

import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface PublicAgent {
  id: string; name: string; business_name: string; tagline: string;
  primary_color: string; subdomain: string; plan: string;
  readiness_score?: number; created_at: string;
}

const CATEGORIES = [
  { id: "all",           label: "All",            emoji: "✨" },
  { id: "restaurant",    label: "Restaurants",     emoji: "🍽️" },
  { id: "clinic",        label: "Clinics",         emoji: "🏥" },
  { id: "real-estate",   label: "Real Estate",     emoji: "🏠" },
  { id: "law",           label: "Law Firms",       emoji: "⚖️" },
  { id: "ecommerce",     label: "E-Commerce",      emoji: "🛍️" },
  { id: "coach",         label: "Coaches",         emoji: "🎯" },
  { id: "beauty",        label: "Beauty & Wellness", emoji: "💅" },
  { id: "tech",          label: "Tech & Software",  emoji: "💻" },
  { id: "education",     label: "Education",        emoji: "📚" },
];

function toRgb(hex: string) {
  const h = (hex||"#7c3aed").replace("#","");
  try { return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`; }
  catch { return "124,58,237"; }
}

function AgentCard({ agent }: { agent: PublicAgent }) {
  const color = agent.primary_color || "#7c3aed";
  const rgb   = toRgb(color);
  const pct   = agent.readiness_score ?? 0;
  const health= pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
      <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:18, overflow:"hidden", transition:"all 0.2s", cursor:"pointer" }}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=`rgba(${rgb},0.4)`;(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 32px rgba(${rgb},0.15)`;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--line)";(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
        <div style={{ height:3, background:`linear-gradient(90deg,${color},#22d3ee)` }}/>
        <div style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${color},#22d3ee)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:16,color:"#fff",flexShrink:0,boxShadow:`0 0 18px rgba(${rgb},0.3)` }}>
              {(agent.name||"AI").slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h3 style={{ margin:"0 0 2px",fontFamily:"var(--font-display)",fontWeight:700,fontSize:"0.92rem",color:"var(--color-starlight)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{agent.name}</h3>
              <p style={{ margin:0,fontSize:"0.74rem",color:"var(--color-dust)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{agent.business_name}</p>
            </div>
            <div style={{ position:"relative",width:36,height:36,flexShrink:0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                <circle cx="18" cy="18" r="14" fill="none" stroke={health} strokeWidth="3"
                  strokeDasharray={`${(pct/100)*2*Math.PI*14} ${2*Math.PI*14}`} strokeLinecap="round" transform="rotate(-90 18 18)"/>
              </svg>
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",fontWeight:700,color:health,fontFamily:"var(--font-mono)" }}>{pct}</div>
            </div>
          </div>
          {agent.tagline && (
            <p style={{ margin:"0 0 12px",fontSize:"0.76rem",color:"var(--color-dust)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>
              {agent.tagline}
            </p>
          )}
          <div style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid var(--line)",borderRadius:9 }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#34d399",flexShrink:0,boxShadow:"0 0 5px #34d399" }}/>
            <span style={{ fontSize:"0.67rem",color:"var(--color-stellar)",fontFamily:"var(--font-mono)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
              easybuilda.com/{agent.subdomain}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ExplorePage() {
  const [agents,   setAgents]   = useState<PublicAgent[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("all");
  const [query,    setQuery]    = useState("");

  useEffect(() => {
    fetch(`${API}/api/agents/public`)
      .then(r => r.ok ? r.json() : { agents: [] })
      .then(d => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter(a => {
    if (query) {
      const q = query.toLowerCase();
      if (![a.name,a.business_name,a.tagline].some(f=>f?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cat-btn{padding:7px 14px;border-radius:100px;border:1px solid var(--line);background:transparent;color:var(--color-dust);font-size:0.78rem;cursor:pointer;transition:all 0.15s;font-family:var(--font-sans);white-space:nowrap}
        .cat-btn:hover{border-color:var(--line-bright);color:var(--color-starlight)}
        .cat-btn.on{background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.4);color:var(--color-nebula)}
        @media(max-width:600px){.explore-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--color-void)", backgroundImage:"radial-gradient(800px 400px at 60% -10%,rgba(124,58,237,0.08),transparent 60%)" }}>

        {/* Header */}
        <header style={{ borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.88)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ maxWidth:1100, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <a href="/" style={{ display:"flex",alignItems:"center",gap:8,textDecoration:"none" }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff" }}>E</div>
              <span style={{ fontFamily:"var(--font-display)",fontWeight:700,fontSize:"0.9rem",color:"var(--color-starlight)" }}>EasyBuilda</span>
            </a>
            <div style={{ flex:1 }}/>
            <a href="/auth/login" style={{ padding:"6px 14px",borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",fontWeight:600,fontSize:"0.82rem",textDecoration:"none" }}>
              Build yours →
            </a>
          </div>
        </header>

        <main style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px 64px" }}>

          {/* Hero */}
          <div style={{ textAlign:"center", marginBottom:40, animation:"fadeIn 0.3s ease both" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"var(--color-nebula)", marginBottom:12 }}>Agent Directory</p>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(1.8rem,4vw,2.6rem)", letterSpacing:"-0.025em", color:"var(--color-starlight)", marginBottom:10 }}>
              AI Agents Built with EasyBuilda
            </h1>
            <p style={{ fontSize:"0.9rem", color:"var(--color-dust)", maxWidth:480, margin:"0 auto 24px" }}>
              Browse real AI agents businesses built in minutes — then build yours.
            </p>

            {/* Search */}
            <div style={{ maxWidth:380, margin:"0 auto", position:"relative" }}>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search agents…"
                style={{ width:"100%", padding:"11px 16px 11px 40px", boxSizing:"border-box", background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:12, color:"var(--color-starlight)", fontSize:"0.88rem", fontFamily:"var(--font-sans)", outline:"none" }}
                onFocus={e=>(e.target.style.borderColor="rgba(124,58,237,0.45)")}
                onBlur={e=>(e.target.style.borderColor="var(--line)")}/>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--color-dust)", pointerEvents:"none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
            </div>
          </div>

          {/* Category filters */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28, justifyContent:"center" }}>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-btn${category===c.id?" on":""}`} onClick={()=>setCategory(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:80 }}>
              <div style={{ width:36,height:36,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.2)",borderTopColor:"#7c3aed",animation:"spin 0.75s linear infinite" }}/>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"64px 24px", color:"var(--color-dust)", fontSize:"0.9rem" }}>
              {agents.length === 0
                ? "No public agents yet — be the first to build one!"
                : "No agents match your search."}
              <div style={{ marginTop:20 }}>
                <a href="/auth/login" style={{ padding:"0.7rem 1.4rem",borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",fontWeight:700,fontSize:"0.88rem",textDecoration:"none" }}>
                  Build an agent →
                </a>
              </div>
            </div>
          ) : (
            <>
              <p style={{ margin:"0 0 20px", fontSize:"0.78rem", color:"var(--color-dust)" }}>
                {filtered.length} agent{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="explore-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, animation:"fadeIn 0.25s ease both" }}>
                {filtered.map(agent => <AgentCard key={agent.id} agent={agent}/>)}
              </div>
            </>
          )}

          {/* CTA */}
          <div style={{ marginTop:56, textAlign:"center", padding:"32px 24px", background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:20 }}>
            <h2 style={{ margin:"0 0 8px",fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.3rem",color:"var(--color-starlight)" }}>
              Ready to build yours?
            </h2>
            <p style={{ margin:"0 0 20px",fontSize:"0.85rem",color:"var(--color-dust)" }}>
              Join businesses already using EasyBuilda. Start free, no card required.
            </p>
            <a href="/auth/login" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"0.85rem 2rem",borderRadius:13,background:"linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)",color:"#fff",fontWeight:700,fontSize:"0.92rem",textDecoration:"none",boxShadow:"0 0 28px rgba(124,58,237,0.4)" }}>
              Build my AI agent — free →
            </a>
          </div>
        </main>
      </div>
    </>
  );
}