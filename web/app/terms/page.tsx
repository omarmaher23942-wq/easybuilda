"use client";

export default function TermsPage() {
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
          position: "absolute", top: "-15vh", right: "-8vw", width: "50vw", height: "50vh",
          borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.10),transparent 65%)",
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
          textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--color-nebula,#7c3aed)",
          marginBottom: "1rem",
        }}>
          Legal
        </p>

        <h1 style={{
          fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700,
          fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.025em", lineHeight: 1.1,
          marginBottom: "0.5rem",
        }}>
          Terms of Service
        </h1>

        <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", marginBottom: "3rem" }}>
          Last updated: June 2026
        </p>

        <div style={{ height: 1, background: `linear-gradient(to right,transparent,${line} 30%,${line} 70%,transparent)`, marginBottom: "3rem" }} />

        {/* Placeholder content */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${line}`, borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.1rem", fontWeight: 600,
            color: "var(--color-starlight,#edf0f7)", marginBottom: "0.9rem",
          }}>
            Full terms coming before launch
          </p>
          <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.92rem", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 1.5rem" }}>
            We&apos;re working with our legal team to finalize the terms. In the meantime: we don&apos;t sell your data, you own your content, and you can cancel anytime.
          </p>
          <p style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem" }}>
            Questions?{" "}
            <a href="mailto:omarmaher23942@gmail.com" style={{ color: "var(--color-stellar,#38bdf8)" }}>
              omarmaher23942@gmail.com
            </a>
          </p>
        </div>

        <div style={{ marginTop: "3rem", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/privacy" style={{ color: "var(--color-dust,#8891a8)", fontSize: "0.88rem", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-starlight,#edf0f7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-dust,#8891a8)")}
          >
            Privacy Policy →
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