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
