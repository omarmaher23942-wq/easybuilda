"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size}>
      <defs>
        <linearGradient id="lg" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7"/>
          <stop offset="0.34" stopColor="#7c3aed"/>
          <stop offset="0.68" stopColor="#2563eb"/>
          <stop offset="1" stopColor="#22d3ee"/>
        </linearGradient>
      </defs>
      <path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#lg)"/>
    </svg>
  );
}

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

const ICONS = {
  check:    "M20 6L9 17L4 12",
  arrow:    "M5 12H19M13 6L19 12L13 18",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  brain:    "M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-5 0V4.5A2.5 2.5 0 019.5 2zM14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 005 0V4.5A2.5 2.5 0 0114.5 2z",
  clock:    "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  users:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  chart:    "M18 20V10M12 20V4M6 20v-6",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  message:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
};

const INDUSTRIES = [
  { label: "Restaurants", color: "#f97316" },
  { label: "Medical Clinics", color: "#0ea5e9" },
  { label: "Real Estate", color: "#10b981" },
  { label: "Law Firms", color: "#8b5cf6" },
  { label: "E-Commerce", color: "#f59e0b" },
  { label: "Coaches", color: "#ec4899" },
  { label: "Beauty & Salons", color: "#06b6d4" },
  { label: "Hotels", color: "#84cc16" },
];

const STEPS = [
  { n: "01", title: "Describe your business", desc: "Answer a few smart questions. Our AI understands your industry, services, hours, and tone." },
  { n: "02", title: "We build your agent", desc: "In under 2 minutes, a fully trained AI agent is created with your business knowledge baked in." },
  { n: "03", title: "Share the link", desc: "Your agent goes live instantly. Share the link or embed it on your website. Done." },
];

const FEATURES = [
  { icon: "brain", title: "Knows your business", desc: "Your agent is trained on your services, pricing, hours, location, and policies — not generic AI." },
  { icon: "clock", title: "Always available", desc: "Customers get instant answers at 3am on Sunday. No staff needed, no calls missed." },
  { icon: "users", title: "Captures every lead", desc: "Every visitor who chats becomes a lead in your dashboard with full conversation history." },
  { icon: "shield", title: "Stays on-brand", desc: "Choose your agent's name, personality, and colors. It represents your business, not us." },
  { icon: "chart", title: "Growth intelligence", desc: "See what customers ask most, when they engage, and where leads come from." },
  { icon: "zap", title: "Live in 2 minutes", desc: "No developers. No integrations. No configuration. Just answer questions and go live." },
];

const TESTIMONIALS = [
  { name: "Ahmed K.", role: "Restaurant owner, Cairo", text: "My agent books 8–12 extra reservations a week without me doing anything. Customers love that they get instant answers at midnight.", accent: "#f97316" },
  { name: "Sara M.", role: "Clinic manager", text: "We stopped missing calls outside office hours. Patients ask about insurance, book appointments, and we wake up to a full schedule.", accent: "#0ea5e9" },
  { name: "Omar R.", role: "Real estate agent", text: "I was losing weekend leads to agents who responded faster. Now my agent qualifies buyers while I'm with my family.", accent: "#10b981" },
];

