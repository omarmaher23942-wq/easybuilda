"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle"|"loading"|"sent"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const sb = createClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = "/dashboard";
    });
  }, []);

  const sendLink = async () => {
    const e = email.trim(); if (!e) return;
    setState("loading");
    const { error } = await sb.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: true },
    });
    if (error) { setErrMsg(error.message); setState("error"); }
    else setState("sent");
  };

  const signInWithGoogle = async () => {
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // E mark geometry — absolute pixel coords for a 280×300 viewBox
  const SPINE_X = 36;
  const spineY  = [20,50,80,110,130,155,180,210,240,270];
  const topY    = 20,  topX  = [70,100,128,156,182,206];
  const midY    = 145, midX  = [70,100,128,154,175];
  const botY    = 270, botX  = [70,100,128,156,182,206];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; overflow-x: hidden; }

        @keyframes fade-up  { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes orb-glow { 0%,100%{box-shadow:0 0 32px rgba(124,58,237,.5),0 0 64px rgba(124,58,237,.18)}50%{box-shadow:0 0 52px rgba(124,58,237,.75),0 0 96px rgba(124,58,237,.28)} }
        @keyframes shimmer  { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes draw     { to{stroke-dashoffset:0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes twinkle  { 0%,100%{opacity:.2}50%{opacity:1} }
        @keyframes neb      { 0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.08) translate(-10px,8px)} }

        .page {
          min-height: 100vh; width: 100%; display: flex;
          background: #05070f;
          font-family: var(--font-sans,"Inter",ui-sans-serif,sans-serif);
          overflow: hidden; position: relative;
        }
        .nblob { position:absolute; border-radius:50%; pointer-events:none; animation:neb 16s ease-in-out infinite; }

        /* LEFT */
        .left {
          display: none; width: 52%; flex-shrink: 0;
          position: relative; overflow: hidden;
          border-right: 1px solid rgba(124,58,237,.13);
          flex-direction: column;
        }
        @media(min-width:860px){ .left{ display:flex; } }

        /* dot grid */
        .dgrid {
          position:absolute; inset:0; pointer-events:none;
          background-image: radial-gradient(circle,rgba(124,58,237,.22) 1px,transparent 1px);
          background-size: 30px 30px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 50%,black 20%,transparent 100%);
        }

        /* RIGHT */
        .right {
          flex:1; min-width:0;
          display:flex; align-items:center; justify-content:center;
          padding: 48px 32px;
          position:relative;
          background:
            radial-gradient(ellipse 90% 70% at 88% 4%,rgba(124,58,237,.1),transparent 55%),
            radial-gradient(ellipse 60% 50% at 4% 96%,rgba(56,189,248,.06),transparent 50%),
            #070a18;
        }
        .right::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background-image: radial-gradient(circle,rgba(255,255,255,.028) 1px,transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 50%,black,transparent);
        }

        .card {
          width:100%; max-width:420px;
          position:relative; z-index:1;
          animation: fade-up .5s cubic-bezier(.22,1,.36,1) both;
        }
        .glass {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(124,58,237,.28);
          border-radius: 20px; padding: 28px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.04) inset,
            0 28px 56px rgba(0,0,0,.45),
            0 0 48px rgba(124,58,237,.07);
        }

        .eb-input {
          width:100%; padding:13px 16px; border-radius:12px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(124,58,237,.22);
          color:#edf0f7; font-size:.93rem; outline:none;
          transition:border-color .2s,box-shadow .2s;
          font-family:inherit;
        }
        .eb-input:focus { border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,.2),0 0 20px rgba(124,58,237,.1); }
        .eb-input::placeholder { color:rgba(136,145,168,.6); }

        .btn-magic {
          width:100%; padding:14px; border-radius:12px;
          border:none; cursor:pointer; position:relative; overflow:hidden;
          font-family:var(--font-display,"Sora","Inter",inherit);
          font-weight:700; font-size:.95rem; letter-spacing:.02em; color:#fff;
          background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 30%,#2563eb 68%,#0ea5e9 100%);
          box-shadow:0 0 36px rgba(124,58,237,.5),0 4px 20px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.18);
          transition:filter .2s,transform .2s,box-shadow .2s;
        }
        .btn-magic::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent 20%,rgba(255,255,255,.14) 50%,transparent 80%);
          background-size:200% 100%;
          animation:shimmer 2.8s linear infinite;
        }
        .btn-magic:hover:not(:disabled){ filter:brightness(1.12); transform:translateY(-2px); box-shadow:0 0 52px rgba(124,58,237,.65),0 8px 28px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.18); }
        .btn-magic:active:not(:disabled){ transform:translateY(0); filter:brightness(.94); }
        .btn-magic:disabled{ opacity:.38; cursor:not-allowed; transform:none; }

        .btn-google {
          width:100%; padding:13px 16px; border-radius:12px; cursor:pointer;
          background:rgba(255,255,255,.055); border:1.5px solid rgba(255,255,255,.13);
          color:#edf0f7; font-size:.9rem; font-weight:500; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:10px;
          transition:background .2s,border-color .2s,transform .2s,box-shadow .2s;
          box-shadow:0 2px 8px rgba(0,0,0,.2);
        }
        .btn-google:hover{ background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.24); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.3); }

        .divline { display:flex; align-items:center; gap:12px; font-size:.72rem; color:rgba(136,145,168,.5); font-family:var(--font-mono,monospace); letter-spacing:.08em; }
        .divline::before,.divline::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(124,58,237,.3),transparent); }
        .err-msg { padding:10px 14px; border-radius:10px; background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.25); font-size:.79rem; color:#f87171; font-family:var(--font-mono,monospace); line-height:1.5; }

        /* E dots */
        .edot { animation:twinkle var(--dur,3s) ease-in-out infinite; animation-delay:var(--del,0s); }
      `}</style>

      <div className="page">
        {/* Nebula */}
        <div className="nblob" style={{width:680,height:680,top:"-18%",left:"-16%",background:"radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 65%)",animationDelay:"0s"}}/>
        <div className="nblob" style={{width:480,height:480,bottom:"-12%",left:"18%",background:"radial-gradient(circle,rgba(56,189,248,.08) 0%,transparent 65%)",animationDelay:"-6s"}}/>

        {/* ═══ LEFT ═══════════════════════════════════════════ */}
        <div className="left">
          <div className="dgrid"/>

          {/* Top brand */}
          <div style={{position:"relative",zIndex:2,padding:"36px 44px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#a855f7,#7c3aed 45%,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(124,58,237,.5)"}}>
                <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:14,color:"#fff",letterSpacing:"-.03em"}}>E</span>
              </div>
              <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:".88rem",color:"rgba(237,240,247,.85)",letterSpacing:"-.01em"}}>EasyBuilda</span>
            </div>
          </div>

          {/* E mark — centered in remaining space */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <svg width="240" height="290" viewBox="0 0 240 290" fill="none" xmlns="http://www.w3.org/2000/svg" style={{overflow:"visible"}}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity=".7"/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity=".7"/>
                </linearGradient>
                <filter id="gf" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Stroke lines — NO fill ellipse, just the letter strokes */}
              {/* Spine: x=36, y=20→270 */}
              <line x1={SPINE_X} y1="20" x2={SPINE_X} y2="270" stroke="url(#lg1)" strokeWidth="1.8" strokeLinecap="round" opacity=".45"/>
              {/* Top beam: y=20, x=36→206 */}
              <line x1={SPINE_X} y1="20" x2="210" y2="20" stroke="url(#lg1)" strokeWidth="1.8" strokeLinecap="round" opacity=".45"/>
              {/* Mid beam: y=145, x=36→178 */}
              <line x1={SPINE_X} y1="145" x2="178" y2="145" stroke="url(#lg1)" strokeWidth="1.8" strokeLinecap="round" opacity=".45"/>
              {/* Bottom beam: y=270, x=36→210 */}
              <line x1={SPINE_X} y1="270" x2="210" y2="270" stroke="url(#lg1)" strokeWidth="1.8" strokeLinecap="round" opacity=".45"/>

              {/* Spine dots */}
              {spineY.map((y,i)=>(
                <circle key={`sp${i}`} cx={SPINE_X} cy={y} r="4" fill="#a78bfa" filter="url(#gf)"
                  className="edot" style={{"--dur":`${2.4+i*.28}s`,"--del":`${i*.18}s`} as React.CSSProperties}/>
              ))}
              {/* Top beam dots */}
              {topX.map((x,i)=>(
                <circle key={`tp${i}`} cx={x} cy={topY} r="4" fill="#38bdf8" filter="url(#gf)"
                  className="edot" style={{"--dur":`${2.6+i*.22}s`,"--del":`${i*.15+.4}s`} as React.CSSProperties}/>
              ))}
              {/* Mid beam dots */}
              {midX.map((x,i)=>(
                <circle key={`md${i}`} cx={x} cy={midY} r="4" fill="#818cf8" filter="url(#gf)"
                  className="edot" style={{"--dur":`${2.9+i*.2}s`,"--del":`${i*.17+.9}s`} as React.CSSProperties}/>
              ))}
              {/* Bot beam dots */}
              {botX.map((x,i)=>(
                <circle key={`bt${i}`} cx={x} cy={botY} r="4" fill="#38bdf8" filter="url(#gf)"
                  className="edot" style={{"--dur":`${2.5+i*.25}s`,"--del":`${i*.16+.2}s`} as React.CSSProperties}/>
              ))}
            </svg>
          </div>

          {/* Bottom copy */}
          <div style={{position:"relative",zIndex:2,padding:"0 44px 48px",animation:"fade-up .7s cubic-bezier(.22,1,.36,1) .9s both"}}>
            <p style={{margin:"0 0 11px",fontSize:".59rem",color:"rgba(168,85,247,.85)",fontFamily:"var(--font-mono,monospace)",letterSpacing:".24em",textTransform:"uppercase",fontWeight:600}}>EasyBuilda</p>
            <h2 style={{margin:"0 0 13px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"2rem",color:"#edf0f7",lineHeight:1.18,letterSpacing:"-.03em"}}>
              Your AI agent<br/>
              <span style={{background:"linear-gradient(90deg,#a78bfa 0%,#38bdf8 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                is waiting to be born.
              </span>
            </h2>
            <p style={{margin:"0 0 22px",fontSize:".83rem",color:"rgba(136,145,168,.7)",lineHeight:1.7}}>
              Sign in to build, manage, and track your AI agents.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {c:"#a78bfa",t:"Build a complete AI agent in minutes"},
                {c:"#38bdf8",t:"Captures and qualifies leads automatically"},
                {c:"#34d399",t:"Embeds on any website with one snippet"},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:f.c,boxShadow:`0 0 7px ${f.c}`,flexShrink:0}}/>
                  <span style={{fontSize:".78rem",color:"rgba(237,240,247,.42)"}}>{f.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT ══════════════════════════════════════════ */}
        <div className="right">
          <div className="card">

            {/* Logo */}
            <div style={{marginBottom:28}}>
              <div style={{
                width:52,height:52,borderRadius:14,marginBottom:20,
                background:"linear-gradient(135deg,#a855f7 0%,#7c3aed 35%,#2563eb 70%,#22d3ee 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",
                animation:"orb-glow 4s ease-in-out infinite",
              }}>
                <span style={{fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:800,fontSize:22,color:"#fff",letterSpacing:"-.04em",lineHeight:1}}>E</span>
              </div>
              <h1 style={{margin:"0 0 7px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.65rem",color:"#edf0f7",letterSpacing:"-.03em",lineHeight:1.1}}>
                Welcome back
              </h1>
              <p style={{margin:0,fontSize:".84rem",color:"rgba(136,145,168,.7)",lineHeight:1.5}}>
                Sign in to your EasyBuilda account.
              </p>
            </div>

            {/* Sent */}
            {state==="sent"?(
              <div style={{animation:"fade-up .4s cubic-bezier(.22,1,.36,1) both"}}>
                <div style={{padding:"30px 24px",borderRadius:16,textAlign:"center",background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.2)",marginBottom:18}}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{marginBottom:14}}>
                    <circle cx="26" cy="26" r="24" stroke="rgba(52,211,153,.2)" strokeWidth="1.5"/>
                    <path d="M16 26l8 8 12-16" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      style={{strokeDasharray:44,strokeDashoffset:44,animation:"draw .55s cubic-bezier(.22,1,.36,1) .1s forwards"}}/>
                  </svg>
                  <p style={{margin:"0 0 8px",fontFamily:"var(--font-display,'Sora',sans-serif)",fontWeight:700,fontSize:"1.05rem",color:"#edf0f7"}}>Check your inbox</p>
                  <p style={{margin:0,fontSize:".83rem",color:"rgba(136,145,168,.75)",lineHeight:1.65}}>
                    Magic link sent to<br/><strong style={{color:"#edf0f7",fontWeight:600}}>{email}</strong>
                  </p>
                </div>
                <p style={{margin:0,fontSize:".77rem",color:"rgba(136,145,168,.5)",textAlign:"center"}}>
                  Wrong email?{" "}
                  <button onClick={()=>{setState("idle");setEmail("");}}
                    style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:".77rem",fontFamily:"inherit",padding:0}}>
                    Try again
                  </button>
                </p>
              </div>
            ):(
              /* Form */
              <div className="glass">
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <button className="btn-google" onClick={signInWithGoogle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                  <div className="divline">or</div>
                  <input className="eb-input" type="email" placeholder="your@business.com"
                    value={email} onChange={e=>{setEmail(e.target.value);setState("idle");}}
                    onKeyDown={e=>e.key==="Enter"&&sendLink()} autoFocus/>
                  {state==="error"&&<div className="err-msg">{errMsg}</div>}
                  <button className="btn-magic" onClick={sendLink} disabled={state==="loading"||!email.trim()}>
                    {state==="loading"
                      ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{animation:"spin .75s linear infinite"}}>
                            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.25)" strokeWidth="2"/>
                            <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Sending…
                        </span>
                      :"Send magic link →"
                    }
                  </button>
                  <p style={{margin:0,fontSize:".74rem",color:"rgba(136,145,168,.48)",textAlign:"center",lineHeight:1.6}}>
                    We'll email you a secure sign-in link.<br/>No password ever needed.
                  </p>
                </div>
              </div>
            )}

            <p style={{marginTop:22,fontSize:".7rem",color:"rgba(136,145,168,.35)",textAlign:"center",lineHeight:1.65}}>
              By continuing you agree to our{" "}
              <a href="/terms" style={{color:"rgba(124,58,237,.65)",textDecoration:"none"}}>Terms</a>
              {" "}and{" "}
              <a href="/privacy" style={{color:"rgba(124,58,237,.65)",textDecoration:"none"}}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}