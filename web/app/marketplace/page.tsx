"use client";

import { useState } from "react";

// Pre-built agent templates marketplace
const TEMPLATES = [
  {
    id: "t1", emoji:"🍽️", name:"Bella",        industry:"Restaurant",      business:"Any Restaurant",
    tagline:"Books reservations, answers menu questions, handles delivery.", color:"#f97316", price:"free",
    features:["Menu answers","Reservation booking","Hours & location","Delivery info","Dietary filters"],
    preview_q:["Do you take reservations?","What's on the menu?","Do you offer vegan options?"],
  },
  {
    id: "t2", emoji:"🏥", name:"Medic",         industry:"Medical Clinic",  business:"Any Clinic",
    tagline:"Handles appointment booking, insurance questions, and new patient intake.", color:"#0ea5e9", price:"free",
    features:["Appointment booking","Insurance questions","New patient guide","Hours & location","Emergency triage"],
    preview_q:["Do you accept my insurance?","How do I book an appointment?","What should I bring?"],
  },
  {
    id: "t3", emoji:"🏠", name:"Rex",            industry:"Real Estate",     business:"Real Estate Agent",
    tagline:"Qualifies buyers, books viewings, answers property questions.", color:"#10b981", price:"free",
    features:["Property inquiries","Viewing bookings","Buyer qualification","Area expertise","Mortgage guidance"],
    preview_q:["Is this property available?","Can I book a viewing?","What's the neighborhood like?"],
  },
  {
    id: "t4", emoji:"⚖️", name:"Lex",            industry:"Law Firm",        business:"Any Law Firm",
    tagline:"Explains practice areas, books consultations, handles initial inquiries.", color:"#8b5cf6", price:"free",
    features:["Practice area guide","Consultation booking","FAQ handling","Document checklist","Urgent triage"],
    preview_q:["Do you handle my case type?","How much does a consultation cost?","What documents do I need?"],
  },
  {
    id: "t5", emoji:"💅", name:"Glam",           industry:"Beauty & Spa",    business:"Salon / Spa",
    tagline:"Books appointments, answers service questions, promotes offers.", color:"#ec4899", price:"free",
    features:["Appointment booking","Service menu","Pricing answers","Aftercare advice","Promotions"],
    preview_q:["What services do you offer?","Can I book a cut and color?","Do you have weekend slots?"],
  },
  {
    id: "t6", emoji:"🎯", name:"Coach",          industry:"Coaching",        business:"Life / Business Coach",
    tagline:"Qualifies clients, explains programs, books discovery calls.", color:"#f59e0b", price:"free",
    features:["Program explanation","Client qualification","Discovery call booking","Results showcase","Payment plans"],
    preview_q:["What programs do you offer?","How long is the coaching?","Can I book a free call?"],
  },
  {
    id: "t7", emoji:"🛍️", name:"Shop",           industry:"E-Commerce",      business:"Online Store",
    tagline:"Handles shipping questions, returns, and product inquiries.", color:"#6366f1", price:"free",
    features:["Shipping & tracking","Returns & refunds","Product questions","Stock availability","Discount codes"],
    preview_q:["What's your return policy?","Do you ship internationally?","Is this in stock?"],
  },
  {
    id: "t8", emoji:"🏋️", name:"Fit",            industry:"Gym & Fitness",   business:"Gym / Studio",
    tagline:"Handles membership inquiries, class schedules, and trial sign-ups.", color:"#34d399", price:"free",
    features:["Membership options","Class schedule","Trial booking","Personal training","Facilities"],
    preview_q:["Do you offer a free trial?","What classes do you have?","What are your membership prices?"],
  },
];

const CATEGORIES = ["All","Restaurant","Medical Clinic","Real Estate","Law Firm","Beauty & Spa","Coaching","E-Commerce","Gym & Fitness"];

