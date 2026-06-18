"use client";

import { use, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const PAYPAL_LINK = "https://paypal.me/Ahmedmaher1728399";
const PAYPAL_NAME = "paypal.me/Ahmedmaher1728399";

const PLANS: Record<string, { name: string; price: number; color: string; features: string[] }> = {
  basic: {
    name: "Basic",
    price: 29,
    color: "#38bdf8",
    features: ["1 AI agent", "Unlimited replies", "Private leads dashboard", "Custom name, tone & colors", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 69,
    color: "#a78bfa",
    features: ["Everything in Basic", "2 AI agents", "Custom URL slug", "Image upload in chat", "Analytics & insights", "Priority support"],
  },
};

function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "copy":    return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "upload":  return <svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
    case "image":   return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case "clock":   return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "trash":   return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
    case "back":    return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    default:        return null;
  }
}

type Step = "overview" | "send" | "confirm" | "pending";

export default function PaymentPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = use(params);
  const cfg = PLANS[plan];

  const [step,      setStep]      = useState<Step>("overview");
  const [txnId,     setTxnId]     = useState("");
  const [note,      setNote]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [token,     setToken]     = useState("");
  const [copied,    setCopied]    = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  if (!cfg) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#f87171" }}>Invalid plan.</p>
        <a href="/pricing" style={{ color: "var(--color-stellar)", textDecoration: "none", marginTop: 8, display: "block" }}>← Back to pricing</a>
      </div>
    </div>
  );

  const planColor = cfg.color;
  const h = planColor.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(PAYPAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please upload an image file (PNG, JPG, etc.)"); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Screenshot must be under 5MB."); return; }
    setScreenshot(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!txnId.trim()) { setError("Please enter your PayPal Transaction ID."); return; }
    if (!screenshot) { setError("Please upload a screenshot of your payment."); return; }
    setLoading(true);
    setError("");
    try {
      // Convert screenshot to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.readAsDataURL(screenshot);
      });

      const res = await fetch(`${API}/api/payments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan,
          paypal_txn: txnId.trim(),
          note,
          screenshot_b64: base64,
          screenshot_mime: screenshot.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Failed to submit. Please try again."); return; }
      setStep("pending");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .inp { width:100%; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:10px; color:var(--color-starlight); font-size:0.9rem; font-family:var(--font-mono); outline:none; transition:border-color 0.2s; }
        .inp:focus { border-color:rgba(${rgb},0.5); }
        .inp::placeholder { color:var(--color-dust); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeIn 0.25s ease both; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: `radial-gradient(800px 400px at 60% 0%,rgba(${rgb},0.07),transparent 60%)`, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px" }}>

        {/* Back */}
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
          <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-dust)", textDecoration: "none", fontSize: "0.82rem" }}>
            <Icon name="back" size={14} /> Back to pricing
          </a>
        </div>

        {/* Card */}
        <div className="card" style={{ width: "100%", maxWidth: 480, background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 24, overflow: "hidden" }}>

          {/* Plan header */}
          <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--line)", background: `rgba(${rgb},0.05)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${planColor},#22d3ee)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px rgba(${rgb},0.3)` }}>
                <Icon name="shield" size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>UPGRADING TO</div>
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-starlight)" }}>{cfg.name} Plan</h1>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: planColor }}>${cfg.price}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-dust)" }}>/month</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 28px" }}>

            {/* Steps indicator */}
            {step !== "pending" && (
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
                {(["overview", "send", "confirm"] as Step[]).map((s, i) => {
                  const done = ["send","confirm","pending"].indexOf(step) > ["overview","send","confirm"].indexOf(s);
                  const active = step === s;
                  const labels = ["Plan", "Pay", "Confirm"];
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${active || done ? planColor : "rgba(255,255,255,0.12)"}`, background: done ? planColor : active ? `rgba(${rgb},0.15)` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                          {done ? <Icon name="check" size={13} color="#fff" /> : <span style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? planColor : "var(--color-dust)" }}>{i + 1}</span>}
                        </div>
                        <span style={{ fontSize: "0.62rem", color: active ? planColor : done ? "var(--color-dust)" : "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>{labels[i]}</span>
                      </div>
                      {i < 2 && <div style={{ flex: 1, height: 2, background: done ? planColor : "rgba(255,255,255,0.08)", marginBottom: 20, transition: "background 0.3s", margin: "0 8px 20px" }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP: Overview */}
            {step === "overview" && (
              <div>
                <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>What you get</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {cfg.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(${rgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="check" size={11} color={planColor} />
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-starlight)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", marginBottom: 24, fontSize: "0.78rem", color: "var(--color-dust)", lineHeight: 1.6 }}>
                  💳 Monthly billing — ${cfg.price}/month. Cancel anytime. Your plan activates after manual payment review (usually within 24h).
                </div>

                <button onClick={() => setStep("send")} style={{ width: "100%", padding: "0.82rem", borderRadius: 12, background: `linear-gradient(135deg,${planColor},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: `0 0 28px rgba(${rgb},0.3)`, fontFamily: "var(--font-sans)" }}>
                  Continue to payment →
                </button>
              </div>
            )}

            {/* STEP: Send */}
            {step === "send" && (
              <div>
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>Send payment via PayPal</h2>
                <p style={{ margin: "0 0 20px", fontSize: "0.8rem", color: "var(--color-dust)" }}>Send exactly <strong style={{ color: planColor }}>${cfg.price}.00 USD</strong> to our PayPal.</p>

                {/* PayPal link */}
                <div style={{ background: "rgba(0,112,240,0.08)", border: "1px solid rgba(0,112,240,0.25)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(96,165,250,0.7)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>PAYPAL LINK</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <code style={{ flex: 1, fontSize: "0.88rem", color: "#60a5fa", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{PAYPAL_NAME}</code>
                    <button onClick={copyLink} style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(0,112,240,0.3)", background: copied ? "rgba(52,211,153,0.1)" : "rgba(0,112,240,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      <Icon name={copied ? "check" : "copy"} size={15} color={copied ? "#34d399" : "#60a5fa"} />
                    </button>
                  </div>
                  <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: "0.7rem", borderRadius: 10, background: "rgba(0,112,240,0.15)", border: "1px solid rgba(0,112,240,0.3)", color: "#60a5fa", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>
                    Open PayPal ↗
                  </a>
                </div>

                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: "0.78rem", color: "#fbbf24", lineHeight: 1.6 }}>
                  ⚠️ Send exactly <strong>${cfg.price}.00 USD</strong> and take a screenshot of the payment confirmation. You'll need it in the next step.
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("overview")} style={{ flex: 1, padding: "0.75rem", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Back
                  </button>
                  <button onClick={() => setStep("confirm")} style={{ flex: 2, padding: "0.75rem", borderRadius: 11, background: `linear-gradient(135deg,${planColor},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    I've sent the payment →
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Confirm */}
            {step === "confirm" && (
              <div>
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>Confirm your payment</h2>
                <p style={{ margin: "0 0 20px", fontSize: "0.8rem", color: "var(--color-dust)" }}>Upload your PayPal screenshot and transaction ID.</p>

                {/* Screenshot upload */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--color-dust)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>Payment Screenshot *</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

                  {screenshotPreview ? (
                    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                      <img src={screenshotPreview} alt="Payment screenshot" style={{ width: "100%", maxHeight: 200, objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />
                      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); setScreenshot(null); setScreenshotPreview(null); }} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="trash" size={13} color="#f87171" />
                        </button>
                      </div>
                      <div style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 8px", borderRadius: 6, background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.3)", fontSize: "0.68rem", color: "#34d399" }}>
                        ✓ Screenshot added
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "28px 0", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "2px dashed rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "border-color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(${rgb},0.4)`)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                      <Icon name="upload" size={28} color="var(--color-dust)" />
                      <span style={{ fontSize: "0.82rem", color: "var(--color-dust)" }}>Click to upload screenshot</span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>PNG, JPG up to 5MB</span>
                    </button>
                  )}
                </div>

                {/* Transaction ID */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--color-dust)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>PayPal Transaction ID *</label>
                  <input className="inp" type="text" placeholder="e.g. 5MC12345XY678901A" value={txnId} onChange={e => setTxnId(e.target.value)} />
                  <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>Found in: PayPal email → "Transaction ID" or PayPal app → Activity → tap transaction</p>
                </div>

                {/* Note */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--color-dust)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>Note (optional)</label>
                  <textarea className="inp" rows={2} placeholder="Any extra info for our team..." value={note} onChange={e => setNote(e.target.value)} style={{ resize: "none" }} />
                </div>

                {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.8rem", color: "#f87171" }}>{error}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("send")} style={{ flex: 1, padding: "0.75rem", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading || !txnId.trim() || !screenshot} style={{ flex: 2, padding: "0.75rem", borderRadius: 11, background: loading || !txnId.trim() || !screenshot ? "rgba(124,58,237,0.25)" : `linear-gradient(135deg,${planColor},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, cursor: loading || !txnId.trim() || !screenshot ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", transition: "all 0.2s" }}>
                    {loading ? "Submitting…" : "Submit for review →"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Pending */}
            {step === "pending" && (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Icon name="clock" size={32} color="#34d399" />
                </div>
                <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-starlight)" }}>Payment submitted!</h2>
                <p style={{ margin: "0 0 24px", fontSize: "0.85rem", color: "var(--color-dust)", lineHeight: 1.7, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                  We'll review your payment and activate your <strong style={{ color: planColor }}>{cfg.name}</strong> plan within 24 hours. You'll see it update in your dashboard.
                </p>
                <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.72rem 1.4rem", borderRadius: 12, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)`, color: planColor, fontWeight: 600, textDecoration: "none", fontSize: "0.88rem" }}>
                  Back to dashboard
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}