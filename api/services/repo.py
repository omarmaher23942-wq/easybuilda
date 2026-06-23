"""EasyBuilda — Database repository — all DB operations in one place."""
from __future__ import annotations

import logging
import traceback

from db import get_db

log = logging.getLogger("easybuilda.repo")

HOT_LEAD_PRICE = 8.00  # USD — charged once per NEW captured lead, nothing else, and never during trial

# ── Agents ─────────────────────────────────────────────────────────

def username_taken(username: str, exclude_agent_id: str | None = None) -> bool:
    q = get_db().table("agents").select("id").eq("subdomain", username)
    if exclude_agent_id:
        q = q.neq("id", exclude_agent_id)
    res = q.limit(1).execute()
    return bool(res.data)

def insert_agent(payload: dict) -> dict:
    res = get_db().table("agents").insert(payload).execute()
    return res.data[0]

def get_agent_by_id(agent_id: str) -> dict | None:
    res = get_db().table("agents").select("*").eq("id", agent_id).limit(1).execute()
    return res.data[0] if res.data else None

def get_agent_by_username(username: str) -> dict | None:
    res = get_db().table("agents").select("*").eq("subdomain", username).limit(1).execute()
    return res.data[0] if res.data else None

def get_agent_by_subdomain(subdomain: str) -> dict | None:
    return get_agent_by_username(subdomain)

def list_agents_by_user(user_id: str) -> list[dict]:
    res = get_db().table("agents").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data or []

def update_agent(agent_id: str, payload: dict) -> dict | None:
    res = get_db().table("agents").update(payload).eq("id", agent_id).execute()
    return res.data[0] if res.data else None

def delete_agent(agent_id: str) -> None:
    get_db().table("agents").delete().eq("id", agent_id).execute()

# ── Profiles ───────────────────────────────────────────────────────

def get_profile(user_id: str) -> dict | None:
    res = get_db().table("profiles").select("*").eq("id", user_id).limit(1).execute()
    return res.data[0] if res.data else None

def update_profile(user_id: str, payload: dict) -> dict | None:
    res = get_db().table("profiles").update(payload).eq("id", user_id).execute()
    return res.data[0] if res.data else None

# ── Conversations & Messages ───────────────────────────────────────

def get_or_create_conversation(agent_id: str, conversation_id: str | None, visitor_id: str | None, page_url: str | None) -> dict:
    if conversation_id:
        res = get_db().table("conversations").select("*").eq("id", conversation_id).limit(1).execute()
        if res.data:
            return res.data[0]
    payload = {"agent_id": agent_id, "visitor_id": visitor_id, "page_url": page_url}
    res = get_db().table("conversations").insert(payload).execute()
    return res.data[0]

