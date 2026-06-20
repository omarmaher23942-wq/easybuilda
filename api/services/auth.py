"""
EasyBuilda -- Auth service
Handles JWT verification for both HTTP and WebSocket endpoints.
"""
from __future__ import annotations

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

log    = logging.getLogger("easybuilda.auth")
bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    """Verify Supabase JWT and return user dict with id + email."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return await _verify_token(credentials.credentials)


async def _verify_token(token: str) -> dict:
    """Core token verification via Supabase REST API."""
    from supabase import create_client
    try:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        resp   = client.auth.get_user(token)
        if not resp or not resp.user:
            raise ValueError("Invalid token")
        return {"id": resp.user.id, "email": resp.user.email}
    except Exception as e:
        log.warning("Token verification failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def verify_token_ws(token: str) -> dict:
    """Verify JWT token for WebSocket connections (token passed as query param)."""
    from supabase import create_client
    try:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        resp   = client.auth.get_user(token)
        if not resp or not resp.user:
            raise ValueError("Invalid token")
        return {"id": resp.user.id, "email": resp.user.email}
    except Exception as e:
        raise ValueError(f"Token verification failed: {e}")
