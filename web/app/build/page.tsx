"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/* ── Types ─────────────────────────────────────────────────────── */
interface Msg { role: "user" | "assistant"; content: string; }
interface PipelineResult { agent_id: string; username: string; leads_pin: string; }
interface Profile { plan: string; full_name?: string; }
type Phase = "chat" | "building" | "done" | "error";

/* ── Pipeline phase labels ──────────────────────────────────────── */
const PHASE_LABELS: Record<string, string> = {
  validating: "Analyzing your business…",
  planning:   "Planning your agent…",
  analyzing:  "Crafting personality…",
  building:   "Building agent…",
  refining:   "Refining responses…",
  finalizing: "Almost ready…",
  done:       "Done!",
};

/* ── Dots animation ─────────────────────────────────────────────── */
function Dots() {
  return (
    <div style={{ display:"flex", gap:5, padding:"14px 16px", alignItems:"center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-dust)", display:"block", animation:`tdot 1.2s ease-in-out ${i*0.18}s infinite` }} />
      ))}
    </div>
  );
}

/* ── Genesis Orb ────────────────────────────────────────────────── */
function GenesisOrb({ pct, label }: { pct: number; label: string }) {
  const R = 60, circ = 2*Math.PI*R;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
      <div style={{ position:"relative", width:160, height:160 }}>
        <div style={{ position:"absolute", inset:-16, borderRadius:"50%", background:"conic-gradient(from 0deg,transparent,rgba(124,58,237,0.5) 30%,rgba(56,189,248,0.4) 60%,transparent)", filter:"blur(10px)", animation:"orbSpin 4s linear infinite" }} />
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ position:"absolute", inset:0 }}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
          <circle cx="80" cy="80" r={R} fill="none" stroke="url(#gGrad)" strokeWidth="5"
            strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 80 80)"
            style={{ transition:"stroke-dasharray 0.6s ease" }}/>
          <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed"/>
              <stop offset="100%" stopColor="#22d3ee"/>
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.6rem", color:"var(--color-starlight)" }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ margin:"0 0 4px", fontSize:"0.9rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>{label}</p>
        <p style={{ margin:0, fontSize:"0.72rem", color:"rgba(255,255,255,0.2)", fontFamily:"var(--font-mono)" }}>Usually 2–5 minutes</p>
      </div>
    </div>
  );
}

