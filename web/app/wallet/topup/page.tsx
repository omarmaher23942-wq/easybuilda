"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Icon({ d, size = 18, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IC = {
  back:    "M19 12H5M12 19l-7-7 7-7",
  bank:    "M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2L2 7h20L12 2z",
  paypal:  "M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z",
  upload:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  check:   "M20 6L9 17l-5-5",
  info:    "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4M12 16h.01",
};

type Method = "bank" | "paypal";

export default function WalletTopupPage() {
  const [method,    setMethod]    = useState<Method>("bank");
  const [amount,    setAmount]    = useState("");
  const [txRef,     setTxRef]     = useState("");
  const [note,      setNote]      = useState("");
  const [screenshot,setScreenshot]= useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");
  const [token,     setToken]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  const handleFile = (file: File) => {
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!amount || parseFloat(amount) < 5) { setError("Minimum top-up is $5"); return; }
    if (!txRef.trim()) { setError("Please enter the transaction reference"); return; }
    setLoading(true); setError("");

    try {
      let screenshot_b64 = "";
      let screenshot_mime = "image/png";
      if (screenshot) {
        const reader = new FileReader();
        screenshot_b64 = await new Promise(res => {
          reader.onload = e => {
            const result = e.target?.result as string;
            screenshot_mime = result.split(";")[0].replace("data:", "");
            res(result.split(",")[1]);
          };
          reader.readAsDataURL(screenshot);
        });
      }

      const res = await fetch(`${API}/api/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: method,
          paypal_txn: txRef,
          note,
          screenshot_b64,
          screenshot_mime,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Failed to submit. Please try again.");
        setLoading(false); return;
      }
      setDone(true);
    } catch {
      setError("Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };

  const QUICK_AMOUNTS = ["10", "25", "50", "100", "250"];
  const line = "rgba(255,255,255,0.07)";

  if (done) return (
    <>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "2rem", textAlign: "center" }}>
        <div style={{ animation: "pop 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon d={IC.check} size={32} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.6rem", color: "#edf0f7", marginBottom: 10 }}>Request submitted!</h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.65, maxWidth: 400, marginBottom: 28 }}>
            We'll review your payment and credit your wallet within a few hours. You'll get a notification when it's approved.
          </p>
          <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Back to dashboard
          </a>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp{width:100%;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid ${line};border-radius:12px;color:#edf0f7;font-size:0.9rem;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .inp:focus{border-color:rgba(124,58,237,0.5)}
        .inp::placeholder{color:rgba(237,240,247,0.2)}
      `}</style>

      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 14 }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(237,240,247,0.5)", textDecoration: "none", fontSize: "0.86rem" }}>
          <Icon d={IC.back} size={16} /> Dashboard
        </a>
        <span style={{ color: "rgba(237,240,247,0.2)" }}>/</span>
        <span style={{ fontSize: "0.86rem", color: "#edf0f7" }}>Add funds</span>
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 64px" }}>
        <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.6rem", color: "#edf0f7", marginBottom: 6 }}>Add wallet funds</h1>
        <p style={{ fontSize: "0.88rem", color: "rgba(237,240,247,0.5)", marginBottom: 32 }}>Send payment and submit the confirmation. We'll credit your wallet after review.</p>

        {/* Amount */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: "0.76rem", color: "rgba(237,240,247,0.5)", marginBottom: 10, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (USD)</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(a)}
                style={{ padding: "7px 16px", borderRadius: 10, border: `1.5px solid ${amount === a ? "rgba(124,58,237,0.6)" : line}`, background: amount === a ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)", color: amount === a ? "#edf0f7" : "rgba(237,240,247,0.6)", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", fontWeight: amount === a ? 700 : 400, transition: "all 0.15s" }}>
                ${a}
              </button>
            ))}
          </div>
          <input className="inp" type="number" min="5" placeholder="Or enter custom amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: "1.1rem" }} />
        </div>

        {/* Payment method */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: "0.76rem", color: "rgba(237,240,247,0.5)", marginBottom: 10, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Payment method</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["bank", "paypal"] as Method[]).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                style={{ padding: "14px", borderRadius: 14, border: `1.5px solid ${method === m ? "rgba(124,58,237,0.6)" : line}`, background: method === m ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                <Icon d={m === "bank" ? IC.bank : IC.paypal} size={18} color={method === m ? "#a78bfa" : "rgba(237,240,247,0.4)"} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: method === m ? "#edf0f7" : "rgba(237,240,247,0.6)" }}>{m === "bank" ? "Bank transfer" : "PayPal"}</p>
                  <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "rgba(237,240,247,0.35)" }}>{m === "bank" ? "Mashreq Bank Egypt" : "paypal.me/..."}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment details */}
        <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>
            {method === "bank" ? "Bank transfer details" : "PayPal details"}
          </p>
          {method === "bank" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Account name", "Omar Maher"],
                ["Bank", "Mashreq Bank Egypt"],
                ["Account number", "059102271777"],
                ["IBAN", "EG920046020100000059102271777"],
                ["SWIFT / BIC", "MSHQEGCA"],
                ["Currency", "USD only"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(237,240,247,0.45)" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["PayPal link", "paypal.me/Ahmedmaher1728399"],
                ["PayPal email", "ahmedmaher7720@gmail.com"],
                ["Amount", `$${amount || "XX"} USD`],
                ["Note", "Add your email in the payment note"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(237,240,247,0.45)" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction ref */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: "0.76rem", color: "rgba(237,240,247,0.5)", marginBottom: 8, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {method === "bank" ? "Transaction reference *" : "PayPal transaction ID *"}
          </label>
          <input className="inp" placeholder={method === "bank" ? "e.g. TRN2024XXXXXX" : "e.g. 1AB23456CD789012E"} value={txRef} onChange={e => setTxRef(e.target.value)} />
        </div>

        {/* Screenshot upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: "0.76rem", color: "rgba(237,240,247,0.5)", marginBottom: 8, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Payment screenshot (recommended)
          </label>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview ? (
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${line}` }}>
              <img src={preview} alt="Receipt" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
              <button onClick={() => { setScreenshot(null); setPreview(null); }}
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                ×
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              style={{ width: "100%", padding: "24px", borderRadius: 12, border: `1.5px dashed rgba(255,255,255,0.12)`, background: "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "rgba(237,240,247,0.4)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.background = "rgba(124,58,237,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
              <Icon d={IC.upload} size={24} />
              <span style={{ fontSize: "0.84rem" }}>Click to upload screenshot</span>
              <span style={{ fontSize: "0.74rem", opacity: 0.6 }}>PNG, JPG, WEBP</span>
            </button>
          )}
        </div>

        {/* Note */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: "0.76rem", color: "rgba(237,240,247,0.5)", marginBottom: 8, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Note (optional)</label>
          <textarea className="inp" rows={2} placeholder="Any additional information…" value={note} onChange={e => setNote(e.target.value)} style={{ resize: "none" }} />
        </div>

        {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", fontSize: "0.84rem", color: "#f87171" }}>{error}</div>}

        <button onClick={submit} disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: 14, background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: loading ? "none" : "0 0 24px rgba(124,58,237,0.3)" }}>
          {loading ? (
            <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }}/> Submitting…</>
          ) : "Submit top-up request"}
        </button>

        <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.78rem", color: "rgba(237,240,247,0.3)", lineHeight: 1.6 }}>
          We review requests manually and process within a few hours.
          <br />Your wallet will be credited after approval.
        </p>
      </div>
    </div>
  );
}
