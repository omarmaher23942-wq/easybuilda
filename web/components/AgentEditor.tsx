"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface AgentFields {
  agent_name: string;
  tagline: string;
  welcome_message: string;
  tone: string;
  primary_color: string;
  services: string;
  hours: string;
  location: string;
  policies: string;
  contact: string;
}

interface AgentMeta {
  id: string;
  name: string;
  username: string;
  readiness_score?: number;
}

export interface AgentEditorProps {
  agentId: string;
  token: string;
  onClose?: () => void;
}

/* ── Icons ─────────────────────────────────────────────────────────── */
function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "spin":     return <svg {...p} style={{ animation: "spin 0.6s linear infinite" }}><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>;
    case "user":     return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "tag":      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "message":  return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "mic":      return <svg {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case "palette":  return <svg {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
    case "shopping": return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
    case "clock":    return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "map":      return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "phone":    return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case "shield":   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "external": return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    default:         return null;
  }
}

const TONES = [
  { value: "friendly",     label: "Friendly",     desc: "Warm & approachable" },
  { value: "professional", label: "Professional",  desc: "Formal & precise" },
  { value: "energetic",    label: "Energetic",     desc: "Upbeat & enthusiastic" },
  { value: "luxury",       label: "Luxury",        desc: "Elegant & refined" },
  { value: "casual",       label: "Casual",        desc: "Relaxed & conversational" },
];

const COLORS = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#6366f1"];

const SECTIONS = [
  { key: "services" as keyof AgentFields, icon: "shopping", label: "Services & Pricing",  placeholder: "List your services and prices.\n• Hair cut — $45\n• Highlights — from $120" },
  { key: "hours"    as keyof AgentFields, icon: "clock",    label: "Business Hours",      placeholder: "Mon–Fri: 9am – 6pm\nSat: 10am – 4pm\nSunday: Closed" },
  { key: "location" as keyof AgentFields, icon: "map",      label: "Location",            placeholder: "123 Main St, Austin TX 78701\nWe also deliver within 10 miles." },
  { key: "contact"  as keyof AgentFields, icon: "phone",    label: "Contact & Booking",   placeholder: "(512) 555-1234\nhello@yourbusiness.com\nyourbooking.com" },
  { key: "policies" as keyof AgentFields, icon: "shield",   label: "Policies",            placeholder: "Cancellations: 24hr notice required\nRefunds: 30-day guarantee" },
];

function Gauge({ score }: { score: number }) {
  const pct   = Math.max(0, Math.min(100, score));
  const color = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
  const R = 22, circ = 2 * Math.PI * R, dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="28" cy="28" r={R} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
        <text x="28" y="32" textAnchor="middle" style={{ fill: color, fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700 }}>{pct}</text>
      </svg>
      <div>
        <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)" }}>Agent readiness</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "var(--color-dust)" }}>{pct >= 75 ? "Ready to sell." : pct >= 50 ? "A few more details will help." : "Add more info below."}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

function FieldHeader({ label, icon, saving, saved, hint }: { label: string; icon: string; saving: boolean; saved: boolean; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
      <span style={{ color: "var(--color-nebula)", marginTop: 1, flexShrink: 0 }}><Icon name={icon} size={16} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)" }}>{label}</p>
        {hint && <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "var(--color-dust)" }}>{hint}</p>}
      </div>
      {saving && <span style={{ color: "var(--color-nebula)" }}><Icon name="spin" size={14} /></span>}
      {saved && !saving && (
        <span style={{ animation: "fadeOut 2.5s ease forwards", color: "#34d399" }}>
          <Icon name="check" size={14} color="#34d399" />
        </span>
      )}
    </div>
  );
}

