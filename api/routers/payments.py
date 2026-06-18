"""
EasyBuilda — Payment & Admin router
Handles manual PayPal payment flow + admin approval
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from config import settings
from services.auth import get_current_user, get_admin_user
from services import repo

log = logging.getLogger("easybuilda.payments")
router = APIRouter(prefix="/api", tags=["payments"])

# ── Plan config ────────────────────────────────────────────────────

PLAN_CONFIG = {
    "basic": {"amount": 29.00, "label": "Basic", "agents": 1},
    "pro":   {"amount": 69.00, "label": "Pro",   "agents": 2},
}

PAYPAL_EMAIL = "omarmaher23942@gmail.com"
PAYPAL_LINK  = "https://paypal.me/omarmaher"  # Update with real link

# ── Schemas ────────────────────────────────────────────────────────

class PaymentRequest(BaseModel):
    plan: str
    paypal_txn: str
    note: Optional[str] = None

class AdminDecision(BaseModel):
    payment_id: str
    approve: bool
    note: Optional[str] = None

class NotificationMarkRead(BaseModel):
    notification_ids: list[str]


# ── Payment endpoints ─────────────────────────────────────────────

@router.post("/payments/request")
async def submit_payment(
    req: PaymentRequest,
    request: Request,
    user=Depends(get_current_user),
):
    """User submits a payment request after sending to PayPal."""
    if req.plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan.")

    user_id = user["id"]
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found.")

    # Check for pending request
    existing = repo.get_pending_payment(user_id)
    if existing:
        raise HTTPException(409, "You already have a pending payment request. Please wait for approval.")

    # Check if already on this plan
    if profile.get("plan") == req.plan:
        raise HTTPException(400, f"You are already on the {req.plan} plan.")

    cfg = PLAN_CONFIG[req.plan]
    ip  = request.client.host if request.client else None

    payment = repo.create_payment_request({
        "user_id":    user_id,
        "plan":       req.plan,
        "amount":     cfg["amount"],
        "currency":   "USD",
        "paypal_txn": req.paypal_txn.strip(),
        "status":     "pending",
        "ip_address": ip,
    })

    # Notify user
    repo.create_notification({
        "user_id":      user_id,
        "type":         "system",
        "title":        "Payment request received",
        "body":         f"We received your {cfg['label']} plan request (${cfg['amount']:.0f}/mo). Our team will verify and activate your plan within a few hours.",
        "action_url":   "/dashboard",
        "action_label": "View dashboard",
    })

    # Notify admin (create notification for admin user if exists)
    repo.notify_admin(
        title=f"New payment: {cfg['label']} — ${cfg['amount']:.0f}",
        body=f"User {user.get('email', user_id)} submitted PayPal TXN: {req.paypal_txn}",
        action_url="/admin",
    )

    log.info("Payment request %s created for user %s (plan=%s)", payment["id"], user_id, req.plan)
    return {"ok": True, "payment_id": payment["id"], "status": "pending"}


@router.get("/payments/status")
async def get_payment_status(user=Depends(get_current_user)):
    """Get user's current payment request status."""
    user_id = user["id"]
    payment = repo.get_latest_payment(user_id)
    profile = repo.get_profile(user_id)

    return {
        "payment": payment,
        "plan": profile.get("plan") if profile else None,
        "trial_ends_at": profile.get("trial_ends_at") if profile else None,
    }


@router.get("/payments/config")
async def get_payment_config():
    """Public payment config — PayPal details."""
    return {
        "paypal_email": PAYPAL_EMAIL,
        "paypal_link":  PAYPAL_LINK,
        "plans": PLAN_CONFIG,
    }


# ── Notifications ──────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    """Get user notifications."""
    user_id = user["id"]
    notifs  = repo.get_notifications(user_id, limit=20)
    unread  = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread": unread}


@router.post("/notifications/read")
async def mark_notifications_read(
    req: NotificationMarkRead,
    user=Depends(get_current_user),
):
    """Mark notifications as read."""
    repo.mark_notifications_read(user["id"], req.notification_ids)
    return {"ok": True}


