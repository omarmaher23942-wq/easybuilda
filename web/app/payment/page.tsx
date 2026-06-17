"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const PAYPAL_LINK = "https://www.paypal.com/paypalme/Ahmedmaher1728399";
const PAYPAL_NAME = "Ahmed Maher Abdel Aziz Mahmoud Abdel Galil";
const SUPPORT = "omarmaher23942@gmail.com";

const PLANS = [
  { id:"basic",       name:"Basic",       price:49,  color:"#7c3aed", features:["1 AI Agent","Standard AI model","Unlimited replies","Email support"] },
  { id:"pro",         name:"Pro",         price:129, color:"#38bdf8", features:["2 AI Agents","Standard AI model","Custom subdomain","Analytics","Priority support"], popular:true },
  { id:"max",         name:"Max",         price:299, color:"#22d3ee", features:["3 AI Agents","Premium AI (Opus)","Custom domain","No branding","Dedicated onboarding"] },
  { id:"singularity", name:"Singularity", price:699, color:"#fbbf24", features:["3 AI Agents + Voice","Premium AI + Auto-Best","Full Website included","White-label","VIP support + SLA"] },
];

const C = { void:"#05070f", nebula:"#7c3aed", stellar:"#38bdf8", aurora:"#22d3ee", gold:"#fbbf24", green:"#34d399", red:"#f87171", starlight:"#edf0f7", dust:"#8891a8", line:"rgba(237,240,247,0.08)", lineBright:"rgba(237,240,247,0.14)" };
const FD = "var(--font-display,'Sora',sans-serif)";
const FS = "var(--font-sans,'Inter',sans-serif)";
const FM = "var(--font-mono,'JetBrains Mono',monospace)";

type Step = "plan" | "pay" | "confirm" | "done";

