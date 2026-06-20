"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const POST_TYPES = [
  { id:"launch",    emoji:"🚀", label:"Agent Launch",       desc:"Announce your AI agent" },
  { id:"results",   emoji:"📊", label:"Results Post",       desc:"Share lead generation results" },
  { id:"story",     emoji:"💡", label:"Behind the Scenes",  desc:"How you built your agent" },
  { id:"tip",       emoji:"🎯", label:"Industry Tip",       desc:"AI tip for your industry" },
  { id:"testimony", emoji:"⭐", label:"Customer Story",     desc:"A customer success story" },
  { id:"thought",   emoji:"🧠", label:"Thought Leadership", desc:"Your AI perspective" },
];

interface Agent { id:string; name:string; business_name:string; }

function CopyBtn({ text }: { text:string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={copy} style={{ padding:"6px 12px", borderRadius:8, background:copied?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)", border:`1px solid ${copied?"rgba(52,211,153,0.3)":"rgba(237,240,247,0.1)"}`, color:copied?"#34d399":"rgba(237,240,247,0.6)", fontSize:"0.74rem", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

export default function LinkedInPage() {
  const [agents,   setAgents]   = useState<Agent[]>([]);
  const [agentId,  setAgentId]  = useState("");
  const [postType, setPostType] = useState("launch");
  const [leads,    setLeads]    = useState("0");
  const [hot,      setHot]      = useState("0");
  const [custom,   setCustom]   = useState("");
  const [posts,    setPosts]    = useState<string[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [apiUrl,   setApiUrl]   = useState("");

  useEffect(() => {
    // Access env vars and window only on client
    const url = process.env.NEXT_PUBLIC_API_URL || "";
    setApiUrl(url.replace(/\/$/, ""));

    import("@/lib/auth").then(({ createClient }) => {
      createClient().auth.getSession().then(({ data }) => {
        if (!data.session) { window.location.href = "/auth/login"; return; }
        const token = data.session.access_token;
        fetch(`${url.replace(/\/$/, "")}/api/agents/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { setAgents(d.agents || []); if (d.agents?.length) setAgentId(d.agents[0].id); });
      });
    });
  }, []);

  const generate = useCallback(async () => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !apiUrl) return;
    setLoading(true); setError(""); setPosts([]);

    const typeInfo = POST_TYPES.find(p => p.id === postType)!;
    const prompt = `You are a LinkedIn content expert. Create 3 different LinkedIn posts for a business owner who uses an AI agent called "${agent.name}" for "${agent.business_name}".

Post type: ${typeInfo.label} — ${typeInfo.desc}
${leads !== "0" ? `Leads captured: ${leads} total, ${hot} hot leads` : ""}
${custom ? `Additional context: ${custom}` : ""}

Rules:
- Each post 150-250 words
- Professional but human tone
- Use line breaks for readability
- 2-3 relevant emojis
- End with a question or CTA
- Mention EasyBuilda naturally in at least one post
- NO hashtags

Return ONLY valid JSON array with exactly 3 strings:
["post 1 text...", "post 2 text...", "post 3 text..."]`;

    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
      });
      const d    = await res.json();
      const text = d.content?.[0]?.text || "[]";
      setPosts(JSON.parse(text.replace(/```json|```/g, "").trim()) as string[]);
    } catch {
      setError("Generation failed — please try again.");
    }
    setLoading(false);
  }, [agents, agentId, postType, leads, hot, custom, apiUrl]);

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .inp{width:100%;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(237,240,247,0.1);border-radius:10px;color:#edf0f7;font-size:0.87rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box} .inp:focus{border-color:rgba(10,102,194,0.5)} .inp::placeholder{color:rgba(237,240,247,0.2)} select.inp option{background:#111827}`}</style>
      <div style={{ minHeight:"100vh", background:"#05070f", color:"#edf0f7", fontFamily:"'Inter',sans-serif", WebkitFontSmoothing:"antialiased" }}>
        <header style={{ borderBottom:"1px solid rgba(237,240,247,0.08)", background:"rgba(5,7,15,0.9)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ maxWidth:980, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.82rem" }}>← Dashboard</a>
            <div style={{ flex:1 }}/>
            <span style={{ fontSize:"0.8rem", color:"rgba(237,240,247,0.4)" }}>LinkedIn Auto-Content</span>
          </div>
        </header>
        <main style={{ maxWidth:980, margin:"0 auto", padding:"32px 20px 64px" }}>
          <div style={{ marginBottom:28 }}>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:"#0A66C2", marginBottom:8 }}>Content Tools</p>
            <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:"clamp(1.8rem,4vw,2.3rem)", letterSpacing:"-0.025em", color:"#edf0f7", marginBottom:8 }}>LinkedIn Auto-Content</h1>
            <p style={{ fontSize:"0.9rem", color:"rgba(237,240,247,0.55)", lineHeight:1.6 }}>Generate 3 ready-to-post LinkedIn variations from your AI agent data.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>
            <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:18, padding:20, position:"sticky", top:80 }}>
              <h2 style={{ margin:"0 0 16px", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:"0.92rem", color:"#edf0f7" }}>Settings</h2>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Agent</label>
                <select className="inp" value={agentId} onChange={e=>setAgentId(e.target.value)}>
                  {agents.map(a=><option key={a.id} value={a.id}>{a.name} — {a.business_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:8, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Post type</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {POST_TYPES.map(t=>(
                    <button key={t.id} onClick={()=>setPostType(t.id)} style={{ padding:"8px 7px", borderRadius:10, border:`1px solid ${postType===t.id?"rgba(10,102,194,0.5)":"rgba(237,240,247,0.08)"}`, background:postType===t.id?"rgba(10,102,194,0.1)":"rgba(255,255,255,0.02)", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ fontSize:14, marginBottom:2 }}>{t.emoji}</div>
                      <div style={{ fontSize:"0.72rem", fontWeight:600, color:postType===t.id?"#38bdf8":"#edf0f7" }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              {(postType==="results"||postType==="story") && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  <div><label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:4, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Total leads</label><input className="inp" type="number" min="0" value={leads} onChange={e=>setLeads(e.target.value)}/></div>
                  <div><label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:4, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Hot leads</label><input className="inp" type="number" min="0" value={hot} onChange={e=>setHot(e.target.value)}/></div>
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", marginBottom:5, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Extra context</label>
                <textarea className="inp" rows={3} placeholder="e.g. We just crossed 100 leads..." value={custom} onChange={e=>setCustom(e.target.value)} style={{ resize:"none" }}/>
              </div>
              {error && <p style={{ margin:"0 0 10px", fontSize:"0.78rem", color:"#f87171" }}>{error}</p>}
              <button onClick={generate} disabled={loading||!agentId} style={{ width:"100%", padding:"11px 0", borderRadius:12, background:loading||!agentId?"rgba(10,102,194,0.2)":"linear-gradient(135deg,#0A66C2,#2563eb)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading||!agentId?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><div style={{ width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/> Generating…</> : "✦ Generate 3 posts"}
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {!posts.length && !loading && (
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(237,240,247,0.08)",borderRadius:18,gap:12 }}>
                  <div style={{ fontSize:"3rem" }}>💼</div>
                  <p style={{ margin:0,fontSize:"0.9rem",color:"rgba(237,240,247,0.5)" }}>Choose a post type and click Generate</p>
                </div>
              )}
              {loading && (
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px",gap:14 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",border:"2px solid rgba(10,102,194,0.2)",borderTopColor:"#0A66C2",animation:"spin 0.75s linear infinite" }}/>
                  <p style={{ margin:0,fontSize:"0.88rem",color:"rgba(237,240,247,0.5)" }}>Writing your LinkedIn posts…</p>
                </div>
              )}
              {posts.map((post,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(237,240,247,0.08)",borderRadius:16,overflow:"hidden",animation:"fadeIn 0.3s ease both",animationDelay:`${i*0.08}s` }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 15px",borderBottom:"1px solid rgba(237,240,247,0.06)",background:"rgba(10,102,194,0.06)" }}>
                    <span style={{ fontSize:"0.72rem",fontWeight:700,color:"#38bdf8",fontFamily:"'JetBrains Mono',monospace" }}>VARIATION {i+1}</span>
                    <CopyBtn text={post}/>
                  </div>
                  <div style={{ padding:"14px 16px",fontSize:"0.87rem",color:"#edf0f7",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{post}</div>
                  <div style={{ padding:"0 16px 12px",fontSize:"0.68rem",color:"rgba(237,240,247,0.3)",fontFamily:"'JetBrains Mono',monospace" }}>{post.split(" ").length} words</div>
                </div>
              ))}
              {posts.length > 0 && (
                <button onClick={generate} style={{ padding:"10px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(237,240,247,0.08)",color:"rgba(237,240,247,0.5)",fontSize:"0.84rem",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
                  ↻ Regenerate
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
