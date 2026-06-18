
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














# ── Payments ───────────────────────────────────────────────────────

def create_payment_request(payload: dict) -> dict:
    res = get_db().table("payment_requests").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_pending_payment(user_id: str) -> dict | None:
    res = get_db().table("payment_requests").select("*").eq("user_id", user_id).eq("status", "pending").limit(1).execute()
    return res.data[0] if res.data else None

def get_latest_payment(user_id: str) -> dict | None:
    res = get_db().table("payment_requests").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def get_payment_by_id(payment_id: str) -> dict | None:
    res = get_db().table("payment_requests").select("*").eq("id", payment_id).limit(1).execute()
    return res.data[0] if res.data else None

def get_all_payments(status: str | None = None) -> list[dict]:
    q = get_db().table("payment_requests").select("*, profiles(email, full_name, plan)").order("created_at", desc=True)
    if status:
        q = q.eq("status", status)
    res = q.limit(100).execute()
    return res.data or []

def update_payment(payment_id: str, payload: dict) -> dict | None:
    res = get_db().table("payment_requests").update(payload).eq("id", payment_id).execute()
    return res.data[0] if res.data else None

# ── Notifications ──────────────────────────────────────────────────

def create_notification(payload: dict) -> dict:
    res = get_db().table("notifications").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_notifications(user_id: str, limit: int = 20) -> list[dict]:
    res = get_db().table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    return res.data or []

def mark_notifications_read(user_id: str, ids: list[str]) -> None:
    if not ids:
        return
    get_db().table("notifications").update({"read": True}).eq("user_id", user_id).in_("id", ids).execute()

def notify_admin(title: str, body: str, action_url: str = "/admin") -> None:
    """Notify all admin users."""
    admins = get_db().table("profiles").select("id").eq("plan", "admin").execute()
    for a in (admins.data or []):
        create_notification({
            "user_id":      a["id"],
            "type":         "system",
            "title":        title,
            "body":         body,
            "action_url":   action_url,
            "action_label": "View",
        })

# ── Support ────────────────────────────────────────────────────────

def create_support_message(payload: dict) -> dict:
    res = get_db().table("support_messages").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_support_messages(user_id: str) -> list[dict]:
    res = get_db().table("support_messages").select("*").eq("user_id", user_id).order("created_at", asc=True).limit(100).execute()
    return res.data or []

def get_all_support_conversations() -> list[dict]:
    """Get latest message per user for admin panel."""
    res = get_db().table("support_messages").select("*, profiles(email, full_name)").eq("from_admin", False).order("created_at", desc=True).limit(50).execute()
    # Deduplicate by user_id
    seen, result = set(), []
    for m in (res.data or []):
        if m["user_id"] not in seen:
            seen.add(m["user_id"])
            result.append(m)
    return result

# ── Admin ──────────────────────────────────────────────────────────

def get_admin_stats() -> dict:
    db = get_db()
    try:
        res = db.rpc("admin_stats_fn", {}).execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
    # Fallback: manual queries
    total   = db.table("profiles").select("id", count="exact").execute()
    trial   = db.table("profiles").select("id", count="exact").eq("plan", "trial").execute()
    basic   = db.table("profiles").select("id", count="exact").eq("plan", "basic").execute()
    pro_p   = db.table("profiles").select("id", count="exact").eq("plan", "pro").execute()
    expired = db.table("profiles").select("id", count="exact").eq("plan", "expired").execute()
    pending = db.table("payment_requests").select("id", count="exact").eq("status", "pending").execute()
    approved= db.table("payment_requests").select("id", count="exact").eq("status", "approved").execute()
    agents  = db.table("agents").select("id", count="exact").eq("status", "active").execute()
    return {
        "total_users":       total.count or 0,
        "active_trials":     trial.count or 0,
        "basic_users":       basic.count or 0,
        "pro_users":         pro_p.count or 0,
        "expired_users":     expired.count or 0,
        "pending_payments":  pending.count or 0,
        "approved_payments": approved.count or 0,
        "total_revenue":     (approved.count or 0) * 29,  # approximate
        "active_agents":     agents.count or 0,
    }

def get_recent_users(limit: int = 10) -> list[dict]:
    res = get_db().table("profiles").select("id, email, full_name, plan, created_at, trial_ends_at").order("created_at", desc=True).limit(limit).execute()
    return res.data or []

def get_all_users(limit: int = 50, offset: int = 0) -> list[dict]:
    res = get_db().table("profiles").select("id, email, full_name, plan, created_at, trial_ends_at, billing_plan").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return res.data or []

def update_profile(user_id: str, payload: dict) -> dict | None:
    res = get_db().table("profiles").update(payload).eq("id", user_id).execute()
    return res.data[0] if res.data else None

def update_payment(payment_id: str, payload: dict) -> dict | None:
    res = get_db().table("payment_requests").update(payload).eq("id", payment_id).execute()
    return res.data[0] if res.data else None

def list_leads(agent_id: str) -> list:
    return get_leads_by_agent(agent_id)

def get_all_payments(status: str | None = None) -> list:
    q = get_db().table("payment_requests").select("*").order("created_at", desc=True)
    if status:
        q = q.eq("status", status)
    return q.execute().data or []