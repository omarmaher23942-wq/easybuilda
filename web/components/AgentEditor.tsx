"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const API      = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://easybuilda.com";

interface AgentFields {
  agent_name: string; tagline: string; welcome_message: string;
  tone: string; primary_color: string;
  services: string; hours: string; location: string; policies: string; contact: string;
}
interface AgentMeta {
  id: string; name: string; username: string;
  readiness_score?: number; plan?: string;
}
export interface AgentEditorProps {
  agentId: string; token: string; onClose?: () => void;
}

function Icon({ name, size=16, color }: { name:string; size?:number; color?:string }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:color||"currentColor", strokeWidth:1.65, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch (name) {
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "spin":     return <svg {...p} style={{ animation:"agSpin 0.6s linear infinite" }}><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>;
    case "user":     return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "tag":      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "message":  return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "mic":      return <svg {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case "palette":  return <svg {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
    case "shopping": return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
    case "clock":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "map":      return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "phone":    return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case "shield":   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "external": return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    case "link":     return <svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
    case "edit":     return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    default:         return null;
  }
}

const TONES = [
  { value:"friendly",     label:"Friendly",     desc:"Warm & approachable"    },
  { value:"professional", label:"Professional",  desc:"Formal & precise"       },
  { value:"energetic",    label:"Energetic",     desc:"Upbeat & enthusiastic"  },
  { value:"luxury",       label:"Luxury",        desc:"Elegant & refined"      },
  { value:"casual",       label:"Casual",        desc:"Relaxed & conversational"},
];

const COLORS = ["#7c3aed","#2563eb","#0891b2","#059669","#d97706","#dc2626","#db2777","#6366f1"];

const SECTIONS = [
  { key:"services" as keyof AgentFields, icon:"shopping", label:"Services & Pricing",  hint:"List services and prices — more detail = better answers.",     placeholder:"• Hair cut — $45\n• Highlights — from $120\n• All services include consultation." },
  { key:"hours"    as keyof AgentFields, icon:"clock",    label:"Business Hours",      hint:"When are you open?",                                            placeholder:"Mon–Fri: 9am – 6pm\nSat: 10am – 4pm\nSunday: Closed" },
  { key:"location" as keyof AgentFields, icon:"map",      label:"Location",            hint:"Where are you? Or do you serve online?",                        placeholder:"123 Main St, Austin TX 78701\nWe also deliver within 10 miles." },
  { key:"contact"  as keyof AgentFields, icon:"phone",    label:"Contact & Booking",   hint:"How do customers reach or book you?",                           placeholder:"(512) 555-1234\nhello@yourbusiness.com\nbooking.yourbiz.com" },
  { key:"policies" as keyof AgentFields, icon:"shield",   label:"Policies",            hint:"Returns, cancellations, guarantees, payment methods.",          placeholder:"Cancellations: 24hr notice\nRefunds: 30-day guarantee\nWe accept cash, card, Venmo." },
];

function Gauge({ score }: { score:number }) {
  const pct   = Math.max(0,Math.min(100,score));
  const color = pct>=75?"#34d399":pct>=50?"#fbbf24":"#f87171";
  const R=22, circ=2*Math.PI*R, dash=(pct/100)*circ;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
        <circle cx="28" cy="28" r={R} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 28 28)"
          style={{ transition:"stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}/>
        <text x="28" y="32" textAnchor="middle" style={{ fill:color, fontSize:12, fontFamily:"var(--font-display)", fontWeight:700 }}>{pct}</text>
      </svg>
      <div>
        <p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:"var(--color-starlight)" }}>Agent readiness</p>
        <p style={{ margin:"2px 0 0", fontSize:"0.7rem", color:"var(--color-dust)" }}>
          {pct>=75?"Ready to sell and support."
           :pct>=50?"Good — a few more details will help."
           :"Add more info to improve accuracy."}
        </p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, marginTop:22 }}>
      <div style={{ flex:1, height:1, background:"var(--line)" }}/>
      <span style={{ fontSize:"0.63rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", letterSpacing:"0.12em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{children}</span>
      <div style={{ flex:1, height:1, background:"var(--line)" }}/>
    </div>
  );
}

