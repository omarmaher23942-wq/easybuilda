"""
EasyBuilda — Complete agents router
Includes all endpoints: private (auth required) + public (no auth)
"""
from __future__ import annotations

import logging
import secrets
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.agents")
router = APIRouter(prefix="/api", tags=["agents"])

PLAN_LIMITS = {
    "trial":       1,
    "basic":       1,
    "pro":         2,
    "max":         3,
    "singularity": 3,
    "admin":       99,
}


# ── Schemas ────────────────────────────────────────────────────────

class AgentStatusUpdate(BaseModel):
    status: str

class PlanUpdate(BaseModel):
    plan: str


# ══════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS — no auth required
# ══════════════════════════════════════════════════════════════════

@router.get("/agents/public")
async def list_public_agents(limit: int = 60, offset: int = 0):
    """Public agent directory for /explore page (#53)."""
    try:
        res = (
            get_db().table("agents")
            .select("id,name,business_name,tagline,primary_color,subdomain,plan,readiness_score,created_at")
            .eq("status", "active")
            .order("readiness_score", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return {"agents": res.data or []}
    except Exception as e:
        log.warning("list_public_agents: %s", e)
        return {"agents": []}


@router.get("/agents/stats/public")
async def public_platform_stats():
    """Public stats for social proof (#65)."""
    try:
        db         = get_db()
        agents_res = db.table("agents").select("id", count="exact").eq("status", "active").execute()
        users_res  = db.table("profiles").select("id", count="exact").execute()
        return {
            "total_agents":     agents_res.count or 0,
            "total_businesses": users_res.count or 0,
        }
    except Exception:
        return {"total_agents": 0, "total_businesses": 0}


@router.get("/u/{username}")
async def get_agent_by_username(username: str):
    """Public — chat page agent data."""
    try:
        res = (
            get_db().table("agents")
            .select("id,name,business_name,tagline,welcome_message,suggested_questions,primary_color,status,plan")
            .or_(f"subdomain.eq.{username},username.eq.{username}")
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(404, f"Agent @{username} not found")
        agent = res.data[0]
        if agent.get("status") == "inactive":
            raise HTTPException(503, "This agent is currently paused")
        return {"agent": agent}
    except HTTPException:
        raise
    except Exception as e:
        log.error("get_agent_by_username: %s", e)
        raise HTTPException(500, "Failed to load agent")


@router.get("/agents/{agent_id}/public")
async def get_agent_public(agent_id: str):
    """Public — minimal agent info for leads dashboard header."""
    try:
        res = (
            get_db().table("agents")
            .select("id,name,business_name,primary_color,readiness_score,readiness_notes,plan")
            .eq("id", agent_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(404, "Agent not found")
        return {"agent": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ══════════════════════════════════════════════════════════════════
# PRIVATE ENDPOINTS — auth required
# ══════════════════════════════════════════════════════════════════

@router.get("/agents/me")
async def list_my_agents(user=Depends(get_current_user)):
    """List all agents for the current user."""
    try:
        agents = repo.list_agents_by_user(user["id"])
        return {"agents": agents}
    except Exception as e:
        log.error("list_my_agents: %s", e)
        raise HTTPException(500, "Failed to load agents")


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str, user=Depends(get_current_user)):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent")
    return {"agent": agent}


@router.patch("/agents/{agent_id}/status")
async def update_agent_status(
    agent_id: str,
    req: AgentStatusUpdate,
    user=Depends(get_current_user),
):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent")

    if req.status not in ("active", "inactive"):
        raise HTTPException(400, "Status must be 'active' or 'inactive'")

    # Check wallet before reactivating
    if req.status == "active":
        wallet = repo.get_wallet(user["id"])
        if wallet and wallet.get("balance", 0) <= 0:
            profile = repo.get_profile(user["id"])
            if profile and profile.get("plan") not in ("trial", "admin"):
                raise HTTPException(402, "Wallet empty — add funds to reactivate")

    repo.update_agent(agent_id, {"status": req.status})
    return {"ok": True, "status": req.status}


@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user=Depends(get_current_user)):
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent")

    repo.delete_agent(agent_id)
    # NOTE: period_agents_created is NOT decremented on delete.
    # Deletion does NOT grant permission to create a new agent on trial.
    return {"ok": True}


@router.get("/agents/{agent_id}/leads")
async def get_agent_leads(agent_id: str, pin: str, user=Depends(get_current_user)):
    """Get leads for an agent — requires PIN verification."""
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")

    # Allow owner OR correct PIN
    is_owner = agent.get("user_id") == user["id"]
    valid_pin = agent.get("leads_pin") and agent["leads_pin"] == pin

    if not is_owner and not valid_pin:
        raise HTTPException(403, "Incorrect PIN")

    leads = repo.list_leads_by_agent(agent_id)
    return {"leads": leads}


# ── Admin endpoints ────────────────────────────────────────────────

@router.post("/admin/users/{user_id}/plan")
async def admin_set_plan(
    user_id: str,
    req: PlanUpdate,
    admin=Depends(get_current_user),
):
    """Admin: change user plan."""
    # Verify admin
    profile = repo.get_profile(admin["id"])
    if not profile or profile.get("plan") != "admin":
        db_res = get_db().table("profiles").select("is_admin").eq("id", admin["id"]).limit(1).execute()
        if not (db_res.data and db_res.data[0].get("is_admin")):
            raise HTTPException(403, "Admin only")

    valid_plans = ["trial", "basic", "pro", "max", "expired", "admin"]
    if req.plan not in valid_plans:
        raise HTTPException(400, f"Plan must be one of: {valid_plans}")

    repo.update_profile(user_id, {"plan": req.plan})

    # If expired → pause agents; if active plan → reactivate
    if req.plan == "expired":
        agents = repo.list_agents_by_user(user_id)
        for ag in agents:
            if ag.get("status") == "active":
                repo.update_agent(ag["id"], {"status": "inactive"})
    elif req.plan in ("basic", "pro", "max", "trial"):
        agents = repo.list_agents_by_user(user_id)
        for ag in agents:
            if ag.get("status") == "inactive":
                repo.update_agent(ag["id"], {"status": "active"})

    return {"ok": True, "plan": req.plan}


@router.get("/admin/users")
async def admin_list_users(admin=Depends(get_current_user)):
    """Admin: list all users."""
    profile = repo.get_profile(admin["id"])
    if not profile or profile.get("plan") != "admin":
        db_res = get_db().table("profiles").select("is_admin").eq("id", admin["id"]).limit(1).execute()
        if not (db_res.data and db_res.data[0].get("is_admin")):
            raise HTTPException(403, "Admin only")
    try:
        res = (
            get_db().table("profiles")
            .select("id,email,full_name,plan,created_at,trial_ends_at,billing_end,period_agents_created")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
        return {"users": res.data or []}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_user)):
    """Admin: platform statistics."""
    db = get_db()
    # Check by user id OR email (handles magic link re-auth)
    profile = repo.get_profile(admin["id"])
    is_admin = (
        (profile and (profile.get("plan") == "admin" or profile.get("is_admin")))
        or admin.get("email") == "omarmaher23942@gmail.com"
    )
    if not is_admin:
        # Fallback: check by email in profiles
        res = db.table("profiles").select("plan,is_admin").eq("email", admin.get("email","")).limit(1).execute()
        if res.data:
            p = res.data[0]
            is_admin = p.get("plan") == "admin" or p.get("is_admin")
    if not is_admin:
        raise HTTPException(403, "Admin only")
    try:
        db      = get_db()
        profiles= db.table("profiles").select("id,plan").execute().data or []
        agents  = db.table("agents").select("id,status").execute().data or []
        topups  = db.table("topup_requests").select("id,status,amount").execute().data or []

        plan_counts = {}
        for p in profiles:
            plan_counts[p["plan"]] = plan_counts.get(p["plan"], 0) + 1

        total_revenue = sum(t["amount"] for t in topups if t["status"] == "approved")

        return {"stats": {
            "total_users":   len(profiles),
            "trial_users":   plan_counts.get("trial", 0),
            "basic_users":   plan_counts.get("basic", 0),
            "pro_users":     plan_counts.get("pro", 0),
            "paid_users":    plan_counts.get("basic", 0) + plan_counts.get("pro", 0),
            "expired_users": plan_counts.get("expired", 0),
            "active_agents": sum(1 for a in agents if a["status"] == "active"),
            "pending_topups":sum(1 for t in topups if t["status"] == "pending"),
            "total_revenue": total_revenue,
        }}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Profile endpoint ─────────────────────────────────────────────
@router.get("/profile/me")
async def get_my_profile(user=Depends(get_current_user)):
    """Get current user profile."""
    try:
        profile = repo.get_profile(user["id"])
        if not profile:
            return {"profile": {"id": user["id"], "email": user.get("email",""), "plan": "trial"}}
        return {"profile": profile}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── All leads for current user ───────────────────────────────────
@router.get("/leads/all")
async def get_all_leads(user=Depends(get_current_user)):
    """Get all leads across all agents for this user."""
    try:
        db = get_db()
        # Get all agent ids for this user
        agents_res = db.table("agents").select("id").eq("user_id", user["id"]).execute()
        agent_ids  = [a["id"] for a in (agents_res.data or [])]
        if not agent_ids:
            return {"leads": []}
        # Get leads for all agents
        all_leads = []
        for aid in agent_ids:
            lr = db.table("leads").select("*").eq("agent_id", aid).order("created_at", desc=True).limit(200).execute()
            all_leads.extend(lr.data or [])
        # Sort by date
        all_leads.sort(key=lambda x: x.get("created_at",""), reverse=True)
        return {"leads": all_leads[:500]}
    except Exception as e:
        log.error("get_all_leads: %s", e)
        return {"leads": []}


# ── Notifications ────────────────────────────────────────────────
@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    """Get unread notifications for current user."""
    try:
        res = (
            get_db().table("notifications")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return {"notifications": res.data or []}
    except Exception as e:
        return {"notifications": []}


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user=Depends(get_current_user)):
    """Mark a notification as read."""
    try:
        get_db().table("notifications").update({"read": True}).eq("id", notif_id).eq("user_id", user["id"]).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(500, str(e))
