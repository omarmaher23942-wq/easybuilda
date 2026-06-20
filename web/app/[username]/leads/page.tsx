"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Lead {
  id: string; name?: string; email?: string; phone?: string;
  interest?: string; intent?: "hot"|"warm"|"cold"; summary?: string;
  budget?: string; timeline?: string; location?: string;
  suggested_action?: string; source_page?: string; created_at: string;
}
interface Agent {
  id: string; name: string; business_name: string;
  primary_color?: string; readiness_score?: number; readiness_notes?: string; plan: string;
}

const INTENT = {
  hot:  { label:"HOT",  color:"#f87171", ring:"rgba(248,113,113,0.28)", bg:"rgba(248,113,113,0.10)" },
  warm: { label:"WARM", color:"#fbbf24", ring:"rgba(251,191,36,0.28)",  bg:"rgba(251,191,36,0.10)" },
  cold: { label:"COLD", color:"#38bdf8", ring:"rgba(56,189,248,0.28)",  bg:"rgba(56,189,248,0.10)" },
} as const;

const SESSION_KEY = (id:string) => `eb_leads_pin_${id}`;

function Badge({ intent }: { intent?: string }) {
  const c = INTENT[intent as keyof typeof INTENT];
  if (!c) return null;
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:100,fontSize:"0.68rem",fontWeight:700,fontFamily:"var(--font-mono)",letterSpacing:"0.08em",background:c.bg,border:`1px solid ${c.ring}`,color:c.color }}>
      <span style={{ width:4,height:4,borderRadius:"50%",background:c.color,flexShrink:0 }}/>
      {c.label}
    </span>
  );
}

function StatCard({ label, value, color, sub }: { label:string; value:number; color?:string; sub?:string }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid var(--line)",borderRadius:14,padding:"16px 18px" }}>
      <p style={{ margin:0,fontSize:"0.63rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</p>
      <p style={{ margin:"8px 0 0",fontFamily:"var(--font-display)",fontWeight:700,fontSize:"2rem",color:color??"var(--color-starlight)",lineHeight:1 }}>{value}</p>
      {sub&&<p style={{ margin:"4px 0 0",fontSize:"0.68rem",color:"var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

function Gauge({ score }: { score:number }) {
  const pct = Math.max(0,Math.min(100,score));
  const color = pct>=75?"#34d399":pct>=50?"#fbbf24":"#f87171";
  const R=28, circ=2*Math.PI*R, dash=(pct/100)*circ;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:14 }}>
      <div style={{ position:"relative",width:68,height:68,flexShrink:0 }}>
        <svg width="68" height="68" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
          <circle cx="34" cy="34" r={R} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 34 34)"
            style={{ transition:"stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }}/>
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1rem",color,lineHeight:1 }}>{pct}</span>
          <span style={{ fontSize:"0.52rem",color:"var(--color-dust)" }}>/ 100</span>
        </div>
      </div>
      <div>
        <p style={{ margin:0,fontFamily:"var(--font-display)",fontWeight:600,fontSize:"0.86rem",color:"var(--color-starlight)" }}>Agent readiness</p>
        <p style={{ margin:"3px 0 0",fontSize:"0.72rem",color:"var(--color-dust)",lineHeight:1.45,maxWidth:240 }}>
          {pct>=75?"Strong — agent is ready to convert visitors."
           :pct>=50?"Good — a few knowledge gaps to fill."
           :"Needs more knowledge to answer confidently."}
        </p>
      </div>
    </div>
  );
}

/* ── AI Sales Co-Pilot ──────────────────────────────────────────── */
function SalesCoPilot({ lead, agentName }: { lead: Lead; agentName: string }) {
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    if (advice) { setOpen(!open); return; }
    setOpen(true); setLoading(true);
    try {
      const context = [
        lead.name && `Name: ${lead.name}`,
        lead.email && `Email: ${lead.email}`,
        lead.phone && `Phone: ${lead.phone}`,
        lead.interest && `Interest: ${lead.interest}`,
        lead.budget && `Budget: ${lead.budget}`,
        lead.timeline && `Timeline: ${lead.timeline}`,
        lead.summary && `Summary: ${lead.summary}`,
        `Intent: ${lead.intent || "cold"}`,
      ].filter(Boolean).join("\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:400,
          messages:[{
            role:"user",
            content:`You are an AI Sales Co-Pilot for ${agentName}. Analyze this lead and give a concise, specific action plan (3-4 sentences max):\n\n${context}\n\nProvide: 1) Best next action, 2) What to say/write, 3) Best time to follow up. Be specific and actionable. No fluff.`
          }]
        })
      });
      const d = await res.json();
      setAdvice(d.content?.[0]?.text || "Contact this lead within 24 hours for best results.");
    } catch {
      setAdvice(`This ${lead.intent || "cold"} lead showed interest in your business. Follow up within 24 hours with a personalized message addressing their specific needs.`);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop:10 }}>
      <button onClick={getAdvice} style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:9,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.25)",color:"#a78bfa",fontSize:"0.75rem",fontWeight:600,cursor:"pointer",fontFamily:"var(--font-sans)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        AI Sales Co-Pilot
      </button>
      {open && (
        <div style={{ marginTop:8,padding:"12px 14px",background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.22)",borderRadius:10 }}>
          {loading
            ? <div style={{ display:"flex",alignItems:"center",gap:8,color:"var(--color-dust)",fontSize:"0.78rem" }}>
                <div style={{ width:12,height:12,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.3)",borderTopColor:"#a78bfa",animation:"spin 0.7s linear infinite",flexShrink:0 }}/>
                Analyzing lead…
              </div>
            : <>
                <p style={{ margin:"0 0 6px",fontSize:"0.65rem",color:"var(--color-nebula)",fontFamily:"var(--font-mono)",letterSpacing:"0.08em",textTransform:"uppercase" }}>AI Co-Pilot Advice</p>
                <p style={{ margin:0,fontSize:"0.82rem",color:"var(--color-starlight)",lineHeight:1.65,whiteSpace:"pre-wrap" }}>{advice}</p>
              </>
          }
        </div>
      )}
    </div>
  );
}

