"""
EasyBuilda — Payment & Admin router
Bank Transfer (Mashreq) + PayPal + Pay-per-lead + Subscription management
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from services.auth import get_current_user, get_admin_user
from services import repo

log = logging.getLogger("easybuilda.payments")
router = APIRouter(prefix="/api", tags=["payments"])

# ── Constants ──────────────────────────────────────────────────────

# Bank Transfer — Mashreq Bank Egypt (Primary)
BANK_ACCOUNT_NAME   = "Omar Maher"
BANK_ACCOUNT_NUMBER = "059102271777"
BANK_IBAN           = "EG920046020100000059102271777"
BANK_SWIFT          = "MSHQEGCA"
BANK_NAME           = "Mashreq Bank Egypt"
BANK_CURRENCY       = "USD"

# PayPal (Secondary)
PAYPAL_LINK  = "https://paypal.me/Ahmedmaher1728399"
PAYPAL_EMAIL = "ahmedmaher7720@gmail.com"

# Subscription plans (monthly only — no annual)
PLAN_CONFIG = {
    "basic": {"amount": 29.00, "label": "Basic", "agents": 1},
    "pro":   {"amount": 69.00, "label": "Pro",   "agents": 2},
}

# Pay-per-lead pricing
PPL_SETUP_FEE  = 9.00    # One-time setup
PPL_COLD_LEAD  = 0.50    # Any new conversation
PPL_HOT_LEAD   = 2.00    # Lead with name/email/phone captured

# Grace period after expiry (days)
GRACE_PERIOD_DAYS = 3

# ── Schemas ────────────────────────────────────────────────────────

class PaymentRequest(BaseModel):
    plan: str
    paypal_txn: str           # reference number (bank or PayPal)
    note: Optional[str] = None
    screenshot_b64: Optional[str] = None
    screenshot_mime: Optional[str] = "image/png"
    payment_method: Optional[str] = "bank"  # "bank" or "paypal"

class AdminDecision(BaseModel):
    payment_id: str
    approve: bool
    note: Optional[str] = None

class AdminPlanChange(BaseModel):
    plan: str

class NotificationMarkRead(BaseModel):
    notification_ids: list[str]

class SupportMessage(BaseModel):
    message: str

# ── Helpers ────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _now_iso() -> str:
    return _now().isoformat()

def _check_and_expire(profile: dict, user_id: str) -> dict:
    """Auto-expire plan if billing_end passed. Returns updated profile."""
    plan = profile.get("plan", "trial")
    if plan in ("trial", "expired", "admin"):
        return profile

    billing_end = profile.get("billing_end")
    if not billing_end:
        return profile

    try:
        end_dt = datetime.fromisoformat(billing_end.replace("Z", "+00:00"))
        grace_end = end_dt + timedelta(days=GRACE_PERIOD_DAYS)
        now = _now()

        if now > grace_end:
            # Fully expired — deactivate agents
            repo.update_profile(user_id, {"plan": "expired"})
            _deactivate_agents(user_id)
            profile["plan"] = "expired"
        elif now > end_dt:
            # In grace period — warn but keep active
            log.info("User %s in grace period until %s", user_id, grace_end.isoformat())
    except Exception as e:
        log.warning("Expiry check failed for %s: %s", user_id, e)

    return profile

def _deactivate_agents(user_id: str) -> None:
    """Set all user's agents to inactive (NOT delete)."""
    try:
        agents = repo.list_agents_by_user(user_id)
        for agent in agents:
            if agent.get("status") == "active":
                repo.update_agent(agent["id"], {"status": "inactive"})
        log.info("Deactivated %d agents for user %s", len(agents), user_id)
    except Exception as e:
        log.warning("Failed to deactivate agents for %s: %s", user_id, e)

def _reactivate_agents(user_id: str) -> None:
    """Set all user's agents back to active on renewal."""
    try:
        agents = repo.list_agents_by_user(user_id)
        for agent in agents:
            if agent.get("status") == "inactive":
                repo.update_agent(agent["id"], {"status": "active"})
        log.info("Reactivated %d agents for user %s", len(agents), user_id)
    except Exception as e:
        log.warning("Failed to reactivate agents for %s: %s", user_id, e)

# ── Payment Config (public) ────────────────────────────────────────

@router.get("/payments/config")
async def get_payment_config():
    return {
        "bank": {
            "account_name":   BANK_ACCOUNT_NAME,
            "account_number": BANK_ACCOUNT_NUMBER,
            "iban":           BANK_IBAN,
            "swift":          BANK_SWIFT,
            "bank_name":      BANK_NAME,
            "currency":       BANK_CURRENCY,
        },
        "paypal": {
            "link":  PAYPAL_LINK,
            "email": PAYPAL_EMAIL,
        },
        "plans": PLAN_CONFIG,
        "pay_per_lead": {
            "setup_fee":  PPL_SETUP_FEE,
            "cold_lead":  PPL_COLD_LEAD,
            "hot_lead":   PPL_HOT_LEAD,
        },
    }

# ── Submit Payment ─────────────────────────────────────────────────

