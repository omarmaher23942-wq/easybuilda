"""Payment flow v2 — Screenshot upload + Admin verify + API key injection."""
from __future__ import annotations
import logging, os
from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Form
from pydantic import BaseModel
from services import repo
from services.auth import get_current_user
from config import settings

log = logging.getLogger("easybuilda.payments")
router = APIRouter(prefix="/api", tags=["payments"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")
PAYPAL_LINK  = "https://www.paypal.com/paypalme/Ahmedmaher1728399"
PAYPAL_NAME  = "Ahmed Maher Abdel Aziz Mahmoud Abdel Galil"
SUPPORT_EMAIL = "omarmaher23942@gmail.com"

PLAN_PRICES = {"basic": 49, "pro": 129, "max": 299, "singularity": 699}

def _require_admin(x_admin_secret: str = Header(default="")):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")

# ── Customer endpoints ─────────────────────────────────────────────────────────

@router.get("/payments/info")
async def payment_info():
    return {
        "paypal_link":  PAYPAL_LINK,
        "paypal_name":  PAYPAL_NAME,
        "plans":        PLAN_PRICES,
        "support":      SUPPORT_EMAIL,
        "note": "Send exact amount, then submit your payment request with screenshot.",
    }

@router.post("/payments/submit")
async def submit_payment(
    plan:       str       = Form(...),
    payer_name: str       = Form(...),
    paid_at:    str       = Form(...),
    amount:     float     = Form(...),
    note:       str       = Form(""),
    screenshot: UploadFile = File(...),
    user=Depends(get_current_user),
):
    # Validate plan
    if plan not in PLAN_PRICES:
        raise HTTPException(400, f"Invalid plan. Choose: {', '.join(PLAN_PRICES)}")

    # Check for existing pending
    existing = repo.get_pending_payment(user["id"])
    if existing:
        raise HTTPException(400, "You already have a pending payment under review.")

    # Save screenshot to Supabase Storage
    screenshot_url = None
    try:
        contents = await screenshot.read()
        ext = screenshot.filename.split(".")[-1] if screenshot.filename else "jpg"
        filename = f"payments/{user['id']}/{paid_at.replace('-','')}.{ext}"
        from db import get_db
        res = get_db().storage.from_("payment-screenshots").upload(
            filename, contents,
            {"content-type": screenshot.content_type or "image/jpeg"}
        )
        screenshot_url = get_db().storage.from_("payment-screenshots").get_public_url(filename)
    except Exception as e:
        log.warning("Screenshot upload failed: %s", e)
        # Continue without screenshot — not blocking

    payment = repo.insert_payment({
        "user_id":        user["id"],
        "plan":           plan,
        "amount":         PLAN_PRICES[plan],
        "payer_name":     payer_name.strip(),
        "paid_at":        paid_at,
        "note":           note.strip(),
        "status":         "pending",
        "screenshot_url": screenshot_url,
    })

    log.info("Payment submitted: user=%s plan=%s amount=%s", user["id"], plan, PLAN_PRICES[plan])
    return {
        "ok": True,
        "payment_id": payment["id"],
        "message": "Payment received! We'll upgrade your account within 30 minutes.",
        "support": SUPPORT_EMAIL,
    }

@router.get("/payments/mine")
async def my_payments(user=Depends(get_current_user)):
    return {"payments": repo.list_payments_for_user(user["id"])}

# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/admin/payments")
async def list_payments(_=Depends(_require_admin)):
    """List all pending payments for admin review."""
    return {"payments": repo.list_pending_payments()}

class ApproveRequest(BaseModel):
    openrouter_key: str = ""
    notes: str = ""

@router.post("/admin/payments/{payment_id}/approve")
async def approve_payment(
    payment_id: str,
    req: ApproveRequest,
    _=Depends(_require_admin),
):
    payment = repo.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    if payment["status"] != "pending":
        raise HTTPException(400, f"Already {payment['status']}")

    # Upgrade plan
    repo.upgrade_user_plan(payment["user_id"], payment["plan"])

    # Save API key if provided
    repo.update_payment_status(payment_id, "completed", req.openrouter_key)

    log.info("Payment approved: id=%s user=%s plan=%s key=%s",
             payment_id, payment["user_id"], payment["plan"],
             "YES" if req.openrouter_key else "NO")

    return {"ok": True, "message": f"Plan upgraded to {payment['plan']}"}

@router.post("/admin/payments/{payment_id}/reject")
async def reject_payment(
    payment_id: str,
    _=Depends(_require_admin),
):
    payment = repo.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    repo.update_payment_status(payment_id, "rejected", "")
    log.info("Payment rejected: id=%s", payment_id)
    return {"ok": True}