function TemplateCard({ t, onPreview, onUse }: { t: typeof TEMPLATES[0]; onPreview:(t:typeof TEMPLATES[0])=>void; onUse:(t:typeof TEMPLATES[0])=>void }) {
  const h   = t.color.replace("#","");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:18, overflow:"hidden", display:"flex", flexDirection:"column", transition:"all 0.2s" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=`rgba(${rgb},0.35)`;(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="rgba(237,240,247,0.08)";(e.currentTarget as HTMLDivElement).style.transform="none";}}>
      <div style={{ height:3, background:`linear-gradient(90deg,${t.color},#22d3ee)` }}/>
      <div style={{ padding:"18px 18px 14px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${t.color},#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:`0 0 18px rgba(${rgb},0.3)` }}>
            {t.emoji}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <h3 style={{ margin:0, fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.92rem", color:"#edf0f7" }}>{t.name}</h3>
              <span style={{ padding:"1px 7px", borderRadius:100, background:`rgba(${rgb},0.12)`, color:t.color, fontSize:"0.62rem", fontWeight:700 }}>{t.industry}</span>
            </div>
            <p style={{ margin:0, fontSize:"0.75rem", color:"rgba(237,240,247,0.5)" }}>{t.business}</p>
          </div>
          <span style={{ padding:"3px 9px", borderRadius:100, background:"rgba(52,211,153,0.12)", color:"#34d399", fontSize:"0.65rem", fontWeight:700, border:"1px solid rgba(52,211,153,0.25)", flexShrink:0 }}>FREE</span>
        </div>
        <p style={{ margin:"0 0 12px", fontSize:"0.8rem", color:"rgba(237,240,247,0.6)", lineHeight:1.55 }}>{t.tagline}</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
          {t.features.slice(0,3).map(f => (
            <span key={f} style={{ padding:"3px 9px", borderRadius:100, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.08)", fontSize:"0.68rem", color:"rgba(237,240,247,0.5)" }}>{f}</span>
          ))}
          {t.features.length > 3 && <span style={{ padding:"3px 9px", borderRadius:100, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.08)", fontSize:"0.68rem", color:"rgba(237,240,247,0.3)" }}>+{t.features.length-3} more</span>}
        </div>
      </div>
      <div style={{ padding:"0 18px 16px", marginTop:"auto", display:"flex", gap:8 }}>
        <button onClick={() => onPreview(t)} style={{ flex:1, padding:"8px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.1)", color:"rgba(237,240,247,0.6)", fontSize:"0.78rem", cursor:"pointer", fontFamily:"inherit" }}>
          Preview
        </button>
        <button onClick={() => onUse(t)} style={{ flex:2, padding:"8px", borderRadius:10, background:`rgba(${rgb},0.12)`, border:`1px solid rgba(${rgb},0.3)`, color:t.color, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Use template →
        </button>
      </div>
    </div>
  );
}

function PreviewModal({ t, onClose, onUse }: { t: typeof TEMPLATES[0]; onClose:()=>void; onUse:(t:typeof TEMPLATES[0])=>void }) {
  const [msgs, setMsgs] = useState<{role:string;content:string}[]>([
    { role:"assistant", content:`Hi! I'm ${t.name}, your AI assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput("");
    setMsgs(p => [...p, { role:"user", content:q }]);
    setTimeout(() => {
      setMsgs(p => [...p, { role:"assistant", content:`Thanks for asking! I'd be happy to help with that. This is a preview — when you build your agent, I'll answer based on your actual business information. For now, this gives you a feel for how ${t.name} would respond to your customers.` }]);
    }, 800);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"#0a0f1e", border:"1px solid rgba(237,240,247,0.1)", borderRadius:22, overflow:"hidden", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${t.color},#22d3ee)` }}/>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(237,240,247,0.07)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${t.color},#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{t.emoji}</div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.88rem", color:"#edf0f7" }}>{t.name}</p>
            <p style={{ margin:0, fontSize:"0.68rem", color:"rgba(237,240,247,0.4)" }}>{t.tagline}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(237,240,247,0.4)", cursor:"pointer", fontSize:20 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
          {msgs.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"80%", padding:"9px 13px", borderRadius:m.role==="user"?"15px 15px 4px 15px":"15px 15px 15px 4px", background:m.role==="user"?`rgba(124,58,237,0.2)`:"rgba(255,255,255,0.05)", border:`1px solid ${m.role==="user"?"rgba(124,58,237,0.3)":"rgba(237,240,247,0.07)"}`, fontSize:"0.82rem", color:"#edf0f7", lineHeight:1.6 }}>
                {m.content}
              </div>
            </div>
          ))}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
            {t.preview_q.map(q => (
              <button key={q} onClick={() => { setInput(q); }} style={{ padding:"5px 11px", borderRadius:100, background:`rgba(124,58,237,0.08)`, border:"1px solid rgba(124,58,237,0.2)", color:"rgba(237,240,247,0.65)", fontSize:"0.72rem", cursor:"pointer", fontFamily:"inherit" }}>{q}</button>
            ))}
          </div>
        </div>
        <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(237,240,247,0.07)", display:"flex", gap:8, alignItems:"center" }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a question…" style={{ flex:1, padding:"8px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.1)", borderRadius:10, color:"#edf0f7", fontSize:"0.84rem", fontFamily:"inherit", outline:"none" }}/>
          <button onClick={send} style={{ width:36, height:36, borderRadius:"50%", background:t.color, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M15.5 2.5L8.5 9.5M15.5 2.5L11 16L8.5 9.5M15.5 2.5L2.5 7L8.5 9.5" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div style={{ padding:"10px 14px 14px" }}>
          <button onClick={() => onUse(t)} style={{ width:"100%", padding:"10px", borderRadius:11, background:`linear-gradient(135deg,${t.color},#2563eb)`, border:"none", color:"#fff", fontWeight:700, fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit" }}>
            Use this template — build my agent →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [category, setCategory] = useState("All");
  const [query,    setQuery]    = useState("");
  const [preview,  setPreview]  = useState<typeof TEMPLATES[0]|null>(null);

  const useTemplate = (t: typeof TEMPLATES[0]) => {
    window.location.href = `/auth/login?template=${t.id}`;
  };

  const filtered = TEMPLATES.filter(t => {
    if (category !== "All" && t.industry !== category) return false;
    if (query) return [t.name,t.industry,t.tagline,t.business].some(f=>f.toLowerCase().includes(query.toLowerCase()));
    return true;
  });

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:600px){.mkt-grid{grid-template-columns:1fr!important}}
        .cat-btn{padding:6px 14px;border-radius:100px;border:1px solid rgba(237,240,247,0.08);background:transparent;color:rgba(237,240,247,0.5);font-size:0.76rem;cursor:pointer;transition:all 0.15s;font-family:inherit;white-space:nowrap}
        .cat-btn.on{background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.4);color:#a78bfa}
      `}</style>

      {preview && <PreviewModal t={preview} onClose={() => setPreview(null)} onUse={t => { setPreview(null); useTemplate(t); }}/>}

      <div style={{ minHeight:"100vh", background:"#05070f", color:"#edf0f7", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased" }}>
        <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
          <div style={{ position:"absolute", top:"-15vh", right:"-10vw", width:"50vw", height:"50vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.09),transparent 65%)", filter:"blur(40px)" }}/>
        </div>

        {/* Nav */}
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, display:"flex", justifyContent:"center", padding:"1rem" }}>
          <div style={{ width:"100%", maxWidth:1100, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(8,12,24,0.72)", border:"1px solid rgba(237,240,247,0.08)", backdropFilter:"blur(20px)", borderRadius:18, padding:"0.6rem 0.75rem 0.6rem 1.25rem" }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#fff" }}>E</div>
              <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.9rem", color:"#edf0f7" }}>EasyBuilda</span>
            </a>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", fontWeight:700, fontSize:"0.84rem", padding:"0.5rem 1.1rem", borderRadius:10, textDecoration:"none" }}>
              Build custom →
            </a>
          </div>
        </header>

        <main style={{ position:"relative", zIndex:1, paddingTop:"6rem" }}>
          <section style={{ textAlign:"center", padding:"3rem 1.5rem 2rem", maxWidth:640, margin:"0 auto", animation:"fadeIn 0.35s ease both" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"#7c3aed", marginBottom:"1rem" }}>Agent Marketplace</p>
            <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2rem,5vw,2.8rem)", letterSpacing:"-0.025em", marginBottom:"1rem" }}>
              Ready-made AI agents.<br/>Live in 2 minutes.
            </h1>
            <p style={{ fontSize:"0.95rem", color:"rgba(237,240,247,0.6)", marginBottom:"2rem", lineHeight:1.65 }}>
              Pick a pre-built agent template for your industry, customize it with your business info, and go live instantly.
            </p>
            <div style={{ position:"relative", maxWidth:360, margin:"0 auto" }}>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search templates…"
                style={{ width:"100%", padding:"10px 16px 10px 38px", boxSizing:"border-box", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.1)", borderRadius:12, color:"#edf0f7", fontSize:"0.86rem", fontFamily:"inherit", outline:"none" }}
                onFocus={e=>(e.target.style.borderColor="rgba(124,58,237,0.45)")}
                onBlur={e=>(e.target.style.borderColor="rgba(237,240,247,0.1)")}/>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(237,240,247,0.3)", pointerEvents:"none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
            </div>
          </section>

          {/* Category filters */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", padding:"0 1.5rem 2rem" }}>
            {CATEGORIES.map(c => (
              <button key={c} className={`cat-btn${category===c?" on":""}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>

          {/* Grid */}
          <section style={{ padding:"0 1.5rem 6rem", maxWidth:1060, margin:"0 auto" }}>
            <p style={{ margin:"0 0 18px", fontSize:"0.78rem", color:"rgba(237,240,247,0.4)" }}>{filtered.length} template{filtered.length!==1?"s":""} — all free</p>
            <div className="mkt-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:"1rem", animation:"fadeIn 0.25s ease both" }}>
              {filtered.map(t => <TemplateCard key={t.id} t={t} onPreview={setPreview} onUse={useTemplate}/>)}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign:"center", padding:"64px 24px", color:"rgba(237,240,247,0.4)", fontSize:"0.9rem" }}>
                No templates match. <a href="/auth/login" style={{ color:"#a78bfa", textDecoration:"none" }}>Build a custom agent instead →</a>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}