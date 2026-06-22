"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Icon({ d, size = 16, color }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = { check: "M20 6L9 17l-5-5", arrow: "M5 12h14M13 6l6 6-6 6" };

interface AgentInfo { created_at?: string; status?: string; }
interface WalletInfo { balance: number; }

const HOT_LEAD_PRICE = 8;
const TRIAL_DAYS      = 7;
const MIN_TOPUP        = 15;

function daysLeftInTrial(createdAt?: string): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  const ageMs    = Date.now() - created;
  const ageDays  = ageMs / 86400000;
  if (ageDays >= TRIAL_DAYS) return 0;
  return Math.max(0, Math.ceil(TRIAL_DAYS - ageDays));
}

export default function PricingPage() {
  const [loading, setLoading] = useState(true);
  const [agent,   setAgent]   = useState<AgentInfo | null>(null);
  const [wallet,  setWallet]  = useState<WalletInfo | null>(null);
  const [signedIn,setSignedIn]= useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { setLoading(false); return; }
      setSignedIn(true);
      const tok = data.session.access_token;
      Promise.all([
        fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/wallet`,    { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.ok ? r.json() : null),
      ]).then(([a, w]) => {
        if (a?.agents?.length) setAgent(a.agents[0]);
        if (w) setWallet(w);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const line     = "rgba(255,255,255,0.07)";
  const daysLeft = agent ? daysLeftInTrial(agent.created_at) : null;
  const onTrial  = daysLeft !== null && daysLeft > 0;
  const trialOver= daysLeft === 0;
  const balance  = wallet?.balance ?? 0;
  const lowBalance = trialOver && balance < HOT_LEAD_PRICE;

  const getCTA = () => {
    if (!signedIn) return { label: "Start free trial", href: "/auth/login" };
    if (onTrial)   return { label: `On trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`, href: "/dashboard" };
    if (lowBalance) return { label: "Top up to reactivate", href: "/wallet/topup" };
    return { label: "Go to dashboard", href: "/dashboard" };
  };
  const cta = getCTA();

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .btn-p{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:13px 24px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;font-weight:700;font-size:0.92rem;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.2s;width:100%}
        .btn-p:hover{filter:brightness(1.08);transform:translateY(-1px)}
      `}</style>

      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg viewBox="0 0 1024 1024" width={24} height={24}><defs><linearGradient id="pl" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs><path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#pl)"/></svg>
          <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.9rem", color: "#edf0f7" }}>EasyBuilda</span>
        </a>
        <div style={{ flex: 1 }} />
        {signedIn ? (
          <a href="/dashboard" style={{ fontSize: "0.84rem", color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Dashboard →</a>
        ) : (
          <a href="/auth/login" style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", textDecoration: "none" }}>Sign in</a>
        )}
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 20px 80px" }}>

        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.4s ease both" }}>
          <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#7c3aed", marginBottom: 12 }}>Pricing</p>
          <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.03em", marginBottom: 12 }}>
            Pay only for results.
          </h1>
          <p style={{ fontSize: "0.96rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            No setup fee. No subscription. Try free for {TRIAL_DAYS} days, then pay ${HOT_LEAD_PRICE} only when your agent captures a real, qualified lead.
          </p>
        </div>

        {/* Status banner */}
        {!loading && signedIn && agent && (
          <>
            {onTrial && (
              <div style={{ marginBottom: 28, padding: "12px 20px", borderRadius: 13, background: (daysLeft ?? 0) <= 1 ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.08)", border: `1px solid ${(daysLeft ?? 0) <= 1 ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: (daysLeft ?? 0) <= 1 ? "#f87171" : "#fbbf24", fontWeight: 600 }}>
                  {(daysLeft ?? 0) <= 1 ? "⚠️ Last day of your free trial" : `Free trial active — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
                </p>
                <a href="/wallet/topup" style={{ fontSize: "0.82rem", fontWeight: 700, color: (daysLeft ?? 0) <= 1 ? "#f87171" : "#fbbf24", textDecoration: "none", whiteSpace: "nowrap" }}>Add funds early →</a>
              </div>
            )}
            {trialOver && lowBalance && (
              <div style={{ marginBottom: 28, padding: "12px 20px", borderRadius: 13, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#f87171", fontWeight: 600 }}>
                  Your trial has ended and your balance (${balance.toFixed(2)}) is below ${HOT_LEAD_PRICE} — your agent is paused.
                </p>
                <a href="/wallet/topup" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f87171", textDecoration: "none", whiteSpace: "nowrap" }}>Top up now →</a>
              </div>
            )}
            {trialOver && !lowBalance && (
              <div style={{ marginBottom: 28, padding: "12px 20px", borderRadius: 13, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#34d399", fontWeight: 600 }}>
                  Your trial ended — your agent is live and billing ${HOT_LEAD_PRICE} per hot lead. Balance: ${balance.toFixed(2)}.
                </p>
              </div>
            )}
          </>
        )}

        {/* Single pricing card */}
        <div style={{ padding: "40px 36px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.05)", position: "relative", animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 100, background: "linear-gradient(135deg,#7c3aed,#2563eb)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
            Simple. Fair. Risk-free.
          </div>
          <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#a78bfa", marginBottom: 10, textAlign: "center" }}>Pay-per-result</p>
          <div style={{ marginBottom: 8, textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "3.4rem", color: "#edf0f7" }}>${HOT_LEAD_PRICE}</span>
            <span style={{ fontSize: "0.92rem", color: "rgba(237,240,247,0.5)" }}> per qualified lead</span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.7, marginBottom: 28, textAlign: "center" }}>
            Free for {TRIAL_DAYS} days. After that, you're only ever charged when your agent captures a real lead — a visitor who shares contact info with genuine buying intent.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              "1 AI agent included",
              "Unlimited conversations — always free",
              "Unlimited cold & casual chats — always free",
              `${TRIAL_DAYS}-day free trial, no card required`,
              "Charged only on a confirmed hot lead",
              "No setup fee, no subscription, ever",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <div style={{ color: "#34d399", marginTop: 2, flexShrink: 0 }}><Icon d={IC.check} size={14} color="#34d399" /></div>
                <span style={{ fontSize: "0.86rem", color: "rgba(237,240,247,0.8)" }}>{f}</span>
              </div>
            ))}
          </div>
          <a href={cta.href} className="btn-p">
            {cta.label} <Icon d={IC.arrow} size={15} color="#fff" />
          </a>
          <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.76rem", color: "rgba(237,240,247,0.35)" }}>
            Top up anytime — minimum ${MIN_TOPUP}. Funds never expire.
          </p>
        </div>

        {/* How billing works */}
        <div style={{ marginTop: 40, padding: "28px 32px", background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 18 }}>
          <p style={{ margin: "0 0 16px", fontSize: "0.78rem", fontWeight: 700, color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
            {[
              { n: "①", t: "Build your agent", d: `Free for ${TRIAL_DAYS} days. No card needed.` },
              { n: "②", t: "Leads come in free", d: "Every lead during the trial costs nothing." },
              { n: "③", t: "Top up your wallet", d: `Minimum $${MIN_TOPUP}, whenever you're ready.` },
              { n: "④", t: "Pay per result", d: `$${HOT_LEAD_PRICE} is deducted only for a real hot lead.` },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "1.4rem", color: "#7c3aed", marginBottom: 4 }}>{s.n}</div>
                <p style={{ margin: "0 0 4px", fontSize: "0.86rem", fontWeight: 600, color: "#edf0f7" }}>{s.t}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(237,240,247,0.45)", lineHeight: 1.55 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
          <p style={{ textAlign: "center", marginBottom: 24, fontSize: "0.78rem", color: "rgba(237,240,247,0.38)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Common questions</p>
          {[
            { q: "Can I try before paying?", a: `Yes — ${TRIAL_DAYS} days completely free, no credit card. Your agent works fully during the trial, and any leads it captures cost nothing.` },
            { q: "What happens when the trial ends?", a: `If your wallet has at least $${HOT_LEAD_PRICE}, nothing changes — your agent keeps running and you're billed per lead. If your balance is below $${HOT_LEAD_PRICE}, your agent pauses until you top up.` },
            { q: "Is there a monthly subscription or setup fee?", a: "No — neither, ever. You only pay when your agent captures a real, qualified lead." },
            { q: "What counts as a chargeable lead?", a: "Only a 'hot' lead — a visitor who shared real contact info (email or phone) and showed genuine buying or booking intent. Casual chats and curious visitors are always free." },
            { q: "What if my wallet runs out?", a: "Your agent pauses automatically and you're notified by email and in your dashboard. Top up and it resumes instantly — no waiting, no setup." },
            { q: "Is there a minimum top-up?", a: `Yes, $${MIN_TOPUP}. Funds never expire and only get deducted when you actually get a lead.` },
          ].map((faq, i) => (
            <div key={i} style={{ padding: "16px 0", borderBottom: i < 5 ? `1px solid ${line}` : "none" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.92rem", fontWeight: 600, color: "#edf0f7" }}>{faq.q}</p>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.65 }}>{faq.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}