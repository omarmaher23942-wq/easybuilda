"""
Public chat endpoint — widget talks to agent here.

Billing model (single, simple):
  - Trial: 7 days from agent.created_at. Completely free — unlimited
    conversations, hot leads captured at no charge.
  - After trial: every NEW hot lead (real contact info + buying intent)
    costs $8, deducted from the agent owner's wallet automatically
    (see services/repo.py — upsert_lead / _charge_hot_lead).
  - While on trial OR while wallet balance >= $8 after trial: agent
    stays active and answers normally.
  - The moment trial ends AND balance < $8: the agent is auto-paused
    (status -> inactive) and this endpoint stops answering until the
    owner tops up. No setup fee, no subscription, nothing else billed.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from schemas import ChatRequest
from services import chat as chat_service
from services import leads as leads_service
from services import repo

log = logging.getLogger("easybuilda.chat")
router = APIRouter(prefix="/api", tags=["chat"])

IMAGE_PLANS = {"pro", "max", "singularity", "admin"}

TRIAL_DAYS      = 7
MIN_BALANCE_USD = repo.HOT_LEAD_PRICE  # $8 — must cover one lead to stay active post-trial


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    try:
        s = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _trial_active(agent: dict) -> bool:
    """True if this SINGLE agent's own created_at is within 7 days.

    NOTE: do not use this directly to gate billing — trial status must
    be computed account-wide (see _account_on_trial below), otherwise
    a second/third agent built later would incorrectly appear to have
    its own separate trial.
    """
    created = _parse_dt(agent.get("created_at"))
    if not created:
        return False  # can't determine -> fail safe, treat as not-on-trial
    age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
    return age_days < TRIAL_DAYS


def _account_on_trial(owner_id: str | None, fallback_agent: dict) -> bool:
    """
    Trial is a single, account-wide window starting from the user's
    OLDEST agent — never per-agent. This must stay consistent with the
    exact same rule used in routers/agents.py (list_my_agents) and
    routers/interview.py (_check_can_build_new_agent).
    """
    if not owner_id:
        return _trial_active(fallback_agent)
    all_agents = repo.list_agents_by_user(owner_id)
    if not all_agents:
        return _trial_active(fallback_agent)
    oldest = min(all_agents, key=lambda a: a.get("created_at") or "")
    return _trial_active(oldest)


def _pause_agent_insufficient_balance(agent: dict, owner_id: str, balance: float) -> None:
    """Pause this agent because the trial ended and the wallet balance is too low."""
    try:
        repo.update_agent(agent["id"], {"status": "inactive"})
        repo.create_notification({
            "user_id":      owner_id,
            "type":         "warning",
            "title":        "⚠️ Trial ended — agent paused",
            "body":         f"Your free trial is over and your wallet balance (${balance:.2f}) is below the ${MIN_BALANCE_USD:.0f} needed for a new lead. Top up to reactivate your agent instantly.",
            "action_url":   "/wallet/topup",
            "action_label": "Top up wallet",
        })
    except Exception as e:  # noqa: BLE001
        log.warning("Failed to pause agent %s on low balance: %s", agent.get("id"), e)


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.agent_id and not req.username:
        raise HTTPException(400, "Provide agent_id or username.")

    agent = (
        repo.get_agent_by_id(req.agent_id)
        if req.agent_id
        else repo.get_agent_by_username(req.username.lower())
    )
    if not agent:
        raise HTTPException(404, "Agent not found.")

    owner_id = agent.get("user_id")
    on_trial = _account_on_trial(owner_id, agent)

    # ── Billing gate: only enforced once the trial is over ──
    if not on_trial:
        if agent.get("status") != "active":
            raise HTTPException(402, "This agent is paused — the owner needs to top up their wallet to reactivate it.")
        if owner_id:
            wallet  = repo.get_wallet(owner_id) or {}
            balance = float(wallet.get("balance", 0) or 0)
            if balance < MIN_BALANCE_USD:
                _pause_agent_insufficient_balance(agent, owner_id, balance)
                raise HTTPException(402, "This agent is paused — the owner needs to top up their wallet to reactivate it.")
    else:
        # On trial: agent must simply not be manually disabled by the owner.
        if agent.get("status") not in ("active", None):
            raise HTTPException(404, "This agent is currently paused by its owner.")

    # Image permission check
    image_b64  = None
    image_mime = None
    if req.image_b64:
        if agent.get("plan") in IMAGE_PLANS:
            image_b64  = req.image_b64
            image_mime = req.image_mime or "image/jpeg"
        else:
            log.info("Image blocked — plan %s", agent.get("plan"))

    conv = repo.get_or_create_conversation(
        agent_id=agent["id"],
        conversation_id=req.conversation_id,
        visitor_id=req.visitor_id,
        page_url=req.page_url,
    )

    history = repo.get_history(conv["id"])
    repo.insert_message(conv["id"], "user", req.message)

    reply, used = await chat_service.run_chat_turn(
        agent, history, req.message,
        image_b64=image_b64, image_mime=image_mime,
    )
    repo.insert_message(conv["id"], "assistant", reply)

    # ── Lead extraction + billing (single path, see services/repo.py) ──
    lead_summary = None
    hot_lead_new = False
    try:
        full = history + [
            {"role": "user",      "content": req.message},
            {"role": "assistant", "content": reply},
        ]
        extracted = await leads_service.extract_lead(full, agent.get("plan"))
        if extracted.get("is_lead"):
            fields = {k: v for k, v in extracted.items() if k != "is_lead"}
            if req.page_url:
                fields["source_page"] = req.page_url

            existing_lead   = repo.get_lead_by_conversation(conv["id"])
            was_already_hot = bool(existing_lead and existing_lead.get("intent") == "hot")

            # skip_charge=True during the trial — the lead is still recorded
            # normally, it just never touches the wallet.
            lead_summary = repo.upsert_lead(
                agent["id"], conv["id"], fields,
                skip_charge=on_trial,
            )
            if not was_already_hot and fields.get("intent") == "hot":
                hot_lead_new = True

    except Exception as exc:  # noqa: BLE001
        log.warning("Lead extraction skipped: %s", exc)

    return {
        "reply":           reply,
        "conversation_id": conv["id"],
        "model_used":      used,
        "lead":            lead_summary,
        "hot_lead":        hot_lead_new,
        "on_trial":        on_trial,
        "image_supported": agent.get("plan") in IMAGE_PLANS,
    }