export function AgentEditor({ agentId, token }: AgentEditorProps) {
  const [fields,  setFields]  = useState<AgentFields | null>(null);
  const [meta,    setMeta]    = useState<AgentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState<string | null>(null);
  const [error,   setError]   = useState("");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch(`${API}/api/agents/${agentId}/fields`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setFields(d.fields); setMeta(d.agent); setLoading(false); })
      .catch(() => { setError("Failed to load agent data."); setLoading(false); });
  }, [agentId, token]);

  const saveField = useCallback(async (key: string, value: string) => {
    setSaving(key);
    try {
      await fetch(`${API}/api/agents/${agentId}/fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: { [key]: value } }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch { setError("Save failed."); }
    finally { setSaving(null); }
  }, [agentId, token]);

  const handleChange = useCallback((key: keyof AgentFields, value: string) => {
    setFields(prev => prev ? { ...prev, [key]: value } : prev);
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => saveField(key, value), 800);
  }, [saveField]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--color-nebula)", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  if (error) return <div style={{ padding: 32, textAlign: "center", color: "#f87171" }}>{error}</div>;
  if (!fields) return null;

  const agentColor = fields.primary_color || "#7c3aed";
  const h   = agentColor.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeOut{0%{opacity:1}80%{opacity:1}100%{opacity:0}}
        @keyframes editorIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fc{background:rgba(255,255,255,0.025);border:1px solid var(--line);border-radius:18px;padding:20px 22px;transition:border-color 0.2s;margin-bottom:12px}
        .fc:focus-within{border-color:rgba(${rgb},0.45)}
        .fi{width:100%;background:transparent;border:none;outline:none;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.92rem;line-height:1.6;resize:none;padding:0;box-sizing:border-box}
        .fi::placeholder{color:rgba(255,255,255,0.18)}
        .tb{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px;border:1.5px solid var(--line);background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.15s;flex:1;min-width:120px}
        .tb:hover{border-color:var(--line-bright)}
        .tb.on{border-color:rgba(${rgb},0.5);background:rgba(${rgb},0.08)}
        .cd{width:28px;height:28px;border-radius:50%;cursor:pointer;transition:transform 0.15s;border:2px solid transparent;flex-shrink:0}
        .cd:hover{transform:scale(1.15)}
        .cd.on{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,0.2)}
      `}</style>

      <div style={{ animation: "editorIn 0.3s cubic-bezier(0.22,1,0.36,1) both", maxWidth: 720, margin: "0 auto", paddingBottom: 60 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg,${agentColor},#22d3ee)`, boxShadow: `0 0 24px rgba(${rgb},0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "#fff" }}>
            {(fields.agent_name || "AI").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>{fields.agent_name || "Your Agent"}</h2>
            {meta?.username && (
              <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                easybuilda.vercel.app/{meta.username}
                <Icon name="external" size={11} />
              </a>
            )}
          </div>
          {meta?.readiness_score !== undefined && <Gauge score={meta.readiness_score} />}
        </div>

        <SectionLabel>Identity</SectionLabel>

        <div className="fc">
          <FieldHeader label="Agent name" icon="user" saving={saving === "agent_name"} saved={saved === "agent_name"} />
          <input className="fi" type="text" placeholder="e.g. Aria, Nova, Max…" value={fields.agent_name} onChange={e => handleChange("agent_name", e.target.value)} />
        </div>
        <div className="fc">
          <FieldHeader label="Tagline" icon="tag" saving={saving === "tagline"} saved={saved === "tagline"} />
          <input className="fi" type="text" placeholder="6 words that describe what your agent does…" value={fields.tagline} onChange={e => handleChange("tagline", e.target.value)} />
        </div>
        <div className="fc" style={{ marginBottom: 24 }}>
          <FieldHeader label="Welcome message" icon="message" saving={saving === "welcome_message"} saved={saved === "welcome_message"} />
          <textarea className="fi" rows={2} placeholder="Hi! I'm Aria. How can I help you today?" value={fields.welcome_message} onChange={e => handleChange("welcome_message", e.target.value)} />
        </div>

        <SectionLabel>Personality</SectionLabel>

        <div className="fc">
          <FieldHeader label="Tone" icon="mic" saving={saving === "tone"} saved={saved === "tone"} hint="How should your agent speak?" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {TONES.map(t => (
              <button key={t.value} className={`tb${fields.tone === t.value ? " on" : ""}`} onClick={() => handleChange("tone", t.value)}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: fields.tone === t.value ? "var(--color-starlight)" : "var(--color-dust)" }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: "0.67rem", color: "var(--color-dust)" }}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="fc" style={{ marginBottom: 24 }}>
          <FieldHeader label="Brand color" icon="palette" saving={saving === "primary_color"} saved={saved === "primary_color"} hint="Accent color for your chat widget" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {COLORS.map(c => (
              <button key={c} className={`cd${fields.primary_color === c ? " on" : ""}`}
                style={{ background: c, boxShadow: `0 0 10px ${c}55` }}
                onClick={() => handleChange("primary_color", c)} aria-label={c} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
              <input type="color" value={fields.primary_color || "#7c3aed"} onChange={e => handleChange("primary_color", e.target.value)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "none", padding: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>{fields.primary_color}</span>
            </div>
          </div>
        </div>

        <SectionLabel>Knowledge</SectionLabel>
        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "var(--color-dust)", lineHeight: 1.6 }}>
          Everything here is what your agent uses to answer customers. The more detail, the better it performs.
        </p>

        {SECTIONS.map(sec => (
          <div key={sec.key} className="fc">
            <FieldHeader label={sec.label} icon={sec.icon} saving={saving === sec.key} saved={saved === sec.key} />
            <textarea className="fi" rows={5} placeholder={sec.placeholder}
              value={(fields as unknown as Record<string, string>)[sec.key] || ""}
              onChange={e => handleChange(sec.key, e.target.value)} />
          </div>
        ))}

        {meta?.username && (
          <div style={{ marginTop: 20, padding: "18px 22px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--color-starlight)" }}>Changes are live instantly</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "var(--color-dust)" }}>
                Your agent at{" "}
                <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-stellar)", textDecoration: "none" }}>
                  easybuilda.vercel.app/{meta.username}
                </a>{" "}reflects all changes in real-time.
              </p>
            </div>
            <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, fontSize: "0.8rem", color: agentColor, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
              Preview <Icon name="external" size={13} />
            </a>
          </div>
        )}
      </div>
    </>
  );
}