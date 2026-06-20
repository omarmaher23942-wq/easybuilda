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

/* ── How it works ─────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "1", title: "Create account", desc: "Sign up free — no credit card." },
    { n: "2", title: "Add funds to wallet", desc: "Top up via bank transfer or PayPal. Funds credited within 24h." },
    { n: "3", title: "Choose your plan", desc: "Pay-per-lead (pay as you grow) or flat subscription." },
    { n: "4", title: "Build your AI agent", desc: "Describe your business — we build the agent in minutes." },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
      {steps.map(s => (
        <div key={s.n} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(237,240,247,0.08)", borderRadius: 16, padding: "1.2rem 1.4rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: 12 }}>{s.n}</div>
          <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.92rem", color: "var(--color-starlight,#edf0f7)", marginBottom: 4 }}>{s.title}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-dust,#8891a8)", lineHeight: 1.55 }}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Plans ─────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    period: "3 days",
    tagline: "Full experience, zero commitment.",
    cta: "Start free — no card",
    href: "/auth/login",
    popular: false,
    highlight: false,
    color: "var(--color-dust,#8891a8)",
    features: [
      "1 AI agent for 3 days",
      "Full Pro experience",
      "Leads dashboard",
      "Shareable agent page",
      "No credit card required",
    ],
  },
  {
    id: "ppl",
    name: "Pay-per-lead",
    price: "$9",
    period: "setup + per lead",
    tagline: "Pay only when you get results.",
    cta: "Start pay-per-lead",
    href: "/auth/login?mode=ppl",
    popular: true,
    highlight: false,
    color: "#34d399",
    features: [
      "$9 one-time setup fee",
      "$0.50 per cold lead (new conversation)",
      "$2.00 per hot lead (contact captured)",
      "1 AI agent",
      "No monthly commitment",
      "Pause anytime",
    ],
    note: "Deducted automatically from wallet balance",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$29",
    period: "/month",
    tagline: "Unlimited leads, flat price.",
    cta: "Choose Basic",
    href: "/wallet/topup?amount=29&plan=basic",
    popular: false,
    highlight: false,
    color: "#38bdf8",
    features: [
      "1 AI agent",
      "Unlimited conversations",
      "Unlimited leads",
      "Custom name, tone & color",
      "Leads dashboard",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$69",
    period: "/month",
    tagline: "More agents, more power.",
    cta: "Choose Pro",
    href: "/wallet/topup?amount=69&plan=pro",
    popular: false,
    highlight: true,
    color: "#a78bfa",
    features: [
      "Everything in Basic",
      "2 AI agents",
      "Custom URL slug",
      "Image upload & AI vision",
      "Analytics & insights",
      "Priority support",
    ],
  },
];

const FAQS = [
  { q: "How does the wallet work?", a: "You top up your wallet first (via bank transfer or PayPal), then spend from it. For subscriptions, the monthly fee is deducted from your balance automatically. For pay-per-lead, each conversation and captured contact is deducted in real time." },
  { q: "What happens if my wallet runs out?", a: "Your AI agent pauses immediately. You'll get an in-app notification and email. As soon as you top up and the admin approves, your agent resumes automatically." },
  { q: "How do I top up my wallet?", a: "Go to Wallet → Add funds → Choose amount → Bank transfer (Mashreq Bank Egypt) or PayPal → Upload receipt → Submit. Our team approves within 24 hours." },
  { q: "What's the difference between pay-per-lead and subscription?", a: "Pay-per-lead charges you only for actual conversations ($0.50) and captured contacts ($2.00). Subscription is a flat monthly fee for unlimited usage. If your agent is busy, subscription is cheaper. If it's quiet, pay-per-lead saves money." },
  { q: "Do I need a credit card?", a: "No. We accept bank transfer (Mashreq Bank Egypt) and PayPal. All payments are manual — you send money, upload a screenshot, and we verify within 24 hours." },
  { q: "Can I switch between plans?", a: "Yes, anytime. Contact support and we'll switch your plan and adjust your wallet accordingly." },
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
  const line = "rgba(237,240,247,0.08)";
  const lineBright = "rgba(237,240,247,0.14)";

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
            <a href="/auth/login" style={{ fontSize:"0.88rem", padding:"0.5rem 1rem", color:"var(--color-dust,#8891a8)", textDecoration:"none", borderRadius:10 }}>Sign in</a>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.86rem", padding:"0.52rem 1.1rem", borderRadius:10, textDecoration:"none" }}>
              Start free <Arrow/>
            </a>
          </div>
        </div>
      </header>

      <main style={{ position:"relative", zIndex:1 }}>

        {/* Hero */}
        <section style={{ textAlign:"center", padding:"9rem 1.5rem 3rem", maxWidth:680, margin:"0 auto" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#38bdf8", marginBottom:"1.2rem" }}>Pricing</p>
          <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(2.2rem,5.5vw,3.4rem)", lineHeight:1.07, letterSpacing:"-0.025em", marginBottom:"1.2rem" }}>
            Pay for results.{" "}
            <span style={{ background:"linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              Not just access.
            </span>
          </h1>
          <p style={{ fontSize:"1.05rem", color:"var(--color-dust,#8891a8)", lineHeight:1.65, maxWidth:500, margin:"0 auto" }}>
            Top up your wallet, choose how you pay. No credit card, no surprises.
          </p>
        </section>

        {/* How it works */}
        <section style={{ padding:"0 1.25rem 4rem", maxWidth:980, margin:"0 auto" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"1.5rem", textAlign:"center" }}>How it works</p>
          <HowItWorks />
        </section>

        {/* Plans */}
        <section style={{ padding:"0 1.25rem 5rem", maxWidth:1100, margin:"0 auto" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.22em", color:"#7c3aed", marginBottom:"1.5rem", textAlign:"center" }}>Choose your plan</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))", gap:"1rem" }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{
                background: plan.highlight ? "rgba(167,139,250,0.04)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${plan.highlight ? "rgba(167,139,250,0.3)" : plan.popular ? "rgba(52,211,153,0.25)" : line}`,
                borderRadius:22, padding:"1.6rem 1.5rem", display:"flex", flexDirection:"column",
                position:"relative", overflow:"hidden",
                boxShadow: plan.highlight ? "0 40px 90px -44px rgba(124,58,237,0.4)" : undefined,
              }}>
                {plan.highlight && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.8),transparent)" }}/>}
                {plan.popular && (
                  <span style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.14em", background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", borderRadius:999, padding:"0.22rem 0.8rem", whiteSpace:"nowrap" }}>
                    Pay as you grow
                  </span>
                )}
                <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1rem", color:plan.color, marginBottom:"0.4rem" }}>{plan.name}</div>
                <p style={{ fontSize:"0.82rem", color:"var(--color-dust,#8891a8)", marginBottom:"1rem", minHeight:34 }}>{plan.tagline}</p>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:"0.25rem" }}>
                  <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2.2rem", letterSpacing:"-0.03em" }}>{plan.price}</span>
                </div>
                <p style={{ fontSize:"0.78rem", color:"var(--color-dust,#8891a8)", marginBottom:"1.2rem" }}>{plan.period}</p>
                <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.4rem", display:"flex", flexDirection:"column", gap:"0.6rem", flex:1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:"0.84rem", color:"var(--color-starlight,#edf0f7)" }}>
                      <Check/> {f}
                    </li>
                  ))}
                </ul>
                {plan.note && <p style={{ fontSize:"0.7rem", color:"var(--color-dust,#8891a8)", marginBottom:"0.7rem", fontStyle:"italic" }}>{plan.note}</p>}
                <a href={plan.href} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"0.75rem 1rem", borderRadius:13,
                  fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.86rem",
                  textDecoration:"none",
                  ...(plan.highlight
                    ? { background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", boxShadow:"0 0 22px rgba(124,58,237,0.35)" }
                    : plan.popular
                      ? { background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", boxShadow:"0 0 22px rgba(16,185,129,0.3)" }
                      : { background:"rgba(255,255,255,0.05)", border:`1px solid ${lineBright}`, color:"var(--color-starlight,#edf0f7)" }),
                }}>
                  {plan.cta} <Arrow/>
                </a>
              </div>
            ))}
          </div>

          {/* Wallet info box */}
          <div style={{ marginTop:"1.5rem", background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:18, padding:"1.4rem 2rem", display:"flex", flexWrap:"wrap", alignItems:"center", gap:16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.96rem", color:"var(--color-starlight,#edf0f7)", marginBottom:"0.3rem" }}>
                💰 All plans use your EasyBuilda Wallet
              </div>
              <p style={{ fontSize:"0.84rem", color:"var(--color-dust,#8891a8)", lineHeight:1.5, margin:0 }}>
                Top up once, spend as you go. Bank transfer or PayPal. Approved within 24h.
              </p>
            </div>
            <a href="/wallet/topup" style={{ display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap", background:"rgba(124,58,237,0.15)", color:"#a78bfa", border:"1px solid rgba(124,58,237,0.3)", borderRadius:12, fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"0.88rem", padding:"0.65rem 1.3rem", textDecoration:"none" }}>
              Add funds <Arrow/>
            </a>
          </div>
        </section>

        {/* Trust */}
        <section style={{ textAlign:"center", padding:"0 1.5rem 4rem" }}>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"center", gap:"2rem", fontSize:"0.88rem", color:"var(--color-dust,#8891a8)" }}>
            {["No credit card required", "Bank transfer & PayPal", "Manual verification 24h", "Agents pause if balance empty — never charged more"].map(t => (
              <span key={t} style={{ display:"flex", alignItems:"center", gap:7 }}><Check size={13}/> {t}</span>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ maxWidth:1100, margin:"0 auto 4rem", padding:"0 1.5rem" }}>
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
          <p style={{ color:"var(--color-dust,#8891a8)", fontSize:"1rem", lineHeight:1.65, marginBottom:"2.5rem" }}>3-day free trial. No card. Wallet-based billing.</p>
          <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:600, fontSize:"1rem", padding:"0.95rem 2.2rem", borderRadius:13, textDecoration:"none", boxShadow:"0 0 28px rgba(124,58,237,0.4)" }}>
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