# ── Admin endpoints ────────────────────────────────────────────────

@router.get("/admin/payments")
async def admin_get_payments(
    status: str = "pending",
    user=Depends(get_admin_user),
):
    """Admin: list payment requests."""
    payments = repo.get_all_payments(status=status if status != "all" else None)
    return {"payments": payments}


@router.post("/admin/payments/decide")
async def admin_decide_payment(
    req: AdminDecision,
    user=Depends(get_admin_user),
):
    """Admin: approve or reject a payment request."""
    payment = repo.get_payment_by_id(req.payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found.")
    if payment["status"] != "pending":
        raise HTTPException(409, f"Payment already {payment['status']}.")

    now     = datetime.now(timezone.utc).isoformat()
    user_id = payment["user_id"]
    plan    = payment["plan"]
    cfg     = PLAN_CONFIG.get(plan, {})

    if req.approve:
        # Activate plan
        repo.update_profile(user_id, {
            "plan":          plan,
            "billing_plan":  plan,
            "billing_start": now,
            "billing_end":   None,
            "trial_ends_at": None,
            "updated_at":    now,
        })

        # Update payment record
        repo.update_payment(req.payment_id, {
            "status":      "approved",
            "admin_note":  req.note,
            "reviewed_by": user["id"],
            "reviewed_at": now,
            "updated_at":  now,
        })

        # Notify user
        repo.create_notification({
            "user_id":      user_id,
            "type":         "payment_approved",
            "title":        f"Your {cfg.get('label', plan)} plan is active!",
            "body":         f"Payment confirmed. You now have access to all {cfg.get('label', plan)} features. Build your AI agent now!",
            "action_url":   "/build",
            "action_label": "Build my agent",
        })

        log.info("Payment %s APPROVED by admin %s", req.payment_id, user["id"])

    else:
        # Reject
        repo.update_payment(req.payment_id, {
            "status":      "rejected",
            "admin_note":  req.note,
            "reviewed_by": user["id"],
            "reviewed_at": now,
            "updated_at":  now,
        })

        # Notify user
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


@router.get("/admin/stats")
async def admin_stats(user=Depends(get_admin_user)):
    """Admin: platform statistics."""
    stats = repo.get_admin_stats()
    users = repo.get_recent_users(limit=10)
    return {"stats": stats, "recent_users": users}


@router.get("/admin/users")
async def admin_users(
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_admin_user),
):
    """Admin: list users."""
    users = repo.get_all_users(limit=limit, offset=offset)
    return {"users": users}


@router.post("/admin/users/{user_id}/plan")
async def admin_set_plan(
    user_id: str,
    plan: str,
    user=Depends(get_admin_user),
):
    """Admin: manually set user plan."""
    if plan not in ("trial", "basic", "pro", "expired", "admin"):
        raise HTTPException(400, "Invalid plan.")
    repo.update_profile(user_id, {"plan": plan, "updated_at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True}


# ── Support chat ───────────────────────────────────────────────────

class SupportMessage(BaseModel):
    message: str

@router.post("/support/message")
async def send_support_message(
    req: SupportMessage,
    user=Depends(get_current_user),
):
    """User sends support message."""
    repo.create_support_message({
        "user_id":    user["id"],
        "from_admin": False,
        "message":    req.message.strip(),
    })
    return {"ok": True}


@router.get("/support/messages")
async def get_support_messages(user=Depends(get_current_user)):
    """Get support conversation."""
    msgs = repo.get_support_messages(user["id"])
    return {"messages": msgs}


@router.post("/admin/support/{user_id}/reply")
async def admin_reply_support(
    user_id: str,
    req: SupportMessage,
    user=Depends(get_admin_user),
):
    """Admin replies to support message."""
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


@router.get("/admin/support")
async def admin_get_all_support(user=Depends(get_admin_user)):
    """Admin: all support conversations."""
    convos = repo.get_all_support_conversations()
    return {"conversations": convos}