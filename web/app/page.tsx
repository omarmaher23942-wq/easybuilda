"use client";

import { useState, useEffect } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <polyline points="9 4 13 8 9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const INDUSTRIES = [
  { emoji:"🍽️", label:"Restaurants",    href:"/industry/restaurant"   },
  { emoji:"🏥", label:"Clinics",         href:"/industry/clinic"       },
  { emoji:"🏠", label:"Real Estate",     href:"/industry/real-estate"  },
  { emoji:"⚖️", label:"Law Firms",       href:"/industry/law"          },
  { emoji:"🛍️", label:"E-Commerce",      href:"/industry/ecommerce"    },
  { emoji:"🎯", label:"Coaches",         href:"/industry/coach"        },
];

const HOW = [
  { n:"1", title:"Describe your business", desc:"Tell our AI about what you do. Takes 5 minutes." },
  { n:"2", title:"We build your agent",    desc:"Our AI builds a complete agent — personality, knowledge, FAQs." },
  { n:"3", title:"Share the link",         desc:"Share your agent URL. Customers can chat 24/7 instantly." },
];

const TESTIMONIALS = [
  { name:"Ahmed K.",     role:"Restaurant owner",    text:"My agent books 8–12 extra reservations a week on autopilot. Best $29 I spend every month.", color:"#f97316" },
  { name:"Sara M.",      role:"Clinic receptionist", text:"We stopped missing calls outside hours. Patients get answers at 11pm and show up the next day.", color:"#0ea5e9" },
  { name:"Omar R.",      role:"Real estate agent",   text:"I was losing leads on weekends. Now my agent qualifies buyers while I'm at the gym.", color:"#10b981" },
];

const STATS = [
  { value:"3 min",  label:"Average setup time"      },
  { value:"24/7",   label:"Always-on availability"  },
  { value:"$0",     label:"To start — no card"      },
  { value:"100%",   label:"Your data, your control" },
];

