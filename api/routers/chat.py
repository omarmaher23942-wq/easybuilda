"""Public chat endpoint — widget talks to agent here.
Wallet billing: deduct cold lead per conversation, hot lead when contact captured.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from schemas import ChatRequest
from services import chat as chat_service
from services import leads as leads_service
from services import repo
from services.billing import charge_cold_lead, charge_hot_lead

log = logging.getLogger("easybuilda.chat")
router = APIRouter(prefix="/api", tags=["chat"])

IMAGE_PLANS = {"pro", "max", "singularity", "admin"}


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.agent_id and not req.username:
        raise HTTPException(400, "Provide agent_id or username.")

    agent = (
        repo.get_agent_by_id(req.agent_id)
        if req.agent_id
        else repo.get_agent_by_username(req.username.lower())
    )
    if not agent or agent.get("status") != "active":
        raise HTTPException(404, "Agent not found or paused.")

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
    is_new_conversation = req.conversation_id != conv["id"]

    history = repo.get_history(conv["id"])
    repo.insert_message(conv["id"], "user", req.message)

    # ── Wallet billing: cold lead on first message ──
    agent_owner_id = agent.get("user_id")
    if is_new_conversation and agent_owner_id:
        try:
            await charge_cold_lead(agent_owner_id, agent["id"], conv["id"])
        except Exception as e:
            log.warning("Cold lead billing failed: %s", e)

    reply, used = await chat_service.run_chat_turn(
        agent, history, req.message,
        image_b64=image_b64, image_mime=image_mime,
    )
    repo.insert_message(conv["id"], "assistant", reply)

    # Lead extraction
    lead_summary  = None
    hot_lead_new  = False
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

            # Check if this is upgrading to hot lead
            existing_lead = repo.get_lead_by_conversation(conv["id"])
            is_new_hot = (
                fields.get("intent") in ("hot", "warm") and
                (not existing_lead or existing_lead.get("intent") not in ("hot", "warm"))
            )

            lead_summary = repo.upsert_lead(agent["id"], conv["id"], fields)

            # ── Wallet billing: hot lead upgrade ──
            if is_new_hot and agent_owner_id:
                try:
                    await charge_hot_lead(agent_owner_id, agent["id"], conv["id"])
                    hot_lead_new = True
                except Exception as e:
                    log.warning("Hot lead billing failed: %s", e)

    except Exception as exc:
        log.warning("Lead extraction skipped: %s", exc)

    return {
        "reply":           reply,
        "conversation_id": conv["id"],
        "model_used":      used,
        "lead":            lead_summary,
        "hot_lead":        hot_lead_new,
        "image_supported": agent.get("plan") in IMAGE_PLANS,
    }