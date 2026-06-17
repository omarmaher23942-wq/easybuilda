"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

/* ============================== ICONS ============================== */
function Ic({ name }: { name: string }) {
  const p = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.6,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
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
    case "voice": return (<svg {...p}><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>);
    case "check": return (<svg {...p}><path d="M20 6L9 17l-5-5" /></svg>);
    case "bolt": return (<svg {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>);
    default: return null;
  }
}

/* ============================== REVEAL ============================== */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${seen ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ============================== DATA ============================== */
const STEPS = [
  { n: "01", title: "Describe your business", body: "Answer a few smart questions — our AI fills in the rest from your website. It learns your services, prices, and the way you talk." },
  { n: "02", title: "Your agent comes to life", body: "In minutes you get a trained agent with its own name, personality, and knowledge. Review it, fine-tune the tone, make it yours." },
  { n: "03", title: "Embed it & capture leads", body: "Drop one line on your site or share your own page. Visitors chat, and qualified leads land in your inbox — around the clock." },
];

const CAPABILITIES = [
  { icon: "knowledge", title: "Answers from your knowledge", body: "Grounded in your real services, prices, and FAQs — so it helps customers, it doesn't make things up." },
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
  { icon: "page", title: "Its own page", body: "Every agent gets a beautiful page at easybuilda.com/yourname — share it anywhere, instantly." },
  { icon: "voice", title: "Voice on your site", body: "On Singularity, customers can talk to your agent out loud and hear it answer back.", badge: "Singularity" },
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
    name: "Free", price: "$0", period: "3-day Max trial", tagline: "Experience the ceiling, free.",
    cta: "Start free", popular: false,
    features: ["AI agent at Max quality", "Website widget + your page", "Full private leads page", "30 conversations / day", "No credit card needed"],
  },
  {
    name: "Basic", price: "$49", period: "/month", tagline: "Your always-on front desk.",
    cta: "Choose Basic", popular: false,
    features: ["Smart AI agent", "Unlimited replies", "Leads page + email alerts", "Your brand, name & tone", "Knowledge: site, docs & FAQ", "Email support"],
  },
  {
    name: "Pro", price: "$129", period: "/month", tagline: "Captures, qualifies, books.",
    cta: "Choose Pro", popular: true,
    features: ["Everything in Basic, plus:", "Smarter agent + deep lead qualifying", "Suggested next actions", "Analytics & insights", "Appointment booking", "Live human handoff", "Integrations (n8n, Zapier, webhooks)", "Daily summary + CSV export", "2 team seats"],
  },
  {
    name: "Max", price: "$299", period: "/month", tagline: "The smartest agent you can run.",
    cta: "Choose Max", popular: false,
    features: ["Everything in Pro, plus:", "Smartest agent on the platform", "Auto follow-up + multilingual", "A/B testing & optimization", "Your own URL: easybuilda.com/you", "No EasyBuilda branding", "Up to 3 agents + API access", "5 team seats"],
  },
  {
    name: "Singularity", price: "$699", period: "/month", tagline: "A fleet, fully yours.",
    cta: "Talk to us", popular: false,
    features: ["Everything in Max, plus:", "Voice agent on your site", "Unlimited agents (fleet)", "Full white-label", "Dedicated resources + SLA", "Custom integrations", "Account manager + onboarding"],
  },
];

const FAQS = [
  { q: "Do I need to know how to code?", a: "Not at all. You describe your business in plain words, our AI builds the agent, and you add it to your site by pasting one line — or just share your easybuilda.com page." },
  { q: "How fast is it live?", a: "Minutes. The moment you finish describing your business, your agent is trained and ready to talk to customers." },
  { q: "What does the free trial include?", a: "Three days of our full Max experience — the smartest agent and the complete leads page — with no credit card. You only choose a plan when the trial ends." },
  { q: "Where do the leads go?", a: "To your own private leads page at easybuilda.com/yourname/leads — every interested visitor with their intent, what they need, and a suggested next step, all in one place." },
  { q: "Can I use my own name and URL?", a: "Yes. On Max and above you choose your own address, easybuilda.com/yourname, and remove all EasyBuilda branding." },
  { q: "Can my agent talk out loud?", a: "Voice lives on Singularity — customers can speak to your agent on your site and hear it respond naturally." },
  { q: "Can I cancel anytime?", a: "Always. No contracts, no lock-in. Upgrade, downgrade, or cancel whenever you want." },
];

/* ============================== SHARED ============================== */
function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="eyebrow"><span className="live-dot" />{eyebrow}</span>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-[2.7rem] font-bold leading-[1.12] tracking-tight">{title}</h2>
      {sub && <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: "var(--color-dust)" }}>{sub}</p>}
    </div>
  );
}