/* ── Success Story Generator ────────────────────────────────────── */
function SuccessStory({ leads, agentName, businessName }: { leads:Lead[]; agentName:string; businessName:string }) {
  const [story, setStory] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const hot  = leads.filter(l=>l.intent==="hot").length;
  const warm = leads.filter(l=>l.intent==="warm").length;

  if (leads.length < 3) return null;

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:300,
          messages:[{role:"user",content:`Write a short, compelling LinkedIn post (3-4 sentences) about how ${businessName} is using their AI agent "${agentName}" to capture leads 24/7. Stats: ${leads.length} total leads captured, ${hot} hot leads, ${warm} warm leads. Make it professional, specific, and inspiring. Include a call-to-action about EasyBuilda. No hashtags. Keep it human and genuine.`}]
        })
      });
      const d = await res.json();
      setStory(d.content?.[0]?.text || "");
    } catch {
      setStory(`Our AI agent ${agentName} has already captured ${leads.length} leads — including ${hot} hot prospects — without us lifting a finger. 24/7 availability changed everything for ${businessName}. If you're still letting potential clients slip away outside business hours, check out @EasyBuilda.`);
    }
    setLoading(false);
  };

  const copyStory = () => {
    if (story) { navigator.clipboard.writeText(story); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  return (
    <div style={{ background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:16,padding:"18px 20px",marginBottom:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:story?14:0 }}>
        <span style={{ fontSize:"1.1rem" }}>🎉</span>
        <div style={{ flex:1 }}>
          <p style={{ margin:"0 0 2px",fontSize:"0.84rem",fontWeight:600,color:"var(--color-starlight)" }}>Share your success!</p>
          <p style={{ margin:0,fontSize:"0.72rem",color:"var(--color-dust)" }}>{leads.length} leads captured — turn this into a LinkedIn post.</p>
        </div>
        <button onClick={generate} disabled={loading} style={{ padding:"7px 14px",borderRadius:9,background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",fontSize:"0.76rem",fontWeight:700,cursor:"pointer",fontFamily:"var(--font-sans)",flexShrink:0 }}>
          {loading?"Generating…":"Generate post"}
        </button>
      </div>
      {story && (
        <div>
          <div style={{ padding:"12px 14px",background:"rgba(0,0,0,0.2)",borderRadius:10,fontSize:"0.84rem",color:"var(--color-starlight)",lineHeight:1.7,marginBottom:10 }}>
            {story}
          </div>
          <button onClick={copyStory} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",fontSize:"0.74rem",fontWeight:600,cursor:"pointer",fontFamily:"var(--font-sans)" }}>
            {copied?"✓ Copied!":"Copy for LinkedIn"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Conversation Intelligence ──────────────────────────────────── */
function ConversationIntel({ leads }: { leads: Lead[] }) {
  if (leads.length < 2) return null;

  const interests = leads.map(l=>l.interest).filter(Boolean) as string[];
  const hotCount  = leads.filter(l=>l.intent==="hot").length;
  const convRate  = leads.length > 0 ? Math.round((hotCount/leads.length)*100) : 0;

  return (
    <div style={{ background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:16,padding:"18px 20px",marginBottom:20 }}>
      <p style={{ margin:"0 0 14px",fontSize:"0.7rem",color:"#38bdf8",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",textTransform:"uppercase" }}>Conversation Intelligence</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div style={{ padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid var(--line)" }}>
          <p style={{ margin:"0 0 4px",fontSize:"0.62rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)",textTransform:"uppercase" }}>Conversion rate</p>
          <p style={{ margin:0,fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.6rem",color:convRate>=20?"#34d399":convRate>=10?"#fbbf24":"#f87171" }}>{convRate}%</p>
          <p style={{ margin:"2px 0 0",fontSize:"0.7rem",color:"var(--color-dust)" }}>of visitors become hot leads</p>
        </div>
        <div style={{ padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid var(--line)" }}>
          <p style={{ margin:"0 0 4px",fontSize:"0.62rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)",textTransform:"uppercase" }}>Top interests</p>
          {interests.slice(0,3).map((interest,i)=>(
            <p key={i} style={{ margin:"2px 0",fontSize:"0.74rem",color:"var(--color-starlight)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
              · {interest}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Lead Card ──────────────────────────────────────────────────── */
function LeadCard({ lead, agentName }: { lead:Lead; agentName:string }) {
  const [open, setOpen] = useState(false);
  const ic = INTENT[lead.intent as keyof typeof INTENT];
  const date = new Date(lead.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const fields = ([["Email",lead.email],["Phone",lead.phone],["Budget",lead.budget],["Timeline",lead.timeline],["Location",lead.location]] as [string,string|undefined][]).filter(([,v])=>v);

  return (
    <div style={{ background:"rgba(255,255,255,0.025)",border:"1px solid var(--line)",borderRadius:14,overflow:"hidden",transition:"border-color 0.18s,background 0.18s" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--line-bright)";(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.04)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--line)";(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.025)";}}>
      <button onClick={()=>setOpen(!open)} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left" }}>
        <div style={{ width:40,height:40,borderRadius:"50%",flexShrink:0,background:ic?`linear-gradient(135deg,${ic.color}66,${ic.color}cc)`:"linear-gradient(135deg,#7c3aed,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:13,color:"#fff",boxShadow:ic?`0 0 12px ${ic.color}33`:undefined }}>
          {lead.name?lead.name.slice(0,2).toUpperCase():"--"}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontFamily:"var(--font-display)",fontWeight:600,fontSize:"0.9rem",color:"var(--color-starlight)" }}>{lead.name??"Unknown visitor"}</span>
            <Badge intent={lead.intent}/>
          </div>
          <p style={{ margin:"3px 0 0",fontSize:"0.73rem",color:"var(--color-dust)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {lead.interest??"No interest captured"} · {date}
          </p>
        </div>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ transform:open?"rotate(180deg)":"none",transition:"transform 0.18s",flexShrink:0 }}>
          <path d="M3 5l4 4 4-4" stroke="var(--color-dust)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding:"0 18px 18px",borderTop:"1px solid var(--line)" }}>
          {lead.summary&&<p style={{ margin:"14px 0 12px",fontSize:"0.85rem",lineHeight:1.65,color:"var(--color-starlight)",padding:"11px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid var(--line)" }}>{lead.summary}</p>}
          {fields.length>0&&(
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:10 }}>
              {fields.map(([lbl,val])=>(
                <div key={lbl} style={{ padding:"9px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid var(--line)" }}>
                  <p style={{ margin:0,fontSize:"0.6rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)",letterSpacing:"0.09em",textTransform:"uppercase" }}>{lbl}</p>
                  <p style={{ margin:"4px 0 0",fontSize:"0.82rem",color:"var(--color-starlight)",wordBreak:"break-word" }}>{val}</p>
                </div>
              ))}
            </div>
          )}
          {lead.suggested_action&&(
            <div style={{ padding:"10px 13px",borderRadius:10,background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.2)",marginBottom:10 }}>
              <p style={{ margin:"0 0 2px",fontSize:"0.6rem",color:"var(--color-nebula)",fontFamily:"var(--font-mono)",letterSpacing:"0.09em",textTransform:"uppercase" }}>Suggested action</p>
              <p style={{ margin:0,fontSize:"0.82rem",color:"var(--color-starlight)",lineHeight:1.5 }}>{lead.suggested_action}</p>
            </div>
          )}
          {lead.source_page&&<p style={{ margin:"0 0 8px",fontSize:"0.67rem",color:"var(--color-dust)",fontFamily:"var(--font-mono)" }}>Source: {lead.source_page}</p>}
          <SalesCoPilot lead={lead} agentName={agentName}/>
        </div>
      )}
    </div>
  );
}

/* ── PIN Gate ───────────────────────────────────────────────────── */
function PinGate({ agentId,agentName,color,onUnlock }: { agentId:string;agentName:string;color:string;onUnlock:(pin:string)=>void }) {
  const [digits,setDigits]=useState(["","","","","",""]);
  const [error,setError]=useState(false);
  const [shake,setShake]=useState(false);
  const refs=[useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)];
  const h=color.replace("#","");
  const r=`${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const triggerShake=useCallback(()=>{setShake(true);setError(true);setDigits(["","","","","",""]);setTimeout(()=>{setShake(false);refs[0].current?.focus();},650);},[]);
  useEffect(()=>{(window as any).__ebPinShake=triggerShake;},[triggerShake]);
  const submit=useCallback((pin:string)=>{if(pin.length===6)onUnlock(pin);},[onUnlock]);
  const onChange=(i:number,val:string)=>{const v=val.replace(/\D/g,"").slice(-1);const next=[...digits];next[i]=v;setDigits(next);setError(false);if(v&&i<5)refs[i+1].current?.focus();const full=next.join("");if(full.length===6)submit(full);};
  const onKeyDown=(i:number,e:React.KeyboardEvent<HTMLInputElement>)=>{if(e.key==="Backspace"&&!digits[i]&&i>0){const next=[...digits];next[i-1]="";setDigits(next);refs[i-1].current?.focus();}};
  return (
    <>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}} @keyframes gate-in{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}} .pb{width:46px;height:54px;border-radius:11px;border:1.5px solid var(--line-bright);background:rgba(255,255,255,0.04);font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:var(--color-starlight);text-align:center;outline:none;caret-color:transparent;transition:border-color 0.15s,box-shadow 0.15s} .pb:focus{border-color:${color};box-shadow:0 0 0 3px rgba(${r},0.2)} .pb.err{border-color:#f87171!important;box-shadow:0 0 0 3px rgba(248,113,113,0.18)!important}`}</style>
      <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-void)",backgroundImage:`radial-gradient(700px 450px at 60% 20%,rgba(${r},0.12),transparent 65%)`,padding:24 }}>
        <div style={{ width:"100%",maxWidth:380,background:"rgba(255,255,255,0.03)",border:"1px solid var(--line)",borderRadius:22,padding:"36px 32px",animation:"gate-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ width:48,height:48,borderRadius:13,margin:"0 auto 22px",background:`rgba(${r},0.1)`,border:`1px solid rgba(${r},0.25)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="3" y="10" width="16" height="11" rx="3" stroke={color} strokeWidth="1.5"/><path d="M7 10V7a4 4 0 018 0v3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="11" cy="15.5" r="1.5" fill={color}/></svg>
          </div>
          <h1 style={{ margin:"0 0 6px",textAlign:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.2rem",color:"var(--color-starlight)" }}>Leads Dashboard</h1>
          <p style={{ margin:"0 0 28px",textAlign:"center",fontSize:"0.8rem",color:"var(--color-dust)",lineHeight:1.5 }}>Enter the 6-digit PIN for <strong style={{ color:"var(--color-starlight)" }}>{agentName}</strong>.</p>
          <div style={{ display:"flex",gap:7,justifyContent:"center",marginBottom:14,animation:shake?"shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)":undefined }}>
            {digits.map((d,i)=>(
              <input key={i} ref={refs[i]} className={`pb${error?" err":""}`} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e=>onChange(i,e.target.value)} onKeyDown={e=>onKeyDown(i,e)} onFocus={e=>e.target.select()} autoFocus={i===0}/>
            ))}
          </div>
          <p style={{ textAlign:"center",fontSize:"0.76rem",color:error?"#f87171":"transparent",fontFamily:"var(--font-mono)",transition:"color 0.18s",margin:"0 0 20px" }}>Incorrect PIN. Try again.</p>
          <p style={{ textAlign:"center",fontSize:"0.7rem",color:"var(--color-dust)",lineHeight:1.5 }}>PIN was shown when your agent was built.<br/>Contact <a href="mailto:omarmaher23942@gmail.com" style={{ color:"var(--color-stellar)",textDecoration:"none" }}>support</a> if lost.</p>
        </div>
      </div>
    </>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function LeadsPage({ params,searchParams }: { params:Promise<{username:string}>;searchParams:Promise<{key?:string}> }) {
  const {username}    = use(params);
  const {key:agentId} = use(searchParams);
  const [pin,setPin]=useState<string|null>(()=>{if(typeof window==="undefined"||!agentId)return null;return sessionStorage.getItem(SESSION_KEY(agentId));});
  const [agent,setAgent]=useState<Agent|null>(null);
  const [leads,setLeads]=useState<Lead[]>([]);
  const [status,setStatus]=useState<"loading-agent"|"pin-gate"|"loading-leads"|"ready"|"error">("loading-agent");
  const [errMsg,setErrMsg]=useState("");
  const [filter,setFilter]=useState<"all"|"hot"|"warm"|"cold">("all");
  const [query,setQuery]=useState("");

  useEffect(()=>{
    if(!agentId){setErrMsg("Missing ?key=AGENT_ID in the URL.");setStatus("error");return;}
    fetch(`${API}/api/agents/${agentId}/public`)
      .then(async r=>{if(!r.ok)throw new Error(`${r.status}`);return r.json();})
      .then(d=>{setAgent(d.agent);setStatus(pin?"loading-leads":"pin-gate");})
      .catch(e=>{setErrMsg(String(e));setStatus("error");});
  },[agentId,pin]);

  const loadLeads=useCallback(async(p:string)=>{
    if(!agentId)return;
    setStatus("loading-leads");
    try{
      const res=await fetch(`${API}/api/agents/${agentId}/leads?pin=${encodeURIComponent(p)}`);
      if(res.status===401||res.status===403){sessionStorage.removeItem(SESSION_KEY(agentId));setPin(null);setStatus("pin-gate");setTimeout(()=>(window as any).__ebPinShake?.(),50);return;}
      if(!res.ok)throw new Error(`${res.status}`);
      const d=await res.json();
      setLeads(d.leads??[]);
      sessionStorage.setItem(SESSION_KEY(agentId),p);
      setStatus("ready");
    }catch(e){setErrMsg(String(e));setStatus("error");}
  },[agentId]);

  useEffect(()=>{if(status==="loading-leads"&&pin)loadLeads(pin);},[status,pin,loadLeads]);

  const handleUnlock=(p:string)=>{setPin(p);loadLeads(p);};
  const handleLogout=()=>{if(agentId)sessionStorage.removeItem(SESSION_KEY(agentId));setPin(null);setLeads([]);setStatus("pin-gate");};

  const counts={hot:leads.filter(l=>l.intent==="hot").length,warm:leads.filter(l=>l.intent==="warm").length,cold:leads.filter(l=>l.intent==="cold").length};
  const filtered=leads.filter(l=>{if(filter!=="all"&&l.intent!==filter)return false;if(!query)return true;const q=query.toLowerCase();return[l.name,l.email,l.interest,l.summary].some(f=>f?.toLowerCase().includes(q));});
  const color=agent?.primary_color||"#7c3aed";

  if(status==="loading-agent")return(<div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-void)" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ width:36,height:36,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.2)",borderTopColor:"var(--color-nebula)",animation:"spin 0.75s linear infinite" }}/></div>);
  if(status==="error")return(<div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:24,background:"var(--color-void)" }}><p style={{ color:"#f87171",fontSize:"0.9rem",textAlign:"center" }}>{errMsg}</p></div>);
  if(status==="pin-gate"&&agent)return<PinGate agentId={agent.id} agentName={agent.name} color={color} onUnlock={handleUnlock}/>;
  if(status==="loading-leads")return(<div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-void)" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ width:36,height:36,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.2)",borderTopColor:"var(--color-nebula)",animation:"spin 0.75s linear infinite" }}/></div>);

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .fb{background:rgba(255,255,255,0.04);border:1px solid var(--line);color:var(--color-dust);padding:5px 12px;border-radius:100px;font-size:0.76rem;cursor:pointer;transition:all 0.15s;font-family:var(--font-sans)} .fb:hover{border-color:var(--line-bright);color:var(--color-starlight)} .fb.on{background:rgba(124,58,237,0.11);border-color:rgba(124,58,237,0.32);color:var(--color-nebula);font-weight:600} .qi{background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:10px;padding:7px 12px;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.83rem;outline:none;width:180px;transition:border-color 0.15s} .qi:focus{border-color:var(--color-nebula)} .qi::placeholder{color:var(--color-dust)}`}</style>
      <div style={{ minHeight:"100vh",background:"var(--color-void)",backgroundImage:"radial-gradient(800px 450px at 72% -8%,rgba(124,58,237,0.08),transparent 62%)" }}>
        <header style={{ borderBottom:"1px solid var(--line)",background:"rgba(5,7,15,0.85)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:10 }}>
          <div style={{ maxWidth:1080,margin:"0 auto",padding:"13px 20px",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:color,boxShadow:`0 0 10px ${color}`,flexShrink:0 }}/>
            <div style={{ flex:1,minWidth:0 }}>
              <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.58rem",color:"var(--color-nebula)",letterSpacing:"0.15em",textTransform:"uppercase" }}>Leads Dashboard</span>
              <h1 style={{ margin:"2px 0 0",fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1rem",color:"var(--color-starlight)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {agent?.name}<span style={{ color:"var(--color-dust)",fontWeight:400 }}> · {agent?.business_name}</span>
              </h1>
            </div>
            <a href={`/${username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:"0.74rem",color:"var(--color-stellar)",fontFamily:"var(--font-mono)",textDecoration:"none",display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
              View agent <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <button onClick={handleLogout} title="Lock" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid var(--line)",borderRadius:8,padding:"6px 8px",cursor:"pointer" }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="6.5" width="10" height="7" rx="2" stroke="var(--color-dust)" strokeWidth="1.3"/><path d="M4.5 6.5V5a2.5 2.5 0 015 0v1.5" stroke="var(--color-dust)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
          </div>
        </header>

        <main style={{ maxWidth:1080,margin:"0 auto",padding:"24px 20px" }}>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20 }}>
            <div style={{ gridColumn:"span 2",background:"rgba(255,255,255,0.03)",border:"1px solid var(--line)",borderRadius:14,padding:"16px 20px" }}>
              {agent?.readiness_score!==undefined&&<Gauge score={agent.readiness_score}/>}
              {agent?.readiness_notes&&<p style={{ margin:"10px 0 0",fontSize:"0.72rem",color:"var(--color-dust)",lineHeight:1.5 }}>{agent.readiness_notes}</p>}
            </div>
            <StatCard label="Hot"   value={counts.hot}  color={INTENT.hot.color}  sub="Ready to buy"/>
            <StatCard label="Warm"  value={counts.warm} color={INTENT.warm.color} sub="Showing interest"/>
            <StatCard label="Cold"  value={counts.cold} color={INTENT.cold.color} sub="Early stage"/>
            <StatCard label="Total" value={leads.length} sub="All leads"/>
          </div>

          {/* Conversation Intelligence */}
          <ConversationIntel leads={leads}/>

          {/* Success Story */}
          {agent&&<SuccessStory leads={leads} agentName={agent.name} businessName={agent.business_name}/>}

          {/* Filters */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap" }}>
            {(["all","hot","warm","cold"] as const).map(f=>(
              <button key={f} className={`fb${filter===f?" on":""}`} onClick={()=>setFilter(f)}>
                {f==="all"?`All (${leads.length})`:`${INTENT[f]?.label??f} (${counts[f as keyof typeof counts]??0})`}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <input className="qi" placeholder="Search leads…" value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>

          {/* Leads */}
          {filtered.length===0
            ?<div style={{ padding:"48px 24px",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1px solid var(--line)",borderRadius:14 }}>
              <p style={{ margin:0,fontSize:"0.9rem",color:"var(--color-dust)" }}>
                {leads.length===0?"No leads yet — your agent is live and listening.":"No leads match your filters."}
              </p>
            </div>
            :<div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filtered.map(lead=><LeadCard key={lead.id} lead={lead} agentName={agent?.name||"Agent"}/>)}
            </div>
          }
        </main>
      </div>
    </>
  );
}