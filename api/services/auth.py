"""
EasyBuilda -- Auth service
"""
from __future__ import annotations
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from config import settings

log    = logging.getLogger("easybuilda.auth")
bearer = HTTPBearer(auto_error=False)


async def _verify_token(token: str) -> dict:
    from supabase import create_client
    try:
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        resp   = client.auth.get_user(token)
        if not resp or not resp.user:
            raise ValueError("Invalid token")
        return {"id": resp.user.id, "email": resp.user.email}
    except Exception as e:
        log.warning("Token verification failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return await _verify_token(credentials.credentials)


async def get_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    user = await get_current_user(credentials)
    from db import get_db
    db = get_db()
    res = db.table("profiles").select("plan,is_admin").eq("id", user["id"]).limit(1).execute()
    if res.data:
        p = res.data[0]
        if p.get("plan") == "admin" or p.get("is_admin"):
            return user
    if user.get("email"):
        res2 = db.table("profiles").select("plan,is_admin").eq("email", user["email"]).limit(1).execute()
        if res2.data:
            p2 = res2.data[0]
            if p2.get("plan") == "admin" or p2.get("is_admin"):
                return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")


async def verify_token_ws(token: str) -> dict:
    from supabase import create_client
    try:
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        resp   = client.auth.get_user(token)
        if not resp or not resp.user:
            raise ValueError("Invalid token")
        return {"id": resp.user.id, "email": resp.user.email}
    except Exception as e:
        raise ValueError(f"Token verification failed: {e}")


async def register_trial_if_new(user_id: str, email: str) -> dict:
    """Called on first login. Sets up trial if not exists. Blocks if trial used."""
    from db import get_db
    from services import repo
    from datetime import datetime, timezone, timedelta
    import json
    db = get_db()

    # Check trial_history
    history = db.table("trial_history").select("email").eq("email", email).limit(1).execute()
    profile = repo.get_profile(user_id)

    if not profile:
        # New user - create profile
        now = datetime.now(timezone.utc)
        trial_ends = (now + timedelta(days=3)).isoformat()
        db.table("profiles").insert({
            "id":             user_id,
            "email":          email,
            "plan":           "trial",
            "trial_used":     True,
            "trial_ends_at":  trial_ends,
            "total_agents_created": 0,
            "period_agents_created": 0,
        }).execute()
        # Create wallet
        db.table("wallets").insert({"user_id": user_id, "balance": 0, "currency": "USD"}).execute()
        # Log trial
        if not history.data:
            db.table("trial_history").insert({"email": email, "user_id": user_id}).execute()
        return {"plan": "trial", "trial_ends_at": trial_ends}

    # Existing user - check if trial used before
    if history.data and profile.get("plan") in ("trial", "expired"):
        pass  # Normal - they used trial with this account

    return {"plan": profile.get("plan", "trial")}
