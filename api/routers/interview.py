"""
EasyBuilda — Interview & Build router
AI Interviewer: persuasive, intelligent, extracts full business context in 8-12 messages

Agent-count rules (single, simple model):
  - Trial: the user's FIRST agent ever created starts a 7-day free trial
    (tracked via that agent's created_at — see routers/chat.py and
    routers/agents.py for the matching logic). During those 7 days the
    user may have at most 1 agent.
  - After the trial: the user may have up to 10 agents total, but
    building a NEW agent while not on trial requires a wallet balance
    of at least $8 (one hot lead's worth) — otherwise they're asked to
    top up first. This mirrors the same $8 gate used to keep an
    existing agent active.
"""
from __future__ import annotations

import json
import logging
import re
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import settings
from services.auth import get_current_user
from services import repo
from pipeline import run_pipeline

log = logging.getLogger("easybuilda.interview")
router = APIRouter(prefix="/api", tags=["interview"])

# ── Model routing ──────────────────────────────────────────────────
# Interview uses the smartest model — users must be wowed
INTERVIEW_MODEL = "anthropic/claude-sonnet-4-6"
FALLBACK_MODEL  = "openrouter/auto"

# ── Agent-count limits (new single-pricing model) ──────────────────
TRIAL_DAYS      = 7
MAX_AGENTS      = 3   # flat limit for every user, trial or paid — no distinction
MIN_BALANCE_USD = repo.HOT_LEAD_PRICE  # $8 — required to build a new agent once off trial

