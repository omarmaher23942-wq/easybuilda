"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PAYPAL_EMAIL = "Ahmedmaher1728399"; // ← غيّره لإيميلك
const PAYPAL_NAME  = "Ahmed Maher Abdel Aziz Mahmoud Abdel Galil";
const PLANS = [
  { id: "basic",  name: "Basic",      price: 49,  period: "/mo", color: "#7c3aed" },
  { id: "pro",    name: "Pro",        price: 129, period: "/mo", color: "#38bdf8", popular: true },
  { id: "max",    name: "Max",        price: 299, period: "/mo", color: "#22d3ee" },
  { id: "singularity", name: "Singularity", price: 699, period: "/mo", color: "#fbbf24" },
];

interface UpgradeModalProps {
  onClose: () => void;
  accessToken: string;
}

export function UpgradeModal({ onClose, accessToken }: UpgradeModalProps) {
  const [step, setStep] = useState<"pick" | "pay" | "confirm" | "done">("pick");
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // Pro default
  const [payerName, setPayerName] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const line = "rgba(237,240,247,0.09)";
  const lineBright = "rgba(237,240,247,0.15)";

  // ── Step 1: Pick plan ─────────────────────────────────────────────────────
  if (step === "pick") {
    return (
      <Overlay onClose={onClose}>
        <ModalCard>
          <h2 style={titleStyle}>Upgrade your plan</h2>
          <p style={subStyle}>Choose the plan that fits your business.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "1.5rem 0" }}>
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.9rem 1.1rem", borderRadius: 12, cursor: "pointer",
                  background: selectedPlan.id === plan.id ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedPlan.id === plan.id ? plan.color : line}`,
                  transition: "all .2s", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "0.97rem", color: plan.color }}>
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span style={{ fontSize: "0.62rem", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(56,189,248,0.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.22)", borderRadius: 999, padding: "0.15rem 0.55rem" }}>
                      popular
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "1.1rem", color: "#edf0f7" }}>
                  ${plan.price}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#8891a8" }}>{plan.period}</span>
                </span>
              </button>
            ))}
          </div>

          <PrimaryBtn onClick={() => setStep("pay")}>
            Continue with {selectedPlan.name} — ${selectedPlan.price}/mo →
          </PrimaryBtn>
        </ModalCard>
      </Overlay>
    );
  }

  // ── Step 2: Payment instructions ─────────────────────────────────────────
  if (step === "pay") {
    return (
      <Overlay onClose={onClose}>
        <ModalCard>
          <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
          <h2 style={titleStyle}>Send ${selectedPlan.price} on PayPal</h2>

          {/* PayPal info box */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${lineBright}`, borderRadius: 14, padding: "1.2rem 1.4rem", margin: "1.25rem 0" }}>
            <p style={{ fontSize: "0.82rem", color: "#8891a8", marginBottom: "0.5rem", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              PayPal email
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#edf0f7", letterSpacing: "-0.01em", marginBottom: "1rem" }}>
              {PAYPAL_EMAIL}
            </p>
            <div style={{ height: 1, background: line, marginBottom: "1rem" }} />
            <p style={{ fontSize: "0.88rem", color: "#8891a8", lineHeight: 1.65 }}>
              Amount: <strong style={{ color: "#edf0f7" }}>${selectedPlan.price} USD</strong>
              <br />
              Note: <strong style={{ color: "#edf0f7" }}>EasyBuilda {selectedPlan.name}</strong>
            </p>
          </div>

          <p style={{ fontSize: "0.88rem", color: "#8891a8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            After sending the money, click below and fill in your name and payment date. We'll upgrade your account within 24 hours.
          </p>

          <PrimaryBtn onClick={() => setStep("confirm")}>
            I've sent the payment →
          </PrimaryBtn>
        </ModalCard>
      </Overlay>
    );
  }

  // ── Step 3: Confirm details ───────────────────────────────────────────────
  if (step === "confirm") {
    const handleSubmit = async () => {
      if (!payerName.trim()) { setError("Please enter your name as it appears on PayPal."); return; }
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/payments/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
          body: JSON.stringify({ plan: selectedPlan.id, payer_name: payerName.trim(), paid_at: paidAt, note }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Something went wrong");
        setStep("done");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Overlay onClose={onClose}>
        <ModalCard>
          <button onClick={() => setStep("pay")} style={backBtn}>← Back</button>
          <h2 style={titleStyle}>Confirm your payment</h2>
          <p style={subStyle}>Just a couple of details so we can verify your payment.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "1.5rem 0" }}>
            <Field label="Your name on PayPal *">
              <input
                type="text" placeholder="e.g. Ahmed Hassan" value={payerName}
                onChange={e => setPayerName(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Date you sent the payment *">
              <input
                type="date" value={paidAt}
                onChange={e => setPaidAt(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Anything else? (optional)">
              <input
                type="text" placeholder="Transaction ID, notes..." value={note}
                onChange={e => setNote(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          {error && (
            <p style={{ color: "#f87171", fontSize: "0.88rem", marginBottom: "1rem", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "0.6rem 0.9rem" }}>
              {error}
            </p>
          )}

          <PrimaryBtn onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : `Submit — ${selectedPlan.name} $${selectedPlan.price}/mo`}
          </PrimaryBtn>
        </ModalCard>
      </Overlay>
    );
  }

  // ── Step 4: Done ──────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      <ModalCard>
        {/* Success orb */}
        <div aria-hidden="true" style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.5rem",
          background: "radial-gradient(circle at 40% 38%, rgba(216,180,254,0.9), rgba(124,58,237,0.55) 40%, transparent 72%), radial-gradient(circle at 65% 65%, rgba(56,189,248,0.7), transparent 60%)",
          boxShadow: "0 0 50px rgba(124,58,237,0.4)",
          animation: "orb-breathe 4s ease-in-out infinite",
        }} />

        <style>{`@keyframes orb-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}`}</style>

        <h2 style={{ ...titleStyle, textAlign: "center" }}>Payment submitted ✓</h2>
        <p style={{ ...subStyle, textAlign: "center", marginBottom: "2rem" }}>
          We received your payment request for <strong style={{ color: "#edf0f7" }}>{selectedPlan.name}</strong>.
          Your account will be upgraded within <strong style={{ color: "#edf0f7" }}>24 hours</strong>.
          <br /><br />
          Questions? Email <a href="mailto:support@easybuilda.com" style={{ color: "#38bdf8" }}>support@easybuilda.com</a>
        </p>
        <PrimaryBtn onClick={onClose}>Back to dashboard</PrimaryBtn>
      </ModalCard>
    </Overlay>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(5,7,15,0.82)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      {children}
    </div>
  );
}

function ModalCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: "100%", maxWidth: 460,
      background: "rgba(11,15,26,0.97)",
      border: "1px solid rgba(237,240,247,0.12)",
      borderRadius: 20, padding: "2rem",
      boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
      maxHeight: "90vh", overflowY: "auto",
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ onClick, children, disabled = false }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "0.85rem 1.2rem", borderRadius: 12, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#2563eb 55%,#0ea5e9)",
        color: "#fff", fontFamily: "var(--font-display,'Sora',sans-serif)",
        fontWeight: 600, fontSize: "0.94rem", transition: "filter .2s, transform .2s",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.82rem", color: "#8891a8", marginBottom: "0.4rem", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700,
  fontSize: "1.35rem", letterSpacing: "-0.02em", color: "#edf0f7",
  marginBottom: "0.5rem",
};
const subStyle: React.CSSProperties = {
  fontSize: "0.9rem", color: "#8891a8", lineHeight: 1.6,
};
const backBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#8891a8", cursor: "pointer",
  fontSize: "0.85rem", padding: 0, marginBottom: "1.2rem", display: "block",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 0.9rem", borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(237,240,247,0.12)",
  color: "#edf0f7", fontSize: "0.92rem", outline: "none",
  fontFamily: "var(--font-sans,'Inter',sans-serif)",
  boxSizing: "border-box",
};