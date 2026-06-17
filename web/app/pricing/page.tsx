"use client";

import { useState } from "react";

// ── Logo (inline, no import needed) ──────────────────────────────────────────
function Logo({ size = 26 }: { size?: number }) {
  return (
    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <svg viewBox="0 0 1024 1024" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ebLogo2" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a855f7" />
            <stop offset="0.34" stopColor="#7c3aed" />
            <stop offset="0.68" stopColor="#2563eb" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z"
          fill="url(#ebLogo2)"
        />
      </svg>
      <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "1.02rem", letterSpacing: "-0.01em", color: "var(--color-starlight,#edf0f7)" }}>
        EasyBuilda
      </span>
    </a>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function Check({ color = "#34d399", size = 15 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M2.5 7.5l3.5 3.5 7-7" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function X({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M4 4l7 7M11 4l-7 7" stroke="#8891a8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlus({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
      style={{ transition: "transform .25s", transform: open ? "rotate(45deg)" : "none", flexShrink: 0 }}>
      <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Trial",
    price: "Free",
    period: "for 3 days",
    tagline: "Try before you commit.",
    color: "var(--color-dust,#8891a8)",
    highlight: false,
    cta: "Start free",
    features: [
      { text: "1 AI agent", ok: true },
      { text: "20 smart replies/day", ok: true },
      { text: "Lead capture", ok: true },
      { text: "Live on your site", ok: true },
      { text: "EasyBuilda branding", ok: false },
      { text: "Custom tone & colors", ok: false },
    ],
  },
  {
    name: "Basic",
    price: "$49",
    period: "/mo",
    tagline: "For solo business owners.",
    color: "var(--color-nebula,#7c3aed)",
    highlight: false,
    cta: "Choose Basic",
    features: [
      { text: "1 AI agent", ok: true },
      { text: "Unlimited replies", ok: true },
      { text: "Lead capture", ok: true },
      { text: "Custom tone & colors", ok: true },
      { text: "Your own branding", ok: true },
      { text: "Email support", ok: true },
    ],
  },
  {
    name: "Pro",
    price: "$129",
    period: "/mo",
    tagline: "For teams that want more.",
    color: "var(--color-stellar,#38bdf8)",
    highlight: true,
    cta: "Choose Pro",
    features: [
      { text: "Everything in Basic", ok: true },
      { text: "Custom subdomain", ok: true },
      { text: "Conversation insights", ok: true },
      { text: "Analytics dashboard", ok: true },
      { text: "Priority support", ok: true },
      { text: "Webhook integrations", ok: true },
    ],
  },
  {
    name: "Max",
    price: "$299",
    period: "/mo",
    tagline: "Our most capable agent.",
    color: "var(--color-aurora,#22d3ee)",
    highlight: false,
    cta: "Choose Max",
    features: [
      { text: "Everything in Pro", ok: true },
      { text: "Smartest AI model", ok: true },
      { text: "No EasyBuilda branding", ok: true },
      { text: "Your own domain", ok: true },
      { text: "Multi-agent support", ok: true },
      { text: "Dedicated onboarding", ok: true },
    ],
  },
];