def get_history(conversation_id: str, limit: int = 14) -> list[dict]:
    res = (
        get_db().table("messages").select("role,content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return [
        {"role": m["role"], "content": m["content"]}
        for m in (res.data or [])
        if m.get("role") in ("user", "assistant")
    ]

def get_message_count(conversation_id: str) -> int:
    res = (
        get_db().table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return res.count or 0

def insert_message(conversation_id: str, role: str, content: str) -> None:
    get_db().table("messages").insert(
        {"conversation_id": conversation_id, "role": role, "content": content}
    ).execute()

# ── Leads ──────────────────────────────────────────────────────────

def upsert_lead(agent_id: str, conversation_id: str | None, fields: dict, skip_charge: bool = False) -> dict | None:
    """
    Record a lead for this conversation, ONCE.

    Simple, single rule: a lead is only ever recorded when the visitor
    has shared real contact info (email or phone) — see
    services/leads.py. There is no cold/warm/hot classification. The
    very first time a lead is captured for a given conversation, it is
    inserted and HOT_LEAD_PRICE is charged immediately (unless
    skip_charge is set). If a lead already exists for this
    conversation, this is a no-op — we never charge twice for the same
    visitor, and there's nothing further to update since there's no
    intent field to track anymore.

    skip_charge=True (used while an agent is inside its 7-day free
    trial) records the lead exactly as normal but never touches the
    wallet — the lead still shows up in the dashboard, it's just free.
    """
    data = {k: v for k, v in fields.items() if v is not None and v != ""}

    if conversation_id:
        existing = (
            get_db().table("leads")
            .select("id")
            .eq("conversation_id", conversation_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            # Already captured for this conversation — nothing to do.
            return existing.data[0]

    # New lead — insert once. By the time we get here, services/leads.py
    # has already confirmed real contact info (email or phone) exists.
    data["agent_id"]        = agent_id
    data["conversation_id"] = conversation_id
    res = get_db().table("leads").insert(data).execute()
    new_lead = res.data[0] if res.data else None

    if new_lead and not skip_charge:
        try:
            _charge_hot_lead(agent_id, new_lead["id"])
        except Exception as e:
            # Never let a billing failure break lead capture / the chat response,
            # but ALWAYS log it with full traceback — billing failures must be
            # visible, not silently swallowed.
            log.error(
                "_charge_hot_lead FAILED for agent_id=%s lead_id=%s: %s\n%s",
                agent_id, new_lead.get("id"), repr(e), traceback.format_exc(),
            )

    return new_lead


def _charge_hot_lead(agent_id: str, lead_id: str) -> None:
    """Deduct HOT_LEAD_PRICE from the agent owner's wallet for one new hot lead."""
    db = get_db()
    agent = get_agent_by_id(agent_id)
    if not agent:
        return
    user_id = agent.get("user_id")
    if not user_id:
        return

    new_balance = update_wallet_balance(
        user_id=user_id,
        amount=-HOT_LEAD_PRICE,
        tx_type="hot_lead_charge",
        description=f"Hot lead captured — ${HOT_LEAD_PRICE:.2f} charged",
    )

    # If balance drops below what's needed for the NEXT lead, pause this
    # user's active agents so usage can't run away into a deep negative
    # balance, and notify the owner either way.
    try:
        if new_balance < HOT_LEAD_PRICE:
            agents_res = db.table("agents").select("id,status").eq("user_id", user_id).execute()
            for ag in (agents_res.data or []):
                if ag["status"] == "active":
                    db.table("agents").update({"status": "inactive"}).eq("id", ag["id"]).execute()
            create_notification({
                "user_id":      user_id,
                "type":         "warning",
                "title":        "⚠️ Wallet balance low — agent paused",
                "body":         f"You were charged ${HOT_LEAD_PRICE:.2f} for a new hot lead. Your balance is now ${new_balance:.2f}, below the ${HOT_LEAD_PRICE:.0f} needed for the next lead. Top up to keep your agent active.",
                "action_url":   "/wallet/topup",
                "action_label": "Top up wallet",
            })
        else:
            create_notification({
                "user_id":      user_id,
                "type":         "info",
                "title":        f"🔥 New hot lead — ${HOT_LEAD_PRICE:.2f} charged",
                "body":         f"A new qualified lead came in. ${HOT_LEAD_PRICE:.2f} was deducted from your wallet. Balance: ${new_balance:.2f}.",
                "action_url":   "/dashboard",
                "action_label": "View lead",
            })
    except Exception as e:
        log.error(
            "Post-charge pause/notify step failed for user_id=%s agent_id=%s "
            "(wallet WAS already charged $%.2f): %s\n%s",
            user_id, agent_id, HOT_LEAD_PRICE, repr(e), traceback.format_exc(),
        )


def list_leads(agent_id: str) -> list[dict]:
    res = (
        get_db().table("leads").select("*")
        .eq("agent_id", agent_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []

def list_leads_by_agent(agent_id: str) -> list[dict]:
    """Alias kept for compatibility with routers/agents.py."""
    return list_leads(agent_id)

def get_lead_by_conversation(conversation_id: str) -> dict | None:
    """Get existing lead for a conversation, if any (so we never double-capture)."""
    res = (
        get_db().table("leads")
        .select("id,name,email,phone")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None

def get_lead_stats(agent_id: str) -> dict:
    """Every recorded lead is, by definition, a captured (hot) lead now."""
    leads = list_leads(agent_id)
    return {"total": len(leads)}

# ── Wallet ─────────────────────────────────────────────────────────

def get_wallet(user_id: str) -> dict | None:
    res = get_db().table("wallets").select("*").eq("user_id", user_id).limit(1).execute()
    return res.data[0] if res.data else None

def create_wallet(user_id: str) -> dict:
    res = get_db().table("wallets").insert({"user_id": user_id, "balance": 0.00}).execute()
    return res.data[0] if res.data else {"user_id": user_id, "balance": 0.00}

def update_wallet_balance(
    user_id:     str,
    amount:      float,
    tx_type:     str = "topup",
    description: str = "",
) -> float:
    """Credit (+) or debit (-) wallet. Records transaction. Returns new balance."""
    from datetime import datetime, timezone
    db  = get_db()
    now = datetime.now(timezone.utc).isoformat()
    w   = db.table("wallets").select("balance").eq("user_id", user_id).limit(1).execute()
    cur = float((w.data or [{"balance": 0}])[0].get("balance") or 0)
    new_bal = cur + amount
    db.table("wallets").update({"balance": new_bal, "updated_at": now}).eq("user_id", user_id).execute()
    db.table("wallet_transactions").insert({
        "user_id": user_id, "type": tx_type, "amount": amount,
        "balance_after": new_bal, "description": description or tx_type, "created_at": now,
    }).execute()
    return new_bal

def log_wallet_transaction(payload: dict) -> dict:
    res = get_db().table("wallet_transactions").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_wallet_transactions(user_id: str, limit: int = 20, tx_type: str | None = None) -> list[dict]:
    q = (
        get_db().table("wallet_transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if tx_type:
        q = q.eq("type", tx_type)
    res = q.execute()
    return res.data or []

# ── Top-up Requests ────────────────────────────────────────────────

def create_topup_request(payload: dict) -> dict:
    res = get_db().table("topup_requests").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_pending_topup(user_id: str) -> dict | None:
    res = (
        get_db().table("topup_requests")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None

def get_topup_by_id(topup_id: str) -> dict | None:
    res = get_db().table("topup_requests").select("*").eq("id", topup_id).limit(1).execute()
    return res.data[0] if res.data else None

def get_all_topups(status: str | None = None) -> list[dict]:
    q = (
        get_db().table("topup_requests")
        .select("*, profiles(email, full_name, plan)")
        .order("created_at", desc=True)
    )
    if status:
        q = q.eq("status", status)
    res = q.limit(100).execute()
    return res.data or []

def update_topup(topup_id: str, payload: dict) -> dict | None:
    res = get_db().table("topup_requests").update(payload).eq("id", topup_id).execute()
    return res.data[0] if res.data else None

def get_wallet_stats() -> dict:
    db = get_db()
    try:
        pending = db.table("topup_requests").select("id", count="exact").eq("status", "pending").execute()
        approved = db.table("topup_requests").select("amount").eq("status", "approved").execute()
        total_credited = sum(float(r.get("amount", 0)) for r in (approved.data or []))
        wallets = db.table("wallets").select("balance").execute()
        total_balance = sum(float(r.get("balance", 0)) for r in (wallets.data or []))
        return {
            "pending_topups":  pending.count or 0,
            "total_credited":  total_credited,
            "total_balance":   total_balance,
        }
    except Exception as e:
        return {"error": str(e)}

# ── Notifications ──────────────────────────────────────────────────

def create_notification(payload: dict) -> dict:
    res = get_db().table("notifications").insert(payload).execute()
    return res.data[0] if res.data else {}

def get_notifications(user_id: str, limit: int = 20) -> list[dict]:
    res = (
        get_db().table("notifications")
        .select("*").eq("user_id", user_id)
        .order("created_at", desc=True).limit(limit).execute()
    )
    return res.data or []

def mark_notifications_read(user_id: str, ids: list[str]) -> None:
    if not ids:
        return
    get_db().table("notifications").update({"read": True}).eq("user_id", user_id).in_("id", ids).execute()

def notify_admin(title: str, body: str, action_url: str = "/admin") -> None:
    admins = get_db().table("profiles").select("id").eq("is_admin", True).execute()
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
    res = (
        get_db().table("support_messages")
        .select("*").eq("user_id", user_id)
        .order("created_at").limit(200).execute()
    )
    return res.data or []

def get_all_support_conversations() -> list[dict]:
    res = (
        get_db().table("support_messages")
        .select("*, profiles(email, full_name, plan)")
        .eq("from_admin", False)
        .order("created_at", desc=True).limit(100).execute()
    )
    seen, result = set(), []
    for m in (res.data or []):
        uid = m.get("user_id")
        if uid and uid not in seen:
            seen.add(uid)
            result.append(m)
    return result

# ── Admin ──────────────────────────────────────────────────────────
# NOTE: plan-tier columns (trial/basic/pro/expired counts, trial_ends_at,
# billing_end, billing_plan, period_agents_created) are kept here for
# backward compatibility with the existing admin dashboard UI, even
# though the live pricing model no longer uses subscription tiers.
# They'll mostly read as zero/empty going forward — that's safe, since
# nothing requires them to be non-zero.

def get_admin_stats() -> dict:
    db = get_db()
    try:
        total   = db.table("profiles").select("id", count="exact").execute()
        trial   = db.table("profiles").select("id", count="exact").eq("plan", "trial").execute()
        basic   = db.table("profiles").select("id", count="exact").eq("plan", "basic").execute()
        pro_p   = db.table("profiles").select("id", count="exact").eq("plan", "pro").execute()
        expired = db.table("profiles").select("id", count="exact").eq("plan", "expired").execute()
        pending = db.table("topup_requests").select("id", count="exact").eq("status", "pending").execute()
        approved= db.table("topup_requests").select("amount").eq("status", "approved").execute()
        agents  = db.table("agents").select("id", count="exact").eq("status", "active").execute()
        paid    = (basic.count or 0) + (pro_p.count or 0)
        revenue = sum(float(r.get("amount", 0)) for r in (approved.data or []))
        return {
            "total_users":       total.count or 0,
            "trial_users":       trial.count or 0,
            "paid_users":        paid,
            "basic_users":       basic.count or 0,
            "pro_users":         pro_p.count or 0,
            "expired_users":     expired.count or 0,
            "pending_topups":    pending.count or 0,
            "total_revenue":     revenue,
            "active_agents":     agents.count or 0,
        }
    except Exception as e:
        return {"error": str(e)}

def get_recent_users(limit: int = 10) -> list[dict]:
    res = (
        get_db().table("profiles")
        .select("id, email, full_name, plan, created_at, trial_ends_at, billing_end")
        .order("created_at", desc=True).limit(limit).execute()
    )
    return res.data or []

def get_all_users(limit: int = 50, offset: int = 0) -> list[dict]:
    res = (
        get_db().table("profiles")
        .select("id, email, full_name, plan, created_at, trial_ends_at, billing_end, billing_plan, period_agents_created")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1).execute()
    )
    return res.data or []