"use client";

import { useEffect } from "react";

// The old plan-based payment page is gone — there is no Basic/Pro tier
// anymore. Any link that still points here (old bookmarks, old emails)
// just gets sent straight to the wallet top-up page.

export default function PaymentPage() {
  useEffect(() => {
    window.location.href = "/wallet/topup";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--color-dust)", fontSize: "0.88rem" }}>Redirecting to wallet…</p>
      </div>
    </div>
  );
}