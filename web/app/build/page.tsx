"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type Tone = "professional" | "friendly" | "energetic" | "luxury" | "casual";
type Phase = "onboarding" | "validating" | "planning" | "analyzing" | "building" | "refining" | "finalizing" | "done" | "error";

interface FormData {
  business_name: string; business_type: string; description: string;
  services: string; prices: string; hours: string; location: string;
  contact: string; website: string; tone: Tone; warranty: string; usp: string;
  custom_username: string; // Pro only
}

interface PipelineResult { agent_id: string; username: string; leads_pin: string; }
interface Profile { plan: string; full_name?: string; }

const EMPTY: FormData = {
  business_name: "", business_type: "", description: "", services: "",
  prices: "", hours: "", location: "", contact: "", website: "",
  tone: "friendly", warranty: "", usp: "", custom_username: "",
};

const STEPS_BASE = [
  { id: "business_name",  label: "Business name",      question: "What's your business name?",                hint: "The name your customers know you by.", required: true, type: "text" },
  { id: "business_type",  label: "Business type",      question: "What kind of business is this?",            hint: "e.g. Restaurant, Law firm, Online store, Clinic…", required: true, type: "text" },
  { id: "description",    label: "About your business",question: "Describe your business in a few sentences.", hint: "What makes you unique? Who do you serve?", required: true, type: "textarea" },
  { id: "services",       label: "Services & products", question: "What services or products do you offer?",   hint: "List your main offerings — the more detail, the better.", required: true, type: "textarea" },
  { id: "prices",         label: "Pricing",             question: "What are your prices?",                     hint: "Approximate prices help the AI answer customers accurately.", required: false, type: "textarea" },
  { id: "hours",          label: "Working hours",       question: "What are your working hours?",              hint: "e.g. Mon-Fri 9am-6pm, Sat 10am-3pm", required: false, type: "text" },
  { id: "location",       label: "Location",            question: "Where are you located?",                    hint: "City, address, or service area.", required: false, type: "text" },
  { id: "contact",        label: "Contact & booking",   question: "How do customers contact or book with you?",hint: "Phone, email, WhatsApp, booking link…", required: false, type: "textarea" },
  { id: "website",        label: "Website",             question: "Do you have a website or social media?",    hint: "This helps the agent direct customers to the right place.", required: false, type: "text" },
  { id: "warranty",       label: "Policies",            question: "Any policies, guarantees, or special offers?", hint: "Return policy, warranty, free delivery, etc.", required: false, type: "textarea" },
  { id: "tone",           label: "Agent personality",   question: "Pick a tone for your AI agent.",            hint: "This shapes how your agent communicates.", required: true, type: "tone" },
];

const STEP_PRO_USERNAME = {
  id: "custom_username", label: "Custom URL",
  question: "Choose a custom URL for your agent.",
  hint: "e.g. 'my-cafe' → easybuilda.vercel.app/my-cafe (3-24 chars, letters & numbers only)",
  required: false, type: "text",
};

const TONES: { value: Tone; emoji: string; label: string; desc: string }[] = [
  { value: "professional", emoji: "💼", label: "Professional", desc: "Formal & precise"   },
  { value: "friendly",     emoji: "😊", label: "Friendly",     desc: "Warm & approachable"},
  { value: "energetic",    emoji: "⚡", label: "Energetic",    desc: "Bold & enthusiastic" },
  { value: "luxury",       emoji: "✨", label: "Luxury",       desc: "Elegant & exclusive" },
  { value: "casual",       emoji: "👋", label: "Casual",       desc: "Relaxed & real"      },
];

function phasePct(p: Phase) {
  return { onboarding:0, validating:12, planning:28, analyzing:50, building:70, refining:85, finalizing:94, done:100, error:0 }[p] ?? 0;
}
function phaseLabel(p: Phase) {
  return { onboarding:"", validating:"Analyzing your business…", planning:"Planning your agent…", analyzing:"Crafting personality…", building:"Building agent…", refining:"Refining responses…", finalizing:"Almost ready…", done:"Done!", error:"Something went wrong" }[p] ?? "";
}

/* ── Genesis Orb ── */
function GenesisOrb({ pct, label }: { pct: number; label: string }) {
  const R = 60; const circ = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "conic-gradient(from 0deg,transparent,rgba(124,58,237,0.5) 30%,rgba(56,189,248,0.4) 60%,transparent)", filter: "blur(10px)", animation: "orbSpin 4s linear infinite" }} />
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="80" cy="80" r={R} fill="none" stroke="url(#gGrad)" strokeWidth="5"
            strokeDasharray={`${(pct/100)*circ} ${circ}`}
            strokeLinecap="round" transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
          <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--color-starlight)" }}>{pct}%</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-dust)", textAlign: "center", fontFamily: "var(--font-mono)" }}>{label}</p>
    </div>
  );
}

