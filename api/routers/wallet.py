"""
EasyBuilda — Wallet Router

GET  /api/wallet                          → balance + pending top-up
GET  /api/wallet/transactions              → transaction history
GET  /api/wallet/config                    → public payment details (bank/PayPal)
POST /api/wallet/topup                     → submit a top-up request

Admin:
GET  /api/admin/wallet/topups              → list top-up requests
GET  /api/admin/wallet/topups/{id}/screenshot
POST /api/admin/wallet/topups/{id}/decide  → approve or reject
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from services.auth import get_current_user
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.wallet")
router = APIRouter(prefix="/api", tags=["wallet"])

MIN_TOPUP = 15.0  # USD — minimum top-up amount

# ── Real payment details (shown on the top-up page) ────────────────
BANK = {
    "account_name":   "Omar Maher",
    "account_number": "059102271777",
    "iban":           "EG920046020100000059102271777",
    "swift":          "MSHQEGCA",
    "bank_name":      "Mashreq Bank Egypt",
    "currency":       "USD",
}
PAYPAL = {
    "link":  "https://paypal.me/Ahmedmaher1728399",
    "email": "ahmedmaher7720@gmail.com",
}
TOPUP_PRESETS = [15, 40, 80, 160]

# ── Schemas ────────────────────────────────────────────────────────

class TopupRequest(BaseModel):
    amount:          float
    payment_method:  str = "bank"          # "bank" | "paypal"
    paypal_txn:      Optional[str] = None  # reference / transaction number
    note:            Optional[str] = None
    screenshot_b64:  Optional[str] = None
    screenshot_mime: Optional[str] = "image/png"


class AdminTopupDecision(BaseModel):
    approve: bool
    note:    Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────

def _verify_admin(admin: dict) -> None:
    profile = repo.get_profile(admin["id"])
    if profile and (profile.get("plan") == "admin" or profile.get("is_admin")):
        return
    if admin.get("email"):
        res = get_db().table("profiles").select("plan,is_admin").eq("email", admin["email"]).limit(1).execute()
        if res.data:
            p = res.data[0]
            if p.get("plan") == "admin" or p.get("is_admin"):
                return
    raise HTTPException(403, "Admin only")


# ── User endpoints ─────────────────────────────────────────────────

@router.get("/wallet")
async def get_wallet(user=Depends(get_current_user)):
    """Get wallet balance and pending top-up status."""
    user_id = user["id"]
    wallet  = repo.get_wallet(user_id)
    if not wallet:
        wallet = repo.create_wallet(user_id)

    pending = repo.get_pending_topup(user_id)

    return {
        "balance":  float(wallet.get("balance", 0) or 0),
        "currency": wallet.get("currency", "USD"),
        "pending_topup": (
            {"amount": pending["amount"], "status": pending["status"]}
            if pending else None
        ),
        "presets": TOPUP_PRESETS,
    }


@router.get("/wallet/transactions")
async def get_transactions(user=Depends(get_current_user), limit: int = 50):
    """Get wallet transaction history."""
    txs = repo.get_wallet_transactions(user["id"], limit=limit)
    return {"transactions": txs}


@router.get("/wallet/config")
async def get_wallet_config():
    """Public endpoint — payment details for the top-up page."""
    return {
        "bank":       BANK,
        "paypal":     PAYPAL,
        "presets":    TOPUP_PRESETS,
        "min_topup":  MIN_TOPUP,
        "pricing": {
            "hot_lead": repo.HOT_LEAD_PRICE,
        },
    }


@router.post("/wallet/topup")
async def submit_topup(req: TopupRequest, user=Depends(get_current_user)):
    """Submit a top-up request for admin review."""
    user_id = user["id"]

    if req.amount < MIN_TOPUP:
        raise HTTPException(400, f"Minimum top-up is ${MIN_TOPUP:.0f}.")

    if req.payment_method not in ("bank", "paypal"):
        raise HTTPException(400, "payment_method must be 'bank' or 'paypal'.")

    existing_pending = repo.get_pending_topup(user_id)
    if existing_pending:
        raise HTTPException(409, "You already have a pending top-up request awaiting review.")

    try:
        topup = repo.create_topup_request({
            "user_id":         user_id,
            "amount":          req.amount,
            "payment_method":  req.payment_method,
            "paypal_txn":      req.paypal_txn,
            "note":            req.note,
            "screenshot_b64":  req.screenshot_b64,
            "screenshot_mime": req.screenshot_mime or "image/png",
            "status":          "pending",
        })
    except Exception as e:
        log.error("create_topup_request failed: %s", e)
        raise HTTPException(500, "Could not submit your top-up request — please try again.")

    if not topup or not topup.get("id"):
        log.error("create_topup_request returned no id for user %s", user_id)
        raise HTTPException(500, "Could not submit your top-up request — please try again.")

    try:
        repo.create_notification({
            "user_id":      user_id,
            "type":         "info",
            "title":        "🕐 Top-up request submitted",
            "body":         f"Your ${req.amount:.0f} top-up request is pending review. We'll verify and credit your wallet within 24h.",
            "action_url":   "/wallet",
            "action_label": "View wallet",
        })
    except Exception as e:
        log.warning("Failed to create user notification: %s", e)

    try:
        method_label = "Bank Transfer" if req.payment_method == "bank" else "PayPal"
        repo.notify_admin(
            title=f"💰 Wallet top-up: ${req.amount:.0f} via {method_label}",
            body=f"User: {user.get('email', user_id)} | Ref: {req.paypal_txn or '—'} | Screenshot: {'✓' if req.screenshot_b64 else '✗'}",
            action_url="/admin",
        )
    except Exception as e:
        log.warning("Failed to notify admin: %s", e)

    log.info("Top-up request %s: user=%s amount=%.2f method=%s",
              topup["id"], user_id, req.amount, req.payment_method)

    return {"ok": True, "topup_id": topup["id"], "status": "pending"}


# ── Admin endpoints ────────────────────────────────────────────────

@router.get("/admin/wallet/topups")
async def admin_list_topups(status: str = "pending", admin=Depends(get_current_user)):
    """Admin: list top-up requests, optionally filtered by status."""
    _verify_admin(admin)
    try:
        topups = repo.get_all_topups(status=status if status != "all" else None)
        return {"topups": topups}
    except Exception as e:
        log.error("admin_list_topups: %s", e)
        raise HTTPException(500, str(e))


@router.get("/admin/wallet/topups/{topup_id}/screenshot")
async def admin_get_topup_screenshot(topup_id: str, admin=Depends(get_current_user)):
    """Admin: get the receipt screenshot for a top-up request."""
    _verify_admin(admin)
    topup = repo.get_topup_by_id(topup_id)
    if not topup:
        raise HTTPException(404, "Top-up not found.")
    return {
        "screenshot_b64":  topup.get("screenshot_b64"),
        "screenshot_mime": topup.get("screenshot_mime", "image/png"),
    }


@router.post("/admin/wallet/topups/{topup_id}/decide")
async def admin_decide_topup(
    topup_id: str,
    req:      AdminTopupDecision,
    admin=Depends(get_current_user),
):
    """Admin: approve or reject a pending top-up request."""
    _verify_admin(admin)

    topup = repo.get_topup_by_id(topup_id)
    if not topup:
        raise HTTPException(404, "Top-up not found.")
    if topup["status"] != "pending":
        raise HTTPException(409, f"Already {topup['status']}.")

    now = datetime.now(timezone.utc).isoformat()
    new_status = "approved" if req.approve else "rejected"

    repo.update_topup(topup_id, {
        "status":      new_status,
        "admin_note":  req.note,
        "reviewed_by": admin["id"],
        "reviewed_at": now,
    })

    user_id = topup["user_id"]
    amount  = float(topup["amount"])

    if req.approve:
        try:
            new_balance = repo.update_wallet_balance(
                user_id=user_id,
                amount=amount,
                tx_type="topup",
                description=f"Wallet top-up approved — ${amount:.2f}",
            )
        except Exception as e:
            log.error("Failed to credit wallet for topup %s: %s", topup_id, e)
            raise HTTPException(500, "Approved but failed to credit wallet — check logs.")

        # Reactivate any inactive agents now that the balance is healthy.
        try:
            agents = repo.list_agents_by_user(user_id)
            count = 0
            for agent in agents:
                if agent.get("status") == "inactive":
                    repo.update_agent(agent["id"], {"status": "active"})
                    count += 1
            if count > 0:
                repo.create_notification({
                    "user_id":      user_id,
                    "type":         "success",
                    "title":        "✅ Your AI agent is back online!",
                    "body":         f"{count} agent{'s' if count > 1 else ''} reactivated. Wallet recharged successfully.",
                    "action_url":   "/dashboard",
                    "action_label": "View dashboard",
                })
                log.info("Reactivated %d agents for user %s after top-up", count, user_id)
        except Exception as e:
            log.warning("Failed to reactivate agents for %s: %s", user_id, e)

        try:
            repo.create_notification({
                "user_id":      user_id,
                "type":         "success",
                "title":        f"✅ Top-up approved — ${amount:.2f} added",
                "body":         f"Your wallet balance is now ${new_balance:.2f}.",
                "action_url":   "/wallet",
                "action_label": "View wallet",
            })
        except Exception:
            pass

        return {"ok": True, "status": "approved", "new_balance": new_balance}

    else:
        try:
            repo.create_notification({
                "user_id":      user_id,
                "type":         "warning",
                "title":        "❌ Top-up request rejected",
                "body":         req.note or "Your top-up request could not be verified. Please contact support or try again.",
                "action_url":   "/wallet/topup",
                "action_label": "Try again",
            })
        except Exception:
            pass

        return {"ok": True, "status": "rejected"}