"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface ReferralData { code: string; link: string; count: number; }

function Ic({ name, size=16, color }: { name:string; size?:number; color?:string }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:color||"currentColor", strokeWidth:1.65, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch (name) {
    case "copy":   return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "check":  return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "gift":   return <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "users":  return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "back":   return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    default:       return null;
  }
}

export default function ReferralPage() {
  const [data,    setData]    = useState<ReferralData|null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<"link"|"code"|null>(null);
  const [token,   setToken]   = useState("");

  useEffect(() => {
    createClient().auth.getSession().then(({ data: s }) => {
      if (!s.session) { window.location.href = "/auth/login"; return; }
      setToken(s.session.access_token);
      fetch(`${API}/api/referral/my-code`, { headers: { Authorization: `Bearer ${s.session.access_token}` } })
        .then(r => r.json()).then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, []);

  const copy = (text: string, key: "link"|"code") => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--color-void)", backgroundImage:"radial-gradient(700px 400px at 60% -5%,rgba(52,211,153,0.09),transparent 60%)" }}>

      <header style={{ borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.88)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", gap:14 }}>
          <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:6, color:"var(--color-dust)", textDecoration:"none", fontSize:"0.82rem" }}>
            <Ic name="back" size={14}/> Dashboard
          </a>
          <div style={{ flex:1 }}/>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>E</div>
        </div>
      </header>

      <main style={{ maxWidth:760, margin:"0 auto", padding:"40px 20px 64px" }}>

        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:60, height:60, borderRadius:18, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>🎁</div>
          <h1 style={{ margin:"0 0 8px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(1.6rem,4vw,2.2rem)", letterSpacing:"-0.02em", color:"var(--color-starlight)" }}>
            Refer a business. Earn $10.
          </h1>
          <p style={{ margin:0, fontSize:"0.95rem", color:"var(--color-dust)", lineHeight:1.65 }}>
            When someone you refer signs up and tops up their wallet, you both get $10 wallet credit — automatically.
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
            <div style={{ textAlign:"center", padding:"20px", background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:16 }}>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"2.4rem", color:"#34d399", lineHeight:1 }}>{data.count}</div>
              <div style={{ fontSize:"0.78rem", color:"var(--color-dust)", marginTop:6 }}>Businesses referred</div>
            </div>
            <div style={{ textAlign:"center", padding:"20px", background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:16 }}>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"2.4rem", color:"#34d399", lineHeight:1 }}>${data.count * 10}</div>
              <div style={{ fontSize:"0.78rem", color:"var(--color-dust)", marginTop:6 }}>Total earned</div>
            </div>
          </div>
        )}

        {/* Referral link */}
        {data && (
          <div style={{ background:"rgba(52,211,153,0.05)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:20, padding:"24px", marginBottom:24 }}>
            <p style={{ margin:"0 0 16px", fontSize:"0.72rem", color:"#34d399", fontFamily:"var(--font-mono)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Your referral link</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"rgba(0,0,0,0.25)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:12, marginBottom:10 }}>
              <p style={{ margin:0, flex:1, fontSize:"0.84rem", color:"var(--color-stellar)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{data.link}</p>
              <button onClick={() => copy(data.link, "link")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:9, background:copied==="link"?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.05)", border:`1px solid ${copied==="link"?"rgba(52,211,153,0.3)":"var(--line)"}`, color:copied==="link"?"#34d399":"var(--color-dust)", fontSize:"0.74rem", cursor:"pointer", fontFamily:"var(--font-sans)", flexShrink:0, transition:"all 0.15s" }}>
                {copied==="link"?<><Ic name="check" size={12} color="#34d399"/> Copied!</>:<><Ic name="copy" size={12}/> Copy</>}
              </button>
            </div>
            <p style={{ margin:"0 0 10px", fontSize:"0.72rem", color:"var(--color-dust)" }}>Or share your code directly:</p>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <code style={{ fontFamily:"var(--font-mono)", fontWeight:700, fontSize:"1.2rem", color:"var(--color-starlight)", letterSpacing:"0.15em" }}>{data.code}</code>
              <button onClick={() => copy(data.code, "code")} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8, background:copied==="code"?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${copied==="code"?"rgba(52,211,153,0.3)":"var(--line)"}`, color:copied==="code"?"#34d399":"var(--color-dust)", fontSize:"0.72rem", cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s" }}>
                {copied==="code"?<><Ic name="check" size={11} color="#34d399"/> Copied!</>:<><Ic name="copy" size={11}/> Copy code</>}
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:18, padding:"22px" }}>
          <h2 style={{ margin:"0 0 18px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", color:"var(--color-starlight)" }}>How it works</h2>
          {[
            { n:"1", title:"Share your link",          desc:"Send your referral link to any business owner you know." },
            { n:"2", title:"They sign up",              desc:"They create an EasyBuilda account using your link or code." },
            { n:"3", title:"They top up their wallet", desc:"When they add funds for the first time, the reward triggers." },
            { n:"4", title:"You both get $10",         desc:"$10 is added to both your wallets automatically." },
          ].map(s => (
            <div key={s.n} style={{ display:"flex", gap:14, marginBottom:16 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.82rem", color:"#34d399", flexShrink:0 }}>{s.n}</div>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>{s.title}</p>
                <p style={{ margin:0, fontSize:"0.78rem", color:"var(--color-dust)", lineHeight:1.55 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}