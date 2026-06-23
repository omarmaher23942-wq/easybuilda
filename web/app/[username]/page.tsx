"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const IMAGE_PLANS = ["pro", "max", "singularity", "admin"];

interface Agent {
  id: string; name: string; business_name: string; tagline: string;
  welcome_message: string; suggested_questions: string[];
  primary_color: string; status: string; plan: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

function toRgb(hex: string) {
  const h = (hex || "#7c3aed").replace("#", "");
  try { return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`; }
  catch { return "124,58,237"; }
}

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div aria-hidden="true" style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${color} 0%,#22d3ee 100%)`, boxShadow:`0 0 ${size*0.5}px ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:size*0.32, color:"#fff" }}>
      {initials}
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display:"flex", gap:5, padding:"14px 18px", alignItems:"center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-dust)", display:"block", animation:`tdot 1.2s ease-in-out ${i*0.18}s infinite` }}/>
      ))}
    </div>
  );
}

/* ── Share Button ───────────────────────────────────────────────── */
function ShareButton({ agentName, username, color, rgb }: { agentName:string; username:string; color:string; rgb:string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://easybuilda.com/${username}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Chat with ${agentName}`, text: `Ask ${agentName} anything — AI-powered 24/7`, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={share} title="Share this agent" style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:9, background:copied?`rgba(${rgb},0.15)`:"rgba(255,255,255,0.04)", border:`1px solid ${copied?`rgba(${rgb},0.4)`:"var(--line)"}`, color:copied?color:"var(--color-dust)", fontSize:"0.7rem", cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s", flexShrink:0 }}>
      {copied ? (
        <>✓ Copied!</>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </>
      )}
    </button>
  );
}

export default function AgentPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const [agent,        setAgent]        = useState<Agent | null>(null);
  const [status,       setStatus]       = useState<"loading"|"ready"|"error">("loading");
  const [errMsg,       setErrMsg]       = useState("");
  const [msgs,         setMsgs]         = useState<Msg[]>([]);
  const [input,        setInput]        = useState("");
  const [busy,         setBusy]         = useState(false);
  const [convId,       setConvId]       = useState<string | null>(null);
  const [imageB64,     setImageB64]     = useState<string | null>(null);
  const [imageMime,    setImageMime]    = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [vid] = useState(() => `v-${Math.random().toString(36).slice(2)}`);

