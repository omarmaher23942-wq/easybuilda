"""
EasyBuilda — Wallet Router (complete)
Handles: balance, top-up requests, transactions, admin management
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel

from services.auth import get_current_user
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.wallet")
router = APIRouter(prefix="/api", tags=["wallet"])


# ── Schemas ────────────────────────────────────────────────────────

class TopupRequest(BaseModel):
    amount:         float
    payment_method: str = "bank"
    paypal_txn:     str = ""
    note:           str = ""
    screenshot_b64: str = ""
    screenshot_mime:str = "image/png"
    cold_count:     int = 0
    warm_count:     int = 0
    hot_count:      int = 0

class TopupDecision(BaseModel):
    approve: bool
    note:    str = ""


# ══════════════════════════════════════════════════════════════════
# USER ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@router.get("/wallet")
async def get_wallet(user=Depends(get_current_user)):
    """Get current user's wallet balance and pending top-up."""
    db = get_db()
    try:
        wallet_res = db.table("wallets").select("balance,currency").eq("user_id", user["id"]).limit(1).execute()
        if not wallet_res.data:
            db.table("wallets").insert({"user_id": user["id"], "balance": 0, "currency": "USD"}).execute()
            balance  = 0.0
            currency = "USD"
        else:
            balance  = float(wallet_res.data[0]["balance"] or 0)
            currency = wallet_res.data[0]["currency"]

        pending_res = (
            db.table("topup_requests")
            .select("amount,status")
            .eq("user_id", user["id"])
            .eq("status", "pending")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        pending = pending_res.data[0] if pending_res.data else None

        return {
            "balance":      balance,
            "currency":     currency,
            "pending_topup": pending,
        }
    except Exception as e:
        log.error("get_wallet: %s", e)
        raise HTTPException(500, "Failed to load wallet")


@router.get("/wallet/transactions")
async def get_transactions(user=Depends(get_current_user), limit: int = 50):
    """Get wallet transaction history."""
    try:
        res = (
            get_db().table("wallet_transactions")
            .select("id,type,amount,balance_after,description,created_at")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"transactions": res.data or []}
    except Exception as e:
        log.error("get_transactions: %s", e)
        return {"transactions": []}


@router.post("/wallet/topup")
async def request_topup(req: TopupRequest, user=Depends(get_current_user)):
    """Submit a top-up request. Admin reviews and approves."""
    if req.amount < 5:
        raise HTTPException(400, "Minimum top-up is $5 USD")
    if req.amount > 10000:
        raise HTTPException(400, "Maximum top-up is $10,000 USD per request")
    if req.payment_method not in ("bank", "paypal"):
        raise HTTPException(400, "Payment method must be 'bank' or 'paypal'")

    try:
        db  = get_db()
        now = datetime.now(timezone.utc).isoformat()

        existing = (
            db.table("topup_requests")
            .select("id,status")
            .eq("user_id", user["id"])
            .eq("status", "pending")
            .execute()
        )
        if existing.data:
            raise HTTPException(409, "You already have a pending top-up request. Wait for it to be reviewed.")

        row = {
            "user_id":        user["id"],
            "amount":         req.amount,
            "payment_method": req.payment_method,
            "paypal_txn":     req.paypal_txn or "",
            "note":           req.note or "",
            "cold_count":     req.cold_count,
            "warm_count":     req.warm_count,
            "hot_count":      req.hot_count,
            "status":         "pending",
            "created_at":     now,
        }
        if req.screenshot_b64:
            row["screenshot_b64"]  = req.screenshot_b64
            row["screenshot_mime"] = req.screenshot_mime or "image/png"

        res = db.table("topup_requests").insert(row).execute()
        topup_id = (res.data or [{}])[0].get("id")

        try:
            admin_res = db.table("profiles").select("id").eq("plan","admin").limit(1).execute()
            if admin_res.data:
                repo.create_notification({
                    "user_id":      admin_res.data[0]["id"],
                    "type":         "info",
                    "title":        f"💰 New top-up request — ${req.amount}",
                    "body":         f"User {user.get('email',user['id'][:8])} wants to add ${req.amount} via {req.payment_method}.",
                    "action_url":   "/admin?tab=topups",
                    "action_label": "Review →",
                })
        except Exception:
            pass

        return {"ok": True, "topup_id": topup_id, "status": "pending"}
    except HTTPException:
        raise
    except Exception as e:
        log.error("request_topup: %s", e)
        raise HTTPException(500, "Failed to submit top-up request")


@router.get("/wallet/topup/status")
async def topup_status(user=Depends(get_current_user)):
    """Check status of user's most recent top-up request."""
    try:
        res = (
            get_db().table("topup_requests")
            .select("id,amount,status,admin_note,created_at")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return {"topup": res.data[0] if res.data else None}
    except Exception:
        return {"topup": None}


# ══════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════

def _verify_admin(user: dict) -> None:
    db  = get_db()
    res = db.table("profiles").select("plan,is_admin").eq("id", user["id"]).limit(1).execute()
    if res.data:
        p = res.data[0]
        if p.get("plan") == "admin" or p.get("is_admin"):
            return
    if user.get("email"):
        res2 = db.table("profiles").select("plan,is_admin").eq("email", user["email"]).limit(1).execute()
        if res2.data:
            p2 = res2.data[0]
            if p2.get("plan") == "admin" or p2.get("is_admin"):
                return
    raise HTTPException(403, "Admin only")


@router.get("/admin/wallet/topups")
async def admin_list_topups(
    status: str = "pending",
    admin=Depends(get_current_user),
):
    """Admin: list top-up requests with user profile info."""
    _verify_admin(admin)
    try:
        db  = get_db()
        q   = db.table("topup_requests").select("id,user_id,amount,payment_method,paypal_txn,note,status,admin_note,created_at,cold_count,warm_count,hot_count")
        if status != "all":
            q = q.eq("status", status)
        res = q.order("created_at", desc=True).limit(100).execute()
        topups = res.data or []

        for t in topups:
            try:
                pr = db.table("profiles").select("email,full_name,plan").eq("id", t["user_id"]).limit(1).execute()
                t["profiles"] = pr.data[0] if pr.data else {}
            except Exception:
                t["profiles"] = {}

        return {"topups": topups}
    except HTTPException:
        raise
    except Exception as e:
        log.error("admin_list_topups: %s", e)
        raise HTTPException(500, str(e))


@router.get("/admin/wallet/topups/{topup_id}/screenshot")
async def admin_get_screenshot(topup_id: str, admin=Depends(get_current_user)):
    """Admin: get receipt screenshot for a top-up request."""
    _verify_admin(admin)
    try:
        res = (
            get_db().table("topup_requests")
            .select("screenshot_b64,screenshot_mime")
            .eq("id", topup_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(404, "Top-up not found")
        return {
            "screenshot_b64":  res.data[0].get("screenshot_b64", ""),
            "screenshot_mime": res.data[0].get("screenshot_mime", "image/png"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/admin/wallet/topups/{topup_id}/decide")
async def admin_decide_topup(
    topup_id: str,
    req:      TopupDecision,
    admin=Depends(get_current_user),
):
    """Admin: approve or reject a top-up request."""
    _verify_admin(admin)
    db  = get_db()
    now = datetime.now(timezone.utc).isoformat()

    try:
        topup_res = db.table("topup_requests").select("*").eq("id", topup_id).limit(1).execute()
        if not topup_res.data:
            raise HTTPException(404, "Top-up not found")
        topup = topup_res.data[0]

        if topup["status"] != "pending":
            raise HTTPException(409, f"Top-up already {topup['status']}")

        user_id = topup["user_id"]
        amount  = float(topup["amount"])
        new_status = "approved" if req.approve else "rejected"

        db.table("topup_requests").update({
            "status":      new_status,
            "admin_note":  req.note or None,
            "reviewed_by": admin["id"],
            "reviewed_at": now,
        }).eq("id", topup_id).execute()

        if req.approve:
            wallet_res = db.table("wallets").select("balance").eq("user_id", user_id).limit(1).execute()
            current    = float((wallet_res.data or [{"balance":0}])[0]["balance"] or 0)
            new_bal    = current + amount

            db.table("wallets").update({"balance": new_bal, "updated_at": now}).eq("user_id", user_id).execute()

            db.table("wallet_transactions").insert({
                "user_id":      user_id,
                "type":         "topup",
                "amount":       amount,
                "balance_after":new_bal,
                "description":  f"Wallet top-up via {topup['payment_method']} — ${amount}",
                "created_at":   now,
            }).execute()

            agents_res = db.table("agents").select("id,status").eq("user_id", user_id).execute()
            for ag in (agents_res.data or []):
                if ag["status"] == "inactive":
                    db.table("agents").update({"status": "active"}).eq("id", ag["id"]).execute()

            try:
                profile_res = db.table("profiles").select("referred_by,referral_credited").eq("id", user_id).limit(1).execute()
                if profile_res.data:
                    p = profile_res.data[0]
                    if p.get("referred_by") and not p.get("referral_credited"):
                        for uid in [user_id, p["referred_by"]]:
                            w = db.table("wallets").select("balance").eq("user_id", uid).limit(1).execute()
                            bal = float((w.data or [{"balance":0}])[0]["balance"] or 0)
                            db.table("wallets").update({"balance": bal + 10}).eq("user_id", uid).execute()
                            db.table("wallet_transactions").insert({"user_id":uid,"type":"referral_bonus","amount":10.0,"balance_after":bal+10,"description":"Referral bonus — $10","created_at":now}).execute()
                        db.table("profiles").update({"referral_credited": True}).eq("id", user_id).execute()
                        ref_p = db.table("profiles").select("referral_count").eq("id", p["referred_by"]).limit(1).execute()
                        cnt   = int((ref_p.data or [{"referral_count":0}])[0].get("referral_count") or 0)
                        db.table("profiles").update({"referral_count": cnt+1}).eq("id", p["referred_by"]).execute()
            except Exception:
                pass

            repo.create_notification({
                "user_id":      user_id,
                "type":         "info",
                "title":        f"✅ Top-up approved — ${amount} added",
                "body":         f"Your wallet has been credited with ${amount} USD. Your agents are now active.",
                "action_url":   "/wallet",
                "action_label": "View wallet",
            })
        else:
            repo.create_notification({
                "user_id":      user_id,
                "type":         "info",
                "title":        "Top-up rejected",
                "body":         req.note or "Your top-up request was not approved. Please contact support.",
                "action_url":   "/wallet/topup",
                "action_label": "Try again",
            })

        return {"ok": True, "status": new_status}

    except HTTPException:
        raise
    except Exception as e:
        log.error("admin_decide_topup: %s", e)
        raise HTTPException(500, f"Failed to process decision: {e}")