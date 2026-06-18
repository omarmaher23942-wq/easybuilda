"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const PLAN_CONFIG: Record<string, { name: string; price: number; period: string; color: string; features: string[] }> = {
  basic: {
    name: "Basic",
    price: 29,
    period: "/month",
    color: "#38bdf8",
    features: ["1 AI agent", "Unlimited replies", "Private leads dashboard", "Custom name, tone & colors", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 69,
    period: "/month",
    color: "#a78bfa",
    features: ["Everything in Basic", "2 AI agents", "Custom URL slug", "Image upload in chat", "Analytics & insights", "Priority support"],
  },
};

function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "copy":    return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "paypal":  return <svg {...p}><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.65a.641.641 0 0 1 .634-.537h7.168c2.467 0 4.392.714 5.553 2.064.671.783 1.038 1.66 1.092 2.607"/><path d="M21.04 9.47c-.455 2.97-2.53 5.02-5.576 5.02h-1.66a.643.643 0 0 0-.634.541l-.809 5.13"/></svg>;
    case "clock":   return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "arrow":   return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case "info":    return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case "external":return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    default:        return null;
  }
}

type Step = "overview" | "send" | "confirm" | "pending";

export default function PaymentPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = use(params);
  const cfg = PLAN_CONFIG[plan];

  const [step,       setStep]       = useState<Step>("overview");
  const [txnId,      setTxnId]      = useState("");
  const [note,       setNote]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [token,      setToken]      = useState("");
  const [copied,     setCopied]     = useState(false);
  const [payConfig,  setPayConfig]  = useState<{ paypal_email: string; paypal_link: string } | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
    // Load PayPal config
    fetch(`${API}/api/payments/config`).then(r => r.json()).then(d => setPayConfig(d)).catch(() => {});
  }, []);

  if (!cfg) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f87171", fontSize: "1rem" }}>Invalid plan.</p>
          <a href="/pricing" style={{ color: "var(--color-stellar)", textDecoration: "none", marginTop: 8, display: "block" }}>← Back to pricing</a>
        </div>
      </div>
    );
  }

  const copyEmail = () => {
    if (payConfig?.paypal_email) {
      navigator.clipboard.writeText(payConfig.paypal_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!txnId.trim()) { setError("Please enter your PayPal transaction ID."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/payments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, paypal_txn: txnId.trim(), note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Failed to submit. Please try again."); return; }
      setStep("pending");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  const planColor = cfg.color;
  const h = planColor.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;

  return (
    <>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .step{animation:fadeIn 0.25s ease both}
        .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid var(--line-bright);border-radius:12px;padding:12px 16px;color:var(--color-starlight);font-family:var(--font-sans);font-size:0.95rem;outline:none;box-sizing:border-box;transition:border-color 0.15s}
        .inp:focus{border-color:rgba(${rgb},0.6)}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: `radial-gradient(800px 450px at 70% 10%,rgba(${rgb},0.1),transparent 65%)`, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/pricing" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-dust)", textDecoration: "none", fontSize: "0.82rem" }}>
            ← Back
          </a>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-starlight)" }}>
              Upgrade to {cfg.name}
            </p>
          </div>
          <div style={{ width: 60 }} />
        </header>

        {/* Steps indicator */}
        <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(["overview", "send", "confirm"] as Step[]).map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: step === s || (["send","confirm","pending"].indexOf(step) > ["overview","send","confirm"].indexOf(s))
                    ? `rgba(${rgb},0.9)` : "rgba(255,255,255,0.08)",
                  border: `1.5px solid ${step === s ? planColor : "rgba(255,255,255,0.12)"}`,
                  fontSize: "0.75rem", fontWeight: 700, color: "#fff",
                  transition: "all 0.3s",
                }}>
                  {["overview","send","confirm","pending"].indexOf(step) > i
                    ? <Icon name="check" size={14} color="#fff" />
                    : i + 1}
                </div>
                {i < 2 && <div style={{ width: 32, height: 1.5, background: ["send","confirm","pending"].indexOf(step) > i ? planColor : "rgba(255,255,255,0.12)", transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
          <div style={{ width: "100%", maxWidth: 520 }}>

            {/* ── STEP 1: Overview ─────────────────────────────── */}
            {step === "overview" && (
              <div className="step">
                <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>
                  {cfg.name} Plan
                </h1>
                <p style={{ margin: "0 0 24px", fontSize: "0.9rem", color: "var(--color-dust)" }}>
                  Review what's included, then proceed to payment.
                </p>

                {/* Plan card */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${rgb},0.3)`, borderRadius: 18, padding: "20px 22px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${planColor},transparent)` }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: planColor }}>{cfg.name}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "var(--color-starlight)" }}>${cfg.price}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-dust)" }}>{cfg.period}</span>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {cfg.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-starlight)" }}>
                        <span style={{ color: "#34d399", flexShrink: 0 }}><Icon name="check" size={16} color="#34d399" /></span>{f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How it works */}
                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
                  <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-dust)", textTransform: "uppercase", letterSpacing: "0.1em" }}>How it works</p>
                  {[
                    { icon: "paypal", text: "Send payment via PayPal to our account" },
                    { icon: "copy", text: "Copy the transaction ID from PayPal" },
                    { icon: "clock", text: "We verify and activate your plan within 2–4 hours" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-nebula)" }}>
                        <Icon name={item.icon} size={15} />
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-starlight)" }}>{item.text}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => setStep("send")} style={{ width: "100%", padding: "0.85rem", borderRadius: 13, background: `linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)`, border: "none", color: "#fff", fontWeight: 600, fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-sans)", boxShadow: "0 0 28px rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Continue to payment <Icon name="arrow" size={18} color="#fff" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Send Payment ──────────────────────────── */}
            {step === "send" && (
              <div className="step">
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>
                  Send ${cfg.price} via PayPal
                </h2>
                <p style={{ margin: "0 0 24px", fontSize: "0.88rem", color: "var(--color-dust)" }}>
                  Send exactly <strong style={{ color: "var(--color-starlight)" }}>${cfg.price}.00 USD</strong> to our PayPal account, then come back here.
                </p>

                {/* PayPal details */}
                <div style={{ background: "rgba(0,112,240,0.06)", border: "1px solid rgba(0,112,240,0.25)", borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
                  <p style={{ margin: "0 0 14px", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.1em" }}>PayPal account</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--color-starlight)" }}>
                      {payConfig?.paypal_email || "omarmaher23942@gmail.com"}
                    </div>
                    <button onClick={copyEmail} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? "#34d399" : "var(--color-dust)", transition: "all 0.2s", flexShrink: 0 }}>
                      <Icon name={copied ? "check" : "copy"} size={16} color={copied ? "#34d399" : undefined} />
                    </button>
                  </div>
                  {payConfig?.paypal_link && (
                    <a href={payConfig.paypal_link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "0.72rem", borderRadius: 11, background: "rgba(0,112,240,0.15)", border: "1px solid rgba(0,112,240,0.3)", color: "#60a5fa", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
                      Open PayPal.me <Icon name="external" size={15} color="#60a5fa" />
                    </a>
                  )}
                </div>

                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10 }}>
                  <span style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} color="#fbbf24" /></span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#fcd34d", lineHeight: 1.5 }}>
                    Send <strong>${cfg.price}.00 USD</strong> exactly. In the PayPal note, write: <strong>EasyBuilda {cfg.name}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("overview")} style={{ flex: 1, padding: "0.75rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.03)", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.9rem", fontFamily: "var(--font-sans)" }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep("confirm")} style={{ flex: 2, padding: "0.75rem", borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    I've sent the payment →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm TXN ───────────────────────────── */}
            {step === "confirm" && (
              <div className="step">
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-starlight)", letterSpacing: "-0.02em" }}>
                  Enter your transaction ID
                </h2>
                <p style={{ margin: "0 0 24px", fontSize: "0.88rem", color: "var(--color-dust)" }}>
                  Find the transaction ID in your PayPal email receipt or the PayPal app under Activity.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)", marginBottom: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    PayPal Transaction ID *
                  </label>
                  <input className="inp" type="text" placeholder="e.g. 5MC12345XY678901A" value={txnId} onChange={e => setTxnId(e.target.value)} />
                  <p style={{ margin: "6px 0 0", fontSize: "0.74rem", color: "var(--color-dust)" }}>
                    Found in: PayPal email → "Transaction ID" or PayPal app → Activity → tap transaction
                  </p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-starlight)", marginBottom: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Note (optional)
                  </label>
                  <textarea className="inp" rows={2} placeholder="Any additional info for our team…" value={note} onChange={e => setNote(e.target.value)} style={{ resize: "none" }} />
                </div>

                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.84rem", color: "#f87171", marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                  <span style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }}><Icon name="shield" size={16} color="#34d399" /></span>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#6ee7b7", lineHeight: 1.5 }}>
                    Your plan will be activated within 2–4 hours after verification. You'll receive a notification in your dashboard.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("send")} style={{ flex: 1, padding: "0.75rem", borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,0.03)", color: "var(--color-dust)", cursor: "pointer", fontSize: "0.9rem", fontFamily: "var(--font-sans)" }}>
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading || !txnId.trim()} style={{ flex: 2, padding: "0.75rem", borderRadius: 11, background: (!txnId.trim() || loading) ? "rgba(124,58,237,0.25)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: (!txnId.trim() || loading) ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
                    {loading ? "Submitting…" : "Submit request →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Pending ───────────────────────────────── */}
            {step === "pending" && (
              <div className="step" style={{ textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#34d399" }}>
                  <Icon name="check" size={36} color="#34d399" />
                </div>
                <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--color-starlight)" }}>
                  Request submitted!
                </h2>
                <p style={{ margin: "0 0 28px", fontSize: "0.92rem", color: "var(--color-dust)", lineHeight: 1.65, maxWidth: 380, marginInline: "auto" }}>
                  We received your {cfg.name} plan request. Our team will verify your PayPal payment and activate your plan within <strong style={{ color: "var(--color-starlight)" }}>2–4 hours</strong>.
                </p>
                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: "var(--color-nebula)" }}><Icon name="clock" size={16} /></span>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-starlight)" }}>You'll get a dashboard notification when approved</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "var(--color-nebula)" }}><Icon name="shield" size={16} /></span>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-starlight)" }}>If rejected, you'll know why and can try again</p>
                  </div>
                </div>
                <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.78rem 1.8rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", color: "#fff", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", fontFamily: "var(--font-sans)", boxShadow: "0 0 28px rgba(124,58,237,0.35)" }}>
                  Go to dashboard <Icon name="arrow" size={17} color="#fff" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}