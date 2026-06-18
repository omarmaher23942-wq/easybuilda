"use client";

import { useEffect, useRef, useState } from "react";

/* ── Logo ──────────────────────────────────────────────────────────── */
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
        <path
          d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z"
          fill="url(#ebLogo)"
        />
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "var(--color-starlight, #edf0f7)" }}>
          EasyBuilda
        </span>
      )}
    </a>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────── */
function Ic({ name }: { name: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "knowledge": return (<svg {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 3v18" /><path d="M8 7h6M8 11h6" /></svg>);
    case "leads": return (<svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>);
    case "calendar": return (<svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /><path d="M8.5 13.5l2 2 4-4" /></svg>);
    case "handoff": return (<svg {...p}><path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M2 20a5 5 0 0 1 10 0" /><path d="M16 8h6M16 8l2.5-2.5M16 8l2.5 2.5" /><path d="M22 16h-6M16 16l2.5-2.5M16 16l2.5 2.5" /></svg>);
    case "proactive": return (<svg {...p}><path d="M12 3l1.9 4.4L18 9l-4.1 1.6L12 15l-1.9-4.4L6 9l4.1-1.6z" /><path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" /></svg>);
    case "language": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>);
    case "followup": return (<svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v4h-4" /></svg>);
    case "learn": return (<svg {...p}><path d="M3 17l5-5 4 4 8-8" /><path d="M16 8h4v4" /></svg>);
    case "widget": return (<svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" /><path d="M9 11h6M9 14h4" /></svg>);
    case "page": return (<svg {...p}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 8h18" /><circle cx="6.5" cy="6" r="0.6" fill="currentColor" /><circle cx="9" cy="6" r="0.6" fill="currentColor" /></svg>);
    case "check": return (<svg {...p}><path d="M20 6L9 17l-5-5" /></svg>);
    case "bolt": return (<svg {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>);
    case "arrow": return (<svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
    default: return null;
  }
}

/* ── Reveal ────────────────────────────────────────────────────────── */
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

/* ── Data ──────────────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Describe your business", body: "Answer a few smart questions — our AI fills in the rest. It learns your services, prices, hours, and the way you talk to customers." },
  { n: "02", title: "Your agent comes to life", body: "In minutes you get a trained agent with its own name, personality, and knowledge. Review it, fine-tune the tone, make it completely yours." },
  { n: "03", title: "Embed it & capture leads", body: "Drop one line on your site or share your own page. Visitors chat, qualified leads land in your private dashboard — around the clock." },
];

const CAPABILITIES = [
  { icon: "knowledge", title: "Answers from your knowledge", body: "Grounded in your real services, prices, and FAQs — helps customers without making things up." },
  { icon: "leads", title: "Captures & qualifies leads", body: "Turns interested visitors into structured leads: name, intent, budget, and exactly what they need." },
  { icon: "calendar", title: "Books appointments", body: "Checks availability and schedules customers right inside the conversation, without you lifting a finger." },
  { icon: "handoff", title: "Hands off to you", body: "When a conversation needs a human, it alerts you instantly and lets you jump in live." },
  { icon: "proactive", title: "Engages proactively", body: "Greets visitors at the right moment, so far fewer people leave your site without a word." },
  { icon: "language", title: "Speaks their language", body: "Replies in your customer's own language, automatically — no setup required." },
  { icon: "followup", title: "Follows up automatically", body: "Re-engages warm leads before they go cold, so opportunities don't slip away." },
  { icon: "learn", title: "Gets smarter over time", body: "Learns from every conversation and tells you which questions it couldn't answer yet." },
];

const CHANNELS = [
  { icon: "widget", title: "On your website", body: "A polished chat widget that lives in the corner of your site. One line of code to install." },
  { icon: "page", title: "Its own page", body: "Every agent gets a beautiful page at easybuilda.vercel.app/yourname — share it anywhere, instantly." },
];

const INDUSTRIES = [
  { emoji: "🍽️", title: "Restaurants", body: "Answers menu questions, takes reservations, captures catering leads." },
  { emoji: "🩺", title: "Clinics", body: "Books appointments, explains services, qualifies new patients 24/7." },
  { emoji: "🛍️", title: "E-commerce", body: "Recommends products, answers order questions, recovers hesitant buyers." },
  { emoji: "🏡", title: "Real estate", body: "Fields property questions, schedules viewings, captures buyer intent." },
  { emoji: "💼", title: "Agencies", body: "Qualifies inbound inquiries and books discovery calls while you sleep." },
  { emoji: "🏋️", title: "Local services", body: "Quotes, schedules, and follows up — turning visits into booked jobs." },
];

const REASONS = [
  { title: "Better than a chatbot", body: "Old chatbots follow scripts and frustrate people. Yours actually understands, qualifies, and captures — like a trained rep.", tone: "good" },
  { title: "Cheaper than hiring", body: "A great agent that never sleeps, never misses a message, and answers every visitor — for a fraction of one salary.", tone: "good" },
  { title: "Doing nothing is expensive", body: "Every unanswered visitor is a customer your competitor gets instead. Your agent makes sure that stops.", tone: "bad" },
];

const PLANS = [
  {
    name: "Trial",
    price: "$0",
    period: "3 days free",
    tagline: "Experience the full platform, free.",
    cta: "Start free — no card",
    href: "/auth/login",
    popular: false,
    highlight: false,
    features: ["1 AI agent", "Full Pro experience for 3 days", "Lead capture & dashboard", "Your page at easybuilda.vercel.app/you", "No credit card needed"],
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
    features: ["1 AI agent", "Unlimited replies", "Private leads dashboard", "Custom name, tone & colors", "Knowledge base from your info", "Email support"],
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    tagline: "Captures, qualifies, books.",
    cta: "Choose Pro",
    href: "/auth/login",
    popular: false,
    highlight: true,
    features: ["Everything in Basic, plus:", "2 AI agents", "Custom URL slug", "Image upload in chat", "Analytics & conversation insights", "Priority support"],
  },
];

const FAQS = [
  { q: "Do I need to know how to code?", a: "Not at all. You describe your business in plain words, our AI builds the agent, and you add it to your site by pasting one line — or just share your easybuilda.vercel.app page." },
  { q: "How fast is it live?", a: "Minutes. The moment you finish describing your business, your agent is trained and ready to talk to customers." },
  { q: "What does the free trial include?", a: "Three days of the full Pro experience — the best agent quality and the complete leads dashboard — with no credit card. You only choose a plan when the trial ends." },
  { q: "Where do the leads go?", a: "To your own private leads page — every interested visitor with their intent, what they need, and a suggested next step, all in one place." },
  { q: "Can I cancel anytime?", a: "Always. No contracts, no lock-in. Upgrade, downgrade, or cancel whenever you want." },
  { q: "What languages does the agent support?", a: "Your agent automatically detects and replies in the customer's language. You set a default language when building your agent." },
];

/* ── Shared ────────────────────────────────────────────────────────── */
function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="eyebrow"><span className="live-dot" />{eyebrow}</span>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-[2.7rem] font-bold leading-[1.12] tracking-tight">{title}</h2>
      {sub && <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: "var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [["How it works", "#how"], ["Features", "#capabilities"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass w-full max-w-6xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between"
        style={{ borderColor: scrolled ? "var(--line-bright)" : "var(--line)", transition: "border-color 0.3s" }}>
        <a href="/" className="flex items-center gap-2.5 shrink-0"><Logo size={30} showWordmark /></a>
        <div className="hidden md:flex items-center gap-7">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="text-sm transition-colors" style={{ color: "var(--color-dust)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-starlight)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-dust)")}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/auth/login" className="hidden sm:inline-block text-sm font-medium px-3 py-1.5 transition-colors" style={{ color: "var(--color-starlight)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-nebula)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-starlight)")}>Sign in</a>
          <a href="/auth/login" className="btn-genesis btn-sm">Build my agent</a>
        </div>
      </nav>
    </header>
  );
}

/* ── Chat Preview ──────────────────────────────────────────────────── */
function ChatPreview() {
  return (
    <div className="glass rounded-[26px] p-5 sm:p-6 w-full" style={{ borderColor: "var(--line-bright)", boxShadow: "0 40px 90px -40px rgba(124,58,237,0.5)" }}>
      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-full font-[family-name:var(--font-display)] font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#22d3ee)" }}>V</div>
          <div className="text-left">
            <p className="font-semibold text-sm">Vera</p>
            <p className="text-xs" style={{ color: "var(--color-dust)" }}>Sparkle Home · AI assistant</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#34d399" }}>
          <span className="live-dot" />Online
        </span>
      </div>
      <div className="flex flex-col gap-3 text-sm text-left">
        <div className="self-end max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5" style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff" }}>
          How much is a deep clean for a 2-bedroom?
        </div>
        <div className="self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)" }}>
          A 2-bedroom deep clean is <strong>$180</strong> and takes about 3 hours. Want me to find you a slot this week?
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Yes, this week", "What's included?"].map(t => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.22)", color: "#7dd3fc" }}>{t}</span>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)" }}>
        <span className="text-sm flex-1" style={{ color: "var(--color-dust)" }}>Ask anything…</span>
        <span className="grid place-items-center w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg,#7c3aed,#22d3ee)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-dust)" }}>
        <Logo size={13} /> Built with EasyBuilda
      </div>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section id="top" className="px-5 sm:px-8">
      <div className="mx-auto w-full max-w-6xl flex flex-col items-center text-center pt-36 pb-20 sm:pt-40 sm:pb-28">
        <Reveal>
          <span className="eyebrow"><span className="live-dot" />The teammate that works while you sleep</span>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.05] sm:text-6xl md:text-[4.5rem] md:leading-[1.02] font-bold tracking-tight max-w-4xl">
            Your business deserves an AI that{" "}
            <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 35%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              already knows it
            </span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-7 text-lg sm:text-xl leading-relaxed max-w-2xl" style={{ color: "var(--color-dust)" }}>
            Describe what you do. EasyBuilda builds an AI agent for your website that answers customers, captures real leads, and books appointments — around the clock, in your voice. Live in minutes, no code.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5">
            <a href="/auth/login" className="btn-genesis w-full sm:w-auto" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
              Build my agent — free
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            {["No credit card", "3-day Pro trial", "Live in minutes"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span style={{ color: "#34d399" }}><Ic name="check" /></span>{t}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200} className="w-full">
          <div className="mt-16 mx-auto w-full max-w-md" style={{ animation: "float 7s ease-in-out infinite" }}>
            <ChatPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Leads Section ─────────────────────────────────────────────────── */
function LeadCard({ name, intent, intentLabel, interest, summary, action, meta }: { name: string; intent: string; intentLabel: string; interest: string; summary: string; action: string; meta: string }) {
  const colors = { hot: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", color: "#f87171" }, warm: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", color: "#fbbf24" }, cold: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)", color: "#38bdf8" } };
  const c = colors[intent as keyof typeof colors] ?? colors.cold;
  return (
    <div className="card p-5 text-left" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-sm">{name}</p>
        <span className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{intentLabel}</span>
      </div>
      <p className="mt-2.5 text-sm"><span style={{ color: "var(--color-dust)" }}>Interested in: </span><span className="font-medium">{interest}</span></p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>{summary}</p>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <span style={{ color: "#c4b5fd", marginTop: 1, flexShrink: 0 }}><Ic name="bolt" /></span>
        <p className="text-xs leading-relaxed" style={{ color: "#d6c8ff" }}>{action}</p>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--color-dust)" }}>{meta}</p>
    </div>
  );
}

function LeadsSection() {
  const stats = [["Total leads", "248"], ["🔥 Hot", "37"], ["This week", "61"], ["Conversion", "24%"]];
  return (
    <section id="leads" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="The whole point"
            title={<>It doesn't just chat. <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8 75%,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>It brings you customers.</span></>}
            sub="Every interested visitor becomes a qualified lead — name, intent, budget, and what they need — collected automatically on your own private leads page."
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-14 rounded-[28px] p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 50px 110px -50px rgba(124,58,237,0.6)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2 text-left">
                <Logo size={26} />
                <div>
                  <p className="font-[family-name:var(--font-display)] font-semibold leading-tight text-sm">Your Leads</p>
                  <p className="text-xs font-[family-name:var(--font-mono)]" style={{ color: "var(--color-dust)" }}>easybuilda.vercel.app/sparkle-home/leads</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {stats.map(([l, v]) => (
                  <div key={l} className="rounded-xl px-3.5 py-2 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)" }}>
                    <p className="text-[0.62rem] uppercase tracking-wide" style={{ color: "var(--color-dust)" }}>{l}</p>
                    <p className="font-[family-name:var(--font-display)] font-bold text-lg leading-tight">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <LeadCard intent="hot" intentLabel="🔥 Hot" name="Ahmed Mustafa" interest="Deep clean · 2-bedroom" summary="Wants a deep clean before the weekend. Asked about price and availability — said he's in a hurry." action="Call within 24h — high intent, ready to book." meta="$180 budget · this week · Cairo · 3:42 PM" />
              <LeadCard intent="warm" intentLabel="Warm" name="Sarah Lin" interest="Weekly cleaning plan" summary="Comparing options for a recurring plan for a 3-bedroom apartment. Wants pricing details emailed over." action="Send the weekly plan pricing — follow up in 2 days." meta="recurring · evaluating · 11:08 AM" />
              <LeadCard intent="cold" intentLabel="Cold" name="Marco D." interest="Move-out cleaning" summary="Browsing for a move-out clean next month. No date set yet, just gathering quotes." action="Add to nurture — check back near move-out date." meta="next month · early-stage · Yesterday" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── How It Works ──────────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="how" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="How it works" title={<>From a sentence to a <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>live agent.</span></>} sub="Three steps. No code, no setup, no waiting." />
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

/* ── Channels ──────────────────────────────────────────────────────── */
function Channels() {
  return (
    <section id="channels" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Where it lives" title={<>Lives on your site — <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>talks like your best rep</span></>} sub="Add it to your website or give it its own page — your customers talk to it wherever they find you." />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.title} delay={i * 110}>
              <div className="card h-full p-8 text-left">
                <span className="icon-tile"><Ic name={c.icon} /></span>
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

/* ── Capabilities ──────────────────────────────────────────────────── */
function Capabilities() {
  return (
    <section id="capabilities" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="What your agent can do" title={<>More than answers. <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Real outcomes.</span></>} sub="It's not a chatbot reading from a script. It understands, acts, and brings you business." />
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 4) * 90}>
              <div className="card h-full p-6 text-left">
                <span className="icon-tile"><Ic name={c.icon} /></span>
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

/* ── Industries ────────────────────────────────────────────────────── */
function Industries() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Made for you" title={<>Built for <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>how you sell.</span></>} sub="However your customers reach out, your agent already knows what they're looking for." />
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 90}>
              <div className="card h-full p-6 text-left flex items-start gap-4">
                <span className="text-3xl leading-none">{it.emoji}</span>
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

/* ── Why Us ────────────────────────────────────────────────────────── */
function WhyUs() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Why EasyBuilda" title={<>The math is <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>simple.</span></>} />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 110}>
              <div className="card h-full p-7 text-left">
                <span className="grid place-items-center w-10 h-10 rounded-xl" style={{ background: r.tone === "good" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${r.tone === "good" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, color: r.tone === "good" ? "#34d399" : "#f87171" }}>
                  {r.tone === "good" ? <Ic name="check" /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>}
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

/* ── Pricing ───────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="pricing" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title={<>Start free. <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Grow when it works.</span></>}
            sub="Every account starts with a 3-day Pro trial. No card needed. Pick a plan when you see the leads."
          />
        </Reveal>
        <div className="mt-16 grid sm:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80}>
              <div className={`relative flex flex-col h-full rounded-[22px] p-6 text-left ${plan.highlight ? "ring-1 ring-inset" : ""}`}
                style={{
                  background: plan.highlight ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${plan.highlight ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: plan.highlight ? "0 40px 90px -44px rgba(56,189,248,0.3)" : undefined,
                }}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[0.65rem] font-bold tracking-wide px-3 py-1 rounded-full whitespace-nowrap" style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff" }}>
                    MOST POPULAR
                  </span>
                )}
                {plan.highlight && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.7),transparent)" }} />
                )}
                <h3 className="font-[family-name:var(--font-display)] font-bold text-lg" style={{ color: plan.highlight ? "#38bdf8" : "var(--color-starlight)" }}>{plan.name}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-dust)" }}>{plan.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--color-dust)" }}>{plan.period}</span>
                </div>
                <a href={plan.href} className="mt-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
                  style={plan.highlight || plan.popular
                    ? { background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-starlight)" }}
                  onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}>
                  {plan.cta}
                  <Ic name="arrow" />
                </a>
                <ul className="mt-6 flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => {
                    const isHeader = f.endsWith(":");
                    return (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        {!isHeader && <span className="mt-0.5 shrink-0" style={{ color: "#34d399" }}><Ic name="check" /></span>}
                        <span style={{ color: isHeader ? "var(--color-starlight)" : "var(--color-dust)", fontWeight: isHeader ? 600 : 400 }}>{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-8 text-center text-sm" style={{ color: "var(--color-dust)" }}>
            Need more? <a href="mailto:omarmaher23942@gmail.com" style={{ color: "var(--color-stellar)", textDecoration: "none" }}>Contact us</a> for custom plans and enterprise options.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="font-medium">{q}</span>
        <span className="shrink-0 transition-transform" style={{ transform: open ? "rotate(45deg)" : "none", color: "var(--color-stellar)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <div style={{ maxHeight: open ? 300 : 0, transition: "max-height 0.35s ease", overflow: "hidden" }}>
        <p className="px-6 pb-5 leading-relaxed" style={{ color: "var(--color-dust)" }}>{a}</p>
      </div>
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal><SectionHeading eyebrow="Questions" title={<>Good to <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>know</span></>} /></Reveal>
        <div className="mt-12 flex flex-col gap-3.5">
          {FAQS.map((f, i) => (<Reveal key={f.q} delay={i * 60}><FaqItem q={f.q} a={f.a} /></Reveal>))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <Reveal>
        <div className="mx-auto w-full max-w-4xl rounded-[32px] px-6 sm:px-12 py-16 text-center relative overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 50px 120px -50px rgba(124,58,237,0.6)" }}>
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18), transparent 60%)" }} />
          <span className="eyebrow"><span className="live-dot" />Ready when you are</span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight">
            Your next customer is{" "}
            <span style={{ background: "linear-gradient(100deg,#c084fc,#818cf8 40%,#38bdf8 70%,#22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              already on your site.
            </span>
          </h2>
          <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: "var(--color-dust)" }}>
            Give them someone to talk to. Build your agent in minutes — free for 3 days, no card.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="/auth/login" className="btn-genesis w-full sm:w-auto" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
              Build my agent — it&apos;s free
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="px-5 sm:px-8 pb-12">
      <div className="mx-auto w-full max-w-6xl">
        <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.1) 30%,rgba(255,255,255,0.1) 70%,transparent)", marginBottom: 40 }} />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size={28} showWordmark />
            <p className="text-sm max-w-xs" style={{ color: "var(--color-dust)" }}>The AI agent that answers your customers and captures real leads — built in minutes.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            {[["How it works", "#how"], ["Features", "#capabilities"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Sign in", "/auth/login"], ["Support", "mailto:omarmaher23942@gmail.com"]].map(([l, h]) => (
              <a key={l} href={h} style={{ color: "var(--color-dust)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust)")}>{l}</a>
            ))}
          </div>
        </div>
        <p className="mt-10 text-xs text-center" style={{ color: "var(--color-dust)" }}>© {new Date().getFullYear()} EasyBuilda. Built to grow your business. ✦</p>
      </div>
    </footer>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
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