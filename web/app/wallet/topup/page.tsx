"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/auth";
import { useSearchParams } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const BANK = {
  account_name:   "Omar Maher",
  account_number: "059102271777",
  iban:           "EG920046020100000059102271777",
  bank_name:      "Mashreq Bank Egypt",
  swift:          "MSHQEGCA",
  currency:       "USD",
};
const PAYPAL = {
  link:  "https://paypal.me/Ahmedmaher1728399",
  email: "ahmedmaher7720@gmail.com",
};
const PRESETS = [20, 50, 100, 200];

function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "back":    return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "copy":    return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "upload":  return <svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
    case "trash":   return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case "bank":    return <svg {...p}><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2L2 7h20L12 2z"/></svg>;
    case "paypal":  return <svg {...p}><path d="M7 11l5-8h4a4 4 0 0 1 0 8H7z"/><path d="M5 17l5-8h4a4 4 0 0 1 0 8H5z"/></svg>;
    case "check-c": return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default:        return null;
  }
}

type Step = "amount" | "method" | "transfer" | "confirm" | "done";
type Method = "bank" | "paypal";

export default function WalletTopupPage() {
  const searchParams  = useSearchParams();
  const presetAmount  = searchParams.get("amount");

  const [step,       setStep]       = useState<Step>("amount");
  const [amount,     setAmount]     = useState(presetAmount ? Number(presetAmount) : 50);
  const [customAmt,  setCustomAmt]  = useState(presetAmount || "");
  const [method,     setMethod]     = useState<Method>("bank");
  const [ref,        setRef]        = useState("");
  const [note,       setNote]       = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [token,      setToken]      = useState("");
  const [copied,     setCopied]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: d }) => {
      if (!d.session) { window.location.href = "/auth/login"; return; }
      setToken(d.session.access_token);
    });
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (f.size > 8 * 1024 * 1024)    { setError("File must be under 8MB."); return; }
    setError(""); setScreenshot(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const finalAmount = customAmt ? Number(customAmt) : amount;

  const submit = async () => {
    if (!ref.trim())    { setError("Please enter the reference/transaction number."); return; }
    if (!screenshot)    { setError("Please upload your transfer screenshot."); return; }
    if (finalAmount < 5){ setError("Minimum top-up is $5."); return; }
    setLoading(true); setError("");
    try {
      const b64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = ev => res((ev.target?.result as string).split(",")[1]);
        r.readAsDataURL(screenshot);
      });
      const resp = await fetch(`${API}/api/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount:         finalAmount,
          payment_method: method,
          paypal_txn:     ref.trim(),
          note:           note.trim() || undefined,
          screenshot_b64: b64,
          screenshot_mime: screenshot.type,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.detail || "Submission failed. Please try again."); return; }
      setStep("done");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  const STEPS: Step[] = ["amount", "method", "transfer", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  // ── DONE ──
  if (step === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Ic name="check-c" size={36} color="#34d399" />
        </div>
        <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-starlight)" }}>Top-up submitted!</h2>
        <p style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "var(--color-dust)", lineHeight: 1.75 }}>
          We received your <strong style={{ color: "#34d399" }}>${finalAmount.toFixed(0)}</strong> top-up request. Our team will verify and credit your wallet within <strong style={{ color: "var(--color-starlight)" }}>24 hours</strong>.
        </p>
        <p style={{ margin: "0 0 28px", fontSize: "0.8rem", color: "var(--color-dust)" }}>You'll get a notification as soon as it's approved.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a href="/wallet" style={{ padding: "0.7rem 1.4rem", borderRadius: 12, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem" }}>
            View wallet
          </a>
          <a href="/dashboard" style={{ padding: "0.7rem 1.4rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-starlight)", fontWeight: 600, textDecoration: "none", fontSize: "0.88rem" }}>
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .fi{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:11px;color:var(--color-starlight);font-size:0.88rem;font-family:var(--font-sans);outline:none;transition:border-color 0.2s}
        .fi:focus{border-color:rgba(124,58,237,0.5)}
        .fi::placeholder{color:rgba(255,255,255,0.2)}
        .copy-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;border:1px solid var(--line);background:rgba(255,255,255,0.03);cursor:pointer;font-size:0.7rem;color:var(--color-dust);font-family:var(--font-mono);transition:all 0.15s;white-space:nowrap}
        .copy-btn:hover{border-color:rgba(124,58,237,0.4);color:#a78bfa;background:rgba(124,58,237,0.08)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-void)", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 64px" }}>

        {/* Back */}
        <div style={{ width: "100%", maxWidth: 520, marginBottom: 20 }}>
          <a href="/wallet" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-dust)", textDecoration: "none", fontSize: "0.82rem" }}>
            <Ic name="back" size={14} /> Wallet
          </a>
        </div>

        <div style={{ width: "100%", maxWidth: 520, background: "rgba(255,255,255,0.025)", border: "1px solid var(--line)", borderRadius: 24, overflow: "hidden", animation: "fadeIn 0.25s ease both" }}>

          {/* Header */}
          <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line)", background: "rgba(124,58,237,0.05)" }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-starlight)" }}>Add funds to wallet</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-dust)" }}>Funds are credited after manual verification (within 24h)</p>
          </div>

          {/* Step bar */}
          <div style={{ padding: "16px 28px 0" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {(["amount","method","transfer","confirm"] as const).map((s, i) => {
                const done   = stepIdx > i;
                const active = step === s;
                const labels = ["Amount","Method","Transfer","Confirm"];
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${active || done ? "#7c3aed" : "rgba(255,255,255,0.1)"}`, background: done ? "#7c3aed" : active ? "rgba(124,58,237,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                        {done ? <Ic name="check" size={12} color="#fff" /> : <span style={{ fontSize: "0.6rem", fontWeight: 700, color: active ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>{i+1}</span>}
                      </div>
                      <span style={{ fontSize: "0.58rem", color: active ? "#a78bfa" : "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>{labels[i]}</span>
                    </div>
                    {i < 3 && <div style={{ flex: 1, height: 1.5, background: done ? "#7c3aed" : "rgba(255,255,255,0.07)", margin: "0 6px 14px", transition: "background 0.4s" }} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "20px 28px 28px" }}>

            {/* ── STEP 1: Amount ── */}
            {step === "amount" && (
              <div>
                <p style={{ margin: "0 0 18px", fontSize: "0.82rem", color: "var(--color-dust)" }}>Choose how much to add to your wallet.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {PRESETS.map(p => (
                    <button key={p} onClick={() => { setAmount(p); setCustomAmt(""); }} style={{ padding: "14px", borderRadius: 12, border: `1px solid ${amount === p && !customAmt ? "rgba(124,58,237,0.6)" : "var(--line)"}`, background: amount === p && !customAmt ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-starlight)", transition: "all 0.15s" }}>
                      ${p}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <input className="fi" type="number" placeholder="Custom amount (minimum $5)" value={customAmt} onChange={e => { setCustomAmt(e.target.value); setAmount(0); }} min={5} />
                </div>
                <button onClick={() => { if (finalAmount >= 5) setStep("method"); else setError("Minimum $5."); }} style={{ width: "100%", padding: "0.85rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  Add ${finalAmount.toFixed(0)} →
                </button>
                {error && <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#f87171", textAlign: "center" }}>{error}</p>}
              </div>
            )}

            {/* ── STEP 2: Method ── */}
            {step === "method" && (
              <div>
                <p style={{ margin: "0 0 18px", fontSize: "0.82rem", color: "var(--color-dust)" }}>Choose how you'll send <strong style={{ color: "var(--color-starlight)" }}>${finalAmount.toFixed(0)}</strong>.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {([
                    { id: "bank", icon: "bank", label: "Bank Transfer", sub: "Mashreq Bank Egypt — recommended", color: "#38bdf8" },
                    { id: "paypal", icon: "paypal", label: "PayPal", sub: "paypal.me/Ahmedmaher1728399", color: "#a78bfa" },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{ padding: "16px 18px", borderRadius: 14, border: `1px solid ${method === m.id ? `rgba(${m.color === "#38bdf8" ? "56,189,248" : "167,139,250"},0.5)` : "var(--line)"}`, background: method === m.id ? `rgba(${m.color === "#38bdf8" ? "56,189,248" : "167,139,250"},0.07)` : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${m.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic name={m.icon} size={20} color={m.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-starlight)" }}>{m.label}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-dust)" }}>{m.sub}</div>
                      </div>
                      {method === m.id && <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name="check" size={11} color="#fff" /></div>}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("amount")} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Back</button>
                  <button onClick={() => setStep("transfer")} style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Transfer details ── */}
            {step === "transfer" && (
              <div>
                <p style={{ margin: "0 0 18px", fontSize: "0.82rem", color: "var(--color-dust)" }}>
                  Send exactly <strong style={{ color: method === "bank" ? "#38bdf8" : "#a78bfa" }}>${finalAmount.toFixed(2)} USD</strong> using the details below.
                </p>

                {method === "bank" ? (
                  <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(56,189,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic name="bank" size={18} color="#38bdf8" />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-starlight)" }}>{BANK.bank_name}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>SWIFT: {BANK.swift}</div>
                      </div>
                    </div>
                    {[
                      { label: "Account Name",   value: BANK.account_name,   key: "name" },
                      { label: "Account Number", value: BANK.account_number, key: "acc"  },
                      { label: "IBAN",           value: BANK.iban,           key: "iban" },
                      { label: "Amount",         value: `$${finalAmount.toFixed(2)} USD`, key: "amt" },
                    ].map(row => (
                      <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <div style={{ fontSize: "0.62rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{row.label}</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--color-starlight)", fontFamily: row.key !== "name" ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 600, wordBreak: "break-all" }}>{row.value}</div>
                        </div>
                        <button className="copy-btn" onClick={() => copy(row.value, row.key)}>
                          {copied === row.key ? <><Ic name="check" size={11} color="#34d399" /><span style={{ color: "#34d399" }}>Copied</span></> : <><Ic name="copy" size={11} />Copy</>}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic name="paypal" size={18} color="#a78bfa" />
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-starlight)" }}>PayPal</div>
                    </div>
                    {[
                      { label: "PayPal Link",  value: PAYPAL.link,  key: "link" },
                      { label: "PayPal Email", value: PAYPAL.email, key: "email" },
                      { label: "Amount",       value: `$${finalAmount.toFixed(2)} USD`, key: "pamount" },
                    ].map(row => (
                      <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <div style={{ fontSize: "0.62rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{row.label}</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--color-starlight)", fontFamily: "var(--font-mono)", fontWeight: 600, wordBreak: "break-all" }}>{row.value}</div>
                        </div>
                        <button className="copy-btn" onClick={() => copy(row.value, row.key)}>
                          {copied === row.key ? <><Ic name="check" size={11} color="#34d399" /><span style={{ color: "#34d399" }}>Copied</span></> : <><Ic name="copy" size={11} />Copy</>}
                        </button>
                      </div>
                    ))}
                    <a href={PAYPAL.link} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14, display: "inline-flex", padding: "8px 16px", borderRadius: 10, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
                      Open PayPal →
                    </a>
                  </div>
                )}

                <div style={{ padding: "10px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 10, marginBottom: 18, fontSize: "0.76rem", color: "#fbbf24" }}>
                  ⚠️ Keep your receipt — you'll need it in the next step.
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("method")} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Back</button>
                  <button onClick={() => setStep("confirm")} style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    I've sent it →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Confirm ── */}
            {step === "confirm" && (
              <div>
                <p style={{ margin: "0 0 18px", fontSize: "0.82rem", color: "var(--color-dust)" }}>Upload your receipt and reference number so we can verify.</p>

                {/* Screenshot */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>PAYMENT RECEIPT *</label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {preview ? (
                    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                      <img src={preview} alt="Receipt" style={{ width: "100%", maxHeight: 200, objectFit: "contain", background: "rgba(0,0,0,0.3)", display: "block" }} />
                      <button type="button" onClick={e => { e.stopPropagation(); setScreenshot(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic name="trash" size={13} color="#f87171" />
                      </button>
                      <div style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 8px", borderRadius: 6, background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.3)", fontSize: "0.68rem", color: "#34d399" }}>✓ Receipt uploaded</div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "28px 0", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <Ic name="upload" size={28} color="var(--color-dust)" />
                      <span style={{ fontSize: "0.82rem", color: "var(--color-dust)" }}>Click to upload receipt</span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>PNG, JPG — max 8MB</span>
                    </button>
                  )}
                </div>

                {/* Reference */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>REFERENCE / TRANSACTION ID *</label>
                  <input className="fi" type="text" placeholder={method === "paypal" ? "PayPal Transaction ID" : "Bank transfer reference"} value={ref} onChange={e => setRef(e.target.value)} />
                </div>

                {/* Note */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginBottom: 8, letterSpacing: "0.06em" }}>NOTE (OPTIONAL)</label>
                  <textarea className="fi" rows={2} placeholder="Any info for our team…" value={note} onChange={e => setNote(e.target.value)} style={{ resize: "none" }} />
                </div>

                {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.8rem", color: "#f87171" }}>{error}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep("transfer")} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--color-dust)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Back</button>
                  <button onClick={submit} disabled={loading || !ref.trim() || !screenshot} style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: loading || !ref.trim() || !screenshot ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, cursor: loading || !ref.trim() || !screenshot ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", transition: "all 0.2s" }}>
                    {loading ? "Submitting…" : "Submit for review →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 7, fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>
          <Ic name="shield" size={12} color="rgba(255,255,255,0.2)" />
          Manual verification within 24h · Balance credited instantly on approval
        </div>
      </div>
    </>
  );
}