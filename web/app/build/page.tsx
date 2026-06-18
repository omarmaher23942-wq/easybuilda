"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// ── Types ────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };
type Phase =
  | "interview"
  | "validating"
  | "planning"
  | "analyzing"
  | "building"
  | "refining"
  | "finalizing"
  | "done"
  | "error";

interface PipelineResult {
  agent_id: string;
  username: string;
  leads_pin: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function phasePct(p: Phase): number {
  const map: Record<Phase, number> = {
    interview: 0, validating: 10, planning: 25, analyzing: 45,
    building: 70, refining: 82, finalizing: 92, done: 100, error: 0,
  };
  return map[p] ?? 0;
}

function phaseLabel(p: Phase): string {
  const map: Record<Phase, string> = {
    interview: "", validating: "Analyzing your information…",
    planning: "Planning your agent…", analyzing: "Crafting agent personality…",
    building: "Building your agent…", refining: "Refining quality…",
    finalizing: "Almost ready…", done: "Done!", error: "Something went wrong",
  };
  return map[p] ?? "";
}

// ── Components ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--color-dust)", display: "block",
          animation: `tdot 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function OrbGenesis({ pct, label }: { pct: number; label: string }) {
  const R = 52, circ = 2 * Math.PI * R, dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        {/* Outer spinning ring */}
        <div style={{
          position: "absolute", inset: -16, borderRadius: "50%",
          background: "conic-gradient(from 0deg, transparent 0%, rgba(124,58,237,0.5) 30%, rgba(56,189,248,0.5) 60%, transparent 100%)",
          filter: "blur(10px)",
          animation: "spin 3s linear infinite",
        }} />
        {/* SVG progress ring */}
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", inset: 0 }}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="70" cy="70" r={R} fill="none"
            stroke="url(#genesisGrad)" strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          />
          <defs>
            <linearGradient id="genesisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        {/* Core orb */}
        <div style={{
          position: "absolute", inset: 16, borderRadius: "50%",
          background: "radial-gradient(circle at 38% 35%, rgba(192,132,252,0.95), rgba(124,58,237,0.6) 50%, rgba(37,99,235,0.4) 75%, transparent 90%)",
          boxShadow: "0 0 50px rgba(124,58,237,0.4), inset 0 0 30px rgba(56,189,248,0.15)",
          animation: "breathe 4s ease-in-out infinite",
        }} />
        {/* Percentage */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "#fff",
        }}>
          {pct}%
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-dust)", textAlign: "center", maxWidth: 260 }}>
        {label}
      </p>
      <style>{`
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes tdot { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}

function AgentReveal({ result, agentName, color }: { result: PipelineResult; agentName: string; color: string }) {
  const h = color.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
      {/* Agent avatar */}
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, #22d3ee)`,
        boxShadow: `0 0 60px rgba(${rgb},0.5)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#fff",
        animation: "revealPop 0.6s cubic-bezier(0.34,1.4,0.64,1) both",
      }}>
        {agentName.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>
          Meet {agentName}
        </h2>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-dust)" }}>
          Your AI agent is live at
        </p>
        <a
          href={`/${result.username}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.9rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none" }}
        >
          easybuilda.vercel.app/{result.username}
        </a>
      </div>
      {/* PIN */}
      <div style={{
        padding: "16px 24px", borderRadius: 16,
        background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
        maxWidth: 340, width: "100%",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: "0.68rem", color: "var(--color-nebula)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Leads Dashboard PIN — save this!
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {result.leads_pin.split("").map((d, i) => (
            <span key={i} style={{
              width: 40, height: 48, borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.3rem", color: "var(--color-starlight)",
            }}>{d}</span>
          ))}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "var(--color-dust)" }}>
          Used to access your leads page. You'll also see it in your dashboard.
        </p>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/dashboard" className="btn-genesis" style={{ fontSize: "0.9rem", padding: "0.75rem 1.6rem" }}>
          Go to dashboard
        </a>
        <a href={`/${result.username}`} target="_blank" rel="noopener noreferrer"
          className="btn-ghost" style={{ fontSize: "0.9rem", padding: "0.75rem 1.6rem" }}>
          View agent ↗
        </a>
      </div>
      <style>{`@keyframes revealPop { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [input,       setInput]       = useState("");
  const [busy,        setBusy]        = useState(false);
  const [phase,       setPhase]       = useState<Phase>("interview");
  const [phasePctVal, setPhasePctVal] = useState(0);
  const [phaseMsg,    setPhaseMsg]    = useState("");
  const [result,      setResult]      = useState<PipelineResult | null>(null);
  const [agentName,   setAgentName]   = useState("Aria");
  const [agentColor,  setAgentColor]  = useState("#7c3aed");
  const [error,       setError]       = useState("");
  const [token,       setToken]       = useState("");
  const [msgCount,    setMsgCount]    = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Get auth token
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      // Start interview with AI greeting
      startInterview(data.session.access_token);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const startInterview = async (tok: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.reply }]);
    } catch {
      setMessages([{ role: "assistant", content: "Hi! I'm here to help you build your AI agent. What's your business called?" }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || busy || phase !== "interview") return;

    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setMsgCount(c => c + 1);
    setBusy(true);

    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.done || data.complete) {
        // Start build pipeline
        setMessages(prev => [...prev, { role: "assistant", content: "I have everything I need. Let me build your agent now!" }]);
        setBusy(false);
        await startBuild(newMessages);
        return;
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, busy, phase, messages, token]);

  const startBuild = async (msgs: Msg[]) => {
    setPhase("validating");

    try {
      const res = await fetch(`${API}/api/build/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: msgs }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Build failed");
        setPhase("error");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const block of lines) {
          const eventMatch = block.match(/^event: (.+)/m);
          const dataMatch  = block.match(/^data: (.+)/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1].trim();
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }

