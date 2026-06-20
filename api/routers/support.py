"""
EasyBuilda — Real-time Support Chat Router
WebSocket-based bidirectional chat between users and admin.
Add to main.py: from routers import support; app.include_router(support.router)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user, verify_token_ws
from services import repo
from db import get_db

log    = logging.getLogger("easybuilda.support")
router = APIRouter(prefix="/api/support", tags=["support"])

# ── In-memory connection manager ──────────────────────────────────

class ConnectionManager:
    def __init__(self):
        # user_id → set of WebSocket connections (multiple tabs)
        self.user_conns: Dict[str, Set[WebSocket]] = {}
        # admin connections
        self.admin_conns: Set[WebSocket] = set()

    async def connect_user(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.user_conns.setdefault(user_id, set()).add(ws)

    async def connect_admin(self, ws: WebSocket):
        await ws.accept()
        self.admin_conns.add(ws)

    def disconnect_user(self, ws: WebSocket, user_id: str):
        conns = self.user_conns.get(user_id, set())
        conns.discard(ws)
        if not conns:
            self.user_conns.pop(user_id, None)

    def disconnect_admin(self, ws: WebSocket):
        self.admin_conns.discard(ws)

    async def send_to_user(self, user_id: str, data: dict):
        conns = self.user_conns.get(user_id, set())
        dead  = set()
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            conns.discard(ws)

    async def broadcast_to_admins(self, data: dict):
        dead = set()
        for ws in self.admin_conns:
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.admin_conns.discard(ws)

    def online_users(self) -> list[str]:
        return list(self.user_conns.keys())


manager = ConnectionManager()


# ── Helper: save message to DB ────────────────────────────────────

def _save_msg(user_id: str, from_admin: bool, message: str) -> dict:
    db  = get_db()
    now = datetime.now(timezone.utc).isoformat()
    res = db.table("support_messages").insert({
        "user_id":    user_id,
        "from_admin": from_admin,
        "message":    message,
        "created_at": now,
    }).execute()
    return (res.data or [{}])[0]


def _get_profile(user_id: str) -> dict:
    try:
        res = get_db().table("profiles").select("email,full_name,plan").eq("id", user_id).limit(1).execute()
        return (res.data or [{}])[0]
    except Exception:
        return {}


# ── REST: get message history ─────────────────────────────────────

@router.get("/messages")
async def get_messages(user=Depends(get_current_user)):
    """User: get their own support message history."""
    try:
        res = (
            get_db().table("support_messages")
            .select("id,from_admin,message,created_at")
            .eq("user_id", user["id"])
            .order("created_at", desc=False)
            .limit(200)
            .execute()
        )
        return {"messages": res.data or []}
    except Exception as e:
        log.error("get_messages: %s", e)
        return {"messages": []}


@router.post("/message")
async def send_message_rest(
    body: dict,
    user=Depends(get_current_user),
):
    """REST fallback for users without WebSocket support."""
    message = (body.get("message") or "").strip()
    if not message:
        raise HTTPException(400, "Message required")

    saved = _save_msg(user["id"], False, message)

    # Notify admins via WebSocket
    profile = _get_profile(user["id"])
    payload = {
        "type":       "new_message",
        "user_id":    user["id"],
        "message":    message,
        "from_admin": False,
        "created_at": saved.get("created_at", ""),
        "profile":    profile,
    }
    await manager.broadcast_to_admins(payload)
    return {"ok": True, "message_id": saved.get("id")}


# ── Admin REST endpoints ──────────────────────────────────────────

@router.get("/admin/conversations")
async def admin_list_conversations(admin=Depends(get_current_user)):
    """Admin: list all open conversations with last message."""
    try:
        db = get_db()
        # Get distinct users who have sent messages
        res = (
            db.table("support_messages")
            .select("user_id,message,created_at")
            .eq("from_admin", False)
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        msgs = res.data or []

        # Deduplicate by user_id (keep most recent)
        seen:  set = set()
        convos = []
        for m in msgs:
            uid = m["user_id"]
            if uid not in seen:
                seen.add(uid)
                profile = _get_profile(uid)
                convos.append({
                    "id":         uid,
                    "user_id":    uid,
                    "message":    m["message"],
                    "created_at": m["created_at"],
                    "profiles":   profile,
                    "online":     uid in manager.user_conns,
                })

        return {"conversations": convos}
    except Exception as e:
        log.error("admin_list_conversations: %s", e)
        return {"conversations": []}


@router.get("/admin/messages/{user_id}")
async def admin_get_messages(user_id: str, admin=Depends(get_current_user)):
    """Admin: get full message history for a specific user."""
    try:
        res = (
            get_db().table("support_messages")
            .select("id,from_admin,message,created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(500)
            .execute()
        )
        profile = _get_profile(user_id)
        return {"messages": res.data or [], "profile": profile}
    except Exception as e:
        log.error("admin_get_messages: %s", e)
        return {"messages": [], "profile": {}}


class AdminReplyRequest(BaseModel):
    message: str

@router.post("/admin/reply/{user_id}")
async def admin_reply(
    user_id: str,
    req: AdminReplyRequest,
    admin=Depends(get_current_user),
):
    """Admin: send a reply to a user (REST + WebSocket push)."""
    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message required")

    saved = _save_msg(user_id, True, message)

    # Push to user via WebSocket if online
    payload = {
        "type":       "new_message",
        "user_id":    user_id,
        "message":    message,
        "from_admin": True,
        "created_at": saved.get("created_at", ""),
    }
    await manager.send_to_user(user_id, payload)

    # Also push to all admin windows so they see their own reply
    await manager.broadcast_to_admins({**payload, "echo": True})

    # Create in-app notification for user
    try:
        repo.create_notification({
            "user_id": user_id,
            "type":    "info",
            "title":   "💬 New message from EasyBuilda",
            "body":    message[:120] + ("…" if len(message) > 120 else ""),
            "action_url":   "/dashboard?tab=support",
            "action_label": "View message",
        })
    except Exception:
        pass

    return {"ok": True}


# ── WebSocket: user ───────────────────────────────────────────────

@router.websocket("/ws/user")
async def user_ws(ws: WebSocket, token: str):
    """
    WebSocket for users.
    Connect: wss://easybuilda.com/backend/api/support/ws/user?token=JWT
    """
    try:
        user = await verify_token_ws(token)
    except Exception:
        await ws.close(code=4001, reason="Unauthorized")
        return

    user_id = user["id"]
    await manager.connect_user(ws, user_id)
    log.info("User WS connected: %s", user_id)

    # Notify admin that user is online
    profile = _get_profile(user_id)
    await manager.broadcast_to_admins({
        "type":    "user_online",
        "user_id": user_id,
        "profile": profile,
    })

    try:
        while True:
            data = await ws.receive_json()
            message = (data.get("message") or "").strip()
            if not message:
                continue

            saved = _save_msg(user_id, False, message)

            # Echo back to user (for multi-tab)
            await manager.send_to_user(user_id, {
                "type":       "new_message",
                "user_id":    user_id,
                "message":    message,
                "from_admin": False,
                "created_at": saved.get("created_at", ""),
            })

            # Push to admin
            await manager.broadcast_to_admins({
                "type":       "new_message",
                "user_id":    user_id,
                "message":    message,
                "from_admin": False,
                "created_at": saved.get("created_at", ""),
                "profile":    profile,
            })

    except WebSocketDisconnect:
        manager.disconnect_user(ws, user_id)
        await manager.broadcast_to_admins({
            "type":    "user_offline",
            "user_id": user_id,
        })
        log.info("User WS disconnected: %s", user_id)


# ── WebSocket: admin ──────────────────────────────────────────────

@router.websocket("/ws/admin")
async def admin_ws(ws: WebSocket, token: str):
    """
    WebSocket for admin.
    Connect: wss://easybuilda.com/backend/api/support/ws/admin?token=JWT
    """
    try:
        admin = await verify_token_ws(token)
        profile = _get_profile(admin["id"])
        if not profile.get("plan") == "admin":
            # Check is_admin flag
            res = get_db().table("profiles").select("is_admin").eq("id", admin["id"]).limit(1).execute()
            if not (res.data and res.data[0].get("is_admin")):
                await ws.close(code=4003, reason="Admin only")
                return
    except Exception:
        await ws.close(code=4001, reason="Unauthorized")
        return

    await manager.connect_admin(ws)
    log.info("Admin WS connected: %s", admin["id"])

    # Send list of online users immediately
    await ws.send_json({
        "type":         "online_users",
        "online_users": manager.online_users(),
    })

    try:
        while True:
            data = await ws.receive_json()
            # Admin sends: { user_id, message }
            target_uid = data.get("user_id", "").strip()
            message    = data.get("message", "").strip()
            if not target_uid or not message:
                continue

            saved = _save_msg(target_uid, True, message)
            payload = {
                "type":       "new_message",
                "user_id":    target_uid,
                "message":    message,
                "from_admin": True,
                "created_at": saved.get("created_at", ""),
            }

            # Push to user
            await manager.send_to_user(target_uid, payload)

            # Echo to all admins (so other admin tabs see it)
            await manager.broadcast_to_admins({**payload, "echo": True})

            # Notification for user
            try:
                repo.create_notification({
                    "user_id": target_uid, "type":"info",
                    "title":"💬 New message from EasyBuilda",
                    "body": message[:120] + ("…" if len(message)>120 else ""),
                    "action_url":"/dashboard?tab=support",
                    "action_label":"View message",
                })
            except Exception:
                pass

    except WebSocketDisconnect:
        manager.disconnect_admin(ws)
        log.info("Admin WS disconnected: %s", admin["id"])