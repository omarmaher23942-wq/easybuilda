"""
EasyBuilda — Agent Pipeline v3
2 agents: Builder (fast) + Reviewer (smart)
Optimized for speed — haiku builds, sonnet reviews.
"""
from __future__ import annotations

import json
import logging
import re
import secrets
from typing import AsyncGenerator

import httpx

log = logging.getLogger("easybuilda.pipeline")

OR_URL = "https://openrouter.ai/api/v1/chat/completions"
SMART  = "anthropic/claude-sonnet-4-6"
FAST   = "anthropic/claude-haiku-4.5"


async def _llm(messages, *, model=FAST, max_tokens=3000, api_key: str) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://easybuilda.com",
        "X-Title":       "EasyBuilda",
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(OR_URL, headers=headers, json={
                "model":       model,
                "messages":    messages,
                "max_tokens":  max_tokens,
                "temperature": 0.3,
            })
            if r.status_code != 200:
                log.error("LLM HTTP %s (%s): %s", r.status_code, model, r.text[:300])
                return ""
            return r.json()["choices"][0]["message"]["content"] or ""
    except Exception as e:
        log.error("LLM call failed (%s): %s", model, e)
        return ""


def _parse_json(text: str) -> dict | None:
    if not text:
        return None
    try:
        clean = re.sub(r"```(?:json)?|```", "", text).strip()
        m = re.search(r"\{.*\}", clean, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception as e:
        log.warning("JSON parse error: %s | text: %s", e, text[:150])
    return None


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:28].strip("-") or "agent"


# ── Agent 1: Builder system prompt ────────────────────────────────
BUILDER_PROMPT = """You build AI customer agents for businesses. Given business info, return ONLY this exact JSON with NO other text:

{
  "agent_name": "Name of AI agent",
  "tagline": "One-line tagline for the agent",
  "welcome_message": "Warm opening message (2-3 sentences, specific to business)",
  "tone": "friendly",
  "primary_color": "#7c3aed",
  "business_summary": "2-3 sentences about the business",
  "system_prompt": "You are [agent_name], the AI assistant for [business]. [Full system prompt 250-400 words: who you are, what the business does, services, pricing, hours, location, how to book/contact, how to handle questions you can't answer]",
  "knowledge_base": "Complete business knowledge (400-600 words): all services with details, pricing, team, location, booking process, policies, FAQs",
  "faq": [
    {"q": "Most common question?", "a": "Clear answer."},
    {"q": "Second question?", "a": "Clear answer."},
    {"q": "Third question?", "a": "Clear answer."},
    {"q": "Fourth question?", "a": "Clear answer."},
    {"q": "Fifth question?", "a": "Clear answer."}
  ],
  "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"],
  "readiness_score": 85,
  "readiness_notes": "One sentence on what would improve quality"
}

IMPORTANT: Return ONLY the JSON object. No markdown. No explanation. Start with { end with }"""


# ── Agent 2: Reviewer system prompt ──────────────────────────────
REVIEWER_PROMPT = """You review and improve AI agent builds. Check quality and fix any issues.

Quality checklist:
- system_prompt must be 200+ words and mention the business name, services, and how to contact
- knowledge_base must be 300+ words
- faq must have exactly 5 items
- welcome_message must be warm and specific
- tone, primary_color, tagline must be set

If quality is good → set "approved": true
If issues found → fix them and set "approved": false with "fixes" listing what you changed

Return ONLY this JSON (no markdown, no explanation):
{
  "approved": true,
  "fixes": "none" or "list of fixes made",
  "agent": { ...complete improved agent object... }
}"""


async def run_pipeline(
    answers: dict,
    *,
    api_key: str,
    plan: str = "trial",
) -> AsyncGenerator[str, None]:
    """2-agent pipeline: Builder (fast) → Reviewer (smart). Takes answers dict."""

    answers_text = "\n".join(
        f"{k.replace('_', ' ').title()}: {v}"
        for k, v in answers.items() if v and k != "conversation"
    )
    if not answers_text.strip():
        answers_text = next(iter(answers.values()), "No information provided")

    business_name = (
        answers.get("business_name") or
        answers.get("Business Name") or
        "the business"
    )

    # ── Phase 1: Build ────────────────────────────────────────────
    yield _sse("phase", {"phase": "building", "label": "Building your agent…", "pct": 15})
    log.info("Pipeline: building agent for '%s'", business_name)

    build_raw = await _llm(
        [
            {"role": "system", "content": BUILDER_PROMPT},
            {"role": "user",   "content": f"Build an AI agent for this business:\n\n{answers_text}"},
        ],
        model=FAST,       # haiku — fast
        max_tokens=2500,
        api_key=api_key,
    )

    agent = _parse_json(build_raw)
    if not agent:
        log.error("Builder failed. Raw: %s", build_raw[:300])
        yield _sse("error", {"message": "Build failed — please try again."})
        return

    log.info("Builder done. agent_name=%s", agent.get("agent_name", "?"))
    yield _sse("phase", {"phase": "reviewing", "label": "Reviewing quality…", "pct": 60})

    # ── Phase 2: Review ───────────────────────────────────────────
    review_raw = await _llm(
        [
            {"role": "system", "content": REVIEWER_PROMPT},
            {"role": "user",   "content": f"Business info:\n{answers_text}\n\nAgent to review:\n{json.dumps(agent, ensure_ascii=False)}"},
        ],
        model=SMART,      # sonnet — quality check
        max_tokens=3000,
        api_key=api_key,
    )

    review = _parse_json(review_raw)
    if review and review.get("agent"):
        final = review["agent"]
        log.info("Reviewer: approved=%s fixes=%s", review.get("approved"), review.get("fixes", "")[:60])
    else:
        final = agent
        log.info("Reviewer failed — using builder output")

    yield _sse("phase", {"phase": "finalizing", "label": "Finalizing…", "pct": 90})

    # Ensure all required fields
    final.setdefault("agent_name",         f"{business_name} Assistant")
    final.setdefault("tagline",            "Your 24/7 AI assistant")
    final.setdefault("welcome_message",    f"Hi! I'm the AI assistant for {business_name}. How can I help you today?")
    final.setdefault("tone",               "friendly")
    final.setdefault("primary_color",      "#7c3aed")
    final.setdefault("business_summary",   answers_text[:400])
    final.setdefault("system_prompt",      f"You are the AI assistant for {business_name}. {answers_text[:500]}")
    final.setdefault("knowledge_base",     answers_text)
    final.setdefault("faq",                [])
    final.setdefault("suggested_questions",["What services do you offer?", "How can I book?", "What are your hours?"])
    final.setdefault("readiness_score",    80)
    final.setdefault("readiness_notes",    "")
    final["editable_fields"] = {
        "agent_name":      final.get("agent_name", ""),
        "tagline":         final.get("tagline", ""),
        "welcome_message": final.get("welcome_message", ""),
        "tone":            final.get("tone", "friendly"),
        "primary_color":   final.get("primary_color", "#7c3aed"),
        "services":        answers.get("services", ""),
        "hours":           answers.get("hours", ""),
        "location":        answers.get("location", ""),
        "policies":        answers.get("policies", ""),
        "contact":         answers.get("contact", ""),
    }
    final["leads_pin"] = str(secrets.randbelow(900000) + 100000)

    log.info("Pipeline complete: '%s' → @%s", business_name, final.get("agent_name"))
    yield _sse("complete", {"agent": final})