          if (event === "phase") {
            setPhase(data.phase as Phase);
            setPhasePctVal(data.pct as number);
            setPhaseMsg(data.label as string);
          }

          if (event === "need_more") {
            // Validator wants more info — go back to interview
            setPhase("interview");
            const q = data.question as string;
            setMessages(prev => [...prev, { role: "assistant", content: q }]);
            setTimeout(() => inputRef.current?.focus(), 100);
          }

          if (event === "complete") {
            const agent = (data as any).agent;
            if (agent) {
              setAgentName(agent.name || "Aria");
              setAgentColor(agent.primary_color || "#7c3aed");
            }
          }

          if (event === "saved") {
            setResult(data as unknown as PipelineResult);
            setPhase("done");
          }

          if (event === "error") {
            setError(data.message as string || "Build failed");
            setPhase("error");
          }
        }
      }
    } catch (e) {
      setError("Connection error. Please try again.");
      setPhase("error");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "done" && result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-cosmos)" }}>
        <AgentReveal result={result} agentName={agentName} color={agentColor} />
      </div>
    );
  }

  if (phase !== "interview") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 32, padding: 24, background: "var(--color-cosmos)" }}>
        <OrbGenesis pct={phasePctVal} label={phaseMsg || phaseLabel(phase)} />
        {phase === "error" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#f87171", marginBottom: 16 }}>{error}</p>
            <button className="btn-ghost" onClick={() => { setPhase("interview"); setError(""); }}>
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Interview UI ──────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes tdot { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg { animation: msgIn 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .send-btn { width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.18s;box-shadow:0 0 20px rgba(124,58,237,0.4); }
        .send-btn:hover { filter:brightness(1.1);transform:scale(1.05); }
        .send-btn:disabled { opacity:0.35;cursor:not-allowed;transform:none; }
        .chat-input { flex:1;background:transparent;border:none;outline:none;resize:none;font-family:var(--font-sans);font-size:0.93rem;color:var(--color-starlight);line-height:1.5;max-height:120px;padding:0; }
        .chat-input::placeholder { color:var(--color-dust); }
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: "var(--color-cosmos)",
        backgroundImage: "radial-gradient(800px 450px at 70% -5%,rgba(124,58,237,0.11),transparent 60%)",
      }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
          borderBottom: "1px solid var(--line)",
          background: "rgba(10,14,26,0.8)", backdropFilter: "blur(20px)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#22d3ee)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v14M2 9h14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)" }}>
              Agent Builder
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-dust)" }}>
              Answer a few questions — I'll build your AI agent
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {msgCount > 0 && (
              <span style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>
                {msgCount}/15
              </span>
            )}
            <a href="/dashboard" style={{ fontSize: "0.8rem", color: "var(--color-dust)", textDecoration: "none" }}>
              ✕ Cancel
            </a>
          </div>
        </header>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "24px 16px",
          display: "flex", flexDirection: "column", gap: 16,
          maxWidth: 740, width: "100%", margin: "0 auto",
        }}>
          {messages.map((msg, i) => (
            <div key={i} className="msg" style={{
              display: "flex", gap: 12,
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#7c3aed,#22d3ee)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff",
                }}>
                  AI
                </div>
              )}
              <div style={{
                maxWidth: "76%", padding: "12px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg,#7c3aed,#2563eb)"
                  : "rgba(255,255,255,0.055)",
                border: msg.role === "user" ? "none" : "1px solid var(--line)",
                color: "var(--color-starlight)",
                fontSize: "0.92rem", lineHeight: 1.62,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="msg" style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#7c3aed,#22d3ee)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>AI</div>
              <div style={{
                padding: "14px 18px",
                background: "rgba(255,255,255,0.055)", border: "1px solid var(--line)",
                borderRadius: "18px 18px 18px 4px",
              }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px 22px",
          borderTop: "1px solid var(--line)",
          background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)",
        }}>
          <div style={{
            maxWidth: 740, margin: "0 auto",
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "rgba(255,255,255,0.045)",
            border: "1px solid var(--line-bright)",
            borderRadius: 18, padding: "10px 14px",
          }}>
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              placeholder="Type your answer…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={busy || phase !== "interview"}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || busy || phase !== "interview"}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15.5 2.5L8 10M15.5 2.5L11 16L8 10M15.5 2.5L2.5 7L8 10"
                  stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 10, fontSize: "0.68rem", color: "var(--color-dust)", opacity: 0.45 }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}