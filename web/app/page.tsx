"use client";

import { useEffect, useRef, useState } from "react";

/* ── Logo ─────────────────────────────────────────────────────────── */
function Logo({ size = 26, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  return (
    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <svg viewBox="0 0 1024 1024" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ebLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a855f7" />
            <stop offset="0.34" stopColor="#7c3aed" />
            <stop offset="0.68" stopColor="#2563eb" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#ebLogo)" />
      </svg>
      {showWordmark && (
        <span className="font-[family-name:var(--font-display)] font-bold text-[1.05rem] tracking-tight" style={{ color: "var(--color-starlight)" }}>
          EasyBuilda
        </span>
      )}
    </a>
  );
}

function Ic({ name, size = 22 }: { name: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.65,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "knowledge":   return <svg {...p}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
    case "leads":       return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "handoff":     return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
    case "language":    return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "image":       return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case "widget":      return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "page":        return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
    case "check":       return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "bolt":        return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "arrow":       return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case "shield":      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "zap":         return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "trending":    return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case "star":        return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "clock":       return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    default:            return null;
  }
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${seen ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Describe your business", body: "Answer a few focused questions — our AI learns your services, prices, hours, and voice. No manuals, no spreadsheets, no technical setup." },
  { n: "02", title: "Your agent comes alive", body: "In minutes you get a trained AI agent with its own name, personality, and deep knowledge of your business. Preview it, tweak the tone, make it yours." },
  { n: "03", title: "Go live and capture leads", body: "Share your own page or embed a widget on your site. Visitors chat, qualified leads land in your private dashboard — automatically, around the clock." },
];

// Only real, working capabilities
const CAPABILITIES = [
  { icon: "knowledge", title: "Answers from your knowledge",  body: "Grounded in your real services, prices, and FAQs — helps customers without hallucinating or going off-script." },
  { icon: "leads",     title: "Captures & qualifies leads",   body: "Turns interested visitors into structured leads: name, intent, and exactly what they need — ready for you to act on." },
  { icon: "image",     title: "Understands images",           body: "Pro agents can receive and analyze images from visitors — perfect for quotes, diagnoses, or product questions." },
  { icon: "handoff",   title: "Hands off to you",             body: "When a conversation needs a human touch, you get the full context — so you can jump in and close the deal." },
  { icon: "language",  title: "Speaks their language",        body: "Detects and replies in your customer's own language automatically — no extra setup required." },
  { icon: "shield",    title: "Always on, never tired",       body: "Your agent works 24/7, answers every visitor instantly, and never has a bad day or misses a message." },
];

const CHANNELS = [
  { icon: "widget", title: "On your website",  body: "A polished chat widget that lives in the corner of your site. One line of code to install, no developer needed." },
  { icon: "page",   title: "Its own page",     body: "Every agent gets a beautiful, brandable page at easybuilda.vercel.app/yourname — share it on social, email, or anywhere." },
];

const INDUSTRIES = [
  { icon: "trending", title: "Restaurants",    body: "Answers menu questions, takes reservations, captures catering inquiries — 24/7." },
  { icon: "shield",   title: "Clinics",        body: "Explains services, qualifies new patients, and captures contact details before they ever call." },
  { icon: "bolt",     title: "E-commerce",     body: "Recommends products, answers order questions, and turns browsers into buyers." },
  { icon: "page",     title: "Real estate",    body: "Fields property questions, schedules viewings, captures serious buyer intent." },
  { icon: "star",     title: "Agencies",       body: "Qualifies inbound inquiries and books discovery calls while you focus on delivery." },
  { icon: "clock",    title: "Local services", body: "Quotes, answers questions, and captures leads — turning site visits into booked jobs." },
];

const REASONS = [
  { icon: "check", title: "Better than a chatbot",      body: "Old chatbots follow scripts and frustrate people. Yours actually understands, qualifies, and captures — like a trained sales rep.", tone: "good" },
  { icon: "check", title: "Cheaper than hiring",        body: "An agent that never sleeps, never misses a message, and answers every visitor — for a fraction of one salary.", tone: "good" },
  { icon: "bolt",  title: "Doing nothing is expensive", body: "Every unanswered visitor is a customer your competitor gets instead. Your agent makes sure that stops.", tone: "bad" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "3-day free trial",
    tagline: "Try it free, no commitment.",
    cta: "Start free — no card",
    href: "/auth/login",
    popular: false,
    highlight: false,
    features: [
      "1 AI agent",
      "3-day free trial",
      "Private leads dashboard",
      "Your own shareable page",
      "No card required",
    ],
  },
  {
    name: "Basic",
    price: "$29",
    period: "/month",
    tagline: "Your always-on front desk.",
    cta: "Choose Basic",
    href: "/auth/login",
    popular: true,
    highlight: false,
    features: [
      "1 AI agent",
      "Unlimited replies",
      "Private leads dashboard",
      "Custom name, tone & colors",
      "Knowledge base from your info",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$69",
    period: "/month",
    tagline: "More agents, more power.",
    cta: "Choose Pro",
    href: "/auth/login",
    popular: false,
    highlight: true,
    features: [
      "Everything in Basic, plus:",
      "2 AI agents",
      "Custom URL slug",
      "Image upload & visual analysis",
      "Priority support",
    ],
  },
];

const FAQS = [
  { q: "Do I need to know how to code?", a: "Not at all. You describe your business in plain words, our AI builds the agent, and you share your EasyBuilda page or paste one line of code on your site." },
  { q: "How fast is it live?", a: "Minutes. The moment you finish describing your business, your agent is trained and ready to talk to customers." },
  { q: "What does the free trial include?", a: "Three days with a full working AI agent — you can chat with it, share it, and capture real leads. No credit card needed." },
  { q: "Where do the leads go?", a: "To your own private leads page — every interested visitor with their name, intent, and what they need, ready for you to follow up." },
  { q: "Can I cancel anytime?", a: "Always. No contracts, no lock-in. Upgrade, downgrade, or cancel from your dashboard whenever you want." },
  { q: "What languages does the agent support?", a: "Your agent automatically detects and replies in the customer's language. You set up in English, and it handles the rest." },
  { q: "How do I pay?", a: "We accept international bank transfers (USD). After you submit your transfer receipt, our team verifies and activates your plan within 24 hours." },
];

const STATS = [
  { value: "< 5 min", label: "To go live" },
  { value: "24/7",    label: "Always on" },
  { value: "100%",    label: "Visitors answered" },
  { value: "3×",      label: "More leads captured" },
];

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="eyebrow"><span className="live-dot" />{eyebrow}</span>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-[2.7rem] font-bold leading-[1.12] tracking-tight">{title}</h2>
      {sub && <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: "var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links: [string, string][] = [["How it works", "#how"], ["Features", "#capabilities"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className={`glass w-full max-w-6xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-300 ${scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : ""}`}
        style={{ borderColor: scrolled ? "var(--line-bright)" : "var(--line)" }}>
        <a href="/" className="flex items-center gap-2.5 shrink-0"><Logo size={30} showWordmark /></a>
        <div className="hidden md:flex items-center gap-7">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="text-sm transition-colors duration-200" style={{ color: "var(--color-dust)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust)")}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/auth/login" className="hidden sm:inline-block text-sm font-medium px-3 py-1.5 transition-colors duration-200" style={{ color: "var(--color-starlight)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-nebula)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-starlight)")}>Sign in</a>
          <a href="/auth/login" className="btn-genesis btn-sm">Start free</a>
        </div>
      </nav>
    </header>
  );
}

