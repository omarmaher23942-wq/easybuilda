/**
 * EasyBuilda Chat Widget
 * Usage: <script src="https://easybuilda.com/widget.js" data-agent="YOUR_USERNAME"></script>
 * Optional: data-api="https://your-api.com"
 */
(function () {
    "use strict";
  
    var script = document.currentScript || (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  
    var username = script.getAttribute("data-agent");
    var apiBase = script.getAttribute("data-api") || "http://localhost:8000";
  
    if (!username) { console.warn("[EasyBuilda] data-agent is required."); return; }
  
    var agent = null, open = false, messages = [], convId = null, loading = false;
    var visitorId = "v-" + Math.random().toString(36).slice(2);
  
    // ── CSS ──────────────────────────────────────────────────────────────────
    var style = document.createElement("style");
    style.textContent = [
      ".eb-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
      ".eb-bubble { position: fixed; bottom: 24px; right: 24px; z-index: 2147483646; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease; animation: eb-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }",
      ".eb-bubble:hover { transform: scale(1.08); }",
      ".eb-panel { position: fixed; bottom: 92px; right: 24px; z-index: 2147483645; width: 370px; max-width: calc(100vw - 32px); height: 520px; max-height: calc(100vh - 120px); background: #0a0e1a; border: 1px solid rgba(237,240,247,0.09); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.55); transition: all 0.24s cubic-bezier(0.22,1,0.36,1); transform-origin: bottom right; }",
      ".eb-panel.closed { transform: scale(0.85) translateY(12px); opacity: 0; pointer-events: none; }",
      ".eb-header { padding: 14px 16px; border-bottom: 1px solid rgba(237,240,247,0.09); background: rgba(5,7,15,0.7); display: flex; align-items: center; gap: 10px; }",
      ".eb-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }",
      ".eb-agent-name { font-weight: 600; font-size: 0.9rem; color: #edf0f7; }",
      ".eb-agent-biz { font-size: 0.72rem; color: #8891a8; }",
      ".eb-close { margin-left: auto; background: none; border: none; cursor: pointer; color: #8891a8; padding: 4px; border-radius: 6px; line-height: 1; font-size: 18px; transition: color 0.15s; }",
      ".eb-close:hover { color: #edf0f7; }",
      ".eb-msgs { flex: 1; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; gap: 12px; }",
      ".eb-msgs::-webkit-scrollbar { width: 4px; } .eb-msgs::-webkit-scrollbar-track { background: transparent; } .eb-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }",
      ".eb-msg { display: flex; gap: 8px; align-items: flex-end; animation: eb-msg-in 0.2s ease both; }",
      ".eb-msg.user { flex-direction: row-reverse; }",
      ".eb-bubble-msg { max-width: 82%; padding: 10px 14px; border-radius: 16px; font-size: 0.86rem; line-height: 1.55; color: #edf0f7; white-space: pre-wrap; word-break: break-word; }",
      ".eb-msg.assistant .eb-bubble-msg { background: rgba(255,255,255,0.06); border: 1px solid rgba(237,240,247,0.09); border-radius: 16px 16px 16px 4px; }",
      ".eb-msg.user .eb-bubble-msg { border-radius: 16px 16px 4px 16px; }",
      ".eb-typing { display: flex; gap: 4px; padding: 12px 14px; align-items: center; }",
      ".eb-dot { width: 5px; height: 5px; border-radius: 50%; background: #8891a8; animation: eb-dot 1.2s ease-in-out infinite; }",
      ".eb-dot:nth-child(2) { animation-delay: 0.18s; } .eb-dot:nth-child(3) { animation-delay: 0.36s; }",
      ".eb-chips { padding: 0 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; }",
      ".eb-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(237,240,247,0.12); color: #8891a8; border-radius: 100px; padding: 4px 12px; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }",
      ".eb-chip:hover { color: #edf0f7; border-color: rgba(237,240,247,0.25); background: rgba(255,255,255,0.08); }",
      ".eb-footer { padding: 10px 14px 14px; border-top: 1px solid rgba(237,240,247,0.09); background: rgba(5,7,15,0.5); }",
      ".eb-inputrow { display: flex; align-items: flex-end; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(237,240,247,0.12); border-radius: 12px; padding: 8px 12px; }",
      ".eb-input { flex: 1; background: none; border: none; outline: none; resize: none; color: #edf0f7; font-size: 0.86rem; line-height: 1.4; max-height: 80px; overflow-y: auto; }",
      ".eb-input::placeholder { color: #8891a8; }",
      ".eb-send { width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: filter 0.15s, transform 0.15s; }",
      ".eb-send:hover { filter: brightness(1.12); transform: scale(1.05); }",
      ".eb-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }",
      ".eb-brand { text-align: center; margin-top: 8px; font-size: 0.62rem; color: rgba(136,145,168,0.5); letter-spacing: 0.06em; }",
      ".eb-brand a { color: inherit; text-decoration: none; } .eb-brand a:hover { color: #8891a8; }",
      "@keyframes eb-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }",
      "@keyframes eb-msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }",
      "@keyframes eb-dot { 0%,80%,100% { transform: scale(0.55); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }",
    ].join("\n");
    document.head.appendChild(style);
  
    // ── DOM ──────────────────────────────────────────────────────────────────
    var widget = document.createElement("div");
    widget.className = "eb-widget";
  
    var panel = document.createElement("div");
    panel.className = "eb-panel closed";
  
    var header = document.createElement("div"); header.className = "eb-header";
    var avatar = document.createElement("div"); avatar.className = "eb-avatar";
    var nameEl = document.createElement("div");
    var nameP = document.createElement("div"); nameP.className = "eb-agent-name"; nameP.textContent = "Loading\u2026";
    var bizP = document.createElement("div"); bizP.className = "eb-agent-biz";
    nameEl.appendChild(nameP); nameEl.appendChild(bizP);
    var closeBtn = document.createElement("button"); closeBtn.className = "eb-close";
    closeBtn.innerHTML = "\u00d7"; closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.onclick = function () { togglePanel(false); };
    header.appendChild(avatar); header.appendChild(nameEl); header.appendChild(closeBtn);
  
    var msgsEl = document.createElement("div"); msgsEl.className = "eb-msgs";
    var chipsEl = document.createElement("div"); chipsEl.className = "eb-chips";
  
    var footer = document.createElement("div"); footer.className = "eb-footer";
    var inputRow = document.createElement("div"); inputRow.className = "eb-inputrow";
    var input = document.createElement("textarea");
    input.className = "eb-input"; input.rows = 1; input.placeholder = "Type a message\u2026";
    var sendBtn = document.createElement("button");
    sendBtn.className = "eb-send"; sendBtn.setAttribute("aria-label", "Send");
    sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M15 3L8 10M15 3L10 15L8 10M15 3L3 7.5L8 10" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    inputRow.appendChild(input); inputRow.appendChild(sendBtn);
    var brand = document.createElement("div"); brand.className = "eb-brand";
    brand.innerHTML = 'Powered by <a href="https://easybuilda.com" target="_blank" rel="noopener">EasyBuilda</a>';
    footer.appendChild(inputRow); footer.appendChild(brand);
  
    panel.appendChild(header); panel.appendChild(msgsEl); panel.appendChild(chipsEl); panel.appendChild(footer);
  
    var bubble = document.createElement("button"); bubble.className = "eb-bubble";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    bubble.onclick = function () { togglePanel(!open); };
  
    widget.appendChild(panel); widget.appendChild(bubble);
    document.body.appendChild(widget);
  
    // ── Color ────────────────────────────────────────────────────────────────
    function applyColor(c) {
      bubble.style.background = "linear-gradient(135deg, " + c + "dd, " + c + ")";
      bubble.style.boxShadow = "0 4px 24px " + c + "66";
      avatar.style.background = "linear-gradient(135deg, " + c + "cc, #22d3ee)";
      sendBtn.style.background = c;
      sendBtn.style.boxShadow = "0 0 14px " + c + "55";
    }
    applyColor("#7c3aed");
  
    // ── Load agent ───────────────────────────────────────────────────────────
    fetch(apiBase + "/api/u/" + username)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        agent = d.agent;
        nameP.textContent = agent.name;
        bizP.textContent = agent.business_name;
        avatar.textContent = agent.name.slice(0, 2).toUpperCase();
        if (agent.primary_color) applyColor(agent.primary_color);
        addMessage("assistant", agent.welcome_message);
        if (agent.suggested_questions && agent.suggested_questions.length) {
          agent.suggested_questions.slice(0, 4).forEach(function (q) {
            var chip = document.createElement("button"); chip.className = "eb-chip"; chip.textContent = q;
            chip.onclick = function () { sendMsg(q); chipsEl.style.display = "none"; };
            chipsEl.appendChild(chip);
          });
        }
      })
      .catch(function () { nameP.textContent = "Agent unavailable"; });
  
    // ── Toggle ───────────────────────────────────────────────────────────────
    function togglePanel(show) {
      open = show;
      panel.className = "eb-panel" + (open ? "" : " closed");
      bubble.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { setTimeout(function () { input.focus(); }, 250); }
    }
  
    // ── Add message ──────────────────────────────────────────────────────────
    function addMessage(role, content) {
      var color = (agent && agent.primary_color) ? agent.primary_color : "#7c3aed";
      var wrap = document.createElement("div"); wrap.className = "eb-msg " + role;
      if (role === "assistant") {
        var av = document.createElement("div"); av.className = "eb-avatar";
        av.style.cssText = "width:28px;height:28px;font-size:10px;background:linear-gradient(135deg," + color + "cc,#22d3ee)";
        av.textContent = agent ? agent.name.slice(0, 2).toUpperCase() : "AI";
        wrap.appendChild(av);
      }
      var bub = document.createElement("div"); bub.className = "eb-bubble-msg";
      if (role === "user") { bub.style.background = "linear-gradient(135deg," + color + "dd," + color + ")"; }
      bub.textContent = content;
      wrap.appendChild(bub);
      msgsEl.appendChild(wrap);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      messages.push({ role: role, content: content });
    }
  
    // ── Typing indicator ─────────────────────────────────────────────────────
    var typingEl = null;
    function showTyping() {
      if (typingEl) return;
      var color = (agent && agent.primary_color) ? agent.primary_color : "#7c3aed";
      var wrap = document.createElement("div"); wrap.className = "eb-msg assistant";
      var av = document.createElement("div"); av.className = "eb-avatar";
      av.style.cssText = "width:28px;height:28px;font-size:10px;background:linear-gradient(135deg," + color + "cc,#22d3ee)";
      av.textContent = agent ? agent.name.slice(0, 2).toUpperCase() : "AI";
      var dots = document.createElement("div"); dots.className = "eb-bubble-msg";
      var typing = document.createElement("div"); typing.className = "eb-typing";
      for (var i = 0; i < 3; i++) { var d = document.createElement("span"); d.className = "eb-dot"; typing.appendChild(d); }
      dots.appendChild(typing); wrap.appendChild(av); wrap.appendChild(dots);
      msgsEl.appendChild(wrap); msgsEl.scrollTop = msgsEl.scrollHeight; typingEl = wrap;
    }
    function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }
  
    // ── Send ─────────────────────────────────────────────────────────────────
    function sendMsg(text) {
      var msg = (text || input.value).trim();
      if (!msg || loading || !agent) return;
      input.value = ""; chipsEl.style.display = "none";
      loading = true; sendBtn.disabled = true;
      addMessage("user", msg); showTyping();
      fetch(apiBase + "/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agent.id, message: msg, conversation_id: convId, visitor_id: visitorId, page_url: window.location.href }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          hideTyping();
          if (data.reply) { addMessage("assistant", data.reply); if (data.conversation_id) convId = data.conversation_id; }
        })
        .catch(function () { hideTyping(); addMessage("assistant", "Sorry, something went wrong."); })
        .finally(function () { loading = false; sendBtn.disabled = false; });
    }
  
    sendBtn.onclick = function () { sendMsg(null); };
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(null); }
    });
  })();