# ── INTERVIEWER SYSTEM PROMPT ─────────────────────────────────────
# Persuasive, professional, intelligent — extracts deep business context
INTERVIEWER_SYSTEM = """You are an elite AI business consultant and interviewer working for EasyBuilda — a platform that builds AI agents for businesses.

Your mission: deeply understand a business owner's operation AND make them excited about having an AI agent. You do both simultaneously — extract information AND sell the value. Take as many messages as genuinely needed (typically 10-16) — depth matters far more than speed, because everything you learn here becomes the knowledge the AI agent uses with real customers.

═══════════════════════════════════════════
CRITICAL RULE — NEVER ASK FOR THE OWNER'S PERSONAL CONTACT INFO
═══════════════════════════════════════════
Do NOT ask the business owner for their own phone number, personal email, or "how can customers reach you directly." EasyBuilda's entire model is that visitors talk to the AI agent INSIDE the platform, and the agent captures their info as a Lead inside the dashboard — there is no external hand-off. Never collect or ask about the owner's personal contact channel. You MAY ask about the business's public booking link or website if it's relevant context for the agent to mention, but this is optional and never a focus area.

═══════════════════════════════════════════
PERSONALITY & STYLE
═══════════════════════════════════════════
- Warm, intelligent, professional — like a McKinsey consultant who's also genuinely friendly
- Confident and direct, never robotic or generic
- Ask one focused question at a time — never multiple questions
- Show you understood their previous answer before asking the next question
- Use their business type to ask SPECIFIC questions — a restaurant gets different questions than a law firm
- Drop casual insights: "With a medical practice, patients often ask about insurance coverage first — so let's make sure your agent handles that perfectly."

═══════════════════════════════════════════
PERSUASION STRATEGY (naturally woven in)
═══════════════════════════════════════════
Weave these naturally throughout — never salesy or pushy:
- Reference what businesses like theirs lose without 24/7 availability ("Studies show 78% of potential clients contact you outside business hours")
- Show specific ROI for their type ("A restaurant with an AI agent books on average 31% more reservations from website visitors")
- Make them visualize: "Imagine a potential client visits your website at 11pm on a Sunday — right now they leave. With your AI agent, they get an answer in seconds and become a lead in your dashboard."
- Create gentle urgency: "Your competitors in [their city/industry] are already doing this"
- After each of their answers, briefly confirm what their agent will do with that info: "Perfect — I'll make sure your agent knows to mention the 48-hour cancellation policy upfront."
- Frequently remind them where the value lands: every real conversation becomes a Lead they can see, with full context, inside their EasyBuilda dashboard — they never miss a serious customer again.

═══════════════════════════════════════════
INFORMATION TO EXTRACT (adapt per business type) — GO DEEP, NOT SHALLOW
═══════════════════════════════════════════
This is the single most important driver of agent quality. A shallow interview produces a generic, unhelpful agent. Push for real specifics, real numbers, real edge cases — not vague answers. If an answer is generic ("we offer good service"), gently ask a sharper follow-up ("What does that look like day to day — walk me through what happens when a new customer first reaches out?").

PHASE 1 — Understand the business (early):
- Business name and type
- What they do + who their ideal customers are (be specific: age range, what problem brings them in, how they usually find the business)
- Their main services/products — and REAL prices or price ranges, not just categories
- What a typical customer journey looks like from first contact to becoming a paying customer

PHASE 2 — Operations deep dive:
- Working hours (including weekends/holidays if relevant)
- Location or service area (or remote/online), including any areas they explicitly DON'T serve
- How bookings/orders currently happen (so the agent mirrors the real process, not a guess)
- The most common questions customers ask before buying — get at least 3-5 real examples
- The most common objections or hesitations customers have, and how the owner usually responds to them
- Any policies that matter: cancellations, refunds, payment methods accepted, deposits, guarantees
- Anything customers frequently get confused about or ask to clarify

PHASE 3 — Differentiation & proof:
- What genuinely makes them different/better than competitors — push past generic answers here
- Credentials, certifications, awards, years in business, notable results or testimonials worth mentioning
- Any current promotions, seasonal offers, or bundles
- Anything the owner wishes customers asked about more, or wishes the agent could "sell" better

PHASE 4 — Shaping the agent itself:
- What tone fits best: friendly, professional, luxury, energetic, casual — and WHY, given their customers
- A name and personality for the agent if they have a preference (or let EasyBuilda suggest one that fits)
- Any topics or situations where the agent should hand things off carefully or stay cautious (e.g. medical advice, legal advice, pricing exceptions, complaints)
- Any business website, booking link, or socials — this is purely background reading for the agent to understand the business better. The agent will NEVER display, share, or send this link to a visitor; it stays internal context only.

PHASE 5 — Final open-ended catch-all (ALWAYS ask before COLLECTION_DONE):
Before finishing, always ask one open, generous question along these lines:
"Last thing — is there anything else about your business, your customers, or exactly how you'd want your AI agent to act or sound that I haven't asked about yet? Anything at all that would help it represent you better?"
Take their answer seriously and incorporate it. If they say "no, that's everything," that's a valid answer and you can proceed to COLLECTION_DONE.

═══════════════════════════════════════════
BUSINESS TYPE ADAPTATIONS
═══════════════════════════════════════════
Medical/Dental: ask about insurance, appointment types, new patient process, emergency protocol, what conditions/procedures they handle most
Restaurant: ask about menu highlights, reservations, delivery/takeout, dietary options, hours, group bookings
Real estate: ask about areas served, property types, buyer vs seller focus, consultation process, typical price ranges
Law firm: ask about practice areas, free consultations, case types, jurisdiction, typical case timelines
E-commerce: ask about products, shipping, return policy, bestsellers, sizing/fit questions if relevant
Personal brand/coach: ask about programs, methodology, client results, booking process, pricing tiers
General: ask about main services, customer journey, most common questions, what a "great customer experience" looks like for them specifically

═══════════════════════════════════════════
COLLECTION COMPLETION
═══════════════════════════════════════════
Only end with COLLECTION_DONE after you have asked the Phase 5 open-ended catch-all question AND gotten a real answer (even if that answer is "nothing else"). Before that point, do not add COLLECTION_DONE no matter how many messages have passed — better to ask one more sharp question than to build a shallow agent.

The final message before COLLECTION_DONE should be warm and exciting:
Example: "This is excellent — I have everything I need to build an outstanding AI agent for [Business Name]. I can already see this is going to be incredibly valuable for your customers, and every conversation it has will show up as a Lead right in your dashboard. Let me build it now! COLLECTION_DONE"

═══════════════════════════════════════════
FIRST MESSAGE
═══════════════════════════════════════════
Start with energy and warmth. Example:
"Welcome! I'm going to ask you some questions to build your AI agent — and the deeper we go, the smarter and more useful your agent will be for real customers.

Most businesses lose 60-70% of potential customers who reach out outside business hours. We're about to change that — and every conversation your agent has will land as a Lead right in your dashboard, so you never miss one.

First: what's the name of your business, and what do you do? 🚀"

Remember: you're not just collecting data — you're making them excited about what's coming, and the depth of this conversation directly determines how good their agent will be.
"""

# ── Schemas ────────────────────────────────────────────────────────

class ChatMsg(BaseModel):
    role: str
    content: str

class InterviewChatRequest(BaseModel):
    messages: list[ChatMsg]

class BuildRequest(BaseModel):
    messages: list[ChatMsg]
    username: str | None = None