/* ============================== NAVBAR ============================== */
function Navbar() {
  const links = [["How it works", "#how"], ["Features", "#capabilities"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass w-full max-w-6xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between" style={{ borderColor: "var(--line-bright)" }}>
        <a href="#top" className="flex items-center gap-2.5 shrink-0"><Logo size={30} showWordmark /></a>
        <div className="hidden md:flex items-center gap-7">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="text-sm transition-colors" style={{ color: "var(--color-dust)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-starlight)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-dust)")}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" className="hidden sm:inline-block text-sm font-medium px-3 py-1.5" style={{ color: "var(--color-starlight)" }}>Sign in</a>
          <a href="#pricing" className="btn-genesis btn-sm">Build my agent</a>
        </div>
      </nav>
    </header>
  );
}

/* ============================== CHAT PREVIEW ============================== */
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
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-available)" }}><span className="live-dot" />Online</span>
      </div>
      <div className="flex flex-col gap-3 text-sm text-left">
        <div className="self-end max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5" style={{ background: "var(--genesis)", color: "#fff" }}>How much is a deep clean for a 2-bedroom?</div>
        <div className="self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-2.5" style={{ background: "var(--color-surface)", border: "1px solid var(--line)" }}>
          A 2-bedroom deep clean is <strong>$180</strong> and takes about 3 hours. Want me to find you a slot this week?
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#7dd3fc" }}>Yes, this week</span>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#7dd3fc" }}>What's included?</span>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--color-surface)", border: "1px solid var(--line)" }}>
        <span className="text-sm flex-1" style={{ color: "var(--color-dust)" }}>Ask anything…</span>
        <span className="grid place-items-center w-8 h-8 rounded-full" style={{ background: "var(--genesis)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-dust)" }}>
        <Logo size={14} /> Built with EasyBuilda
      </div>
    </div>
  );
}

