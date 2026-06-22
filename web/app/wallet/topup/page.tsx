"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
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
  wallet: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 14a2 2 0 110-4 2 2 0 010 4z",
  check: "M20 6L9 17l-5-5",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  send: "M22 2L11 13M22 2l-7 20-5-19",
};

const MIN_TOPUP      = 15;
const HOT_LEAD_PRICE = 8;
const PRESETS        = [15, 40, 80, 160];

export default function WalletTopupPage() {
  const [amount, setAmount]   = useState<number>(MIN_TOPUP);
  const [token, setToken]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
  }, []);

  const submitTopup = async () => {
    if (amount < MIN_TOPUP) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: "bank",
          note: "Wallet top-up",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Failed to submit request");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (ex: any) {
      setError(ex?.message || "Something went wrong");
    }

    setLoading(false);
  };

  const line = "rgba(255,255,255,0.07)";

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .preset-btn{padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#edf0f7;font-weight:600;font-size:0.92rem;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .preset-btn:hover{background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.3)}
        .preset-btn.active{background:rgba(124,58,237,0.15);border-color:#7c3aed;color:#a78bfa}
      `}</style>

      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon d={IC.wallet} size={24} color="#a855f7" />
        <span style={{ fontWeight: 700, color: "#edf0f7", fontSize: "1.2rem" }}>Wallet Top-up</span>
        <div style={{ flex: 1 }} />
        <a href="/dashboard" style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", textDecoration: "none" }}>
          ← Back
        </a>
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>

        {success && (
          <div className="fade-up" style={{ marginBottom: 28, padding: "20px 24px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Icon d={IC.check} size={20} color="#34d399" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#34d399" }}>Request submitted!</p>
                <p style={{ margin: 0, color: "rgba(52,211,153,0.8)", fontSize: "0.84rem" }}>
                  Admin will review and approve your top-up shortly. Your agent reactivates instantly once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fade-up" style={{ marginBottom: 28, padding: "20px 24px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Icon d={IC.alert} size={20} color="#f87171" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#f87171" }}>Error</p>
                <p style={{ margin: 0, color: "rgba(248,113,113,0.8)", fontSize: "0.84rem" }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: "20px", padding: "32px" }}>

          <h1 style={{ fontWeight: 800, fontSize: "1.9rem", marginBottom: 8 }}>Fund your wallet</h1>
          <p style={{ color: "rgba(237,240,247,0.5)", marginBottom: 28, fontSize: "0.9rem", lineHeight: 1.6 }}>
            You're only charged ${HOT_LEAD_PRICE} when your agent captures a real, qualified lead. Top up any amount — minimum ${MIN_TOPUP}.
          </p>

          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "rgba(237,240,247,0.45)", marginBottom: 10 }}>
            Quick select
          </label>
          <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
            {PRESETS.map(p => (
              <button key={p} type="button" className={`preset-btn${amount === p ? " active" : ""}`} onClick={() => setAmount(p)}>
                ${p}
              </button>
            ))}
          </div>

          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "rgba(237,240,247,0.45)", marginBottom: 8 }}>
            Custom amount (USD)
          </label>
          <input
            type="number"
            min={MIN_TOPUP}
            step={1}
            value={amount}
            onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: "12px",
              color: "#edf0f7",
              fontSize: "1.3rem",
              fontWeight: 700,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          />
          <p style={{ fontSize: "0.78rem", color: "rgba(237,240,247,0.35)", margin: "0 0 24px" }}>
            ≈ {Math.floor(amount / HOT_LEAD_PRICE)} hot lead{Math.floor(amount / HOT_LEAD_PRICE) === 1 ? "" : "s"} at ${HOT_LEAD_PRICE} each
          </p>

          {amount > 0 && amount < MIN_TOPUP && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", fontSize: "0.84rem", color: "#fbbf24" }}>
              ⚠️ Minimum top-up is ${MIN_TOPUP}
            </div>
          )}

          <button
            onClick={submitTopup}
            disabled={amount < MIN_TOPUP || loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: amount >= MIN_TOPUP && !loading ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(124,58,237,0.3)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: amount >= MIN_TOPUP && !loading ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                Submitting…
              </>
            ) : (
              <>
                <Icon d={IC.send} size={18} color="#fff" />
                Submit top-up request
              </>
            )}
          </button>

          <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 12 }}>
            <p style={{ margin: "0 0 7px", fontSize: "0.76rem", fontWeight: 600, color: "rgba(237,240,247,0.6)" }}>Payment methods</p>
            <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: "rgba(237,240,247,0.45)" }}><strong style={{ color: "rgba(237,240,247,0.7)" }}>Bank transfer</strong> — Mashreq Bank Egypt (USD only)</p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(237,240,247,0.45)" }}><strong style={{ color: "rgba(237,240,247,0.7)" }}>PayPal</strong> — paypal.me/Ahmedmaher1728399</p>
          </div>
        </div>
      </div>
    </div>
  );
}