"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/auth";

function ResetInner() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      const { error: err } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://easybuilda.com/auth/update-password",
      });
      if (err) { setError(err.message); }
      else { setSent(true); }
    } catch (ex: any) {
      setError(ex?.message || "Failed to send reset email.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .inp{width:100%;padding:11px 13px;background:rgba(255,255,255,0.05);border:1px solid rgba(237,240,247,0.12);border-radius:11px;color:#edf0f7;font-size:0.9rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.55)}
        .inp::placeholder{color:rgba(237,240,247,0.25)}
      `}</style>
      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", backgroundImage:"radial-gradient(700px 500px at 60% 30%,rgba(124,58,237,0.1),transparent 65%)" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeIn 0.3s ease both" }}>

          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <svg viewBox="0 0 1024 1024" width={26} height={26}>
                <defs><linearGradient id="rLogo" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient></defs>
                <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#rLogo)"/>
              </svg>
              <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1rem", color:"#edf0f7" }}>EasyBuilda</span>
            </a>
          </div>

          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:20, padding:"2rem" }}>
            {sent ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📬</div>
                <h2 style={{ margin:"0 0 0.6rem", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.2rem", color:"#edf0f7" }}>Check your email</h2>
                <p style={{ margin:"0 0 1.5rem", fontSize:"0.86rem", color:"rgba(237,240,247,0.55)", lineHeight:1.6 }}>
                  We sent a reset link to <strong style={{ color:"#edf0f7" }}>{email}</strong>. It expires in 1 hour.
                </p>
                <a href="/auth/login" style={{ fontSize:"0.84rem", color:"#a78bfa", textDecoration:"none" }}>← Back to login</a>
              </div>
            ) : (
              <>
                <h2 style={{ margin:"0 0 0.5rem", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.2rem", color:"#edf0f7", textAlign:"center" }}>Reset password</h2>
                <p style={{ margin:"0 0 1.5rem", fontSize:"0.84rem", color:"rgba(237,240,247,0.5)", textAlign:"center", lineHeight:1.55 }}>Enter your email and we'll send a reset link.</p>
                {error && <div style={{ marginBottom:"1rem", padding:"9px 12px", borderRadius:9, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", fontSize:"0.82rem", color:"#f87171" }}>{error}</div>}
                <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                  <input className="inp" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
                  <button type="submit" disabled={loading} style={{ padding:"0.82rem", borderRadius:12, background:loading?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {loading ? <><div style={{ width:15, height:15, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Sending…</> : "Send reset link →"}
                  </button>
                </form>
                <p style={{ textAlign:"center", marginTop:"1.2rem", fontSize:"0.8rem", color:"rgba(237,240,247,0.35)" }}>
                  <a href="/auth/login" style={{ color:"rgba(237,240,247,0.5)", textDecoration:"none" }}>← Back to login</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#05070f" }}/>}>
      <ResetInner/>
    </Suspense>
  );
}