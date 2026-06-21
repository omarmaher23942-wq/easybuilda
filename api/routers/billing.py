"""
EasyBuilda — Billing Router
Handles: Pro activation (one-time setup fee), trial management, status.
NO recurring subscription — Pro is pay-per-lead only after a one-time setup fee.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from services.auth import get_current_user
from services import repo, billing as billing_svc
from db import get_db

log = logging.getLogger("easybuilda.billing_router")
router = APIRouter(prefix="/api", tags=["billing"])

SETUP_FEE  = billing_svc.SETUP_FEE
TRIAL_DAYS = billing_svc.TRIAL_DAYS


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _notify(user_id: str, type_: str, title: str, message: str, action_url: str = None, action_label: str = None):
    try:
        payload = {
            "user_id": user_id, "type": type_, "title": title, "message": message,
            "read": False, "created_at": _now(),
        }
        if action_url:   payload["action_url"]   = action_url
        if action_label: payload["action_label"] = action_label
        get_db().table("notifications").insert(payload).execute()
    except Exception as e:
        log.warning("notify failed: %s", e)


def pause_agent(agent_id: str, reason: str):
    get_db().table("agents").update({"status": "inactive", "pause_reason": reason}).eq("id", agent_id).execute()


def resume_agent(agent_id: str):
    get_db().table("agents").update({"status": "active", "pause_reason": None}).eq("id", agent_id).execute()


# ── Activate Pro (one-time setup fee, no subscription) ─────────────

@router.post("/billing/activate-pro")
async def activate_pro(user=Depends(get_current_user)):
    """Deduct one-time $29 setup fee and activate Pro plan permanently."""
    user_id = user["id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")

    if plan == "pro":
        raise HTTPException(400, "Already on Pro")

    bal = billing_svc.get_balance(user_id)
    if bal < SETUP_FEE:
        raise HTTPException(402, f"Insufficient balance. Need ${SETUP_FEE:.2f}, have ${bal:.2f}")

    result = await billing_svc.charge_setup_fee(user_id)
    if not result or result.get("skipped"):
        if result and result.get("skipped"):
            pass  # already charged before, just activate
        else:
            raise HTTPException(402, "Setup fee deduction failed")

    repo.update_profile(user_id, {"plan": "pro", "pro_activated_at": _now()})

    db = get_db()
    agents = db.table("agents").select("id,status").eq("user_id", user_id).execute()
    for a in (agents.data or []):
        if a["status"] == "inactive":
            resume_agent(a["id"])

    _notify(user_id, "pro_activated", "Pro activated!",
            "Setup complete. Your agent is live — you'll only be charged per lead from now on.",
            "/dashboard", "Go to dashboard")

    log.info("Pro activated for user %s (setup fee $%.2f)", user_id, SETUP_FEE)
    return {"ok": True, "plan": "pro"}


# ── Billing status ─────────────────────────────────────────────────

@router.get("/billing/status")
async def billing_status(user=Depends(get_current_user)):
    """Get billing status for current user."""
    user_id = user["id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")
    balance = billing_svc.get_balance(user_id)

    trial_ends = profile.get("trial_ends_at")
    days_left  = None
    if trial_ends and plan == "trial":
        ends_dt   = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
        days_left = max(0, (ends_dt - datetime.now(timezone.utc)).days)

    return {
        "plan":             plan,
        "balance":          balance,
        "days_left":        days_left,
        "trial_ends_at":    trial_ends,
        "is_expired":       plan == "expired",
        "is_pro":           plan == "pro",
        "is_trial":         plan == "trial",
        "setup_fee":        SETUP_FEE,
        "can_activate_pro": balance >= SETUP_FEE and plan != "pro",
        "lead_prices": {
            "cold": billing_svc.COLD_LEAD_COST,
            "warm": billing_svc.WARM_LEAD_COST,
            "hot":  billing_svc.HOT_LEAD_COST,
        },
    }


# ── Cron: expire trials (3 days) ───────────────────────────────────

@router.post("/billing/cron/expire-trials")
async def expire_trials():
    """Run daily. Expires trials past 3 days."""
    db  = get_db()
    now = datetime.now(timezone.utc)
    res = db.table("profiles").select("id,email,trial_ends_at").eq("plan", "trial").execute()
    expired_count = 0
    for p in (res.data or []):
        ends = p.get("trial_ends_at")
        if not ends: continue
        ends_dt = datetime.fromisoformat(ends.replace("Z", "+00:00"))
        if now > ends_dt:
            repo.update_profile(p["id"], {"plan": "expired"})
            agents = db.table("agents").select("id").eq("user_id", p["id"]).execute()
            for a in (agents.data or []):
                pause_agent(a["id"], "trial_expired")
            _notify(p["id"], "trial_expired", "Trial ended",
                    f"Your {TRIAL_DAYS}-day trial has ended. Activate Pro (${SETUP_FEE:.0f} one-time) to resume.",
                    "/pricing", "Activate Pro")
            expired_count += 1
    log.info("expire_trials: %d expired", expired_count)
    return {"expired": expired_count}
