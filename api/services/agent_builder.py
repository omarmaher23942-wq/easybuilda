"""Genesis — a multi-step build that turns a business into a professional, smart agent."""
from __future__ import annotations

import logging
import re

from config import settings
from services import knowledge, llm, scrape

log = logging.getLogger("easybuilda.builder")

_ARCH_SYSTEM = (
    "You are a world-class designer of AI customer agents. From a business knowledge base you "
    "create a complete, professional agent: its identity, brand, an anticipated FAQ, and a "
    "detailed operating system-prompt that makes it genuinely smart, helpful, on-brand, and "
    "great at capturing leads. You always reply with a single valid JSON object and nothing else."
)

_REVIEW_SYSTEM = (
    "You review an AI customer agent's knowledge base for completeness and reply with one JSON "
    "object only."
)


def _arch_user(business_name, kb, tone) -> str:
    return (
        f"Business name: {business_name}\n"
        f"Preferred tone: {tone or 'friendly and professional'}\n\n"
        "Knowledge base:\n"
        f"{kb}\n\n"
        "Return ONLY a JSON object with these keys:\n"
        '- "agent_name": short human first name fitting the brand.\n'
        '- "role_title": e.g. "Booking & Support Assistant".\n'
        '- "tagline": at most 6 words.\n'
        '- "personality": 1-2 sentences describing its character.\n'
        '- "welcome_message": one warm, on-brand opening line.\n'
        '- "suggested_questions": array of exactly 5 short visitor questions.\n'
        '- "primary_color": a hex colour fitting the brand.\n'
        '- "faq": array of 8-12 objects {"q","a"} answered ONLY from the knowledge base (omit unknowns).\n'
        '- "system_prompt": a detailed operating instruction (second person, addressing the agent) '
        "covering: identity & scope, how to greet, how to answer strictly from its knowledge, how to "
        "handle pricing/booking questions, how to qualify interest and naturally capture name + "
        "email/phone, when to offer a human handoff, tone & style, and what to do when it doesn't "
        "know. Make it thorough (8-14 sentences)."
    )


def _slugify(text) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:24] or "agent"


def _hex(c) -> str:
    c = str(c or "#7C3AED").strip()
    return c if re.fullmatch(r"#[0-9A-Fa-f]{6}", c) else "#7C3AED"


async def build_agent_profile(*, business_name, business_description, services, website_url, tone, model, api_key=None) -> dict:
    # 1) Ingest + structure knowledge
    site_text = await scrape.fetch_site_text(website_url) if website_url else ""
    kb = await knowledge.build_knowledge_base(
        business_name=business_name,
        business_description=business_description,
        services=services,
        site_text=site_text,
    )

    # 2) Architect the agent (identity + brand + FAQ + rich system prompt)
    arch = await llm.chat_json(
        [
            {"role": "system", "content": _ARCH_SYSTEM},
            {"role": "user", "content": _arch_user(business_name, kb, tone)},
        ],
        model=model,
        api_key=api_key,
        temperature=0.5,
        max_tokens=2600,
    )

    raw_q = arch.get("suggested_questions")
    questions = [str(q).strip() for q in raw_q if str(q).strip()][:5] if isinstance(raw_q, list) else []

    raw_faq = arch.get("faq")
    faq = (
        [
            {"q": str(i.get("q", "")).strip(), "a": str(i.get("a", "")).strip()}
            for i in raw_faq
            if isinstance(i, dict) and i.get("q") and i.get("a")
        ][:12]
        if isinstance(raw_faq, list)
        else []
    )

    # 3) Readiness review
    review = await llm.chat_json(
        [
            {"role": "system", "content": _REVIEW_SYSTEM},
            {
                "role": "user",
                "content": (
                    "Knowledge base:\n"
                    + kb
                    + "\n\nReturn ONLY JSON: "
                    '{"score": <0-100 integer for how ready this agent is to sell & support>, '
                    '"strengths": [up to 3 short strings], "gaps": [up to 4 short strings of what to add]}'
                ),
            },
        ],
        model=settings.openrouter_fast_model,
        temperature=0.2,
        max_tokens=500,
    )
    try:
        score = max(0, min(100, int(review.get("score"))))
    except Exception:  # noqa: BLE001
        score = 70
    strengths = [str(s).strip() for s in (review.get("strengths") or []) if str(s).strip()][:3]
    gaps = [str(g).strip() for g in (review.get("gaps") or []) if str(g).strip()][:4]
    notes = []
    if strengths:
        notes.append("Strengths: " + "; ".join(strengths))
    if gaps:
        notes.append("To improve: " + "; ".join(gaps))

    return {
        "agent_name": str(arch.get("agent_name") or "Aria").strip()[:40],
        "role_title": str(arch.get("role_title") or "AI Assistant").strip()[:60],
        "tagline": str(arch.get("tagline") or "AI assistant").strip()[:60],
        "personality": str(arch.get("personality") or "").strip()[:300],
        "welcome_message": str(arch.get("welcome_message") or "Hi! How can I help you today?").strip()[:300],
        "suggested_questions": questions
        or ["What services do you offer?", "How much does it cost?", "How do I get started?"],
        "primary_color": _hex(arch.get("primary_color")),
        "system_prompt": str(arch.get("system_prompt") or "").strip(),
        "faq": faq,
        "knowledge_base": kb,
        "readiness_score": score,
        "readiness_notes": " | ".join(notes),
        "slug": _slugify(business_name),
    }