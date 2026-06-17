
from __future__ import annotations

from db import get_db

VALID_INTENT = {"hot", "warm", "cold"}


def username_taken(username: str) -> bool:
    res = get_db().table("agents").select("id").eq("subdomain", username).limit(1).execute()
    return bool(res.data)


def insert_agent(payload: dict) -> dict:
    res = get_db().table("agents").insert(payload).execute()
    return res.data[0]


def get_agent_by_id(agent_id: str):
    res = get_db().table("agents").select("*").eq("id", agent_id).limit(1).execute()
    return res.data[0] if res.data else None


def get_agent_by_username(username: str):
    res = get_db().table("agents").select("*").eq("subdomain", username).limit(1).execute()
    return res.data[0] if res.data else None


def get_or_create_conversation(agent_id, conversation_id, visitor_id, page_url) -> dict:
    if conversation_id:
        res = get_db().table("conversations").select("*").eq("id", conversation_id).limit(1).execute()
        if res.data:
            return res.data[0]
    payload = {"agent_id": agent_id, "visitor_id": visitor_id, "page_url": page_url}
    res = get_db().table("conversations").insert(payload).execute()
    return res.data[0]


def get_history(conversation_id: str, limit: int = 14):
    res = (
        get_db().table("messages").select("role,content")
        .eq("conversation_id", conversation_id).order("created_at").limit(limit).execute()
    )
    return [
        {"role": m["role"], "content": m["content"]}
        for m in (res.data or [])
        if m.get("role") in ("user", "assistant")
    ]


def insert_message(conversation_id: str, role: str, content: str) -> None:
    get_db().table("messages").insert(
        {"conversation_id": conversation_id, "role": role, "content": content}
    ).execute()


def upsert_lead(agent_id: str, conversation_id, fields: dict):
    data = {k: v for k, v in fields.items() if v is not None and v != ""}
    if data.get("intent") not in VALID_INTENT:
        data.pop("intent", None)

    existing = None
    if conversation_id:
        res = get_db().table("leads").select("id").eq("conversation_id", conversation_id).limit(1).execute()
        existing = res.data[0] if res.data else None

    if existing:
        res = get_db().table("leads").update(data).eq("id", existing["id"]).execute()
        return res.data[0] if res.data else None

    data["agent_id"] = agent_id
    data["conversation_id"] = conversation_id
    res = get_db().table("leads").insert(data).execute()
    return res.data[0] if res.data else None


def list_leads(agent_id: str):
    res = (
        get_db().table("leads").select("*").eq("agent_id", agent_id)
        .order("created_at", desc=True).execute()
    )
    return res.data or []













"""Payment repo functions — append to existing repo.py"""

# ── Payments ──────────────────────────────────────────────────────────────────

def insert_payment(payload: dict) -> dict:
    res = get_db().table("payments").insert(payload).execute()
    return res.data[0]


def get_payment_by_id(payment_id: str):
    res = get_db().table("payments").select("*").eq("id", payment_id).single().execute()
    return res.data


def get_pending_payment(user_id: str):
    res = (
        get_db().table("payments")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def list_payments_for_user(user_id: str) -> list:
    res = (
        get_db().table("payments")
        .select("id,plan,amount,payer_name,paid_at,status,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def list_pending_payments() -> list:
    res = (
        get_db().table("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def update_payment_status(payment_id: str, status: str, openrouter_key: str) -> None:
    from datetime import datetime, timezone
    update: dict = {
        "status": status,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    if openrouter_key:
        update["openrouter_key"] = openrouter_key
    get_db().table("payments").update(update).eq("id", payment_id).execute()


def upgrade_user_plan(user_id: str, plan: str) -> None:
    get_db().table("profiles").update({"plan": plan}).eq("id", user_id).execute()