from __future__ import annotations
from fastapi import APIRouter, Depends
from services.auth import get_current_user
from services import repo

router = APIRouter(prefix="/api", tags=["auth"])

@router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    profile = repo.get_profile(user["id"])
    return {"user": user, "profile": profile}