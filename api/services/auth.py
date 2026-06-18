"""
EasyBuilda — Auth service
Verifies Supabase JWTs and provides FastAPI dependencies.
"""
from __future__ import annotations

import logging
import os

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

log = logging.getLogger("easybuilda.auth")

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    Validate the Supabase JWT by calling the Supabase /auth/v1/user endpoint.
    Returns the user dict on success, raises 401 on failure.
    """
    token = creds.credentials
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

    if not supabase_url:
        log.error("SUPABASE_URL not set")
        raise HTTPException(500, "Auth misconfiguration")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": supabase_key,
                },
            )
    except Exception as e:
        log.error("Auth request failed: %s", e)
        raise HTTPException(401, "Authentication failed")

    if res.status_code != 200:
        raise HTTPException(401, "Invalid or expired token")

    user = res.json()
    if not user.get("id"):
        raise HTTPException(401, "Invalid token payload")

    return user


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require admin plan."""
    from services import repo
    profile = repo.get_profile(user["id"])
    if not profile or profile.get("plan") != "admin":
        raise HTTPException(403, "Admin access required.")
    return user