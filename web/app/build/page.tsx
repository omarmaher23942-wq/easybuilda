"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

interface BuiltAgent {
  id: string; name: string; username: string; business_name: string;
  tagline: string; primary_color: string; readiness_score: number;
  readiness_notes: string; leads_pin: string; plan: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  void:     "#05070f",
  cosmos:   "#0a0e1a",
  nebula:   "#7c3aed",
  stellar:  "#38bdf8",
  aurora:   "#22d3ee",
  gold:     "#fbbf24",
  green:    "#34d399",
  red:      "#f87171",
  starlight:"#edf0f7",
  dust:     "#8891a8",
  line:     "rgba(237,240,247,0.08)",
  lineBright:"rgba(237,240,247,0.14)",
};

const FONT_DISPLAY = "var(--font-display,'Sora',sans-serif)";
const FONT_MONO    = "var(--font-mono,'JetBrains Mono',monospace)";
const FONT_SANS    = "var(--font-sans,'Inter',sans-serif)";

// ── Tones ─────────────────────────────────────────────────────────────────────
const TONES = [
  { id:"professional", label:"Professional", desc:"Formal, precise, trustworthy",    icon:"◈", color:"#38bdf8" },
  { id:"friendly",     label:"Friendly",     desc:"Warm, approachable, helpful",      icon:"✦", color:"#34d399" },
  { id:"energetic",    label:"Energetic",    desc:"Bold, enthusiastic, dynamic",       icon:"⚡", color:"#fbbf24" },
  { id:"luxury",       label:"Luxury",       desc:"Elegant, refined, exclusive",       icon:"◆", color:"#a855f7" },
  { id:"casual",       label:"Casual",       desc:"Relaxed, human, conversational",    icon:"○", color:"#22d3ee" },
];

// ── AI Conversation types ─────────────────────────────────────────────────────
type MsgRole = "ai" | "user";
interface Msg { role: MsgRole; text: string; ts: number; }

// ── AI Questions flow ─────────────────────────────────────────────────────────
const AI_QUESTIONS = [
  {
    key: "business_name",
    ask: "Hey! I'm your AI agent builder 🤖\n\nLet's start with the basics — what's your business called?",
    placeholder: "e.g. Omar's Dental Clinic",
    validate: (v: string) => v.trim().length >= 2,
    hint: "Just the name is fine!"
  },
  {
    key: "industry",
    ask: (name: string) => `Great! So **${name}** — what industry or field is this?\n\nThis helps me understand your market and competition.`,
    placeholder: "e.g. Dental care, E-commerce, Real estate...",
    validate: (v: string) => v.trim().length >= 2,
    hint: "Be specific — 'healthcare' vs 'pediatric dentistry' makes a big difference."
  },
  {
    key: "target",
    ask: "Perfect. Who are your typical customers?\n\nAge range, location, what they usually need from you?",
    placeholder: "e.g. Families in Cairo, 25-45, looking for affordable dental care",
    validate: (v: string) => v.trim().length >= 10,
    hint: "The more specific, the smarter your agent will be."
  },
  {
    key: "services",
    ask: "What are your main products or services?\n\nList the key ones — I'll make sure your agent knows them all.",
    placeholder: "e.g. Teeth whitening, braces, fillings, root canals...",
    validate: (v: string) => v.trim().length >= 5,
    hint: "Separate with commas or just describe naturally."
  },
  {
    key: "usp",
    ask: "What makes you different from competitors?\n\nEvery business has something special — what's yours?",
    placeholder: "e.g. Same-day appointments, lowest prices in area, 10+ years experience...",
    validate: (v: string) => v.trim().length >= 5,
    hint: "This becomes your agent's selling point in every conversation."
  },
  {
    key: "website_url",
    ask: "Do you have a website? If yes, paste the link — I'll scrape it to learn more about you automatically 🔍\n\nIf not, just say 'no website'",
    placeholder: "https://yourbusiness.com or 'no website'",
    validate: (v: string) => v.trim().length >= 2,
    hint: "I'll analyze your site content for better agent knowledge."
  },
  {
    key: "tone",
    ask: "Last question — what vibe should your agent have?\n\nPick the personality that fits your brand:",
    type: "tone_picker",
    validate: (v: string) => TONES.some(t => t.id === v),
    hint: "You can always change this later from your dashboard."
  },
];