export default function PaymentPage() {
  const [step,       setStep]       = useState<Step>("plan");
  const [plan,       setPlan]       = useState(PLANS[1]);
  const [payerName,  setPayerName]  = useState("");
  const [paidAt,     setPaidAt]     = useState(new Date().toISOString().slice(0,10));
  const [note,       setNote]       = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [paymentId,  setPaymentId]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const sb = createClient();

  const handleFile = (f: File) => {
    setScreenshot(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!payerName.trim()) { setError("Please enter your PayPal name."); return; }
    if (!screenshot) { setError("Please upload a payment screenshot."); return; }
    setError(""); setLoading(true);
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const form = new FormData();
      form.append("plan", plan.id);
      form.append("payer_name", payerName.trim());
      form.append("paid_at", paidAt);
      form.append("amount", String(plan.price));
      form.append("note", note.trim());
      form.append("screenshot", screenshot);
      const res = await fetch(`${API}/api/payments/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed");
      setPaymentId(data.payment_id);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.void, color:C.starlight, fontFamily:FS }}>
      <style>{`*,*::before,*::after{box-sizing:border-box} input,select{color-scheme:dark}`}</style>

      {/* Header */}
      <header style={{ padding:"1rem 1.5rem", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:12, background:"rgba(5,7,15,.8)", backdropFilter:"blur(20px)" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#a855f7,#7c3aed 40%,#2563eb 72%,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FD, fontWeight:800, fontSize:13, color:"#fff" }}>E</div>
          <span style={{ fontFamily:FD, fontWeight:700, fontSize:"0.9rem", color:C.starlight }}>EasyBuilda</span>
        </a>
        <div style={{ flex:1 }}/>
        <a href="/dashboard" style={{ fontSize:"0.78rem", color:C.dust, textDecoration:"none" }}>← Dashboard</a>
      </header>

      <main style={{ maxWidth:700, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>

        {/* Progress */}
        <div style={{ display:"flex", gap:8, marginBottom:"2.5rem" }}>
          {(["plan","pay","confirm","done"] as Step[]).map((s, i) => (
            <div key={s} style={{ flex:1, height:3, borderRadius:99, background:["plan","pay","confirm","done"].indexOf(step) >= i ? `linear-gradient(90deg,#7c3aed,#22d3ee)` : "rgba(255,255,255,.08)", transition:"background .3s" }}/>
          ))}
        </div>

        {/* ── Step 1: Plan ── */}
        {step === "plan" && (
          <>
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
              <p style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.stellar, marginBottom:"0.8rem" }}>Choose your plan</p>
              <h1 style={{ fontFamily:FD, fontWeight:700, fontSize:"2rem", letterSpacing:"-0.025em", marginBottom:"0.5rem" }}>Upgrade EasyBuilda</h1>
              <p style={{ color:C.dust, fontSize:"0.9rem" }}>All plans billed monthly. Cancel anytime.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginBottom:"2rem" }}>
              {PLANS.map(p => (
                <button key={p.id} onClick={() => setPlan(p)} style={{
                  padding:"1.4rem", borderRadius:16, border:`2px solid ${plan.id===p.id?p.color:C.line}`,
                  background:plan.id===p.id?"rgba(255,255,255,.05)":"rgba(255,255,255,.02)",
                  cursor:"pointer", textAlign:"left", transition:"all .2s", position:"relative",
                }}>
                  {p.popular && <span style={{ position:"absolute", top:12, right:12, fontFamily:FM, fontSize:"0.58rem", textTransform:"uppercase", letterSpacing:"0.1em", background:"rgba(56,189,248,.12)", color:C.stellar, border:`1px solid rgba(56,189,248,.25)`, borderRadius:99, padding:"2px 8px" }}>Popular</span>}
                  <div style={{ fontFamily:FD, fontWeight:600, color:p.color, marginBottom:4 }}>{p.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:12 }}>
                    <span style={{ fontFamily:FD, fontWeight:700, fontSize:"1.8rem", letterSpacing:"-0.03em" }}>${p.price}</span>
                    <span style={{ fontSize:"0.8rem", color:C.dust }}>/mo</span>
                  </div>
                  {p.features.map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"center", gap:7, fontSize:"0.8rem", color:C.dust, marginBottom:5 }}>
                      <span style={{ color:C.green, fontSize:"0.75rem" }}>✓</span>{f}
                    </div>
                  ))}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("pay")} style={{ width:"100%", padding:"1rem", borderRadius:12, border:"none", background:`linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)`, color:"#fff", fontFamily:FD, fontWeight:600, fontSize:"1rem", cursor:"pointer" }}>
              Continue with {plan.name} — ${plan.price}/mo →
            </button>
          </>
        )}

        {/* ── Step 2: Pay ── */}
        {step === "pay" && (
          <>
            <button onClick={() => setStep("plan")} style={{ background:"none", border:"none", color:C.dust, cursor:"pointer", fontSize:"0.85rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:6, padding:0 }}>← Back</button>
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
              <p style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.stellar, marginBottom:"0.8rem" }}>Step 2 of 3</p>
              <h1 style={{ fontFamily:FD, fontWeight:700, fontSize:"1.8rem", letterSpacing:"-0.025em" }}>Send ${plan.price} on PayPal</h1>
            </div>

            {/* PayPal card */}
            <div style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${C.lineBright}`, borderRadius:20, padding:"1.75rem", marginBottom:"1.5rem", textAlign:"center" }}>
              <p style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.15em", color:C.dust, marginBottom:"0.75rem" }}>Send exactly</p>
              <div style={{ fontFamily:FD, fontWeight:700, fontSize:"3rem", color:plan.color, letterSpacing:"-0.04em", marginBottom:"0.5rem" }}>${plan.price}</div>
              <p style={{ color:C.dust, fontSize:"0.85rem", marginBottom:"1.25rem" }}>To the PayPal account below</p>
              <div style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:"1rem 1.25rem", marginBottom:"1rem" }}>
                <p style={{ fontFamily:FM, fontSize:"0.7rem", color:C.dust, marginBottom:4 }}>PayPal.me link</p>
                <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer" style={{ fontFamily:FD, fontWeight:600, fontSize:"1rem", color:C.stellar, textDecoration:"none" }}>paypal.me/Ahmedmaher1728399</a>
              </div>
              <div style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:"1rem 1.25rem" }}>
                <p style={{ fontFamily:FM, fontSize:"0.7rem", color:C.dust, marginBottom:4 }}>Account name</p>
                <p style={{ fontFamily:FD, fontWeight:600, fontSize:"0.95rem", color:C.starlight }}>{PAYPAL_NAME}</p>
              </div>
              <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"rgba(34,211,238,.06)", borderRadius:10, border:`1px solid rgba(34,211,238,.15)` }}>
                <p style={{ fontSize:"0.78rem", color:C.aurora }}>💡 Add note: <strong>EasyBuilda {plan.name}</strong></p>
              </div>
            </div>

            <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer" style={{ display:"block", padding:"1rem", borderRadius:12, background:"linear-gradient(135deg,#003087,#009cde)", color:"#fff", textDecoration:"none", textAlign:"center", fontFamily:FD, fontWeight:600, fontSize:"0.95rem", marginBottom:"1rem" }}>
              Open PayPal →
            </a>
            <button onClick={() => setStep("confirm")} style={{ width:"100%", padding:"0.9rem", borderRadius:12, border:`1px solid ${C.lineBright}`, background:"rgba(255,255,255,.04)", color:C.starlight, fontFamily:FD, fontWeight:600, fontSize:"0.9rem", cursor:"pointer" }}>
              I've sent the payment →
            </button>
          </>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "confirm" && (
          <>
            <button onClick={() => setStep("pay")} style={{ background:"none", border:"none", color:C.dust, cursor:"pointer", fontSize:"0.85rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:6, padding:0 }}>← Back</button>
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
              <p style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C.stellar, marginBottom:"0.8rem" }}>Step 3 of 3</p>
              <h1 style={{ fontFamily:FD, fontWeight:700, fontSize:"1.8rem", letterSpacing:"-0.025em" }}>Confirm your payment</h1>
              <p style={{ color:C.dust, fontSize:"0.9rem", marginTop:"0.5rem" }}>Upload screenshot + fill details so we can verify quickly.</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:"1.5rem" }}>
              {/* Screenshot upload */}
              <div>
                <label style={{ display:"block", fontFamily:FM, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:8 }}>Payment screenshot *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border:`2px dashed ${preview?C.green:C.lineBright}`, borderRadius:14, padding:"2rem", textAlign:"center", cursor:"pointer", background:"rgba(255,255,255,.02)", transition:"border-color .2s" }}
                >
                  {preview ? (
                    <img src={preview} alt="Screenshot" style={{ maxHeight:160, borderRadius:8, maxWidth:"100%" }}/>
                  ) : (
                    <>
                      <div style={{ fontSize:"2rem", marginBottom:8 }}>📸</div>
                      <p style={{ color:C.dust, fontSize:"0.85rem" }}>Click to upload screenshot</p>
                      <p style={{ color:`${C.dust}88`, fontSize:"0.75rem" }}>JPG, PNG, PDF — make sure date/time is visible</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
              </div>

              {/* Payer name */}
              <div>
                <label style={{ display:"block", fontFamily:FM, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:8 }}>Your name on PayPal *</label>
                <input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="e.g. Ahmed Hassan" style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:10, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.9rem", fontFamily:FS }}/>
              </div>

              {/* Date */}
              <div>
                <label style={{ display:"block", fontFamily:FM, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:8 }}>Payment date *</label>
                <input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:10, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.9rem", fontFamily:FS }}/>
              </div>

              {/* Note */}
              <div>
                <label style={{ display:"block", fontFamily:FM, fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:C.dust, marginBottom:8 }}>Transaction ID or notes (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="PayPal transaction ID..." style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:10, background:"rgba(255,255,255,.05)", border:`1px solid ${C.lineBright}`, color:C.starlight, fontSize:"0.9rem", fontFamily:FS }}/>
              </div>
            </div>

            {error && <div style={{ padding:"0.75rem 1rem", borderRadius:10, background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", color:C.red, fontSize:"0.85rem", marginBottom:"1rem" }}>{error}</div>}

            <button onClick={submit} disabled={loading} style={{ width:"100%", padding:"1rem", borderRadius:12, border:"none", background:loading?"rgba(124,58,237,.4)":"linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)", color:"#fff", fontFamily:FD, fontWeight:600, fontSize:"1rem", cursor:loading?"not-allowed":"pointer" }}>
              {loading ? "Submitting..." : `Submit — ${plan.name} $${plan.price}/mo`}
            </button>
          </>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && (
          <div style={{ textAlign:"center", padding:"3rem 0" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,.4),rgba(34,211,238,.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem", margin:"0 auto 1.5rem", boxShadow:"0 0 40px rgba(52,211,153,.3)" }}>✓</div>
            <h1 style={{ fontFamily:FD, fontWeight:700, fontSize:"1.8rem", marginBottom:"0.75rem" }}>Payment submitted!</h1>
            <p style={{ color:C.dust, fontSize:"0.9rem", lineHeight:1.7, marginBottom:"0.75rem" }}>
              We received your <strong style={{ color:C.starlight }}>{plan.name}</strong> payment request.<br/>
              Your account will be upgraded within <strong style={{ color:C.green }}>30 minutes</strong>.
            </p>
            <p style={{ color:C.dust, fontSize:"0.82rem", marginBottom:"2rem" }}>
              Questions? <a href={`mailto:${SUPPORT}`} style={{ color:C.stellar }}>{SUPPORT}</a>
            </p>
            <div style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${C.lineBright}`, borderRadius:14, padding:"1rem 1.5rem", marginBottom:"2rem", display:"inline-block" }}>
              <p style={{ fontFamily:FM, fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.12em", color:C.dust, marginBottom:4 }}>Payment ID</p>
              <p style={{ fontFamily:FM, fontSize:"0.82rem", color:C.starlight }}>{paymentId}</p>
            </div>
            <br/>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"0.9rem 2rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", textDecoration:"none", fontFamily:FD, fontWeight:600 }}>
              Go to dashboard →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}