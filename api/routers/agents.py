"""
EasyBuilda — Complete agents router
Includes all endpoints: private (auth required) + public (no auth)

Pricing model: single, simple. Every agent gets a 7-day free trial from
its created_at timestamp (enforced in routers/chat.py). After that, the
agent stays active as long as the owner's wallet balance is >= $8 (the
price of one hot lead) — see services/repo.py for the actual charge
logic. There are no plan tiers, no agent-count limits, no setup fee,
no subscription.
"""
from __future__ import annotations

import logging
import secrets
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.agents")
router = APIRouter(prefix="/api", tags=["agents"])

TRIAL_DAYS      = 7
MIN_BALANCE_USD = repo.HOT_LEAD_PRICE  # $8


# ── Schemas ────────────────────────────────────────────────────────

class AgentStatusUpdate(BaseModel):
    status: str


# ── Trial helper (mirrors routers/chat.py logic) ─────────────────

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


def _trial_active(agent: dict) -> bool:
    created = _parse_dt(agent.get("created_at"))
    if not created:
        return False
    age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
    return age_days < TRIAL_DAYS


# ══════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS — no auth required
# ══════════════════════════════════════════════════════════════════

@router.get("/agents/public")
async def list_public_agents(limit: int = 60, offset: int = 0):
    """Public agent directory for /explore page."""
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
    """Public stats for social proof."""
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
    """List all agents for the current user, with trial/billing status attached."""
    try:
        agents = repo.list_agents_by_user(user["id"])
        wallet = repo.get_wallet(user["id"]) or {}
        balance = float(wallet.get("balance", 0) or 0)

        # Trial is computed ONCE for the whole account, from the user's
        # OLDEST agent — never per-agent. This must match the exact same
        # rule used in routers/chat.py and routers/interview.py
        # (_check_can_build_new_agent), or the dashboard will show a
        # different trial state than what billing actually enforces.
        account_on_trial = False
        account_trial_days_left = 0
        if agents:
            oldest = min(agents, key=lambda a: a.get("created_at") or "")
            created = _parse_dt(oldest.get("created_at"))
            if created:
                age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
                account_on_trial = age_days < TRIAL_DAYS
                if account_on_trial:
                    account_trial_days_left = max(0, round(TRIAL_DAYS - age_days, 1))

        for a in agents:
            a["on_trial"] = account_on_trial
            a["trial_days_left"] = account_trial_days_left if account_on_trial else 0

        return {"agents": agents, "wallet_balance": balance}
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
    """
    Owner can pause anytime. Owner can only reactivate if either:
      - the agent is still inside its 7-day free trial, or
      - the wallet balance is at least $8 (one hot lead's worth).
    """
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    if agent.get("user_id") != user["id"]:
        raise HTTPException(403, "Not your agent")

    if req.status not in ("active", "inactive"):
        raise HTTPException(400, "Status must be 'active' or 'inactive'")

    if req.status == "active":
        # Trial is account-wide, computed from the user's OLDEST agent —
        # never from this single agent's own created_at.
        all_agents = repo.list_agents_by_user(user["id"])
        oldest = min(all_agents, key=lambda a: a.get("created_at") or "") if all_agents else agent
        account_on_trial = _trial_active(oldest)

        if not account_on_trial:
            wallet  = repo.get_wallet(user["id"]) or {}
            balance = float(wallet.get("balance", 0) or 0)
            if balance < MIN_BALANCE_USD:
                raise HTTPException(402, f"Wallet balance (${balance:.2f}) is below ${MIN_BALANCE_USD:.0f} — top up to reactivate")

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
    return {"ok": True}


@router.get("/agents/{agent_id}/leads")
async def get_agent_leads(agent_id: str, pin: str, user=Depends(get_current_user)):
    """Get leads for an agent — requires PIN verification."""
    agent = repo.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")

    is_owner = agent.get("user_id") == user["id"]
    valid_pin = agent.get("leads_pin") and agent["leads_pin"] == pin

    if not is_owner and not valid_pin:
        raise HTTPException(403, "Incorrect PIN")

    leads = repo.list_leads_by_agent(agent_id)
    return {"leads": leads}


# ── Admin endpoints ────────────────────────────────────────────────

def _verify_admin(admin: dict) -> None:
    profile = repo.get_profile(admin["id"])
    if profile and (profile.get("plan") == "admin" or profile.get("is_admin")):
        return
    if admin.get("email"):
        db_res = get_db().table("profiles").select("plan,is_admin").eq("email", admin["email"]).limit(1).execute()
        if db_res.data:
            p = db_res.data[0]
            if p.get("plan") == "admin" or p.get("is_admin"):
                return
    raise HTTPException(403, "Admin only")


@router.get("/admin/users")
async def admin_list_users(admin=Depends(get_current_user)):
    """Admin: list all users."""
    _verify_admin(admin)
    try:
        res = (
            get_db().table("profiles")
            .select("id,email,full_name,plan,created_at")
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
    _verify_admin(admin)
    try:
        db       = get_db()
        agents   = db.table("agents").select("id,status,created_at").execute().data or []
        users    = db.table("profiles").select("id").execute().data or []
        topups   = db.table("topup_requests").select("id,status,amount").execute().data or []
        leads    = db.table("leads").select("id,intent").execute().data or []

        active_agents = sum(1 for a in agents if a["status"] == "active")
        on_trial_count = sum(1 for a in agents if _trial_active(a))
        total_revenue  = sum(t["amount"] for t in topups if t["status"] == "approved")
        hot_leads      = sum(1 for l in leads if l.get("intent") == "hot")

        return {"stats": {
            "total_users":     len(users),
            "total_agents":    len(agents),
            "active_agents":   active_agents,
            "agents_on_trial": on_trial_count,
            "total_hot_leads": hot_leads,
            "pending_topups":  sum(1 for t in topups if t["status"] == "pending"),
            "total_revenue":   total_revenue,
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
            return {"profile": {"id": user["id"], "email": user.get("email", "")}}
        return {"profile": profile}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── All leads for current user ───────────────────────────────────
@router.get("/leads/all")
async def get_all_leads(user=Depends(get_current_user)):
    """Get all leads across all agents for this user."""
    try:
        db = get_db()
        agents_res = db.table("agents").select("id").eq("user_id", user["id"]).execute()
        agent_ids  = [a["id"] for a in (agents_res.data or [])]
        if not agent_ids:
            return {"leads": []}
        all_leads = []
        for aid in agent_ids:
            lr = db.table("leads").select("*").eq("agent_id", aid).order("created_at", desc=True).limit(200).execute()
            all_leads.extend(lr.data or [])
        all_leads.sort(key=lambda x: x.get("created_at", ""), reverse=True)
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
    except Exception:
        return {"notifications": []}


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user=Depends(get_current_user)):
    """Mark a notification as read."""
    try:
        get_db().table("notifications").update({"read": True}).eq("id", notif_id).eq("user_id", user["id"]).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(500, str(e))