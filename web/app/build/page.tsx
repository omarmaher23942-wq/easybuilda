"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Field {
  id:          string;
  key:         string;
  label:       string;
  hint?:       string;
  type:        "text" | "textarea" | "select" | "tags";
  options?:    string[];
  value:       string;
  done:        boolean;
  generating:  boolean;
}

const INITIAL_FIELD: Field = {
  id: "f0", key: "business_name", label: "What's the name of your business?",
  hint: "This is how your AI agent will introduce itself.",
  type: "text", value: "", done: false, generating: false,
};

const INDUSTRY_OPTIONS = [
  "Restaurant / Cafe", "Medical / Dental Clinic", "Real Estate",
  "Law Firm", "E-Commerce / Retail", "Coaching / Consulting",
  "Beauty / Salon", "Gym / Fitness", "Hotel / Hospitality",
  "Education / Tutoring", "Accounting / Finance", "Other",
];

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function SpinnerIcon({ size=16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation:"spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-3-6.7"/>
    </svg>
  );
}

function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}

export default function BuildPage() {
  const [fields,      setFields]      = useState<Field[]>([INITIAL_FIELD]);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [token,       setToken]       = useState("");
  const [userId,      setUserId]      = useState("");
  const [building,    setBuilding]    = useState(false);
  const [built,       setBuilt]       = useState<{ username:string; agent_id:string }|null>(null);
  const [error,       setError]       = useState("");
  const [showReview,  setShowReview]  = useState(false);
  const inputRef = useRef<HTMLInputElement|HTMLTextAreaElement|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      setUserId(data.session.user.id);
    });
  }, []);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    setTimeout(() => (inputRef.current as HTMLElement)?.focus?.(), 200);
  }, [fields.length, activeIdx]);

  const activeField = fields[activeIdx];
  const completedCount = fields.filter(f => f.done).length;
  const progress = Math.min(Math.round((completedCount / Math.max(fields.length, 6)) * 100), 95);

  const generateNextField = async (allFields: Field[]): Promise<Field | null> => {
    const answers = allFields
      .filter(f => f.done && f.value.trim())
      .map(f => `${f.key}: "${f.value}"`)
      .join("\n");

    const keys = allFields.map(f => f.key);

    const prompt = `You are building an onboarding form for a business AI agent platform.
The user has answered these questions so far:
${answers}

Already asked fields: ${keys.join(", ")}

Available fields to ask next (pick the most relevant ONE based on what's missing):
- industry: "What industry are you in?" (select from: ${INDUSTRY_OPTIONS.join(", ")})
- business_description: "Describe what your business does" (textarea)
- services: "What services or products do you offer? Include pricing if possible." (textarea)
- hours: "What are your opening hours?" (text)
- location: "Where are you located? Or do you operate online?" (text)
- contact: "What's the best way for customers to reach or book you?" (text)
- tone: "What tone should your AI agent use?" (select from: Friendly & Warm, Professional & Formal, Energetic & Upbeat, Luxury & Refined, Casual & Relaxed)
- target_customer: "Who is your ideal customer?" (text)
- policies: "Any important policies? (returns, cancellations, payment methods)" (textarea)
- agent_name: "What should we name your AI agent?" (text)

Rules:
- If industry is not asked yet and business_name is answered, ask industry next.
- If we have 7+ answers, ask agent_name if not asked, then return DONE.
- Return JSON only, no markdown, no explanation:
  {"key":"field_key","label":"Question text","hint":"Short helpful hint","type":"text|textarea|select","options":["opt1","opt2"] or null}
  OR if enough info: {"done":true}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (parsed.done) return null;
      return {
        id:         `f${Date.now()}`,
        key:        parsed.key,
        label:      parsed.label,
        hint:       parsed.hint || "",
        type:       parsed.type || "text",
        options:    parsed.options || undefined,
        value:      "",
        done:       false,
        generating: false,
      };
    } catch {
      return null;
    }
  };

  const submitCurrent = async () => {
    const field = fields[activeIdx];
    if (!field.value.trim()) return;

    // Mark current as done
    const updated = fields.map((f, i) =>
      i === activeIdx ? { ...f, done: true } : f
    );
    setFields(updated);

    const completedNow = updated.filter(f => f.done).length;

    // Check if we have enough (6+) or should generate more
    if (completedNow >= 6) {
      // Try to get one more if not at agent_name yet
      const hasAgentName = updated.some(f => f.key === "agent_name");
      if (!hasAgentName && completedNow < 9) {
        // Generate next
        const placeholder: Field = { id: `loading-${Date.now()}`, key: "loading", label: "", hint: "", type: "text", value: "", done: false, generating: true };
        setFields([...updated, placeholder]);
        const next = await generateNextField(updated);
        if (next) {
          setFields([...updated, next]);
          setActiveIdx(updated.length);
        } else {
          setFields(updated);
          setShowReview(true);
        }
      } else {
        setShowReview(true);
      }
    } else {
      // Always generate next field
      const placeholder: Field = { id: `loading-${Date.now()}`, key: "loading", label: "", hint: "", type: "text", value: "", done: false, generating: true };
      setFields([...updated, placeholder]);
      const next = await generateNextField(updated);
      if (next) {
        setFields([...updated, next]);
        setActiveIdx(updated.length);
      } else {
        setFields(updated);
        if (completedNow >= 4) setShowReview(true);
      }
    }
  };

  const buildAgent = async () => {
    setBuilding(true); setError("");
    const answers: Record<string, string> = {};
    fields.filter(f => f.done && f.value.trim()).forEach(f => { answers[f.key] = f.value; });
    try {
      const res = await fetch(`${API}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Build failed. Please try again.");
        setBuilding(false);
        return;
      }
      const d = await res.json();
      if (d.username || d.agent?.username) {
        setBuilt({ username: d.username || d.agent?.username, agent_id: d.agent_id || d.agent?.id });
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setBuilding(false);
  };

  const editField = (idx: number) => {
    setShowReview(false);
    setActiveIdx(idx);
  };

  // ── Built successfully ──────────────────────────────────────────
  if (built) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", textAlign:"center" }}>
        <div style={{ animation:"pop 0.4s cubic-bezier(0.22,1,0.36,1) both", maxWidth:480 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2rem", color:"#edf0f7", marginBottom:12 }}>Your agent is live!</h1>
          <p style={{ color:"rgba(237,240,247,0.6)", fontSize:"0.95rem", lineHeight:1.65, marginBottom:"2rem" }}>
            Your AI agent is ready and accepting customers at:
          </p>
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(237,240,247,0.1)", borderRadius:13, padding:"12px 20px", marginBottom:"2rem", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.92rem", color:"#38bdf8" }}>
            easybuilda.com/{built.username}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href={`https://easybuilda.com/${built.username}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"0.75rem 1.5rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", fontWeight:700, fontSize:"0.9rem", textDecoration:"none" }}>
              View agent
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"0.75rem 1.5rem", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(237,240,247,0.12)", color:"#edf0f7", fontWeight:600, fontSize:"0.9rem", textDecoration:"none" }}>
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );

  // ── Review screen ───────────────────────────────────────────────
  if (showReview) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight:"100vh", background:"#05070f", padding:"2rem 1.5rem 4rem" }}>
        <div style={{ maxWidth:580, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"2.5rem", animation:"fadeIn 0.3s ease both" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"#7c3aed", marginBottom:10 }}>Almost done</p>
            <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.8rem", color:"#edf0f7", marginBottom:8 }}>Review your answers</h1>
            <p style={{ fontSize:"0.88rem", color:"rgba(237,240,247,0.5)" }}>Make any changes before we build your agent.</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:"2rem" }}>
            {fields.filter(f => f.done).map((f, i) => (
              <div key={f.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:14, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", animation:"fadeIn 0.25s ease both", animationDelay:`${i*0.04}s` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 4px", fontSize:"0.72rem", color:"rgba(237,240,247,0.4)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{f.label}</p>
                  <p style={{ margin:0, fontSize:"0.9rem", color:"#edf0f7", lineHeight:1.55, wordBreak:"break-word" }}>{f.value}</p>
                </div>
                <button onClick={()=>editField(fields.indexOf(f))} style={{ padding:"5px 10px", borderRadius:8, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", color:"#a78bfa", fontSize:"0.74rem", cursor:"pointer", fontFamily:"inherit", flexShrink:0, whiteSpace:"nowrap" }}>
                  Edit
                </button>
              </div>
            ))}
          </div>

          {error && <div style={{ marginBottom:"1rem", padding:"10px 13px", borderRadius:10, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", fontSize:"0.82rem", color:"#f87171" }}>{error}</div>}

          <button onClick={buildAgent} disabled={building} style={{ width:"100%", padding:"1rem", borderRadius:14, background:building?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border:"none", color:"#fff", fontWeight:700, fontSize:"1rem", cursor:building?"not-allowed":"pointer", fontFamily:"var(--font-display,'Sora',sans-serif)", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:building?"none":"0 0 32px rgba(124,58,237,0.35)" }}>
            {building ? (
              <><SpinnerIcon size={18}/> Building your agent… (1-2 min)</>
            ) : (
              <>Build my AI agent<ArrowIcon/></>
            )}
          </button>
          <p style={{ textAlign:"center", marginTop:"0.85rem", fontSize:"0.76rem", color:"rgba(237,240,247,0.3)" }}>
            Your agent will be live immediately after building.
          </p>
        </div>
      </div>
    </>
  );

  // ── Main form ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        .field-inp{width:100%;padding:14px 16px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(237,240,247,0.1);border-radius:13px;color:#edf0f7;font-size:1rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box;resize:none}
        .field-inp:focus{border-color:rgba(124,58,237,0.6)}
        .field-inp::placeholder{color:rgba(237,240,247,0.2)}
        .opt-btn{padding:10px 16px;border-radius:10px;border:1.5px solid rgba(237,240,247,0.1);background:rgba(255,255,255,0.03);color:rgba(237,240,247,0.7);font-size:0.88rem;cursor:pointer;transition:all 0.15s;text-align:left;font-family:inherit}
        .opt-btn:hover{border-color:rgba(124,58,237,0.5);background:rgba(124,58,237,0.08);color:#edf0f7}
        .opt-btn.selected{border-color:rgba(124,58,237,0.7);background:rgba(124,58,237,0.15);color:#edf0f7}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", flexDirection:"column" }}>

        {/* Top bar */}
        <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", gap:16, borderBottom:"1px solid rgba(237,240,247,0.06)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <svg viewBox="0 0 1024 1024" width={22} height={22}><defs><linearGradient id="lg2" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs><path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#lg2)"/></svg>
            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.88rem", color:"#edf0f7" }}>EasyBuilda</span>
          </a>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ height:4, width:160, background:"rgba(237,240,247,0.08)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius:99, transition:"width 0.5s ease" }}/>
            </div>
            <span style={{ fontSize:"0.74rem", color:"rgba(237,240,247,0.4)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", minWidth:28 }}>{progress}%</span>
          </div>
        </div>

        {/* Fields */}
        <div style={{ flex:1, padding:"2rem 1.5rem", maxWidth:620, margin:"0 auto", width:"100%" }}>

          {/* Completed fields summary */}
          {fields.slice(0, activeIdx).filter(f => f.done).map((f, i) => (
            <div key={f.id} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:16, opacity:0.55 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, color:"#34d399" }}>
                <CheckIcon/>
              </div>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:"0.74rem", color:"rgba(237,240,247,0.35)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)" }}>{f.label}</p>
                <p style={{ margin:0, fontSize:"0.9rem", color:"rgba(237,240,247,0.6)" }}>{f.value}</p>
              </div>
              <button onClick={()=>editField(i)} style={{ marginLeft:"auto", padding:"3px 8px", borderRadius:6, background:"none", border:"1px solid rgba(237,240,247,0.1)", color:"rgba(237,240,247,0.3)", fontSize:"0.72rem", cursor:"pointer", flexShrink:0 }}>edit</button>
            </div>
          ))}

          {/* Active field */}
          {activeField && !activeField.generating && (
            <div key={activeField.id} style={{ animation:"slideIn 0.35s cubic-bezier(0.22,1,0.36,1) both", marginBottom:24 }}>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.35rem", color:"#edf0f7", marginBottom:activeField.hint ? 6 : 0, lineHeight:1.35 }}>
                  {activeField.label}
                </h2>
                {activeField.hint && <p style={{ margin:0, fontSize:"0.84rem", color:"rgba(237,240,247,0.45)", lineHeight:1.55 }}>{activeField.hint}</p>}
              </div>

              {activeField.type === "select" && activeField.options ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {activeField.options.map(opt => (
                    <button key={opt} className={`opt-btn${activeField.value===opt?" selected":""}`}
                      onClick={() => {
                        setFields(prev => prev.map((f,i) => i===activeIdx ? {...f, value:opt} : f));
                        setTimeout(() => {
                          const updated2 = fields.map((f,i) => i===activeIdx ? {...f, value:opt, done:true} : f);
                          setFields(updated2);
                          const completedNow2 = updated2.filter(f2 => f2.done).length;
                          if (completedNow2 >= 6) {
                            const hasAgentName2 = updated2.some(f2 => f2.key==="agent_name");
                            if (hasAgentName2 || completedNow2 >= 9) { setShowReview(true); return; }
                          }
                          const placeholder2: Field = { id:`loading-${Date.now()}`, key:"loading", label:"", hint:"", type:"text", value:"", done:false, generating:true };
                          setFields([...updated2, placeholder2]);
                          generateNextField(updated2).then(next2 => {
                            if (next2) { setFields([...updated2, next2]); setActiveIdx(updated2.length); }
                            else { setFields(updated2); if(updated2.filter(f2=>f2.done).length>=4) setShowReview(true); }
                          });
                        }, 150);
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : activeField.type === "textarea" ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  className="field-inp" rows={4}
                  placeholder={`Type your answer here…`}
                  value={activeField.value}
                  onChange={e => setFields(prev => prev.map((f,i) => i===activeIdx ? {...f,value:e.target.value} : f))}
                  onKeyDown={e => { if (e.key==="Enter" && e.metaKey && activeField.value.trim()) submitCurrent(); }}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  className="field-inp" type="text"
                  placeholder="Type your answer here…"
                  value={activeField.value}
                  onChange={e => setFields(prev => prev.map((f,i) => i===activeIdx ? {...f,value:e.target.value} : f))}
                  onKeyDown={e => { if (e.key==="Enter" && activeField.value.trim()) submitCurrent(); }}
                />
              )}

              {activeField.type !== "select" && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
                  <span style={{ fontSize:"0.74rem", color:"rgba(237,240,247,0.25)" }}>
                    {activeField.type==="textarea" ? "⌘+Enter to continue" : "Enter to continue"}
                  </span>
                  <button
                    onClick={submitCurrent}
                    disabled={!activeField.value.trim()}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:11, background:!activeField.value.trim()?"rgba(124,58,237,0.2)":"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:600, fontSize:"0.88rem", cursor:!activeField.value.trim()?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                    Continue <ArrowIcon/>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Generating next question */}
          {activeField?.generating && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"20px 0" }}>
              <div style={{ display:"flex", gap:5 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(124,58,237,0.7)", animation:"pulse 1.2s ease infinite", animationDelay:`${i*0.2}s` }}/>
                ))}
              </div>
              <span style={{ fontSize:"0.84rem", color:"rgba(237,240,247,0.35)" }}>Preparing next question…</span>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>
      </div>
    </>
  );
}