class UpdateAgentFieldsRequest(BaseModel):
    fields: dict

# ── Helpers ────────────────────────────────────────────────────────

RESERVED = {
    "api","app","admin","dashboard","login","signup","signin","logout",
    "settings","billing","pricing","about","support","help","docs",
    "u","agent","agents","chat","leads","embed","widget","www","static",
    "interview","build","payment","auth","callback","terms","privacy",
    "home","index","explore","wallet","backend",
}
_SLUG_RE = re.compile(r"^[a-z0-9-]{3,24}$")


def _make_username(slug: str, desired: str | None) -> str:
    if desired:
        d = desired.strip().lower()
        if not _SLUG_RE.fullmatch(d) or d in RESERVED:
            raise HTTPException(400, "Username must be 3-24 lowercase chars (a-z, 0-9, -) and not reserved.")
        if repo.username_taken(d):
            raise HTTPException(409, "That username is already taken.")
        return d
    base = re.sub(r"[^a-z0-9]+", "-", (slug or "agent").lower()).strip("-")[:18] or "agent"
    for _ in range(10):
        candidate = f"{base}-{secrets.token_hex(2)}"
        if not repo.username_taken(candidate) and candidate not in RESERVED:
            return candidate
    return f"agent-{secrets.token_hex(4)}"


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:24] or "agent"


def _safe_json_dumps_dict(value) -> str:
    """
    Serialize `value` to a JSON string for the editable_fields column,
    guarding against double-encoding: if `value` is already a JSON
    string (e.g. the pipeline returned it pre-serialized), decode it
    first so we never end up storing a JSON string OF a JSON string.
    """
    decoded = value
    for _ in range(2):  # unwrap at most twice — never trust deeper nesting
        if isinstance(decoded, str):
            try:
                decoded = json.loads(decoded)
            except Exception:
                decoded = {}
                break
        else:
            break
    if not isinstance(decoded, dict):
        decoded = {}
    return json.dumps(decoded)


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    try:
        s = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _check_can_build_new_agent(user_id: str) -> None:
    """
    Raises HTTPException if the user is not allowed to build another
    agent right now. Single flat rule for every user, trial or paid:
      - Maximum of MAX_AGENTS (3) agents total, period. Trial status
        does not change this number — it only changes whether leads
        cost money (free during the first 7 days, $8/hot lead after).
      - First agent ever -> always allowed (this IS what starts the
        7-day trial window for the whole account).
      - For the 2nd and 3rd agent: if the account's trial (counted
        from the first agent's created_at) has already ended, a
        wallet balance of at least $8 is required to build a new one
        — same gate used to keep an existing agent active.
    """
    existing = repo.list_agents_by_user(user_id)

    if not existing:
        return  # first agent ever — always allowed, this starts the trial

    if len(existing) >= MAX_AGENTS:
        raise HTTPException(402, f"You've reached the maximum of {MAX_AGENTS} agents.")

    # Determine trial state from the user's very first agent.
    first_agent   = min(existing, key=lambda a: a.get("created_at") or "")
    first_created = _parse_dt(first_agent.get("created_at"))
    on_trial = False
    if first_created:
        age_days = (datetime.now(timezone.utc) - first_created).total_seconds() / 86400
        on_trial = age_days < TRIAL_DAYS

    if on_trial:
        return  # still inside the account's free trial window — no balance needed yet

    # Trial over — require wallet balance to build a new agent.
    wallet  = repo.get_wallet(user_id) or {}
    balance = float(wallet.get("balance", 0) or 0)
    if balance < MIN_BALANCE_USD:
        raise HTTPException(
            402,
            f"Your free trial has ended. Top up at least ${MIN_BALANCE_USD:.0f} to your wallet to build another agent.",
        )


