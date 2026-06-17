"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3 | 4; // 4 = Genesis Reveal

interface FormData {
  business_name: string;
  business_description: string;
  services: string;
  website_url: string;
  tone: string;
}

interface BuiltAgent {
  id: string; name: string; username: string; business_name: string;
  tagline: string; primary_color: string; readiness_score: number;
  readiness_notes: string; leads_pin: string; plan: string;
}

// ─── Genesis phases ───────────────────────────────────────────────────────────
const PHASES = [
  { label: "Analyzing your business",  dur: 3000 },
  { label: "Building knowledge base",  dur: 5000 },
  { label: "Architecting your agent",  dur: 5000 },
  { label: "Applying finishing touches",dur: 3000 },
];

const TONES = [
  { id:"professional", label:"Professional", desc:"Formal, precise, trustworthy", icon:"◈" },
  { id:"friendly",     label:"Friendly",     desc:"Warm, approachable, helpful",  icon:"✦" },
  { id:"energetic",    label:"Energetic",    desc:"Bold, enthusiastic, dynamic",  icon:"⚡" },
  { id:"luxury",       label:"Luxury",       desc:"Elegant, refined, exclusive",  icon:"◆" },
  { id:"casual",       label:"Casual",       desc:"Relaxed, human, conversational",icon:"○" },
];