const FAQS = [
  {
    q: "Do I need a credit card for the trial?",
    a: "No. The 3-day trial is completely free. You only need a card if you choose to upgrade after the trial ends.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes, anytime. You can upgrade or downgrade from inside your dashboard. Changes take effect immediately on upgrade, or at the next billing cycle on downgrade.",
  },
  {
    q: "What happens when my trial expires?",
    a: "Your agent pauses. Your data stays safe. Pick a plan to bring it back — or just let it go. No charge, no drama.",
  },
  {
    q: "What counts as a 'reply'?",
    a: "Each message your agent sends to a visitor counts as one reply. Trial accounts get 20 per day. All paid plans have unlimited replies.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard — no calls, no forms. Your account stays active until the end of the billing period.",
  },
  {
    q: "What's included in Singularity?",
    a: "Singularity is for larger teams: unlimited agents, full white-label (your domain, your branding, your name on everything), a dedicated account manager, and a custom setup call. Starts at $699/mo.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(237,240,247,0.08)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "1.1rem 1.4rem", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "0.97rem", fontWeight: 500, color: "var(--color-starlight,#edf0f7)" }}>
          {q}
        </span>
        <span style={{ color: "var(--color-dust,#8891a8)" }}>
          <IconPlus open={open} />
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 1.4rem 1.2rem", color: "var(--color-dust,#8891a8)", fontSize: "0.92rem", lineHeight: 1.65 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const line = "rgba(237,240,247,0.08)";
  const lineBright = "rgba(237,240,247,0.14)";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-void,#05070f)",
      color: "var(--color-starlight,#edf0f7)",
      fontFamily: "var(--font-sans,'Inter',sans-serif)",
      WebkitFontSmoothing: "antialiased",
      overflowX: "hidden",
    }}>

      {/* ── Ambient glow ── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20vh", right: "-10vw", width: "60vw", height: "60vh",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.13), transparent 65%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20vh", left: "-10vw", width: "55vw", height: "55vh",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.09), transparent 65%)",
          filter: "blur(40px)",
        }} />
      </div>

      {/* ── Navbar ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center", padding: "1rem 1rem 0" }}>
        <div style={{
          width: "100%", maxWidth: 1100, display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(8,12,24,0.72)", border: `1px solid ${line}`,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 18, padding: "0.6rem 0.75rem 0.6rem 1.25rem",
        }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/auth/login" style={{
              fontSize: "0.88rem", padding: "0.5rem 1rem", color: "var(--color-dust,#8891a8)",
              textDecoration: "none", borderRadius: 10, transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight,#edf0f7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust,#8891a8)")}
            >
              Sign in
            </a>
            <a href="/auth/login" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",
              color: "#fff", fontFamily: "var(--font-display,'Sora',sans-serif)",
              fontWeight: 600, fontSize: "0.86rem", padding: "0.52rem 1.1rem",
              borderRadius: 10, textDecoration: "none",
              transition: "filter .2s,transform .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
            >
              Build my agent <Arrow />
            </a>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", padding: "9rem 1.5rem 4rem", maxWidth: 740, margin: "0 auto" }}>
          <p style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.7rem",
            textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--color-stellar,#38bdf8)",
            marginBottom: "1.2rem",
          }}>
            Simple pricing
          </p>
          <h1 style={{
            fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700,
            fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)", lineHeight: 1.07, letterSpacing: "-0.025em",
            marginBottom: "1.2rem",
          }}>
            Start free.{" "}
            <span style={{
              background: "linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              Scale when ready.
            </span>
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--color-dust,#8891a8)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
            3-day free trial, no card needed. One plan change, anytime. Cancel in two clicks.
          </p>
        </section>

        {/* ── Pricing cards ── */}
        <section style={{ padding: "0 1.25rem 5rem", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "1.1rem",
          }}>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${plan.highlight ? "rgba(56,189,248,0.3)" : line}`,
                  borderRadius: 20, padding: "1.75rem 1.5rem",
                  display: "flex", flexDirection: "column",
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Top glow for Pro */}
                {plan.highlight && (
                  <div aria-hidden="true" style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.7),transparent)",
                  }} />
                )}

                {plan.highlight && (
                  <span style={{
                    alignSelf: "flex-start", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.14em",
                    background: "rgba(56,189,248,0.12)", color: "var(--color-stellar,#38bdf8)",
                    border: "1px solid rgba(56,189,248,0.22)", borderRadius: 999,
                    padding: "0.2rem 0.7rem", marginBottom: "0.9rem",
                  }}>
                    Most popular
                  </span>
                )}

                <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "1rem", color: plan.color, marginBottom: "0.6rem" }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: "0.35rem" }}>
                  <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "2.3rem", letterSpacing: "-0.03em", color: "var(--color-starlight,#edf0f7)" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-dust,#8891a8)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "0.84rem", color: "var(--color-dust,#8891a8)", marginBottom: "1.4rem" }}>
                  {plan.tagline}
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.6rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {plan.features.map((f) => (
                    <li key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.88rem", color: f.ok ? "var(--color-starlight,#edf0f7)" : "var(--color-dust,#8891a8)" }}>
                      {f.ok ? <Check /> : <X />}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth/login"
                  style={{
                    marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "0.75rem 1.2rem", borderRadius: 12, fontFamily: "var(--font-display,'Sora',sans-serif)",
                    fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
                    ...(plan.highlight
                      ? { background: "linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.05)", border: `1px solid ${lineBright}`, color: "var(--color-starlight,#edf0f7)" }
                    ),
                    transition: "filter .2s, transform .2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  {plan.cta} <Arrow />
                </a>
              </div>
            ))}
          </div>

          {/* Singularity callout */}
          <div style={{
            marginTop: "1.5rem",
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${line}`,
            borderRadius: 20, padding: "1.5rem 2rem",
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-gold,#fbbf24)", marginBottom: "0.3rem" }}>
                Singularity — from $699/mo
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-dust,#8891a8)", lineHeight: 1.5 }}>
                Unlimited agents · Full white-label · Your domain & branding · Dedicated account manager · Custom onboarding call.
              </p>
            </div>
            <a href="/auth/login" style={{
              display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              background: "rgba(251,191,36,0.1)", color: "var(--color-gold,#fbbf24)",
              border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12,
              fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "0.9rem",
              padding: "0.65rem 1.3rem", textDecoration: "none",
              transition: "filter .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.15)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "none")}
            >
              Talk to us <Arrow />
            </a>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section style={{ textAlign: "center", padding: "0 1.5rem 5rem" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
            gap: "2rem", fontSize: "0.88rem", color: "var(--color-dust,#8891a8)",
          }}>
            {["No credit card for trial", "Cancel anytime, 2 clicks", "Your data is always yours", "Live support on paid plans"].map(t => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Check size={14} /> {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto 5rem", padding: "0 1.5rem" }}>
          <div style={{ height: 1, background: `linear-gradient(to right,transparent,${lineBright} 30%,${lineBright} 70%,transparent)` }} />
        </div>

        {/* ── FAQ ── */}
        <section style={{ padding: "0 1.25rem 7rem", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--color-nebula,#7c3aed)", marginBottom: "0.9rem" }}>
              Questions
            </p>
            <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.7rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}>
              Answered honestly
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: "0 1.5rem 8rem", maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ height: 1, background: `linear-gradient(to right,transparent,${lineBright} 30%,${lineBright} 70%,transparent)`, marginBottom: "4rem" }} />
          <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.8rem,4.5vw,2.8rem)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Your agent is{" "}
            <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              ready when you are.
            </span>
          </h2>
          <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "1rem", lineHeight: 1.65, marginBottom: "2.5rem" }}>
            Start free. No card. Cancel anytime.
          </p>
          <a href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color: "#fff",
            fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "1rem",
            padding: "0.95rem 2.2rem", borderRadius: 12, textDecoration: "none",
            transition: "filter .2s, transform .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
          >
            Build my agent — it&apos;s free <Arrow />
          </a>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${line}`, padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Logo size={22} />
          <p style={{ fontSize: "0.8rem", color: "var(--color-dust,#8891a8)" }}>
            © 2026 EasyBuilda.{" "}
            <a href="/privacy" style={{ color: "inherit" }}>Privacy</a>
            {" · "}
            <a href="/terms" style={{ color: "inherit" }}>Terms</a>
          </p>
        </div>
      </footer>
    </div>
  );
}