"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/auth";
import { AgentEditor } from "@/components/AgentEditor";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/* ── Types ─────────────────────────────────────────────────────── */
interface Agent {
  id: string; name: string; business_name: string; subdomain: string;
  status: string; primary_color?: string; plan: string;
  readiness_score?: number; leads_pin?: string; created_at: string; tagline?: string;
}
interface Profile {
  id: string; full_name: string; email: string; plan: string;
  trial_ends_at?: string; billing_end?: string; period_agents_created?: number;
  referral_code?: string; referral_count?: number;
}
interface Wallet {
  balance: number; currency: string;
  pending_topup?: { amount: number; status: string } | null;
}
interface Notification {
  id: string; type: string; title: string; body: string;
  action_url?: string; action_label?: string; read: boolean; created_at: string;
}
interface SupportMsg { id: string; from_admin: boolean; message: string; created_at: string; }
interface WalletTx {
  id: string; type: string; amount: number; balance_after: number;
  description: string; created_at: string;
}

/* ── Icons ──────────────────────────────────────────────────────── */
function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bell":      return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "agent":     return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "card":      return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "support":   return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "wallet":    return <svg {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
    case "plus":      return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "trash":     return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case "back":      return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case "send":      return <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "star":      return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "zap":       return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "eye":       return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off":   return <svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    case "arrow-up":  return <svg {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
    case "arrow-down":return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
    case "copy":      return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "trending":  return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case "dna":       return <svg {...p}><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.197 3-5"/><path d="M2 9c6.667-6 13.333 0 20-6"/><path d="M9 2c1.798 1.998 2.518 3.197 3 5"/><path d="M15 2c-1.798 1.998-2.518 3.197-3 5"/><path d="M15 22c-1.798-1.998-2.518-3.197-3-5"/></svg>;
    case "brain":     return <svg {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2-2.94 3 3 0 0 1-1-5.58 2.5 2.5 0 0 1 1.32-4.97A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2-2.94 3 3 0 0 0 1-5.58 2.5 2.5 0 0 0-1.32-4.97A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
    case "users":     return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "gift":      return <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "check":     return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "flywheel":  return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 0 .5-2.6"/><polyline points="3 4 3 11 10 11"/></svg>;
    default:          return null;
  }
}

