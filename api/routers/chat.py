"""Public chat endpoint — the widget / hosted page talks to the agent here."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from schemas import ChatRequest
from services import chat as chat_service
from services import leads as leads_service
from services import repo

log = logging.getLogger("easybuilda.chat")
router = APIRouter(prefix="/api", tags=["chat"])


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
        raise HTTPException(404, "Agent not found or inactive.")

    conv = repo.get_or_create_conversation(
        agent_id=agent["id"],
        conversation_id=req.conversation_id,
        visitor_id=req.visitor_id,
        page_url=req.page_url,
    )

    history = repo.get_history(conv["id"])
    repo.insert_message(conv["id"], "user", req.message)

    reply, used = await chat_service.run_chat_turn(agent, history, req.message)
    repo.insert_message(conv["id"], "assistant", reply)

    lead_summary = None
    try:
        full = history + [
            {"role": "user", "content": req.message},
            {"role": "assistant", "content": reply},
        ]
        extracted = await leads_service.extract_lead(full, agent.get("plan"))
        if extracted.get("is_lead"):
            fields = {k: v for k, v in extracted.items() if k != "is_lead"}
            if req.page_url:
                fields["source_page"] = req.page_url
            lead_summary = repo.upsert_lead(agent["id"], conv["id"], fields)
    except Exception as exc:  # noqa: BLE001
        log.warning("Lead extraction skipped: %s", exc)

    return {"reply": reply, "conversation_id": conv["id"], "model_used": used, "lead": lead_summary}