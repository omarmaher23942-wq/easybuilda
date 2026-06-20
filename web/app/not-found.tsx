export default function NotFound() {
    return (
      <div style={{ minHeight:"100vh", background:"#05070f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:24, fontFamily:"var(--font-sans,'Inter',sans-serif)" }}>
        <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"5rem", fontWeight:700, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", lineHeight:1 }}>
          404
        </div>
        <div style={{ textAlign:"center" }}>
          <h1 style={{ margin:"0 0 8px", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1.4rem", color:"#edf0f7" }}>Page not found</h1>
          <p style={{ margin:0, fontSize:"0.9rem", color:"rgba(237,240,247,0.5)" }}>This page doesn't exist or has been moved.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <a href="/" style={{ padding:"0.7rem 1.4rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", fontWeight:700, fontSize:"0.88rem", textDecoration:"none" }}>← Home</a>
          <a href="/dashboard" style={{ padding:"0.7rem 1.4rem", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(237,240,247,0.1)", color:"#edf0f7", fontWeight:600, fontSize:"0.88rem", textDecoration:"none" }}>Dashboard</a>
        </div>
      </div>
    );
  }