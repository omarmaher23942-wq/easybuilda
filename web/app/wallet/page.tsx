"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const HOT_LEAD_PRICE = 8;
const TRIAL_DAYS     = 7;
const PRESETS        = [15, 40, 80, 160];

interface WalletData {
  balance: number; currency: string;
  transactions: WalletTx[];
  pending_topup?: { amount: number; status: string } | null;
}
interface WalletTx {
  id: string; type: string; amount: number; balance_after: number;
  description: string; created_at: string;
}
interface AgentSummary {
  id: string; status: string; created_at?: string;
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
  topup: "Wallet top-up", hot_lead_charge: "Hot lead charged", refund: "Refund",
};

function daysLeftInTrial(createdAt?: string): number | null {
  if (!createdAt) return null;
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (ageDays >= TRIAL_DAYS) return 0;
  return Math.max(0, Math.ceil(TRIAL_DAYS - ageDays));
}

export default function WalletPage() {
  const [data,    setData]    = useState<WalletData | null>(null);
  const [agents,  setAgents]  = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState("");

  const load = useCallback(async (tok: string) => {
    try {
      const [wRes, txRes, aRes] = await Promise.all([
        fetch(`${API}/api/wallet`,              { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,           { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (wRes.ok) {
        const w  = await wRes.json();
        const tx = txRes.ok ? await txRes.json() : { transactions: [] };
        setData({ ...w, transactions: tx.transactions || [] });
      }
      if (aRes.ok) {
        const a = await aRes.json();
        setAgents(a.agents || []);
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

  const balance = data?.balance ?? 0;

  // Trial state: true if the user has at least one agent and the OLDEST
  // one is still within its 7-day free window.
  const oldestAgent = agents.length
    ? agents.reduce((a, b) => (new Date(a.created_at || 0) < new Date(b.created_at || 0) ? a : b))
    : null;
  const trialDaysLeft = oldestAgent ? daysLeftInTrial(oldestAgent.created_at) : null;
  const onTrial        = trialDaysLeft !== null && trialDaysLeft > 0;
  const hasNoAgents     = agents.length === 0;
  const trialOver       = agents.length > 0 && !onTrial;

  const isEmpty = balance <= 0;
  const isLow   = balance > 0 && balance < HOT_LEAD_PRICE;

  // Only show the "paused" warning if the trial is actually over AND
  // the balance is too low. A brand-new user, or one still on trial,
  // should never see a scary red "paused" message.
  const showPausedWarning = trialOver && balance < HOT_LEAD_PRICE;

  let balColor = "#34d399";
  if (showPausedWarning) balColor = "#f87171";
  else if (isLow && trialOver) balColor = "#fbbf24";

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight: "100vh", background: "var(--color-void)", padding: "0 0 64px" }}>

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

          <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${showPausedWarning ? "rgba(248,113,113,0.3)" : isLow && trialOver ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.2)"}`, borderRadius: 22, padding: "28px 32px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${balColor}18,transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "0.65rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", marginBottom: 10 }}>AVAILABLE BALANCE</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3.2rem", color: balColor, lineHeight: 1, marginBottom: 6 }}>
              ${balance.toFixed(2)}
              <span style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--color-dust)", marginLeft: 10 }}>USD</span>
            </div>

            {hasNoAgents && (
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#a78bfa" }}>🎁 Build your first agent to start your {TRIAL_DAYS}-day free trial — no charge until it ends.</p>
            )}
            {onTrial && (
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#fbbf24" }}>🎁 Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left. Leads are free until then.</p>
            )}
            {showPausedWarning && (
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#f87171" }}>🔴 Your trial has ended and your balance is below ${HOT_LEAD_PRICE} — your agent is paused. Top up to resume instantly.</p>
            )}
            {isLow && trialOver && !showPausedWarning && (
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#fbbf24" }}>⚠️ Low balance — top up to avoid your agent pausing.</p>
            )}
            {trialOver && !isLow && !showPausedWarning && (
              <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--color-dust)" }}>Your AI agent is active and billing ${HOT_LEAD_PRICE} per hot lead from this balance.</p>
            )}

            {data?.pending_topup && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: "0.78rem", color: "#38bdf8", display: "inline-block" }}>
                🕐 ${data.pending_topup.amount} top-up pending admin approval
              </div>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {PRESETS.slice(0, 3).map(amt => (
                <a key={amt} href={`/wallet/topup?amount=${amt}`} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa", fontWeight: 600, fontSize: "0.82rem", textDecoration: "none" }}>
                  +${amt}
                </a>
              ))}
              <a href="/wallet/topup" style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Ic name="plus" size={13} color="#fff" /> Add custom amount
              </a>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: "0.68rem", color: "var(--color-dust)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 12 }}>HOW BILLING WORKS</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
              <span style={{ color: "var(--color-dust)" }}>Cold &amp; casual chats</span>
              <span style={{ color: "#34d399", fontFamily: "var(--font-mono)", fontWeight: 700 }}>Free, always</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
              <span style={{ color: "var(--color-dust)" }}>First {TRIAL_DAYS} days (trial)</span>
              <span style={{ color: "#34d399", fontFamily: "var(--font-mono)", fontWeight: 700 }}>Free, always</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", padding: "8px 0" }}>
              <span style={{ color: "var(--color-dust)" }}>Confirmed hot lead (after trial)</span>
              <span style={{ color: "var(--color-starlight)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>${HOT_LEAD_PRICE.toFixed(2)} each</span>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: "0.74rem", color: "var(--color-dust)", lineHeight: 1.6 }}>
              No setup fee. No subscription. If your balance drops below ${HOT_LEAD_PRICE}, your agent pauses automatically until you top up.
            </p>
          </div>

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