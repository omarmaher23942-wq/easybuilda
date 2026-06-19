"use client";

import { use, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// ── Bank Details ────────────────────────────────────────────────
const BANK = {
  account_name:   "Omar Maher",
  account_number: "059102271777",
  iban:           "EG920046020100000059102271777",
  bank_name:      "Mashreq Bank Egypt",
  swift:          "MSHQEGCA",
  currency:       "USD",
};

const PLANS: Record<string, { name: string; price: number; color: string; features: string[] }> = {
  basic: {
    name: "Basic",
    price: 29,
    color: "#38bdf8",
    features: [
      "1 AI agent, always on",
      "Unlimited customer conversations",
      "Leads dashboard with PIN protection",
      "Custom name, tone & brand color",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 69,
    color: "#a78bfa",
    features: [
      "Everything in Basic",
      "2 AI agents",
      "Custom URL for your agent",
      "Image upload & visual AI analysis",
      "Advanced analytics",
      "Priority support",
    ],
  },
};

type Step = "overview" | "transfer" | "confirm" | "pending";

function Icon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "copy":    return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "upload":  return <svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
    case "trash":   return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case "clock":   return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "bank":    return <svg {...p}><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2L2 7h20L12 2z"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "back":    return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "check-c": return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    default:        return null;
  }
}

