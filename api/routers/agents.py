"""Agent endpoints — Full Production v2.
Plans: trial=1 agent/3days, basic=1, pro=2, max=3, singularity=3+
"""
from __future__ import annotations
import logging, re, secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header
from schemas import BuildAgentRequest
from services import agent_builder, repo
from services.auth import get_current_user
from services.chat import model_for_plan

log = logging.getLogger("easybuilda.agents")
router = APIRouter(prefix="/api", tags=["agents"])

RESERVED = {
    "api","app","admin","dashboard","login","signup","signin","logout",
    "settings","billing","pricing","about","support","help","docs",
    "u","agent","agents","chat","leads","embed","widget","www","static",
    "build","auth","callback","terms","privacy","home","index","payment",
}

# ── Plan definitions ──────────────────────────────────────────────────────────
PLANS = {
    "trial":       {"max_agents": 1,  "price": 0,   "days": 3,  "model": "haiku"},
    "basic":       {"max_agents": 1,  "price": 49,  "days": 30, "model": "sonnet"},
    "pro":         {"max_agents": 2,  "price": 129, "days": 30, "model": "sonnet"},
    "max":         {"max_agents": 3,  "price": 299, "days": 30, "model": "opus"},
    "singularity": {"max_agents": 3,  "price": 699, "days": 30, "model": "opus"},
}

def _public(agent: dict) -> dict:
    KEEP = {"id","name","business_name","tagline","tone","persona","knowledge",
            "faq","welcome_message","suggested_questions","primary_color",
            "subdomain","username","status","readiness_score","plan"}
    a = {k: v for k, v in agent.items() if k in KEEP}
    a["username"] = a.get("username") or a.get("subdomain", "")
    return a

def _owner(agent: dict) -> dict:
    a = dict(agent)
    a["username"] = a.get("username") or a.get("subdomain", "")
    return a

def _make_username(slug: str, desired: str | None) -> str:
    base = re.sub(r"[^a-z0-9-]", "", (desired or slug or "agent").lower())[:28] or "agent"
    candidate = base
    suffix = 0
    while repo.username_taken(candidate) or candidate in RESERVED:
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate

def _gen_pin() -> str:
    return str(secrets.randbelow(900000) + 100000)

def _enforce_plan(user_id: str, profile: dict) -> str:
    """Check plan limits. Returns plan name. Raises 403 if limit hit."""
    plan = profile.get("plan", "trial")
    cfg = PLANS.get(plan, PLANS["trial"])

    # Trial expiry check
    if plan == "trial":
        trial_ends = profile.get("trial_ends_at")
        if trial_ends:
            ends_dt = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > ends_dt:
                raise HTTPException(403,
                    "Your 3-day trial has ended. Upgrade to keep building agents.")

    # Agent count check
    max_a = cfg["max_agents"]
    existing = repo.list_agents_by_user(user_id)
    if len(existing) >= max_a:
        plan_name = plan.capitalize()
        raise HTTPException(403,
            f"Your {plan_name} plan allows {max_a} agent{'s' if max_a != 1 else ''}. "
            f"You already have {len(existing)}. Upgrade to create more.")
    return plan

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/agents/build")
async def build_agent(req: BuildAgentRequest, user=Depends(get_current_user)):
    profile = repo.get_profile(user["id"]) or {}
    plan = _enforce_plan(user["id"], profile)

    # Use cheaper model for trial to control costs
    cfg = PLANS.get(plan, PLANS["trial"])
    model_tier = cfg["model"]

    agent_profile = await agent_builder.build_agent_profile(
        business_name=req.business_name,
        business_description=req.business_description,
        services=req.services,
        website_url=req.website_url,
        tone=req.tone,
        model=model_for_plan(plan),
    )

    username = _make_username(agent_profile["slug"], req.username)

    payload = {
        "user_id":          user["id"],
        "name":             agent_profile["agent_name"],
        "business_name":    req.business_name,
        "business_description": req.business_description,
        "tone":             req.tone or "friendly and professional",
        "persona":          agent_profile["system_prompt"],
        "knowledge":        agent_profile["knowledge_base"],
        "faq":              agent_profile["faq"],
        "welcome_message":  agent_profile["welcome_message"],
        "tagline":          agent_profile["tagline"],
        "suggested_questions": agent_profile["suggested_questions"],
        "primary_color":    agent_profile["primary_color"],
        "subdomain":        username,
        "plan":             plan,
        "status":           "active",
        "readiness_score":  agent_profile["readiness_score"],
        "readiness_notes":  agent_profile["readiness_notes"],
        "website_url":      req.website_url,
        "leads_pin":        _gen_pin(),
    }

    agent = repo.insert_agent(payload)
    agent["username"] = username

    log.info("Built agent '%s' (@%s score=%s) user=%s plan=%s",
             agent_profile["agent_name"], username,
             agent_profile["readiness_score"], user["id"], plan)

    return {"agent": _owner(agent)}


@router.get("/agents/me")
async def get_my_agents(user=Depends(get_current_user)):
    agents = repo.list_agents_by_user(user["id"])
    for a in agents:
        a["username"] = a.get("username") or a.get("subdomain", "")
    return {"agents": agents}


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str, user=Depends(get_current_user)):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")
    return {"agent": _owner(agent)}


@router.get("/u/{username}")
async def get_agent_by_username(username: str):
    agent = repo.get_agent_by_username(username.lower())
    if not agent or agent.get("status") != "active":
        raise HTTPException(404, "Agent not found.")
    return {"agent": _public(agent)}


@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user=Depends(get_current_user)):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")
    repo.delete_agent(agent_id)
    log.info("Deleted agent %s user=%s", agent_id, user["id"])
    return {"ok": True}


@router.get("/agents/{agent_id}/leads")
async def get_leads_pin(agent_id: str, pin: str | None = None):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if not pin or pin != agent.get("leads_pin"):
        raise HTTPException(401, "Invalid PIN.")
    leads = repo.list_leads(agent_id)
    return {"leads": leads}


@router.get("/agents/{agent_id}/leads/auth")
async def get_leads_auth(agent_id: str, user=Depends(get_current_user)):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found.")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent.")
    leads = repo.list_leads(agent_id)
    return {"leads": leads, "agent": _owner(agent)}


@router.get("/plans")
async def get_plans():
    """Public endpoint — return plan info for pricing page."""
    return {
        "plans": [
            {"id": "trial",       "name": "Trial",       "price": 0,   "max_agents": 1, "days": 3,  "model": "Standard"},
            {"id": "basic",       "name": "Basic",       "price": 49,  "max_agents": 1, "days": 30, "model": "Standard"},
            {"id": "pro",         "name": "Pro",         "price": 129, "max_agents": 2, "days": 30, "model": "Standard"},
            {"id": "max",         "name": "Max",         "price": 299, "max_agents": 3, "days": 30, "model": "Premium (Opus)"},
            {"id": "singularity", "name": "Singularity", "price": 699, "max_agents": 3, "days": 30, "model": "Opus + Auto-Best + Voice + Website"},
        ]
    }