async def _call_llm(messages: list[dict], max_tokens: int = 600) -> str:
    """Call OpenRouter with fallback."""
    import httpx
    payload = {
        "model":       INTERVIEW_MODEL,
        "messages":    messages,
        "max_tokens":  max_tokens,
        "temperature": 0.75,
    }
    headers = {
        "Authorization":  f"Bearer {settings.openrouter_trial_key}",
        "Content-Type":   "application/json",
        "HTTP-Referer":   "https://easybuilda.com",
        "X-Title":        "EasyBuilda",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        log.warning("Primary model failed (%s) — fallback", e)
        # Fallback
        payload["model"] = FALLBACK_MODEL
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()


# ── Interview: one turn ────────────────────────────────────────────

@router.post("/interview/chat")
async def interview_chat(
    req: InterviewChatRequest,
    user=Depends(get_current_user),
):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    full_msgs = [{"role": "system", "content": INTERVIEWER_SYSTEM}] + messages

    reply = await _call_llm(full_msgs)

    done  = "COLLECTION_DONE" in reply
    if done:
        reply = reply.replace("COLLECTION_DONE", "").strip()

    return {"reply": reply, "done": done}


# ── Build: streaming SSE ───────────────────────────────────────────

@router.post("/build/stream")
async def build_stream(
    req: BuildRequest,
    user=Depends(get_current_user),
):
    user_id = user["id"]
    _check_can_build_new_agent(user_id)

    # Convert messages to answers dict for new pipeline
    answers_from_messages = {"conversation": " | ".join(m.content for m in req.messages if m.role == "user")}

    async def stream():
        agent_payload = None
        try:
            async for chunk in run_pipeline(answers_from_messages, api_key=settings.openrouter_trial_key, plan="standard"):
                if chunk.startswith("event: complete"):
                    try:
                        data_line = [l for l in chunk.split("\n") if l.startswith("data:")][0]
                        data = json.loads(data_line[5:])
                        agent_payload = data.get("agent")
                    except Exception:
                        pass
                yield chunk
        except Exception as e:
            log.error("Pipeline error: %s", e)
            yield f"event: error\ndata: {json.dumps({'message': 'Build failed — please try again.'})}\n\n"
            return

        # Save agent
        if agent_payload:
            try:
                slug     = _slugify(agent_payload.get("business_name", "agent"))
                username = _make_username(slug, req.username)

                agent_payload["subdomain"]  = username
                agent_payload["username"]   = username
                agent_payload["user_id"]    = user_id
                agent_payload["status"]     = "active"

                editable  = agent_payload.pop("editable_fields", {})
                leads_pin = agent_payload.get("leads_pin") or str(secrets.randbelow(900000) + 100000)
                agent_payload["leads_pin"] = leads_pin

                saved = repo.insert_agent({**agent_payload, "editable_fields": _safe_json_dumps_dict(editable)})

                yield f"event: saved\ndata: {json.dumps({'agent_id': saved['id'], 'username': username, 'leads_pin': leads_pin})}\n\n"
                log.info("Agent built: @%s for user %s", username, user_id)
            except Exception as e:
                log.error("Agent save error: %s", e)
                yield f"event: error\ndata: {json.dumps({'message': 'Agent built but could not be saved. Please try again.'})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Username check ─────────────────────────────────────────────────

@router.get("/username/check")
async def check_username(username: str, agent_id: str | None = None, user=Depends(get_current_user)):
    slug = re.sub(r"[^a-z0-9-]+", "-", username.lower()).strip("-")[:24]
    if not slug or len(slug) < 3:
        return {"available": False, "reason": "Too short (min 3 chars)"}
    if slug in RESERVED:
        return {"available": False, "reason": "Reserved word"}
    taken = repo.username_taken(slug, exclude_agent_id=agent_id)
    return {"available": not taken, "slug": slug}


@router.patch("/agents/{agent_id}/username")
async def update_agent_username(
    agent_id: str,
    req: UpdateAgentFieldsRequest,
    user=Depends(get_current_user),
):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")

    username = req.fields.get("username", "").strip().lower()
    slug     = re.sub(r"[^a-z0-9-]+", "-", username).strip("-")[:24]

    if len(slug) < 3:
        raise HTTPException(400, "Username must be at least 3 characters.")
    if slug in RESERVED:
        raise HTTPException(400, f"'{slug}' is a reserved word.")
    if repo.username_taken(slug, exclude_agent_id=agent_id):
        raise HTTPException(409, "Username already taken.")

    repo.update_agent(agent_id, {"subdomain": slug, "username": slug})
    return {"ok": True, "username": slug}


# ── Agent fields ────────────────────────────────────────────────────

@router.patch("/agents/{agent_id}/fields")
async def update_agent_fields(
    agent_id: str,
    req: UpdateAgentFieldsRequest,
    user=Depends(get_current_user),
):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")

    # Merge with existing editable_fields — defensively handle
    # double-encoded JSON (a string that decodes into ANOTHER string,
    # which then needs a second decode to reach the actual dict).
    existing: dict = {}
    raw = agent.get("editable_fields")
    for _ in range(2):  # decode at most twice — never trust deeper nesting
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except Exception:
                raw = None
                break
        else:
            break
    if isinstance(raw, dict):
        existing = raw

    merged = {**existing, **req.fields}

    # Map to DB columns. The frontend's AgentEditor sends the agent's
    # display name under the key "name" (matching the `agents.name`
    # column directly), while the dynamic-interview field flow uses
    # "agent_name". Normalize "name" -> "agent_name" in `merged` so a
    # single direct_map lookup below covers both callers.
    if "name" in req.fields:
        merged["agent_name"] = req.fields["name"]

    direct_map = {
        "agent_name":     "name",
        "welcome_message":"welcome_message",
        "tone":           "tone",
        "primary_color":  "primary_color",
        "tagline":        "tagline",
        "system_prompt":  "system_prompt",
    }
    update_payload: dict = {"editable_fields": _safe_json_dumps_dict(merged)}
    for fk, col in direct_map.items():
        if fk in merged:
            update_payload[col] = merged[fk]

    # Rebuild knowledge base if knowledge fields changed
    knowledge_fields = [
        "services", "hours", "location", "policies", "booking_link",
        "common_questions", "objections", "differentiation", "anything_else",
    ]
    if any(f in req.fields for f in knowledge_fields):
        labels = {
            "services":         "Services & Pricing",
            "hours":            "Business Hours",
            "location":         "Location",
            "policies":         "Policies",
            "booking_link":     "Website (internal context only — never shown to visitors)",
            "common_questions": "Common Customer Questions",
            "objections":       "Common Objections & How To Respond",
            "differentiation":  "What Makes This Business Different",
            "anything_else":    "Additional Notes From The Owner",
        }
        parts = []
        for f in knowledge_fields:
            val = merged.get(f, "")
            if val and val.strip():
                parts.append(f"## {labels[f]}\n{val.strip()}")
        if parts:
            update_payload["knowledge"] = "\n\n".join(parts)

    repo.update_agent(agent_id, update_payload)
    return {"ok": True, "fields": merged}


@router.get("/agents/{agent_id}/fields")
async def get_agent_fields(
    agent_id: str,
    user=Depends(get_current_user),
):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")

    raw    = agent.get("editable_fields")
    fields = {}
    if raw:
        try:
            fields = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass

    if not fields:
        fields = {
            "agent_name":     agent.get("name", ""),
            "tagline":        agent.get("tagline", ""),
            "welcome_message":agent.get("welcome_message", ""),
            "tone":           agent.get("tone", "friendly"),
            "primary_color":  agent.get("primary_color", "#7c3aed"),
            "services":       "",
            "hours":          "",
            "location":       "",
            "policies":       "",
            "booking_link":   "",
        }

    return {
        "fields": fields,
        "agent": {
            "id":             agent["id"],
            "name":           agent.get("name"),
            "username":       agent.get("subdomain"),
            "readiness_score":agent.get("readiness_score"),
        },
    }

# ── Next field generator ───────────────────────────────────────────

class NextFieldRequest(BaseModel):
    answers:   str
    used_keys: list[str]

@router.post("/interview/next-field")
async def get_next_field(req: NextFieldRequest, user=Depends(get_current_user)):
    """Generate the next form field based on answers so far."""
    prompt = f"""You are building an AI agent setup form for a business owner.

They have answered so far:
{req.answers}

Already asked fields: {", ".join(req.used_keys)}

Available fields to ask next (pick the MOST important missing ONE):
- services: "What services or products do you offer, with pricing?" (textarea) - push for real prices, not just categories
- hours: "What are your business hours?" (text)
- location: "Where are you located? Or do you operate online?" (text)
- target_customer: "Who is your ideal customer?" (text) - be specific, not generic
- common_questions: "What are the 3-5 questions customers ask most before buying?" (textarea)
- objections: "What hesitations or objections do customers usually have, and how do you usually respond?" (textarea)
- policies: "Any important policies customers should know?" (textarea) - returns, cancellations, payment, deposits
- differentiation: "What genuinely makes you different from competitors?" (textarea)
- tone: "What tone should your AI agent use?" (select) - options: ["Friendly & Warm", "Professional & Formal", "Energetic & Upbeat", "Luxury & Refined", "Casual & Relaxed"]
- agent_name: "What should we name your AI agent?" (text) - suggest based on business name
- booking_link: "Do you have an official website? This is just background context the agent can read to understand your business better — it will NEVER show this link or any URL to customers." (text) - optional, business-public only, never the owner's personal phone/email
- anything_else: "Anything else about your business or how you'd want your AI agent to act that we haven't covered?" (textarea) - ALWAYS ask this LAST, right before finishing

Rules:
- Never propose a field asking for the owner's personal phone number or personal email — that information is never collected here.
- Ask "anything_else" only once, and only after every other relevant field above has been covered — it should be the final field before {{"done": true}}.
- If "anything_else" has already been asked (check used_keys), return {{"done": true}}
- If we have 10+ answers already and "anything_else" is in used_keys, return {{"done": true}}
- Pick the field that will most improve the agent's depth and quality
- Return ONLY valid JSON, no markdown:
  {{"key":"field_key","label":"Question text?","hint":"Short helpful tip","type":"text|textarea|select","options":["opt1"] or null,"placeholder":"Example answer…"}}
  OR if enough info: {{"done": true}}"""

    try:
        reply = await _call_llm([{"role": "user", "content": prompt}], max_tokens=300)
        clean = reply.replace("```json", "").replace("```", "").strip()
        data  = json.loads(clean)
        if data.get("done"):
            return {"done": True}
        return {
            "done":        False,
            "key":         data.get("key", "details"),
            "label":       data.get("label", "Tell us more"),
            "hint":        data.get("hint", ""),
            "type":        data.get("type", "text"),
            "options":     data.get("options"),
            "placeholder": data.get("placeholder", "Type your answer here…"),
        }
    except Exception as e:
        log.error("next_field error: %s", e)
        return {"done": True}


# ── Simple build from answers dict ────────────────────────────────

class StartBuildRequest(BaseModel):
    answers: dict  # key -> value


async def _run_pipeline_collect(answers, api_key, plan):
    """Run pipeline and collect agent_payload. Returns (agent_payload, error_msg, need_more)."""
    agent_payload = None
    error_msg = None
    need_more = False
    try:
        async for chunk in run_pipeline(answers, api_key=api_key, plan=plan):
            if "event: complete" in chunk:
                try:
                    for line in chunk.split("\n"):
                        if line.startswith("data:"):
                            data = json.loads(line[5:])
                            agent_payload = data.get("agent")
                            break
                except Exception as e:
                    log.error("parse complete: %s", e)
            elif "event: need_more" in chunk:
                need_more = True
            elif "event: error" in chunk:
                try:
                    for line in chunk.split("\n"):
                        if line.startswith("data:"):
                            data = json.loads(line[5:])
                            error_msg = data.get("message", "Build failed")
                            break
                except Exception:
                    error_msg = "Build failed"
    except Exception as e:
        import traceback
        log.error("pipeline error: %s\n%s", e, traceback.format_exc())
        error_msg = str(e)
    return agent_payload, error_msg, need_more


@router.post("/interview/start")
async def interview_start(req: StartBuildRequest, user=Depends(get_current_user)):
    """Build agent from form answers. Non-streaming."""
    user_id = user["id"]
    _check_can_build_new_agent(user_id)

    answers_text = "\n".join(
        f"{k.replace('_', ' ').title()}: {v}"
        for k, v in req.answers.items() if v
    )

    log.info("interview_start: running pipeline for user %s", user_id)
    agent_payload, error_msg, _ = await _run_pipeline_collect(req.answers, settings.openrouter_trial_key, "standard")

    if error_msg and not agent_payload:
        log.error("interview_start error: %s", error_msg)
        raise HTTPException(500, error_msg or "Build failed")

    if not agent_payload:
        log.error("interview_start: no agent_payload after pipeline")
        raise HTTPException(500, "Agent was not created — please try again.")

    try:
        slug     = _slugify(agent_payload.get("business_name") or req.answers.get("business_name", "agent"))
        username = _make_username(slug, None)

        agent_payload["subdomain"] = username
        agent_payload["username"]  = username
        agent_payload["user_id"]   = user_id
        agent_payload["status"]    = "active"

        editable  = agent_payload.pop("editable_fields", {})
        leads_pin = agent_payload.get("leads_pin") or str(secrets.randbelow(900000) + 100000)
        agent_payload["leads_pin"] = leads_pin

        saved = repo.insert_agent({**agent_payload, "editable_fields": _safe_json_dumps_dict(editable)})

        log.info("Agent built: @%s for user %s", username, user_id)
        return {"ok": True, "agent_id": saved["id"], "username": username, "agent": saved}

    except Exception as e:
        import traceback
        log.error("Agent save error: %s\n%s", e, traceback.format_exc())
        raise HTTPException(500, f"Agent built but save failed: {str(e)[:150]}")