// ─── Genesis Reveal ───────────────────────────────────────────────────────────
function GenesisReveal({
  agent, error, onDone,
}: {
  agent: BuiltAgent | null;
  error: string;
  onDone: () => void;
}) {
  const [phase,    setPhase]    = useState(0);   // 0-3 = building, 4 = done/error
  const [progress, setProgress] = useState(0);   // 0-100
  const [revealed, setRevealed] = useState(false);
  const [pinVis,   setPinVis]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Drive phase progression independently of API
  useEffect(() => {
    let elapsed = 0;
    PHASES.forEach((p, i) => {
      const t1 = setTimeout(() => setPhase(i), elapsed);
      timerRef.current.push(t1);
      elapsed += p.dur;
    });
    // After all phases, wait for agent
    const t2 = setTimeout(() => {
      // Will be revealed when agent arrives
    }, elapsed);
    timerRef.current.push(t2);

    // Progress bar
    const total = PHASES.reduce((s, p) => s + p.dur, 0);
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (total / 80));
        return Math.min(next, 95); // hold at 95 until agent arrives
      });
    }, 80);
    timerRef.current.push(interval as unknown as ReturnType<typeof setTimeout>);

    return () => {
      timerRef.current.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  // When agent arrives or error
  useEffect(() => {
    if (agent || error) {
      setProgress(100);
      setTimeout(() => {
        setPhase(4);
        setTimeout(() => setRevealed(true), 600);
      }, 400);
    }
  }, [agent, error]);

  const color = agent?.primary_color || "#7c3aed";
  const score = agent?.readiness_score ?? 0;
  const scoreColor = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <>
      <style>{`
        @keyframes genesis-breathe {
          0%,100% { transform:scale(1);    box-shadow:0 0 60px rgba(124,58,237,.6),0 0 120px rgba(124,58,237,.25); }
          50%      { transform:scale(1.06); box-shadow:0 0 90px rgba(124,58,237,.85),0 0 160px rgba(124,58,237,.4); }
        }
        @keyframes genesis-built {
          0%   { transform:scale(1.06); }
          60%  { transform:scale(0.96); }
          100% { transform:scale(1); }
        }
        @keyframes ring-cw  { to { transform:rotate(360deg);  } }
        @keyframes ring-ccw { to { transform:rotate(-360deg); } }
        @keyframes card-in  { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes phase-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer-bar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes particle-orbit {
          0%   { transform: rotate(var(--start)) translateX(var(--r)) rotate(calc(-1 * var(--start))); opacity:.8; }
          100% { transform: rotate(calc(var(--start) + 360deg)) translateX(var(--r)) rotate(calc(-1 * (var(--start) + 360deg))); opacity:.8; }
        }
      `}</style>

      <div style={{
        position:"fixed", inset:0, zIndex:50,
        background:"#05070f",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:24,
      }}>
        {/* Ambient bg */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 65%)"}}/>
          <div style={{position:"absolute",bottom:"-15%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,.08) 0%,transparent 65%)"}}/>
        </div>

        {!revealed ? (
          /* ── Building phase ── */
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,position:"relative",zIndex:1}}>

            {/* Orb container */}
            <div style={{position:"relative",width:160,height:160,marginBottom:48,display:"flex",alignItems:"center",justifyContent:"center"}}>

              {/* Outer orbit ring with 3 particles */}
              <div style={{position:"absolute",inset:-24,borderRadius:"50%",border:"1px solid rgba(124,58,237,.15)",animation:"ring-cw 6s linear infinite"}}>
                {[0,120,240].map((deg,i)=>(
                  <div key={i} style={{
                    position:"absolute",left:"50%",top:0,
                    width:6,height:6,borderRadius:"50%",
                    background:[color,"#38bdf8","#22d3ee"][i],
                    boxShadow:`0 0 10px ${[color,"#38bdf8","#22d3ee"][i]}`,
                    transform:`rotate(${deg}deg) translateX(-50%) translateY(-50%)`,
                    transformOrigin:`0 104px`,
                  }}/>
                ))}
              </div>

              {/* Inner ring */}
              <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"1px dashed rgba(56,189,248,.2)",animation:"ring-ccw 4s linear infinite"}}/>

              {/* Core orb */}
              <div style={{
                width:100,height:100,borderRadius:"50%",
                background:"linear-gradient(135deg,#a855f7 0%,#7c3aed 30%,#2563eb 65%,#22d3ee 100%)",
                animation:"genesis-breathe 2.5s ease-in-out infinite",
                display:"flex",alignItems:"center",justifyContent:"center",
                position:"relative",zIndex:1,
              }}>
                <div style={{position:"absolute",top:14,left:18,width:32,height:16,borderRadius:"50%",background:"rgba(255,255,255,.22)",filter:"blur(5px)"}}/>
                <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:32,color:"rgba(255,255,255,.95)",letterSpacing:"-.04em",position:"relative",zIndex:1}}>E</span>
              </div>
            </div>

            {/* Phase label */}
            <div style={{height:32,display:"flex",alignItems:"center",marginBottom:32}}>
              <p key={phase} style={{
                margin:0,
                fontFamily:"var(--font-display,'Sora',sans-serif)",
                fontWeight:600,fontSize:"1.1rem",color:"#edf0f7",
                animation:"phase-in .4s cubic-bezier(.22,1,.36,1) both",
                textAlign:"center",
              }}>
                {phase < 4 ? PHASES[Math.min(phase,3)].label : "Almost there…"}
                <span style={{animation:"phase-in .4s ease infinite alternate"}}>...</span>
              </p>
            </div>

            {/* Progress bar */}
            <div style={{width:320,maxWidth:"90vw"}}>
              <div style={{height:3,borderRadius:4,background:"rgba(255,255,255,.07)",overflow:"hidden"}}>
                <div style={{
                  height:"100%",borderRadius:4,
                  background:"linear-gradient(90deg,#7c3aed,#2563eb,#22d3ee,#7c3aed)",
                  backgroundSize:"200% 100%",
                  width:`${progress}%`,
                  transition:"width .4s ease",
                  animation:"shimmer-bar 2s linear infinite",
                }}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                {PHASES.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{
                      width:5,height:5,borderRadius:"50%",
                      background:i<=phase?"#7c3aed":"rgba(255,255,255,.15)",
                      boxShadow:i<=phase?"0 0 8px #7c3aed":undefined,
                      transition:"all .3s",
                    }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{marginTop:24,padding:"12px 20px",borderRadius:12,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",color:"#f87171",fontSize:".84rem",fontFamily:"var(--font-mono,monospace)",maxWidth:400,textAlign:"center"}}>
                {error}
              </div>
            )}
          </div>
        ) : agent ? (
          /* ── Success reveal ── */
          <div style={{
            width:"100%",maxWidth:520,
            animation:"card-in .6s cubic-bezier(.22,1,.36,1) both",
            position:"relative",zIndex:1,
          }}>
            {/* Success orb */}
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{
                width:80,height:80,borderRadius:"50%",margin:"0 auto 20px",
                background:`linear-gradient(135deg,${color},#22d3ee)`,
                boxShadow:`0 0 48px ${color}99,0 0 96px ${color}33`,
                display:"flex",alignItems:"center",justifyContent:"center",
                animation:"genesis-built .6s cubic-bezier(.22,1,.36,1) both",
              }}>
                <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:26,color:"#fff",letterSpacing:"-.04em"}}>{agent.name.slice(0,2).toUpperCase()}</span>
              </div>
              <p style={{margin:"0 0 4px",fontSize:".6rem",color:"rgba(168,85,247,.85)",fontFamily:"var(--font-mono,monospace)",letterSpacing:".22em",textTransform:"uppercase",fontWeight:600}}>Agent created</p>
              <h1 style={{margin:"0 0 6px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.8rem",color:"#edf0f7",letterSpacing:"-.03em"}}>
                Meet <span style={{background:`linear-gradient(90deg,${color},#22d3ee)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{agent.name}</span>
              </h1>
              <p style={{margin:0,fontSize:".84rem",color:"rgba(136,145,168,.75)"}}>{agent.tagline}</p>
            </div>

            {/* Card */}
            <div style={{
              background:"rgba(255,255,255,.03)",
              border:`1px solid rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},.25)`,
              borderRadius:20,overflow:"hidden",
              boxShadow:`0 0 60px ${color}15,0 24px 48px rgba(0,0,0,.4)`,
            }}>
              <div style={{height:3,background:`linear-gradient(90deg,${color},#22d3ee)`}}/>
              <div style={{padding:"24px 24px 20px",display:"flex",flexDirection:"column",gap:16}}>

                {/* Readiness */}
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{fontSize:".65rem",color:"rgba(136,145,168,.6)",fontFamily:"var(--font-mono,monospace)",letterSpacing:".1em",textTransform:"uppercase"}}>Agent readiness</span>
                    <span style={{fontSize:".65rem",fontFamily:"var(--font-mono,monospace)",fontWeight:700,color:scoreColor}}>{score}/100</span>
                  </div>
                  <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
                    <div style={{
                      height:"100%",borderRadius:4,width:`${score}%`,
                      background:score>=75?"linear-gradient(90deg,#34d399,#22d3ee)":score>=50?"linear-gradient(90deg,#fbbf24,#f59e0b)":"linear-gradient(90deg,#f87171,#ef4444)",
                      boxShadow:`0 0 8px ${scoreColor}`,
                      transition:"width 1.5s cubic-bezier(.22,1,.36,1) .3s",
                    }}/>
                  </div>
                  {agent.readiness_notes && (
                    <p style={{margin:"6px 0 0",fontSize:".72rem",color:"rgba(136,145,168,.55)",lineHeight:1.5}}>{agent.readiness_notes}</p>
                  )}
                </div>

                {/* URL */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"9px 13px"}}>
                  <span style={{flex:1,fontSize:".72rem",color:"rgba(136,145,168,.7)",fontFamily:"var(--font-mono,monospace)"}}>
                    easybuilda.com/<span style={{color}}>{agent.username}</span>
                  </span>
                  <a href={`/${agent.username}`} target="_blank" rel="noopener noreferrer" style={{color:"rgba(136,145,168,.6)",display:"flex"}}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                </div>

                {/* PIN */}
                {agent.leads_pin && (
                  <div style={{borderRadius:12,background:`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},.08)`,border:`1px solid ${color}33`,padding:"12px 15px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="4.5" width="9" height="5.5" rx="1.5" stroke={color} strokeWidth="1.2"/><path d="M3 4.5V3.5a2.5 2.5 0 015 0v1" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>
                        <span style={{fontSize:".6rem",color,fontFamily:"var(--font-mono,monospace)",letterSpacing:".1em",textTransform:"uppercase",fontWeight:600}}>Leads PIN — save this</span>
                      </div>
                      <button onClick={()=>setPinVis(!pinVis)} style={{background:"none",border:"none",cursor:"pointer",fontSize:".66rem",color:"rgba(136,145,168,.6)",fontFamily:"var(--font-mono,monospace)"}}>
                        {pinVis?"hide":"reveal"}
                      </button>
                    </div>
                    <div style={{fontFamily:"var(--font-mono,monospace)",fontWeight:700,fontSize:"1.5rem",color:"#edf0f7",letterSpacing:".2em"}}>
                      {pinVis ? agent.leads_pin.split("").join("  ") : "●  ●  ●  ●  ●  ●"}
                    </div>
                    <p style={{margin:"8px 0 0",fontSize:".68rem",color:"rgba(136,145,168,.5)",lineHeight:1.5}}>
                      This PIN protects your leads dashboard. Copy it now — it won't be shown again in full.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{padding:"12px 24px 20px",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",gap:8}}>
                <a href={`/${agent.username}`} target="_blank" rel="noopener noreferrer"
                  style={{flex:1,padding:"10px 0",borderRadius:10,textDecoration:"none",textAlign:"center",fontSize:".82rem",fontWeight:500,background:`${color}1a`,border:`1px solid ${color}33`,color,transition:"background .15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background=`${color}2e`)}
                  onMouseLeave={e=>(e.currentTarget.style.background=`${color}1a`)}>
                  View agent ↗
                </a>
                <button onClick={onDone}
                  style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",cursor:"pointer",fontSize:".82rem",fontWeight:600,fontFamily:"var(--font-display,'Sora',sans-serif)",color:"#fff",background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",boxShadow:"0 0 20px rgba(124,58,237,.4)",transition:"filter .15s,transform .15s"}}
                  onMouseEnter={e=>{(e.currentTarget.style.filter="brightness(1.1)");(e.currentTarget.style.transform="translateY(-1px)");}}
                  onMouseLeave={e=>{(e.currentTarget.style.filter="none");(e.currentTarget.style.transform="none");}}>
                  Go to dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* error fallback */
          <div style={{textAlign:"center",animation:"fade-in .4s ease both",position:"relative",zIndex:1}}>
            <p style={{margin:"0 0 8px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.1rem",color:"#f87171"}}>Something went wrong</p>
            <p style={{margin:"0 0 20px",fontSize:".83rem",color:"rgba(136,145,168,.7)"}}>{error || "Please try again."}</p>
            <button onClick={onDone} style={{padding:"10px 24px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#edf0f7",fontSize:".84rem",cursor:"pointer",fontFamily:"inherit"}}>
              Back to wizard
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
export default function BuildPage() {
  const [step,    setStep]    = useState<Step>(0);
  const [form,    setForm]    = useState<FormData>({ business_name:"", business_description:"", services:"", website_url:"", tone:"friendly" });
  const [genesis, setGenesis] = useState(false);
  const [agent,   setAgent]   = useState<BuiltAgent|null>(null);
  const [buildErr,setBuildErr]= useState("");
  const inputRef = useRef<HTMLTextAreaElement|HTMLInputElement|null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [step]);

  const set = (k: keyof FormData) => (v: string) => setForm(f => ({...f, [k]: v}));

  const canProceed = [
    form.business_name.trim().length >= 2 && form.business_description.trim().length >= 10,
    form.services.trim().length >= 5,
    true, // website optional
    !!form.tone,
  ][step] ?? false;

  const next = () => {
    if (step < 3) setStep(s => (s + 1) as Step);
    else startGenesis();
  };

  const startGenesis = useCallback(async () => {
    setGenesis(true);
    setBuildErr("");
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setBuildErr("Session expired. Please sign in."); return; }

      const res = await fetch(`${API}/api/agents/build`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${session.access_token}` },
        body: JSON.stringify({
          business_name: form.business_name.trim(),
          business_description: form.business_description.trim(),
          services: form.services.trim() || undefined,
          website_url: form.website_url.trim() || undefined,
          tone: form.tone,
          plan: "trial",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBuildErr(data.detail || "Build failed."); return; }
      setAgent(data.agent);
    } catch (e) {
      setBuildErr(String(e));
    }
  }, [form]);

  const steps = [
    {
      q: "Tell me about your business.",
      sub: "What do you do and who do you serve?",
      content: (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="wb-input" type="text" placeholder="Business name"
            value={form.business_name} onChange={e=>set("business_name")(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&e.preventDefault()}
          />
          <textarea
            className="wb-input wb-ta" placeholder="What does your business do? Who are your customers? What problem do you solve?"
            value={form.business_description}
            onChange={e=>set("business_description")(e.target.value)}
            rows={4}
          />
        </div>
      ),
    },
    {
      q: "What services or products do you offer?",
      sub: "The more detail, the smarter your agent.",
      content: (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className="wb-input wb-ta"
          placeholder="List your services, products, pricing (if public), packages, specialties..."
          value={form.services}
          onChange={e=>set("services")(e.target.value)}
          rows={5}
        />
      ),
    },
    {
      q: "Do you have a website?",
      sub: "Your agent will learn from it. Optional — skip if not.",
      content: (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className="wb-input" type="url" placeholder="https://yourbusiness.com (optional)"
          value={form.website_url} onChange={e=>set("website_url")(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&next()}
        />
      ),
    },
    {
      q: "What's your agent's personality?",
      sub: "Choose the voice that fits your brand.",
      content: (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {TONES.map(t=>(
            <button
              key={t.id}
              onClick={()=>set("tone")(t.id)}
              style={{
                padding:"14px 16px", borderRadius:14, cursor:"pointer",
                border:`1.5px solid ${form.tone===t.id?"rgba(124,58,237,.7)":"rgba(255,255,255,.09)"}`,
                background:form.tone===t.id?"rgba(124,58,237,.12)":"rgba(255,255,255,.03)",
                textAlign:"left", transition:"all .18s",
                boxShadow:form.tone===t.id?"0 0 20px rgba(124,58,237,.15)":"none",
              }}
              onMouseEnter={e=>{if(form.tone!==t.id)(e.currentTarget.style.borderColor="rgba(124,58,237,.3)");}}
              onMouseLeave={e=>{if(form.tone!==t.id)(e.currentTarget.style.borderColor="rgba(255,255,255,.09)");}}
            >
              <div style={{fontSize:"1.1rem",marginBottom:5,color:form.tone===t.id?"#a78bfa":"rgba(237,240,247,.6)"}}>{t.icon}</div>
              <p style={{margin:"0 0 3px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:600,fontSize:".85rem",color:form.tone===t.id?"#edf0f7":"rgba(237,240,247,.7)"}}>{t.label}</p>
              <p style={{margin:0,fontSize:".72rem",color:"rgba(136,145,168,.65)",lineHeight:1.4}}>{t.desc}</p>
            </button>
          ))}
        </div>
      ),
    },
  ];

  if (genesis) {
    return (
      <GenesisReveal
        agent={agent}
        error={buildErr}
        onDone={() => { window.location.href = "/dashboard"; }}
      />
    );
  }

  const current = steps[step];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes step-in  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes neb-drift{ 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.08) translate(-10px,8px)} }

        .wb-root {
          min-height:100vh; display:flex; flex-direction:column;
          background:#05070f;
          font-family:var(--font-sans,"Inter",ui-sans-serif,sans-serif);
          position:relative; overflow:hidden;
        }
        .wb-input {
          width:100%; padding:13px 16px; border-radius:12px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(124,58,237,.2);
          color:#edf0f7; font-size:.93rem; outline:none;
          transition:border-color .2s,box-shadow .2s;
          font-family:inherit; resize:none;
        }
        .wb-input:focus { border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,.18); }
        .wb-input::placeholder { color:rgba(136,145,168,.55); }
        .wb-ta { line-height:1.6; }

        .btn-next {
          padding:13px 28px; border-radius:12px; border:none; cursor:pointer;
          font-family:var(--font-display,"Sora","Inter",inherit);
          font-weight:700; font-size:.93rem; color:#fff;
          background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9);
          box-shadow:0 0 28px rgba(124,58,237,.45),0 4px 16px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.18);
          transition:filter .2s,transform .2s;
          position:relative; overflow:hidden;
        }
        .btn-next:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
        .btn-next:disabled { opacity:.35; cursor:not-allowed; transform:none; }
        .btn-back {
          padding:13px 20px; border-radius:12px; border:1px solid rgba(255,255,255,.1);
          background:rgba(255,255,255,.04); color:rgba(136,145,168,.8);
          font-family:inherit; font-size:.9rem; cursor:pointer;
          transition:all .18s;
        }
        .btn-back:hover { background:rgba(255,255,255,.08); color:#edf0f7; }
      `}</style>

      <div className="wb-root">
        {/* Nebula */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          <div style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 65%)",animation:"neb-drift 14s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:"-15%",left:"-5%",width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,.07) 0%,transparent 65%)",animation:"neb-drift 18s ease-in-out infinite",animationDelay:"-6s"}}/>
        </div>

        {/* Header */}
        <header style={{position:"relative",zIndex:2,padding:"20px 28px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(5,7,15,.8)",backdropFilter:"blur(20px)"}}>
          <a href="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:9,textDecoration:"none"}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#a855f7,#7c3aed 45%,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(124,58,237,.45)"}}>
              <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:13,color:"#fff",letterSpacing:"-.03em"}}>E</span>
            </div>
            <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:".9rem",color:"#edf0f7",letterSpacing:"-.01em"}}>EasyBuilda</span>
          </a>
        </header>

        {/* Main */}
        <main style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 24px",position:"relative",zIndex:1}}>
          <div style={{width:"100%",maxWidth:520}}>

            {/* Progress dots */}
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:40}}>
              {steps.map((_,i)=>(
                <div key={i} style={{
                  width:i===step?24:7,height:7,borderRadius:4,
                  background:i<step?"#7c3aed":i===step?"linear-gradient(90deg,#7c3aed,#22d3ee)":"rgba(255,255,255,.12)",
                  transition:"all .3s cubic-bezier(.22,1,.36,1)",
                  boxShadow:i===step?"0 0 10px rgba(124,58,237,.6)":undefined,
                }}/>
              ))}
            </div>

            {/* Question + content */}
            <div key={step} style={{animation:"step-in .4s cubic-bezier(.22,1,.36,1) both"}}>
              <p style={{margin:"0 0 6px",fontSize:".62rem",color:"rgba(168,85,247,.85)",fontFamily:"var(--font-mono,monospace)",letterSpacing:".2em",textTransform:"uppercase",fontWeight:600}}>
                Step {step+1} of {steps.length}
              </p>
              <h2 style={{margin:"0 0 8px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.6rem",color:"#edf0f7",letterSpacing:"-.025em",lineHeight:1.2}}>
                {current.q}
              </h2>
              <p style={{margin:"0 0 28px",fontSize:".84rem",color:"rgba(136,145,168,.7)",lineHeight:1.5}}>
                {current.sub}
              </p>

              {current.content}
            </div>

            {/* Nav */}
            <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
              {step > 0 && (
                <button className="btn-back" onClick={()=>setStep(s=>(s-1) as Step)}>
                  ← Back
                </button>
              )}
              <button className="btn-next" onClick={next} disabled={!canProceed}>
                {step === 3 ? "Create my agent ✦" : "Continue →"}
              </button>
            </div>

            {/* Skip for optional step */}
            {step === 2 && (
              <p style={{textAlign:"center",marginTop:14,fontSize:".76rem",color:"rgba(136,145,168,.45)"}}>
                <button onClick={next} style={{background:"none",border:"none",color:"rgba(56,189,248,.6)",cursor:"pointer",fontFamily:"inherit",fontSize:".76rem"}}>
                  Skip — I don't have a website
                </button>
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}