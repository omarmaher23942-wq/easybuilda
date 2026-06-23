"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Icon({ d, size = 16, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  check:  "M20 6L9 17l-5-5",
  arrow:  "M5 12h14M13 6l6 6-6 6",
  back:   "M19 12H5M12 19l-7-7 7-7",
  edit:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  users:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
};

interface Field {
  key:         string;
  label:       string;
  hint:        string;
  type:        "text" | "textarea" | "select";
  options?:    string[];
  placeholder: string;
  value:       string;
}

const INITIAL_FIELDS: Field[] = [
  {
    key: "business_name",
    label: "What's the name of your business?",
    hint: "This is what your AI agent will introduce itself as.",
    type: "text",
    placeholder: "e.g. Cairo Dental Clinic, Nile Restaurant…",
    value: "",
  },
  {
    key: "industry",
    label: "What type of business are you?",
    hint: "Choose the category that best describes what you do.",
    type: "select",
    options: [
      "Restaurant / Cafe",
      "Medical / Dental Clinic",
      "Real Estate Agency",
      "Law Firm",
      "E-Commerce / Retail",
      "Coaching / Consulting",
      "Beauty / Salon",
      "Gym / Fitness",
      "Hotel / Hospitality",
      "Education / Tutoring",
      "Accounting / Finance",
      "Other",
    ],
    placeholder: "Select your industry",
    value: "",
  },
];

