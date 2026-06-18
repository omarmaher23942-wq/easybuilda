"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type Tone = "professional" | "friendly" | "energetic" | "luxury" | "casual";

interface FormData {
  business_name: string;
  business_type: string;
  description: string;
  services: string;
  prices: string;
  hours: string;
  location: string;
  contact: string;
  usp: string;
  tone: Tone;
}

interface PipelineResult {
  agent_id: string;
  username: string;
  leads_pin: string;
}

type Phase = "onboarding" | "planning" | "analyzing" | "building" | "refining" | "finalizing" | "done" | "error";

const STEPS = [
  { id: "business_name", label: "Business name",      question: "What's your business called?",             hint: "The name your customers know you by",                    type: "text",     placeholder: "e.g. City Dental, Bella Hair, Quick Fix Plumbing…", required: true  },
  { id: "business_type", label: "What you do",        question: "What type of business is this?",           hint: "A one-line description of your industry",                type: "text",     placeholder: "e.g. Dental clinic, hair salon, plumbing service…",  required: true  },
  { id: "description",   label: "About your business",question: "Tell us about what makes you different",   hint: "Who do you serve? What's your edge?",                   type: "textarea", placeholder: "We specialize in… Our customers are… We're known for…", required: true  },
  { id: "services",      label: "Services & products",question: "What services or products do you offer?",  hint: "List your main offerings — the AI will learn them all",  type: "textarea", placeholder: "• Checkup & cleaning\n• Whitening\n• Emergency appointments", required: true  },
  { id: "prices",        label: "Pricing",             question: "What are your prices?",                   hint: "Approximate prices help customers get fast answers",      type: "textarea", placeholder: "• Checkup — $90\n• Whitening — $350\n• Emergency — from $120", required: false },
  { id: "hours",         label: "Business hours",      question: "When are you open?",                      hint: "Days and hours — include any exceptions",                 type: "textarea", placeholder: "Mon–Fri: 9am – 6pm\nSat: 10am – 3pm\nSunday: Closed",  required: false },
  { id: "location",      label: "Location",            question: "Where are you located?",                  hint: "Address, city, or service area",                         type: "text",     placeholder: "123 Main St, Austin TX — or 'We serve the greater LA area'", required: false },
  { id: "contact",       label: "Contact & booking",   question: "How do customers reach or book you?",     hint: "Phone, email, website — whatever you use most",          type: "textarea", placeholder: "(512) 555-0100\nhello@yourbusiness.com\nyourbooking.com", required: false },
  { id: "usp",           label: "Your advantage",      question: "What's your biggest edge over competitors?", hint: "Quality, price, speed, warranty, experience…",        type: "text",     placeholder: "Same-day appointments, 10-year warranty, family-owned since 1998…", required: false },
  { id: "tone",          label: "Agent personality",   question: "How should your AI agent speak to customers?", hint: "Choose the tone that fits your brand",            type: "tone",     placeholder: "", required: true  },
] as const;

const TONES = [
  { value: "professional" as Tone, label: "Professional", desc: "Formal & precise" },
  { value: "friendly"     as Tone, label: "Friendly",     desc: "Warm & approachable" },
  { value: "energetic"    as Tone, label: "Energetic",    desc: "Upbeat & enthusiastic" },
  { value: "luxury"       as Tone, label: "Luxury",       desc: "Elegant & refined" },
  { value: "casual"       as Tone, label: "Casual",       desc: "Relaxed & easy-going" },
];

// SVG Icons (no emojis)
function ToneIcon({ tone }: { tone: string }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tone) {
    case "professional": return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
    case "friendly":     return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case "energetic":    return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "luxury":       return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "casual":       return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    default:             return null;
  }
}

function phasePct(p: Phase): number {
  return { onboarding: 0, planning: 20, analyzing: 45, building: 65, refining: 82, finalizing: 94, done: 100, error: 0 }[p] ?? 0;
}

function phaseLabel(p: Phase): string {
  return { onboarding: "", planning: "Planning your agent…", analyzing: "Crafting personality…", building: "Building your agent…", refining: "Polishing quality…", finalizing: "Almost ready…", done: "Done!", error: "Something went wrong" }[p] ?? "";
}