@router.post("/payments/request")
async def submit_payment(
    req: PaymentRequest,
    request: Request,
    user=Depends(get_current_user),
):
    if req.plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan. Choose 'basic' or 'pro'.")

    user_id = user["id"]
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found.")

    # Block duplicate pending requests
    existing = repo.get_pending_payment(user_id)
    if existing:
        raise HTTPException(409,
            "You already have a pending payment request. "
            "Please wait for admin approval or contact support.")

    cfg = PLAN_CONFIG[req.plan]
    ip  = request.client.host if request.client else None

    payment_data = {
        "user_id":          user_id,
        "plan":             req.plan,
        "amount":           cfg["amount"],
        "currency":         "USD",
        "paypal_txn":       req.paypal_txn.strip(),
        "payment_method":   req.payment_method or "bank",
        "status":           "pending",
        "ip_address":       ip,
    }
    if req.screenshot_b64:
        payment_data["screenshot_b64"]  = req.screenshot_b64
        payment_data["screenshot_mime"] = req.screenshot_mime or "image/png"
    if req.note:
        payment_data["note"] = req.note.strip()

    payment = repo.create_payment_request(payment_data)

    # Notify user
    repo.create_notification({
        "user_id":      user_id,
        "type":         "system",
        "title":        "Payment request received",
        "body":         f"We received your {cfg['label']} plan request (${cfg['amount']:.0f}/mo). We'll activate your plan within 24h.",
        "action_url":   "/dashboard",
        "action_label": "View dashboard",
    })

    # Notify admin
    method_label = "Bank Transfer" if req.payment_method == "bank" else "PayPal"
    repo.notify_admin(
        title=f"💳 New {method_label} payment: {cfg['label']} — ${cfg['amount']:.0f}",
        body=f"User: {user.get('email', user_id)} | Ref: {req.paypal_txn} | Screenshot: {'✓' if req.screenshot_b64 else '✗'}",
        action_url="/admin",
    )

    log.info("Payment %s created — user %s plan=%s method=%s",
             payment["id"], user_id, req.plan, req.payment_method)

    return {"ok": True, "payment_id": payment["id"], "status": "pending"}

# ── Payment Status ─────────────────────────────────────────────────

@router.get("/payments/status")
async def get_payment_status(user=Depends(get_current_user)):
    user_id = user["id"]
    payment = repo.get_latest_payment(user_id)
    profile = repo.get_profile(user_id)

    # Auto-expire check
    if profile:
        profile = _check_and_expire(profile, user_id)

    # Calculate grace period info
    grace_info = None
    if profile:
        billing_end = profile.get("billing_end")
        if billing_end and profile.get("plan") not in ("trial", "expired", "admin"):
            try:
                end_dt = datetime.fromisoformat(billing_end.replace("Z", "+00:00"))
                grace_end = end_dt + timedelta(days=GRACE_PERIOD_DAYS)
                now = _now()
                if end_dt < now < grace_end:
                    days_left = (grace_end - now).days
                    grace_info = {
                        "in_grace":   True,
                        "days_left":  days_left,
                        "grace_ends": grace_end.isoformat(),
                    }
            except Exception:
                pass

    return {
        "payment":       payment,
        "plan":          profile.get("plan") if profile else None,
        "trial_ends_at": profile.get("trial_ends_at") if profile else None,
        "billing_end":   profile.get("billing_end") if profile else None,
        "grace_period":  grace_info,
    }

# ── Notifications ──────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    notifs = repo.get_notifications(user["id"], limit=20)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread": unread}

@router.post("/notifications/read")
async def mark_notifications_read(req: NotificationMarkRead, user=Depends(get_current_user)):
    repo.mark_notifications_read(user["id"], req.notification_ids)
    return {"ok": True}

# ── Admin — Payments ───────────────────────────────────────────────

@router.get("/admin/payments")
async def admin_get_payments(status: str = "pending", user=Depends(get_admin_user)):
    payments = repo.get_all_payments(status=status if status != "all" else None)
    return {"payments": payments}

@router.get("/admin/payments/{payment_id}/screenshot")
async def admin_get_screenshot(payment_id: str, user=Depends(get_admin_user)):
    payment = repo.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(404, "Not found.")
    return {
        "screenshot_b64":  payment.get("screenshot_b64"),
        "screenshot_mime": payment.get("screenshot_mime", "image/png"),
    }

