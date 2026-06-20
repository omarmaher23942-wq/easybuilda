"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/* ── Types ─────────────────────────────────────────────────────── */
interface CaseStudy {
  headline: string;
  problem: string;
  solution: string;
  results: string;
  quote: string;
  cta: string;
  linkedin_post: string;
  twitter_post: string;
}

interface AgentOption {
  id: string;
  name: string;
  business_name: string;
  subdomain: string;
}

/* ── Icons ──────────────────────────────────────────────────────── */
function Ic({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "linkedin": return <svg {...p}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
    case "twitter":  return <svg {...p}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
    case "copy":     return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "check":    return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "back":     return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "spark":    return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "doc":      return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case "download": return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    default:         return null;
  }
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:copied?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)", border:`1px solid ${copied?"rgba(52,211,153,0.3)":"var(--line)"}`, color:copied?"#34d399":"var(--color-dust)", fontSize:"0.74rem", cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s" }}>
      {copied ? <><Ic name="check" size={12} color="#34d399"/> Copied!</> : <><Ic name="copy" size={12}/> {label}</>}
    </button>
  );
}

function Section({ title, content, icon, color = "124,58,237" }: { title: string; content: string; icon: string; color?: string }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:14, padding:"16px 18px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:`rgba(${color},0.12)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic name={icon} size={14} color={`rgb(${color})`}/>
          </div>
          <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono)", color:`rgb(${color})`, letterSpacing:"0.08em", textTransform:"uppercase" }}>{title}</span>
        </div>
        <CopyButton text={content}/>
      </div>
      <p style={{ margin:0, fontSize:"0.88rem", color:"var(--color-starlight)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{content}</p>
    </div>
  );
}