/* ── Plan helpers ───────────────────────────────────────────────── */
const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  trial:   { label: "Trial",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  basic:   { label: "Basic",   color: "#38bdf8", bg: "rgba(56,189,248,0.1)"  },
  pro:     { label: "Pro",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)"},
  max:     { label: "Max",     color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  expired: { label: "Expired", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  admin:   { label: "Admin",   color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
};
const PLAN_LIMITS: Record<string, number> = { trial:1, basic:1, pro:2, max:3, admin:99 };
function planMeta(plan: string) { return PLAN_META[plan] ?? { label: plan, color: "var(--color-dust)", bg: "rgba(255,255,255,0.05)" }; }
function daysLeft(date?: string) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
const TX_LABELS: Record<string,string> = { topup:"Top-up", subscription:"Subscription", cold_lead:"Cold lead", hot_lead:"Hot lead", setup_fee:"Setup fee", refund:"Refund" };

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ label, value, icon, sub, color="124,58,237" }: { label:string; value:string|number; icon:string; sub?:string; color?:string }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--line)", borderRadius:16, padding:"18px 20px", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"0.72rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>{label}</span>
        <div style={{ width:32, height:32, borderRadius:9, background:`rgba(${color},0.12)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic name={icon} size={15} color={`rgb(${color})`}/>
        </div>
      </div>
      <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.5rem", color:"var(--color-starlight)", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:"0.7rem", color:"var(--color-dust)" }}>{sub}</div>}
    </div>
  );
}

/* ── FOMO Benchmark (#54) ───────────────────────────────────────── */
function FomoBenchmark({ plan, agentCount }: { plan: string; agentCount: number }) {
  const benchmarks = [
    { industry:"Restaurant", avgLeads:47, avgConv:"12%" },
    { industry:"Medical Clinic", avgLeads:38, avgConv:"18%" },
    { industry:"Real Estate", avgLeads:62, avgConv:"9%" },
    { industry:"Law Firm", avgLeads:29, avgConv:"22%" },
    { industry:"E-Commerce", avgLeads:94, avgConv:"7%" },
  ];
  const selected = benchmarks[Math.floor(Math.random() * benchmarks.length)];

  return (
    <div style={{ background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <Ic name="trending" size={16} color="#fbbf24"/>
        <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono)", color:"#fbbf24", letterSpacing:"0.1em", textTransform:"uppercase" }}>Industry Benchmark</span>
      </div>
      <p style={{ margin:"0 0 10px", fontSize:"0.85rem", color:"var(--color-starlight)", lineHeight:1.6 }}>
        Businesses in <strong style={{ color:"#fbbf24" }}>{selected.industry}</strong> using AI agents capture on average{" "}
        <strong style={{ color:"#fbbf24" }}>{selected.avgLeads} leads/month</strong> with a{" "}
        <strong style={{ color:"#fbbf24" }}>{selected.avgConv}</strong> conversion rate.
      </p>
      {agentCount === 0 && (
        <a href="/build" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontSize:"0.78rem", fontWeight:700, textDecoration:"none" }}>
          Start capturing leads →
        </a>
      )}
    </div>
  );
}

/* ── Agent DNA (#61) ────────────────────────────────────────────── */
function AgentDNA({ agent }: { agent: Agent }) {
  const pct   = agent.readiness_score ?? 0;
  const color = agent.primary_color || "#7c3aed";
  const traits = [
    { label:"Knowledge",    score: Math.min(100, pct + 5),         color:"#a78bfa" },
    { label:"Persuasion",   score: Math.min(100, pct - 10 + 15),   color:"#38bdf8" },
    { label:"Empathy",      score: Math.min(100, pct + 8),          color:"#34d399" },
    { label:"Lead Capture", score: Math.min(100, pct - 5),          color:"#fbbf24" },
  ];
  return (
    <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:14, marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <Ic name="dna" size={14} color={color}/>
        <span style={{ fontSize:"0.7rem", fontFamily:"var(--font-mono)", color:"var(--color-dust)", letterSpacing:"0.08em", textTransform:"uppercase" }}>Agent DNA</span>
      </div>
      {traits.map(t => (
        <div key={t.label} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:"0.7rem", color:"var(--color-dust)" }}>{t.label}</span>
            <span style={{ fontSize:"0.7rem", color:t.color, fontFamily:"var(--font-mono)", fontWeight:700 }}>{t.score}%</span>
          </div>
          <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
            <div style={{ height:"100%", borderRadius:2, background:t.color, width:`${t.score}%`, transition:"width 1s cubic-bezier(0.22,1,0.36,1)" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Growth Flywheel (#63) ──────────────────────────────────────── */
function GrowthFlywheel({ agentCount, leads }: { agentCount: number; leads: number }) {
  const steps = [
    { icon:"🤖", label:"AI Agent", desc:"Handles visitors 24/7", done: agentCount > 0 },
    { icon:"🎯", label:"Capture Leads", desc:"Collects contact info", done: leads > 0 },
    { icon:"📈", label:"Convert", desc:"Turn leads into customers", done: leads >= 5 },
    { icon:"🚀", label:"Scale", desc:"More agents, more growth", done: agentCount >= 2 },
  ];
  return (
    <div style={{ background:"rgba(124,58,237,0.05)", border:"1px solid rgba(124,58,237,0.18)", borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <Ic name="flywheel" size={15} color="var(--color-nebula)"/>
        <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono)", color:"var(--color-nebula)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Growth Flywheel</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:0 }}>
        {steps.map((s,i) => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ width:40, height:40, borderRadius:12, margin:"0 auto 6px", background:s.done?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.04)", border:`1.5px solid ${s.done?"rgba(52,211,153,0.35)":"var(--line)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, transition:"all 0.3s" }}>
                {s.done ? <Ic name="check" size={16} color="#34d399"/> : s.icon}
              </div>
              <p style={{ margin:0, fontSize:"0.68rem", fontWeight:600, color:s.done?"#34d399":"var(--color-dust)" }}>{s.label}</p>
              <p style={{ margin:"1px 0 0", fontSize:"0.6rem", color:"var(--color-dust)", opacity:0.7, lineHeight:1.3 }}>{s.desc}</p>
            </div>
            {i < steps.length-1 && (
              <div style={{ width:20, height:1, background:steps[i+1].done||s.done?"rgba(52,211,153,0.35)":"var(--line)", flexShrink:0 }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ambient Intelligence (#62) ─────────────────────────────────── */
function AmbientIntel({ agents }: { agents: Agent[] }) {
  const active  = agents.filter(a => a.status === "active");
  const paused  = agents.filter(a => a.status === "inactive");
  const avgScore= agents.length > 0 ? Math.round(agents.reduce((s,a) => s + (a.readiness_score??0), 0) / agents.length) : 0;
  if (agents.length === 0) return null;
  return (
    <div style={{ background:"rgba(56,189,248,0.04)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:16, padding:"16px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <Ic name="brain" size={14} color="#38bdf8"/>
        <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono)", color:"#38bdf8", letterSpacing:"0.1em", textTransform:"uppercase" }}>Ambient Intelligence</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        <div style={{ textAlign:"center", padding:"10px 6px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid var(--line)" }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.4rem", color:"#34d399" }}>{active.length}</div>
          <div style={{ fontSize:"0.62rem", color:"var(--color-dust)" }}>Active</div>
        </div>
        <div style={{ textAlign:"center", padding:"10px 6px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid var(--line)" }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.4rem", color:avgScore>=75?"#34d399":avgScore>=50?"#fbbf24":"#f87171" }}>{avgScore}</div>
          <div style={{ fontSize:"0.62rem", color:"var(--color-dust)" }}>Avg Score</div>
        </div>
        <div style={{ textAlign:"center", padding:"10px 6px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid var(--line)" }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.4rem", color:paused.length>0?"#f87171":"#34d399" }}>{paused.length}</div>
          <div style={{ fontSize:"0.62rem", color:"var(--color-dust)" }}>Paused</div>
        </div>
      </div>
      {paused.length > 0 && (
        <p style={{ margin:"10px 0 0", fontSize:"0.76rem", color:"#f87171" }}>
          {paused.length} agent{paused.length>1?"s":""} paused — <a href="/wallet/topup" style={{ color:"#f87171", fontWeight:700 }}>add funds to resume</a>
        </p>
      )}
    </div>
  );
}

/* ── Referral Program (#55) ─────────────────────────────────────── */
function ReferralCard({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  const code    = profile.referral_code || `EB${profile.id.slice(0,6).toUpperCase()}`;
  const count   = profile.referral_count || 0;
  const link    = `https://easybuilda.com/?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background:"rgba(52,211,153,0.05)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <Ic name="gift" size={15} color="#34d399"/>
        <span style={{ fontSize:"0.72rem", fontFamily:"var(--font-mono)", color:"#34d399", letterSpacing:"0.1em", textTransform:"uppercase" }}>Referral Program</span>
        {count > 0 && <span style={{ padding:"2px 8px", borderRadius:100, background:"rgba(52,211,153,0.15)", color:"#34d399", fontSize:"0.65rem", fontWeight:700, fontFamily:"var(--font-mono)" }}>{count} referred</span>}
      </div>
      <p style={{ margin:"0 0 12px", fontSize:"0.82rem", color:"var(--color-dust)", lineHeight:1.6 }}>
        Refer a business owner — when they sign up and top up, you both get <strong style={{ color:"var(--color-starlight)" }}>$10 wallet credit</strong>.
      </p>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", background:"rgba(0,0,0,0.2)", border:"1px solid var(--line)", borderRadius:10 }}>
        <span style={{ flex:1, fontSize:"0.76rem", color:"var(--color-stellar)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link}</span>
        <button onClick={copy} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8, background:copied?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.06)", border:`1px solid ${copied?"rgba(52,211,153,0.3)":"var(--line)"}`, cursor:"pointer", fontSize:"0.72rem", color:copied?"#34d399":"var(--color-dust)", fontFamily:"var(--font-sans)", flexShrink:0, transition:"all 0.15s" }}>
          {copied ? <><Ic name="check" size={12} color="#34d399"/> Copied!</> : <><Ic name="copy" size={12}/>Copy</>}
        </button>
      </div>
    </div>
  );
}

/* ── Notification Panel ─────────────────────────────────────────── */
function NotifPanel({ notifs, onRead, onClose }: { notifs: Notification[]; onRead: (ids: string[]) => void; onClose: () => void }) {
  const unread = notifs.filter(n => !n.read);
  return (
    <div style={{ position:"fixed", top:60, right:16, width:340, background:"rgba(10,14,26,0.97)", border:"1px solid var(--line)", borderRadius:18, zIndex:100, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", backdropFilter:"blur(20px)", overflow:"hidden" }}>
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.9rem", color:"var(--color-starlight)" }}>Notifications</span>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {unread.length > 0 && <button onClick={() => onRead(unread.map(n=>n.id))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", color:"var(--color-nebula)", fontFamily:"var(--font-sans)" }}>Mark all read</button>}
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-dust)", fontSize:18 }}>×</button>
        </div>
      </div>
      <div style={{ maxHeight:380, overflowY:"auto" }}>
        {notifs.length === 0
          ? <div style={{ padding:32, textAlign:"center", color:"var(--color-dust)", fontSize:"0.82rem" }}>No notifications yet.</div>
          : notifs.map(n => (
            <div key={n.id} style={{ padding:"12px 18px", borderBottom:"1px solid var(--line)", background:n.read?"transparent":"rgba(124,58,237,0.04)", display:"flex", gap:12 }}>
              {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-nebula)", flexShrink:0, marginTop:5 }}/>}
              <div style={{ flex:1, marginLeft:n.read?18:0 }}>
                <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--color-starlight)", marginBottom:3 }}>{n.title}</div>
                <div style={{ fontSize:"0.75rem", color:"var(--color-dust)", lineHeight:1.5 }}>{n.body}</div>
                {n.action_url && <a href={n.action_url} style={{ fontSize:"0.72rem", color:"var(--color-nebula)", textDecoration:"none", marginTop:4, display:"block" }}>{n.action_label||"View →"}</a>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ── Genesis Orb ─────────────────────────────────────────────────── */
function GenesisOrb({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:28, padding:"60px 24px" }}>
      <div style={{ position:"relative", width:160, height:160, cursor:"pointer" }} onClick={onClick}>
        <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:"conic-gradient(from 0deg,transparent,rgba(124,58,237,0.45) 30%,rgba(56,189,248,0.4) 60%,transparent)", filter:"blur(12px)", animation:"spin 5s linear infinite" }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%,rgba(192,132,252,0.9),rgba(124,58,237,0.55) 50%,rgba(37,99,235,0.35) 75%,transparent)", boxShadow:"0 0 60px rgba(124,58,237,0.35)", animation:"breathe 3.5s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4v20M4 14h20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <h2 style={{ margin:"0 0 8px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.35rem", color:"var(--color-starlight)" }}>Build your first agent</h2>
        <p style={{ margin:"0 0 24px", fontSize:"0.86rem", color:"var(--color-dust)", lineHeight:1.6, maxWidth:340 }}>Your AI agent handles customer questions 24/7 — set up in minutes.</p>
        <button className="btn-genesis" onClick={onClick}>Create agent</button>
      </div>
    </div>
  );
}

/* ── Agent Card ─────────────────────────────────────────────────── */
function AgentCard({ agent, onEdit, onDelete, onViewLeads }: { agent:Agent; onEdit:()=>void; onDelete:()=>void; onViewLeads:()=>void }) {
  const [showPin, setShowPin] = useState(false);
  const [showDNA, setShowDNA] = useState(false);
  const color   = agent.primary_color || "#7c3aed";
  const h       = color.replace("#","");
  const rgb     = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
  const pct     = agent.readiness_score ?? 0;
  const health  = pct>=75?"#34d399":pct>=50?"#fbbf24":"#f87171";
  const isPaused= agent.status === "inactive";

  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${isPaused?"rgba(248,113,113,0.2)":"var(--line)"}`, borderRadius:20, overflow:"hidden", transition:"border-color 0.2s", opacity:isPaused?0.8:1 }}
      onMouseEnter={e=>!isPaused&&(e.currentTarget.style.borderColor=`rgba(${rgb},0.4)`)}
      onMouseLeave={e=>(e.currentTarget.style.borderColor=isPaused?"rgba(248,113,113,0.2)":"var(--line)")}>
      <div style={{ height:3, background:isPaused?"rgba(248,113,113,0.4)":`linear-gradient(90deg,${color},#22d3ee)` }}/>
      <div style={{ padding:"18px 20px" }}>
        {isPaused && (
          <div style={{ marginBottom:12, padding:"6px 10px", borderRadius:8, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", fontSize:"0.72rem", color:"#f87171" }}>
            ⏸ Paused — <a href="/wallet/topup" style={{ color:"#f87171", fontWeight:700 }}>Add funds to resume</a>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
          <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:`linear-gradient(135deg,${color},#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:17, color:"#fff" }}>
            {(agent.name||"AI").slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ margin:"0 0 2px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", color:"var(--color-starlight)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name}</h3>
            <p style={{ margin:0, fontSize:"0.76rem", color:"var(--color-dust)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.business_name}</p>
          </div>
          <div style={{ position:"relative", width:40, height:40, flexShrink:0 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
              <circle cx="20" cy="20" r="16" fill="none" stroke={health} strokeWidth="3.5"
                strokeDasharray={`${(pct/100)*2*Math.PI*16} ${2*Math.PI*16}`} strokeLinecap="round" transform="rotate(-90 20 20)"/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, color:health, fontFamily:"var(--font-mono)" }}>{pct}</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 11px", background:"rgba(255,255,255,0.03)", border:"1px solid var(--line)", borderRadius:9, marginBottom:12 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:isPaused?"#f87171":"#34d399", flexShrink:0, boxShadow:`0 0 5px ${isPaused?"#f87171":"#34d399"}` }}/>
          <a href={`/${agent.subdomain}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, fontSize:"0.7rem", color:"var(--color-stellar)", fontFamily:"var(--font-mono)", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            easybuilda.com/{agent.subdomain}
          </a>
        </div>

        {agent.leads_pin && (
          <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>Leads PIN:</span>
            <span style={{ fontFamily:"var(--font-mono)", fontWeight:700, fontSize:"0.84rem", color:showPin?"var(--color-starlight)":"var(--color-dust)", letterSpacing:"0.1em" }}>{showPin?agent.leads_pin:"● ● ● ● ● ●"}</span>
            <button onClick={()=>setShowPin(!showPin)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.66rem", color:"var(--color-nebula)", fontFamily:"var(--font-mono)" }}>{showPin?"hide":"show"}</button>
          </div>
        )}

        {/* Agent DNA toggle */}
        <button onClick={()=>setShowDNA(!showDNA)} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:showDNA?10:12, background:"none", border:"none", cursor:"pointer", fontSize:"0.7rem", color:"var(--color-dust)", fontFamily:"var(--font-sans)", padding:0 }}>
          <Ic name="dna" size={12} color="var(--color-dust)"/>
          Agent DNA {showDNA?"▲":"▼"}
        </button>
        {showDNA && <AgentDNA agent={agent}/>}

        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={onEdit} style={{ flex:2, padding:"8px 0", borderRadius:10, background:`rgba(${rgb},0.1)`, border:`1px solid rgba(${rgb},0.25)`, color, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-sans)" }}>Edit agent</button>
          <button onClick={onViewLeads} style={{ flex:2, padding:"8px 0", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", color:"var(--color-starlight)", fontSize:"0.8rem", cursor:"pointer", fontFamily:"var(--font-sans)" }}>View leads</button>
          <button onClick={onDelete} title="Delete" style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic name="trash" size={14} color="#f87171"/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Support Chat ───────────────────────────────────────────────── */
function SupportTab({ token }: { token: string }) {
  const [msgs,    setMsgs]    = useState<SupportMsg[]>([]);
  const [input,   setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`${API}/api/support/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMsgs(d.messages || [])).catch(() => {});
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const send = async () => {
    if (!input.trim()) return;
    setSending(true);
    const msg = input.trim();
    setInput("");
    if (textRef.current) textRef.current.style.height = "42px";
    try {
      await fetch(`${API}/api/support/message`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({ message:msg }) });
      setMsgs(prev => [...prev, { id:Date.now().toString(), from_admin:false, message:msg, created_at:new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:480, background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--line)", background:"rgba(255,255,255,0.02)" }}>
        <p style={{ margin:0, fontSize:"0.82rem", fontWeight:600, color:"var(--color-starlight)" }}>Support chat</p>
        <p style={{ margin:0, fontSize:"0.7rem", color:"var(--color-dust)" }}>We usually reply within a few hours</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {msgs.length === 0 && <div style={{ textAlign:"center", color:"var(--color-dust)", fontSize:"0.82rem", marginTop:40 }}>Send us a message and we'll get back to you soon.</div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.from_admin?"flex-start":"flex-end", marginBottom:10 }}>
            {m.from_admin && (
              <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, color:"#fff", flexShrink:0, marginRight:8, alignSelf:"flex-end" }}>E</div>
            )}
            <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:m.from_admin?"4px 14px 14px 14px":"14px 4px 14px 14px", background:m.from_admin?"rgba(255,255,255,0.06)":"rgba(124,58,237,0.2)", border:`1px solid ${m.from_admin?"var(--line)":"rgba(124,58,237,0.3)"}`, fontSize:"0.83rem", color:"var(--color-starlight)", lineHeight:1.5 }}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:"12px 14px", borderTop:"1px solid var(--line)", display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea ref={textRef} value={input} onChange={handleInput} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Type your message… (Enter to send)" rows={1}
          style={{ flex:1, padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:10, color:"var(--color-starlight)", fontSize:"0.85rem", fontFamily:"var(--font-sans)", outline:"none", resize:"none", minHeight:42, maxHeight:140, overflowY:"auto", lineHeight:1.5 }}/>
        <button onClick={send} disabled={sending||!input.trim()} style={{ width:40, height:40, borderRadius:10, background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity:!input.trim()?0.4:1 }}>
          <Ic name="send" size={16} color="var(--color-nebula)"/>
        </button>
      </div>
    </div>
  );
}

/* ── Wallet Tab ─────────────────────────────────────────────────── */
function WalletTab({ wallet, transactions }: { wallet:Wallet|null; transactions:WalletTx[] }) {
  const balance = wallet?.balance ?? 0;
  const isLow   = balance < 5 && balance > 0;
  const isEmpty = balance <= 0;
  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${isEmpty?"rgba(248,113,113,0.3)":isLow?"rgba(251,191,36,0.25)":"var(--line)"}`, borderRadius:18, padding:"24px 26px", marginBottom:16 }}>
        <div style={{ fontSize:"0.65rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", letterSpacing:"0.1em", marginBottom:8 }}>WALLET BALANCE</div>
        <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"2.8rem", color:isEmpty?"#f87171":isLow?"#fbbf24":"var(--color-starlight)", lineHeight:1, marginBottom:4 }}>
          ${balance.toFixed(2)}<span style={{ fontSize:"1rem", fontWeight:400, color:"var(--color-dust)", marginLeft:8 }}>USD</span>
        </div>
        {isEmpty && <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", fontSize:"0.78rem", color:"#f87171" }}>🔴 Wallet empty — AI agents are paused. Add funds to resume instantly.</div>}
        {isLow && !isEmpty && <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", fontSize:"0.78rem", color:"#fbbf24" }}>⚠️ Low balance — your agent may pause soon.</div>}
        {wallet?.pending_topup && <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.2)", fontSize:"0.78rem", color:"#38bdf8" }}>🕐 Top-up of ${wallet.pending_topup.amount} pending admin approval.</div>}
        <a href="/wallet/topup" style={{ marginTop:16, display:"inline-flex", alignItems:"center", gap:8, padding:"0.7rem 1.4rem", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", fontWeight:700, fontSize:"0.88rem", textDecoration:"none", boxShadow:"0 0 22px rgba(124,58,237,0.3)" }}>
          <Ic name="plus" size={15} color="#fff"/> Add funds
        </a>
      </div>

      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:14, padding:"14px 18px", marginBottom:16 }}>
        <div style={{ fontSize:"0.7rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)", marginBottom:10, letterSpacing:"0.08em" }}>BILLING RATES</div>
        {[
          { label:"Cold lead (new conversation)", price:"$0.50" },
          { label:"Hot lead (contact captured)",  price:"$2.00" },
          { label:"Basic subscription",           price:"$29/mo" },
          { label:"Pro subscription",             price:"$69/mo" },
        ].map(r=>(
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:6 }}>
            <span style={{ color:"var(--color-dust)" }}>{r.label}</span>
            <span style={{ color:"var(--color-starlight)", fontFamily:"var(--font-mono)", fontWeight:600 }}>{r.price}</span>
          </div>
        ))}
      </div>

      <h3 style={{ margin:"0 0 12px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.9rem", color:"var(--color-starlight)" }}>Transaction history</h3>
      {transactions.length === 0
        ? <div style={{ padding:24, textAlign:"center", color:"var(--color-dust)", fontSize:"0.82rem", background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:12 }}>No transactions yet.</div>
        : (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--line)", borderRadius:14, overflow:"hidden" }}>
            {transactions.map((tx,i)=>{
              const isCredit = tx.amount > 0;
              const txColor  = isCredit ? "#34d399" : "#f87171";
              return (
                <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<transactions.length-1?"1px solid var(--line)":"none" }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:`${txColor}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Ic name={isCredit?"arrow-up":"arrow-down"} size={14} color={txColor}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.82rem", color:"var(--color-starlight)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.description||TX_LABELS[tx.type]||tx.type}</div>
                    <div style={{ fontSize:"0.68rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>{new Date(tx.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:"0.88rem", fontWeight:700, color:txColor, fontFamily:"var(--font-mono)" }}>{isCredit?"+":""}${Math.abs(tx.amount).toFixed(2)}</div>
                    <div style={{ fontSize:"0.65rem", color:"var(--color-dust)", fontFamily:"var(--font-mono)" }}>${tx.balance_after.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────── */
type Tab = "overview" | "agents" | "wallet" | "support";

export default function DashboardPage() {
  const [tab,        setTab]        = useState<Tab>("overview");
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [agents,     setAgents]     = useState<Agent[]>([]);
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [wallet,     setWallet]     = useState<Wallet | null>(null);
  const [walletTxns, setWalletTxns] = useState<WalletTx[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [token,      setToken]      = useState("");
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [error,      setError]      = useState("");
  const [totalLeads, setTotalLeads] = useState(0);

  const agentLimit  = PLAN_LIMITS[profile?.plan ?? "trial"] ?? 1;
  const periodUsed  = profile?.period_agents_created ?? agents.length;
  const canBuild    = periodUsed < agentLimit && profile?.plan !== "expired";
  const pm          = planMeta(profile?.plan ?? "trial");
  const unreadCount = notifs.filter(n => !n.read).length;
  const trialLeft   = profile?.plan === "trial" ? daysLeft(profile.trial_ends_at) : null;
  const billingLeft = profile?.billing_end ? daysLeft(profile.billing_end) : null;
  const isExpired   = profile?.plan === "expired";
  const showUpgrade = profile?.plan && !["pro","max","admin"].includes(profile.plan);
  const editingAgent= agents.find(a => a.id === editingId);
  const walletBal   = wallet?.balance ?? 0;
  const walletLow   = walletBal < 5 && walletBal > 0;
  const walletEmpty = walletBal <= 0 && !!profile && !["trial","admin"].includes(profile.plan ?? "");

  const load = useCallback(async (tok: string) => {
    try {
      const [pRes, aRes, nRes, wRes, wtRes] = await Promise.all([
        fetch(`${API}/api/auth/me`,             { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/agents/me`,           { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/notifications`,       { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/wallet`,              { headers:{ Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/api/wallet/transactions`, { headers:{ Authorization:`Bearer ${tok}` } }),
      ]);
      if (pRes.ok)  { const d = await pRes.json(); setProfile(d.profile ?? d); }
      if (aRes.ok)  { const d = await aRes.json(); setAgents(d.agents ?? []); }
      if (nRes.ok)  { const d = await nRes.json(); setNotifs(d.notifications ?? []); }
      if (wRes.ok)  { const d = await wRes.json(); setWallet(d); }
      if (wtRes.ok) { const d = await wtRes.json(); setWalletTxns(d.transactions ?? []); }
    } catch { setError("Failed to load dashboard."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/auth/login"; return; }
      setToken(data.session.access_token);
      load(data.session.access_token);
    });
  }, [load]);

  // Estimate total leads from wallet transactions
  useEffect(() => {
    const leads = walletTxns.filter(t => t.type === "cold_lead" || t.type === "hot_lead").length;
    setTotalLeads(leads);
  }, [walletTxns]);

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`${API}/api/agents/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setAgents(prev => prev.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const markRead = (ids: string[]) => {
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, read:true } : n));
    fetch(`${API}/api/notifications/read`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({ notification_ids:ids }) }).catch(()=>{});
  };

  // Support tab — no badge, just icon
  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id:"overview", icon:"zap",     label:"Overview" },
    { id:"agents",   icon:"agent",   label:"Agents"   },
    { id:"wallet",   icon:"wallet",  label:"Wallet"   },
    { id:"support",  icon:"support", label:"Support"  },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-void)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"var(--color-nebula)", animation:"spin 0.75s linear infinite" }}/>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes dashIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .btn-genesis { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0.7rem 1.4rem;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);border:none;color:#fff;font-weight:700;font-size:0.9rem;font-family:var(--font-sans);cursor:pointer;box-shadow:0 0 28px rgba(124,58,237,0.35);transition:all 0.2s;text-decoration:none }
        .btn-genesis:hover { filter:brightness(1.08);transform:translateY(-1px) }
        .tab-btn { display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;border:none;cursor:pointer;font-size:0.82rem;font-family:var(--font-sans);transition:all 0.15s;background:transparent;color:var(--color-dust) }
        .tab-btn.active { background:rgba(255,255,255,0.06);color:var(--color-starlight) }
        .tab-btn:hover  { background:rgba(255,255,255,0.04);color:var(--color-starlight) }
        @media(max-width:640px){.grid-agents{grid-template-columns:1fr!important}.stat-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--color-void)", backgroundImage:"radial-gradient(900px 500px at 70% -8%,rgba(124,58,237,0.08),transparent 65%)" }}
        onClick={() => showNotifs && setShowNotifs(false)}>

        {showNotifs && <NotifPanel notifs={notifs} onRead={markRead} onClose={() => setShowNotifs(false)}/>}

        {/* ── Header ── */}
        <header style={{ borderBottom:"1px solid var(--line)", background:"rgba(5,7,15,0.88)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:20 }}>
          <div style={{ maxWidth:1100, margin:"0 auto", padding:"12px 22px", display:"flex", alignItems:"center", gap:12 }}>
            {editingId ? (
              <button onClick={() => setEditingId(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-dust)", display:"flex", alignItems:"center", gap:6, fontSize:"0.82rem", fontFamily:"var(--font-sans)" }}>
                <Ic name="back" size={14}/> Dashboard
              </button>
            ) : (
              <>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--color-nebula)", boxShadow:"0 0 10px var(--color-nebula)", flexShrink:0 }}/>
                <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", color:"var(--color-starlight)", flex:1 }}>
                  {profile?.full_name ? `${profile.full_name.split(" ")[0]}'s dashboard` : "Dashboard"}
                </span>
              </>
            )}
            {editingId && editingAgent && (
              <span style={{ flex:1, fontFamily:"var(--font-display)", fontWeight:600, fontSize:"0.9rem", color:"var(--color-starlight)" }}>Editing {editingAgent.name}</span>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {!editingId && wallet !== null && (
                <a href="/wallet/topup" style={{ padding:"5px 10px", borderRadius:9, background:walletEmpty?"rgba(248,113,113,0.1)":walletLow?"rgba(251,191,36,0.1)":"rgba(52,211,153,0.08)", border:`1px solid ${walletEmpty?"rgba(248,113,113,0.3)":walletLow?"rgba(251,191,36,0.25)":"rgba(52,211,153,0.2)"}`, color:walletEmpty?"#f87171":walletLow?"#fbbf24":"#34d399", fontSize:"0.72rem", fontWeight:700, textDecoration:"none", fontFamily:"var(--font-mono)", display:"flex", alignItems:"center", gap:5 }}>
                  <Ic name="wallet" size={12} color={walletEmpty?"#f87171":walletLow?"#fbbf24":"#34d399"}/>
                  ${walletBal.toFixed(2)}
                </a>
              )}

              {showUpgrade && !editingId && (
                <a href="/pricing" style={{ padding:"6px 12px", borderRadius:10, background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(37,99,235,0.15))", border:"1px solid rgba(124,58,237,0.4)", color:"#a78bfa", fontWeight:700, fontSize:"0.78rem", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>
                  <Ic name="star" size={13} color="#a78bfa"/> Upgrade
                </a>
              )}

              <span style={{ padding:"3px 10px", borderRadius:100, fontSize:"0.68rem", fontWeight:700, fontFamily:"var(--font-mono)", background:pm.bg, color:pm.color, border:`1px solid ${pm.color}33` }}>
                {pm.label}
              </span>

              <button onClick={e => { e.stopPropagation(); setShowNotifs(!showNotifs); }} style={{ position:"relative", background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:9, width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-dust)" }}>
                <Ic name="bell" size={16}/>
                {unreadCount > 0 && <div style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:"var(--color-nebula)", boxShadow:"0 0 6px var(--color-nebula)" }}/>}
              </button>

              <button onClick={async () => { await createClient().auth.signOut(); window.location.href = "/auth/login"; }} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid var(--line)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:"0.78rem", color:"var(--color-dust)", fontFamily:"var(--font-sans)" }}>
                Sign out
              </button>
            </div>
          </div>

          {/* Tabs — NO badge on Support */}
          {!editingId && (
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 14px", display:"flex", gap:4, borderTop:"1px solid var(--line)" }}>
              {TABS.map(t => (
                <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
                  <Ic name={t.icon} size={14}/>
                  {t.label}
                  {t.id === "wallet" && (walletEmpty||walletLow) && (
                    <div style={{ width:6, height:6, borderRadius:"50%", background:walletEmpty?"#f87171":"#fbbf24", boxShadow:`0 0 4px ${walletEmpty?"#f87171":"#fbbf24"}` }}/>
                  )}
                </button>
              ))}
            </div>
          )}
        </header>

        <main style={{ maxWidth:1100, margin:"0 auto", padding:"26px 22px", animation:"dashIn 0.3s ease both" }}>
          {error && <div style={{ marginBottom:16, padding:"10px 16px", borderRadius:12, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", fontSize:"0.82rem", color:"#f87171" }}>{error}</div>}

          {editingId && token && <AgentEditor agentId={editingId} token={token} onClose={() => setEditingId(null)}/>}

          {!editingId && (
            <>
              {/* ── Banners ── */}
              {walletEmpty && (
                <div style={{ marginBottom:16, padding:"14px 20px", borderRadius:14, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <span>🔴</span>
                  <p style={{ margin:0, fontSize:"0.85rem", color:"var(--color-starlight)", flex:1 }}>Wallet empty — AI agents are paused. Add funds to resume instantly.</p>
                  <a href="/wallet/topup" className="btn-genesis" style={{ fontSize:"0.82rem", padding:"0.6rem 1.1rem" }}>Add funds →</a>
                </div>
              )}
              {walletLow && !walletEmpty && (
                <div style={{ marginBottom:16, padding:"12px 18px", borderRadius:14, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.22)", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span>⚠️</span>
                  <p style={{ margin:0, fontSize:"0.82rem", color:"var(--color-starlight)", flex:1 }}>Low balance (${walletBal.toFixed(2)}) — top up to keep your agent running.</p>
                  <a href="/wallet/topup" style={{ padding:"7px 14px", borderRadius:9, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", fontSize:"0.78rem", fontWeight:600, textDecoration:"none", color:"#fbbf24" }}>Add funds →</a>
                </div>
              )}
              {isExpired && (
                <div style={{ marginBottom:16, padding:"14px 20px", borderRadius:14, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <span>⚠️</span>
                  <p style={{ margin:0, fontSize:"0.85rem", color:"var(--color-starlight)", flex:1 }}>Your plan has expired. Renew to keep your agent live.</p>
                  <a href="/pricing" className="btn-genesis" style={{ fontSize:"0.82rem", padding:"0.6rem 1.1rem" }}>Renew now →</a>
                </div>
              )}
              {profile?.plan === "trial" && trialLeft !== null && (
                <div style={{ marginBottom:16, padding:"12px 18px", borderRadius:14, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.22)", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span>⏰</span>
                  <p style={{ margin:0, fontSize:"0.82rem", color:"var(--color-starlight)", flex:1 }}>
                    {trialLeft<=0?"Trial expired.":`${trialLeft} day${trialLeft===1?"":"s"} left in your free trial.`}
                  </p>
                  <a href="/pricing" style={{ padding:"7px 14px", borderRadius:9, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", fontSize:"0.78rem", fontWeight:600, textDecoration:"none", color:"#fbbf24" }}>Upgrade →</a>
                </div>
              )}
              {billingLeft !== null && billingLeft <= 7 && !isExpired && profile?.plan !== "trial" && (
                <div style={{ marginBottom:16, padding:"12px 18px", borderRadius:14, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.22)", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span>📅</span>
                  <p style={{ margin:0, fontSize:"0.82rem", color:"var(--color-starlight)", flex:1 }}>
                    {billingLeft<=0?"Subscription expired.":`${billingLeft} day${billingLeft===1?"":"s"} until renewal.`} Check your wallet balance.
                  </p>
                  <a href="/wallet" style={{ padding:"7px 14px", borderRadius:9, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", fontSize:"0.78rem", fontWeight:600, textDecoration:"none", color:"#fbbf24" }}>Check wallet →</a>
                </div>
              )}

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div>
                  <div className="stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:14, marginBottom:24 }}>
                    <StatCard label="Active agents"  value={agents.filter(a=>a.status==="active").length} icon="agent"  color="124,58,237" sub={`of ${agentLimit} allowed`}/>
                    <StatCard label="Plan"           value={pm.label}   icon="star"   color="167,139,250" sub={trialLeft!==null?`${trialLeft}d left`:billingLeft!==null?`${billingLeft}d left`:"Active"}/>
                    <StatCard label="Wallet"         value={`$${walletBal.toFixed(2)}`} icon="wallet" color={walletEmpty?"248,113,113":walletLow?"251,191,36":"52,211,153"} sub={walletEmpty?"Empty — paused":walletLow?"Low balance":"Available"}/>
                    <StatCard label="Leads captured" value={totalLeads} icon="trending" color="56,189,248" sub="all time"/>
                  </div>

                  {/* Growth Flywheel */}
                  <GrowthFlywheel agentCount={agents.length} leads={totalLeads}/>

                  {/* Ambient Intelligence */}
                  <AmbientIntel agents={agents}/>

                  {/* FOMO Benchmark */}
                  <FomoBenchmark plan={profile?.plan||"trial"} agentCount={agents.length}/>

                  {/* Referral */}
                  {profile && <ReferralCard profile={profile}/>}

                  {/* Quick actions */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:12 }}>
                    {canBuild && (
                      <a href="/build" style={{ padding:"16px 18px", borderRadius:14, background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", textDecoration:"none", display:"flex", alignItems:"center", gap:12, transition:"border-color 0.15s" }}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(124,58,237,0.4)")}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(124,58,237,0.2)")}>
                        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(124,58,237,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Ic name="plus" size={18} color="var(--color-nebula)"/>
                        </div>
                        <div>
                          <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>Build agent</div>
                          <div style={{ fontSize:"0.72rem", color:"var(--color-dust)" }}>Set up in minutes</div>
                        </div>
                      </a>
                    )}
                    <a href="/wallet/topup" style={{ padding:"16px 18px", borderRadius:14, background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.18)", textDecoration:"none", display:"flex", alignItems:"center", gap:12, transition:"border-color 0.15s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(52,211,153,0.35)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(52,211,153,0.18)")}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(52,211,153,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Ic name="wallet" size={18} color="#34d399"/>
                      </div>
                      <div>
                        <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>Add funds</div>
                        <div style={{ fontSize:"0.72rem", color:"var(--color-dust)" }}>Top up wallet</div>
                      </div>
                    </a>
                    <a href="/explore" style={{ padding:"16px 18px", borderRadius:14, background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.18)", textDecoration:"none", display:"flex", alignItems:"center", gap:12, transition:"border-color 0.15s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(56,189,248,0.35)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(56,189,248,0.18)")}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(56,189,248,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Ic name="eye" size={18} color="#38bdf8"/>
                      </div>
                      <div>
                        <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>Explore</div>
                        <div style={{ fontSize:"0.72rem", color:"var(--color-dust)" }}>See other agents</div>
                      </div>
                    </a>
                    <button onClick={() => setTab("support")} style={{ padding:"16px 18px", borderRadius:14, background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.18)", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left", transition:"border-color 0.15s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(167,139,250,0.35)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(167,139,250,0.18)")}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(167,139,250,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Ic name="support" size={18} color="#a78bfa"/>
                      </div>
                      <div>
                        <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--color-starlight)" }}>Support</div>
                        <div style={{ fontSize:"0.72rem", color:"var(--color-dust)" }}>We reply fast</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ── AGENTS ── */}
              {tab === "agents" && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                    <div>
                      <h2 style={{ margin:"0 0 2px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", color:"var(--color-starlight)" }}>Your agents</h2>
                      <p style={{ margin:0, fontSize:"0.78rem", color:"var(--color-dust)" }}>{agents.length} total · {periodUsed}/{agentLimit} used this period</p>
                    </div>
                    {canBuild && agents.length > 0 && (
                      <a href="/build" className="btn-genesis" style={{ fontSize:"0.86rem", padding:"0.62rem 1.2rem" }}>
                        <Ic name="plus" size={14} color="white"/> New agent
                      </a>
                    )}
                  </div>

                  {agents.length === 0
                    ? <GenesisOrb onClick={() => { window.location.href = "/build"; }}/>
                    : (
                      <div className="grid-agents" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                        {agents.map(agent => (
                          <AgentCard key={agent.id} agent={agent}
                            onEdit={() => setEditingId(agent.id)}
                            onDelete={() => deleteAgent(agent.id)}
                            onViewLeads={() => window.open(`/${agent.subdomain}/leads?key=${agent.id}`, "_blank")}
                          />
                        ))}
                      </div>
                    )}

                  {!canBuild && !isExpired && agents.length > 0 && (
                    <div style={{ marginTop:24, padding:"20px 24px", background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:16, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:"0 0 3px", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"0.95rem", color:"var(--color-starlight)" }}>Want more agents?</p>
                        <p style={{ margin:0, fontSize:"0.8rem", color:"var(--color-dust)" }}>Upgrade to Pro for 2 agents, custom URL, and image support.</p>
                      </div>
                      <a href="/pricing" className="btn-genesis" style={{ fontSize:"0.86rem" }}>Upgrade to Pro →</a>
                    </div>
                  )}
                </div>
              )}

              {/* ── WALLET ── */}
              {tab === "wallet" && <WalletTab wallet={wallet} transactions={walletTxns}/>}

              {/* ── SUPPORT — no badge count ── */}
              {tab === "support" && (
                <div style={{ maxWidth:600 }}>
                  <h2 style={{ margin:"0 0 16px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", color:"var(--color-starlight)" }}>Support</h2>
                  <SupportTab token={token}/>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}