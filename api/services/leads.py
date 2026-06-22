"""Lead intelligence — read a conversation and extract a structured, qualified lead."""
from __future__ import annotations

from config import settings
from services import llm

DEEP_PLANS = {"trial", "pro", "max", "singularity"}

# Lead extraction is a cheap, simple JSON-classification task — always use a
# small/cheap model here regardless of the agent's plan, so this never eats
# into margins. This is intentionally hardcoded, not settings.openrouter_fast_model,
# so the model used for billing-relevant classification can't drift silently.
LEAD_EXTRACTION_MODEL = "anthropic/claude-haiku-4.5"

_BASE_KEYS = (
    '- "is_lead": true only if the visitor showed genuine interest or shared a need/contact.\n'
    '- "name": the visitor name, or null.\n'
    '- "email": their email, or null.\n'
    '- "phone": their phone, or null.\n'
    '- "interest": the product/service they care about, or null.\n'
    '- "intent": one of "hot", "warm", or "cold".\n'
    '- "summary": 1-2 sentences on what they need, or null.\n'
)

_DEEP_KEYS = (
    '- "budget": any budget signal they gave, or null.\n'
    '- "timeline": when they need it (e.g. "this week"), or null.\n'
    '- "location": their location if mentioned, or null.\n'
    '- "suggested_action": the single best next step for the business, or null.\n'
)


def _transcript(messages) -> str:
    lines = []
    for m in messages:
        who = "Visitor" if m.get("role") == "user" else "Agent"
        lines.append(f"{who}: {m.get('content', '')}")
    return "\n".join(lines)


async def extract_lead(messages, plan) -> dict:
    deep = (plan or "trial") in DEEP_PLANS
    keys = _BASE_KEYS + (_DEEP_KEYS if deep else "")
    system = (
        "You analyse a website chat between a Visitor and an AI Agent and extract a structured "
        "sales lead for the business owner. Reply with ONE valid JSON object and nothing else. "
        "Use null for anything not clearly stated. Do not guess contact details. "
        "Only mark intent=\"hot\" when the visitor gave real contact info (email or phone) "
        "AND showed clear buying/booking intent — not just curiosity."
    )
    user = "Conversation:\n" + _transcript(messages) + "\n\nReturn ONLY a JSON object with these keys:\n" + keys
    data = await llm.chat_json(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        model=LEAD_EXTRACTION_MODEL,
        max_tokens=500,
        temperature=0.1,
    )

    def clean(v):
        if v is None:
            return None
        s = str(v).strip()
        return s or None

    intent = clean(data.get("intent"))
    if intent not in {"hot", "warm", "cold"}:
        intent = None

    return {
        "is_lead": bool(data.get("is_lead")),
        "name": clean(data.get("name")),
        "email": clean(data.get("email")),
        "phone": clean(data.get("phone")),
        "interest": clean(data.get("interest")),
        "intent": intent,
        "summary": clean(data.get("summary")),
        "budget": clean(data.get("budget")) if deep else None,
        "timeline": clean(data.get("timeline")) if deep else None,
        "location": clean(data.get("location")) if deep else None,
        "suggested_action": clean(data.get("suggested_action")) if deep else None,
    }