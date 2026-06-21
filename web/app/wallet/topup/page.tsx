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

const PRICES = {
  cold: 0.50,
  warm: 1.50,
  hot: 5.00,
};

export default function WalletTopupPage() {
  const [cold, setCold] = useState(0);
  const [warm, setWarm] = useState(0);
  const [hot, setHot] = useState(0);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const coldTotal = cold * PRICES.cold;
  const warmTotal = warm * PRICES.warm;
  const hotTotal = hot * PRICES.hot;
  const total = coldTotal + warmTotal + hotTotal;

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) {
        setToken(data.session.access_token);
      }
    });
  }, []);

  const submitTopup = async () => {
    if (total < 5) return;
    
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
          amount: total,
          payment_method: "bank",
          cold_count: cold,
          warm_count: warm,
          hot_count: hot,
          note: `Expected leads: ${cold} cold, ${warm} warm, ${hot} hot`,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Failed to submit request");
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setCold(0);
      setWarm(0);
      setHot(0);
    } catch (ex: any) {
      setError(ex?.message || "Something went wrong");
    }
    
    setLoading(false);
  };

  const line = "rgba(255,255,255,0.07)";

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon d={IC.wallet} size={24} color="#a855f7" />
        <span style={{ fontWeight: 700, color: "#edf0f7", fontSize: "1.2rem" }}>Wallet Top-up</span>
        <div style={{ flex: 1 }} />
        <a href="/dashboard" style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", textDecoration: "none" }}>
          ← Back
        </a>
      </header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>

        {success && (
          <div className="fade-up" style={{ marginBottom: 40, padding: "20px 24px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Icon d={IC.check} size={20} color="#34d399" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#34d399" }}>Request submitted!</p>
                <p style={{ margin: 0, color: "rgba(52,211,153,0.8)", fontSize: "0.84rem" }}>
                  Admin will review and approve your request within 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fade-up" style={{ marginBottom: 40, padding: "20px 24px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "16px" }}>
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
          
          <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 8 }}>Fund Your Wallet</h1>
          <p style={{ color: "rgba(237,240,247,0.5)", marginBottom: 32 }}>Enter expected lead counts to calculate total</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "rgba(237,240,247,0.45)", marginBottom: 8 }}>
                Cold Leads
              </label>
              <input
                type="number"
                min="0"
                value={cold}
                onChange={e => setCold(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: "12px",
                  color: "#edf0f7",
                  fontSize: "1.1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.35)", margin: "6px 0 0" }}>
                $0.50 each
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "rgba(237,240,247,0.45)", marginBottom: 8 }}>
                Warm Leads
              </label>
              <input
                type="number"
                min="0"
                value={warm}
                onChange={e => setWarm(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: "12px",
                  color: "#edf0f7",
                  fontSize: "1.1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.35)", margin: "6px 0 0" }}>
                $1.50 each
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "rgba(237,240,247,0.45)", marginBottom: 8 }}>
                Hot Leads
              </label>
              <input
                type="number"
                min="0"
                value={hot}
                onChange={e => setHot(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: "12px",
                  color: "#edf0f7",
                  fontSize: "1.1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.72rem", color: "rgba(237,240,247,0.35)", margin: "6px 0 0" }}>
                $5.00 each
              </p>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px", marginBottom: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: "0.84rem", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(237,240,247,0.6)" }}>{cold} × $0.50</span>
                <span>${coldTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(237,240,247,0.6)" }}>{warm} × $1.50</span>
                <span>${warmTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(237,240,247,0.6)" }}>{hot} × $5.00</span>
                <span>${hotTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ borderTop: `1px solid ${line}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#7c3aed" }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {total > 0 && total < 5 && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", fontSize: "0.84rem", color: "#fbbf24" }}>
              ⚠️ Minimum is $5.00
            </div>
          )}

          <button
            onClick={submitTopup}
            disabled={total < 5 || loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: total >= 5 && !loading ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(124,58,237,0.3)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: total >= 5 && !loading ? "pointer" : "not-allowed",
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
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}