  const bottom  = useRef<HTMLDivElement>(null);
  const inpRef  = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/u/${encodeURIComponent(username)}`)
      .then(async r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => {
        const a = d.agent;
        // Parse JSON string fields that DB returns as strings
        if (typeof a.suggested_questions === "string") {
          try { a.suggested_questions = JSON.parse(a.suggested_questions); } catch { a.suggested_questions = []; }
        }
        if (!Array.isArray(a.suggested_questions)) a.suggested_questions = [];
        if (typeof a.faq === "string") {
          try { a.faq = JSON.parse(a.faq); } catch { a.faq = []; }
        }
        if (!Array.isArray(a.faq)) a.faq = [];
        setAgent(a);
        setMsgs([{ role:"assistant", content:a.welcome_message }]);
        setStatus("ready");
      })
      .catch(e => { setErrMsg(e.message); setStatus("error"); });
  }, [username]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, busy]);

  const handleImageFile = (file: File) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif"];
    if (!allowed.includes(file.type)) { alert("Please upload JPG, PNG, WebP or GIF only."); return; }
    if (file.size > 5*1024*1024) { alert("Image must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageB64(dataUrl.split(",")[1]);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageB64(null); setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if ((!msg && !imageB64) || busy || !agent) return;

    const finalB64     = imageB64;
    const finalMime    = imageMime;
    const finalPreview = imagePreview;

    setInput("");
    clearImage();
    if (inpRef.current) inpRef.current.style.height = "22px";
    setMsgs(p => [...p, { role:"user", content:msg||"📷 Image", image:finalPreview||undefined }]);
    setBusy(true);

    try {
      const body: Record<string,unknown> = {
        agent_id:        agent.id,
        message:         msg || "What do you see in this image?",
        conversation_id: convId,
        visitor_id:      vid,
        page_url:        window.location.href,
      };
      if (finalB64 && IMAGE_PLANS.includes(agent.plan)) {
        body.image_b64  = finalB64;
        body.image_mime = finalMime;
      }
      const res = await fetch(`${API}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      if (d.reply)           setMsgs(p => [...p, { role:"assistant", content:d.reply }]);
      if (d.conversation_id) setConvId(d.conversation_id);
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"Something went wrong — please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => inpRef.current?.focus(), 50);
    }
  }, [agent, convId, busy, vid, imageB64, imageMime, imagePreview]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  if (status === "error") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"var(--font-sans)", padding:24, background:"var(--color-void)" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:"rgba(248,113,113,0.12)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 8v4M11 14.5v.5M2 11a9 9 0 1018 0A9 9 0 002 11z" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.05rem", color:"var(--color-starlight)" }}>Agent not found</p>
        <p style={{ margin:"6px 0 0", fontSize:"0.8rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>{errMsg}</p>
      </div>
      <a href="https://easybuilda.com" style={{ fontSize:"0.85rem", color:"var(--color-stellar)", textDecoration:"none" }}>Build your own AI agent →</a>
    </div>
  );

  if (status === "loading" || !agent) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"var(--color-nebula)", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  const color    = agent.primary_color || "#7c3aed";
  const r        = toRgb(color);
  const initials = (agent.name || "AI").slice(0,2).toUpperCase();
  const userMsgs = msgs.filter(m => m.role === "user").length;
  const canImage = IMAGE_PLANS.includes(agent.plan);

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes tdot    { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(9px)} to{opacity:1;transform:translateY(0)} }
        html,body{height:100%;margin:0}
        .mb   { animation:msgIn 0.2s cubic-bezier(0.22,1,0.36,1) both }
        .chip { padding:6px 13px;border-radius:100px;font-size:0.76rem;cursor:pointer;border:1px solid rgba(${r},0.25);background:rgba(${r},0.07);color:var(--color-starlight);transition:all 0.15s;font-family:var(--font-sans);line-height:1.4 }
        .chip:hover { background:rgba(${r},0.16);transform:translateY(-1px) }
        .chip:disabled { opacity:0.4;cursor:not-allowed;transform:none }
        .sb { width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:${color};flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;box-shadow:0 0 16px ${color}55 }
        .sb:hover { filter:brightness(1.1);transform:scale(1.05) }
        .sb:disabled { opacity:0.35;cursor:not-allowed;transform:none;box-shadow:none }
        .ib { width:38px;height:38px;border-radius:50%;border:1px solid var(--line);cursor:pointer;background:rgba(255,255,255,0.04);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;color:var(--color-dust) }
        .ib:hover { border-color:rgba(${r},0.4);color:rgb(${r});background:rgba(${r},0.08) }
        .ti { flex:1;background:transparent;border:none;outline:none;resize:none;font-family:var(--font-sans);font-size:0.92rem;color:var(--color-starlight);line-height:1.5;overflow-y:auto;padding:0;min-height:22px;max-height:140px }
        .ti::placeholder { color:var(--color-dust) }
        @media(max-width:600px){
          .chat-header-title{font-size:0.86rem!important}
          .chat-header-sub{display:none!important}
          .msg-bubble{font-size:0.84rem!important}
          .chip{font-size:0.71rem!important;padding:5px 10px!important}
        }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--color-void)", backgroundImage:`radial-gradient(600px 350px at 60% -5%,rgba(${r},0.1),transparent 65%)` }}>

        {/* Header */}
        <header style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.9)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:10 }}>
          <Avatar initials={initials} color={color} size={36}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p className="chat-header-title" style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:600, fontSize:"0.92rem", color:"var(--color-starlight)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name}</p>
            <p className="chat-header-sub" style={{ margin:0, fontSize:"0.7rem", color:"var(--color-dust)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.tagline || agent.business_name}</p>
          </div>
          <ShareButton agentName={agent.name} username={username} color={color} rgb={r}/>
          <span style={{ fontSize:"0.63rem", padding:"3px 9px", borderRadius:100, flexShrink:0, background:"rgba(52,211,153,0.09)", color:"#34d399", border:"1px solid rgba(52,211,153,0.2)" }}>● online</span>
        </header>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 13px", display:"flex", flexDirection:"column", gap:12, maxWidth:720, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
          {msgs.map((m,i) => (
            <div key={i} className="mb" style={{ display:"flex", gap:9, alignItems:"flex-end", flexDirection:m.role==="user"?"row-reverse":"row" }}>
              {m.role === "assistant" && <Avatar initials={initials} color={color} size={33}/>}
              <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", gap:5, alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                {m.image && (
                  <img src={m.image} alt="Uploaded" style={{ maxWidth:200, maxHeight:160, borderRadius:11, border:"1px solid var(--line)", objectFit:"cover" }}/>
                )}
                {m.content && m.content !== "📷 Image" && (
                  <div className="msg-bubble" style={{ padding:"10px 14px", borderRadius:m.role==="user"?"17px 17px 4px 17px":"17px 17px 17px 4px", background:m.role==="user"?`rgba(${r},0.18)`:"rgba(255,255,255,0.055)", border:`1px solid ${m.role==="user"?`rgba(${r},0.3)`:"var(--line)"}`, fontSize:"0.89rem", color:"var(--color-starlight)", lineHeight:1.62, fontFamily:"var(--font-sans)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mb" style={{ display:"flex", gap:9, alignItems:"flex-end" }}>
              <Avatar initials={initials} color={color} size={33}/>
              <div style={{ background:"rgba(255,255,255,0.055)", border:"1px solid var(--line)", borderRadius:"17px 17px 17px 4px" }}><Dots/></div>
            </div>
          )}
          <div ref={bottom}/>
        </div>

        {/* Suggested questions */}
        {userMsgs === 0 && (agent.suggested_questions?.length ?? 0) > 0 && (
          <div style={{ padding:"0 13px 10px", display:"flex", gap:7, flexWrap:"wrap", maxWidth:720, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
            {agent.suggested_questions.map((q,i) => (
              <button key={i} className="chip" onClick={() => send(q)} disabled={busy}>{q}</button>
            ))}
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"0 13px 8px", boxSizing:"border-box" }}>
            <div style={{ position:"relative", display:"inline-block" }}>
              <img src={imagePreview} alt="Preview" style={{ height:66, width:66, objectFit:"cover", borderRadius:10, border:`1px solid rgba(${r},0.3)` }}/>
              <button type="button" onClick={clearImage} style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:"#f87171", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", fontWeight:700 }}>×</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding:"9px 13px 18px", borderTop:"1px solid var(--line)", background:"rgba(5,7,15,0.9)", backdropFilter:"blur(20px)" }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f=e.target.files?.[0]; if(f) handleImageFile(f); }}/>
          <div style={{ maxWidth:720, margin:"0 auto", display:"flex", alignItems:"flex-end", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:16, padding:"9px 11px", transition:"border-color 0.2s" }}
            onFocus={e => (e.currentTarget.style.borderColor=`rgba(${r},0.45)`)}
            onBlur={e => (e.currentTarget.style.borderColor="var(--line)")}>
            {canImage && (
              <button type="button" className="ib" title="Upload image (Pro)" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
            )}
            <textarea ref={inpRef} className="ti" rows={1} placeholder={canImage?"Message or upload image…":"Type a message…"} value={input} onChange={handleTextChange} onKeyDown={onKey}/>
            <button className="sb" onClick={() => send(input)} disabled={(!input.trim() && !imageB64) || busy} aria-label="Send">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M15.5 2.5L8.5 9.5M15.5 2.5L11 16L8.5 9.5M15.5 2.5L2.5 7L8.5 9.5" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Powered by badge */}
          <p style={{ textAlign:"center", marginTop:7, fontSize:"0.6rem", color:"var(--color-dust)", opacity:0.4, fontFamily:"var(--font-mono)", letterSpacing:"0.04em" }}>
            Powered by{" "}
            <a href="https://easybuilda.com" target="_blank" rel="noopener noreferrer" style={{ color:"var(--color-nebula)", textDecoration:"none" }}>EasyBuilda</a>
            {" "}· Build yours free →
          </p>
        </div>
      </div>
    </>
  );
}