@router.post("/admin/payments/decide")
async def admin_decide_payment(req: AdminDecision, user=Depends(get_admin_user)):
    payment = repo.get_payment_by_id(req.payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found.")
    if payment["status"] != "pending":
        raise HTTPException(409, f"Payment already {payment['status']}.")

    now      = _now()
    now_iso  = now.isoformat()
    user_id  = payment["user_id"]
    plan     = payment["plan"]
    cfg      = PLAN_CONFIG.get(plan, {})

    if req.approve:
        billing_end = (now + timedelta(days=30)).isoformat()

        # Activate plan
        repo.update_profile(user_id, {
            "plan":                  plan,
            "billing_plan":          plan,
            "billing_start":         now_iso,
            "billing_end":           billing_end,
            "period_agents_created": 0,  # reset on each renewal
        })

        # Reactivate any paused agents
        _reactivate_agents(user_id)

        repo.update_payment(req.payment_id, {
            "status":      "approved",
            "admin_note":  req.note,
            "reviewed_by": user["id"],
            "reviewed_at": now_iso,
        })

        repo.create_notification({
            "user_id":      user_id,
            "type":         "payment_approved",
            "title":        f"🎉 Your {cfg.get('label', plan)} plan is active!",
            "body":         f"Payment confirmed. Your plan is active for 30 days until {(now + timedelta(days=30)).strftime('%b %d, %Y')}.",
            "action_url":   "/build",
            "action_label": "Build my agent",
        })

        log.info("Payment %s APPROVED — user %s → %s until %s",
                 req.payment_id, user_id, plan, billing_end)
    else:
        repo.update_payment(req.payment_id, {
            "status":      "rejected",
            "admin_note":  req.note,
            "reviewed_by": user["id"],
            "reviewed_at": now_iso,
        })

        repo.create_notification({
            "user_id":      user_id,
            "type":         "payment_rejected",
            "title":        "Payment could not be verified",
            "body":         req.note or "We couldn't verify your payment. Please contact support or resubmit with a clear screenshot.",
            "action_url":   "/pricing",
            "action_label": "Try again",
        })

        log.info("Payment %s REJECTED by admin %s", req.payment_id, user["id"])

    return {"ok": True, "status": "approved" if req.approve else "rejected"}

# ── Admin — Stats ──────────────────────────────────────────────────

@router.get("/admin/stats")
async def admin_stats(user=Depends(get_admin_user)):
    stats = repo.get_admin_stats()
    users = repo.get_recent_users(limit=10)
    return {"stats": stats, "recent_users": users}

# ── Admin — Users ──────────────────────────────────────────────────

@router.get("/admin/users")
async def admin_users(limit: int = 50, offset: int = 0, user=Depends(get_admin_user)):
    users = repo.get_all_users(limit=limit, offset=offset)
    return {"users": users}

@router.post("/admin/users/{user_id}/plan")
async def admin_set_plan(user_id: str, req: AdminPlanChange, user=Depends(get_admin_user)):
    """Change user plan from admin panel. Also manages agent status."""
    plan = req.plan
    if plan not in ("trial", "basic", "pro", "expired", "admin"):
        raise HTTPException(400, "Invalid plan.")

    now = _now()
    update: dict = {"plan": plan}

    if plan in ("basic", "pro"):
        update["billing_start"]         = now.isoformat()
        update["billing_end"]           = (now + timedelta(days=30)).isoformat()
        update["period_agents_created"] = 0
        _reactivate_agents(user_id)
    elif plan == "expired":
        _deactivate_agents(user_id)
    elif plan == "trial":
        update["trial_ends_at"] = (now + timedelta(days=3)).isoformat()
        _reactivate_agents(user_id)

    repo.update_profile(user_id, update)

    log.info("Admin %s changed user %s plan → %s", user["id"], user_id, plan)
    return {"ok": True}

# ── Admin — Support ────────────────────────────────────────────────

@router.get("/admin/support")
async def admin_get_all_support(user=Depends(get_admin_user)):
    convos = repo.get_all_support_conversations()
    return {"conversations": convos}

@router.get("/admin/support/{user_id}/messages")
async def admin_get_user_support(user_id: str, user=Depends(get_admin_user)):
    msgs = repo.get_support_messages(user_id)
    profile = repo.get_profile(user_id)
    return {
        "messages": msgs,
        "user": {
            "id":         user_id,
            "email":      profile.get("email") if profile else "",
            "full_name":  profile.get("full_name") if profile else "",
            "plan":       profile.get("plan") if profile else "trial",
            "created_at": profile.get("created_at") if profile else "",
            "billing_end":profile.get("billing_end") if profile else None,
        } if profile else None,
    }

@router.post("/admin/support/{user_id}/reply")
async def admin_reply_support(user_id: str, req: SupportMessage, user=Depends(get_admin_user)):
    repo.create_support_message({
        "user_id":    user_id,
        "from_admin": True,
        "message":    req.message.strip(),
    })
    repo.create_notification({
        "user_id":      user_id,
        "type":         "system",
        "title":        "Support reply",
        "body":         req.message[:120],
        "action_url":   "/dashboard",
        "action_label": "View reply",
    })
    return {"ok": True}

# ── User — Support ─────────────────────────────────────────────────

@router.post("/support/message")
async def send_support_message(req: SupportMessage, user=Depends(get_current_user)):
    repo.create_support_message({
        "user_id":    user["id"],
        "from_admin": False,
        "message":    req.message.strip(),
    })
    # Notify admin
    profile = repo.get_profile(user["id"])
    email   = profile.get("email", user["id"]) if profile else user["id"]
    repo.notify_admin(
        title=f"💬 Support message from {email}",
        body=req.message[:200],
        action_url="/admin",
    )
    return {"ok": True}

@router.get("/support/messages")
async def get_support_messages(user=Depends(get_current_user)):
    msgs = repo.get_support_messages(user["id"])
    return {"messages": msgs}