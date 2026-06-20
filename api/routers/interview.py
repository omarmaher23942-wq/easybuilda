"""
EasyBuilda — Interview & Build router
AI Interviewer: persuasive, intelligent, extracts full business context in 8-12 messages
"""
from __future__ import annotations

import json
import logging
import re
import secrets

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

# ── INTERVIEWER SYSTEM PROMPT ─────────────────────────────────────
# Persuasive, professional, intelligent — extracts deep business context
INTERVIEWER_SYSTEM = """You are an elite AI business consultant and interviewer working for EasyBuilda — a platform that builds AI agents for businesses.

Your mission: In 8-12 messages, deeply understand a business owner's operation AND make them excited about having an AI agent. You do both simultaneously — extract information AND sell the value.

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
- Make them visualize: "Imagine a potential client visits your website at 11pm on a Sunday — right now they leave. With your AI agent, they get an answer in seconds and book an appointment."
- Create gentle urgency: "Your competitors in [their city/industry] are already doing this"
- After each of their answers, briefly confirm what their agent will do with that info: "Perfect — I'll make sure your agent knows to mention the 48-hour cancellation policy upfront."

═══════════════════════════════════════════
INFORMATION TO EXTRACT (adapt per business type)
═══════════════════════════════════════════
Start broad, then go deep:

PHASE 1 — Understand the business (messages 1-3):
- Business name and type
- What they do + who their customers are
- Their main services/products + rough prices

PHASE 2 — Operations deep dive (messages 4-7):
- Working hours
- Location or service area (or remote/online)
- How customers contact/book currently
- Common questions customers ask
- Any policies (returns, cancellations, payments accepted)

PHASE 3 — Differentiation (messages 8-10):
- What makes them different/better than competitors
- Anything special (awards, certifications, years in business)
- Any promotions or offers

PHASE 4 — Finish strong (messages 11-12):
- Contact details (phone, email, booking link)
- Website or social media
- Preferred tone for their agent

═══════════════════════════════════════════
BUSINESS TYPE ADAPTATIONS
═══════════════════════════════════════════
Medical/Dental: ask about insurance, appointment types, new patient process, emergency protocol
Restaurant: ask about menu highlights, reservations, delivery/takeout, dietary options, hours
Real estate: ask about areas served, property types, buyer vs seller focus, consultation process
Law firm: ask about practice areas, free consultations, case types, jurisdiction
E-commerce: ask about products, shipping, return policy, bestsellers
Personal brand/coach: ask about programs, methodology, client results, booking process
General: ask about main services, customer journey, most common questions

═══════════════════════════════════════════
COLLECTION COMPLETION
═══════════════════════════════════════════
After you have collected sufficient information (minimum 8 exchanges, covering: business name, type, services/prices, hours, location, contact, policies, and USP), end your FINAL message with exactly: COLLECTION_DONE

The final message before COLLECTION_DONE should be warm and exciting:
Example: "This is excellent — I have everything I need to build an outstanding AI agent for [Business Name]. I can already see this is going to be incredibly valuable for your customers. Let me build it now! COLLECTION_DONE"

Do NOT add COLLECTION_DONE until you genuinely have all the essential information. Better to ask one more question than to build an incomplete agent.

═══════════════════════════════════════════
FIRST MESSAGE
═══════════════════════════════════════════
Start with energy and warmth. Example:
"Welcome! I'm going to ask you a few questions to build your AI agent — and I promise this will be worth every minute. 

Most businesses lose 60-70% of potential customers who reach out outside business hours. We're about to change that for you.

First: what's the name of your business, and what do you do? 🚀"

Remember: you're not just collecting data — you're making them excited about what's coming.
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

PLAN_LIMITS = {
    "trial":       {"agents": 1},
    "basic":       {"agents": 1},
    "pro":         {"agents": 2},
    "max":         {"agents": 3},
    "singularity": {"agents": 3},
    "admin":       {"agents": 99},
}


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
    user_id  = user["id"]
    profile  = repo.get_profile(user_id) or {}
    plan     = profile.get("plan", "trial")
    limit    = PLAN_LIMITS.get(plan, {"agents": 1})["agents"]

    # Use total_agents_created — deleting does NOT reset the limit
    period_used = int(profile.get("total_agents_created") or 0)
    if period_used >= limit:
        raise HTTPException(402, f"Plan limit reached ({limit} agent{'s' if limit > 1 else ''}). Upgrade to add more.")

    # Check trial expiry
    if plan == "trial":
        trial_ends = profile.get("trial_ends_at")
        if trial_ends:
            from datetime import datetime, timezone
            ends_dt = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > ends_dt:
                raise HTTPException(402, "Your 3-day trial has ended. Upgrade to continue.")

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def stream():
        agent_payload = None
        try:
            async for chunk in run_pipeline(messages, api_key=settings.openrouter_trial_key, plan=plan):
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
                agent_payload["plan"]       = plan
                agent_payload["status"]     = "active"

                editable = agent_payload.pop("editable_fields", {})
                leads_pin = agent_payload.get("leads_pin") or str(secrets.randbelow(900000) + 100000)
                agent_payload["leads_pin"] = leads_pin

                saved = repo.insert_agent({**agent_payload, "editable_fields": json.dumps(editable)})

                # Increment period_agents_created
                repo.update_profile(user_id, {
                    "period_agents_created": period_used + 1,
                })

                yield f"event: saved\ndata: {json.dumps({'agent_id': saved['id'], 'username': username, 'leads_pin': leads_pin})}\n\n"
                log.info("Agent built: @%s for user %s plan=%s", username, user_id, plan)
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

    # Merge with existing editable_fields
    existing = {}
    raw = agent.get("editable_fields")
    if raw:
        try:
            existing = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass

    merged = {**existing, **req.fields}

    # Map to DB columns
    direct_map = {
        "agent_name":     "name",
        "welcome_message":"welcome_message",
        "tone":           "tone",
        "primary_color":  "primary_color",
        "tagline":        "tagline",
    }
    update_payload: dict = {"editable_fields": json.dumps(merged)}
    for fk, col in direct_map.items():
        if fk in req.fields:
            update_payload[col] = req.fields[fk]

    # Rebuild knowledge base if knowledge fields changed
    knowledge_fields = ["services","hours","location","policies","contact"]
    if any(f in req.fields for f in knowledge_fields):
        labels = {
            "services":"Services & Pricing", "hours":"Business Hours",
            "location":"Location", "policies":"Policies", "contact":"Contact & Booking",
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
            "contact":        "",
        }

    return {
        "fields": fields,
        "agent": {
            "id":             agent["id"],
            "name":           agent.get("name"),
            "username":       agent.get("subdomain"),
            "readiness_score":agent.get("readiness_score"),
            "plan":           agent.get("plan"),
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
- services: "What services or products do you offer?" (textarea) - include pricing if available
- hours: "What are your business hours?" (text)
- location: "Where are you located? Or do you operate online?" (text)
- contact: "How can customers reach or book you?" (text) - phone, email, booking link
- tone: "What tone should your AI agent use?" (select) - options: ["Friendly & Warm", "Professional & Formal", "Energetic & Upbeat", "Luxury & Refined", "Casual & Relaxed"]
- target_customer: "Who is your ideal customer?" (text)
- policies: "Any important policies customers should know?" (textarea) - returns, cancellations, payment
- agent_name: "What should we name your AI agent?" (text) - suggest based on business name

Rules:
- If we have 7+ answers already, return {{"done": true}}
- Pick the field that will most improve the agent quality
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

@router.post("/interview/start")
async def interview_start(req: StartBuildRequest, user=Depends(get_current_user)):
    """Build agent from form answers dict. Runs pipeline and saves agent to DB."""
    user_id = user["id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")
    limit   = PLAN_LIMITS.get(plan, {"agents": 1})["agents"]

    period_used = int(profile.get("total_agents_created") or 0)
    if period_used >= limit:
        raise HTTPException(402, f"Plan limit reached ({limit} agent). Upgrade to add more.")

    if plan == "trial":
        trial_ends = profile.get("trial_ends_at")
        if trial_ends:
            from datetime import datetime, timezone
            ends_dt = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > ends_dt:
                raise HTTPException(402, "Your 3-day trial has ended. Upgrade to continue.")

    # Convert answers dict to a natural conversation for the pipeline
    answers_text = "\n".join(f"{k.replace('_',' ').title()}: {v}" for k, v in req.answers.items() if v)
    messages = [
        {"role": "user", "content": f"Here is my business information:\n\n{answers_text}\n\nPlease build my AI agent based on this."}
    ]

    # Run pipeline — collect complete event
    agent_payload = None
    error_msg     = None
    try:
        async for chunk in run_pipeline(messages, api_key=settings.openrouter_trial_key, plan=plan):
            if chunk.startswith("event: complete"):
                try:
                    data_line  = [l for l in chunk.split("\n") if l.startswith("data:")][0]
                    data       = json.loads(data_line[5:])
                    agent_payload = data.get("agent")
                except Exception as e:
                    log.error("parse complete event: %s", e)
            elif chunk.startswith("event: error"):
                try:
                    data_line = [l for l in chunk.split("\n") if l.startswith("data:")][0]
                    data      = json.loads(data_line[5:])
                    error_msg = data.get("message", "Build failed")
                except Exception:
                    error_msg = "Build failed"
    except Exception as e:
        log.error("interview_start pipeline: %s", e)
        raise HTTPException(500, "Build failed — please try again.")

    if error_msg:
        raise HTTPException(500, error_msg)

    if not agent_payload:
        raise HTTPException(500, "Agent was not created — please try again.")

    # Save to DB — same logic as build_stream
    try:
        slug      = _slugify(agent_payload.get("business_name") or req.answers.get("business_name", "agent"))
        username  = _make_username(slug, None)

        agent_payload["subdomain"] = username
        agent_payload["username"]  = username
        agent_payload["user_id"]   = user_id
        agent_payload["plan"]      = plan
        agent_payload["status"]    = "active"

        editable  = agent_payload.pop("editable_fields", {})
        leads_pin = agent_payload.get("leads_pin") or str(secrets.randbelow(900000) + 100000)
        agent_payload["leads_pin"] = leads_pin

        saved = repo.insert_agent({**agent_payload, "editable_fields": json.dumps(editable)})

        # Increment total_agents_created
        repo.update_profile(user_id, {
            "total_agents_created": period_used + 1,
            "period_agents_created": period_used + 1,
        })

        log.info("Agent built via form: @%s for user %s plan=%s", username, user_id, plan)

        return {
            "ok":       True,
            "agent_id": saved["id"],
            "username": username,
            "agent":    {**saved, "username": username},
        }
    except Exception as e:
        log.error("Agent save error: %s", e)
        raise HTTPException(500, f"Agent built but could not be saved: {str(e)[:100]}")