function ChatPreview() {
  return (
    <div className="glass rounded-[26px] p-5 sm:p-6 w-full" style={{ borderColor: "var(--line-bright)", boxShadow: "0 40px 90px -40px rgba(124,58,237,0.5)" }}>
      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-full font-[family-name:var(--font-display)] font-bold text-white" style={{ background: "var(--genesis)" }}>V</div>
          <div className="text-left">
            <p className="font-semibold text-sm">Vera</p>
            <p className="text-xs" style={{ color: "var(--color-dust)" }}>Sparkle Home · AI assistant</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-available)" }}>
          <span className="live-dot" />Online
        </span>
      </div>
      <div className="flex flex-col gap-3 text-sm text-left">
        <div className="self-end max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5" style={{ background: "var(--genesis)", color: "#fff" }}>
          How much is a deep clean for a 2-bedroom?
        </div>
        <div className="self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-2.5" style={{ background: "var(--color-surface)", border: "1px solid var(--line)" }}>
          A 2-bedroom deep clean is <strong>$180</strong> and takes about 3 hours. Want me to find you a slot this week?
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Yes, this week", "What's included?"].map(t => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full cursor-pointer" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#7dd3fc" }}>{t}</span>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--color-surface)", border: "1px solid var(--line)" }}>
        <span className="text-sm flex-1" style={{ color: "var(--color-dust)" }}>Ask anything…</span>
        <span className="grid place-items-center w-8 h-8 rounded-full" style={{ background: "var(--genesis)" }}>
          <Ic name="arrow" size={15} />
        </span>
      </div>
      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-dust)" }}>
        <Logo size={13} /> Built with EasyBuilda
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="px-5 sm:px-8">
      <div className="mx-auto w-full max-w-6xl flex flex-col items-center text-center pt-36 pb-20 sm:pt-40 sm:pb-28">
        <Reveal>
          <span className="eyebrow"><span className="live-dot" />The teammate that works while you sleep</span>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.05] sm:text-6xl md:text-[4.5rem] md:leading-[1.02] font-bold tracking-tight max-w-4xl">
            Hire an AI that <span className="gradient-text">already knows your business</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-7 text-lg sm:text-xl leading-relaxed max-w-2xl" style={{ color: "var(--color-dust)" }}>
            Describe what you do. EasyBuilda builds an AI agent that answers customers, captures real leads, and represents your business — around the clock, in your voice. Live in minutes, no code.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5">
            <a href="/auth/login" className="btn-genesis w-full sm:w-auto">
              Build my agent — free
              <Ic name="arrow" size={17} />
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            {["No card required", "3-day free trial", "Live in minutes"].map(t => (
              <span key={t} className="inline-flex items-center gap-2">
                <span style={{ color: "var(--color-available)" }}><Ic name="check" size={16} /></span>{t}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200} className="w-full">
          <div className="mt-16 mx-auto w-full max-w-md" style={{ animation: "float 7s var(--ease) infinite" }}>
            <ChatPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="px-5 sm:px-8 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Reveal>
          <div className="glass rounded-2xl px-6 py-5" style={{ borderColor: "var(--line-bright)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold gradient-text">{s.value}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-dust)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LeadCard({ name, intent, intentLabel, interest, summary, action, meta }: {
  name: string; intent: string; intentLabel: string; interest: string;
  summary: string; action: string; meta: string;
}) {
  return (
    <div className="card p-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{name}</p>
        <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap intent-${intent}`}>{intentLabel}</span>
      </div>
      <p className="mt-2.5 text-sm">
        <span style={{ color: "var(--color-dust)" }}>Interested in: </span>
        <span className="font-medium">{interest}</span>
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>{summary}</p>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <span style={{ color: "#c4b5fd", marginTop: 1, flexShrink: 0 }}><Ic name="bolt" size={16} /></span>
        <p className="text-xs leading-relaxed" style={{ color: "#d6c8ff" }}>{action}</p>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--color-dust)" }}>{meta}</p>
    </div>
  );
}

function LeadsSection() {
  const stats = [["Total leads", "248"], ["Hot", "37"], ["This week", "61"], ["Conversion", "24%"]];
  return (
    <section id="leads" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="The whole point"
            title={<>It doesn&apos;t just chat. <span className="gradient-text">It brings you customers.</span></>}
            sub="Every interested visitor becomes a qualified lead — name, intent, and what they need — collected automatically and waiting for you on your own private leads page."
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-14 grad-border rounded-[28px] p-5 sm:p-7" style={{ boxShadow: "0 50px 110px -50px rgba(124,58,237,0.6)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2 text-left">
                <Logo size={26} />
                <div>
                  <p className="font-[family-name:var(--font-display)] font-semibold leading-tight">Your Leads</p>
                  <p className="text-xs font-[family-name:var(--font-mono)]" style={{ color: "var(--color-dust)" }}>easybuilda.vercel.app/sparkle-home/leads</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {stats.map(([l, v]) => (
                  <div key={l} className="rounded-xl px-3.5 py-2 text-left" style={{ background: "var(--color-surface)", border: "1px solid var(--line)" }}>
                    <p className="text-[0.65rem] uppercase tracking-wide" style={{ color: "var(--color-dust)" }}>{l}</p>
                    <p className="font-[family-name:var(--font-display)] font-bold text-lg leading-tight">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <LeadCard intent="hot" intentLabel="🔥 Hot" name="Ahmed M." interest="Deep clean · 2-bedroom"
                summary="Wants a deep clean before the weekend. Asked about price and availability — said he's in a hurry."
                action="Call within 24h — high intent, ready to book." meta="$180 budget · this week · 3:42 PM" />
              <LeadCard intent="warm" intentLabel="⚡ Warm" name="Sarah Lin" interest="Weekly cleaning plan"
                summary="Comparing options for a recurring plan for a 3-bedroom apartment. Wants pricing details emailed over."
                action="Send the weekly plan pricing — follow up in 2 days." meta="Recurring · evaluating · 11:08 AM" />
              <LeadCard intent="cold" intentLabel="— Cold" name="Marco D." interest="Move-out cleaning"
                summary="Browsing for a move-out clean next month. No date set yet, just gathering quotes."
                action="Add to nurture — check back near move-out date." meta="Next month · early-stage · Yesterday" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="How it works" title={<>From a sentence to a <span className="gradient-text">live agent.</span></>} sub="Three steps. No code, no setup, no waiting." />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <div className="card h-full p-7 text-left">
                <span className="font-[family-name:var(--font-mono)] text-sm" style={{ color: "var(--color-stellar)" }}>{s.n}</span>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--color-dust)" }}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Channels() {
  return (
    <section id="channels" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Where it lives" title={<>On your site, <span className="gradient-text">talking like your best rep</span></>} sub="Add it to your website or give it its own page — wherever your customers find you." />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.title} delay={i * 110}>
              <div className="card h-full p-7 text-left">
                <span className="icon-tile"><Ic name={c.icon} size={22} /></span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold">{c.title}</h3>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--color-dust)" }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="capabilities" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="What your agent can do" title={<>More than answers. <span className="gradient-text">Real outcomes.</span></>} sub="It's not a chatbot reading from a script. It understands, acts, and brings you business." />
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 90}>
              <div className="card h-full p-6 text-left">
                <span className="icon-tile"><Ic name={c.icon} size={22} /></span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Made for you" title={<>Built for <span className="gradient-text">how you sell.</span></>} sub="However your customers reach out, your agent already knows what they need." />
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 90}>
              <div className="card h-full p-6 text-left flex items-start gap-4">
                <span className="icon-tile shrink-0"><Ic name={it.icon} size={20} /></span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>{it.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Why EasyBuilda" title={<>The math is <span className="gradient-text">simple.</span></>} />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 110}>
              <div className="card h-full p-7 text-left">
                <span className="grid place-items-center w-10 h-10 rounded-xl"
                  style={{
                    background: r.tone === "good" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                    border: `1px solid ${r.tone === "good" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                    color: r.tone === "good" ? "var(--color-available)" : "var(--color-danger)",
                  }}>
                  <Ic name={r.icon} size={20} />
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold">{r.title}</h3>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--color-dust)" }}>{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  return (
    <div className={`relative flex flex-col w-full sm:w-[300px] xl:w-[260px] rounded-[22px] p-6 text-left transition-all duration-300 ${plan.highlight ? "grad-border" : "card"}`}
      style={plan.highlight ? { boxShadow: "0 40px 90px -44px rgba(124,58,237,0.7)" } : undefined}>
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[0.65rem] font-bold tracking-wider px-3 py-1 rounded-full whitespace-nowrap" style={{ background: "var(--genesis)", color: "#fff" }}>
          MOST POPULAR
        </span>
      )}
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-xs leading-snug min-h-[28px]" style={{ color: "var(--color-dust)" }}>{plan.tagline}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{plan.price}</span>
        <span className="text-sm" style={{ color: "var(--color-dust)" }}>{plan.period}</span>
      </div>
      <a href={plan.href} className={`mt-5 ${plan.highlight || plan.popular ? "btn-genesis" : "btn-ghost"} btn-sm w-full`}>{plan.cta}</a>
      <ul className="mt-6 flex flex-col gap-2.5">
        {plan.features.map(f => {
          const isHeader = f.endsWith(":");
          return (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              {!isHeader && <span className="mt-0.5 shrink-0" style={{ color: "var(--color-available)" }}><Ic name="check" size={15} /></span>}
              <span style={{ color: isHeader ? "var(--color-starlight)" : "var(--color-dust)", fontWeight: isHeader ? 600 : 400 }}>{f}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title={<>Start free. <span className="gradient-text">Grow when it works.</span></>}
            sub="Every account starts with a 3-day free trial. No card, no commitment. Pick a plan when you see the leads roll in."
          />
        </Reveal>
        <div className="mt-16 flex flex-wrap justify-center items-stretch gap-5">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 70}><PlanCard plan={p} /></Reveal>
          ))}
        </div>
        <Reveal delay={180}>
          <p className="mt-8 text-center text-sm" style={{ color: "var(--color-dust)" }}>
            Need more? <a href="mailto:omarmaher23942@gmail.com" style={{ color: "var(--color-stellar)", textDecoration: "none" }}>Contact us</a> for enterprise options.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="font-medium">{q}</span>
        <span className="shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "none", color: "var(--color-stellar)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <div style={{ maxHeight: open ? 260 : 0, transition: "max-height 0.35s var(--ease)", overflow: "hidden" }}>
        <p className="px-6 pb-5 leading-relaxed" style={{ color: "var(--color-dust)" }}>{a}</p>
      </div>
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal><SectionHeading eyebrow="Questions" title={<>Good to <span className="gradient-text">know</span></>} /></Reveal>
        <div className="mt-12 flex flex-col gap-3.5">
          {FAQS.map((f, i) => <Reveal key={f.q} delay={i * 60}><FaqItem q={f.q} a={f.a} /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <Reveal>
        <div className="mx-auto w-full max-w-4xl grad-border rounded-[32px] px-6 sm:px-12 py-16 text-center relative overflow-hidden"
          style={{ boxShadow: "0 50px 120px -50px rgba(124,58,237,0.6)" }}>
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18), transparent 60%)", animation: "glow-pulse 6s ease-in-out infinite" }} />
          <span className="eyebrow"><span className="live-dot" />Ready when you are</span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight">
            Your next customer is <span className="gradient-text">already on your site.</span>
          </h2>
          <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: "var(--color-dust)" }}>
            Give them someone to talk to. Build your agent in minutes — free for 3 days, no card required.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="/auth/login" className="btn-genesis w-full sm:w-auto">
              Build my agent — it&apos;s free
              <Ic name="arrow" size={17} />
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const links: [string, string][] = [
    ["How it works", "#how"], ["Features", "#capabilities"],
    ["Pricing", "#pricing"], ["FAQ", "#faq"],
    ["Sign in", "/auth/login"], ["Support", "mailto:omarmaher23942@gmail.com"],
  ];
  return (
    <footer className="px-5 sm:px-8 pb-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="cosmic-divider mb-10" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size={28} showWordmark />
            <p className="text-sm max-w-xs" style={{ color: "var(--color-dust)" }}>
              The AI agent that answers your customers and captures real leads — built in minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            {links.map(([l, h]) => (
              <a key={l} href={h} style={{ color: "var(--color-dust)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust)")}>{l}</a>
            ))}
          </div>
        </div>
        <p className="mt-10 text-xs text-center" style={{ color: "var(--color-dust)" }}>
          © {new Date().getFullYear()} EasyBuilda. Built to grow your business. ✦
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <LeadsSection />
        <HowItWorks />
        <Channels />
        <Capabilities />
        <Industries />
        <WhyUs />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}