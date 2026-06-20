"use client";

import { use } from "react";

const INDUSTRIES: Record<string, {
  emoji: string; title: string; headline: string; sub: string;
  pain: string; stats: { value: string; label: string }[];
  features: { icon: string; title: string; desc: string }[];
  questions: string[];
  color: string;
}> = {
  restaurant: {
    emoji: "\u{1F37D}\uFE0F", title: "Restaurants & Cafes",
    headline: "Your restaurant never closes \u2014 even when you do.",
    sub: "An AI agent that takes reservations, answers menu questions, and handles delivery inquiries 24/7.",
    pain: "Customers ask the same questions every day. Your staff spends hours on the phone instead of serving tables.",
    stats: [
      { value: "78%", label: "of diners check online before calling" },
      { value: "3x",  label: "more reservations from website visitors" },
      { value: "47",  label: "avg leads captured per month" },
    ],
    features: [
      { icon: "\u{1F4CB}", title: "Menu answers", desc: "Answers questions about dishes, ingredients, allergens, and daily specials instantly." },
      { icon: "\u{1F4C5}", title: "Reservation booking", desc: "Collects booking details and sends them to you." },
      { icon: "\u{1F697}", title: "Delivery & takeout", desc: "Handles delivery area, minimum order, and estimated times." },
      { icon: "\u{1F30D}", title: "Multi-language", desc: "Responds in the customer's language automatically." },
    ],
    questions: ["Do you take reservations?", "What's on your menu today?", "Do you offer delivery?", "Are you open on Sundays?"],
    color: "#f97316",
  },
  clinic: {
    emoji: "\u{1F3E5}", title: "Medical & Dental Clinics",
    headline: "Patients get answers. You focus on care.",
    sub: "An AI agent that handles appointment inquiries, insurance questions, and patient intake.",
    pain: "Your reception spends hours answering the same calls. Meanwhile patients wait on hold.",
    stats: [
      { value: "62%", label: "of patients try to book outside office hours" },
      { value: "38",  label: "avg appointment inquiries per month" },
      { value: "22%", label: "no-show reduction with AI follow-up" },
    ],
    features: [
      { icon: "\u{1FA7A}", title: "Appointment scheduling", desc: "Captures patient info, preferred times, and reason for visit." },
      { icon: "\u{1F4B3}", title: "Insurance questions", desc: "Answers which insurances you accept and what's covered." },
      { icon: "\u{1F4CB}", title: "New patient intake", desc: "Guides new patients through what to bring and what to expect." },
      { icon: "\u{1F512}", title: "HIPAA-conscious", desc: "Never asks for sensitive medical details." },
    ],
    questions: ["Do you accept my insurance?", "How do I book an appointment?", "What should I bring?", "What are your hours?"],
    color: "#0ea5e9",
  },
  "real-estate": {
    emoji: "\u{1F3E0}", title: "Real Estate Agents",
    headline: "Every lead captured. Even at 3am.",
    sub: "An AI agent that qualifies buyers, answers property questions, and books viewings.",
    pain: "Most property buyers browse late at night. By Monday you've already lost them to other agents.",
    stats: [
      { value: "71%", label: "of buyers research properties after 6pm" },
      { value: "62",  label: "avg qualified leads per month" },
      { value: "9%",  label: "avg conversion rate to viewings" },
    ],
    features: [
      { icon: "\u{1F511}", title: "Property inquiries", desc: "Answers questions about listings, pricing, and availability instantly." },
      { icon: "\u{1F4CD}", title: "Area expertise", desc: "Shares knowledge about neighborhoods, schools, and local amenities." },
      { icon: "\u{1F4C5}", title: "Viewing bookings", desc: "Schedules property viewings and collects buyer qualification details." },
      { icon: "\u{1F3AF}", title: "Lead qualification", desc: "Understands buyer budget, timeline, and preferences automatically." },
    ],
    questions: ["Is this property still available?", "Can I book a viewing?", "What's included in the price?", "How do I make an offer?"],
    color: "#10b981",
  },
  law: {
    emoji: "\u2696\uFE0F", title: "Law Firms",
    headline: "First consultations. Qualified. Before you pick up the phone.",
    sub: "An AI agent that handles initial inquiries, explains your practice areas, and books consultation calls.",
    pain: "Potential clients call with vague questions outside business hours. By the time you call back, they've moved on.",
    stats: [
      { value: "29",  label: "avg consultation requests per month" },
      { value: "22%", label: "avg conversion to paid engagement" },
      { value: "68%", label: "of inquiries come outside business hours" },
    ],
    features: [
      { icon: "\u{1F4DD}", title: "Practice area explanations", desc: "Clearly explains what types of cases you handle." },
      { icon: "\u{1F91D}", title: "Consultation booking", desc: "Books initial consultations and collects basic case information." },
      { icon: "\u2753", title: "FAQ handling", desc: "Answers common legal process questions without giving legal advice." },
      { icon: "\u{1F4DE}", title: "Urgent matter triage", desc: "Identifies urgent matters and provides appropriate contact information." },
    ],
    questions: ["Do you handle my type of case?", "How much does a consultation cost?", "How long does the process take?", "What documents do I need?"],
    color: "#8b5cf6",
  },
  ecommerce: {
    emoji: "\u{1F6CD}\uFE0F", title: "E-Commerce & Online Stores",
    headline: "Turn browsers into buyers. Automatically.",
    sub: "An AI agent that handles product questions, shipping inquiries, and returns.",
    pain: "Abandoned carts happen when customers can't get quick answers. Every unanswered question is a lost sale.",
    stats: [
      { value: "94",  label: "avg customer interactions per month" },
      { value: "7%",  label: "avg conversion rate increase" },
      { value: "35%", label: "reduction in support ticket volume" },
    ],
    features: [
      { icon: "\u{1F4E6}", title: "Order & shipping", desc: "Answers shipping times, tracking, and delivery area questions." },
      { icon: "\u21A9\uFE0F", title: "Returns & exchanges", desc: "Explains your return policy and guides customers through the process." },
      { icon: "\u{1F50D}", title: "Product questions", desc: "Answers detailed questions about sizing, materials, and compatibility." },
      { icon: "\u{1F4B0}", title: "Discount & promo", desc: "Shares current promotions and helps customers find the right product." },
    ],
    questions: ["What's your return policy?", "How long does shipping take?", "Do you ship internationally?", "Is this item in stock?"],
    color: "#f59e0b",
  },
  coach: {
    emoji: "\u{1F3AF}", title: "Coaches & Consultants",
    headline: "Your expertise. Available 24/7. Without burning out.",
    sub: "An AI agent that qualifies prospects, explains your programs, and books discovery calls.",
    pain: "You're busy delivering results for existing clients, but new leads go cold because you can't respond fast enough.",
    stats: [
      { value: "85%", label: "of prospects decide within 24hrs of contact" },
      { value: "41",  label: "avg qualified prospects per month" },
      { value: "31%", label: "avg booking rate from qualified leads" },
    ],
    features: [
      { icon: "\u{1F3A4}", title: "Program explanation", desc: "Explains your methodology, deliverables, and client transformation." },
      { icon: "\u2705", title: "Client qualification", desc: "Identifies who you're best suited to help and who isn't a fit." },
      { icon: "\u{1F4DE}", title: "Discovery call booking", desc: "Books calls directly and sends confirmation details." },
      { icon: "\u{1F4AC}", title: "Social proof sharing", desc: "Shares client results and testimonials to build trust." },
    ],
    questions: ["What programs do you offer?", "How long does the program last?", "Can I book a discovery call?", "Do you offer payment plans?"],
    color: "#ec4899",
  },
};

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><polyline points="9 4 13 8 9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = use(params);
  const data = INDUSTRIES[industry];

  if (!data) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--color-void)", gap:16, padding:24 }}>
        <p style={{ fontSize:"1.1rem", color:"var(--color-starlight)", fontFamily:"var(--font-display)", fontWeight:700 }}>Industry not found</p>
        <a href="/pricing" style={{ color:"var(--color-stellar)", textDecoration:"none", fontSize:"0.88rem" }}>Back to pricing</a>
      </div>
    );
  }

  const r = parseInt(data.color.slice(1,3),16) + "," + parseInt(data.color.slice(3,5),16) + "," + parseInt(data.color.slice(5,7),16);

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} body{margin:0}`}</style>
      <div style={{ minHeight:"100vh", background:"var(--color-void,#05070f)", color:"var(--color-starlight,#edf0f7)", fontFamily:"var(--font-sans,'Inter',sans-serif)", WebkitFontSmoothing:"antialiased", overflowX:"hidden" }}>
        <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
          <div style={{ position:"absolute", top:"-20vh", right:"-10vw", width:"60vw", height:"60vh", borderRadius:"50%", background:`radial-gradient(circle,rgba(${r},0.12),transparent 65%)`, filter:"blur(40px)" }}/>
        </div>
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, display:"flex", justifyContent:"center", padding:"1rem" }}>
          <div style={{ width:"100%", maxWidth:1100, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(8,12,24,0.72)", border:"1px solid rgba(237,240,247,0.08)", backdropFilter:"blur(20px)", borderRadius:18, padding:"0.6rem 0.75rem 0.6rem 1.25rem" }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#fff" }}>E</div>
              <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.9rem", color:"#edf0f7" }}>EasyBuilda</span>
            </a>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:6, background:`linear-gradient(135deg,${data.color},#2563eb)`, color:"#fff", fontWeight:700, fontSize:"0.86rem", padding:"0.52rem 1.1rem", borderRadius:10, textDecoration:"none" }}>
              Start free <Arrow/>
            </a>
          </div>
        </header>
        <main style={{ position:"relative", zIndex:1, paddingTop:"5rem" }}>
          <section style={{ textAlign:"center", padding:"5rem 1.5rem 3rem", maxWidth:700, margin:"0 auto", animation:"fadeIn 0.4s ease both" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>{data.emoji}</div>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:data.color, marginBottom:"1rem" }}>AI Agents for {data.title}</p>
            <h1 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.9rem,5vw,3rem)", lineHeight:1.1, letterSpacing:"-0.025em", marginBottom:"1.2rem" }}>{data.headline}</h1>
            <p style={{ fontSize:"1rem", color:"rgba(237,240,247,0.7)", lineHeight:1.65, maxWidth:520, margin:"0 auto 2rem" }}>{data.sub}</p>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${data.color},#2563eb)`, color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.98rem", padding:"0.9rem 2rem", borderRadius:13, textDecoration:"none", boxShadow:`0 0 32px rgba(${r},0.4)` }}>
              Build my agent free <Arrow/>
            </a>
          </section>
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:900, margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1rem" }}>
              {data.stats.map(s => (
                <div key={s.label} style={{ textAlign:"center", padding:"2rem 1.5rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:18 }}>
                  <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"2.4rem", color:data.color, lineHeight:1, marginBottom:"0.5rem" }}>{s.value}</div>
                  <div style={{ fontSize:"0.85rem", color:"rgba(237,240,247,0.6)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:700, margin:"0 auto", textAlign:"center" }}>
            <div style={{ padding:"2rem", background:`rgba(${r},0.06)`, border:`1px solid rgba(${r},0.2)`, borderRadius:20 }}>
              <p style={{ margin:0, fontSize:"1rem", color:"rgba(237,240,247,0.85)", lineHeight:1.75 }}>{data.pain}</p>
            </div>
          </section>
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:900, margin:"0 auto" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:data.color, marginBottom:"2rem", textAlign:"center" }}>What your agent handles</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1rem" }}>
              {data.features.map(f => (
                <div key={f.title} style={{ padding:"1.4rem", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(237,240,247,0.08)", borderRadius:16 }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:"0.75rem" }}>{f.icon}</div>
                  <h3 style={{ margin:"0 0 0.4rem", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"0.92rem", color:"rgba(237,240,247,1)" }}>{f.title}</h3>
                  <p style={{ margin:0, fontSize:"0.82rem", color:"rgba(237,240,247,0.55)", lineHeight:1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section style={{ padding:"0 1.5rem 4rem", maxWidth:700, margin:"0 auto", textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.2em", color:data.color, marginBottom:"1.5rem" }}>Your customers ask questions like:</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", justifyContent:"center" }}>
              {data.questions.map(q => (
                <span key={q} style={{ padding:"8px 16px", borderRadius:100, background:`rgba(${r},0.08)`, border:`1px solid rgba(${r},0.2)`, fontSize:"0.84rem", color:"rgba(237,240,247,0.8)" }}>"{q}"</span>
              ))}
            </div>
          </section>
          <section style={{ padding:"0 1.5rem 6rem", maxWidth:640, margin:"0 auto", textAlign:"center" }}>
            <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"clamp(1.6rem,4vw,2.4rem)", letterSpacing:"-0.02em", marginBottom:"1rem" }}>Ready to stop missing customers?</h2>
            <p style={{ color:"rgba(237,240,247,0.6)", fontSize:"0.95rem", lineHeight:1.65, marginBottom:"2rem" }}>Start free. No credit card. Your agent live in minutes.</p>
            <a href="/auth/login" style={{ display:"inline-flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${data.color},#2563eb,#0ea5e9)`, color:"#fff", fontFamily:"var(--font-display,'Sora',sans-serif)", fontWeight:700, fontSize:"1rem", padding:"0.95rem 2.2rem", borderRadius:13, textDecoration:"none", boxShadow:`0 0 32px rgba(${r},0.4)` }}>
              Build my AI agent free <Arrow/>
            </a>
          </section>
        </main>
        <footer style={{ borderTop:"1px solid rgba(237,240,247,0.08)", padding:"2rem 1.5rem", textAlign:"center" }}>
          <a href="/" style={{ fontSize:"0.8rem", color:"rgba(237,240,247,0.35)", textDecoration:"none" }}>EasyBuilda</a>
        </footer>
      </div>
    </>
  );
}