function FieldHeader({ label, icon, saving, saved, hint }: { label:string; icon:string; saving:boolean; saved:boolean; hint?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
      <span style={{ color:"var(--color-nebula)", marginTop:1, flexShrink:0 }}><Icon name={icon} size={15}/></span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:"var(--color-starlight)" }}>{label}</p>
        {hint && <p style={{ margin:"1px 0 0", fontSize:"0.68rem", color:"var(--color-dust)" }}>{hint}</p>}
      </div>
      {saving && <span style={{ color:"var(--color-nebula)", flexShrink:0 }}><Icon name="spin" size={14}/></span>}
      {saved && !saving && <span style={{ animation:"agFadeOut 2.5s ease forwards", color:"#34d399", flexShrink:0 }}><Icon name="check" size={14} color="#34d399"/></span>}
    </div>
  );
}

function UrlEditor({ agentId, token, currentUsername, rgb }: { agentId:string; token:string; currentUsername:string; rgb:string }) {
  const [editing,   setEditing]   = useState(false);
  const [newUrl,    setNewUrl]    = useState(currentUsername);
  const [checking,  setChecking]  = useState(false);
  const [available, setAvailable] = useState<boolean|null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const toSlug = (v:string) => v.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/--+/g,"-").replace(/^-|-$/g,"").slice(0,24);

  const checkAvailability = useCallback(async (slug:string) => {
    if (!slug||slug===currentUsername) { setAvailable(null); return; }
    if (slug.length<3) { setAvailable(false); return; }
    setChecking(true);
    try {
      const res = await fetch(`${API}/api/username/check?username=${encodeURIComponent(slug)}&agent_id=${agentId}`, { headers:{Authorization:`Bearer ${token}`} });
      const d = await res.json();
      setAvailable(!!d.available);
    } catch { setAvailable(null); }
    finally { setChecking(false); }
  }, [token,currentUsername,agentId]);

  const handleChange = (val:string) => {
    setNewUrl(val); setAvailable(null); setError("");
    if (timer.current) clearTimeout(timer.current);
    const slug = toSlug(val);
    if (slug.length>=3) timer.current = setTimeout(()=>checkAvailability(slug),600);
  };

  const saveUrl = async () => {
    const slug = toSlug(newUrl);
    if (!available||slug===currentUsername||slug.length<3) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/agents/${agentId}/username`, {
        method:"PATCH", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({fields:{username:slug}}),
      });
      if (!res.ok){const d=await res.json();setError(d.detail||"Failed.");return;}
      setSaved(true); setEditing(false);
      setTimeout(()=>window.location.reload(),800);
    } catch {setError("Connection error.");}
    finally {setSaving(false);}
  };

  const slug = toSlug(newUrl);
  const agentUrl = `${SITE_URL}/${slug||currentUsername}`;

  if (!editing) return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 15px", background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:13, marginBottom:15 }}>
      <Icon name="link" size={14} color="var(--color-nebula)"/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:"0.7rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {SITE_URL}/<strong style={{ color:"var(--color-stellar)" }}>{currentUsername}</strong>
        </p>
        {saved && <p style={{ margin:"2px 0 0", fontSize:"0.68rem", color:"#34d399" }}>✓ URL updated!</p>}
      </div>
      <button type="button" onClick={()=>{setEditing(true);setNewUrl(currentUsername);setAvailable(null);setError("");}}
        style={{ padding:"5px 12px", borderRadius:9, background:`rgba(${rgb},0.12)`, border:`1px solid rgba(${rgb},0.3)`, color:`rgb(${rgb})`, fontSize:"0.74rem", fontWeight:700, cursor:"pointer", fontFamily:"var(--font-sans)", outline:"none", flexShrink:0 }}>
        Change URL
      </button>
    </div>
  );

  return (
    <div style={{ padding:"15px", background:"rgba(255,255,255,0.025)", border:`1px solid rgba(${rgb},0.35)`, borderRadius:13, marginBottom:15 }}>
      <p style={{ margin:"0 0 10px", fontSize:"0.78rem", fontWeight:700, color:"var(--color-starlight)" }}>Change agent URL</p>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap", flexShrink:0 }}>{SITE_URL}/</span>
        <div style={{ flex:1, position:"relative" }}>
          <input type="text" value={newUrl} onChange={e=>handleChange(e.target.value)} placeholder="your-custom-url" autoFocus
            style={{ width:"100%", padding:"8px 32px 8px 10px", boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:`1.5px solid ${available===true?"rgba(52,211,153,0.5)":available===false?"rgba(248,113,113,0.5)":`rgba(${rgb},0.3)`}`, borderRadius:9, color:"var(--color-starlight)", fontSize:"0.84rem", fontFamily:"var(--font-mono)", outline:"none" }}/>
          <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            {checking?<Icon name="spin" size={12} color="var(--color-dust)"/>:available===true?<Icon name="check" size={12} color="#34d399"/>:available===false?<span style={{ color:"#f87171",fontSize:13 }}>✗</span>:null}
          </span>
        </div>
      </div>
      {slug&&slug!==newUrl&&slug.length>=3&&<p style={{ margin:"0 0 5px",fontSize:"0.67rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)" }}>Saved as: <span style={{ color:"var(--color-stellar)" }}>{slug}</span></p>}
      {available===true&&<p style={{ margin:"0 0 5px",fontSize:"0.72rem",color:"#34d399" }}>✓ Available!</p>}
      {available===false&&<p style={{ margin:"0 0 5px",fontSize:"0.72rem",color:"#f87171" }}>✗ Already taken.</p>}
      {slug.length>0&&slug.length<3&&<p style={{ margin:"0 0 5px",fontSize:"0.72rem",color:"#fbbf24" }}>Min 3 characters.</p>}
      {error&&<p style={{ margin:"0 0 5px",fontSize:"0.72rem",color:"#f87171" }}>{error}</p>}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button type="button" onClick={()=>{setEditing(false);setError("");}} style={{ flex:1, padding:"7px", borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", color:"var(--color-dust)", cursor:"pointer", fontSize:"0.8rem", fontFamily:"var(--font-sans)", outline:"none" }}>Cancel</button>
        <button type="button" onClick={saveUrl} disabled={!available||saving||slug===currentUsername||slug.length<3}
          style={{ flex:2, padding:"7px", borderRadius:9, background:(available&&!saving&&slug!==currentUsername&&slug.length>=3)?`rgba(${rgb},0.18)`:"rgba(255,255,255,0.04)", border:`1px solid ${(available&&slug!==currentUsername&&slug.length>=3)?`rgba(${rgb},0.45)`:"var(--line)"}`, color:(available&&slug!==currentUsername&&slug.length>=3)?`rgb(${rgb})`:"var(--color-dust)", cursor:(available&&!saving&&slug!==currentUsername&&slug.length>=3)?"pointer":"not-allowed", fontSize:"0.8rem", fontWeight:700, fontFamily:"var(--font-sans)", transition:"all 0.15s", outline:"none" }}>
          {saving?"Saving…":"Save URL"}
        </button>
      </div>
    </div>
  );
}

export function AgentEditor({ agentId, token }: AgentEditorProps) {
  const [fields,  setFields]  = useState<AgentFields|null>(null);
  const [meta,    setMeta]    = useState<AgentMeta|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [saved,   setSaved]   = useState<string|null>(null);
  const [error,   setError]   = useState("");
  const timers = useRef<Record<string,ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch(`${API}/api/agents/${agentId}/fields`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{setFields(d.fields);setMeta(d.agent);setLoading(false);})
      .catch(()=>{setError("Failed to load agent.");setLoading(false);});
  },[agentId,token]);

  const saveField = useCallback(async (key:string,value:string) => {
    setSaving(key);
    try {
      await fetch(`${API}/api/agents/${agentId}/fields`,{
        method:"PATCH", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({fields:{[key]:value}}),
      });
      setSaved(key);
      setTimeout(()=>setSaved(s=>s===key?null:s),2500);
    } catch {setError("Save failed.");}
    finally {setSaving(null);}
  },[agentId,token]);

  const handleChange = useCallback((key:keyof AgentFields,value:string) => {
    setFields(prev=>prev?{...prev,[key]:value}:prev);
    clearTimeout(timers.current[key]);
    timers.current[key]=setTimeout(()=>saveField(key,value),700);
  },[saveField]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:80 }}>
      <style>{`@keyframes agSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32,height:32,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.2)",borderTopColor:"var(--color-nebula)",animation:"agSpin 0.75s linear infinite" }}/>
    </div>
  );

  if (error&&!fields) return <div style={{ padding:32,textAlign:"center",color:"#f87171" }}>{error}</div>;
  if (!fields) return null;

  const agentColor = fields.primary_color||"#7c3aed";
  const h   = agentColor.replace("#","");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const isPro = ["pro","max","singularity","admin"].includes(meta?.plan||"");
  const agentUrl = meta?.username ? `${SITE_URL}/${meta.username}` : "";

  return (
    <>
      <style>{`
        @keyframes agSpin    { to{transform:rotate(360deg)} }
        @keyframes agFadeOut { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
        @keyframes agEdIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .agfc  { background:rgba(255,255,255,0.025);border:1px solid var(--line);border-radius:15px;padding:17px 19px;transition:border-color 0.2s;margin-bottom:10px }
        .agfc:focus-within { border-color:rgba(${rgb},0.4) }
        .agfi  { width:100%;background:transparent;border:none;outline:none;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.9rem;line-height:1.6;resize:none;padding:0;box-sizing:border-box }
        .agfi::placeholder { color:rgba(255,255,255,0.15) }
        .agtb  { display:flex;align-items:center;gap:7px;padding:9px 11px;border-radius:10px;border:1.5px solid var(--line);background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.15s;flex:1;min-width:105px;outline:none }
        .agtb:hover { border-color:var(--line-bright) }
        .agtb.on { border-color:rgba(${rgb},0.5);background:rgba(${rgb},0.08) }
        .agcd  { width:27px;height:27px;border-radius:50%;cursor:pointer;transition:transform 0.15s;border:2px solid transparent;flex-shrink:0;outline:none }
        .agcd:hover { transform:scale(1.15) }
        .agcd.on { border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,0.2) }
      `}</style>

      <div style={{ animation:"agEdIn 0.3s cubic-bezier(0.22,1,0.36,1) both", maxWidth:700, margin:"0 auto", paddingBottom:60 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:48,height:48,borderRadius:13,flexShrink:0,background:`linear-gradient(135deg,${agentColor},#22d3ee)`,boxShadow:`0 0 22px rgba(${rgb},0.35)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:18,color:"#fff" }}>
            {(fields.agent_name||"AI").slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <h2 style={{ margin:0,fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.08rem",color:"var(--color-starlight)" }}>
              {fields.agent_name||"Your Agent"}
            </h2>
            {agentUrl && (
              <a href={agentUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:"0.68rem",color:"var(--color-stellar)",fontFamily:"var(--font-mono)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
                {agentUrl} <Icon name="external" size={11}/>
              </a>
            )}
          </div>
          {meta?.readiness_score!==undefined&&<Gauge score={meta.readiness_score}/>}
        </div>

        {/* URL Editor */}
        {meta?.username&&(
          isPro
            ?<UrlEditor agentId={meta.id} token={token} currentUsername={meta.username} rgb={rgb}/>
            :<div style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid var(--line)",borderRadius:12,marginBottom:13 }}>
              <Icon name="link" size={13} color="var(--color-dust)"/>
              <p style={{ margin:0,fontSize:"0.68rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {SITE_URL}/<span style={{ color:"var(--color-starlight)" }}>{meta.username}</span>
              </p>
              <a href="/pricing" style={{ padding:"2px 8px",borderRadius:100,background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",fontSize:"0.62rem",color:"#a78bfa",fontWeight:700,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0 }}>
                Pro — custom URL
              </a>
            </div>
        )}

        {/* Identity */}
        <SectionLabel>Identity</SectionLabel>
        <div className="agfc">
          <FieldHeader label="Agent name" icon="user" saving={saving==="agent_name"} saved={saved==="agent_name"} hint="The name your agent introduces itself as"/>
          <input className="agfi" type="text" placeholder="e.g. Aria, Nova, Max…" value={fields.agent_name} onChange={e=>handleChange("agent_name",e.target.value)}/>
        </div>
        <div className="agfc">
          <FieldHeader label="Tagline" icon="tag" saving={saving==="tagline"} saved={saved==="tagline"} hint="Short description shown under the agent name"/>
          <input className="agfi" type="text" placeholder="Your 24/7 AI customer assistant" value={fields.tagline} onChange={e=>handleChange("tagline",e.target.value)}/>
        </div>
        <div className="agfc">
          <FieldHeader label="Welcome message" icon="message" saving={saving==="welcome_message"} saved={saved==="welcome_message"} hint="First message visitors see when they open the chat"/>
          <textarea className="agfi" rows={2} placeholder="Hi! I'm Aria. How can I help you today?" value={fields.welcome_message} onChange={e=>handleChange("welcome_message",e.target.value)}/>
        </div>

        {/* Personality */}
        <SectionLabel>Personality</SectionLabel>
        <div className="agfc">
          <FieldHeader label="Tone" icon="mic" saving={saving==="tone"} saved={saved==="tone"} hint="How should your agent speak to customers?"/>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:8 }}>
            {TONES.map(t=>(
              <button key={t.value} type="button" className={`agtb${fields.tone===t.value?" on":""}`} onClick={()=>handleChange("tone",t.value)}>
                <div>
                  <p style={{ margin:0,fontSize:"0.77rem",fontWeight:600,color:fields.tone===t.value?"var(--color-starlight)":"var(--color-dust)" }}>{t.label}</p>
                  <p style={{ margin:0,fontSize:"0.65rem",color:"var(--color-dust)" }}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="agfc">
          <FieldHeader label="Brand color" icon="palette" saving={saving==="primary_color"} saved={saved==="primary_color"} hint="Accent color for your chat widget"/>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:8 }}>
            {COLORS.map(c=>(
              <button key={c} type="button" className={`agcd${fields.primary_color===c?" on":""}`}
                style={{ background:c,boxShadow:`0 0 10px ${c}55` }}
                onClick={()=>handleChange("primary_color",c)}/>
            ))}
            <div style={{ display:"flex",alignItems:"center",gap:7,marginLeft:4 }}>
              <input type="color" value={fields.primary_color||"#7c3aed"} onChange={e=>handleChange("primary_color",e.target.value)}
                style={{ width:27,height:27,borderRadius:"50%",border:"none",cursor:"pointer",padding:0 }}/>
              <span style={{ fontSize:"0.68rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)" }}>{fields.primary_color}</span>
            </div>
          </div>
        </div>

        {/* Knowledge Base */}
        <SectionLabel>Knowledge Base</SectionLabel>
        <p style={{ margin:"0 0 13px",fontSize:"0.78rem",color:"var(--color-dust)",lineHeight:1.6 }}>
          Everything below becomes the AI's knowledge. More detail = more accurate answers.
        </p>
        {SECTIONS.map(sec=>(
          <div key={sec.key} className="agfc">
            <FieldHeader label={sec.label} icon={sec.icon} saving={saving===sec.key} saved={saved===sec.key} hint={sec.hint}/>
            <textarea className="agfi" rows={5} placeholder={sec.placeholder}
              value={(fields as Record<string, any>)[sec.key] || ""}
              onChange={e=>handleChange(sec.key,e.target.value)}/>
          </div>
        ))}

        {/* Footer */}
        {agentUrl && (
          <div style={{ marginTop:16,padding:"15px 18px",background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.18)",borderRadius:14,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 2px",fontSize:"0.82rem",fontWeight:600,color:"var(--color-starlight)" }}>Changes save automatically</p>
              <p style={{ margin:0,fontSize:"0.7rem",color:"var(--color-dust)" }}>
                Your agent at{" "}
                <a href={agentUrl} target="_blank" rel="noopener noreferrer" style={{ color:"var(--color-stellar)",textDecoration:"none" }}>
                  {agentUrl}
                </a>{" "}reflects changes in real-time.
              </p>
            </div>
            <a href={agentUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 13px",borderRadius:10,background:`rgba(${rgb},0.1)`,border:`1px solid rgba(${rgb},0.25)`,fontSize:"0.78rem",color:agentColor,textDecoration:"none",fontWeight:600,whiteSpace:"nowrap",flexShrink:0 }}>
              Preview <Icon name="external" size={12}/>
            </a>
          </div>
        )}
      </div>
    </>
  );
}