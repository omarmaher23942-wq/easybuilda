"""
Referral system (#55)
GET  /api/referral/my-code  — get or generate user's referral code
POST /api/referral/use      — mark referral used on signup
POST /api/referral/credit   — admin: credit both users after first topup
"""
from __future__ import annotations

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.referral")
router = APIRouter(prefix="/api/referral", tags=["referral"])


def _get_or_create_code(user_id: str, email: str) -> str:
    profile = repo.get_profile(user_id)
    if profile and profile.get("referral_code"):
        return profile["referral_code"]
    prefix = "".join(c for c in email.split("@")[0][:3].upper() if c.isalpha()) or "EB"
    code   = f"EB{prefix}{secrets.token_hex(2).upper()}"
    repo.update_profile(user_id, {"referral_code": code})
    return code


@router.get("/my-code")
async def my_referral_code(user=Depends(get_current_user)):
    profile = repo.get_profile(user["id"])
    email   = user.get("email", "")
    code    = _get_or_create_code(user["id"], email)
    count   = (profile or {}).get("referral_count", 0)
    link    = f"https://easybuilda.com/?ref={code}"
    return {"code": code, "link": link, "count": count}


class UseReferralRequest(BaseModel):
    code: str


@router.post("/use")
async def use_referral(req: UseReferralRequest, user=Depends(get_current_user)):
    """Called on signup if ?ref= param present."""
    db   = get_db()
    code = req.code.strip().upper()
    try:
        res = db.table("profiles").select("id,referral_count").eq("referral_code", code).limit(1).execute()
        if not res.data:
            return {"ok": False, "reason": "Code not found"}
        referrer = res.data[0]
        if referrer["id"] == user["id"]:
            return {"ok": False, "reason": "Cannot use your own code"}
        repo.update_profile(user["id"], {"referred_by": referrer["id"]})
        return {"ok": True}
    except Exception as e:
        log.warning("use_referral error: %s", e)
        return {"ok": False, "reason": str(e)}


@router.post("/credit/{user_id}")
async def credit_referral(user_id: str, admin=Depends(get_current_user)):
    """Credit both referrer and referee $10 after first topup."""
    db      = get_db()
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "User not found")

    referrer_id = profile.get("referred_by")
    if not referrer_id:
        return {"ok": False, "reason": "No referrer"}

    try:
        for uid in [user_id, referrer_id]:
            repo.update_wallet_balance(uid, 10.0, "referral_bonus", "Referral bonus — $10 credit")

        referrer = repo.get_profile(referrer_id)
        repo.update_profile(referrer_id, {
            "referral_count": ((referrer or {}).get("referral_count") or 0) + 1
        })

        repo.create_notification({
            "user_id": user_id, "type":"success",
            "title":"🎉 Referral bonus!",
            "body":"You and your referrer both received $10 wallet credit.",
        })
        repo.create_notification({
            "user_id": referrer_id, "type":"success",
            "title":"🎉 Referral reward!",
            "body":"Someone you referred just signed up and topped up. You both got $10!",
        })
        return {"ok": True}
    except Exception as e:
        log.error("credit_referral error: %s", e)
        raise HTTPException(500, str(e))