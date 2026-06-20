"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface WalletData {
  balance: number; currency: string;
  transactions: WalletTx[];
  pending_topup?: { amount: number; status: string } | null;
  presets: number[];
}
interface WalletTx {
  id: string; type: string; amount: number; balance_after: number;
  description: string; created_at: string;
}

function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "wallet":  return <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
    case "plus":    return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "back":    return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "up":      return <svg {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
    case "down":    return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
    default:        return null;
  }
}

const TX_LABELS: Record<string, string> = {
  topup: "Wallet top-up", subscription: "Subscription", cold_lead: "Cold lead",
  hot_lead: "Hot lead", setup_fee: "Setup fee", refund: "Refund",
};

export default function WalletPage() {
  const [data,    setData]    = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState("");

  const load = useCallback(async (tok: string) => {
    try {
      const [wRes, txRes] = await Promise.all([
        fetch(`${API}/api/wallet`,              { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (wRes.ok) {
        const w  = await wRes.json();
        const tx = txRes.ok ? await txRes.json() : { transactions: [] };
        setData({ ...w, transactions: tx.transactions || [] });
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: d }) => {
      if (!d.session) { window.location.href = "/auth/login"; return; }
      setToken(d.session.access_token);
      load(d.session.access_token);
    });
  }, [load]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  const balance  = data?.balance ?? 0;
  const isLow    = balance < 5 && balance > 0;
  const isEmpty  = balance <= 0;
  const balColor = isEmpty ? "#f87171" : isLow ? "#fbbf24" : "#34d399";

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight: "100vh", background: "var(--color-void)", padding: "0 0 64px" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-dust)", textDecoration: "none", fontSize: "0.82rem" }}>
              <Ic name="back" size={14} /> Dashboard
            </a>
            <div style={{ width: 1, height: 16, background: "var(--line)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Ic name="wallet" size={16} color="var(--color-nebula)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "var(--color-starlight)" }}>My Wallet</span>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px", animation: "fadeIn 0.25s ease both" }}>

          {/* Balance card */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isEmpty ? "rgba(248,113,113,0.3)" : isLow ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.2)"}`, borderRadius: 22, padding: "28px 32px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${balColor}18,transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", marginBottom: 10 }}>AVAILABLE BALANCE</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3.2rem", color: balColor, lineHeight: 1, marginBottom: 6 }}>
              ${balance.toFixed(2)}
              <span style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--color-dust)", marginLeft: 10 }}>USD</span>
            </div>

            {isEmpty && <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#f87171" }}>🔴 Your agents are paused. Add funds to resume instantly.</p>}
            {isLow && !isEmpty && <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#fbbf24" }}>⚠️ Low balance — top up to avoid disruption.</p>}
            {!isEmpty && !isLow && <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--color-dust)" }}>Your AI agents are active and billing from this balance.</p>}

            {data?.pending_topup && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: "0.78rem", color: "#38bdf8", display: "inline-block" }}>
                🕐 ${data.pending_topup.amount} top-up pending admin approval
              </div>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[20, 50, 100].map(amt => (
                <a key={amt} href={`/wallet/topup?amount=${amt}`} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa", fontWeight: 600, fontSize: "0.82rem", textDecoration: "none" }}>
                  +${amt}
                </a>
              ))}
              <a href="/wallet/topup" style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Ic name="plus" size={13} color="#fff" /> Add custom amount
              </a>
            </div>
          </div>

          {/* Billing rates */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 12 }}>BILLING RATES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
              {[
                { label: "Cold lead",       price: "$0.50" },
                { label: "Hot lead",        price: "$2.00" },
                { label: "Basic /month",    price: "$29.00" },
                { label: "Pro /month",      price: "$69.00" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "var(--color-dust)" }}>{r.label}</span>
                  <span style={{ color: "var(--color-starlight)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{r.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-starlight)" }}>Transaction history</h3>

          {!data?.transactions?.length ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-dust)", fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 14 }}>
              No transactions yet — your history will appear here.
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
              {data.transactions.map((tx, i) => {
                const isCredit = tx.amount > 0;
                const col      = isCredit ? "#34d399" : "#f87171";
                return (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < data.transactions.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${col}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Ic name={isCredit ? "up" : "down"} size={15} color={col} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.84rem", color: "var(--color-starlight)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.description || TX_LABELS[tx.type] || tx.type}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: col, fontFamily: "var(--font-mono)" }}>
                        {isCredit ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.67rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)" }}>
                        bal: ${tx.balance_after.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}