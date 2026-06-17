"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

interface Agent {
  id: string; name: string; business_name: string; tagline: string;
  welcome_message: string; suggested_questions: string[];
  primary_color: string; status: string; plan: string;
}
interface Msg { role: "user" | "assistant"; content: string; }

function rgb(hex: string) {
  const h = hex.replace("#", "");
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${color} 0%, #22d3ee 100%)`,
      boxShadow: `0 0 ${size * 0.5}px ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: size * 0.32, color: "#fff", letterSpacing: "-0.02em",
    }}>
      {initials}
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 18px", alignItems: "center" }}>
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

export default function AgentPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const [agent,  setAgent]  = useState<Agent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const [msgs,   setMsgs]   = useState<Msg[]>([]);
  const [input,  setInput]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [vid]               = useState(() => `v-${Math.random().toString(36).slice(2)}`);
  const bottom = useRef<HTMLDivElement>(null);
  const inp    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`${API}/api/u/${encodeURIComponent(username)}`)
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}: ${await r.text().catch(() => r.statusText)}`);
        return r.json();
      })
      .then(d => {
        setAgent(d.agent);
        setMsgs([{ role: "assistant", content: d.agent.welcome_message }]);
        setStatus("ready");
      })
      .catch(e => { setErrMsg(e.message); setStatus("error"); });
  }, [username]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || busy || !agent) return;
    setInput("");
    setMsgs(p => [...p, { role: "user", content: msg }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agent.id, message: msg, conversation_id: convId, visitor_id: vid, page_url: window.location.href }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      if (d.reply) setMsgs(p => [...p, { role: "assistant", content: d.reply }]);
      if (d.conversation_id) setConvId(d.conversation_id);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => inp.current?.focus(), 50);
    }
  }, [agent, convId, busy, vid]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "var(--font-sans)", padding: 24 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 8v4M11 14.5v.5M2 11a9 9 0 1018 0A9 9 0 002 11z" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem", color: "var(--color-starlight)" }}>Agent not found</p>
        <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>{errMsg}</p>
        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-dust)" }}>
          Make sure the backend is running at{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-nebula)" }}>{API}</code>
        </p>
      </div>
      <a href="/" style={{ fontSize: "0.85rem", color: "var(--color-stellar)", textDecoration: "none" }}>Back to EasyBuilda</a>
    </div>
  );

  if (status === "loading" || !agent) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "var(--font-sans)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>
        Connecting to <span style={{ color: "var(--color-nebula)" }}>{API}</span>
      </p>
    </div>
  );

  const color = agent.primary_color || "#7c3aed";
  const r = rgb(color);
  const initials = agent.name.slice(0, 2).toUpperCase();
  const userMsgs = msgs.filter(m => m.role === "user").length;

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes tdot  { 0%,80%,100% { transform: scale(0.55); opacity: 0.35; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes min   { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        .mb { animation: min 0.2s cubic-bezier(0.22,1,0.36,1) both; }
        .chip { padding: 7px 15px; border-radius: 100px; font-size: 0.8rem; cursor: pointer; border: 1px solid rgba(${r},0.25); background: rgba(${r},0.07); color: ${color}; font-family: var(--font-sans); transition: background 0.16s, transform 0.16s; white-space: nowrap; }
        .chip:hover { background: rgba(${r},0.16); transform: translateY(-1px); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .sb { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: ${color}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(${r},0.45); transition: filter 0.16s, transform 0.16s; }
        .sb:hover { filter: brightness(1.1); transform: scale(1.06); }
        .sb:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        .ti { flex: 1; background: transparent; border: none; outline: none; resize: none; font-family: var(--font-sans); font-size: 0.93rem; color: var(--color-starlight); line-height: 1.5; max-height: 120px; padding: 0; }
        .ti::placeholder { color: var(--color-dust); }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-void)", backgroundImage: `radial-gradient(700px 420px at 70% -5%, rgba(${r},0.14), transparent 65%), radial-gradient(600px 380px at 8% 8%, rgba(56,189,248,0.06), transparent 60%)` }}>

        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.75)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
          <Avatar initials={initials} color={color} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</p>
            <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.business_name}{agent.tagline ? ` \u00b7 ${agent.tagline}` : ""}</p>
          </div>
          <span style={{ fontSize: "0.67rem", padding: "3px 10px", borderRadius: 100, flexShrink: 0, background: "rgba(52,211,153,0.09)", color: "var(--color-available)", border: "1px solid rgba(52,211,153,0.2)", fontFamily: "var(--font-mono)", letterSpacing: "0.07em" }}>
            online
          </span>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 760, width: "100%", margin: "0 auto" }}>
          {msgs.map((m, i) => (
            <div key={i} className="mb" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              {m.role === "assistant" && <Avatar initials={initials} color={color} size={36} />}
              <div style={{ maxWidth: "74%", padding: "11px 15px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? `linear-gradient(135deg, ${color}e0, ${color})` : "rgba(255,255,255,0.055)", border: m.role === "user" ? "none" : "1px solid var(--line)", color: "var(--color-starlight)", fontSize: "0.91rem", lineHeight: 1.62, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mb" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <Avatar initials={initials} color={color} size={36} />
              <div style={{ background: "rgba(255,255,255,0.055)", border: "1px solid var(--line)", borderRadius: "18px 18px 18px 4px" }}><Dots /></div>
            </div>
          )}
          <div ref={bottom} />
        </div>

        {userMsgs === 0 && agent.suggested_questions?.length > 0 && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 760, width: "100%", margin: "0 auto" }}>
            {agent.suggested_questions.map((q, i) => (
              <button key={i} className="chip" onClick={() => send(q)} disabled={busy}>{q}</button>
            ))}
          </div>
        )}

        <div style={{ padding: "12px 16px 22px", borderTop: "1px solid var(--line)", background: "rgba(5,7,15,0.8)", backdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-bright)", borderRadius: 16, padding: "10px 14px" }}>
            <textarea ref={inp} className="ti" rows={1} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} disabled={busy} />
            <button className="sb" onClick={() => send(input)} disabled={!input.trim() || busy} aria-label="Send message">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M15.5 2.5L8.5 9.5M15.5 2.5L11 16L8.5 9.5M15.5 2.5L2.5 7L8.5 9.5" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 9, fontSize: "0.66rem", color: "var(--color-dust)", opacity: 0.5, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            Built with <a href="https://easybuilda.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-nebula)", textDecoration: "none" }}>EasyBuilda</a>
          </p>
        </div>
      </div>
    </>
  );
}