"""
EasyBuilda — Billing Router
Handles: Pro activation, lead charging, subscription renewal, trial management
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_current_user
from services import repo
from db import get_db

log = logging.getLogger("easybuilda.billing")
router = APIRouter(prefix="/api", tags=["billing"])

LEAD_PRICES = {"cold": 0.10, "warm": 0.30, "hot": 1.00}
PRO_PRICE   = 9.00


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _deduct_wallet(user_id: str, amount: float, description: str, tx_type: str = "lead_charge") -> bool:
    """Deduct from wallet. Returns True if successful."""
    db = get_db()
    w  = db.table("wallets").select("balance").eq("user_id", user_id).limit(1).execute()
    if not w.data: return False
    bal = float(w.data[0]["balance"])
    if bal < amount: return False
    new_bal = round(bal - amount, 2)
    db.table("wallets").update({"balance": new_bal}).eq("user_id", user_id).execute()
    db.table("wallet_transactions").insert({
        "user_id":      user_id,
        "type":         tx_type,
        "amount":       -amount,
        "balance_after": new_bal,
        "description":  description,
        "created_at":   _now(),
    }).execute()
    return True


def _get_balance(user_id: str) -> float:
    db  = get_db()
    res = db.table("wallets").select("balance").eq("user_id", user_id).limit(1).execute()
    return float(res.data[0]["balance"]) if res.data else 0.0


def _notify(user_id: str, type_: str, title: str, message: str, action_url: str = None, action_label: str = None):
    try:
        payload = {
            "user_id":  user_id,
            "type":     type_,
            "title":    title,
            "message":  message,
            "read":     False,
            "created_at": _now(),
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


# ── Charge lead ────────────────────────────────────────────────────

def charge_lead(agent_id: str, lead_id: str, lead_type: str, lead_name: str = "Someone") -> dict:
    """Called when a new lead comes in. Deducts from wallet if Pro."""
    db      = get_db()
    agent   = db.table("agents").select("user_id,plan,status").eq("id", agent_id).limit(1).execute()
    if not agent.data: return {"charged": False}

    user_id = agent.data[0]["user_id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")

    # Trial → log but don't charge
    if plan == "trial":
        db.table("leads").update({"price_charged": 0.00}).eq("id", lead_id).execute()
        return {"charged": False, "reason": "trial"}

    # Expired → don't charge, agent already paused
    if plan in ("expired", "blocked_trial"):
        return {"charged": False, "reason": plan}

    # Pro → charge
    if plan == "pro":
        price = LEAD_PRICES.get(lead_type, 0.10)
        ok    = _deduct_wallet(user_id, price, f"{lead_type.capitalize()} lead — {lead_name}")
        if ok:
            db.table("leads").update({"price_charged": price, "charged_at": _now()}).eq("id", lead_id).execute()
            if lead_type == "hot":
                _notify(user_id, "hot_lead", "New hot lead!",
                        f"{lead_name} filled in your lead form — ${price:.2f} deducted.",
                        "/dashboard", "View lead")
            # Check balance after deduction
            bal = _get_balance(user_id)
            if bal <= 0:
                # Pause all agents
                agents = db.table("agents").select("id").eq("user_id", user_id).execute()
                for a in (agents.data or []):
                    pause_agent(a["id"], "balance_zero")
                _notify(user_id, "low_balance", "Agent paused — wallet empty",
                        "Your wallet balance reached $0. Add funds to resume your agent.",
                        "/wallet/topup", "Add funds")
            elif bal < 5:
                _notify(user_id, "low_balance", f"Low balance — ${bal:.2f} remaining",
                        "Your agent may pause soon. Add funds to keep it live.",
                        "/wallet/topup", "Add funds")
            return {"charged": True, "price": price}
        else:
            # Not enough balance
            bal = _get_balance(user_id)
            if bal <= 0:
                agents = db.table("agents").select("id").eq("user_id", user_id).execute()
                for a in (agents.data or []):
                    pause_agent(a["id"], "balance_zero")
                _notify(user_id, "low_balance", "Agent paused — wallet empty",
                        "Your wallet balance reached $0. Add funds to resume.",
                        "/wallet/topup", "Add funds")
            return {"charged": False, "reason": "insufficient_balance"}

    return {"charged": False}


# ── Activate Pro ──────────────────────────────────────────────────

@router.post("/billing/activate-pro")
async def activate_pro(user=Depends(get_current_user)):
    """Deduct $9 and activate Pro plan."""
    user_id = user["id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")

    if plan == "pro":
        raise HTTPException(400, "Already on Pro")

    bal = _get_balance(user_id)
    if bal < PRO_PRICE:
        raise HTTPException(402, f"Insufficient balance. Need $9.00, have ${bal:.2f}")

    db  = get_db()
    now = _now()
    billing_next = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    # Deduct
    ok = _deduct_wallet(user_id, PRO_PRICE, "Pro subscription — monthly", "subscription_charge")
    if not ok:
        raise HTTPException(402, "Deduction failed")

    # Update profile
    repo.update_profile(user_id, {
        "plan":             "pro",
        "pro_activated_at": now,
        "billing_next_at":  billing_next,
    })

    # Resume all paused agents
    agents = db.table("agents").select("id,status").eq("user_id", user_id).execute()
    for a in (agents.data or []):
        if a["status"] == "inactive":
            resume_agent(a["id"])

    _notify(user_id, "pro_activated", "Pro activated!",
            "Your agent is live. Leads will be automatically deducted from your wallet.",
            "/dashboard", "Go to dashboard")

    log.info("Pro activated for user %s", user_id)
    return {"ok": True, "billing_next": billing_next}


# ── Subscription status ───────────────────────────────────────────

@router.get("/billing/status")
async def billing_status(user=Depends(get_current_user)):
    """Get billing status for current user."""
    user_id = user["id"]
    profile = repo.get_profile(user_id) or {}
    plan    = profile.get("plan", "trial")
    balance = _get_balance(user_id)

    trial_ends  = profile.get("trial_ends_at")
    days_left   = None
    if trial_ends and plan == "trial":
        ends_dt   = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
        days_left = max(0, (ends_dt - datetime.now(timezone.utc)).days)

    return {
        "plan":          plan,
        "balance":       balance,
        "days_left":     days_left,
        "trial_ends_at": trial_ends,
        "billing_next":  profile.get("billing_next_at"),
        "is_expired":    plan == "expired",
        "is_pro":        plan == "pro",
        "is_trial":      plan == "trial",
        "can_activate_pro": balance >= PRO_PRICE and plan != "pro",
    }


# ── Cron: expire trials ───────────────────────────────────────────

@router.post("/billing/cron/expire-trials")
async def expire_trials():
    """Run daily. Expires trials past 7 days."""
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
                    "Your 7-day trial has ended. Add funds and activate Pro to resume.",
                    "/pricing", "Upgrade to Pro")
            expired_count += 1
    log.info("expire_trials: %d expired", expired_count)
    return {"expired": expired_count}


# ── Cron: renew subscriptions ─────────────────────────────────────

@router.post("/billing/cron/renew-subscriptions")
async def renew_subscriptions():
    """Run daily. Renews Pro subscriptions due today."""
    db  = get_db()
    now = datetime.now(timezone.utc)
    res = db.table("profiles").select("id,billing_next_at").eq("plan", "pro").execute()
    renewed = 0
    failed  = 0
    for p in (res.data or []):
        due = p.get("billing_next_at")
        if not due: continue
        due_dt = datetime.fromisoformat(due.replace("Z", "+00:00"))
        if now < due_dt: continue
        ok = _deduct_wallet(p["id"], PRO_PRICE, "Pro subscription — monthly renewal", "subscription_charge")
        if ok:
            next_billing = (now + timedelta(days=30)).isoformat()
            repo.update_profile(p["id"], {"billing_next_at": next_billing})
            _notify(p["id"], "subscription_paid", "Pro subscription renewed",
                    f"$9.00 deducted. Next renewal: {next_billing[:10]}.")
            renewed += 1
        else:
            # Pause agents
            agents = db.table("agents").select("id").eq("user_id", p["id"]).execute()
            for a in (agents.data or []):
                pause_agent(a["id"], "subscription_failed")
            repo.update_profile(p["id"], {"plan": "expired"})
            _notify(p["id"], "sub_failed", "Subscription renewal failed",
                    "Add funds to reactivate Pro.", "/wallet/topup", "Add funds")
            failed += 1
    log.info("renew_subscriptions: %d renewed, %d failed", renewed, failed)
    return {"renewed": renewed, "failed": failed}
