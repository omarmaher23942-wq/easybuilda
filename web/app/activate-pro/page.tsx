"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function ActivateProPage() {
  const [status,   setStatus]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [activating,setActivating] = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const [token,    setToken]    = useState("");

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      const tok = data.session.access_token;
      setToken(tok);
      fetch(`${API}/api/billing/status`, { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.json()).then(d => {
          setStatus(d);
          if (d.is_pro) { window.location.href = "/dashboard"; return; }
          if (!d.can_activate_pro) { window.location.href = "/wallet/topup"; return; }
        }).finally(() => setLoading(false));
    });
  }, []);

  const activate = async () => {
    setActivating(true); setError("");
    const res = await fetch(`${API}/api/billing/activate-pro`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { setDone(true); setTimeout(() => { window.location.href = "/dashboard"; }, 2000); }
    else { const d = await res.json(); setError(d.detail || "Failed"); }
    setActivating(false);
  };

  if (loading) return <div style={{ minHeight:"100vh",background:"#05070f",display:"flex",alignItems:"center",justifyContent:"center" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ width:32,height:32,borderRadius:"50%",border:"2px solid rgba(124,58,237,0.2)",borderTopColor:"#7c3aed",animation:"spin 0.75s linear infinite" }}/></div>;

  if (done) return (
    <div style={{ minHeight:"100vh",background:"#05070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:"2rem" }}>
      <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.8rem",color:"#edf0f7" }}>Pro activated!</h1>
      <p style={{ color:"rgba(237,240,247,0.55)",fontSize:"0.92rem" }}>Your agent is now live. Redirecting to dashboard…</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#05070f",color:"#edf0f7",fontFamily:"var(--font-sans,'Inter',sans-serif)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:"100%",maxWidth:440,animation:"fadeUp 0.35s ease both" }}>
        <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(237,240,247,0.08)",borderRadius:22,padding:"2.5rem 2rem" }}>
          <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"#7c3aed",marginBottom:12 }}>Activate Pro</p>
          <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.5rem",color:"#edf0f7",marginBottom:24 }}>You're one step away</h1>

          {/* Steps */}
          <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:28 }}>
            {[
              { n:1, label:"Add funds",    done:true,  sub: `$${status?.balance?.toFixed(2) ?? "0.00"} in wallet` },
              { n:2, label:"Activate Pro", done:false, sub: "$9.00 will be deducted now" },
              { n:3, label:"Agent goes live", done:false, sub: "Immediately after activation" },
            ].map(s => (
              <div key={s.n} style={{ display:"flex",alignItems:"center",gap:13 }}>
                <div style={{ width:32,height:32,borderRadius:"50%",background:s.done?"rgba(52,211,153,0.15)":s.n===2?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",border:`2px solid ${s.done?"rgba(52,211,153,0.5)":s.n===2?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {s.done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span style={{ fontSize:"0.78rem",fontWeight:700,color:s.n===2?"#a78bfa":"rgba(255,255,255,0.3)" }}>{s.n}</span>
                  )}
                </div>
                <div>
                  <p style={{ margin:0,fontSize:"0.9rem",fontWeight:600,color:s.done?"rgba(237,240,247,0.6)":s.n===2?"#edf0f7":"rgba(237,240,247,0.4)" }}>{s.label}</p>
                  <p style={{ margin:"2px 0 0",fontSize:"0.74rem",color:"rgba(237,240,247,0.38)" }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Balance display */}
          <div style={{ padding:"12px 16px",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:12,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:"0.84rem",color:"rgba(237,240,247,0.6)" }}>Your balance</span>
            <span style={{ fontSize:"1.1rem",fontWeight:700,color:"#34d399",fontFamily:"var(--font-mono,'JetBrains Mono',monospace)" }}>${status?.balance?.toFixed(2) ?? "0.00"}</span>
          </div>

          {error && <p style={{ color:"#f87171",fontSize:"0.82rem",marginBottom:14 }}>{error}</p>}

          <button onClick={activate} disabled={activating}
            style={{ width:"100%",padding:"13px",borderRadius:14,background:activating?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.95rem",cursor:activating?"not-allowed":"pointer",fontFamily:"var(--font-display,'Sora',sans-serif)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:activating?"none":"0 0 28px rgba(124,58,237,0.35)" }}>
            {activating ? (
              <><div style={{ width:18,height:18,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/> Activating…</>
            ) : "Activate Pro — $9.00 deducted"}
          </button>
          <p style={{ textAlign:"center",marginTop:10,fontSize:"0.74rem",color:"rgba(237,240,247,0.3)" }}>Billed monthly from your wallet. Cancel anytime.</p>

          <div style={{ marginTop:16,textAlign:"center" }}>
            <a href="/wallet/topup" style={{ fontSize:"0.8rem",color:"rgba(237,240,247,0.4)",textDecoration:"none" }}>Add more funds first →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