/* ── Genesis Orb ─────────────────────────────────────────────────── */
function GenesisOrb({ pct, label }: { pct: number; label: string }) {
  const R = 54, circ = 2 * Math.PI * R, dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div style={{ position: "relative", width: 148, height: 148 }}>
        <div style={{ position: "absolute", inset: -18, borderRadius: "50%", background: "conic-gradient(from 0deg,transparent 0%,rgba(124,58,237,0.55) 30%,rgba(56,189,248,0.5) 60%,transparent 100%)", filter: "blur(12px)", animation: "orbSpin 3s linear infinite" }} />
        <svg width="148" height="148" viewBox="0 0 148 148" style={{ position: "absolute", inset: 0 }}>
          <circle cx="74" cy="74" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="74" cy="74" r={R} fill="none" stroke="url(#gGrad)" strokeWidth="5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 74 74)" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
          <defs>
            <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%,rgba(192,132,252,0.95),rgba(124,58,237,0.6) 50%,rgba(37,99,235,0.35) 75%,transparent)", boxShadow: "0 0 60px rgba(124,58,237,0.45),inset 0 0 30px rgba(56,189,248,0.18)", animation: "breathe 3.5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "#fff" }}>{pct}%</div>
      </div>
      {label && <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--color-dust)", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>{label}</p>}
    </div>
  );
}

/* ── Agent Reveal ─────────────────────────────────────────────────── */
function AgentReveal({ result, name, color }: { result: PipelineResult; name: string; color: string }) {
  const h = (color || "#7c3aed").replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center", animation: "revealIn 0.7s cubic-bezier(0.34,1.4,0.64,1) both", maxWidth: 480, width: "100%" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg,${color},#22d3ee)`, boxShadow: `0 0 70px rgba(${rgb},0.55)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "#fff" }}>
        {name.slice(0,2).toUpperCase()}
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--color-nebula)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Your AI agent is live</p>
        <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>Meet {name}</h2>
        <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.88rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none" }}>
          easybuilda.vercel.app/{result.username} ↗
        </a>
      </div>

      {/* PIN */}
      <div style={{ padding: "18px 24px", borderRadius: 18, width: "100%", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.68rem", color: "var(--color-nebula)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Leads dashboard PIN — save this now!
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {result.leads_pin.split("").map((d, i) => (
            <span key={i} style={{ width: 42, height: 52, borderRadius: 11, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-starlight)" }}>{d}</span>
          ))}
        </div>
        <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "var(--color-dust)" }}>Use this to access your leads page. Also visible in your dashboard.</p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/dashboard" style={{ padding: "0.8rem 2rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", fontFamily: "var(--font-sans)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
          Go to dashboard →
        </a>
        <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.8rem 1.8rem", borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
          View agent ↗
        </a>
      </div>
    </div>
  );
}

/* ── Step Input ───────────────────────────────────────────────────── */
function StepInput({ step, value, onChange, onNext }: { step: typeof STEPS[number]; value: string; onChange: (v: string) => void; onNext: () => void }) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 80); }, [step.id]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && step.type !== "textarea") { e.preventDefault(); onNext(); }
  };

  const baseStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1.5px solid var(--line-bright)",
    borderRadius: 14, color: "var(--color-starlight)", fontFamily: "var(--font-sans)",
    outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.15s",
  };

  if (step.type === "tone") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 10, width: "100%" }}>
        {TONES.map(t => (
          <button key={t.value} onClick={() => { onChange(t.value); setTimeout(onNext, 200); }}
            style={{ padding: "14px 14px", borderRadius: 14, cursor: "pointer", border: `1.5px solid ${value === t.value ? "rgba(124,58,237,0.6)" : "var(--line)"}`, background: value === t.value ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: value === t.value ? "#a78bfa" : "var(--color-dust)", transition: "color 0.15s" }}>
              <ToneIcon tone={t.value} />
            </span>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.88rem", color: "var(--color-starlight)" }}>{t.label}</p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--color-dust)" }}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (step.type === "textarea") {
    return (
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={4} placeholder={step.placeholder} value={value}
        onChange={e => onChange(e.target.value)} onKeyDown={onKey}
        style={{ ...baseStyle, padding: "14px 16px", lineHeight: 1.65, resize: "none", fontSize: "0.95rem" }}
        onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--line-bright)"; }} />
    );
  }

  return (
    <input ref={ref as React.RefObject<HTMLInputElement>} type="text" placeholder={step.placeholder} value={value}
      onChange={e => onChange(e.target.value)} onKeyDown={onKey}
      style={{ ...baseStyle, padding: "14px 18px", fontSize: "1rem" }}
      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--line-bright)"; }} />
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
const EMPTY: FormData = { business_name: "", business_type: "", description: "", services: "", prices: "", hours: "", location: "", contact: "", usp: "", tone: "friendly" };
const LS_DATA = "eb_build_data_v2";
const LS_STEP = "eb_build_step_v2";

