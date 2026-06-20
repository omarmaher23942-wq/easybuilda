"use client";

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><polyline points="9 4 13 8 9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

const TIERS = [
  {
    name: "Partner",
    emoji: "🤝",
    color: "#38bdf8",
    rgb: "56,189,248",
    clients: "1–5 clients",
    commission: "15%",
    perks: [
      "Manage up to 5 client accounts",
      "Shared dashboard view",
      "15% revenue share on client payments",
      "Partner badge on your profile",
      "Email support priority",
    ],
    cta: "Become a Partner",
  },
  {
    name: "Pro Partner",
    emoji: "⭐",
    color: "#a78bfa",
    rgb: "167,139,250",
    clients: "5–20 clients",
    commission: "20%",
    popular: true,
    perks: [
      "Manage up to 20 client accounts",
      "White-label agent branding",
      "20% revenue share",
      "Dedicated partner dashboard",
      "Priority support & onboarding calls",
      "Partner directory listing",
    ],
    cta: "Apply for Pro Partner",
  },
  {
    name: "Agency",
    emoji: "🏢",
    color: "#34d399",
    rgb: "52,211,153",
    clients: "20+ clients",
    commission: "25%",
    perks: [
      "Unlimited client accounts",
      "Full white-label platform",
      "25% revenue share",
      "Custom subdomain (agency.easybuilda.com)",
      "Dedicated account manager",
      "Co-marketing opportunities",
      "Early access to new features",
    ],
    cta: "Apply for Agency",
  },
];

const HOW = [
  { n:"1", title:"Apply",          desc:"Fill out the partner application. We review within 48 hours." },
  { n:"2", title:"Get onboarded",  desc:"We help you set up your first client agent together on a call." },
  { n:"3", title:"Manage clients", desc:"Build and manage AI agents for your clients from your partner dashboard." },
  { n:"4", title:"Earn revenue",   desc:"Get your commission paid monthly directly to your wallet." },
];

const FAQS = [
  { q:"How does the commission work?", a:"For every dollar your client pays EasyBuilda, you earn your commission rate. Paid monthly to your EasyBuilda wallet." },
  { q:"Can I white-label the agents?",  a:"Pro Partners and Agency tiers can remove EasyBuilda branding from agents and add their own." },
  { q:"Do my clients need their own accounts?", a:"Yes — each client has their own EasyBuilda account. You get shared access to manage their agents." },
  { q:"What kind of businesses can I sign as clients?", a:"Any business — restaurants, clinics, real estate, law firms, e-commerce, coaches. The more diverse your clients, the more you earn." },
  { q:"How do I get paid?", a:"Commission is added to your EasyBuilda wallet monthly. You can then withdraw via bank transfer." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:14, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"1rem 1.25rem", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:"0.92rem", fontWeight:500, color:"rgba(237,240,247,1)" }}>{q}</span>
        <span style={{ color:"rgba(237,240,247,0.4)", fontSize:18, flexShrink:0 }}>{open?"−":"+"}</span>
      </button>
      {open && <div style={{ padding:"0 1.25rem 1rem", fontSize:"0.88rem", color:"rgba(237,240,247,0.6)", lineHeight:1.7 }}>{a}</div>}
    </div>
  );
}

import { useState } from "react";

