"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth";

function AuthInner() {
  const params  = useSearchParams();
  const refCode = params.get("ref") || "";
  const next    = params.get("next") || "/onboarding";

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [mode,    setMode]    = useState<"magic"|"google">("magic");

  const sb = createClient();

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      const { error: err } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${refCode ? `?ref=${refCode}` : ""}`,
          shouldCreateUser: true,
        },
      });
      if (err) setError(err.message);
      else setSent(true);
    } catch (ex: any) {
      setError(ex?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const signInGoogle = async () => {
    setLoading(true);
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${refCode ? `?ref=${refCode}` : ""}`,
      },
    });
    if (err) { setError(err.message); setLoading(false); }
  };

  if (sent) return (
    <div style={{ textAlign:"center" }}>
      <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.2rem",color:"#edf0f7",marginBottom:8 }}>Check your email</h2>
      <p style={{ fontSize:"0.88rem",color:"rgba(237,240,247,0.55)",lineHeight:1.65,marginBottom:"1.5rem" }}>
        We sent a magic link to <strong style={{ color:"#edf0f7" }}>{email}</strong>.<br/>
        Click it to sign in — no password needed.
      </p>
      <button onClick={()=>{setSent(false);setEmail("");}} style={{ fontSize:"0.82rem",color:"rgba(237,240,247,0.4)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline" }}>
        Use a different email
      </button>
    </div>
  );

  return (
    <>
      <div style={{ textAlign:"center",marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.5rem",color:"#edf0f7",marginBottom:6 }}>
          Welcome to EasyBuilda
        </h1>
        <p style={{ fontSize:"0.88rem",color:"rgba(237,240,247,0.5)" }}>Sign in or create your account</p>
      </div>

      {error && (
        <div style={{ marginBottom:"1rem",padding:"10px 13px",borderRadius:10,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",fontSize:"0.82rem",color:"#f87171" }}>
          {error}
        </div>
      )}

      <button onClick={signInGoogle} disabled={loading} style={{ width:"100%",padding:"0.85rem",borderRadius:13,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(237,240,247,0.14)",color:"#edf0f7",fontWeight:600,fontSize:"0.92rem",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:"1.2rem",transition:"background 0.15s" }}
        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.09)")}
        onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:"1.2rem" }}>
        <div style={{ flex:1,height:"1px",background:"rgba(237,240,247,0.08)" }}/>
        <span style={{ fontSize:"0.78rem",color:"rgba(237,240,247,0.3)" }}>or use magic link</span>
        <div style={{ flex:1,height:"1px",background:"rgba(237,240,247,0.08)" }}/>
      </div>

      <form onSubmit={sendMagicLink}>
        <div style={{ position:"relative",marginBottom:"0.85rem" }}>
          <input
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="your@email.com" required autoFocus
            style={{ width:"100%",padding:"0.85rem 1rem",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(237,240,247,0.12)",borderRadius:13,color:"#edf0f7",fontSize:"0.92rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.15s" }}
            onFocus={e=>(e.target.style.borderColor="rgba(124,58,237,0.5)")}
            onBlur={e=>(e.target.style.borderColor="rgba(237,240,247,0.12)")}
          />
        </div>
        <button type="submit" disabled={loading||!email.trim()} style={{ width:"100%",padding:"0.9rem",borderRadius:13,background:loading||!email.trim()?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.92rem",cursor:loading||!email.trim()?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s" }}>
          {loading ? (
            <><div style={{ width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/> Sending…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Send magic link
            </>
          )}
        </button>
      </form>

      <p style={{ textAlign:"center",marginTop:"1.2rem",fontSize:"0.74rem",color:"rgba(237,240,247,0.3)",lineHeight:1.6 }}>
        By continuing you agree to our{" "}
        <a href="/terms" style={{ color:"rgba(237,240,247,0.5)",textDecoration:"none" }}>Terms</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color:"rgba(237,240,247,0.5)",textDecoration:"none" }}>Privacy Policy</a>.
      </p>
    </>
  );
}

export default function AuthPage() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight:"100vh",background:"#05070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1.5rem",backgroundImage:"radial-gradient(600px 500px at 60% 20%,rgba(124,58,237,0.1),transparent 65%)" }}>
        <a href="/" style={{ display:"inline-flex",alignItems:"center",gap:9,textDecoration:"none",marginBottom:"2.5rem" }}>
          <svg viewBox="0 0 1024 1024" width={28} height={28}>
            <defs><linearGradient id="lg" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="0.34" stopColor="#7c3aed"/><stop offset="0.68" stopColor="#2563eb"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
            <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#lg)"/>
          </svg>
          <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.05rem",color:"#edf0f7" }}>EasyBuilda</span>
        </a>
        <div style={{ width:"100%",maxWidth:400,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(237,240,247,0.08)",borderRadius:20,padding:"2rem" }}>
          <Suspense fallback={<div style={{ height:200 }}/>}>
            <AuthInner/>
          </Suspense>
        </div>
      </div>
    </>
  );
}
