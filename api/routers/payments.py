"""
EasyBuilda — Payment & Admin router
Manual PayPal flow + admin approval + monthly subscription management
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

PAYPAL_LINK = "https://www.paypal.com/send"
PAYPAL_NAME = "ahmedmaher7720@gmail.com"

PLAN_CONFIG = {
    "basic": {"amount": 29.00, "label": "Basic", "agents": 1},
    "pro":   {"amount": 69.00, "label": "Pro",   "agents": 2},
}

# ── Schemas ────────────────────────────────────────────────────────

class PaymentRequest(BaseModel):
    plan: str
    paypal_txn: str
    note: Optional[str] = None
    screenshot_b64: Optional[str] = None
    screenshot_mime: Optional[str] = "image/png"

class AdminDecision(BaseModel):
    payment_id: str
    approve: bool
    note: Optional[str] = None

class NotificationMarkRead(BaseModel):
    notification_ids: list[str]

class SupportMessage(BaseModel):
    message: str

# ── Payment endpoints ──────────────────────────────────────────────

@router.post("/payments/request")
async def submit_payment(
    req: PaymentRequest,
    request: Request,
    user=Depends(get_current_user),
):
    if req.plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan.")

    user_id = user["id"]
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found.")

    existing = repo.get_pending_payment(user_id)
    if existing:
        raise HTTPException(409, "You already have a pending payment request. Please wait for admin approval.")

    cfg = PLAN_CONFIG[req.plan]
    ip  = request.client.host if request.client else None

    payment_data = {
        "user_id":    user_id,
        "plan":       req.plan,
        "amount":     cfg["amount"],
        "currency":   "USD",
        "paypal_txn": req.paypal_txn.strip(),
        "status":     "pending",
        "ip_address": ip,
    }
    if req.screenshot_b64:
        payment_data["screenshot_b64"]  = req.screenshot_b64
        payment_data["screenshot_mime"] = req.screenshot_mime or "image/png"

    payment = repo.create_payment_request(payment_data)

    repo.create_notification({
        "user_id":      user_id,
        "type":         "system",
        "title":        "Payment request received",
        "body":         f"We received your {cfg['label']} plan request (${cfg['amount']:.0f}/mo). We'll activate your plan within 24h.",
        "action_url":   "/dashboard",
        "action_label": "View dashboard",
    })

    repo.notify_admin(
        title=f"New payment: {cfg['label']} — ${cfg['amount']:.0f}",
        body=f"User {user.get('email', user_id)} | TXN: {req.paypal_txn} | Screenshot: {'yes' if req.screenshot_b64 else 'no'}",
        action_url="/admin",
    )

    log.info("Payment %s created for user %s (plan=%s)", payment["id"], user_id, req.plan)
    return {"ok": True, "payment_id": payment["id"], "status": "pending"}


@router.get("/payments/status")
async def get_payment_status(user=Depends(get_current_user)):
    user_id = user["id"]
    payment = repo.get_latest_payment(user_id)
    profile = repo.get_profile(user_id)

    # Auto-expire check
    if profile:
        billing_end = profile.get("billing_end")
        if billing_end and profile.get("plan") not in ("trial", "expired", "admin"):
            try:
                end_dt = datetime.fromisoformat(billing_end.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > end_dt:
                    repo.update_profile(user_id, {
                        "plan": "expired",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    })
                    profile["plan"] = "expired"
            except Exception:
                pass

    return {
        "payment": payment,
        "plan": profile.get("plan") if profile else None,
        "trial_ends_at": profile.get("trial_ends_at") if profile else None,
        "billing_end": profile.get("billing_end") if profile else None,
    }


@router.get("/payments/config")
async def get_payment_config():
    return {
        "paypal_link": PAYPAL_LINK,
        "paypal_name": PAYPAL_NAME,
        "plans": PLAN_CONFIG,
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


# ── Admin endpoints ────────────────────────────────────────────────

@router.get("/admin/payments")
async def admin_get_payments(status: str = "pending", user=Depends(get_admin_user)):
    payments = repo.get_all_payments(status=status if status != "all" else None)
    return {"payments": payments}


@router.post("/admin/payments/decide")
async def admin_decide_payment(req: AdminDecision, user=Depends(get_admin_user)):
    payment = repo.get_payment_by_id(req.payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found.")
    if payment["status"] not in ("pending",):
        raise HTTPException(409, f"Payment already {payment['status']}.")

    now     = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    user_id = payment["user_id"]
    plan    = payment["plan"]
    cfg     = PLAN_CONFIG.get(plan, {})

    if req.approve:
        # Activate plan — 30 days from now
        billing_end = (now + timedelta(days=30)).isoformat()
        repo.update_profile(user_id, {
            "plan":          plan,
            "billing_plan":  plan,
            "billing_start": now_iso,
            "billing_end":   billing_end,
            "trial_ends_at": None,
            "updated_at":    now_iso,
        })
        repo.update_payment(req.payment_id, {
            "status": "approved", "admin_note": req.note,
            "reviewed_by": user["id"], "reviewed_at": now_iso, "updated_at": now_iso,
        })
        repo.create_notification({
            "user_id":      user_id,
            "type":         "payment_approved",
            "title":        f"Your {cfg.get('label', plan)} plan is active!",
            "body":         f"Payment confirmed. Your plan is active for 30 days until {(now + timedelta(days=30)).strftime('%b %d, %Y')}.",
            "action_url":   "/build",
            "action_label": "Build my agent",
        })
        log.info("Payment %s APPROVED — user %s on %s until %s", req.payment_id, user_id, plan, billing_end)
    else:
        repo.update_payment(req.payment_id, {
            "status": "rejected", "admin_note": req.note,
            "reviewed_by": user["id"], "reviewed_at": now_iso, "updated_at": now_iso,
        })
        repo.create_notification({
            "user_id":      user_id,
            "type":         "payment_rejected",
            "title":        "Payment could not be verified",
            "body":         req.note or "We couldn't verify your payment. Please contact support or try again.",
            "action_url":   "/pricing",
            "action_label": "Try again",
        })
        log.info("Payment %s REJECTED by admin %s", req.payment_id, user["id"])

    return {"ok": True, "status": "approved" if req.approve else "rejected"}


@router.get("/admin/payments/{payment_id}/screenshot")
async def admin_get_screenshot(payment_id: str, user=Depends(get_admin_user)):
    """Return base64 screenshot for a payment."""
    payment = repo.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(404, "Not found.")
    return {
        "screenshot_b64":  payment.get("screenshot_b64"),
        "screenshot_mime": payment.get("screenshot_mime", "image/png"),
    }


@router.get("/admin/stats")
async def admin_stats(user=Depends(get_admin_user)):
    stats = repo.get_admin_stats()
    users = repo.get_recent_users(limit=10)
    return {"stats": stats, "recent_users": users}


@router.get("/admin/users")
async def admin_users(limit: int = 50, offset: int = 0, user=Depends(get_admin_user)):
    users = repo.get_all_users(limit=limit, offset=offset)
    return {"users": users}


@router.post("/admin/users/{user_id}/plan")
async def admin_set_plan(user_id: str, plan: str, user=Depends(get_admin_user)):
    if plan not in ("trial", "basic", "pro", "expired", "admin"):
        raise HTTPException(400, "Invalid plan.")
    now = datetime.now(timezone.utc).isoformat()
    update: dict = {"plan": plan, "updated_at": now}
    if plan in ("basic", "pro"):
        update["billing_start"] = now
        update["billing_end"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    repo.update_profile(user_id, update)
    return {"ok": True}


# ── Support ────────────────────────────────────────────────────────

@router.post("/support/message")
async def send_support_message(req: SupportMessage, user=Depends(get_current_user)):
    repo.create_support_message({"user_id": user["id"], "from_admin": False, "message": req.message.strip()})
    return {"ok": True}


@router.get("/support/messages")
async def get_support_messages(user=Depends(get_current_user)):
    msgs = repo.get_support_messages(user["id"])
    return {"messages": msgs}


@router.post("/admin/support/{user_id}/reply")
async def admin_reply_support(user_id: str, req: SupportMessage, user=Depends(get_admin_user)):
    repo.create_support_message({"user_id": user_id, "from_admin": True, "message": req.message.strip()})
    repo.create_notification({
        "user_id": user_id, "type": "system", "title": "Support reply",
        "body": req.message[:120], "action_url": "/dashboard", "action_label": "View reply",
    })
    return {"ok": True}


@router.get("/admin/support")
async def admin_get_all_support(user=Depends(get_admin_user)):
    convos = repo.get_all_support_conversations()
    return {"conversations": convos}