export default function BuildPage() {
  const [step,       setStep]       = useState(0);
  const [data,       setData]       = useState<FormData>(EMPTY);
  const [restored,   setRestored]   = useState(false);
  const [phase,      setPhase]      = useState<Phase>("onboarding");
  const [pct,        setPct]        = useState(0);
  const [phaseMsg,   setPhaseMsg]   = useState("");
  const [result,     setResult]     = useState<PipelineResult | null>(null);
  const [agentName,  setAgentName]  = useState("Aria");
  const [agentColor, setAgentColor] = useState("#7c3aed");
  const [error,      setError]      = useState("");
  const [token,      setToken]      = useState("");
  const [animating,  setAnimating]  = useState(false);

  const total   = STEPS.length;
  const current = STEPS[step];
  const progress = (step / total) * 100;

  // Auth
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data: d }) => {
      if (!d.session) { window.location.href = "/auth/login"; return; }
      setToken(d.session.access_token);
    });
  }, []);

  // Restore (once on mount)
  useEffect(() => {
    try {
      const sd = localStorage.getItem(LS_DATA);
      const ss = localStorage.getItem(LS_STEP);
      if (sd) setData(JSON.parse(sd));
      if (ss) setStep(Math.min(parseInt(ss), total - 1));
    } catch {}
    setRestored(true);
  }, [total]);

  // Save (only after restore)
  useEffect(() => {
    if (!restored || phase !== "onboarding") return;
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(data));
      localStorage.setItem(LS_STEP, String(step));
    } catch {}
  }, [data, step, phase, restored]);

  const currentValue = data[current.id as keyof FormData] as string;

  const goNext = useCallback(() => {
    if (current.required && !currentValue.trim()) return;
    if (step < total - 1) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
    } else {
      startBuild();
    }
  }, [step, total, current, currentValue]);

  const goBack = () => {
    if (step > 0) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 180);
    }
  };

  const setValue = (v: string) => setData(prev => ({ ...prev, [current.id]: v }));

  const startBuild = async () => {
    try { localStorage.removeItem(LS_DATA); localStorage.removeItem(LS_STEP); } catch {}

    setPhase("planning");
    setPct(20);
    setPhaseMsg("Planning your agent…");

    const summary = Object.entries(data)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join("\n");

    try {
      const res = await fetch(`${API}/api/build/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: "user", content: summary }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError((err as any).detail || "Build failed. Please try again.");
        setPhase("error");
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() ?? "";

        for (const block of blocks) {
          const ev = block.match(/^event: (.+)/m)?.[1]?.trim();
          const raw = block.match(/^data: (.+)/m)?.[1];
          if (!ev || !raw) continue;
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(raw); } catch { continue; }

          if (ev === "phase") { setPhase(payload.phase as Phase); setPct(payload.pct as number); setPhaseMsg(payload.label as string); }
          if (ev === "complete") { const ag = (payload as any).agent; if (ag) { setAgentName(ag.name || "Aria"); setAgentColor(ag.primary_color || "#7c3aed"); } }
          if (ev === "saved") { setResult(payload as unknown as PipelineResult); setPct(100); setTimeout(() => setPhase("done"), 700); }
          if (ev === "error") { setError(String(payload.message || "Build failed.")); setPhase("error"); }
        }
      }
    } catch {
      setError("Connection error. Please check your internet and try again.");
      setPhase("error");
    }
  };

  // Done
  if (phase === "done" && result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-void)", backgroundImage: "radial-gradient(700px 500px at 60% 20%,rgba(124,58,237,0.14),transparent 65%)" }}>
        <AgentReveal result={result} name={agentName} color={agentColor} />
        <style>{`@keyframes revealIn{from{opacity:0;transform:scale(0.85) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      </div>
    );
  }

  // Pipeline
  if (phase !== "onboarding") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: 24, background: "var(--color-void)" }}>
        <GenesisOrb pct={pct} label={phaseMsg || phaseLabel(phase)} />
        {phase === "error" && (
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <p style={{ color: "#f87171", marginBottom: 16, fontSize: "0.9rem", lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => { setPhase("onboarding"); setError(""); setStep(total - 1); }}
              style={{ padding: "0.65rem 1.4rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.04)", color: "var(--color-starlight)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}>
              ← Go back and try again
            </button>
          </div>
        )}
        <style>{`@keyframes orbSpin{to{transform:rotate(360deg)}} @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}`}</style>
      </div>
    );
  }

  // Onboarding
  const isTone = (current.type as string) === "tone";

  return (
    <>
      <style>{`
        @keyframes orbSpin{to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
        @keyframes stepIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stepOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-10px)}}
      `}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-void)", backgroundImage: "radial-gradient(900px 500px at 65% -10%,rgba(124,58,237,0.1),transparent 62%)" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#7c3aed,#22d3ee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 1024 1024"><defs><linearGradient id="hLogo"><stop offset="0" stopColor="#fff"/></linearGradient></defs><path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="white"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Build your AI agent</p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)" }}>Step {step + 1} of {total}</p>
          </div>
          <a href="/dashboard" style={{ fontSize: "0.78rem", color: "var(--color-dust)", textDecoration: "none", opacity: 0.6 }}>✕ Cancel</a>
        </header>

        {/* Progress */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#7c3aed,#22d3ee)", width: `${progress}%`, transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)", boxShadow: "0 0 12px rgba(124,58,237,0.6)" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
          <div style={{ width: "100%", maxWidth: 540, animation: animating ? "stepOut 0.18s ease forwards" : "stepIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
            <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--color-nebula)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{current.label}</p>
            <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.55rem", color: "var(--color-starlight)", letterSpacing: "-0.02em", lineHeight: 1.25 }}>{current.question}</h2>
            <p style={{ margin: "0 0 24px", fontSize: "0.82rem", color: "var(--color-dust)", lineHeight: 1.55 }}>
              {current.hint}
              {!current.required && <span style={{ marginLeft: 6, opacity: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>(optional)</span>}
            </p>

            <StepInput step={current} value={currentValue} onChange={setValue} onNext={goNext} />

            {!isTone && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                {step > 0 && (
                  <button onClick={goBack} style={{ padding: "0.72rem 1.2rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.03)", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.88rem", fontFamily: "var(--font-sans)", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--line-bright)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
                    ← Back
                  </button>
                )}
                <button onClick={goNext} disabled={current.required && !currentValue.trim()}
                  style={{ flex: 1, padding: "0.78rem 1.6rem", borderRadius: 11, background: (current.required && !currentValue.trim()) ? "rgba(124,58,237,0.22)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", cursor: (current.required && !currentValue.trim()) ? "not-allowed" : "pointer", fontSize: "0.92rem", fontWeight: 600, fontFamily: "var(--font-sans)", boxShadow: (current.required && !currentValue.trim()) ? "none" : "0 0 22px rgba(124,58,237,0.35)", transition: "all 0.15s" }}>
                  {step === total - 1 ? "Build my agent →" : "Continue →"}
                </button>
              </div>
            )}

            {!current.required && !isTone && (
              <button onClick={goNext} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-sans)", opacity: 0.55 }}>
                Skip →
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "16px 24px 24px" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i < step ? "var(--color-nebula)" : i === step ? "var(--color-stellar)" : "rgba(255,255,255,0.1)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }} />
          ))}
        </div>
      </div>
    </>
  );
}