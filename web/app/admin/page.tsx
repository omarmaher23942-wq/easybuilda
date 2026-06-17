"use client";
import { useState, useEffect, useCallback } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

interface Payment {
  id: string; user_id: string; plan: string; amount: number;
  payer_name: string; paid_at: string; note: string; status: string;
  screenshot_url?: string; created_at: string;
}

const C = { void:"#05070f", nebula:"#7c3aed", stellar:"#38bdf8", aurora:"#22d3ee", gold:"#fbbf24", green:"#34d399", red:"#f87171", starlight:"#edf0f7", dust:"#8891a8", line:"rgba(237,240,247,0.08)", lineBright:"rgba(237,240,247,0.14)" };
const FD = "var(--font-display,'Sora',sans-serif)";
const FS = "var(--font-sans,'Inter',sans-serif)";
const FM = "var(--font-mono,'JetBrains Mono',monospace)";

function planColor(plan: string) {
  if (plan==="basic") return C.nebula;
  if (plan==="pro") return C.stellar;
  if (plan==="max") return C.aurora;
  if (plan==="singularity") return C.gold;
  return C.dust;
}

export default function AdminPage() {
  const [secret,    setSecret]    = useState("");
  const [authed,    setAuthed]    = useState(false);
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState<Payment | null>(null);
  const [apiKey,    setApiKey]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [acting,    setActing]    = useState(false);
  const [msg,       setMsg]       = useState("");

  const headers = { "Content-Type":"application/json", "x-admin-secret": secret };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/payments`, { headers: { "x-admin-secret": secret } });
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } finally { setLoading(false); }
  }, [secret]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const approve = async () => {
    if (!selected) return;
    setActing(true); setMsg("");
    try {
      const res = await fetch(`${API}/api/admin/payments/${selected.id}/approve`, {
        method:"POST", headers,
        body: JSON.stringify({ openrouter_key: apiKey.trim(), notes: notes.trim() }),
      });
      const d = await res.json();
      if (res.ok) { setMsg("✓ Payment approved! Plan upgraded."); setSelected(null); setApiKey(""); setNotes(""); load(); }
      else setMsg(`Error: ${d.detail}`);
    } finally { setActing(false); }
  };

  const reject = async () => {
    if (!selected || !confirm("Reject this payment?")) return;
    setActing(true); setMsg("");
    try {
      const res = await fetch(`${API}/api/admin/payments/${selected.id}/reject`, { method:"POST", headers });
      if (res.ok) { setMsg("Payment rejected."); setSelected(null); load(); }
    } finally { setActing(false); }
  };

  if (!authed) return (
    <div style={{ minHeight:"100vh", background:C.void, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${C.lineBright}`, borderRadius:20, padding:"2.5rem", width:"100%", maxWidth:380, textAlign:"center" }}>
        <div style={{ fontFamily:FD, fontWeight:700, fontSize:"1.4rem", color:C.starlight, marginBottom:"0.5rem" }}>Admin Access</div>
        <p style={{ color:C.dust, fontSize:"0.85rem", marginBottom:"1.5rem" }}>Enter your admin secret key</p>
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key==="Enter" && setAuthed(true)} placeholder="Admin secret..." style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:10, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.9rem", fontFamily:FS, marginBottom:12 }}/>
        <button onClick={() => setAuthed(true)} style={{ width:"100%", padding:"0.85rem", borderRadius:10, border:"none", background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", fontFamily:FD, fontWeight:600, fontSize:"0.9rem", cursor:"pointer" }}>
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.void, color:C.starlight, fontFamily:FS }}>
      <style>{`*,*::before,*::after{box-sizing:border-box}`}</style>

      {/* Header */}
      <header style={{ padding:"1rem 1.5rem", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:12, background:"rgba(5,7,15,.85)", backdropFilter:"blur(20px)" }}>
        <div style={{ fontFamily:FD, fontWeight:700, fontSize:"1rem", color:C.starlight }}>EasyBuilda Admin</div>
        <div style={{ flex:1 }}/>
        <button onClick={load} style={{ padding:"0.5rem 1rem", borderRadius:8, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, cursor:"pointer", fontSize:"0.8rem" }}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
        <a href="/dashboard" style={{ fontSize:"0.78rem", color:C.dust, textDecoration:"none" }}>← Exit</a>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"2rem 1.5rem" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:"2rem" }}>
          {[
            { label:"Pending", val:payments.filter(p=>p.status==="pending").length, color:C.gold },
            { label:"Total",   val:payments.length, color:C.stellar },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${C.line}`, borderRadius:14, padding:"1.25rem 1.5rem" }}>
              <p style={{ fontFamily:FM, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.12em", color:C.dust, marginBottom:4 }}>{s.label}</p>
              <p style={{ fontFamily:FD, fontWeight:700, fontSize:"2rem", color:s.color, letterSpacing:"-0.03em" }}>{s.val}</p>
            </div>
          ))}
        </div>

        {msg && <div style={{ padding:"0.75rem 1rem", borderRadius:10, background:msg.startsWith("✓")?"rgba(52,211,153,.08)":"rgba(248,113,113,.08)", border:`1px solid ${msg.startsWith("✓")?"rgba(52,211,153,.25)":"rgba(248,113,113,.25)"}`, color:msg.startsWith("✓")?C.green:C.red, fontSize:"0.85rem", marginBottom:"1rem" }}>{msg}</div>}

        {/* Payments list */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {payments.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"4rem", color:C.dust }}>No pending payments 🎉</div>
          )}
          {payments.map(p => (
            <div key={p.id} style={{
              background:selected?.id===p.id?"rgba(124,58,237,.08)":"rgba(255,255,255,.03)",
              border:`1px solid ${selected?.id===p.id?"rgba(124,58,237,.4)":C.lineBright}`,
              borderRadius:16, padding:"1.25rem 1.5rem",
              cursor:"pointer", transition:"all .2s",
            }} onClick={() => setSelected(selected?.id===p.id?null:p)}>
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:12, marginBottom:selected?.id===p.id?16:0 }}>
                {/* Plan badge */}
                <span style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.1em", color:planColor(p.plan), background:`rgba(${p.plan==="basic"?"124,58,237":p.plan==="pro"?"56,189,248":p.plan==="max"?"34,211,238":"251,191,36"},.1)`, border:`1px solid ${planColor(p.plan)}44`, borderRadius:99, padding:"2px 10px" }}>
                  {p.plan}
                </span>
                <span style={{ fontFamily:FD, fontWeight:600, fontSize:"0.9rem" }}>{p.payer_name}</span>
                <span style={{ fontFamily:FD, fontWeight:700, fontSize:"1.1rem", color:planColor(p.plan) }}>${p.amount}</span>
                <span style={{ fontSize:"0.78rem", color:C.dust }}>{p.paid_at}</span>
                <span style={{ flex:1 }}/>
                <span style={{ fontFamily:FM, fontSize:"0.65rem", color:p.status==="pending"?C.gold:p.status==="completed"?C.green:C.red, textTransform:"uppercase", letterSpacing:"0.1em" }}>{p.status}</span>
              </div>

              {/* Expanded */}
              {selected?.id===p.id && (
                <div style={{ borderTop:`1px solid ${C.line}`, paddingTop:16 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                    {/* Screenshot */}
                    <div>
                      <p style={{ fontFamily:FM, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:6 }}>Screenshot</p>
                      {p.screenshot_url ? (
                        <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer">
                          <img src={p.screenshot_url} alt="Payment" style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:8, border:`1px solid ${C.lineBright}` }}/>
                        </a>
                      ) : <div style={{ height:100, borderRadius:8, background:"rgba(255,255,255,.03)", display:"flex", alignItems:"center", justifyContent:"center", color:C.dust, fontSize:"0.8rem" }}>No screenshot</div>}
                    </div>
                    {/* Details */}
                    <div>
                      <p style={{ fontFamily:FM, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:6 }}>Details</p>
                      <div style={{ fontSize:"0.8rem", color:C.dust, lineHeight:2 }}>
                        <div>User: <span style={{ color:C.starlight, fontFamily:FM, fontSize:"0.72rem" }}>{p.user_id.slice(0,16)}...</span></div>
                        <div>Submitted: <span style={{ color:C.starlight }}>{new Date(p.created_at).toLocaleString()}</span></div>
                        {p.note && <div>Note: <span style={{ color:C.starlight }}>{p.note}</span></div>}
                      </div>
                    </div>
                  </div>

                  {p.status === "pending" && (
                    <>
                      {/* API Key */}
                      <div style={{ marginBottom:12 }}>
                        <label style={{ display:"block", fontFamily:FM, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:6 }}>OpenRouter API Key for this user (optional)</label>
                        <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-or-v1-..." style={{ width:"100%", padding:"0.65rem 0.9rem", borderRadius:8, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.82rem", fontFamily:FM }}/>
                      </div>
                      {/* Notes */}
                      <div style={{ marginBottom:16 }}>
                        <label style={{ display:"block", fontFamily:FM, fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:6 }}>Admin notes (optional)</label>
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." style={{ width:"100%", padding:"0.65rem 0.9rem", borderRadius:8, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.82rem", fontFamily:FS }}/>
                      </div>
                      {/* Actions */}
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={approve} disabled={acting} style={{ flex:2, padding:"0.75rem", borderRadius:10, border:"none", background:acting?"rgba(52,211,153,.3)":"linear-gradient(135deg,#059669,#34d399)", color:"#fff", fontFamily:FD, fontWeight:600, fontSize:"0.88rem", cursor:acting?"not-allowed":"pointer" }}>
                          {acting ? "Processing..." : `✓ Approve — Upgrade to ${p.plan}`}
                        </button>
                        <button onClick={reject} disabled={acting} style={{ flex:1, padding:"0.75rem", borderRadius:10, border:`1px solid rgba(248,113,113,.25)`, background:"rgba(248,113,113,.06)", color:C.red, fontFamily:FD, fontWeight:600, fontSize:"0.88rem", cursor:acting?"not-allowed":"pointer" }}>
                          ✗ Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}