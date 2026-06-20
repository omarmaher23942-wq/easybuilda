"use client";

import { use, useEffect } from "react";

// Payment page now redirects to wallet topup
// Users top up wallet first, then the subscription is deducted automatically

export default function PaymentPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = use(params);

  const prices: Record<string, number> = {
    basic: 29,
    pro:   69,
  };

  const price = prices[plan];

  useEffect(() => {
    if (!price) {
      window.location.href = "/pricing";
      return;
    }
    // Redirect to wallet topup with plan context
    window.location.href = `/wallet/topup?amount=${price}&plan=${plan}`;
  }, [plan, price]);

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