// ── Genesis reveal ─────────────────────────────────────────────────────────────
const GENESIS_PHASES = [
  { label: "Scanning your business online...",    dur: 3000 },
  { label: "Building AI knowledge base...",       dur: 5000 },
  { label: "Crafting your agent personality...", dur: 4000 },
  { label: "Final touches & quality check...",   dur: 3000 },
];

function GenesisReveal({ agent, error, onDone }: { agent: BuiltAgent | null; error: string; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (agent || error) {
      setProgress(100);
      setTimeout(() => setRevealed(true), 800);
      return;
    }
    let elapsed = 0;
    const total = GENESIS_PHASES.reduce((s, p) => s + p.dur, 0);
    const tick = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(95, (elapsed / total) * 100));
      let acc = 0;
      for (let i = 0; i < GENESIS_PHASES.length; i++) {
        acc += GENESIS_PHASES[i].dur;
        if (elapsed < acc) { setPhase(i); break; }
      }
    }, 100);
    return () => clearInterval(tick);
  }, [agent, error]);

  const color = agent?.primary_color || "#7c3aed";

  return (
    <div style={{ minHeight:"100vh", background:C.void, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes orb-pulse { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.07);opacity:1} }
        @keyframes ring-cw   { to{transform:rotate(360deg)} }
        @keyframes ring-ccw  { to{transform:rotate(-360deg)} }
        @keyframes fade-up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* Ambient bg */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-30%", left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle, ${color}22 0%, transparent 60%)`, filter:"blur(60px)" }}/>
      </div>

      <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:520 }}>
        {/* Orb */}
        <div style={{ position:"relative", width:140, height:140, margin:"0 auto 40px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {/* Outer ring */}
          <div style={{ position:"absolute", inset:-20, borderRadius:"50%", border:`1px solid ${color}33`, animation:"ring-cw 12s linear infinite" }}>
            {[0,120,240].map((deg,i) => (
              <div key={i} style={{ position:"absolute", left:"50%", top:0, width:6, height:6, borderRadius:"50%", background:i===0?color:i===1?C.stellar:C.aurora, boxShadow:`0 0 10px ${i===0?color:i===1?C.stellar:C.aurora}`, transform:`rotate(${deg}deg) translateX(-50%) translateY(-50%)`, transformOrigin:"0 90px" }}/>
            ))}
          </div>
          {/* Inner ring */}
          <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:`1px dashed ${C.stellar}33`, animation:"ring-ccw 7s linear infinite" }}/>
          {/* Core */}
          <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg, #a855f7, ${color} 40%, #2563eb 70%, ${C.aurora})`, boxShadow:`0 0 0 1px ${color}44, 0 0 30px ${color}88, 0 0 70px ${color}33, inset 0 1px 0 rgba(255,255,255,.2)`, animation:"orb-pulse 3s ease-in-out infinite", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            <div style={{ position:"absolute", top:12, left:18, width:32, height:16, borderRadius:"50%", background:"rgba(255,255,255,.22)", filter:"blur(5px)" }}/>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:"rgba(255,255,255,.95)", letterSpacing:"-0.04em", position:"relative", zIndex:1 }}>E</span>
          </div>
        </div>

        {!revealed ? (
          <>
            <p style={{ fontFamily:FONT_MONO, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.aurora, marginBottom:"1.2rem" }}>
              {agent || error ? "Complete" : "Genesis in progress"}
            </p>
            <h1 style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"1.6rem", color:C.starlight, marginBottom:"0.6rem", letterSpacing:"-0.025em" }}>
              {agent || error ? "Your agent is ready" : GENESIS_PHASES[phase]?.label}
            </h1>
            {/* Progress bar */}
            <div style={{ width:280, height:3, borderRadius:99, background:"rgba(255,255,255,.08)", margin:"2rem auto 1rem", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, borderRadius:99, background:`linear-gradient(90deg, ${color}, ${C.aurora})`, transition:"width .3s ease", boxShadow:`0 0 12px ${color}` }}/>
            </div>
            <p style={{ fontFamily:FONT_MONO, fontSize:"0.7rem", color:C.dust }}>{Math.round(progress)}%</p>
          </>
        ) : (
          <div style={{ animation:"fade-up .6s ease forwards" }}>
            {error ? (
              <>
                <p style={{ fontFamily:FONT_MONO, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.red, marginBottom:"1rem" }}>Build failed</p>
                <h1 style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"1.5rem", color:C.starlight, marginBottom:"0.8rem" }}>Something went wrong</h1>
                <p style={{ color:C.dust, fontSize:"0.9rem", marginBottom:"2rem", lineHeight:1.6 }}>{error}</p>
                <button onClick={onDone} style={{ padding:"0.9rem 2rem", borderRadius:12, background:"rgba(255,255,255,.06)", border:`1px solid ${C.lineBright}`, color:C.starlight, cursor:"pointer", fontFamily:FONT_SANS, fontSize:"0.9rem" }}>
                  ← Back to wizard
                </button>
              </>
            ) : agent ? (
              <>
                <p style={{ fontFamily:FONT_MONO, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.green, marginBottom:"1rem" }}>
                  ✓ Agent Created
                </p>
                <h1 style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"2rem", color:C.starlight, marginBottom:"0.4rem", letterSpacing:"-0.03em" }}>
                  Meet <span style={{ background:`linear-gradient(90deg, ${color}, ${C.aurora})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{agent.name}</span>
                </h1>
                <p style={{ color:C.dust, fontSize:"0.9rem", marginBottom:"2rem" }}>{agent.tagline}</p>

                {/* Readiness */}
                <div style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${C.line}`, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem", textAlign:"left" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontFamily:FONT_MONO, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.12em", color:C.dust }}>Agent readiness</span>
                    <span style={{ fontFamily:FONT_MONO, fontSize:"0.72rem", fontWeight:700, color:agent.readiness_score>=75?C.green:agent.readiness_score>=50?C.gold:C.red }}>{agent.readiness_score}/100</span>
                  </div>
                  <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,.06)", overflow:"hidden", marginBottom:10 }}>
                    <div style={{ height:"100%", width:`${agent.readiness_score}%`, borderRadius:99, background:agent.readiness_score>=75?`linear-gradient(90deg,${C.green},${C.aurora})`:agent.readiness_score>=50?`linear-gradient(90deg,${C.gold},#f59e0b)`:`linear-gradient(90deg,${C.red},#ef4444)`, boxShadow:`0 0 10px ${agent.readiness_score>=75?C.green:C.gold}` }}/>
                  </div>
                  {agent.readiness_notes && <p style={{ fontSize:"0.78rem", color:C.dust, lineHeight:1.6, margin:0 }}>{agent.readiness_notes}</p>}
                </div>

                {/* URL */}
                <div style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${C.line}`, borderRadius:12, padding:"0.9rem 1.2rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:FONT_MONO, fontSize:"0.72rem", color:C.dust, flex:1 }}>
                    easybuilda.vercel.app/<span style={{ color }}>{agent.username}</span>
                  </span>
                  <a href={`/${agent.username}`} target="_blank" rel="noopener noreferrer" style={{ color:C.dust, fontSize:"0.72rem", textDecoration:"none", display:"flex" }}>↗</a>
                </div>

                {/* PIN */}
                {agent.leads_pin && (
                  <div style={{ background:`rgba(124,58,237,.06)`, border:`1px solid rgba(124,58,237,.2)`, borderRadius:12, padding:"0.9rem 1.2rem", marginBottom:"1.5rem", textAlign:"left" }}>
                    <p style={{ fontFamily:FONT_MONO, fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.12em", color:C.nebula, marginBottom:6 }}>🔒 Leads PIN — Save this!</p>
                    <p style={{ fontFamily:FONT_MONO, fontWeight:700, fontSize:"1.5rem", color:C.starlight, letterSpacing:"0.25em", margin:0 }}>
                      {agent.leads_pin.split("").join("  ")}
                    </p>
                    <p style={{ fontSize:"0.7rem", color:C.dust, margin:"6px 0 0" }}>This PIN protects your leads. Save it — won't be shown in full again.</p>
                  </div>
                )}

                <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"1rem 2.5rem", borderRadius:14, textDecoration:"none", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"1rem", color:"#fff", background:`linear-gradient(135deg, #7c3aed, #2563eb 55%, #0ea5e9)`, boxShadow:`0 0 36px rgba(124,58,237,.5), 0 4px 20px rgba(0,0,0,.3)`, transition:"filter .2s, transform .2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.filter="brightness(1.1)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.filter="none";(e.currentTarget as HTMLElement).style.transform="none";}}
                >
                  Go to dashboard →
                </a>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Conversation UI ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.stellar, animation:`typing-dot .9s ease-in-out ${i*.2}s infinite alternate` }}/>
      ))}
      <style>{`@keyframes typing-dot{from{opacity:.2;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`}</style>
    </span>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isAI = msg.role === "ai";
  return (
    <div style={{ display:"flex", justifyContent:isAI?"flex-start":"flex-end", marginBottom:"0.75rem", animation:"fade-up .35s ease forwards" }}>
      <style>{`@keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {isAI && (
        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#a855f7,#7c3aed 40%,#2563eb 70%,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:13, color:"#fff", flexShrink:0, marginRight:10, boxShadow:"0 0 14px rgba(124,58,237,.4)" }}>E</div>
      )}
      <div style={{
        maxWidth:"75%",
        padding:"0.85rem 1.1rem",
        borderRadius:isAI?"4px 16px 16px 16px":"16px 4px 16px 16px",
        background:isAI?"rgba(255,255,255,.05)":"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",
        border:isAI?`1px solid ${C.line}`:"none",
        color:C.starlight,
        fontSize:"0.88rem",
        lineHeight:1.65,
        fontFamily:FONT_SANS,
        whiteSpace:"pre-wrap",
        boxShadow:isAI?"none":"0 4px 20px rgba(124,58,237,.3)",
      }}>
        {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
      </div>
    </div>
  );
}

// ── Main Build Page ───────────────────────────────────────────────────────────
export default function BuildPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing,   setTyping]   = useState(false);
  const [input,    setInput]    = useState("");
  const [qIdx,     setQIdx]     = useState(-1); // -1 = not started
  const [answers,  setAnswers]  = useState<Record<string, string>>({});
  const [done,     setDone]     = useState(false);
  const [building, setBuilding] = useState(false);
  const [builtAgent, setBuiltAgent] = useState<BuiltAgent | null>(null);
  const [buildError, setBuildError] = useState("");
  const [token,    setToken]    = useState("");
  const [planError, setPlanError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const sb = createClient();

  // Get token
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/auth/login"; return; }
      setToken(session.access_token);
    });
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  // Start conversation
  const startConversation = useCallback(() => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages([{ role:"ai", text: AI_QUESTIONS[0].ask as string, ts: Date.now() }]);
      setQIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 800);
  }, []);

  useEffect(() => {
    const t = setTimeout(startConversation, 600);
    return () => clearTimeout(t);
  }, [startConversation]);

  const addMsg = (role: MsgRole, text: string) => {
    setMessages(prev => [...prev, { role, text, ts: Date.now() }]);
  };

  const handleAnswer = async (answer: string) => {
    const q = AI_QUESTIONS[qIdx];
    if (!q || !q.validate(answer)) return;

    // Add user message
    addMsg("user", answer);
    setInput("");

    // Save answer
    const newAnswers = { ...answers, [q.key]: answer };
    setAnswers(newAnswers);

    const nextIdx = qIdx + 1;

    if (nextIdx >= AI_QUESTIONS.length) {
      // All questions answered → build
      setDone(true);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMsg("ai", "Perfect! I have everything I need 🎯\n\nNow watch me build your AI agent — this usually takes 30-60 seconds...");
        setTimeout(() => startBuild(newAnswers), 1200);
      }, 600);
    } else {
      // Next question
      setTyping(true);
      const nextQ = AI_QUESTIONS[nextIdx];
      const question = typeof nextQ.ask === "function"
        ? nextQ.ask(newAnswers["business_name"] || "")
        : nextQ.ask;

      setTimeout(() => {
        setTyping(false);
        addMsg("ai", question);
        setQIdx(nextIdx);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 700 + Math.random() * 400);
    }
  };

  const startBuild = async (finalAnswers: Record<string, string>) => {
    setBuilding(true);

    // Build description from all answers
    const description = [
      `Industry: ${finalAnswers.industry || ""}`,
      `Target customers: ${finalAnswers.target || ""}`,
      `Services: ${finalAnswers.services || ""}`,
      `What makes us unique: ${finalAnswers.usp || ""}`,
    ].filter(Boolean).join(". ");

    const websiteRaw = finalAnswers.website_url || "";
    const websiteUrl = websiteRaw.toLowerCase().includes("no") ? "" : websiteRaw;

    try {
      const res = await fetch(`${API}/api/agents/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          business_name:       finalAnswers.business_name || "",
          business_description: description,
          services:            finalAnswers.services || "",
          website_url:         websiteUrl,
          tone:                finalAnswers.tone || "friendly",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setPlanError(data.detail || "Plan limit reached.");
          setBuilding(false);
          return;
        }
        throw new Error(data.detail || "Build failed");
      }
      setBuiltAgent(data.agent);
    } catch (e: unknown) {
      setBuildError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  // Plan error screen
  if (planError) {
    return (
      <div style={{ minHeight:"100vh", background:C.void, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", textAlign:"center" }}>
        <div style={{ maxWidth:440, width:"100%" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 1.5rem" }}>⚡</div>
          <h2 style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"1.5rem", color:C.starlight, marginBottom:"0.75rem" }}>Plan limit reached</h2>
          <p style={{ color:C.dust, fontSize:"0.9rem", lineHeight:1.65, marginBottom:"2rem" }}>{planError}</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/pricing" style={{ padding:"0.9rem 1.8rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", textDecoration:"none", fontFamily:FONT_DISPLAY, fontWeight:600, fontSize:"0.9rem" }}>
              Upgrade plan →
            </a>
            <a href="/dashboard" style={{ padding:"0.9rem 1.8rem", borderRadius:12, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, textDecoration:"none", fontFamily:FONT_SANS, fontSize:"0.9rem" }}>
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Genesis / build screen
  if (building || builtAgent || buildError) {
    return (
      <GenesisReveal
        agent={builtAgent}
        error={buildError}
        onDone={() => { setBuilding(false); setBuiltAgent(null); setBuildError(""); setDone(false); setQIdx(0); setMessages([]); setAnswers({}); startConversation(); }}
      />
    );
  }

  const currentQ = AI_QUESTIONS[qIdx];
  const isTonePicker = currentQ?.type === "tone_picker";

  return (
    <div style={{ minHeight:"100vh", background:C.void, display:"flex", flexDirection:"column", fontFamily:FONT_SANS }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .chat-input:focus { outline:none; border-color: rgba(124,58,237,.5) !important; box-shadow: 0 0 0 3px rgba(124,58,237,.12) !important; }
        .send-btn:hover { filter:brightness(1.1); transform:scale(1.05); }
        .tone-card:hover { border-color: var(--tc) !important; background: rgba(255,255,255,.07) !important; }
        .tone-card.selected { border-color: var(--tc) !important; background: rgba(255,255,255,.06) !important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:99px }
      `}</style>

      {/* Header */}
      <header style={{ padding:"1rem 1.5rem", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:12, background:"rgba(5,7,15,.8)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:10 }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#a855f7,#7c3aed 40%,#2563eb 72%,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:13, color:"#fff", boxShadow:"0 0 14px rgba(124,58,237,.4)" }}>E</div>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:"0.9rem", color:C.starlight }}>EasyBuilda</span>
        </a>
        <div style={{ flex:1 }}/>
        <span style={{ fontFamily:FONT_MONO, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.15em", color:C.dust }}>
          {qIdx >= 0 ? `${Math.min(qIdx+1, AI_QUESTIONS.length)} / ${AI_QUESTIONS.length}` : "Starting..."}
        </span>
        <a href="/dashboard" style={{ fontSize:"0.78rem", color:C.dust, textDecoration:"none", padding:"0.4rem 0.8rem", borderRadius:8, background:"rgba(255,255,255,.04)", border:`1px solid ${C.line}` }}>Dashboard</a>
      </header>

      {/* Chat area */}
      <div style={{ flex:1, overflowY:"auto", padding:"1.5rem 1rem 1rem", display:"flex", flexDirection:"column", maxWidth:660, margin:"0 auto", width:"100%" }}>
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg}/>)}
        {typing && (
          <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"0.75rem" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#a855f7,#7c3aed 40%,#2563eb 70%,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:13, color:"#fff", flexShrink:0, marginRight:10 }}>E</div>
            <div style={{ padding:"0.85rem 1.1rem", borderRadius:"4px 16px 16px 16px", background:"rgba(255,255,255,.05)", border:`1px solid ${C.line}` }}>
              <TypingDots/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Tone picker */}
      {isTonePicker && !done && (
        <div style={{ maxWidth:660, margin:"0 auto", width:"100%", padding:"0 1rem 1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
            {TONES.map(t => (
              <button key={t.id}
                className={`tone-card${answers.tone === t.id ? " selected" : ""}`}
                
                onClick={() => handleAnswer(t.id)}
                style={{
                  padding:"0.9rem 0.8rem", borderRadius:14, border:`1px solid ${answers.tone===t.id?t.color:C.line}`,
                  background:answers.tone===t.id?"rgba(255,255,255,.06)":"rgba(255,255,255,.03)",
                  cursor:"pointer", textAlign:"left", transition:"all .18s",
                }}>
                <div style={{ fontSize:"1.2rem", marginBottom:6 }}>{t.icon}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:600, fontSize:"0.85rem", color:t.color, marginBottom:3 }}>{t.label}</div>
                <div style={{ fontSize:"0.72rem", color:C.dust, lineHeight:1.4 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      {!isTonePicker && !done && qIdx >= 0 && (
        <div style={{ borderTop:`1px solid ${C.line}`, padding:"1rem", background:"rgba(5,7,15,.9)", backdropFilter:"blur(20px)" }}>
          <div style={{ maxWidth:660, margin:"0 auto", display:"flex", gap:10 }}>
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && handleAnswer(input.trim())}
              placeholder={currentQ?.placeholder || "Type your answer..."}
              style={{
                flex:1, padding:"0.85rem 1.1rem", borderRadius:12,
                background:"rgba(255,255,255,.05)", border:`1px solid ${C.line}`,
                color:C.starlight, fontSize:"0.9rem", fontFamily:FONT_SANS,
                transition:"border-color .18s, box-shadow .18s",
              }}
            />
            <button
              className="send-btn"
              onClick={() => input.trim() && handleAnswer(input.trim())}
              disabled={!input.trim()}
              style={{
                padding:"0 1.2rem", borderRadius:12, border:"none",
                background:input.trim()?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,.06)",
                color:input.trim()?"#fff":C.dust, cursor:input.trim()?"pointer":"not-allowed",
                transition:"all .18s", flexShrink:0, fontSize:"1.1rem",
              }}>
              ↑
            </button>
          </div>
          {currentQ?.hint && (
            <p style={{ maxWidth:660, margin:"0.5rem auto 0", fontSize:"0.72rem", color:`${C.dust}99`, fontFamily:FONT_MONO }}>
              💡 {currentQ.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}