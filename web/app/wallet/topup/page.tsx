"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const BANK = {
  account_name:   "Omar Maher",
  account_number: "059102271777",
  iban:           "EG920046020100000059102271777",
  swift:          "MSHQEGCA",
  bank_name:      "Mashreq Bank",
  currency:       "USD",
};
const PAYPAL = {
  link:  "https://paypal.me/Ahmedmaher1728399",
  email: "ahmedmaher7720@gmail.com",
};
const PRESETS    = [15, 40, 80, 160];
const MIN_TOPUP  = 15;
const HOT_LEAD_PRICE = 8;

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
    case "checkc":  return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "alert":   return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    default:        return null;
  }
}

type Step   = "amount" | "method" | "transfer" | "confirm" | "done";
type Method = "bank" | "paypal";

export default function WalletTopupPage() {
  const searchParams = useSearchParams();
  const presetAmount = searchParams.get("amount");

  const [step,   setStep]   = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(presetAmount ? parseFloat(presetAmount) : MIN_TOPUP);
  const [method, setMethod] = useState<Method>("bank");
  const [txnRef, setTxnRef] = useState("");
  const [note,   setNote]   = useState("");
  const [screenshot, setScreenshot]   = useState<string | null>(null);
  const [screenshotMime, setScreenshotMime] = useState("image/png");
  const [token,    setToken]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large — max 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setScreenshot(base64);
      setScreenshotMime(file.type || "image/png");
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          payment_method:  method,
          paypal_txn:      txnRef || null,
          note:            note || null,
          screenshot_b64:  screenshot,
          screenshot_mime: screenshotMime,
        }),
      });

      let data: any = null;
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError((data && data.detail) || `Request failed (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      setStep("done");
    } catch (ex: any) {
      setError("Network error — please check your connection and try again.");
    }
    setLoading(false);
  };

  const line = "rgba(255,255,255,0.07)";
  const card = { background: "rgba(255,255,255,0.025)", border: `1px solid ${line}`, borderRadius: 18 };

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .preset-btn{padding:11px 18px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#edf0f7;font-weight:600;font-size:0.9rem;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .preset-btn:hover{background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.3)}
        .preset-btn.active{background:rgba(124,58,237,0.15);border-color:#7c3aed;color:#a78bfa}
        .method-card{flex:1;padding:18px;border-radius:14px;border:1.5px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.15s;text-align:center}
        .method-card:hover{border-color:rgba(124,58,237,0.35)}
        .method-card.active{border-color:#7c3aed;background:rgba(124,58,237,0.1)}
        .field-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;background:rgba(0,0,0,0.2);border-radius:10px;margin-bottom:8px}
        .copy-btn{background:none;border:none;cursor:pointer;color:rgba(237,240,247,0.4);display:flex;flex-shrink:0;padding:4px}
        .copy-btn:hover{color:#a78bfa}
        .btn-p{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;font-weight:700;font-size:0.92rem;cursor:pointer;font-family:inherit;width:100%;transition:all 0.15s;text-decoration:none}
        .btn-p:hover{filter:brightness(1.08)}
        .btn-p:disabled{opacity:0.45;cursor:not-allowed}
        .btn-g{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(237,240,247,0.7);font-weight:600;font-size:0.92rem;cursor:pointer;font-family:inherit}
        .inp{width:100%;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:11px;color:#edf0f7;font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
      `}</style>

      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 14 }}>
        <a href="/wallet" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(237,240,247,0.5)", textDecoration: "none", fontSize: "0.84rem" }}>
          <Ic name="back" size={14} /> Wallet
        </a>
        <div style={{ flex: 1 }} />
        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Top up wallet</span>
      </header>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "36px 20px 60px" }}>

        {step !== "done" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {["amount", "method", "transfer", "confirm"].map((s, i) => {
              const idx = ["amount", "method", "transfer", "confirm"].indexOf(step);
              return <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= idx ? "#7c3aed" : "rgba(255,255,255,0.08)" }} />;
            })}
          </div>
        )}

        {error && (
          <div className="fade-up" style={{ marginBottom: 20, padding: "13px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Ic name="alert" size={17} color="#f87171" />
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#f87171" }}>{error}</p>
          </div>
        )}

        {step === "amount" && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.6rem", marginBottom: 8 }}>How much would you like to add?</h1>
            <p style={{ color: "rgba(237,240,247,0.5)", fontSize: "0.88rem", marginBottom: 24 }}>
              Minimum ${MIN_TOPUP}. You're billed ${HOT_LEAD_PRICE} only per confirmed hot lead.
            </p>

            <div style={{ display: "flex", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>
              {PRESETS.map(p => (
                <button key={p} className={`preset-btn${amount === p ? " active" : ""}`} onClick={() => setAmount(p)}>${p}</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: "0.74rem", color: "rgba(237,240,247,0.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Custom amount (USD)</label>
            <input type="number" min={MIN_TOPUP} value={amount} onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              style={{ width: "100%", padding: "16px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${line}`, borderRadius: 13, color: "#edf0f7", fontSize: "1.4rem", fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />

            {amount > 0 && amount < MIN_TOPUP && (
              <p style={{ fontSize: "0.8rem", color: "#fbbf24", marginBottom: 16 }}>⚠️ Minimum top-up is ${MIN_TOPUP}</p>
            )}

            <button className="btn-p" style={{ marginTop: 16 }} disabled={amount < MIN_TOPUP} onClick={() => setStep("method")}>
              Continue
            </button>
          </div>
        )}

        {step === "method" && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Choose payment method</h1>
            <p style={{ color: "rgba(237,240,247,0.5)", fontSize: "0.88rem", marginBottom: 24 }}>Adding <strong style={{ color: "#edf0f7" }}>${amount.toFixed(2)}</strong> to your wallet.</p>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <div className={`method-card${method === "bank" ? " active" : ""}`} onClick={() => setMethod("bank")}>
                <Ic name="bank" size={24} color={method === "bank" ? "#a78bfa" : "rgba(237,240,247,0.5)"} />
                <p style={{ margin: "10px 0 2px", fontWeight: 700, fontSize: "0.88rem" }}>Bank Transfer</p>
                <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(237,240,247,0.4)" }}>Mashreq Bank</p>
              </div>
              <div className={`method-card${method === "paypal" ? " active" : ""}`} onClick={() => setMethod("paypal")}>
                <Ic name="paypal" size={24} color={method === "paypal" ? "#a78bfa" : "rgba(237,240,247,0.5)"} />
                <p style={{ margin: "10px 0 2px", fontWeight: 700, fontSize: "0.88rem" }}>PayPal</p>
                <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(237,240,247,0.4)" }}>Instant link</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-g" style={{ flex: 1 }} onClick={() => setStep("amount")}>Back</button>
              <button className="btn-p" style={{ flex: 2 }} onClick={() => setStep("transfer")}>Continue</button>
            </div>
          </div>
        )}

        {step === "transfer" && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>
              Send ${amount.toFixed(2)} via {method === "bank" ? "Bank Transfer" : "PayPal"}
            </h1>
            <p style={{ color: "rgba(237,240,247,0.5)", fontSize: "0.86rem", marginBottom: 22 }}>Use the details below, then continue to confirm your payment.</p>

            <div style={{ ...card, padding: "20px", marginBottom: 22 }}>
              {method === "bank" ? (
                <>
                  {[
                    ["Account name", BANK.account_name],
                    ["Account number", BANK.account_number],
                    ["IBAN", BANK.iban],
                    ["SWIFT / BIC", BANK.swift],
                    ["Bank", BANK.bank_name],
                    ["Currency", BANK.currency],
                  ].map(([label, value]) => (
                    <div key={label} className="field-row">
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "rgba(237,240,247,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", wordBreak: "break-all" }}>{value}</p>
                      </div>
                      <button className="copy-btn" onClick={() => copy(value, label)}>
                        <Ic name={copied === label ? "check" : "copy"} size={15} color={copied === label ? "#34d399" : undefined} />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="field-row">
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "rgba(237,240,247,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PayPal link</p>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#38bdf8", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", wordBreak: "break-all" }}>{PAYPAL.link}</p>
                    </div>
                    <button className="copy-btn" onClick={() => copy(PAYPAL.link, "link")}>
                      <Ic name={copied === "link" ? "check" : "copy"} size={15} color={copied === "link" ? "#34d399" : undefined} />
                    </button>
                  </div>
                  <div className="field-row">
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "rgba(237,240,247,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PayPal email</p>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>{PAYPAL.email}</p>
                    </div>
                    <button className="copy-btn" onClick={() => copy(PAYPAL.email, "email")}>
                      <Ic name={copied === "email" ? "check" : "copy"} size={15} color={copied === "email" ? "#34d399" : undefined} />
                    </button>
                  </div>
                  <a href={PAYPAL.link} target="_blank" rel="noopener noreferrer" className="btn-p" style={{ marginTop: 12 }}>
                    Open PayPal.me <Ic name="paypal" size={15} color="#fff" />
                  </a>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "12px 14px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, marginBottom: 22 }}>
              <Ic name="shield" size={15} color="#38bdf8" />
              <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(56,189,248,0.85)", lineHeight: 1.5 }}>
                After sending, come back here and submit your receipt — we review and credit your wallet within 24 hours.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-g" style={{ flex: 1 }} onClick={() => setStep("method")}>Back</button>
              <button className="btn-p" style={{ flex: 2 }} onClick={() => setStep("confirm")}>I've sent the payment</button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Confirm your payment</h1>
            <p style={{ color: "rgba(237,240,247,0.5)", fontSize: "0.86rem", marginBottom: 22 }}>Add a reference and, if you have one, a screenshot of the receipt.</p>

            <label style={{ display: "block", fontSize: "0.74rem", color: "rgba(237,240,247,0.45)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {method === "bank" ? "Transfer reference / last 4 digits" : "PayPal transaction ID"} (optional)
            </label>
            <input className="inp" style={{ marginBottom: 16 }} value={txnRef} onChange={e => setTxnRef(e.target.value)} placeholder={method === "bank" ? "e.g. TRX-29381" : "e.g. 8GH29381AB"} />

            <label style={{ display: "block", fontSize: "0.74rem", color: "rgba(237,240,247,0.45)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Receipt screenshot (optional, speeds up approval)</label>
            {screenshot ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, marginBottom: 16 }}>
                <Ic name="check" size={16} color="#34d399" />
                <span style={{ flex: 1, fontSize: "0.84rem", color: "#34d399" }}>Screenshot attached</span>
                <button className="copy-btn" onClick={() => setScreenshot(null)}><Ic name="trash" size={15} color="#f87171" /></button>
              </div>
            ) : (
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px", border: `1.5px dashed ${line}`, borderRadius: 13, cursor: "pointer", marginBottom: 16 }}>
                <Ic name="upload" size={18} color="rgba(237,240,247,0.4)" />
                <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)" }}>Click to upload image</span>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
            )}

            <label style={{ display: "block", fontSize: "0.74rem", color: "rgba(237,240,247,0.45)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Note (optional)</label>
            <textarea className="inp" rows={2} style={{ marginBottom: 22, resize: "none" }} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything we should know about this payment" />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-g" style={{ flex: 1 }} onClick={() => setStep("transfer")}>Back</button>
              <button className="btn-p" style={{ flex: 2 }} disabled={loading} onClick={submit}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Submitting…</>
                ) : "Submit for review"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="fade-up" style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Ic name="check" size={28} color="#34d399" />
            </div>
            <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 10 }}>Request submitted!</h1>
            <p style={{ color: "rgba(237,240,247,0.55)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
              We'll review your ${amount.toFixed(2)} top-up and credit your wallet within 24 hours. Your agent reactivates automatically once approved.
            </p>
            <a href="/wallet" className="btn-p" style={{ maxWidth: 240, margin: "0 auto" }}>Back to wallet</a>
          </div>
        )}
      </div>
    </div>
  );
}