export default function BuildPage() {
  const [token,     setToken]     = useState("");
  const [fields,    setFields]    = useState<Field[]>(INITIAL_FIELDS);
  const [current,   setCurrent]   = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [generating,setGenerating]= useState(false);
  const [building,  setBuilding]  = useState(false);
  const [showReview,setShowReview]= useState(false);
  const [agentUrl,  setAgentUrl]  = useState("");
  const [error,     setError]     = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => {
    setTimeout(() => (inputRef.current as HTMLElement)?.focus?.(), 150);
  }, [current, fields.length]);

  const currentField = fields[current];
  const completedFields = fields.filter((_, i) => i < current);
  const progress = Math.min(Math.round((current / Math.max(fields.length, 10)) * 100), 95);

  // Generate next field using backend AI
  const generateNextField = useCallback(async (allFields: Field[]): Promise<Field | null> => {
    const answers = allFields
      .filter(f => f.value.trim())
      .map(f => `${f.key}: "${f.value}"`)
      .join("\n");

    const usedKeys = allFields.map(f => f.key);

    try {
      const res = await fetch(`${API}/api/interview/next-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers, used_keys: usedKeys }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (d.done) return null;
      return {
        key:         d.key,
        label:       d.label,
        hint:        d.hint || "",
        type:        d.type || "text",
        options:     d.options,
        placeholder: d.placeholder || "Type your answer here…",
        value:       "",
      };
    } catch { return null; }
  }, [token]);

  const next = useCallback(async () => {
    if (!currentField.value.trim()) return;
    const filled = current + 1;

    if (filled >= fields.length) {
      // Need more fields or done — allow deeper interviews (up to 14)
      // before falling back to review, so the agent gets real depth.
      if (filled >= 14) {
        setShowReview(true);
        return;
      }
      // Generate next field
      setGenerating(true);
      const nextField = await generateNextField(fields);
      setGenerating(false);
      if (!nextField) {
        setShowReview(true);
        return;
      }
      setFields(prev => [...prev, nextField]);
      setCurrent(filled);
    } else {
      setCurrent(filled);
    }
  }, [current, currentField, fields, generateNextField]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentField.type !== "textarea") {
      e.preventDefault();
      next();
    }
    if (e.key === "Enter" && e.metaKey && currentField.type === "textarea") {
      e.preventDefault();
      next();
    }
  };

  const setValue = (val: string) => {
    setFields(prev => prev.map((f, i) => i === current ? { ...f, value: val } : f));
  };

  const buildAgent = async () => {
    setBuilding(true); setError("");
    const answers: Record<string, string> = {};
    fields.filter(f => f.value.trim()).forEach(f => { answers[f.key] = f.value; });

    try {
      const res = await fetch(`${API}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Build failed. Please try again.");
        setBuilding(false); return;
      }
      const d = await res.json();
      const username = d.username || d.agent?.username || d.agent?.subdomain;
      if (username) {
        setAgentUrl(`https://easybuilda.com/${username}`);
      } else {
        setError("Agent created but URL not found. Check your dashboard.");
      }
    } catch { setError("Connection error. Please try again."); }
    setBuilding(false);
  };

  const line = "rgba(255,255,255,0.07)";

  // ── Success ───────────────────────────────────────────────────────
  if (agentUrl) return (
    <>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <div style={{ animation: "pop 0.4s cubic-bezier(0.22,1,0.36,1) both", maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "#34d399" }}>
            <Icon d={IC.check} size={32} color="#34d399" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "2rem", color: "#edf0f7", marginBottom: 12 }}>Agent is live!</h1>
          <p style={{ color: "rgba(237,240,247,0.6)", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 20 }}>Your AI agent is ready and accepting customers:</p>
          <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${line}`, borderRadius: 12, marginBottom: 20, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.9rem", color: "#38bdf8" }}>
            {agentUrl}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, marginBottom: 28, textAlign: "left" }}>
            <Icon d={IC.users} size={17} color="#a78bfa" />
            <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(237,240,247,0.7)", lineHeight: 1.55 }}>
              Every visitor who chats with your agent and shows real interest will automatically show up in your <strong style={{ color: "#a78bfa" }}>Leads</strong> tab — with their name, contact info, and the full conversation. Nothing leaves the platform.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={agentUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
              View agent <Icon d={IC.eye} size={15} color="#fff" />
            </a>
            <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${line}`, color: "#edf0f7", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );

  // ── Review screen ─────────────────────────────────────────────────
  if (showReview) return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(237,240,247,0.4)", textDecoration: "none", fontSize: "0.82rem", marginBottom: 28 }}>
            <Icon d={IC.back} size={14} /> Dashboard
          </a>
          <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#7c3aed", marginBottom: 10 }}>Review</p>
          <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.6rem", color: "#edf0f7", marginBottom: 6 }}>Review your information</h1>
          <p style={{ fontSize: "0.86rem", color: "rgba(237,240,247,0.5)", marginBottom: 20 }}>Edit anything before we build your agent. The more detail here, the smarter and more accurate your agent will be with real customers.</p>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 12, marginBottom: 24 }}>
            <Icon d={IC.users} size={15} color="#a78bfa" />
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(237,240,247,0.6)", lineHeight: 1.5 }}>
              Your agent will collect each interested visitor's name and contact info itself, and they'll appear as <strong style={{ color: "#a78bfa" }}>Leads</strong> in your dashboard — no need to share your own contact details here.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {fields.filter(f => f.value.trim()).map((f, i) => (
              <div key={f.key} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${line}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", animation: `fadeUp 0.2s ease both`, animationDelay: `${i * 0.04}s` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "rgba(237,240,247,0.35)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#edf0f7", lineHeight: 1.5, wordBreak: "break-word" }}>{f.value}</p>
                </div>
                <button onClick={() => { setShowReview(false); setCurrent(i); }}
                  style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", fontSize: "0.74rem", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                  Edit
                </button>
              </div>
            ))}
          </div>

          {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", fontSize: "0.84rem", color: "#f87171" }}>{error}</div>}

          <button onClick={buildAgent} disabled={building}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: building ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.96rem", cursor: building ? "not-allowed" : "pointer", fontFamily: "var(--font-display,'Sora',sans-serif)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: building ? "none" : "0 0 28px rgba(124,58,237,0.35)" }}>
            {building ? (
              <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }}/> Building your agent… (1-2 min)</>
            ) : (
              <>Build my AI agent <Icon d={IC.arrow} size={17} color="#fff" /></>
            )}
          </button>
          <p style={{ textAlign: "center", marginTop: 12, fontSize: "0.76rem", color: "rgba(237,240,247,0.3)" }}>
            Takes 1-2 minutes &nbsp;·&nbsp; Please don't refresh
          </p>
        </div>
      </div>
    </>
  );

  // ── Main form ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:0.8}}
        .field-input{width:100%;padding:16px 18px;background:rgba(255,255,255,0.05);border:2px solid rgba(237,240,247,0.1);border-radius:14px;color:#edf0f7;font-size:1.05rem;font-family:inherit;outline:none;transition:border-color 0.2s,background 0.2s;resize:none;box-sizing:border-box}
        .field-input:focus{border-color:rgba(124,58,237,0.6);background:rgba(255,255,255,0.07)}
        .field-input::placeholder{color:rgba(237,240,247,0.2)}
        .opt-btn{width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid rgba(237,240,247,0.1);background:rgba(255,255,255,0.03);color:rgba(237,240,247,0.7);font-size:0.92rem;cursor:pointer;text-align:left;transition:all 0.15s;font-family:inherit}
        .opt-btn:hover{border-color:rgba(124,58,237,0.4);background:rgba(124,58,237,0.08);color:#edf0f7}
        .opt-btn.selected{border-color:rgba(124,58,237,0.7);background:rgba(124,58,237,0.15);color:#edf0f7;font-weight:600}
      `}</style>

      {/* Header */}
      <header style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16, background: "rgba(5,7,15,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <a href="/dashboard" style={{ color: "rgba(237,240,247,0.4)", textDecoration: "none", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon d={IC.back} size={14} /> Dashboard
        </a>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 4, width: 140, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius: 99, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.35)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>{current + 1}/{Math.max(fields.length, 10)}</span>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 600, width: "100%", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Completed fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: completedFields.length > 0 ? 32 : 0 }}>
          {completedFields.map((f, i) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#34d399" }}>
                <Icon d={IC.check} size={11} color="#34d399" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.76rem", color: "rgba(237,240,247,0.4)", marginRight: 8, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>{f.label.split("?")[0]}?</span>
                <span style={{ fontSize: "0.86rem", color: "rgba(237,240,247,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value}</span>
              </div>
              <button onClick={() => { setShowReview(false); setCurrent(i); }}
                style={{ padding: "2px 8px", borderRadius: 6, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(237,240,247,0.35)", fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit" }}>
                edit
              </button>
            </div>
          ))}
        </div>

        {/* Current field */}
        {currentField && !generating && (
          <div key={currentField.key} style={{ animation: "slideIn 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(1.3rem,3vw,1.7rem)", color: "#edf0f7", lineHeight: 1.3, marginBottom: currentField.hint ? 8 : 0 }}>
                {currentField.label}
              </h2>
              {currentField.hint && (
                <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(237,240,247,0.45)", lineHeight: 1.55 }}>{currentField.hint}</p>
              )}
            </div>

            {currentField.type === "select" && currentField.options ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentField.options.map(opt => (
                  <button key={opt} className={`opt-btn${currentField.value === opt ? " selected" : ""}`}
                    onClick={() => {
                      setValue(opt);
                      setTimeout(() => next(), 200);
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : currentField.type === "textarea" ? (
              <>
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  className="field-input" rows={4}
                  placeholder={currentField.placeholder}
                  value={currentField.value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.25)" }}>Cmd+Enter to continue</span>
                  <button onClick={next} disabled={!currentField.value.trim()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 12, background: !currentField.value.trim() ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: !currentField.value.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    Continue <Icon d={IC.arrow} size={15} color="#fff" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  className="field-input" type="text"
                  placeholder={currentField.placeholder}
                  value={currentField.value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.25)" }}>Press Enter to continue</span>
                  <button onClick={next} disabled={!currentField.value.trim()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 12, background: !currentField.value.trim() ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: !currentField.value.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    Continue <Icon d={IC.arrow} size={15} color="#fff" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Generating next field */}
        {generating && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(124,58,237,0.7)", animation: "pulse 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <span style={{ fontSize: "0.88rem", color: "rgba(237,240,247,0.4)" }}>Preparing next question…</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", fontSize: "0.84rem", color: "#f87171" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}