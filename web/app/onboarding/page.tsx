"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

const STEPS = [
  { id: 1, title: "Welcome to EasyBuilda", desc: "Let's set up your account in 30 seconds." },
  { id: 2, title: "What's your business?",  desc: "Tell us what you do so we can personalize your experience." },
  { id: 3, title: "You're all set",          desc: "Your account is ready. Let's build your first AI agent." },
];

export default function OnboardingPage() {
  const [step,     setStep]     = useState(1);
  const [industry, setIndustry] = useState("");
  const [name,     setName]     = useState("");
  const [token,    setToken]    = useState("");
  const [saving,   setSaving]   = useState(false);

  const INDUSTRIES = [
    "Restaurant / Cafe", "Medical / Dental Clinic", "Real Estate",
    "Law Firm", "E-Commerce", "Coaching / Consulting",
    "Beauty / Salon", "Hotel / Hospitality", "Education",
    "Accounting / Finance", "Other",
  ];

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      const meta = data.session.user.user_metadata;
      if (meta?.full_name) setName(meta.full_name);
    });
  }, []);

  const finish = async () => {
    setSaving(true);
    // Could save onboarding data here
    window.location.href = "/build";
  };

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight: "100vh", background: "#05070f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", backgroundImage: "radial-gradient(700px 500px at 60% 20%,rgba(124,58,237,0.1),transparent 65%)" }}>

        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 480, marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: step > s.id ? "linear-gradient(135deg,#7c3aed,#2563eb)" : step === s.id ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)", border: `2px solid ${step >= s.id ? "#7c3aed" : "rgba(255,255,255,0.1)"}`, transition: "all 0.3s" }}>
                  {step > s.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: step === s.id ? "#a78bfa" : "rgba(255,255,255,0.25)" }}>{s.id}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > s.id ? "#7c3aed" : "rgba(255,255,255,0.07)", borderRadius: 99, transition: "background 0.3s" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{ width: "100%", maxWidth: 480, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(237,240,247,0.08)", borderRadius: 22, padding: "2.5rem 2rem", animation: "fadeUp 0.35s ease both" }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>
                <svg viewBox="0 0 1024 1024" width={36} height={36}><defs><linearGradient id="obLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.9"/><stop offset="1" stopColor="#fff" stopOpacity="0.5"/></linearGradient></defs><path d="M320 232L428 232L428 792L320 792ZM320 232L692 232L670 319L320 336ZM320 462L610 462L591 546L320 562ZM320 688L670 705L692 792L320 792Z" fill="url(#obLogo)"/></svg>
              </div>
              <h1 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.6rem", color: "#edf0f7", marginBottom: 8 }}>
                Welcome{name ? `, ${name.split(" ")[0]}` : ""}!
              </h1>
              <p style={{ fontSize: "0.92rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.65, marginBottom: "2rem" }}>
                You're moments away from having an AI agent answer customers, capture leads, and grow your business 24/7.
              </p>
              <button onClick={() => setStep(2)} style={{ width: "100%", padding: "0.9rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}>
                Get started →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.3rem", color: "#edf0f7", marginBottom: 6 }}>What industry are you in?</h2>
              <p style={{ fontSize: "0.86rem", color: "rgba(237,240,247,0.5)", marginBottom: "1.5rem" }}>We'll personalize your agent setup based on your industry.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
                {INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => setIndustry(ind)}
                    style={{ padding: "10px 12px", borderRadius: 11, border: `1.5px solid ${industry === ind ? "rgba(124,58,237,0.6)" : "rgba(237,240,247,0.1)"}`, background: industry === ind ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)", color: industry === ind ? "#edf0f7" : "rgba(237,240,247,0.6)", fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                    {ind}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} disabled={!industry}
                style={{ width: "100%", padding: "0.9rem", borderRadius: 13, background: !industry ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: !industry ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.5rem", color: "#edf0f7", marginBottom: 8 }}>Account ready!</h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(237,240,247,0.55)", lineHeight: 1.65, marginBottom: "2rem" }}>
                Now let's build your first AI agent. It takes about 2 minutes and our AI will guide you through it.
              </p>
              <button onClick={finish} disabled={saving}
                style={{ width: "100%", padding: "0.9rem", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 0 24px rgba(124,58,237,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? (
                  <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }}/> Please wait…</>
                ) : "Build my first AI agent →"}
              </button>
              <a href="/dashboard" style={{ display: "block", marginTop: "1rem", fontSize: "0.8rem", color: "rgba(237,240,247,0.35)", textDecoration: "none" }}>
                Skip for now → Go to dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