/* ============================== HERO ============================== */
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
            Describe what you do. EasyBuilda builds an AI agent for your website that answers customers, captures real leads, and books appointments -- around the clock, in your voice. Live in minutes, no code.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5">
            <a href="#pricing" className="btn-genesis w-full sm:w-auto">Build my agent
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            {["No credit card", "3-day Max trial", "Live in minutes"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span style={{ color: "var(--color-available)" }}><Ic name="check" /></span>{t}
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

/* ============================== LEADS (THE CORE) ============================== */
function LeadCard({ name, intent, intentLabel, interest, summary, action, meta }: { name: string; intent: string; intentLabel: string; interest: string; summary: string; action: string; meta: string }) {
  return (
    <div className="card p-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{name}</p>
        <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap intent-${intent}`}>{intentLabel}</span>
      </div>
      <p className="mt-2.5 text-sm"><span style={{ color: "var(--color-dust)" }}>Interested in: </span><span className="font-medium">{interest}</span></p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>{summary}</p>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <span style={{ color: "#c4b5fd", marginTop: 1 }}><Ic name="bolt" /></span>
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
            title={<>It doesn't just chat. <span className="gradient-text">It brings you customers.</span></>}
            sub="Every interested visitor becomes a qualified lead — name, intent, budget, and what they need — collected automatically and waiting for you on your own private leads page."
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-14 grad-border rounded-[28px] p-5 sm:p-7" style={{ boxShadow: "0 50px 110px -50px rgba(124,58,237,0.6)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2 text-left">
                <Logo size={26} />
                <div>
                  <p className="font-[family-name:var(--font-display)] font-semibold leading-tight">Your Leads</p>
                  <p className="text-xs font-[family-name:var(--font-mono)]" style={{ color: "var(--color-dust)" }}>easybuilda.com/sparkle-home/leads</p>
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
              <LeadCard intent="hot" intentLabel="🔥 Hot" name="Ahmed Mustafa" interest="Deep clean · 2-bedroom"
                summary="Wants a deep clean before the weekend. Asked about price and availability — said he's in a hurry."
                action="Call within 24h — high intent, ready to book." meta="$180 budget · this week · Cairo · 3:42 PM" />
              <LeadCard intent="warm" intentLabel="Warm" name="Sarah Lin" interest="Weekly cleaning plan"
                summary="Comparing options for a recurring plan for a 3-bedroom apartment. Wants pricing details emailed over."
                action="Send the weekly plan pricing — follow up in 2 days." meta="recurring · evaluating · 11:08 AM" />
              <LeadCard intent="cold" intentLabel="Cold" name="Marco D." interest="Move-out cleaning"
                summary="Browsing for a move-out clean next month. No date set yet, just gathering quotes."
                action="Add to nurture — check back near move-out date." meta="next month · early-stage · Yesterday" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <p className="mt-9 text-center text-sm" style={{ color: "var(--color-dust)" }}>
            Smarter plans qualify leads deeper — budget, timing, buying signals, and suggested next steps.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== HOW IT WORKS ============================== */
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

/* ============================== CHANNELS ============================== */
function Channels() {
  return (
    <section id="channels" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Where it lives" title={<>Lives on your site -- <span className="gradient-text">Talks like your best rep</span></>} sub="Add it to your website, give it its own page, or let customers speak to it out loud." />
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.title} delay={i * 110}>
              <div className="card h-full p-7 text-left">
                <span className="icon-tile"><Ic name={c.icon} /></span>
                <div className="mt-5 flex items-center gap-2 flex-wrap">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">{c.title}</h3>
                  {c.badge && <span className="text-[0.65rem] px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.3)", color: "#fcd34d" }}>{c.badge}</span>}
                </div>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--color-dust)" }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== CAPABILITIES ============================== */
function Capabilities() {
  return (
    <section id="capabilities" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="What your agent can do" title={<>More than answers. <span className="gradient-text">Real outcomes.</span></>} sub="It's not a chatbot reading from a script. It understands, acts, and brings you business." />
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

/* ============================== INDUSTRIES ============================== */
function Industries() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="Made for you" title={<>Built for <span className="gradient-text">how you sell.</span></>} sub="However your customers reach out, your agent already knows what they're looking for." />
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

/* ============================== WHY US ============================== */
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
                <span className="grid place-items-center w-10 h-10 rounded-xl" style={{ background: r.tone === "good" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${r.tone === "good" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, color: r.tone === "good" ? "var(--color-available)" : "var(--color-danger)" }}>
                  {r.tone === "good"
                    ? <Ic name="check" />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>}
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

/* ============================== PRICING ============================== */
function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  const popular = plan.popular;
  return (
    <div className={`relative flex flex-col w-full sm:w-[330px] xl:w-[236px] rounded-[20px] p-6 text-left ${popular ? "grad-border" : "card"}`}
      style={popular ? { boxShadow: "0 40px 90px -44px rgba(124,58,237,0.7)" } : undefined}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[0.68rem] font-semibold tracking-wide px-3 py-1 rounded-full whitespace-nowrap" style={{ background: "var(--genesis)", color: "#fff" }}>MOST POPULAR</span>
      )}
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-xs leading-snug min-h-[32px]" style={{ color: "var(--color-dust)" }}>{plan.tagline}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{plan.price}</span>
        <span className="text-sm" style={{ color: "var(--color-dust)" }}>{plan.period}</span>
      </div>
      <a href="#pricing" className={`mt-5 ${popular ? "btn-genesis" : "btn-ghost"} btn-sm w-full`}>{plan.cta}</a>
      <ul className="mt-6 flex flex-col gap-2.5">
        {plan.features.map((f) => {
          const header = f.endsWith(":");
          return (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              {!header && <span className="mt-0.5 shrink-0" style={{ color: "var(--color-stellar)" }}><Ic name="check" /></span>}
              <span style={{ color: header ? "var(--color-starlight)" : "var(--color-dust)", fontWeight: header ? 600 : 400 }}>{f}</span>
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
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <SectionHeading eyebrow="Pricing" title={<>Start free. <span className="gradient-text">Grow when it works.</span></>} sub="Every plan starts as a full 3-day Max trial. Pick what fits once you see the leads roll in." />
        </Reveal>
        <div className="mt-16 flex flex-wrap justify-center items-stretch gap-5">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 70}><PlanCard plan={p} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== FAQ ============================== */
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
      <div style={{ maxHeight: open ? 240 : 0, transition: "max-height 0.4s var(--ease)", overflow: "hidden" }}>
        <p className="px-6 pb-5 leading-relaxed" style={{ color: "var(--color-dust)" }}>{a}</p>
      </div>
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <SectionHeading eyebrow="Questions" title={<>Good to <span className="gradient-text">know</span></>} />
        </Reveal>
        <div className="mt-12 flex flex-col gap-3.5">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}><FaqItem q={f.q} a={f.a} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== FINAL CTA ============================== */
function FinalCta() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28">
      <Reveal>
        <div className="mx-auto w-full max-w-4xl grad-border rounded-[32px] px-6 sm:px-12 py-16 text-center relative overflow-hidden" style={{ boxShadow: "0 50px 120px -50px rgba(124,58,237,0.6)" }}>
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18), transparent 60%)", animation: "glow-pulse 6s ease-in-out infinite" }} />
          <span className="eyebrow"><span className="live-dot" />Ready when you are</span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight">
            Your next customer is <span className="gradient-text">already on your site.</span>
          </h2>
          <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: "var(--color-dust)" }}>
            Give them someone to talk to. Build your agent in minutes — free for 3 days, no card.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="#pricing" className="btn-genesis w-full sm:w-auto">Build my agent
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#how" className="btn-ghost w-full sm:w-auto">See how it works</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================== FOOTER ============================== */
function Footer() {
  return (
    <footer className="px-5 sm:px-8 pb-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="cosmic-divider mb-10" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size={28} showWordmark />
            <p className="text-sm max-w-xs" style={{ color: "var(--color-dust)" }}>The AI agent that answers your customers and captures real leads — built in minutes.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm" style={{ color: "var(--color-dust)" }}>
            <a href="#how">How it works</a>
            <a href="#capabilities">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="mailto:omarmaher23942@gmail.com">Support</a>
          </div>
        </div>
        <p className="mt-10 text-xs text-center" style={{ color: "var(--color-dust)" }}>© {new Date().getFullYear()} EasyBuilda. Built across the cosmos. ✦</p>
      </div>
    </footer>
  );
}

/* ============================== PAGE ============================== */
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