function NavLink({ href, children }: { href:string; children:React.ReactNode }) {
  return (
    <a href={href} style={{ fontSize:"0.86rem", color:"rgba(237,240,247,0.6)", textDecoration:"none", padding:"0.4rem 0.6rem", transition:"color 0.15s" }}
      onMouseEnter={e=>(e.currentTarget.style.color="#edf0f7")}
      onMouseLeave={e=>(e.currentTarget.style.color="rgba(237,240,247,0.6)")}>
      {children}
    </a>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<{ total_agents:number; total_businesses:number }|null>(null);

  useEffect(() => {
    fetch(`${API}/api/agents/stats/public`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  const line = "rgba(237,240,247,0.08)";

  return (
    <div style={{ minHeight:"100vh", background:"#05070f", color:"#edf0f7", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased", overflowX:"hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .btn-primary { display:inline-flex;align-items:center;gap:8px;padding:0.9rem 2rem;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);color:#fff;font-weight:700;font-size:0.98rem;text-decoration:none;box-shadow:0 0 32px rgba(124,58,237,0.4);transition:all 0.2s;border:none;cursor:pointer;font-family:inherit }
        .btn-primary:hover { filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 0 44px rgba(124,58,237,0.55) }
        .btn-ghost { display:inline-flex;align-items:center;gap:7px;padding:0.88rem 1.6rem;border-radius:13px;background:rgba(255,255,255,0.05);border:1px solid rgba(237,240,247,0.14);color:#edf0f7;font-weight:600;font-size:0.94rem;text-decoration:none;transition:all 0.2s }
        .btn-ghost:hover { background:rgba(255,255,255,0.09);border-color:rgba(237,240,247,0.25) }
        .card { background:rgba(255,255,255,0.03);border:1px solid ${line};border-radius:20px;padding:1.6rem;transition:all 0.2s }
        .card:hover { border-color:rgba(237,240,247,0.14);background:rgba(255,255,255,0.05);transform:translateY(-2px) }
        .ind-pill { display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:100px;border:1px solid ${line};background:rgba(255,255,255,0.03);text-decoration:none;color:rgba(237,240,247,0.7);font-size:0.86rem;transition:all 0.2s;white-space:nowrap }
        .ind-pill:hover { border-color:rgba(237,240,247,0.22);color:#edf0f7;background:rgba(255,255,255,0.06) }
      `}</style>

      {/* Ambient blobs */}
      <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-25vh", right:"-15vw", width:"70vw", height:"70vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.14),transparent 65%)", filter:"blur(50px)" }}/>
        <div style={{ position:"absolute", bottom:"-20vh", left:"-12vw", width:"60vw", height:"60vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,0.09),transparent 65%)", filter:"blur(50px)" }}/>
      </div>

      {/* Navbar */}
      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, display:"flex", justifyContent:"center", padding:"1rem 1rem 0" }}>
        <div style={{ width:"100%", maxWidth:1100, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(5,7,15,0.72)", border:`1px solid ${line}`, backdropFilter:"blur(24px)", borderRadius:18, padding:"0.6rem 0.75rem 0.6rem 1.25rem" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <svg viewBox="0 0 1024 1024" width={26} height={26}>
              <defs><linearGradient id="hLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#a855f7"/><stop offset="0.34" stopColor="#7c3aed"/>
                <stop offset="0.68" stopColor="#2563eb"/><stop offset="1" stopColor="#22d3ee"/>
              </linearGradient></defs>
              <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#hLogo)"/>
            </svg>
            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1rem", color:"#edf0f7", letterSpacing:"-0.01em" }}>EasyBuilda</span>
          </a>

          <nav style={{ display:"flex", alignItems:"center", gap:2 }}>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/explore">Explore</NavLink>
            <NavLink href="/marketplace">Templates</NavLink>
            <NavLink href="/partners">Partners</NavLink>
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/auth/login" style={{ fontSize:"0.86rem", color:"rgba(237,240,247,0.6)", textDecoration:"none", padding:"0.5rem 0.8rem" }}>Log in</a>
            <a href="/auth/login" className="btn-primary" style={{ padding:"0.5rem 1.1rem", fontSize:"0.86rem" }}>
              Start free <Arrow/>
            </a>
          </div>
        </div>
      </header>

      <main style={{ position:"relative", zIndex:1 }}>

        {/* ── Hero ── */}
        <section style={{ textAlign:"center", padding:"9rem 1.5rem 5rem", maxWidth:760, margin:"0 auto", animation:"fadeIn 0.5s ease both" }}>
          {stats && stats.total_businesses > 0 && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", fontSize:"0.78rem", color:"#34d399", marginBottom:"1.5rem" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 6px #34d399" }}/>
              {stats.total_agents}+ agents live · {stats.total_businesses}+ businesses
            </div>
          )}

          <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2.4rem,6vw,4rem)", lineHeight:1.06, letterSpacing:"-0.03em", marginBottom:"1.4rem" }}>
            Your business,{" "}
            <span style={{ background:"linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              answering customers
            </span>
            {" "}24/7.
          </h1>

          <p style={{ fontSize:"1.12rem", color:"rgba(237,240,247,0.65)", lineHeight:1.7, maxWidth:540, margin:"0 auto 2.5rem" }}>
            Build a professional AI agent for your business in 3 minutes — no code, no technical skills. Capture leads while you sleep.
          </p>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/auth/login" className="btn-primary">Build my agent free <Arrow/></a>
            <a href="/explore" className="btn-ghost">See live agents →</a>
          </div>

          <p style={{ marginTop:"1.4rem", fontSize:"0.78rem", color:"rgba(237,240,247,0.35)" }}>
            3-day free trial · No credit card · Live in minutes
          </p>
        </section>

        {/* ── Stats ── */}
        <section style={{ padding:"0 1.5rem 5rem", maxWidth:900, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"1rem" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"1.6rem 1rem", background:"rgba(255,255,255,0.025)", border:`1px solid ${line}`, borderRadius:18 }}>
                <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2.2rem", background:"linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", lineHeight:1, marginBottom:"0.5rem" }}>
                  {s.value}
                </div>
                <div style={{ fontSize:"0.84rem", color:"rgba(237,240,247,0.5)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Industries ── */}
        <section style={{ padding:"0 1.5rem 5rem", maxWidth:900, margin:"0 auto", textAlign:"center" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"1rem" }}>Works for every industry</p>
          <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.6rem,3.5vw,2.2rem)", letterSpacing:"-0.02em", marginBottom:"2rem" }}>
            Whatever you do, we build it.
          </h2>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.65rem", justifyContent:"center" }}>
            {INDUSTRIES.map(i => (
              <a key={i.label} href={i.href} className="ind-pill">
                <span style={{ fontSize:"1.1rem" }}>{i.emoji}</span> {i.label}
              </a>
            ))}
            <a href="/marketplace" className="ind-pill">✨ All templates →</a>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding:"0 1.5rem 5rem", maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"0.9rem" }}>How it works</p>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.6rem,3.5vw,2.2rem)", letterSpacing:"-0.02em" }}>Three steps to 24/7 availability.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"1rem" }}>
            {HOW.map(s => (
              <div key={s.n} className="card">
                <div style={{ width:40, height:40, borderRadius:11, background:"linear-gradient(135deg,#7c3aed,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.1rem", color:"#fff", marginBottom:"1rem" }}>{s.n}</div>
                <h3 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.02rem", color:"#edf0f7", marginBottom:"0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize:"0.86rem", color:"rgba(237,240,247,0.55)", lineHeight:1.65, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social proof ── */}
        <section style={{ padding:"0 1.5rem 5rem", maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"0.9rem" }}>Real results</p>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.6rem,3.5vw,2.2rem)", letterSpacing:"-0.02em" }}>Businesses love it.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1rem" }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ borderLeft:`3px solid ${t.color}` }}>
                <p style={{ fontSize:"0.92rem", color:"rgba(237,240,247,0.85)", lineHeight:1.7, marginBottom:"1.2rem", fontStyle:"italic" }}>"{t.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${t.color},#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                    {t.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:"0.84rem", fontWeight:600, color:"#edf0f7" }}>{t.name}</div>
                    <div style={{ fontSize:"0.74rem", color:"rgba(237,240,247,0.45)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing teaser ── */}
        <section style={{ padding:"0 1.5rem 5rem", maxWidth:780, margin:"0 auto" }}>
          <div style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:24, padding:"3rem 2.5rem", textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"1rem" }}>Simple pricing</p>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.5rem,3.5vw,2rem)", letterSpacing:"-0.02em", marginBottom:"0.8rem" }}>
              Start free. Pay only when you grow.
            </h2>
            <p style={{ fontSize:"0.95rem", color:"rgba(237,240,247,0.6)", lineHeight:1.65, maxWidth:460, margin:"0 auto 2rem" }}>
              Pay-per-lead from $0.50 · Basic $29/mo · Pro $69/mo · All via your wallet — no card needed.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="/auth/login" className="btn-primary">Start 3-day free trial <Arrow/></a>
              <a href="/pricing" className="btn-ghost">See all plans →</a>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding:"0 1.5rem 8rem", maxWidth:640, margin:"0 auto", textAlign:"center" }}>
          <div style={{ height:1, background:`linear-gradient(to right,transparent,${line} 30%,${line} 70%,transparent)`, marginBottom:"4rem" }}/>
          <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2rem,5vw,3rem)", letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:"1.2rem" }}>
            Your customers are waiting.{" "}
            <span style={{ background:"linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8 75%,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>Right now.</span>
          </h2>
          <p style={{ color:"rgba(237,240,247,0.55)", fontSize:"1rem", lineHeight:1.65, marginBottom:"2.5rem" }}>
            Every hour without an AI agent is leads lost to competitors who have one.
          </p>
          <a href="/auth/login" className="btn-primary" style={{ fontSize:"1rem", padding:"1rem 2.4rem" }}>
            Build my agent — it's free <Arrow/>
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${line}`, padding:"2.5rem 1.5rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <svg viewBox="0 0 1024 1024" width={20} height={20}>
              <defs><linearGradient id="fLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/>
              </linearGradient></defs>
              <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#fLogo)"/>
            </svg>
            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.9rem", color:"#edf0f7" }}>EasyBuilda</span>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[["Pricing","/pricing"],["Explore","/explore"],["Marketplace","/marketplace"],["Partners","/partners"],["Privacy","/privacy"],["Terms","/terms"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize:"0.8rem", color:"rgba(237,240,247,0.4)", textDecoration:"none" }}
                onMouseEnter={e=>(e.currentTarget.style.color="rgba(237,240,247,0.7)")}
                onMouseLeave={e=>(e.currentTarget.style.color="rgba(237,240,247,0.4)")}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize:"0.78rem", color:"rgba(237,240,247,0.25)" }}>© 2026 EasyBuilda</p>
        </div>
      </footer>
    </div>
  );
}