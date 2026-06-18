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

const TONES = [
  { value: "friendly",     label: "Friendly",     emoji: "😊", desc: "Warm and approachable" },
  { value: "professional", label: "Professional",  emoji: "💼", desc: "Formal and precise" },
  { value: "energetic",    label: "Energetic",     emoji: "⚡", desc: "Upbeat and enthusiastic" },
  { value: "luxury",       label: "Luxury",        emoji: "✨", desc: "Elegant and refined" },
  { value: "casual",       label: "Casual",        emoji: "🤙", desc: "Relaxed and conversational" },
];

const COLORS = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#6366f1"];

const SECTIONS: { key: keyof AgentFields; label: string; icon: string; placeholder: string }[] = [
  { key: "services", label: "Services & Pricing", icon: "🛍️", placeholder: "List your services and prices.\n• Hair cut — $45\n• Highlights — from $120" },
  { key: "hours",    label: "Business Hours",     icon: "🕐", placeholder: "Mon–Fri: 9am – 6pm\nSat: 10am – 4pm\nSunday: Closed" },
  { key: "location", label: "Location",            icon: "📍", placeholder: "123 Main St, Austin TX 78701\nWe also deliver within 10 miles." },
  { key: "contact",  label: "Contact & Booking",   icon: "📞", placeholder: "Call/text: (512) 555-1234\nEmail: hello@yourbusiness.com" },
  { key: "policies", label: "Policies",             icon: "📋", placeholder: "Cancellations: 24hr notice required\nRefunds: 30-day guarantee" },
];

function Gauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
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
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

function FieldHeader({ label, icon, saving, saved, hint }: { label: string; icon: string; saving: boolean; saved: boolean; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)" }}>{label}</p>
        {hint && <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "var(--color-dust)" }}>{hint}</p>}
      </div>
      {saving && <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", borderTopColor: "var(--color-nebula)", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />}
      {saved && !saving && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "fadeInOut 2.5s ease forwards", flexShrink: 0 }}>
          <path d="M2.5 7l3 3 6-6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export function AgentEditor({ agentId, token, onClose }: AgentEditorProps) {
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
    } catch { setError("Save failed. Check your connection."); }
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
  const h = agentColor.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInOut{0%{opacity:0}10%{opacity:1}75%{opacity:1}100%{opacity:0}}
        @keyframes editorIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .field-card{background:rgba(255,255,255,0.025);border:1px solid var(--line);border-radius:18px;padding:22px;transition:border-color 0.2s;margin-bottom:12px}
        .field-card:focus-within{border-color:rgba(${rgb},0.45)}
        .field-input{width:100%;background:transparent;border:none;outline:none;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.92rem;line-height:1.6;resize:none;padding:0;box-sizing:border-box}
        .field-input::placeholder{color:rgba(255,255,255,0.18)}
        .tone-btn{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;border:1.5px solid var(--line);background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.15s;flex:1;min-width:0}
        .tone-btn:hover{border-color:var(--line-bright)}
        .tone-btn.active{border-color:rgba(${rgb},0.5);background:rgba(${rgb},0.08)}
        .color-dot{width:28px;height:28px;border-radius:50%;cursor:pointer;transition:transform 0.15s;border:2px solid transparent;flex-shrink:0}
        .color-dot:hover{transform:scale(1.15)}
        .color-dot.active{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,0.2)}
      `}</style>

      <div style={{ animation: "editorIn 0.3s cubic-bezier(0.22,1,0.36,1) both", maxWidth: 720, margin: "0 auto", paddingBottom: 60 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg,${agentColor},#22d3ee)`, boxShadow: `0 0 24px rgba(${rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff" }}>
            {(fields.agent_name || "AI").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)" }}>{fields.agent_name || "Your Agent"}</h2>
            {meta?.username && (
              <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "var(--color-stellar)", fontFamily: "var(--font-mono)", textDecoration: "none" }}>
                easybuilda.vercel.app/{meta.username} ↗
              </a>
            )}
          </div>
          {meta?.readiness_score !== undefined && <Gauge score={meta.readiness_score} />}
        </div>

        <SectionLabel>Identity</SectionLabel>

        <div className="field-card">
          <FieldHeader label="Agent name" icon="🤖" saving={saving === "agent_name"} saved={saved === "agent_name"} />
          <input className="field-input" type="text" placeholder="e.g. Aria, Nova, Max…" value={fields.agent_name} onChange={e => handleChange("agent_name", e.target.value)} />
        </div>
        <div className="field-card">
          <FieldHeader label="Tagline" icon="✍️" saving={saving === "tagline"} saved={saved === "tagline"} />
          <input className="field-input" type="text" placeholder="6 words that describe what your agent does…" value={fields.tagline} onChange={e => handleChange("tagline", e.target.value)} />
        </div>
        <div className="field-card" style={{ marginBottom: 24 }}>
          <FieldHeader label="Welcome message" icon="👋" saving={saving === "welcome_message"} saved={saved === "welcome_message"} />
          <textarea className="field-input" rows={2} placeholder="Hi! I'm Aria. How can I help you today?" value={fields.welcome_message} onChange={e => handleChange("welcome_message", e.target.value)} />
        </div>

        <SectionLabel>Personality</SectionLabel>

        <div className="field-card">
          <FieldHeader label="Tone" icon="🎭" saving={saving === "tone"} saved={saved === "tone"} hint="How should your agent speak?" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {TONES.map(t => (
              <button key={t.value} className={`tone-btn${fields.tone === t.value ? " active" : ""}`} onClick={() => handleChange("tone", t.value)}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: fields.tone === t.value ? "var(--color-starlight)" : "var(--color-dust)" }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: "0.66rem", color: "var(--color-dust)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="field-card" style={{ marginBottom: 24 }}>
          <FieldHeader label="Brand color" icon="🎨" saving={saving === "primary_color"} saved={saved === "primary_color"} hint="Accent color for your chat widget" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {COLORS.map(c => (
              <button key={c} className={`color-dot${fields.primary_color === c ? " active" : ""}`} style={{ background: c, boxShadow: `0 0 10px ${c}55` }} onClick={() => handleChange("primary_color", c)} aria-label={c} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
              <input type="color" value={fields.primary_color || "#7c3aed"} onChange={e => handleChange("primary_color", e.target.value)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "none", padding: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>{fields.primary_color}</span>
            </div>
          </div>
        </div>

        <SectionLabel>Knowledge</SectionLabel>
        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "var(--color-dust)", lineHeight: 1.6 }}>
          Everything here is what your agent uses to answer customers. The more detail, the better it performs.
        </p>

        {SECTIONS.map(sec => (
          <div key={sec.key} className="field-card">
            <FieldHeader label={sec.label} icon={sec.icon} saving={saving === sec.key} saved={saved === sec.key} />
            <textarea className="field-input" rows={5} placeholder={sec.placeholder}
              value={(fields as unknown as Record<string, string>)[sec.key] || ""}
              onChange={e => handleChange(sec.key, e.target.value)} />
          </div>
        ))}

        {meta?.username && (
          <div style={{ marginTop: 20, padding: "18px 22px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `rgba(${rgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L8 4l6 8" stroke={agentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--color-starlight)" }}>Changes are live instantly</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "var(--color-dust)" }}>
                Your agent at{" "}
                <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-stellar)", textDecoration: "none" }}>easybuilda.vercel.app/{meta.username}</a>{" "}
                reflects all changes in real-time.
              </p>
            </div>
            <a href={`/${meta.username}`} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 10, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, fontSize: "0.8rem", color: agentColor, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
              Preview ↗
            </a>
          </div>
        )}
      </div>
    </>
  );
}