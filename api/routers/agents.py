"""Agent build + read + leads endpoints."""
from __future__ import annotations

import logging
import re
import secrets

from fastapi import APIRouter, HTTPException

from schemas import BuildAgentRequest
from services import agent_builder, repo
from services.chat import model_for_plan

log = logging.getLogger("easybuilda.agents")
router = APIRouter(prefix="/api", tags=["agents"])

RESERVED = {
    "api", "app", "admin", "dashboard", "login", "signup", "signin", "logout",
    "settings", "billing", "pricing", "about", "support", "help", "docs",
    "u", "agent", "agents", "chat", "leads", "embed", "widget", "www", "static",
}
_SLUG_RE = re.compile(r"^[a-z0-9-]{3,24}$")

PUBLIC_FIELDS = (
    "id", "name", "business_name", "tagline", "subdomain", "welcome_message",
    "suggested_questions", "primary_color", "status", "plan",
    "readiness_score", "readiness_notes",
)
OWNER_FIELDS = PUBLIC_FIELDS + ("leads_pin",)


def _public(agent: dict) -> dict:
    data = {k: agent.get(k) for k in PUBLIC_FIELDS}
    data["username"] = agent.get("subdomain")
    return data


def _owner(agent: dict) -> dict:
    """Full agent data including PIN — only returned to the builder."""
    data = {k: agent.get(k) for k in OWNER_FIELDS}
    data["username"] = agent.get("subdomain")
    return data


def _make_username(slug: str, desired: str | None) -> str:
    if desired:
        d = desired.strip().lower()
        if not _SLUG_RE.fullmatch(d) or d in RESERVED:
            raise HTTPException(400, "Username must be 3-24 chars (a-z, 0-9, -) and not reserved.")
        if repo.username_taken(d):
            raise HTTPException(409, "That username is already taken.")
        return d
    base = (slug or "agent").strip("-")[:18] or "agent"
    for _ in range(8):
        candidate = f"{base}-{secrets.token_hex(2)}"
        if not repo.username_taken(candidate):
            return candidate
    return f"agent-{secrets.token_hex(4)}"


def _gen_pin() -> str:
    """Generate a secure 6-digit numeric PIN."""
    return str(secrets.randbelow(900000) + 100000)  # always 6 digits: 100000–999999


@router.post("/agents/build")
async def build_agent(req: BuildAgentRequest):
    profile = await agent_builder.build_agent_profile(
        business_name=req.business_name,
        business_description=req.business_description,
        services=req.services,
        website_url=req.website_url,
        tone=req.tone,
        model=model_for_plan(req.plan),
    )
    username = _make_username(profile["slug"], req.username)

    payload = {
        "name": profile["agent_name"],
        "business_name": req.business_name,
        "business_description": req.business_description,
        "tone": req.tone or "friendly and professional",
        "persona": profile["system_prompt"],
        "knowledge": profile["knowledge_base"],
        "faq": profile["faq"],
        "welcome_message": profile["welcome_message"],
        "tagline": profile["tagline"],
        "suggested_questions": profile["suggested_questions"],
        "primary_color": profile["primary_color"],
        "subdomain": username,
        "plan": req.plan,
        "status": "active",
        "readiness_score": profile["readiness_score"],
        "readiness_notes": profile["readiness_notes"],
        "website_url": req.website_url,
        "leads_pin": _gen_pin(),
    }
    if req.owner_id:
        payload["user_id"] = req.owner_id

    agent = repo.insert_agent(payload)
    log.info(
        "Built agent '%s' (@%s, readiness %s, pin ***%s) for %s",
        profile["agent_name"], username, profile["readiness_score"],
        payload["leads_pin"][-2:], req.business_name,
    )
    # Return owner view — includes PIN (show once to the builder)
    return {"agent": _owner(agent)}


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    return {"agent": _public(agent)}


@router.get("/u/{username}")
async def get_agent_by_username(username: str):
    agent = repo.get_agent_by_username(username.lower())
    if not agent or agent.get("status") != "active":
        raise HTTPException(404, "Agent not found.")
    return {"agent": _public(agent)}


@router.get("/agents/{agent_id}/leads")
async def get_leads(agent_id: str, pin: str | None = None):
    """Returns leads. Requires ?pin=XXXXXX matching the agent's leads_pin."""
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")

    stored_pin = agent.get("leads_pin")
    if not stored_pin:
        raise HTTPException(403, "No PIN set. Rebuild the agent to enable PIN protection.")
    if not pin:
        raise HTTPException(401, "PIN required.")
    if pin.strip() != stored_pin:
        raise HTTPException(403, "Incorrect PIN.")

    leads = repo.list_leads(agent_id)
    return {"count": len(leads), "leads": leads}