"""
Lead intelligence — read a FULL conversation and decide whether the
visitor has shared real contact info. There is no cold/warm/hot
classification anymore: a "lead" exists if and only if the visitor
provided a real email or phone number somewhere in the conversation.
Casual visitors who never share contact info are never recorded —
there is nothing useful to store for them.
"""
from __future__ import annotations

from services import llm

# Lead extraction is a cheap, simple JSON-extraction task — always use a
# small/cheap model here regardless of the agent's plan, so this never eats
# into margins. This is intentionally hardcoded, not settings.openrouter_fast_model,
# so the model used for billing-relevant classification can't drift silently.
LEAD_EXTRACTION_MODEL = "anthropic/claude-haiku-4.5"

_KEYS = (
    '- "has_contact": true ONLY if the visitor explicitly shared a real, usable '
    'email address or phone number anywhere in the conversation. False otherwise — '
    'never guess, infer, or invent contact details that were not actually typed by the visitor.\n'
    '- "name": the visitor\'s name if they gave one, or null.\n'
    '- "email": their email exactly as written, or null.\n'
    '- "phone": their phone number exactly as written, or null.\n'
    '- "interest": a short phrase on the product/service they care about, or null.\n'
    '- "summary": 1-2 sentences on what they need or want, or null.\n'
)


def _transcript(messages) -> str:
    lines = []
    for m in messages:
        who = "Visitor" if m.get("role") == "user" else "Agent"
        lines.append(f"{who}: {m.get('content', '')}")
    return "\n".join(lines)


async def extract_lead(messages) -> dict:
    """
    Read the FULL conversation so far (every turn, not just the latest
    one) and extract contact info if the visitor has shared it at any
    point. Re-running this on the whole transcript each turn is what
    lets a visitor who shares contact info on message 5 still be
    captured correctly, instead of only checking the newest message.
    """
    system = (
        "You read a website chat between a Visitor and an AI Agent and check whether "
        "the visitor has shared real, usable contact information (an email address or "
        "a phone number) at ANY point in the conversation so far. Reply with ONE valid "
        "JSON object and nothing else. Use null for anything not clearly stated. "
        "Never guess or invent contact details — only report what the visitor actually typed."
    )
    user = "Full conversation so far:\n" + _transcript(messages) + "\n\nReturn ONLY a JSON object with these keys:\n" + _KEYS
    data = await llm.chat_json(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        model=LEAD_EXTRACTION_MODEL,
        max_tokens=400,
        temperature=0.1,
    )

    def clean(v):
        if v is None:
            return None
        s = str(v).strip()
        return s or None

    email = clean(data.get("email"))
    phone = clean(data.get("phone"))
    has_contact = bool(data.get("has_contact")) and bool(email or phone)

    return {
        "is_lead":  has_contact,
        "name":     clean(data.get("name")),
        "email":    email,
        "phone":    phone,
        "interest": clean(data.get("interest")),
        "summary":  clean(data.get("summary")),
    }