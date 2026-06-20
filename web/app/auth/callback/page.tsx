"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function Inner() {
  const params  = useSearchParams();
  const refCode = params.get("ref") || "";
  const next    = params.get("next") || "";

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        const { data: d2 } = await sb.auth.exchangeCodeForSession(window.location.href).catch(() => ({ data: null }));
        if (!d2?.session) { window.location.href = "/auth/login"; return; }

        if (refCode && d2.session.access_token) {
          await fetch(`${API}/api/referral/use`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${d2.session.access_token}` },
            body: JSON.stringify({ code: refCode }),
          }).catch(() => {});
        }
        // New user → onboarding
        window.location.href = next || "/onboarding";
        return;
      }
      // Check if new user (no agents yet) → onboarding
      if (refCode && data.session.access_token) {
        await fetch(`${API}/api/referral/use`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
          body: JSON.stringify({ code: refCode }),
        }).catch(() => {});
      }
      if (next) { window.location.href = next; return; }
      // Check if they have agents
      const r = await fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${data.session.access_token}` } }).catch(() => null);
      const d = r?.ok ? await r.json() : null;
      const hasAgents = d?.agents?.length > 0;
      window.location.href = hasAgents ? "/dashboard" : "/onboarding";
    });
  }, [refCode, next]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#05070f", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite" }}/>
      <p style={{ color: "rgba(237,240,247,0.4)", fontSize: "0.84rem", fontFamily: "var(--font-sans,'Inter',sans-serif)" }}>Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#05070f" }}/>}>
      <Inner/>
    </Suspense>
  );
}
