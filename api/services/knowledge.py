"""Knowledge analyst — organise raw business material into a clean, grounded knowledge base."""
from __future__ import annotations

from config import settings
from services import llm

_SYSTEM = (
    "You are a meticulous business analyst. You turn messy raw material about a business into a "
    "clean, well-organised knowledge base that an AI customer agent can rely on. "
    "You never invent facts; you only organise what is given. Reply in Markdown."
)


async def build_knowledge_base(*, business_name, business_description, services, site_text) -> str:
    raw: list[str] = []
    if business_description:
        raw.append(f"Owner description:\n{business_description}")
    if services:
        raw.append(f"Services / products / details:\n{services}")
    if site_text:
        raw.append(f"Website content:\n{site_text}")
    raw_corpus = "\n\n---\n\n".join(raw) if raw else "(no material provided)"

    user = (
        f"Business name: {business_name}\n\n"
        "Raw material:\n"
        f"{raw_corpus}\n\n"
        "Produce a clean knowledge base in Markdown, using only the sections that apply: "
        "Overview, Services & Pricing, How it works, Policies, Hours, Location & Service area, "
        "Contact, and Key facts. Keep prices and specifics exactly as given. Be concise and factual. "
        "If something is unknown, omit it (never guess)."
    )
    kb, _ = await llm.chat(
        [{"role": "system", "content": _SYSTEM}, {"role": "user", "content": user}],
        model=settings.openrouter_model,
        temperature=0.2,
        max_tokens=1600,
    )
    return kb.strip()