/* ── Agent Reveal ── */
function AgentReveal({ result, name, color }: { result: PipelineResult; name: string; color: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 440, animation: "revealIn 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ width: 80, height: 80, borderRadius: 22, margin: "0 auto 20px", background: `linear-gradient(135deg,${color},#22d3ee)`, boxShadow: `0 0 40px ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#fff" }}>
        {name.slice(0,2).toUpperCase()}
      </div>
      <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-starlight)" }}>
        {name} is ready! 🎉
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "var(--color-dust)" }}>Your AI agent is live and ready to handle customers.</p>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px", marginBottom: 20, textAlign: "left" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>AGENT URL</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399", flexShrink: 0 }} />
          <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--color-stellar)", textDecoration: "none" }}>
            easybuilda.vercel.app/{result.username} ↗
          </a>
        </div>
        {result.leads_pin && (
          <div style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--color-dust)" }}>
            Leads PIN: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-starlight)", fontWeight: 700 }}>{result.leads_pin}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: `linear-gradient(135deg,${color},#22d3ee)`, color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${color}44` }}>
          Test your agent ↗
        </a>
        <a href="/dashboard" style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Dashboard →
        </a>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function BuildPage() {
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [token,      setToken]      = useState("");
  const [data,       setData]       = useState<FormData>(EMPTY);
  const [step,       setStep]       = useState(0);
  const [animating,  setAnimating]  = useState(false);
  const [phase,      setPhase]      = useState<Phase>("onboarding");
  const [pct,        setPct]        = useState(0);
  const [phaseMsg,   setPhaseMsg]   = useState("");
  const [result,     setResult]     = useState<PipelineResult | null>(null);
  const [agentName,  setAgentName]  = useState("Agent");
  const [agentColor, setAgentColor] = useState("#7c3aed");
  const [error,      setError]      = useState("");

  // Build steps based on plan
  const isPro = profile?.plan === "pro" || profile?.plan === "max";
  const STEPS = isPro ? [...STEPS_BASE, STEP_PRO_USERNAME] : STEPS_BASE;
  const total = STEPS.length;
  const current = STEPS[step];
  const currentValue = data[current?.id as keyof FormData] as string ?? "";
  const progress = ((step) / total) * 100;

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data: d }) => {
      if (!d.session) { window.location.href = "/auth/login"; return; }
      setToken(d.session.access_token);
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${d.session.access_token}` } })
        .then(r => r.json()).then(p => setProfile(p)).catch(() => {});
    });
  }, []);

  const setValue = useCallback((val: string) => {
    setData(prev => ({ ...prev, [current.id]: val }));
  }, [current]);

  const goNext = useCallback(() => {
    if (step < total - 1) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 180);
    } else {
      startBuild();
    }
  }, [step, total]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 180);
    }
  }, [step]);

  const startBuild = async () => {
    setPhase("validating"); setPct(12); setPhaseMsg("Analyzing your business…");

    const messages = Object.entries(data)
      .filter(([k, v]) => v && k !== "custom_username")
      .map(([k, v]) => ({ role: "user" as const, content: `${k.replace(/_/g," ")}: ${v}` }));

    const customUsername = data.custom_username?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || undefined;

    try {
      const res = await fetch(`${API}/api/build/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages, username: customUsername }),
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
          const ev  = block.match(/^event: (.+)/m)?.[1]?.trim();
          const raw = block.match(/^data: (.+)/m)?.[1];
          if (!ev || !raw) continue;
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(raw); } catch { continue; }

          if (ev === "phase") {
            setPhase(payload.phase as Phase);
            setPct(payload.pct as number);
            setPhaseMsg(payload.label as string);
          }
          if (ev === "complete") {
            const ag = (payload as any).agent;
            if (ag) { setAgentName(ag.name || "Agent"); setAgentColor(ag.primary_color || "#7c3aed"); }
          }
          if (ev === "saved") {
            setResult(payload as unknown as PipelineResult);
            setPct(100);
            setTimeout(() => setPhase("done"), 600);
          }
          if (ev === "error") {
            setError((payload.message as string) || "Build failed.");
            setPhase("error");
          }
        }
      }
    } catch {
      setError("Connection error. Please try again.");
      setPhase("error");
    }
  };

  // ── Done ──
  if (phase === "done" && result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-void)", backgroundImage: "radial-gradient(700px 500px at 60% 20%,rgba(124,58,237,0.14),transparent 65%)" }}>
        <AgentReveal result={result} name={agentName} color={agentColor} />
        <style>{`@keyframes revealIn{from{opacity:0;transform:scale(0.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      </div>
    );
  }

  // ── Pipeline ──
  if (phase !== "onboarding") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: 24, background: "var(--color-void)" }}>
        <GenesisOrb pct={pct} label={phaseMsg || phaseLabel(phase)} />
        {phase === "error" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#f87171", marginBottom: 16, fontSize: "0.9rem" }}>{error}</p>
            <button onClick={() => { setPhase("onboarding"); setError(""); setStep(total - 1); }} style={{ padding: "0.65rem 1.4rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.04)", color: "var(--color-starlight)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              ← Go back and try again
            </button>
          </div>
        )}
        <style>{`@keyframes orbSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Onboarding ──
  return (
    <>
      <style>{`
        @keyframes orbSpin{to{transform:rotate(360deg)}}
        @keyframes stepIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stepOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-12px)}}
        .build-inp{width:100%;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:13px;color:var(--color-starlight);font-size:1rem;font-family:var(--font-sans);outline:none;transition:border-color 0.2s;resize:none}
        .build-inp:focus{border-color:rgba(124,58,237,0.5)}
        .build-inp::placeholder{color:rgba(255,255,255,0.2)}
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-void)", backgroundImage: "radial-gradient(900px 500px at 65% -10%,rgba(124,58,237,0.1),transparent 62%)" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#7c3aed,#22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>E</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-starlight)" }}>Build your AI agent</p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--color-dust)" }}>
              Step {step + 1} of {total}
              {isPro && <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 100, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: "0.62rem", fontWeight: 700 }}>PRO</span>}
            </p>
          </div>
          <a href="/dashboard" style={{ fontSize: "0.78rem", color: "var(--color-dust)", textDecoration: "none", opacity: 0.6 }}>✕ Cancel</a>
        </header>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#7c3aed,#22d3ee)", width: `${progress}%`, transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)", boxShadow: "0 0 12px rgba(124,58,237,0.6)" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
          <div style={{ width: "100%", maxWidth: 520, animation: animating ? "stepOut 0.18s ease forwards" : "stepIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>

            <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--color-nebula)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {current?.label}
              {current?.id === "custom_username" && <span style={{ marginLeft: 8, color: "#a78bfa" }}>✦ Pro feature</span>}
            </p>

            <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.55rem", color: "var(--color-starlight)", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
              {current?.question}
            </h2>

            <p style={{ margin: "0 0 24px", fontSize: "0.82rem", color: "var(--color-dust)", lineHeight: 1.55 }}>
              {current?.hint}
              {!current?.required && <span style={{ marginLeft: 6, opacity: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>(optional)</span>}
            </p>

            {/* Tone picker */}
            {current?.type === "tone" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {TONES.map(t => (
                  <button key={t.value} onClick={() => { setValue(t.value); goNext(); }} style={{ padding: "14px 16px", borderRadius: 13, border: `1px solid ${currentValue === t.value ? "rgba(124,58,237,0.6)" : "var(--line)"}`, background: currentValue === t.value ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{t.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-starlight)", fontFamily: "var(--font-display)" }}>{t.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-dust)" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            ) : current?.type === "textarea" ? (
              <textarea className="build-inp" rows={4} placeholder={`Type here…`} value={currentValue} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && e.ctrlKey && goNext()} />
            ) : (
              <input className="build-inp" type="text" placeholder="Type here…" value={currentValue} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && goNext()} autoFocus />
            )}

            {/* Custom URL preview */}
            {current?.id === "custom_username" && currentValue && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", fontSize: "0.78rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>
                Preview: <span style={{ color: "var(--color-stellar)" }}>easybuilda.vercel.app/{currentValue.toLowerCase().replace(/[^a-z0-9-]/g, "-")}</span>
              </div>
            )}

            {/* Navigation */}
            {current?.type !== "tone" && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                {step > 0 && (
                  <button onClick={goBack} style={{ padding: "0.7rem 1.2rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.03)", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.88rem", fontFamily: "var(--font-sans)" }}>
                    ← Back
                  </button>
                )}
                <button onClick={goNext} disabled={!!(current?.required && !currentValue.trim())} style={{ flex: 1, padding: "0.75rem 1.6rem", borderRadius: 11, background: (current?.required && !currentValue.trim()) ? "rgba(124,58,237,0.25)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", cursor: (current?.required && !currentValue.trim()) ? "not-allowed" : "pointer", fontSize: "0.92rem", fontWeight: 600, fontFamily: "var(--font-sans)", boxShadow: (current?.required && !currentValue.trim()) ? "none" : "0 0 22px rgba(124,58,237,0.35)", transition: "all 0.15s" }}>
                  {step === total - 1 ? "Build my agent →" : "Continue →"}
                </button>
              </div>
            )}

            {!current?.required && current?.type !== "tone" && (
              <button onClick={goNext} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-sans)", opacity: 0.55 }}>
                Skip this step →
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