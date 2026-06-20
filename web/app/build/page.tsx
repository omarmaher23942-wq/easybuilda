"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  check:  "M20 6L9 17l-5-5",
  arrow:  "M5 12h14M13 6l6 6-6 6",
  edit:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  back:   "M19 12H5M12 19l-7-7 7-7",
};

interface Message { role: "user" | "assistant"; content: string; }

const INDUSTRIES = [
  "Restaurant / Cafe", "Medical / Dental Clinic", "Real Estate",
  "Law Firm", "E-Commerce / Retail", "Coaching / Consulting",
  "Beauty / Salon", "Gym / Fitness", "Hotel / Hospitality",
  "Education / Tutoring", "Accounting / Finance", "Other",
];

export default function BuildPage() {
  const [token,      setToken]      = useState("");
  const [userId,     setUserId]     = useState("");
  const [phase,      setPhase]      = useState<"industry" | "interview" | "review" | "building" | "done">("industry");
  const [industry,   setIndustry]   = useState("");
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [building,   setBuilding]   = useState(false);
  const [agentUrl,   setAgentUrl]   = useState("");
  const [agentId,    setAgentId]    = useState("");
  const [error,      setError]      = useState("");
  const [canBuild,   setCanBuild]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      setUserId(data.session.user.id);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [messages]);

  // Start interview once industry is selected
  const startInterview = useCallback(async (ind: string) => {
    setIndustry(ind);
    setPhase("interview");
    setLoading(true);

    const firstMsg: Message = { role: "user", content: `My business is in: ${ind}` };
    setMessages([firstMsg]);

    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [firstMsg] }),
      });
      if (!res.ok) { setError("Failed to start interview. Please try again."); setLoading(false); return; }
      const d = await res.json();
      const aiMsg: Message = { role: "assistant", content: d.reply };
      setMessages([firstMsg, aiMsg]);
      if (d.done) setCanBuild(true);
    } catch {
      setError("Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  }, [token]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) { setError("Failed to get response. Please try again."); setLoading(false); return; }
      const d = await res.json();
      const aiMsg: Message = { role: "assistant", content: d.reply };
      setMessages([...newMessages, aiMsg]);
      if (d.done) setCanBuild(true);
    } catch {
      setError("Connection error.");
    }
    setLoading(false);
  };

  const buildAgent = async () => {
    setBuilding(true); setError("");
    try {
      const res = await fetch(`${API}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: Object.fromEntries(
          messages.filter(m => m.role === "user").map((m, i) => [`answer_${i}`, m.content])
        ), messages }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Build failed. Please try again.");
        setBuilding(false); return;
      }
      const d = await res.json();
      const username = d.username || d.agent?.username || d.agent?.subdomain;
      const id       = d.agent_id || d.agent?.id;
      if (username) {
        setAgentUrl(`https://easybuilda.com/${username}`);
        setAgentId(id || "");
        setPhase("done");
      } else {
        setError("Agent created but URL not found. Check your dashboard.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setBuilding(false);
  };

  const line = "rgba(255,255,255,0.07)";

  // ── Done ──────────────────────────────────────────────────────────
  if (phase === "done") return (
    <>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <div style={{ animation: "pop 0.4s cubic-bezier(0.22,1,0.36,1) both", maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Icon d={IC.check} size={32} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "2rem", color: "#edf0f7", marginBottom: 12 }}>
            Your agent is live!
          </h1>
          <p style={{ color: "rgba(237,240,247,0.6)", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 20 }}>
            Your AI agent is ready and accepting customers right now:
          </p>
          <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${line}`, borderRadius: 12, marginBottom: 28, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.9rem", color: "#38bdf8" }}>
            {agentUrl}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={agentUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
              View my agent <Icon d={IC.eye} size={15} />
            </a>
            <a href="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${line}`, color: "#edf0f7", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );

  // ── Industry selection ────────────────────────────────────────────
  if (phase === "industry") return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", backgroundImage: "radial-gradient(600px 500px at 60% 20%,rgba(124,58,237,0.1),transparent 65%)" }}>
        <div style={{ width: "100%", maxWidth: 560, animation: "fadeUp 0.35s ease both" }}>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(237,240,247,0.4)", textDecoration: "none", fontSize: "0.82rem" }}>
              <Icon d={IC.back} size={14} /> Dashboard
            </a>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(237,240,247,0.08)", borderRadius: 22, padding: "2.5rem 2rem" }}>
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#7c3aed", marginBottom: 12 }}>Step 1 of 2</p>
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.5rem", color: "#edf0f7", marginBottom: 6 }}>What's your industry?</h1>
            <p style={{ fontSize: "0.86rem", color: "rgba(237,240,247,0.5)", marginBottom: "1.5rem" }}>We'll tailor your AI agent specifically for your type of business.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {INDUSTRIES.map(ind => (
                <button key={ind} onClick={() => token && startInterview(ind)} disabled={!token}
                  style={{ padding: "12px 14px", borderRadius: 12, border: `1.5px solid rgba(237,240,247,0.1)`, background: "rgba(255,255,255,0.03)", color: "rgba(237,240,247,0.7)", fontSize: "0.86rem", cursor: token ? "pointer" : "not-allowed", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#edf0f7"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(237,240,247,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(237,240,247,0.7)"; }}>
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ── Interview ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        .inp{flex:1;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;color:#edf0f7;font-size:0.92rem;font-family:inherit;outline:none;transition:border-color 0.15s}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(237,240,247,0.2)}
      `}</style>

      {/* Header */}
      <header style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 14, background: "rgba(5,7,15,0.9)", backdropFilter: "blur(12px)" }}>
        <a href="/dashboard" style={{ color: "rgba(237,240,247,0.4)", textDecoration: "none", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon d={IC.back} size={14} /> Dashboard
        </a>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: "0.78rem", color: "#a78bfa" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
            Building your AI agent — {industry}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: canBuild ? "100%" : `${Math.min(messages.length / 16 * 100, 90)}%`, background: "linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontSize: "0.7rem", color: "rgba(237,240,247,0.35)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", whiteSpace: "nowrap" }}>
            {canBuild ? "Ready" : `${Math.floor(messages.length / 2)}/8`}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, padding: "24px 20px", maxWidth: 680, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.25s ease both" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                AI
              </div>
            )}
            <div style={{ maxWidth: "78%", padding: "13px 16px", borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: "0.92rem", color: "#edf0f7", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>AI</div>
            <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "4px 14px 14px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(124,58,237,0.7)", animation: "pulse 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Build CTA */}
        {canBuild && !building && (
          <div style={{ padding: "20px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 16, marginTop: 8, animation: "fadeIn 0.4s ease both" }}>
            <p style={{ margin: "0 0 14px", fontSize: "0.92rem", color: "#edf0f7", fontWeight: 600 }}>
              We have everything we need. Ready to build your agent?
            </p>
            <button onClick={buildAgent}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}>
              Build my AI agent <Icon d={IC.arrow} size={16} />
            </button>
          </div>
        )}

        {/* Building state */}
        {building && (
          <div style={{ padding: "20px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, marginTop: 8, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "#edf0f7" }}>Building your agent…</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(237,240,247,0.5)" }}>This takes 1-2 minutes. Please wait.</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, fontSize: "0.84rem", color: "#f87171" }}>
            {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", marginLeft: 8 }}>✕</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!canBuild && !building && (
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10 }}>
            <input ref={inputRef} className="inp" placeholder="Type your answer…" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={loading} />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              style={{ padding: "12px 20px", borderRadius: 12, background: !input.trim() || loading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: !input.trim() || loading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
              Send <Icon d={IC.arrow} size={15} />
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: "0.72rem", color: "rgba(237,240,247,0.25)" }}>Press Enter to send</p>
        </div>
      )}
    </div>
  );
}
