"use client";

export default function PrivacyPage() {
  const line = "rgba(237,240,247,0.08)";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-void,#05070f)",
      color: "var(--color-starlight,#edf0f7)",
      fontFamily: "var(--font-sans,'Inter',sans-serif)",
      WebkitFontSmoothing: "antialiased",
    }}>
      {/* Ambient */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-15vh", left: "-8vw", width: "50vw", height: "50vh",
          borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.08),transparent 65%)",
          filter: "blur(40px)",
        }} />
      </div>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>
        {/* Back */}
        <a href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "3rem",
          color: "var(--color-dust,#8891a8)", textDecoration: "none", fontSize: "0.88rem",
          transition: "color .2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight,#edf0f7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust,#8891a8)")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to EasyBuilda
        </a>

        <p style={{
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.7rem",
          textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--color-stellar,#38bdf8)",
          marginBottom: "1rem",
        }}>
          Legal
        </p>

        <h1 style={{
          fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700,
          fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.025em", lineHeight: 1.1,
          marginBottom: "0.5rem",
        }}>
          Privacy Policy
        </h1>

        <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", marginBottom: "3rem" }}>
          Last updated: June 2026
        </p>

        <div style={{ height: 1, background: `linear-gradient(to right,transparent,${line} 30%,${line} 70%,transparent)`, marginBottom: "3rem" }} />

        {/* Short principles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { title: "Your data is yours", body: "We use your business information only to power your AI agent. We don't share it, sell it, or use it for anything else." },
            { title: "No tracking for ads", body: "EasyBuilda doesn't run ads. We don't track you across the web or sell behavioral data to third parties." },
            { title: "Delete anytime", body: "You can delete your agent and all associated data from your dashboard at any time. Deletion is permanent and complete." },
            { title: "Visitor conversations", body: "Chat conversations between your agent and your visitors are stored to power lead capture and analytics. You own them. We process them only on your behalf." },
          ].map((item) => (
            <div key={item.title} style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${line}`,
              borderRadius: 14, padding: "1.25rem 1.4rem",
            }}>
              <h3 style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 600, fontSize: "0.97rem", color: "var(--color-starlight,#edf0f7)", marginBottom: "0.4rem" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-dust,#8891a8)", lineHeight: 1.65 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder note */}
        <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 16, padding: "1.5rem 1.75rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.92rem", lineHeight: 1.7 }}>
            Full legal privacy policy coming before launch. The principles above reflect how we operate right now.
          </p>
          <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", marginTop: "0.75rem" }}>
            Questions?{" "}
            <a href="mailto:support@easybuilda.com" style={{ color: "var(--color-stellar,#38bdf8)" }}>
              support@easybuilda.com
            </a>
          </p>
        </div>

        <div style={{ marginTop: "3rem", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/terms" style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight,#edf0f7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust,#8891a8)")}
          >
            Terms of Service →
          </a>
          <a href="/pricing" style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight,#edf0f7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust,#8891a8)")}
          >
            Pricing →
          </a>
        </div>
      </main>
    </div>
  );
}