export default function PaymentPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = use(params);
  const cfg = PLANS[plan];

  const [step,       setStep]       = useState<Step>("overview");
  const [ref,        setRef]        = useState("");
  const [note,       setNote]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [token,      setToken]      = useState("");
  const [copied,     setCopied]     = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  if (!cfg) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#f87171", marginBottom: 12 }}>Invalid plan.</p>
        <a href="/pricing" style={{ color: "var(--color-stellar)", textDecoration: "none" }}>← Back to pricing</a>
      </div>
    </div>
  );

  const h   = cfg.color.replace("#", "");
  const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (f.size > 8 * 1024 * 1024)    { setError("File must be under 8MB."); return; }
    setError("");
    setScreenshot(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!ref.trim())   { setError("Please enter the transfer reference number."); return; }
    if (!screenshot)   { setError("Please upload your transfer receipt screenshot."); return; }
    setLoading(true); setError("");
    try {
      const b64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = ev => res((ev.target?.result as string).split(",")[1]);
        r.readAsDataURL(screenshot);
      });
      const resp = await fetch(`${API}/api/payments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan,
          paypal_txn:      ref.trim(),
          note:            note.trim() || undefined,
          screenshot_b64:  b64,
          screenshot_mime: screenshot.type,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.detail || "Submission failed. Please try again."); return; }
      setStep("pending");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  const STEPS = ["overview", "transfer", "confirm"] as const;
  const stepIdx = STEPS.indexOf(step as any);

  // ── PENDING ──────────────────────────────────────────────────
  if (step === "pending") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)", backgroundImage: `radial-gradient(600px 400px at 60% 0%,rgba(${rgb},0.08),transparent)`, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Icon name="check-c" size={36} color="#34d399" />
        </div>
        <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-starlight)" }}>Transfer submitted!</h2>
        <p style={{ margin: "0 0 28px", fontSize: "0.88rem", color: "var(--color-dust)", lineHeight: 1.75 }}>
          We've received your <strong style={{ color: cfg.color }}>{cfg.name}</strong> plan request. Our team will verify your transfer and activate your plan within <strong style={{ color: "var(--color-starlight)" }}>24 hours</strong>.
        </p>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.6rem", borderRadius: 12, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)`, color: cfg.color, fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
          Back to dashboard
        </a>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fi { width:100%; padding:11px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:11px; color:var(--color-starlight); font-size:0.88rem; font-family:var(--font-sans); outline:none; transition:border-color 0.2s; }
        .fi:focus { border-color:rgba(${rgb},0.5); }
        .fi::placeholder { color:rgba(255,255,255,0.2); }
        .copy-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; border:1px solid var(--line); background:rgba(255,255,255,0.04); cursor:pointer; font-size:0.72rem; color:var(--color-dust); font-family:var(--font-mono); transition:all 0.15s; white-space:nowrap; }
        .copy-btn:hover { border-color:rgba(${rgb},0.4); color:rgb(${rgb}); background:rgba(${rgb},0.08); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card { animation:fadeIn 0.25s ease both; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", backgroundImage: `radial-gradient(800px 400px at 60% 0%,rgba(${rgb},0.07),transparent 60%)`, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px" }}>

        {/* Back */}
        <div style={{ width: "100%", maxWidth: 520, marginBottom: 24 }}>
          <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-dust)", textDecoration: "none", fontSize: "0.82rem" }}>
            <Icon name="back" size={14} /> Back to pricing
          </a>
        </div>

        {/* Card */}
        <div className="card" style={{ width: "100%", maxWidth: 520, background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 24, overflow: "hidden" }}>

          {/* Plan header */}
          <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line)", background: `rgba(${rgb},0.05)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg,${cfg.color},#22d3ee)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px rgba(${rgb},0.3)`, flexShrink: 0 }}>
                <Icon name="shield" size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 2, letterSpacing: "0.1em" }}>UPGRADING TO</div>
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-starlight)" }}>{cfg.name} Plan</h1>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: cfg.color, lineHeight: 1 }}>${cfg.price}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", marginTop: 2 }}>/month · USD</div>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          {step !== "pending" && (
            <div style={{ padding: "18px 28px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {(["overview", "transfer", "confirm"] as const).map((s, i) => {
                  const done   = stepIdx > i;
                  const active = step === s;
                  const labels = ["Details", "Transfer", "Confirm"];
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${active || done ? cfg.color : "rgba(255,255,255,0.1)"}`, background: done ? cfg.color : active ? `rgba(${rgb},0.15)` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                          {done
                            ? <Icon name="check" size={13} color="#fff" />
                            : <span style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? cfg.color : "rgba(255,255,255,0.3)" }}>{i + 1}</span>
                          }
                        </div>
                        <span style={{ fontSize: "0.6rem", color: active ? cfg.color : done ? "var(--color-dust)" : "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{labels[i]}</span>
                      </div>
                      {i < 2 && (
                        <div style={{ flex: 1, height: 1.5, background: done ? cfg.color : "rgba(255,255,255,0.07)", margin: "0 8px 18px", transition: "background 0.4s" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ padding: "20px 28px 28px" }}>

            {/* ── STEP 1: Overview ── */}
            {step === "overview" && (
              <div>
                <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>What you get</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                  {cfg.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(${rgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="check" size={11} color={cfg.color} />
                      </div>
                      <span style={{ fontSize: "0.84rem", color: "var(--color-starlight)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 22, fontSize: "0.78rem", color: "var(--color-dust)", lineHeight: 1.7 }}>
                  💳 <strong style={{ color: "var(--color-starlight)" }}>Monthly billing</strong> — ${cfg.price}/month USD via international bank transfer. Plan activates within 24h after manual verification.
                </div>

                <button onClick={() => setStep("transfer")} style={{ width: "100%", padding: "0.85rem", borderRadius: 13, background: `linear-gradient(135deg,${cfg.color},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: `0 0 28px rgba(${rgb},0.3)`, fontFamily: "var(--font-sans)" }}>
                  Continue to payment →
                </button>
              </div>
            )}

            {/* ── STEP 2: Transfer ── */}
            {step === "transfer" && (
              <div>
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>Send via bank transfer</h2>
                <p style={{ margin: "0 0 20px", fontSize: "0.8rem", color: "var(--color-dust)" }}>
                  Transfer exactly <strong style={{ color: cfg.color }}>${cfg.price}.00 USD</strong> to the account below.
                </p>

                {/* Bank details card */}
                <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 16, padding: "18px", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(56,189,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="bank" size={18} color="#38bdf8" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-starlight)" }}>{BANK.bank_name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>SWIFT: {BANK.swift}</div>
                    </div>
                  </div>

                  {[
                    { label: "Account Name",   value: BANK.account_name,   key: "name",   copyable: true  },
                    { label: "Account Number", value: BANK.account_number, key: "acc",    copyable: true  },
                    { label: "IBAN",           value: BANK.iban,           key: "iban",   copyable: true  },
                    { label: "SWIFT / BIC",    value: BANK.swift,          key: "swift",  copyable: true  },
                    { label: "Currency",       value: BANK.currency,       key: "cur",    copyable: false },
                    { label: "Amount",         value: `$${cfg.price}.00`,  key: "amt",    copyable: false },
                  ].map(row => (
                    <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 2 }}>{row.label}</div>
                        <div style={{ fontSize: "0.82rem", color: "var(--color-starlight)", fontFamily: row.key !== "name" ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 600, wordBreak: "break-all" }}>{row.value}</div>
                      </div>
                      {row.copyable && (
                        <button className="copy-btn" onClick={() => copy(row.value, row.key)}>
                          {copied === row.key
                            ? <><Icon name="check" size={12} color="#34d399" /><span style={{ color: "#34d399" }}>Copied</span></>
                            : <><Icon name="copy" size={12} /><span>Copy</span></>
                          }
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ padding: "12px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, marginBottom: 22, fontSize: "0.78rem", color: "#fbbf24", lineHeight: 1.65 }}>
                  ⚠️ Send <strong>exactly ${cfg.price}.00 USD</strong> and keep your transfer receipt or screenshot — you'll need it in the next step.
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("overview")} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.88rem" }}>
                    Back
                  </button>
                  <button onClick={() => setStep("confirm")} style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: `linear-gradient(135deg,${cfg.color},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.88rem" }}>
                    I've sent the transfer →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm ── */}
            {step === "confirm" && (
              <div>
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-starlight)" }}>Confirm your transfer</h2>
                <p style={{ margin: "0 0 20px", fontSize: "0.8rem", color: "var(--color-dust)" }}>Upload your receipt and enter the reference number so we can verify your payment.</p>

                {/* Screenshot upload */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>TRANSFER RECEIPT *</label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                  {preview ? (
                    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                      <img src={preview} alt="Receipt" style={{ width: "100%", maxHeight: 200, objectFit: "contain", background: "rgba(0,0,0,0.3)", display: "block" }} />
                      <button type="button" onClick={e => { e.stopPropagation(); setScreenshot(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="trash" size={13} color="#f87171" />
                      </button>
                      <div style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 8px", borderRadius: 6, background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.3)", fontSize: "0.68rem", color: "#34d399" }}>
                        ✓ Receipt uploaded
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ width: "100%", padding: "28px 0", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "border-color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(${rgb},0.4)`)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
                      <Icon name="upload" size={28} color="var(--color-dust)" />
                      <span style={{ fontSize: "0.82rem", color: "var(--color-dust)" }}>Click to upload receipt</span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>PNG, JPG — max 8MB</span>
                    </button>
                  )}
                </div>

                {/* Reference number */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>TRANSFER REFERENCE NUMBER *</label>
                  <input className="fi" type="text" placeholder="e.g. TXN202506191234" value={ref} onChange={e => setRef(e.target.value)} />
                  <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>Found in your bank's transfer confirmation or receipt.</p>
                </div>

                {/* Note */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>NOTE (OPTIONAL)</label>
                  <textarea className="fi" rows={2} placeholder="Any additional info for our team…" value={note} onChange={e => setNote(e.target.value)} style={{ resize: "none" }} />
                </div>

                {error && (
                  <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.8rem", color: "#f87171" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("transfer")} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.88rem" }}>
                    Back
                  </button>
                  <button onClick={submit} disabled={loading || !ref.trim() || !screenshot}
                    style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: (loading || !ref.trim() || !screenshot) ? `rgba(${rgb},0.2)` : `linear-gradient(135deg,${cfg.color},#22d3ee)`, border: "none", color: "#fff", fontWeight: 700, cursor: (loading || !ref.trim() || !screenshot) ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", fontSize: "0.88rem", transition: "all 0.2s" }}>
                    {loading ? "Submitting…" : "Submit for review →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
          <Icon name="shield" size={13} color="rgba(255,255,255,0.2)" />
          Secure payment · Manual verification within 24h · 30-day billing cycle
        </div>
      </div>
    </>
  );
}