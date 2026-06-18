"""
Interview & Build router — SSE streaming pipeline
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
from pipeline import run_pipeline, _llm, INTERVIEWER_SYSTEM, FAST

log = logging.getLogger("easybuilda.interview")
router = APIRouter(prefix="/api", tags=["interview"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class ChatMsg(BaseModel):
    role: str
    content: str

class InterviewChatRequest(BaseModel):
    messages: list[ChatMsg]  # full conversation so far

class BuildRequest(BaseModel):
    messages: list[ChatMsg]  # full conversation
    username: str | None = None
    plan: str = "trial"

class UpdateAgentFieldsRequest(BaseModel):
    fields: dict  # key-value pairs to update


# ── Interview: one turn ──────────────────────────────────────────────────────

@router.post("/interview/chat")
async def interview_chat(
    req: InterviewChatRequest,
    user=Depends(get_current_user),
):
    """
    Run one turn of the interviewer agent.
    Returns: {reply, done} where done=True means we have enough data.
    """
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    reply = await _llm(
        [{"role": "system", "content": INTERVIEWER_SYSTEM}] + messages,
        model=FAST,
        max_tokens=600,
        temperature=0.75,
        api_key=settings.openrouter_trial_key,
    )

    done = "COLLECTION_DONE" in reply
    if done:
        reply = reply.replace("COLLECTION_DONE", "").strip()

    return {"reply": reply, "done": done}


# ── Build: streaming SSE pipeline ───────────────────────────────────────────

RESERVED = {
    "api", "app", "admin", "dashboard", "login", "signup", "signin",
    "logout", "settings", "billing", "pricing", "about", "support",
    "help", "docs", "u", "agent", "agents", "chat", "leads", "embed",
    "widget", "www", "static", "interview", "build", "payment", "auth",
}
_SLUG_RE = re.compile(r"^[a-z0-9-]{3,24}$")

PLAN_LIMITS = {
    "trial":       {"agents": 1},
    "basic":       {"agents": 1},
    "pro":         {"agents": 2},
    "max":         {"agents": 3},
    "singularity": {"agents": 3},
}


def _make_username(slug: str, desired: str | None) -> str:
    if desired:
        d = desired.strip().lower()
        if not _SLUG_RE.fullmatch(d) or d in RESERVED:
            raise HTTPException(400, "Username must be 3-24 lowercase chars (a-z, 0-9, -) and not reserved.")
        if repo.username_taken(d):
            raise HTTPException(409, "That username is already taken.")
        return d
    base = (slug or "agent").strip("-")[:18] or "agent"
    for _ in range(8):
        candidate = f"{base}-{secrets.token_hex(2)}"
        if not repo.username_taken(candidate):
            return candidate
    return f"agent-{secrets.token_hex(4)}"


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:24] or "agent"


@router.post("/build/stream")
async def build_stream(
    req: BuildRequest,
    user=Depends(get_current_user),
):
    """SSE streaming build pipeline."""
    user_id = user["id"]
    profile = repo.get_profile(user_id)
    plan    = (profile or {}).get("plan", "trial")
    limit   = PLAN_LIMITS.get(plan, {}).get("agents", 1)
    existing = repo.list_agents_by_user(user_id)

    if len(existing) >= limit:
        raise HTTPException(402, f"Plan limit reached ({limit} agent{'s' if limit > 1 else ''}). Upgrade to add more.")

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def stream():
        agent_payload = None
        async for chunk in run_pipeline(
            messages,
            api_key=settings.openrouter_trial_key,
            plan=plan,
        ):
            # capture complete event to save agent
            if chunk.startswith("event: complete"):
                try:
                    data_line = [l for l in chunk.split("\n") if l.startswith("data:")][0]
                    data = json.loads(data_line[5:])
                    agent_payload = data.get("agent")
                except Exception:
                    pass

            yield chunk

        # Save agent to DB
        if agent_payload:
            slug = _slugify(agent_payload.get("business_name", "agent"))
            username = _make_username(slug, req.username)
            agent_payload["subdomain"] = username
            agent_payload["username"] = username
            agent_payload["user_id"] = user_id
            agent_payload["plan"] = plan
            agent_payload["status"] = "active"

            # Store editable_fields as JSON in a dedicated column
            editable = agent_payload.pop("editable_fields", {})

            saved = repo.insert_agent({**agent_payload, "editable_fields": json.dumps(editable)})

            yield f"event: saved\ndata: {json.dumps({'agent_id': saved['id'], 'username': username, 'leads_pin': agent_payload.get('leads_pin', '')})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Update editable fields ────────────────────────────────────────────────────

@router.patch("/agents/{agent_id}/fields")
async def update_agent_fields(
    agent_id: str,
    req: UpdateAgentFieldsRequest,
    user=Depends(get_current_user),
):
    """Update the user-editable fields of an agent."""
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")

    # Parse existing editable_fields
    existing_fields = {}
    raw = agent.get("editable_fields")
    if raw:
        try:
            existing_fields = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass

    # Merge
    merged = {**existing_fields, **req.fields}

    # Also update top-level agent fields that map directly
    direct_map = {
        "agent_name": "name",
        "welcome_message": "welcome_message",
        "tone": "tone",
        "primary_color": "primary_color",
        "tagline": "tagline",
    }

    update_payload: dict = {"editable_fields": json.dumps(merged)}

    for field_key, db_col in direct_map.items():
        if field_key in req.fields:
            update_payload[db_col] = req.fields[field_key]

    # Rebuild knowledge from fields if services/hours/etc changed
    knowledge_fields = ["services", "hours", "location", "policies", "contact"]
    if any(f in req.fields for f in knowledge_fields):
        kb_parts = []
        labels = {
            "services": "Services & Pricing",
            "hours": "Business Hours",
            "location": "Location & Service Area",
            "policies": "Policies",
            "contact": "Contact & Booking",
        }
        for f in knowledge_fields:
            val = merged.get(f, "")
            if val:
                kb_parts.append(f"## {labels[f]}\n{val}")
        if kb_parts:
            update_payload["knowledge"] = "\n\n".join(kb_parts)

    repo.update_agent(agent_id, update_payload)

    return {"ok": True, "fields": merged}


@router.get("/agents/{agent_id}/fields")
async def get_agent_fields(
    agent_id: str,
    user=Depends(get_current_user),
):
    """Get editable fields for the agent editor."""
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")

    raw = agent.get("editable_fields")
    fields = {}
    if raw:
        try:
            fields = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass

    # Fallback: populate from agent columns if fields empty
    if not fields:
        fields = {
            "agent_name": agent.get("name", ""),
            "tagline": agent.get("tagline", ""),
            "welcome_message": agent.get("welcome_message", ""),
            "tone": agent.get("tone", "friendly"),
            "primary_color": agent.get("primary_color", "#7c3aed"),
            "services": "",
            "hours": "",
            "location": "",
            "policies": "",
            "contact": "",
        }

    return {"fields": fields, "agent": {
        "id": agent["id"],
        "name": agent.get("name"),
        "username": agent.get("subdomain"),
        "readiness_score": agent.get("readiness_score"),
    }}