function SocialPost({ platform, content, icon, color, bg }: { platform: string; content: string; icon: string; color: string; bg: string }) {
  return (
    <div style={{ background:bg, border:`1px solid ${color}33`, borderRadius:14, padding:"16px 18px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Ic name={icon} size={16} color={color}/>
          <span style={{ fontSize:"0.78rem", fontWeight:700, color, fontFamily:"var(--font-sans)" }}>{platform}</span>
        </div>
        <CopyButton text={content} label={`Copy for ${platform}`}/>
      </div>
      <div style={{ padding:"12px 14px", background:"rgba(0,0,0,0.2)", borderRadius:10, fontSize:"0.86rem", color:"var(--color-starlight)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
        {content}
      </div>
    </div>
  );
}

export default function CaseStudyPage() {
  const [agents,      setAgents]      = useState<AgentOption[]>([]);
  const [selectedId,  setSelectedId]  = useState("");
  const [leadCount,   setLeadCount]   = useState("10");
  const [hotCount,    setHotCount]    = useState("3");
  const [timeframe,   setTimeframe]   = useState("first week");
  const [highlight,   setHighlight]   = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [caseStudy,   setCaseStudy]   = useState<CaseStudy | null>(null);
  const [error,       setError]       = useState("");
  const [token,       setToken]       = useState("");
  const [loaded,      setLoaded]      = useState(false);

  useState(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${data.session.access_token}` } })
        .then(r => r.json())
        .then(d => { setAgents(d.agents || []); if (d.agents?.length) setSelectedId(d.agents[0].id); setLoaded(true); })
        .catch(() => setLoaded(true));
    });
  });

  const selectedAgent = agents.find(a => a.id === selectedId);

  const generate = async () => {
    if (!selectedAgent) return;
    setGenerating(true); setError(""); setCaseStudy(null);

    try {
      const prompt = `You are a B2B content strategist. Create a compelling case study for a business using EasyBuilda AI agents.

Business: ${selectedAgent.business_name}
AI Agent Name: ${selectedAgent.name}
Results: ${leadCount} total leads, ${hotCount} hot leads in ${timeframe}
${highlight ? `Highlight: ${highlight}` : ""}

Return ONLY valid JSON with these exact keys:
{
  "headline": "compelling headline (max 12 words)",
  "problem": "2-3 sentences about the challenge before AI agent",
  "solution": "2-3 sentences about how the AI agent helped",
  "results": "3-4 sentences with specific numbers from the data above",
  "quote": "a realistic first-person quote from the business owner (1-2 sentences)",
  "cta": "one powerful call-to-action sentence",
  "linkedin_post": "full LinkedIn post (150-200 words) with emojis, line breaks, specific numbers, ends with 'Built with EasyBuilda — easybuilda.com'",
  "twitter_post": "Twitter/X thread starter (max 280 chars) with numbers and emoji, ends with easybuilda.com"
}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const d = await res.json();
      const text = d.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as CaseStudy;
      setCaseStudy(parsed);
    } catch {
      setError("Generation failed — please try again.");
    }
    setGenerating(false);
  };

  const fullText = caseStudy ? `# ${caseStudy.headline}

## The Challenge
${caseStudy.problem}

## The Solution
${caseStudy.solution}

## Results
${caseStudy.results}

"${caseStudy.quote}"

${caseStudy.cta}

---
Built with EasyBuilda · easybuilda.com` : "";

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp{width:100%;padding:10px 13px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:11px;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.88rem;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
        select.inp option{background:#111827}
        @media(max-width:600px){.cs-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--color-void)", backgroundImage:"radial-gradient(700px 400px at 65% -5%,rgba(124,58,237,0.09),transparent 60%)" }}>

        <header style={{ borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.88)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ maxWidth:900, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:6, color:"var(--color-dust)", textDecoration:"none", fontSize:"0.82rem", fontFamily:"var(--font-sans)" }}>
              <Ic name="back" size={14}/> Dashboard
            </a>
            <div style={{ flex:1 }}/>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>E</div>
          </div>
        </header>

        <main style={{ maxWidth:900, margin:"0 auto", padding:"36px 20px 64px" }}>

          <div style={{ marginBottom:36, animation:"fadeIn 0.3s ease both" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"var(--color-nebula)", marginBottom:10 }}>Content Tools</p>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(1.8rem,4vw,2.4rem)", letterSpacing:"-0.025em", color:"var(--color-starlight)", marginBottom:8 }}>
              Case Study Builder
            </h1>
            <p style={{ fontSize:"0.9rem", color:"var(--color-dust)", lineHeight:1.6 }}>
              Turn your AI agent results into compelling case studies and social content — in seconds.
            </p>
          </div>

          <div className="cs-grid" style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:24, alignItems:"start" }}>

            {/* Form */}
            <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:18, padding:"22px 20px", position:"sticky", top:80 }}>
              <h2 style={{ margin:"0 0 20px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", color:"var(--color-starlight)" }}>Your results</h2>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:"0.72rem", color:"var(--color-dust)", marginBottom:6, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Select agent</label>
                <select className="inp" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.business_name}</option>)}
                </select>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", color:"var(--color-dust)", marginBottom:6, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Total leads</label>
                  <input className="inp" type="number" min="0" value={leadCount} onChange={e => setLeadCount(e.target.value)} placeholder="e.g. 24"/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", color:"var(--color-dust)", marginBottom:6, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Hot leads</label>
                  <input className="inp" type="number" min="0" value={hotCount} onChange={e => setHotCount(e.target.value)} placeholder="e.g. 7"/>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:"0.72rem", color:"var(--color-dust)", marginBottom:6, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Timeframe</label>
                <input className="inp" value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="e.g. first 2 weeks"/>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:"0.72rem", color:"var(--color-dust)", marginBottom:6, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Highlight (optional)</label>
                <input className="inp" value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="e.g. Booked 3 appointments overnight"/>
              </div>

              {error && <p style={{ margin:"0 0 14px", fontSize:"0.78rem", color:"#f87171" }}>{error}</p>}

              <button onClick={generate} disabled={generating || !selectedId} style={{ width:"100%", padding:"11px 0", borderRadius:12, background:generating||!selectedId?"rgba(124,58,237,0.25)":"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:generating||!selectedId?"not-allowed":"pointer", fontFamily:"var(--font-sans)", boxShadow:generating||!selectedId?"none":"0 0 22px rgba(124,58,237,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.15s" }}>
                {generating ? (
                  <><div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Generating…</>
                ) : (
                  <><Ic name="spark" size={16} color="#fff"/> Generate case study</>
                )}
              </button>
            </div>

            {/* Output */}
            <div>
              {!caseStudy && !generating && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:18, gap:16 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Ic name="doc" size={24} color="var(--color-nebula)"/>
                  </div>
                  <p style={{ margin:0, fontSize:"0.9rem", color:"var(--color-dust)" }}>Fill in your results and click Generate</p>
                </div>
              )}

              {generating && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", gap:16 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.75s linear infinite" }}/>
                  <p style={{ margin:0, fontSize:"0.88rem", color:"var(--color-dust)" }}>Writing your case study…</p>
                </div>
              )}

              {caseStudy && (
                <div style={{ animation:"fadeIn 0.3s ease both" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <h2 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-starlight)" }}>Generated case study</h2>
                    <div style={{ display:"flex", gap:8 }}>
                      <CopyButton text={fullText} label="Copy all"/>
                      <button onClick={generate} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", color:"var(--color-dust)", fontSize:"0.74rem", cursor:"pointer", fontFamily:"var(--font-sans)" }}>
                        <Ic name="spark" size={12}/> Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Headline */}
                  <div style={{ padding:"16px 20px", background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:14, marginBottom:12 }}>
                    <p style={{ margin:"0 0 6px", fontSize:"0.65rem", color:"var(--color-nebula)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Headline</p>
                    <h3 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.2rem", color:"var(--color-starlight)", lineHeight:1.3 }}>{caseStudy.headline}</h3>
                  </div>

                  <Section title="The Challenge" content={caseStudy.problem}   icon="doc"    color="248,113,113"/>
                  <Section title="The Solution"  content={caseStudy.solution}  icon="spark"  color="56,189,248"/>
                  <Section title="Results"       content={caseStudy.results}   icon="check"  color="52,211,153"/>

                  {/* Quote */}
                  <div style={{ padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderLeft:"3px solid #a78bfa", borderRadius:"0 14px 14px 0", marginBottom:12 }}>
                    <p style={{ margin:"0 0 6px", fontSize:"0.65rem", color:"#a78bfa", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Client quote</p>
                    <p style={{ margin:0, fontSize:"0.92rem", color:"var(--color-starlight)", lineHeight:1.7, fontStyle:"italic" }}>"{caseStudy.quote}"</p>
                    <div style={{ marginTop:8 }}><CopyButton text={`"${caseStudy.quote}"`}/></div>
                  </div>

                  {/* Social Posts */}
                  <div style={{ marginTop:20, marginBottom:12 }}>
                    <p style={{ margin:"0 0 14px", fontSize:"0.72rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Social content — ready to post</p>
                    <SocialPost platform="LinkedIn" content={caseStudy.linkedin_post} icon="linkedin" color="#0A66C2" bg="rgba(10,102,194,0.06)"/>
                    <SocialPost platform="Twitter / X" content={caseStudy.twitter_post} icon="twitter"  color="#1DA1F2" bg="rgba(29,161,242,0.06)"/>
                  </div>

                  {/* CTA */}
                  <div style={{ padding:"14px 18px", background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:14 }}>
                    <p style={{ margin:"0 0 4px", fontSize:"0.65rem", color:"#34d399", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Call to action</p>
                    <p style={{ margin:"0 0 8px", fontSize:"0.9rem", color:"var(--color-starlight)", lineHeight:1.6 }}>{caseStudy.cta}</p>
                    <CopyButton text={caseStudy.cta}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}