export default function AgencyPartnerPage() {
  const [formData, setFormData] = useState({ name:"", email:"", agency:"", clients:"", tier:"partner", message:"" });
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Send to support email
    await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: 100,
        messages: [{ role:"user", content:`Partner application submitted from ${formData.email}` }]
      })
    }).catch(() => {});
    setSubmitted(true);
  };

  const line = "rgba(237,240,247,0.08)";

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .inp{width:100%;padding:10px 13px;background:rgba(255,255,255,0.04);border:1px solid rgba(237,240,247,0.1);border-radius:10px;color:#edf0f7;font-size:0.88rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box} .inp:focus{border-color:rgba(124,58,237,0.5)} select.inp option{background:#111827}`}</style>

      <div style={{ minHeight:"100vh", background:"#05070f", color:"#edf0f7", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased", overflowX:"hidden" }}>

        <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
          <div style={{ position:"absolute", top:"-20vh", left:"-10vw", width:"60vw", height:"60vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.08),transparent 65%)", filter:"blur(40px)" }}/>
        </div>

        {/* Nav */}
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, display:"flex", justifyContent:"center", padding:"1rem" }}>
          <div style={{ width:"100%", maxWidth:1100, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(8,12,24,0.72)", border:`1px solid ${line}`, backdropFilter:"blur(20px)", borderRadius:18, padding:"0.6rem 0.75rem 0.6rem 1.25rem" }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#fff" }}>E</div>
              <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.9rem", color:"#edf0f7" }}>EasyBuilda</span>
            </a>
            <a href="/pricing" style={{ fontSize:"0.84rem", color:"rgba(237,240,247,0.6)", textDecoration:"none" }}>Pricing</a>
          </div>
        </header>

        <main style={{ position:"relative", zIndex:1, paddingTop:"6rem" }}>

          {/* Hero */}
          <section style={{ textAlign:"center", padding:"4rem 1.5rem 3rem", maxWidth:680, margin:"0 auto", animation:"fadeIn 0.4s ease both" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"#34d399", marginBottom:"1rem" }}>Agency Partner Network</p>
            <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2rem,5vw,3rem)", letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:"1.2rem" }}>
              Build AI agents for clients.<br/>Earn recurring revenue.
            </h1>
            <p style={{ fontSize:"1rem", color:"rgba(237,240,247,0.65)", lineHeight:1.65, maxWidth:500, margin:"0 auto" }}>
              Join the EasyBuilda Agency Partner Network. Help businesses get AI agents — and earn up to 25% on every payment they make.
            </p>
          </section>

          {/* How it works */}
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:900, margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:"1rem" }}>
              {HOW.map(s => (
                <div key={s.n} style={{ padding:"1.4rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${line}`, borderRadius:16 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#7c3aed,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"1rem", color:"#fff", marginBottom:10 }}>{s.n}</div>
                  <p style={{ margin:"0 0 4px", fontWeight:700, fontSize:"0.9rem", color:"#edf0f7" }}>{s.title}</p>
                  <p style={{ margin:0, fontSize:"0.8rem", color:"rgba(237,240,247,0.5)", lineHeight:1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tiers */}
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:980, margin:"0 auto" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"#7c3aed", marginBottom:"2rem", textAlign:"center" }}>Partner tiers</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1rem" }}>
              {TIERS.map(t => (
                <div key={t.name} style={{ background:t.popular?"rgba(167,139,250,0.04)":"rgba(255,255,255,0.025)", border:`1px solid ${t.popular?"rgba(167,139,250,0.3)":line}`, borderRadius:20, padding:"1.6rem", position:"relative" }}>
                  {t.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.12em", padding:"0.2rem 0.8rem", borderRadius:100 }}>MOST POPULAR</div>}
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>{t.emoji}</div>
                  <h3 style={{ margin:"0 0 4px", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.1rem", color:t.color }}>{t.name}</h3>
                  <p style={{ margin:"0 0 12px", fontSize:"0.82rem", color:"rgba(237,240,247,0.5)" }}>{t.clients}</p>
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2rem", color:"#edf0f7", marginBottom:"1rem" }}>
                    {t.commission}<span style={{ fontSize:"0.9rem", fontWeight:400, color:"rgba(237,240,247,0.5)", marginLeft:4 }}>commission</span>
                  </div>
                  <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.4rem", display:"flex", flexDirection:"column", gap:8 }}>
                    {t.perks.map(p => (
                      <li key={p} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.83rem", color:"rgba(237,240,247,0.8)" }}>
                        <span style={{ color:t.color, flexShrink:0 }}>✓</span> {p}
                      </li>
                    ))}
                  </ul>
                  <a href="#apply" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"0.75rem", borderRadius:12, background:t.popular?`linear-gradient(135deg,#7c3aed,${t.color})`:`rgba(${t.rgb},0.1)`, border:t.popular?"none":`1px solid rgba(${t.rgb},0.3)`, color:t.popular?"#fff":t.color, fontWeight:700, fontSize:"0.86rem", textDecoration:"none" }}>
                    {t.cta} <Arrow/>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Application Form */}
          <section id="apply" style={{ padding:"0 1.5rem 4rem", maxWidth:560, margin:"0 auto" }}>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.6rem", textAlign:"center", marginBottom:"2rem" }}>Apply to partner</h2>
            {submitted ? (
              <div style={{ textAlign:"center", padding:"3rem 2rem", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:20 }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>✓</div>
                <h3 style={{ margin:"0 0 8px", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.2rem" }}>Application received!</h3>
                <p style={{ color:"rgba(237,240,247,0.6)", fontSize:"0.88rem" }}>We'll review your application and get back to you within 48 hours.</p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12, background:"rgba(255,255,255,0.025)", border:`1px solid ${line}`, borderRadius:20, padding:"2rem" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Full name *</label>
                    <input className="inp" required value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))} placeholder="Your name"/>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Email *</label>
                    <input className="inp" type="email" required value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))} placeholder="you@agency.com"/>
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Agency / Company name</label>
                  <input className="inp" value={formData.agency} onChange={e=>setFormData(p=>({...p,agency:e.target.value}))} placeholder="Your agency name (optional)"/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Potential clients *</label>
                    <select className="inp" required value={formData.clients} onChange={e=>setFormData(p=>({...p,clients:e.target.value}))}>
                      <option value="">Select</option>
                      <option value="1-5">1–5 clients</option>
                      <option value="5-20">5–20 clients</option>
                      <option value="20+">20+ clients</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Desired tier</label>
                    <select className="inp" value={formData.tier} onChange={e=>setFormData(p=>({...p,tier:e.target.value}))}>
                      <option value="partner">Partner (15%)</option>
                      <option value="pro">Pro Partner (20%)</option>
                      <option value="agency">Agency (25%)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Tell us about your clients</label>
                  <textarea className="inp" rows={3} value={formData.message} onChange={e=>setFormData(p=>({...p,message:e.target.value}))} placeholder="What industries do your clients work in? How did you hear about us?" style={{ resize:"none" }}/>
                </div>
                <button type="submit" style={{ padding:"0.85rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.92rem", cursor:"pointer", marginTop:4 }}>
                  Submit application →
                </button>
              </form>
            )}
          </section>

          {/* FAQ */}
          <section style={{ padding:"0 1.5rem 6rem", maxWidth:660, margin:"0 auto" }}>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.4rem", textAlign:"center", marginBottom:"1.5rem" }}>Common questions</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a}/>)}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}