/* ── Agent Reveal ───────────────────────────────────────────────── */
function AgentReveal({ result, name, color }: { result: PipelineResult; name: string; color: string }) {
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
  };
  return (
    <div style={{ textAlign:"center", maxWidth:480, animation:"revealIn 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ width:80, height:80, borderRadius:22, margin:"0 auto 20px", background:`linear-gradient(135deg,${color},#22d3ee)`, boxShadow:`0 0 48px ${color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:28, color:"#fff" }}>
        {name.slice(0,2).toUpperCase()}
      </div>
      <h2 style={{ margin:"0 0 6px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.6rem", color:"var(--color-starlight)", letterSpacing:"-0.02em" }}>
        {name} is live! 🎉
      </h2>
      <p style={{ margin:"0 0 28px", fontSize:"0.88rem", color:"var(--color-dust)", lineHeight:1.7 }}>
        Your AI agent is ready — answering customers 24/7 from this moment.
      </p>

      <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:16, padding:"18px 20px", marginBottom:20, textAlign:"left" }}>
        <div style={{ fontSize:"0.65rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", letterSpacing:"0.1em", marginBottom:10 }}>YOUR AGENT URL</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399", flexShrink:0 }}/>
          <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"var(--font-mono)", fontSize:"0.85rem", color:"var(--color-stellar)", textDecoration:"none", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            easybuilda.com/{result.username}
          </a>
          <button onClick={() => copy(`https://easybuilda.com/${result.username}`, "url")} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", flexShrink:0 }}>
            Copy
          </button>
        </div>
        {result.leads_pin && (
          <div style={{ padding:"10px 12px", background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div>
              <div style={{ fontSize:"0.62rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", letterSpacing:"0.08em", marginBottom:2 }}>LEADS DASHBOARD PIN</div>
              <div style={{ fontFamily:"var(--font-mono)", fontWeight:700, fontSize:"1rem", color:"var(--color-starlight)", letterSpacing:"0.15em" }}>{result.leads_pin}</div>
            </div>
            <div style={{ fontSize:"0.68rem", color:"var(--color-dust)", lineHeight:1.5, textAlign:"right" }}>
              Use this PIN to access<br/>your leads dashboard
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, padding:"0.85rem", borderRadius:13, background:`linear-gradient(135deg,${color},#22d3ee)`, color:"#fff", fontWeight:700, fontSize:"0.9rem", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:`0 0 28px ${color}55` }}>
          Test agent ↗
        </a>
        <a href="/dashboard" style={{ flex:1, padding:"0.85rem", borderRadius:13, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", color:"var(--color-starlight)", fontWeight:600, fontSize:"0.9rem", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
          Dashboard →
        </a>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function BuildPage() {
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [token,      setToken]      = useState("");
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [busy,       setBusy]       = useState(false);
  const [phase,      setPhase]      = useState<Phase>("chat");
  const [buildPct,   setBuildPct]   = useState(0);
  const [buildLabel, setBuildLabel] = useState("Starting…");
  const [result,     setResult]     = useState<PipelineResult | null>(null);
  const [agentName,  setAgentName]  = useState("Your Agent");
  const [agentColor, setAgentColor] = useState("#7c3aed");
  const [error,      setError]      = useState("");
  const [collecting, setCollecting] = useState(false); // interview started
  const [done,       setDone]       = useState(false);  // interview done, ready to build

  const bottom  = useRef<HTMLDivElement>(null);
  const inpRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: d }) => {
      if (!d.session) { window.location.href = "/auth/login"; return; }
      setToken(d.session.access_token);
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${d.session.access_token}` } })
        .then(r => r.json())
        .then(p => setProfile(p.profile ?? p))
        .catch(() => {});
    });
  }, []);

  // Auto-start interview with first AI message
  useEffect(() => {
    if (token && msgs.length === 0 && !collecting) {
      setCollecting(true);
      startInterview([]);
    }
  }, [token]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, busy]);

  const startInterview = async (history: Msg[]) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error("Interview failed");
      const d = await res.json();
      setMsgs(prev => [...prev, { role:"assistant", content: d.reply }]);
      if (d.done) setDone(true);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Let's start fresh — what's the name of your business and what do you do?" }]);
    } finally {
      setBusy(false);
      setTimeout(() => inpRef.current?.focus(), 50);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    if (inpRef.current) inpRef.current.style.height = "42px";

    const newMsgs: Msg[] = [...msgs, { role:"user", content: text }];
    setMsgs(newMsgs);
    setBusy(true);

    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ messages: newMsgs }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      const withReply: Msg[] = [...newMsgs, { role:"assistant", content: d.reply }];
      setMsgs(withReply);
      if (d.done) setDone(true);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Sorry, I had a moment. Please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => inpRef.current?.focus(), 50);
    }
  }, [input, busy, msgs, token]);

  const startBuild = useCallback(async () => {
    setPhase("building");
    setBuildPct(5);
    setBuildLabel("Starting build…");

    const isPro = profile?.plan === "pro" || profile?.plan === "max" || profile?.plan === "admin";

    try {
      const res = await fetch(`${API}/api/build/stream`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ messages: msgs, username: isPro ? undefined : undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError((err as any).detail || "Build failed. Please try again.");
        setPhase("error");
        return;
      }

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        buf += dec.decode(value, { stream:true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() ?? "";

        for (const block of blocks) {
          const ev  = block.match(/^event: (.+)/m)?.[1]?.trim();
          const raw = block.match(/^data: (.+)/m)?.[1];
          if (!ev || !raw) continue;
          let payload: any = {};
          try { payload = JSON.parse(raw); } catch { continue; }

          if (ev === "phase") { setBuildPct(payload.pct ?? 0); setBuildLabel(PHASE_LABELS[payload.phase] || payload.label || "Building…"); }
          if (ev === "complete") { if (payload.agent) { setAgentName(payload.agent.name || "Your Agent"); setAgentColor(payload.agent.primary_color || "#7c3aed"); } }
          if (ev === "saved")  { setResult(payload); setBuildPct(100); setTimeout(() => setPhase("done"), 800); }
          if (ev === "error")  { setError(payload.message || "Build failed."); setPhase("error"); }
        }
      }
    } catch {
      setError("Connection error. Please try again.");
      setPhase("error");
    }
  }, [msgs, token, profile]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Done ──
  if (phase === "done" && result) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"var(--color-void)", backgroundImage:"radial-gradient(700px 500px at 60% 20%,rgba(124,58,237,0.15),transparent 65%)" }}>
      <AgentReveal result={result} name={agentName} color={agentColor}/>
      <style>{`@keyframes revealIn{from{opacity:0;transform:scale(0.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );

  // ── Building ──
  if (phase === "building") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:32, padding:24, background:"var(--color-void)" }}>
      <GenesisOrb pct={buildPct} label={buildLabel}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", borderRadius:12, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.3)", maxWidth:380 }}>
        <span style={{ fontSize:"1rem", flexShrink:0 }}>⚠️</span>
        <p style={{ margin:0, fontSize:"0.78rem", color:"#fbbf24", lineHeight:1.5 }}>
          <strong>Don't refresh this page</strong> — it will restart the build from scratch.
        </p>
      </div>
      <style>{`@keyframes orbSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ──
  if (phase === "error") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:24, background:"var(--color-void)" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⚠️</div>
      <div style={{ textAlign:"center" }}>
        <p style={{ margin:"0 0 8px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-starlight)" }}>Build failed</p>
        <p style={{ margin:"0 0 20px", fontSize:"0.85rem", color:"var(--color-dust)" }}>{error}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={() => { setPhase("chat"); setError(""); }} style={{ padding:"0.7rem 1.4rem", borderRadius:11, border:"1px solid var(--line)", background:"rgba(255,255,255,0.04)", color:"var(--color-starlight)", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
            ← Back to chat
          </button>
          <button onClick={startBuild} style={{ padding:"0.7rem 1.4rem", borderRadius:11, background:"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"var(--font-sans)" }}>
            Try again →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Chat / Interview ──
  return (
    <>
      <style>{`
        @keyframes tdot  { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbSpin{to{transform:rotate(360deg)}}
        html,body{height:100%;margin:0}
        .msg-in { animation:msgIn 0.22s cubic-bezier(0.22,1,0.36,1) both }
        .ti { flex:1;background:transparent;border:none;outline:none;resize:none;font-family:var(--font-sans);font-size:0.92rem;color:var(--color-starlight);line-height:1.5;min-height:22px;max-height:120px;overflow-y:auto;padding:0 }
        .ti::placeholder{color:rgba(255,255,255,0.2)}
        @media(max-width:600px){.chat-bubble{font-size:0.85rem!important}.chat-header-name{font-size:0.88rem!important}}
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--color-void)", backgroundImage:"radial-gradient(700px 400px at 60% -5%,rgba(124,58,237,0.12),transparent 65%)" }}>

        {/* Header */}
        <header style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.88)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", flexShrink:0 }}>E</div>
          <div style={{ flex:1 }}>
            <p className="chat-header-name" style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:600, fontSize:"0.92rem", color:"var(--color-starlight)" }}>EasyBuilda AI</p>
            <p style={{ margin:0, fontSize:"0.68rem", color:"var(--color-dust)" }}>Building your AI agent</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Message counter */}
            {msgs.length > 0 && (
              <div style={{ padding:"3px 10px", borderRadius:100, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", fontSize:"0.65rem", color:"#a78bfa", fontFamily:"var(--font-mono)" }}>
                {Math.ceil(msgs.filter(m=>m.role==="user").length)}/12 questions
              </div>
            )}
            <a href="/dashboard" style={{ padding:"6px 12px", borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", color:"var(--color-dust)", textDecoration:"none", fontSize:"0.76rem" }}>✕ Cancel</a>
          </div>
        </header>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:14, maxWidth:720, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>

          {msgs.map((m,i) => (
            <div key={i} className="msg-in" style={{ display:"flex", gap:10, alignItems:"flex-end", flexDirection:m.role==="user"?"row-reverse":"row" }}>
              {m.role === "assistant" && (
                <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, boxShadow:"0 0 16px rgba(124,58,237,0.4)" }}>E</div>
              )}
              <div style={{ maxWidth:"78%" }}>
                <div className="chat-bubble" style={{
                  padding:"12px 16px",
                  borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                  background:m.role==="user"?"rgba(124,58,237,0.18)":"rgba(255,255,255,0.055)",
                  border:`1px solid ${m.role==="user"?"rgba(124,58,237,0.3)":"var(--line)"}`,
                  fontSize:"0.9rem", color:"var(--color-starlight)", lineHeight:1.65,
                  fontFamily:"var(--font-sans)", whiteSpace:"pre-wrap", wordBreak:"break-word",
                }}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="msg-in" style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>E</div>
              <div style={{ background:"rgba(255,255,255,0.055)", border:"1px solid var(--line)", borderRadius:"18px 18px 18px 4px" }}><Dots/></div>
            </div>
          )}

          <div ref={bottom}/>
        </div>

        {/* Build CTA — shows when interview is done */}
        {done && !busy && (
          <div style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"0 16px 12px", boxSizing:"border-box" }}>
            <div style={{ padding:"16px 20px", borderRadius:16, background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.1))", border:"1px solid rgba(124,58,237,0.35)", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 3px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", color:"var(--color-starlight)" }}>Ready to build! 🚀</p>
                <p style={{ margin:0, fontSize:"0.78rem", color:"var(--color-dust)" }}>I have everything I need. Your AI agent will be live in 2–5 minutes.</p>
              </div>
              <button onClick={startBuild} style={{ padding:"0.75rem 1.6rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:"pointer", fontFamily:"var(--font-sans)", boxShadow:"0 0 24px rgba(124,58,237,0.4)", whiteSpace:"nowrap", flexShrink:0 }}>
                Build my agent →
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {!done && (
          <div style={{ padding:"10px 14px 20px", borderTop:"1px solid var(--line)", background:"rgba(5,7,15,0.9)", backdropFilter:"blur(20px)" }}>
            <div style={{ maxWidth:720, margin:"0 auto", display:"flex", alignItems:"flex-end", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:16, padding:"10px 12px", transition:"border-color 0.2s" }}
              onFocus={e => (e.currentTarget.style.borderColor="rgba(124,58,237,0.45)")}
              onBlur={e => (e.currentTarget.style.borderColor="var(--line)")}>
              <textarea
                ref={inpRef} className="ti" rows={1}
                placeholder="Type your answer… (Enter to send)"
                value={input}
                onChange={handleTextChange}
                onKeyDown={onKey}
                disabled={busy}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || busy}
                style={{ width:42, height:42, borderRadius:"50%", border:"none", cursor:(!input.trim()||busy)?"not-allowed":"pointer", background:(!input.trim()||busy)?"rgba(124,58,237,0.25)":"linear-gradient(135deg,#7c3aed,#2563eb)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", boxShadow:(!input.trim()||busy)?"none":"0 0 16px rgba(124,58,237,0.45)" }}
                aria-label="Send">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path d="M15.5 2.5L8.5 9.5M15.5 2.5L11 16L8.5 9.5M15.5 2.5L2.5 7L8.5 9.5" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p style={{ textAlign:"center", margin:"8px 0 0", fontSize:"0.63rem", color:"rgba(255,255,255,0.2)", fontFamily:"var(--font-mono)" }}>
              Answer naturally — I'll figure out what I need
            </p>
          </div>
        )}
      </div>
    </>
  );
}