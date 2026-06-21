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
const IC = {
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  info:  "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
};

interface BillingStatus {
  plan: string; balance: number; days_left: number | null;
  is_expired: boolean; is_pro: boolean; is_trial: boolean;
  can_activate_pro: boolean; billing_next: string | null;
}

export default function PricingPage() {
  const [status,  setStatus]  = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState("");

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { setLoading(false); return; }
      const tok = data.session.access_token;
      setToken(tok);
      fetch(`${API}/api/billing/status`, { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.json()).then(d => setStatus(d)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const line = "rgba(255,255,255,0.07)";

  const getTrialCTA = () => {
    if (!status) return { label: "Start free trial", href: "/auth/login", disabled: false, color: "ghost" };
    if (status.is_trial) return { label: `On trial — ${status.days_left ?? 0} days left`, href: "/dashboard", disabled: false, color: "ghost" };
    if (status.is_expired) return { label: "Trial ended — upgrade to Pro", href: "/wallet/topup", disabled: false, color: "ghost" };
    if (status.is_pro) return { label: "You're on Pro", href: "/dashboard", disabled: true, color: "ghost" };
    return { label: "Start free trial", href: "/auth/login", disabled: false, color: "ghost" };
  };

  const getProCTA = () => {
    if (!status) return { label: "Get Pro — $9/mo", href: "/auth/login", disabled: false };
    if (status.is_pro) return { label: "✓ You're on Pro", href: "/dashboard", disabled: true };
    if (status.can_activate_pro) return { label: "Activate Pro now", href: "/activate-pro", disabled: false };
    if (status.is_trial || status.is_expired) return { label: "Add funds & activate", href: "/wallet/topup", disabled: false };
    return { label: "Get Pro — $9/mo", href: "/auth/login", disabled: false };
  };

  const trialCTA = getTrialCTA();
  const proCTA   = getProCTA();

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#edf0f7", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .btn-p{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:13px 24px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;font-weight:700;font-size:0.92rem;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.2s;width:100%}
        .btn-p:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .btn-p:disabled{opacity:0.5;cursor:not-allowed;transform:none;filter:none}
        .btn-g{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:13px 24px;border-radius:13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(237,240,247,0.75);font-weight:600;font-size:0.92rem;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.2s;width:100%}
        .btn-g:hover{background:rgba(255,255,255,0.08);color:#edf0f7}
      `}</style>

      {/* Nav */}
      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg viewBox="0 0 1024 1024" width={24} height={24}><defs><linearGradient id="pl" x1="320" y1="232" x2="692" y2="792" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#a855f7"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs><path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#pl)"/></svg>
          <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.9rem", color: "#edf0f7" }}>EasyBuilda</span>
        </a>
        <div style={{ flex: 1 }} />
        {status?.is_pro ? (
          <a href="/dashboard" style={{ fontSize: "0.84rem", color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Dashboard →</a>
        ) : (
          <a href="/auth/login" style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", textDecoration: "none" }}>Sign in</a>
        )}
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56, animation: "fadeUp 0.4s ease both" }}>
          <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#7c3aed", marginBottom: 12 }}>Pricing</p>
          <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.03em", marginBottom: 12 }}>
            Simple, fair pricing.
          </h1>
          <p style={{ fontSize: "0.96rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            Start free for 7 days. Pay only when you're ready — and only for the leads you get.
          </p>
        </div>

        {/* Status banner */}
        {status && !loading && (
          <>
            {status.is_trial && status.days_left !== null && (
              <div style={{ marginBottom: 28, padding: "12px 20px", borderRadius: 13, background: status.days_left <= 3 ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.08)", border: `1px solid ${status.days_left <= 3 ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: status.days_left <= 3 ? "#f87171" : "#fbbf24", fontWeight: 600 }}>
                  {status.days_left <= 3 ? `⚠️ Only ${status.days_left} day${status.days_left !== 1 ? "s" : ""} left in your trial!` : `✓ Trial active — ${status.days_left} days remaining`}
                </p>
                <a href="/wallet/topup" style={{ fontSize: "0.82rem", fontWeight: 700, color: status.days_left <= 3 ? "#f87171" : "#fbbf24", textDecoration: "none", whiteSpace: "nowrap" }}>Add funds →</a>
              </div>
            )}
            {status.is_expired && (
              <div style={{ marginBottom: 28, padding: "12px 20px", borderRadius: 13, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#f87171", fontWeight: 600 }}>
                  Your trial has ended — add funds to activate Pro and resume your agent.
                </p>
                <a href="/wallet/topup" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f87171", textDecoration: "none", whiteSpace: "nowrap" }}>Add funds →</a>
              </div>
            )}
          </>
        )}

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>

          {/* Trial */}
          <div style={{ padding: "32px 28px", borderRadius: 20, border: `1px solid ${line}`, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}>
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(237,240,247,0.45)", marginBottom: 10 }}>Trial</p>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.5rem", color: "#edf0f7" }}>Free</span>
            </div>
            <p style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", lineHeight: 1.6, marginBottom: 24 }}>
              7 days to try everything. No credit card. Agent pauses after trial.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28, flex: 1 }}>
              {["1 AI agent", "Unlimited conversations", "Leads collected automatically", "7-day full access"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <div style={{ color: "#34d399", marginTop: 2, flexShrink: 0 }}><Icon d={IC.check} size={14} color="#34d399" /></div>
                  <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.7)" }}>{f}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <div style={{ color: "#f87171", marginTop: 2, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.4)" }}>Agent pauses after 7 days</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <div style={{ color: "#f87171", marginTop: 2, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.4)" }}>One trial per email — ever</span>
              </div>
            </div>
            <a href={trialCTA.href} className="btn-g" style={{ opacity: trialCTA.disabled ? 0.5 : 1, pointerEvents: trialCTA.disabled ? "none" : "auto" }}>
              {trialCTA.label}
            </a>
          </div>

          {/* Pro */}
          <div style={{ padding: "32px 28px", borderRadius: 20, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.05)", display: "flex", flexDirection: "column", position: "relative", animation: "fadeUp 0.4s ease both", animationDelay: "0.15s" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 100, background: "linear-gradient(135deg,#7c3aed,#2563eb)", fontSize: "0.72rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
              Recommended
            </div>
            <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#a78bfa", marginBottom: 10 }}>Pro</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 800, fontSize: "2.5rem", color: "#edf0f7" }}>$9</span>
              <span style={{ fontSize: "0.88rem", color: "rgba(237,240,247,0.5)" }}>/month</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "rgba(237,240,247,0.4)", marginBottom: 4 }}>+ pay per lead captured</p>
            <p style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.5)", lineHeight: 1.6, marginBottom: 24 }}>
              Keep your agent live forever. Pay only for the leads your agent captures.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28, flex: 1 }}>
              {[
                "1 AI agent (always live)",
                "Unlimited conversations",
                "All leads — visible & saved",
                "Agent never pauses",
                "Email support",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <div style={{ color: "#34d399", marginTop: 2, flexShrink: 0 }}><Icon d={IC.check} size={14} color="#34d399" /></div>
                  <span style={{ fontSize: "0.84rem", color: "rgba(237,240,247,0.8)" }}>{f}</span>
                </div>
              ))}
              {/* Lead prices */}
              <div style={{ marginTop: 8, padding: "12px 14px", background: "rgba(124,58,237,0.08)", borderRadius: 10, border: "1px solid rgba(124,58,237,0.2)" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.7rem", color: "#a78bfa", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lead pricing</p>
                {[["Cold lead", "$0.10"], ["Warm lead", "$0.30"], ["Hot lead (form fill)", "$1.00"]].map(([t, p]) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(237,240,247,0.6)" }}>{t}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <a href={proCTA.href} className="btn-p" style={{ opacity: proCTA.disabled ? 0.6 : 1, pointerEvents: proCTA.disabled ? "none" : "auto" }}>
              {proCTA.label} {!proCTA.disabled && <Icon d={IC.arrow} size={15} color="#fff" />}
            </a>
            {status && !status.is_pro && (
              <p style={{ textAlign: "center", marginTop: 10, fontSize: "0.74rem", color: "rgba(237,240,247,0.3)" }}>
                Requires wallet balance ≥ $9
              </p>
            )}
          </div>
        </div>

        {/* How billing works */}
        <div style={{ padding: "28px 32px", background: "rgba(255,255,255,0.02)", border: `1px solid ${line}`, borderRadius: 18, marginBottom: 40 }}>
          <p style={{ margin: "0 0 16px", fontSize: "0.78rem", fontWeight: 700, color: "#edf0f7", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>How billing works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
            {[
              { n: "①", t: "Add funds", d: "Bank transfer or PayPal. Reviewed within 2-4 hours." },
              { n: "②", t: "Activate Pro", d: "$9 is deducted from your wallet immediately." },
              { n: "③", t: "Leads auto-deduct", d: "Every lead captured is billed from your balance." },
              { n: "④", t: "Stay live", d: "Keep your wallet topped up and your agent never stops." },
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
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ textAlign: "center", marginBottom: 24, fontSize: "0.78rem", color: "rgba(237,240,247,0.38)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Common questions</p>
          {[
            { q: "Can I try before paying?", a: "Yes — 7 days free, no credit card. Your agent works fully during the trial." },
            { q: "What happens when the trial ends?", a: "Your agent pauses. Your leads stay safe. Add funds and activate Pro to resume — it takes 1 minute." },
            { q: "Can I use the same email for another trial?", a: "No. One trial per email, ever. This keeps things fair for everyone." },
            { q: "What if my wallet runs out?", a: "Your agent pauses automatically. Add funds and it resumes immediately — no setup needed." },
            { q: "How do I pay?", a: "Bank transfer (Mashreq Bank Egypt) or PayPal. We review within 2-4 hours and credit your wallet." },
            { q: "What's a hot lead?", a: "A visitor who fills in your lead capture form with their name, phone, or email. The most valuable type." },
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
