"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Logo() {
  return (
    <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none" }}>
      <svg viewBox="0 0 1024 1024" width={28} height={28}>
        <defs><linearGradient id="logoG" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7"/><stop offset="0.34" stopColor="#7c3aed"/>
          <stop offset="0.68" stopColor="#2563eb"/><stop offset="1" stopColor="#22d3ee"/>
        </linearGradient></defs>
        <path d="M 320 232 L 428 232 L 428 792 L 320 792 Z M 320 232 L 692 232 L 670 319.36 L 320 336 Z M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z M 320 688 L 670 704.64 L 692 792 L 320 792 Z" fill="url(#logoG)"/>
      </svg>
      <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.05rem", color:"#edf0f7", letterSpacing:"-0.01em" }}>EasyBuilda</span>
    </a>
  );
}

function AuthInner() {
  const params  = useSearchParams();
  const refCode = params.get("ref") || "";
  const mode    = params.get("mode") || "";        // "ppl" = pay-per-lead
  const tmpl    = params.get("template") || "";    // marketplace template

  const [tab,      setTab]      = useState<"login"|"signup">(mode||tmpl ? "signup" : "login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const sb = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || password.length < 6) {
      setError("Please enter a valid email and password (min 6 chars).");
      return;
    }
    setLoading(true); setError("");
    try {
      const { data, error: err } = await sb.auth.signUp({
        email:    email.trim(),
        password,
        options:  { data: { full_name: name.trim() || undefined } },
      });
      if (err) { setError(err.message); setLoading(false); return; }

      // Apply referral code if present
      if (refCode && data.session?.access_token) {
        await fetch(`${API}/api/referral/use`, {
          method:  "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${data.session.access_token}` },
          body:    JSON.stringify({ code: refCode }),
        }).catch(() => {});
      }

      if (data.session) {
        // Logged in immediately — redirect
        const dest = tmpl ? "/build" : mode === "ppl" ? "/pricing" : "/build";
        window.location.href = dest;
      } else {
        setSuccess("Check your email to confirm your account, then come back and log in.");
        setTab("login");
      }
    } catch (ex: any) {
      setError(ex?.message || "Signup failed.");
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Email and password required."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.session) window.location.href = "/dashboard";
    } catch (ex: any) {
      setError(ex?.message || "Login failed.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options:  { redirectTo: `${window.location.origin}/auth/callback${refCode ? `?ref=${refCode}` : ""}` },
    });
    if (err) setError(err.message);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .auth-inp{width:100%;padding:11px 13px;background:rgba(255,255,255,0.05);border:1px solid rgba(237,240,247,0.12);border-radius:11px;color:#edf0f7;font-size:0.9rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .auth-inp:focus{border-color:rgba(124,58,237,0.55)}
        .auth-inp::placeholder{color:rgba(237,240,247,0.25)}
        .tab-btn{flex:1;padding:9px;border:none;background:transparent;cursor:pointer;font-size:0.86rem;font-family:inherit;transition:all 0.15s;border-bottom:2px solid transparent;color:rgba(237,240,247,0.45)}
        .tab-btn.on{color:#edf0f7;font-weight:600;border-bottom-color:#7c3aed}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"1.5rem", backgroundImage:"radial-gradient(700px 500px at 60% 20%,rgba(124,58,237,0.12),transparent 65%)" }}>

        <div style={{ width:"100%", maxWidth:420, animation:"fadeIn 0.35s ease both" }}>

          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:"2rem" }}><Logo/></div>

          {/* Referral banner */}
          {refCode && (
            <div style={{ marginBottom:"1.2rem", padding:"10px 14px", borderRadius:12, background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:"1.1rem" }}>🎁</span>
              <div>
                <p style={{ margin:0, fontSize:"0.82rem", fontWeight:600, color:"#34d399" }}>Referral bonus active!</p>
                <p style={{ margin:0, fontSize:"0.74rem", color:"rgba(237,240,247,0.6)" }}>Sign up now — you and your referrer both get $10 wallet credit.</p>
              </div>
            </div>
          )}

          {/* Template banner */}
          {tmpl && (
            <div style={{ marginBottom:"1.2rem", padding:"10px 14px", borderRadius:12, background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.25)", fontSize:"0.82rem", color:"#a78bfa" }}>
              🤖 Sign up to use your selected agent template
            </div>
          )}

          {/* Card */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:20, overflow:"hidden" }}>

            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(237,240,247,0.08)" }}>
              <button className={`tab-btn${tab==="login"?" on":""}`}  onClick={() => { setTab("login");  setError(""); }}>Log in</button>
              <button className={`tab-btn${tab==="signup"?" on":""}`} onClick={() => { setTab("signup"); setError(""); }}>Sign up free</button>
            </div>

            <div style={{ padding:"1.75rem" }}>
              {success && (
                <div style={{ marginBottom:"1rem", padding:"10px 13px", borderRadius:10, background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.25)", fontSize:"0.82rem", color:"#34d399", lineHeight:1.55 }}>
                  ✓ {success}
                </div>
              )}
              {error && (
                <div style={{ marginBottom:"1rem", padding:"10px 13px", borderRadius:10, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", fontSize:"0.82rem", color:"#f87171" }}>
                  {error}
                </div>
              )}

              <form onSubmit={tab==="signup" ? handleSignup : handleLogin} style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                {tab === "signup" && (
                  <div>
                    <label style={{ display:"block", fontSize:"0.72rem", color:"rgba(237,240,247,0.5)", marginBottom:"0.4rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Full name (optional)</label>
                    <input className="auth-inp" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/>
                  </div>
                )}
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", color:"rgba(237,240,247,0.5)", marginBottom:"0.4rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Email *</label>
                  <input className="auth-inp" type="email" placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", color:"rgba(237,240,247,0.5)", marginBottom:"0.4rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Password *</label>
                  <div style={{ position:"relative" }}>
                    <input className="auth-inp" type={showPw?"text":"password"} placeholder={tab==="signup"?"Min 6 characters":"Your password"} value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight:40 }}/>
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(237,240,247,0.35)", fontSize:13, padding:0 }}>
                      {showPw?"Hide":"Show"}
                    </button>
                  </div>
                </div>

                {tab === "login" && (
                  <div style={{ textAlign:"right" }}>
                    <a href="/auth/reset" style={{ fontSize:"0.76rem", color:"rgba(237,240,247,0.4)", textDecoration:"none" }}>Forgot password?</a>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width:"100%", padding:"0.82rem", borderRadius:12, background:loading?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.92rem", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:loading?"none":"0 0 24px rgba(124,58,237,0.35)", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {loading ? (
                    <><div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Please wait…</>
                  ) : tab === "signup" ? (
                    "Create my free account →"
                  ) : (
                    "Log in →"
                  )}
                </button>
              </form>

              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"1.1rem 0" }}>
                <div style={{ flex:1, height:1, background:"rgba(237,240,247,0.08)" }}/>
                <span style={{ fontSize:"0.74rem", color:"rgba(237,240,247,0.3)" }}>or</span>
                <div style={{ flex:1, height:1, background:"rgba(237,240,247,0.08)" }}/>
              </div>

              <button onClick={handleGoogle} style={{ width:"100%", padding:"0.8rem", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(237,240,247,0.12)", color:"#edf0f7", fontWeight:600, fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.05)")}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          {tab === "signup" && (
            <p style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.76rem", color:"rgba(237,240,247,0.35)", lineHeight:1.6 }}>
              By signing up you agree to our{" "}
              <a href="/terms" style={{ color:"rgba(237,240,247,0.5)", textDecoration:"none" }}>Terms</a>
              {" "}and{" "}
              <a href="/privacy" style={{ color:"rgba(237,240,247,0.5)", textDecoration:"none" }}>Privacy Policy</a>.
              <br/>3-day free trial · No credit card required.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#05070f" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.75s linear infinite" }}/>
      </div>
    }>
      <AuthInner/>
    </Suspense>
  );
}