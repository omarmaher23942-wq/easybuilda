"use client";

// ──────────────────────────────────────────────────────────────────
// #67 Spatial Dashboard — web/app/spatial/page.tsx
// A visually immersive dashboard with real-time "pulse" visualization
// ──────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/auth";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface Agent { id: string; name: string; subdomain: string; status: string; primary_color?: string; readiness_score?: number; plan: string; }
interface Profile { full_name: string; plan: string; }
interface Wallet  { balance: number; }

function AgentOrb({ agent, index }: { agent: Agent; index: number }) {
  const color = agent.primary_color || "#7c3aed";
  const h     = color.replace("#","");
  const rgb   = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const pct   = agent.readiness_score ?? 0;
  const isActive = agent.status === "active";
  const angle = (index * 137.5) % 360; // golden angle distribution
  const radius= 140 + (index % 3) * 40;
  const x     = 50 + (radius / 4) * Math.cos(angle * Math.PI / 180);
  const y     = 50 + (radius / 6) * Math.sin(angle * Math.PI / 180);

  return (
    <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer"
      style={{ position:"absolute", left:`${Math.max(5,Math.min(85,x))}%`, top:`${Math.max(10,Math.min(80,y))}%`, transform:"translate(-50%,-50%)", textDecoration:"none", zIndex:2 }}>
      <div style={{ position:"relative" }}>
        {isActive && (
          <div style={{ position:"absolute", inset:-12, borderRadius:"50%", background:`radial-gradient(circle,rgba(${rgb},0.2),transparent 70%)`, animation:"orbPulse 3s ease-in-out infinite", animationDelay:`${index*0.4}s` }}/>
        )}
        <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${color},#22d3ee)`, boxShadow:`0 0 ${isActive?24:8}px rgba(${rgb},${isActive?0.6:0.2})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:16, color:"#fff", border:isActive?`2px solid rgba(${rgb},0.4)`:"2px solid rgba(255,255,255,0.1)", transition:"all 0.3s" }}>
          {(agent.name||"AI").slice(0,2).toUpperCase()}
        </div>
        <div style={{ position:"absolute", bottom:-24, left:"50%", transform:"translateX(-50%)", whiteSpace:"nowrap", fontSize:"0.62rem", color:"rgba(237,240,247,0.6)", fontFamily:"var(--font-mono)" }}>
          {agent.name}
        </div>
      </div>
    </a>
  );
}

export default function SpatialDashboard() {
  const [profile, setProfile] = useState<Profile|null>(null);
  const [agents,  setAgents]  = useState<Agent[]>([]);
  const [wallet,  setWallet]  = useState<Wallet|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      const tok = data.session.access_token;
      Promise.all([
        fetch(`${API}/api/auth/me`,   { headers: { Authorization: `Bearer ${tok}` } }).then(r=>r.json()),
        fetch(`${API}/api/agents/me`, { headers: { Authorization: `Bearer ${tok}` } }).then(r=>r.json()),
        fetch(`${API}/api/wallet`,    { headers: { Authorization: `Bearer ${tok}` } }).then(r=>r.json()),
      ]).then(([p,a,w]) => {
        setProfile(p.profile ?? p);
        setAgents(a.agents ?? []);
        setWallet(w);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const active = agents.filter(a => a.status === "active").length;
  const bal    = wallet?.balance ?? 0;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#030408" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes orbPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.3);opacity:1}}
        @keyframes rotate{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        body{margin:0;overflow:hidden}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#030408", color:"#edf0f7", fontFamily:"var(--font-sans,'Inter',sans-serif)", overflow:"hidden", position:"relative", animation:"fadeIn 0.5s ease both" }}>

        {/* Background grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(124,58,237,0.06) 1px, transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 50%, transparent 30%, #030408 75%)", pointerEvents:"none" }}/>

        {/* Central orb */}
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:120, height:120, zIndex:1 }}>
          <div style={{ position:"absolute", inset:-30, borderRadius:"50%", border:"1px solid rgba(124,58,237,0.12)", animation:"rotate 20s linear infinite" }}/>
          <div style={{ position:"absolute", inset:-60, borderRadius:"50%", border:"1px solid rgba(124,58,237,0.06)", animation:"rotate 35s linear infinite reverse" }}/>
          <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.3),rgba(37,99,235,0.15),transparent)", boxShadow:"0 0 60px rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.7rem", color:"rgba(237,240,247,0.5)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Active</div>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2rem", color:"#edf0f7", lineHeight:1 }}>{active}</div>
            </div>
          </div>
        </div>

        {/* Agent orbs */}
        {agents.map((agent, i) => <AgentOrb key={agent.id} agent={agent} index={i}/>)}

        {/* Empty state */}
        {agents.length === 0 && (
          <div style={{ position:"absolute", left:"50%", top:"60%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
            <p style={{ fontSize:"0.88rem", color:"rgba(237,240,247,0.4)", marginBottom:16 }}>No agents yet</p>
            <a href="/build" style={{ padding:"9px 20px", borderRadius:11, background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:"#a78bfa", textDecoration:"none", fontSize:"0.84rem", fontWeight:600 }}>Build your first agent →</a>
          </div>
        )}

        {/* Top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", background:"linear-gradient(to bottom,rgba(3,4,8,0.9),transparent)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>E</div>
            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.82rem", color:"#edf0f7" }}>Spatial View</span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <a href="/dashboard" style={{ padding:"5px 12px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.74rem" }}>Classic View</a>
            <a href="/os" style={{ padding:"5px 12px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(237,240,247,0.5)", textDecoration:"none", fontSize:"0.74rem" }}>OS View</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", background:"linear-gradient(to top,rgba(3,4,8,0.9),transparent)" }}>
          <span style={{ fontSize:"0.78rem", color:"rgba(237,240,247,0.4)" }}>
            {profile?.full_name?.split(" ")[0] || "Dashboard"} · {profile?.plan}
          </span>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <span style={{ fontSize:"0.78rem", color:bal<5?"#fbbf24":"#34d399", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)" }}>
              ${bal.toFixed(2)} wallet
            </span>
            <a href="/build" style={{ padding:"7px 16px", borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", textDecoration:"none", fontSize:"0.8rem", fontWeight:700 }}>
              + New agent
            </a>
          </div>
        </div>
      </div>
    </>
  );
}