const PRICING = [
  {
    name: "Pay-per-lead",
    price: "From $0.50",
    period: "per lead",
    desc: "Pay only when your agent captures a lead. Zero monthly commitment.",
    features: ["1 AI agent", "Unlimited conversations", "Lead capture dashboard", "Cold leads $0.50 · Hot leads $2"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$29",
    period: "/ month",
    desc: "For small businesses ready for consistent AI customer support.",
    features: ["1 AI agent", "Unlimited conversations", "Unlimited leads", "Weekly growth email", "Email support"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$69",
    period: "/ month",
    desc: "For growing businesses that need more power and flexibility.",
    features: ["2 AI agents", "Image analysis (Gemini)", "Custom agent URL", "Priority support", "Everything in Basic"],
    cta: "Start free trial",
    highlight: true,
  },
];

export default function HomePage() {
  const [agentCount, setAgentCount] = useState<number | null>(null);
  const [bizCount,   setBizCount]   = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/agents/stats/public`)
      .then(r => r.json())
      .then(d => { setAgentCount(d.total_agents || 0); setBizCount(d.total_businesses || 0); })
      .catch(() => {});
  }, []);

  const line = "rgba(255,255,255,0.07)";
  const dust = "rgba(255,255,255,0.45)";

  return (
    <div style={{ background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .fade-up{animation:fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both}
        .nav-link{color:${dust};text-decoration:none;font-size:0.88rem;padding:6px 12px;border-radius:8px;transition:color 0.15s}
        .nav-link:hover{color:#edf0f7}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-weight:700;font-size:0.95rem;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 0 0 rgba(124,58,237,0)}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 40px rgba(124,58,237,0.4)}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:14px;background:transparent;border:1px solid ${line};color:#edf0f7;font-weight:600;font-size:0.93rem;text-decoration:none;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .btn-ghost:hover{border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04)}
        .card{background:rgba(255,255,255,0.025);border:1px solid ${line};border-radius:20px;transition:all 0.2s}
        .card:hover{border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.04)}
        .pill{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;border:1px solid ${line};background:rgba(255,255,255,0.03);font-size:0.84rem;color:${dust};cursor:default;transition:all 0.2s;white-space:nowrap}
        .pill:hover{border-color:rgba(255,255,255,0.18);color:#edf0f7;background:rgba(255,255,255,0.06)}
        @media(max-width:768px){.hide-mobile{display:none!important}.hero-btns{flex-direction:column!important;align-items:stretch!important}.pricing-grid{grid-template-columns:1fr!important}.steps-grid{grid-template-columns:1fr!important}.features-grid{grid-template-columns:1fr!important}.testimonials-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── Navbar ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", padding: "12px 20px" }}>
        <nav style={{ width: "100%", maxWidth: 1120, display: "flex", alignItems: "center", gap: 8, background: "rgba(5,7,15,0.75)", border: `1px solid ${line}`, backdropFilter: "blur(20px)", borderRadius: 18, padding: "8px 8px 8px 20px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: "auto" }}>
            <Logo size={26}/>
            <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.95rem", color: "#edf0f7" }}>EasyBuilda</span>
          </a>
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <a href="/pricing"  className="nav-link">Pricing</a>
            <a href="/explore"  className="nav-link">Explore</a>
            <a href="/partners" className="nav-link">Partners</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
            <a href="/auth/login" className="nav-link hide-mobile">Sign in</a>
            <a href="/auth/login" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.86rem" }}>
              Get started free
            </a>
          </div>
        </nav>
      </header>

      <main>

        {/* ── Hero ── */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 20px 80px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "60vh", background: "radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,transparent 70%)", filter: "blur(60px)" }}/>
          </div>

          <div className="fade-up" style={{ position: "relative", maxWidth: 780 }}>
            {agentCount !== null && agentCount > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", fontSize: "0.78rem", color: "#34d399", marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }}/>
                {agentCount}+ AI agents live · {bizCount}+ businesses
              </div>
            )}

            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "clamp(2.6rem,6.5vw,4.4rem)", lineHeight: 1.05, letterSpacing: "-0.035em", marginBottom: 24, color: "#edf0f7" }}>
              Your business answers
              <br/>
              <span style={{ background: "linear-gradient(110deg,#c084fc 0%,#818cf8 35%,#38bdf8 70%,#22d3ee 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                customers 24/7.
              </span>
            </h1>

            <p style={{ fontSize: "clamp(1rem,2.2vw,1.2rem)", color: dust, lineHeight: 1.75, maxWidth: 580, margin: "0 auto 40px" }}>
              Build a professional AI agent for your business in 2 minutes. No code, no setup, no monthly surprises. Your customers get instant answers — you get more leads.
            </p>

            <div className="hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/auth/login" className="btn-primary" style={{ fontSize: "1rem", padding: "15px 32px" }}>
                Build my agent free
                <Icon d={ICONS.arrow} size={18}/>
              </a>
              <a href="/explore" className="btn-ghost" style={{ fontSize: "1rem", padding: "14px 28px" }}>
                See live examples
              </a>
            </div>

            <p style={{ marginTop: 20, fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
              3-day free trial · No credit card · Live in 2 minutes
            </p>
          </div>
        </section>

        {/* ── Social proof bar ── */}
        <section style={{ padding: "0 20px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 1 }}>
            {[
              { value: "2 min", label: "Average setup time" },
              { value: "24/7", label: "Always-on availability" },
              { value: "$0", label: "To get started" },
              { value: "100%", label: "Your data, your control" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "28px 20px", borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
                <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-0.03em", background: "linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: "0.83rem", color: dust }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Industries ── */}
        <section style={{ padding: "0 20px 100px", textAlign: "center" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c3aed", marginBottom: 14 }}>Works for every industry</p>
            <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", letterSpacing: "-0.025em", marginBottom: 36 }}>
              Whatever you do, we build it.
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {INDUSTRIES.map(ind => (
                <div key={ind.label} className="pill">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ind.color, flexShrink: 0 }}/>
                  {ind.label}
                </div>
              ))}
              <a href="/auth/login" className="pill" style={{ color: "#a78bfa", borderColor: "rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.06)" }}>
                + Your industry
                <Icon d={ICONS.arrow} size={14}/>
              </a>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: "0 20px 100px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c3aed", marginBottom: 14 }}>How it works</p>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", letterSpacing: "-0.025em" }}>
                From zero to live in 3 steps.
              </h2>
            </div>
            <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {STEPS.map((s, i) => (
                <div key={s.n} className="card" style={{ padding: "32px 28px", position: "relative" }}>
                  <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontWeight: 700, fontSize: "3.5rem", color: "rgba(124,58,237,0.15)", lineHeight: 1, marginBottom: 20, letterSpacing: "-0.05em" }}>{s.n}</div>
                  <h3 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.1rem", color: "#edf0f7", marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: "0.88rem", color: dust, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hide-mobile" style={{ position: "absolute", right: -24, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.15)", zIndex: 1 }}>
                      <Icon d={ICONS.arrow} size={20}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: "0 20px 100px" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c3aed", marginBottom: 14 }}>Features</p>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", letterSpacing: "-0.025em" }}>
                Everything your business needs.
              </h2>
            </div>
            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {FEATURES.map(f => (
                <div key={f.title} className="card" style={{ padding: "28px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", marginBottom: 16 }}>
                    <Icon d={ICONS[f.icon as keyof typeof ICONS]} size={20}/>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1rem", color: "#edf0f7", marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: "0.86rem", color: dust, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section style={{ padding: "0 20px 100px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c3aed", marginBottom: 14 }}>Results</p>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", letterSpacing: "-0.025em" }}>
                Real businesses. Real results.
              </h2>
            </div>
            <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="card" style={{ padding: "28px", borderLeft: `3px solid ${t.accent}` }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={t.accent}><path d={ICONS.star}/></svg>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.92rem", color: "rgba(237,240,247,0.85)", lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${t.accent},#22d3ee)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#edf0f7" }}>{t.name}</div>
                      <div style={{ fontSize: "0.74rem", color: dust }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" style={{ padding: "0 20px 100px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c3aed", marginBottom: 14 }}>Pricing</p>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", letterSpacing: "-0.025em", marginBottom: 10 }}>
                Start free. Pay when you grow.
              </h2>
              <p style={{ fontSize: "0.92rem", color: dust }}>No card required. All plans start with a 3-day free trial.</p>
            </div>
            <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {PRICING.map(p => (
                <div key={p.name} style={{ padding: "32px 28px", borderRadius: 20, border: p.highlight ? "1px solid rgba(124,58,237,0.5)" : `1px solid ${line}`, background: p.highlight ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)", position: "relative", display: "flex", flexDirection: "column" }}>
                  {p.highlight && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 100, background: "linear-gradient(135deg,#7c3aed,#2563eb)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                      Most popular
                    </div>
                  )}
                  <div>
                    <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: dust, marginBottom: 10 }}>{p.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                      <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.2rem", color: "#edf0f7" }}>{p.price}</span>
                      <span style={{ fontSize: "0.84rem", color: dust }}>{p.period}</span>
                    </div>
                    <p style={{ fontSize: "0.84rem", color: dust, lineHeight: 1.6, marginBottom: 24 }}>{p.desc}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                      {p.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ color: "#34d399", marginTop: 2, flexShrink: 0 }}>
                            <Icon d={ICONS.check} size={14}/>
                          </div>
                          <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.75)" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a href="/auth/login" className={p.highlight ? "btn-primary" : "btn-ghost"} style={{ textAlign: "center", justifyContent: "center", marginTop: "auto" }}>
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 28, fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>
              All payments via bank transfer (Mashreq Bank) or PayPal. No card required.
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: "0 20px 120px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{ height: 1, background: `linear-gradient(to right,transparent,${line} 30%,${line} 70%,transparent)`, marginBottom: 80 }}/>
            <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "clamp(2rem,5vw,3.2rem)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 18 }}>
              Your customers are asking questions right now.
            </h2>
            <p style={{ fontSize: "1rem", color: dust, lineHeight: 1.7, marginBottom: 36 }}>
              Every hour without an AI agent is revenue left on the table. Build yours in 2 minutes — free.
            </p>
            <a href="/auth/login" className="btn-primary" style={{ fontSize: "1.05rem", padding: "16px 36px" }}>
              Build my AI agent — it's free
              <Icon d={ICONS.arrow} size={18}/>
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${line}`, padding: "40px 20px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Logo size={22}/>
            <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.9rem", color: "#edf0f7" }}>EasyBuilda</span>
          </a>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Pricing","/pricing"],["Explore","/explore"],["Partners","/partners"],["Privacy","/privacy"],["Terms","/terms"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color="rgba(255,255,255,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.35)")}>
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>© 2026 EasyBuilda</p>
        </div>
      </footer>
    </div>
  );
}
