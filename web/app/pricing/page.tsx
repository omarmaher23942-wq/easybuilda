"use client";

import { useState } from "react";

function Logo({ size = 26 }: { size?: number }) {
  return (
    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <svg viewBox="0 0 1024 1024" width={size} height={size}>
        <defs><linearGradient id="pLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="0.34" stopColor="#7c3aed"/><stop offset="0.68" stopColor="#2563eb"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
        <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#pLogo)" />
      </svg>
      <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.02rem", letterSpacing:"-0.01em", color:"var(--color-starlight,#edf0f7)" }}>EasyBuilda</span>
    </a>
  );
}

function Check({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:2 }}><polyline points="2 8 6 12 14 4" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><polyline points="9 4 13 8 9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function FaqPlus({ open }: { open: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transition:"transform .25s", transform:open?"rotate(45deg)":"none", flexShrink:0 }}><path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}

const PLANS = [
  {
    id: "trial",
    name: "Trial",
    price: "$0",
    period: "4 days free",
    tagline: "Full Pro experience. Zero commitment.",
    cta: "Start free — no card",
    href: "/auth/login",
    popular: false,
    highlight: false,
    color: "var(--color-dust,#8891a8)",
    features: [
      "1 AI agent",
      "Full Pro experience for 4 days",
      "Private leads dashboard",
      "Your own shareable page",
      "No credit card",
    ],
    note: "One trial per 30 days",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$29",
    priceAnnual: "$23",
    period: "/month",
    tagline: "Your always-on front desk.",
    cta: "Choose Basic",
    href: "/payment/basic",
    popular: true,
    highlight: false,
    color: "#38bdf8",
    features: [
      "1 AI agent",
      "Unlimited replies",
      "Private leads dashboard",
      "Custom name, tone & colors",
      "Knowledge base from your info",
      "Email support",
    ],
    note: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$69",
    priceAnnual: "$55",
    period: "/month",
    tagline: "More agents, more power.",
    cta: "Choose Pro",
    href: "/payment/pro",
    popular: false,
    highlight: true,
    color: "#a78bfa",
    features: [
      "Everything in Basic, plus:",
      "2 AI agents",
      "Custom URL slug",
      "Image upload in chat",
      "Analytics & conversation insights",
      "Priority support",
    ],
    note: null,
  },
];

const FAQS = [
  { q: "Do I need a credit card for the trial?", a: "No. The 4-day trial is completely free — no credit card, no commitment. You only need to enter payment details if you choose to upgrade when the trial ends." },
  { q: "How do I pay?", a: "We use PayPal. After choosing a plan, you'll send a payment to our PayPal account and submit the transaction ID. We verify and activate your plan within 2–4 hours." },
  { q: "Can I use the trial more than once?", a: "One trial per email address, every 30 days. This keeps the service fair for everyone." },
  { q: "What's the difference between Basic and Pro?", a: "Basic gives you 1 agent with unlimited replies and full lead capture. Pro adds a second agent, a custom URL slug, image support in chat, and conversation analytics." },
  { q: "What happens when my trial expires?", a: "Your agent pauses. Your data and leads stay safe. Choose a plan to bring it back — or let it go. No charge either way." },
  { q: "Can I cancel anytime?", a: "Yes. Contact us and we'll stop your subscription. No lock-in, no drama." },
  { q: "How fast is approval?", a: "Usually 2–4 hours, often faster. You'll get a dashboard notification the moment your plan is activated." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:16, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"1.1rem 1.4rem", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.97rem", fontWeight:500, color:"var(--color-starlight,#edf0f7)" }}>{q}</span>
        <span style={{ color:"var(--color-dust,#8891a8)" }}><FaqPlus open={open}/></span>
      </button>
      {open && <div style={{ padding:"0 1.4rem 1.2rem", color:"var(--color-dust,#8891a8)", fontSize:"0.92rem", lineHeight:1.65 }}>{a}</div>}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const line = "rgba(237,240,247,0.08)";
  const lineBright = "rgba(237,240,247,0.14)";

  function getPrice(plan: typeof PLANS[number]) {
    if (plan.id === "trial") return { price: "$0", period: plan.period };
    const p = annual && plan.priceAnnual ? plan.priceAnnual : plan.price;
    return { price: p, period: annual ? "/month, billed annually" : plan.period };
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--color-void,#05070f)", color:"var(--color-starlight,#edf0f7)", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased", overflowX:"hidden" }}>
      {/* Ambient */}
      <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20vh", right:"-10vw", width:"60vw", height:"60vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.13),transparent 65%)", filter:"blur(40px)" }}/>
        <div style={{ position:"absolute", bottom:"-20vh", left:"-10vw", width:"55vw", height:"55vh", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.09),transparent 65%)", filter:"blur(40px)" }}/>
      </div>

      {/* Navbar */}
      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, display:"flex", justifyContent:"center", padding:"1rem 1rem 0" }}>
        <div style={{ width:"100%", maxWidth:1100, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(8,12,24,0.72)", border:`1px solid ${line}`, backdropFilter:"blur(20px)", borderRadius:18, padding:"0.6rem 0.75rem 0.6rem 1.25rem" }}>
          <Logo />
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/auth/login" style={{ fontSize:"0.88rem", padding:"0.5rem 1rem", color:"var(--color-dust,#8891a8)", textDecoration:"none", borderRadius:10 }}
              onMouseEnter={e => (e.currentTarget.style.color="var(--color-starlight,#edf0f7)")}
              onMouseLeave={e => (e.currentTarget.style.color="var(--color-dust,#8891a8)")}>Sign in</a>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.86rem", padding:"0.52rem 1.1rem", borderRadius:10, textDecoration:"none" }}
              onMouseEnter={e => { e.currentTarget.style.filter="brightness(1.08)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter="none"; e.currentTarget.style.transform="none"; }}>
              Build my agent <Arrow/>
            </a>
          </div>
        </div>
      </header>

      <main style={{ position:"relative", zIndex:1 }}>
        {/* Hero */}
        <section style={{ textAlign:"center", padding:"9rem 1.5rem 3.5rem", maxWidth:680, margin:"0 auto" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#38bdf8", marginBottom:"1.2rem" }}>Simple pricing</p>
          <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2.2rem,5.5vw,3.6rem)", lineHeight:1.07, letterSpacing:"-0.025em", marginBottom:"1.2rem" }}>
            Start free.{" "}
            <span style={{ background:"linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              Scale when ready.
            </span>
          </h1>
          <p style={{ fontSize:"1.05rem", color:"var(--color-dust,#8891a8)", lineHeight:1.65, maxWidth:500, margin:"0 auto 2rem" }}>
            4-day trial, no card. Flat pricing, no hidden fees. PayPal accepted.
          </p>
          {/* Annual toggle */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"8px 20px", borderRadius:999, background:"rgba(255,255,255,0.04)", border:`1px solid ${lineBright}` }}>
            <span style={{ fontSize:"0.88rem", color: annual ? "var(--color-dust,#8891a8)" : "var(--color-starlight,#edf0f7)", transition:"color .2s" }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} style={{ position:"relative", width:42, height:24, borderRadius:12, background: annual ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,0.1)", border:"none", cursor:"pointer", transition:"background .2s", padding:0 }}>
              <span style={{ position:"absolute", top:3, left: annual ? 21 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
            </button>
            <span style={{ fontSize:"0.88rem", color: annual ? "var(--color-starlight,#edf0f7)" : "var(--color-dust,#8891a8)", transition:"color .2s" }}>
              Annual <span style={{ marginLeft:4, fontSize:"0.72rem", padding:"2px 8px", borderRadius:999, background:"rgba(52,211,153,0.12)", color:"#34d399", border:"1px solid rgba(52,211,153,0.3)" }}>Save 20%</span>
            </span>
          </div>
        </section>

        {/* Cards */}
        <section style={{ padding:"0 1.25rem 5rem", maxWidth:980, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,290px),1fr))", gap:"1.2rem" }}>
            {PLANS.map(plan => {
              const { price, period } = getPrice(plan);
              return (
                <div key={plan.id} style={{
                  background: plan.highlight ? "rgba(167,139,250,0.04)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${plan.highlight ? "rgba(167,139,250,0.3)" : plan.popular ? "rgba(56,189,248,0.25)" : line}`,
                  borderRadius:22, padding:"1.8rem 1.6rem", display:"flex", flexDirection:"column",
                  position:"relative", overflow:"hidden",
                  boxShadow: plan.highlight ? "0 40px 90px -44px rgba(124,58,237,0.4)" : undefined,
                }}>
                  {plan.highlight && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.8),transparent)" }}/>}
                  {plan.popular && (
                    <span style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.14em", background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", borderRadius:999, padding:"0.22rem 0.8rem", whiteSpace:"nowrap" }}>
                      Most popular
                    </span>
                  )}
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.05rem", color:plan.color, marginBottom:"0.5rem" }}>{plan.name}</div>
                  <p style={{ fontSize:"0.84rem", color:"var(--color-dust,#8891a8)", marginBottom:"1.1rem", minHeight:36 }}>{plan.tagline}</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:"0.3rem" }}>
                    <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2.4rem", letterSpacing:"-0.03em" }}>{price}</span>
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"var(--color-dust,#8891a8)", marginBottom:"1.4rem" }}>{period}</p>
                  <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.8rem", display:"flex", flexDirection:"column", gap:"0.7rem", flex:1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.88rem", color:"var(--color-starlight,#edf0f7)" }}>
                        <Check/> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.note && (
                    <p style={{ fontSize:"0.72rem", color:"var(--color-dust,#8891a8)", marginBottom:"0.8rem", fontStyle:"italic" }}>{plan.note}</p>
                  )}
                  <a href={plan.href} style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    padding:"0.78rem 1.2rem", borderRadius:13,
                    fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.88rem",
                    textDecoration:"none", transition:"filter .2s, transform .2s",
                    ...(plan.highlight || plan.popular
                      ? { background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", boxShadow:"0 0 22px rgba(124,58,237,0.35)" }
                      : { background:"rgba(255,255,255,0.05)", border:`1px solid ${lineBright}`, color:"var(--color-starlight,#edf0f7)" }),
                  }}
                    onMouseEnter={e => { e.currentTarget.style.filter="brightness(1.1)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter="none"; e.currentTarget.style.transform="none"; }}>
                    {plan.cta} <Arrow/>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Enterprise */}
          <div style={{ marginTop:"1.5rem", background:"rgba(255,255,255,0.02)", border:`1px solid ${line}`, borderRadius:20, padding:"1.4rem 2rem", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.05rem", color:"#fbbf24", marginBottom:"0.3rem" }}>Enterprise — custom pricing</div>
              <p style={{ fontSize:"0.88rem", color:"var(--color-dust,#8891a8)", lineHeight:1.5 }}>Unlimited agents · Full white-label · Your domain · Dedicated account manager</p>
            </div>
            <a href="mailto:omarmaher23942@gmail.com" style={{ display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap", background:"rgba(251,191,36,0.1)", color:"#fbbf24", border:"1px solid rgba(251,191,36,0.25)", borderRadius:12, fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.9rem", padding:"0.65rem 1.3rem", textDecoration:"none" }}
              onMouseEnter={e => (e.currentTarget.style.filter="brightness(1.15)")}
              onMouseLeave={e => (e.currentTarget.style.filter="none")}>
              Talk to us <Arrow/>
            </a>
          </div>
        </section>

        {/* Trust */}
        <section style={{ textAlign:"center", padding:"0 1.5rem 5rem" }}>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"center", gap:"2rem", fontSize:"0.88rem", color:"var(--color-dust,#8891a8)" }}>
            {["No credit card for trial", "PayPal accepted", "Flat pricing — no hidden fees", "Activated within 4 hours"].map(t => (
              <span key={t} style={{ display:"flex", alignItems:"center", gap:7 }}><Check size={13}/> {t}</span>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ maxWidth:1100, margin:"0 auto 5rem", padding:"0 1.5rem" }}>
          <div style={{ height:1, background:`linear-gradient(to right,transparent,${lineBright} 30%,${lineBright} 70%,transparent)` }}/>
        </div>

        {/* FAQ */}
        <section style={{ padding:"0 1.25rem 7rem", maxWidth:760, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"0.9rem" }}>Questions</p>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.7rem,4vw,2.4rem)", letterSpacing:"-0.02em" }}>Answered honestly</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a}/>)}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding:"0 1.5rem 8rem", maxWidth:640, margin:"0 auto", textAlign:"center" }}>
          <div style={{ height:1, background:`linear-gradient(to right,transparent,${lineBright} 30%,${lineBright} 70%,transparent)`, marginBottom:"4rem" }}/>
          <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.8rem,4.5vw,2.8rem)", letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:"1rem" }}>
            Your agent is{" "}
            <span style={{ background:"linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>ready when you are.</span>
          </h2>
          <p style={{ color:"var(--color-dust,#8891a8)", fontSize:"1rem", lineHeight:1.65, marginBottom:"2.5rem" }}>Start free. No card. Cancel anytime.</p>
          <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"1rem", padding:"0.95rem 2.2rem", borderRadius:13, textDecoration:"none", boxShadow:"0 0 28px rgba(124,58,237,0.4)" }}
            onMouseEnter={e => { e.currentTarget.style.filter="brightness(1.08)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter="none"; e.currentTarget.style.transform="none"; }}>
            Build my agent — it&apos;s free <Arrow/>
          </a>
        </section>
      </main>

      <footer style={{ borderTop:`1px solid ${line}`, padding:"2.5rem 1.5rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <Logo size={22}/>
          <p style={{ fontSize:"0.8rem", color:"var(--color-dust,#8891a8)" }}>
            © 2026 EasyBuilda. &nbsp;
            <a href="/privacy" style={{ color:"inherit", textDecoration:"none" }}>Privacy</a>{" · "}
            <a href="/terms" style={{ color:"inherit", textDecoration:"none" }}>Terms</a>
          </p>
        </div>
      </footer>
    </div>
  );
}