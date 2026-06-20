"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";

export default function UpdatePasswordPage() {
  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [loading,  setLoading]    = useState(false);
  const [done,     setDone]       = useState(false);
  const [error,    setError]      = useState("");
  const [ready,    setReady]      = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash — just need a session
    createClient().auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)        { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)       { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) { setError(err.message); }
      else     { setDone(true); setTimeout(() => { window.location.href = "/dashboard"; }, 2500); }
    } catch (ex: any) {
      setError(ex?.message || "Failed to update password.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp{width:100%;padding:11px 13px;background:rgba(255,255,255,0.05);border:1px solid rgba(237,240,247,0.12);border-radius:11px;color:#edf0f7;font-size:0.9rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.55)}
        .inp::placeholder{color:rgba(237,240,247,0.25)}
      `}</style>
      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem" }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:20, padding:"2rem" }}>
            {done ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>✅</div>
                <h2 style={{ margin:"0 0 0.6rem", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.2rem", color:"#edf0f7" }}>Password updated!</h2>
                <p style={{ margin:0, fontSize:"0.84rem", color:"rgba(237,240,247,0.5)" }}>Redirecting to dashboard…</p>
              </div>
            ) : (
              <>
                <h2 style={{ margin:"0 0 0.5rem", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.2rem", color:"#edf0f7", textAlign:"center" }}>Set new password</h2>
                <p style={{ margin:"0 0 1.5rem", fontSize:"0.84rem", color:"rgba(237,240,247,0.5)", textAlign:"center" }}>Choose a strong password for your account.</p>
                {error && <div style={{ marginBottom:"1rem", padding:"9px 12px", borderRadius:9, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", fontSize:"0.82rem", color:"#f87171" }}>{error}</div>}
                <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                  <input className="inp" type="password" placeholder="New password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} required autoFocus/>
                  <input className="inp" type="password" placeholder="Confirm new password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
                  <button type="submit" disabled={loading||!ready} style={{ padding:"0.82rem", borderRadius:12, background:loading?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:4 }}>
                    {loading ? <><div style={{ width:15, height:15, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Updating…</> : "Update password →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}