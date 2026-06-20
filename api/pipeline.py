"""
EasyBuilda — Agent Pipeline v2
2 focused AI agents: Builder + Reviewer
Fast, reliable, high quality.
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


# ── LLM helpers ────────────────────────────────────────────────────

async def _llm(messages: list[dict], *, model=SMART, max_tokens=4000, api_key: str) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://easybuilda.com",
        "X-Title":       "EasyBuilda",
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(OR_URL, headers=headers, json={
                "model":       model,
                "messages":    messages,
                "max_tokens":  max_tokens,
                "temperature": 0.4,
            })
            if r.status_code != 200:
                log.warning("LLM %s: %s", r.status_code, r.text[:300])
                return ""
            return r.json()["choices"][0]["message"]["content"] or ""
    except Exception as e:
        log.warning("LLM error: %s", e)
        return ""


async def _llm_json(messages: list[dict], *, model=SMART, max_tokens=4000, api_key: str) -> dict | None:
    raw = await _llm(messages, model=model, max_tokens=max_tokens, api_key=api_key)
    if not raw:
        return None
    try:
        clean = re.sub(r"```(?:json)?|```", "", raw).strip()
        # Find first { ... }
        m = re.search(r"\{.*\}", clean, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception as e:
        log.warning("JSON parse error: %s | raw: %s", e, raw[:200])
    return None


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# ── Agent 1: Builder ───────────────────────────────────────────────
BUILDER_SYSTEM = """You are an expert AI agent builder for EasyBuilda.

Given business information, build a complete, high-quality AI customer agent.

You MUST return ONLY valid JSON — no markdown, no explanation, no preamble.

JSON structure:
{
  "agent_name": "Name of the AI agent (friendly, professional)",
  "tagline": "One-line description (e.g. 'Your 24/7 real estate assistant')",
  "welcome_message": "First message customers see (warm, specific to the business)",
  "tone": "friendly|professional|luxury|energetic|casual",
  "primary_color": "#hex color matching the industry/brand",
  "business_summary": "2-3 sentence description of the business",
  "system_prompt": "Complete system prompt for the AI agent (300-500 words). Must include: who the agent is, what the business does, what services/products are offered, pricing if available, hours, location, how to book/contact, tone guidelines, and what to do when unsure",
  "knowledge_base": "Detailed business knowledge the agent needs (500-800 words). Include: all services with descriptions, pricing, FAQs, policies, team info, location details, booking process",
  "faq": [
    {"q": "Question?", "a": "Answer."},
    {"q": "Question?", "a": "Answer."},
    {"q": "Question?", "a": "Answer."},
    {"q": "Question?", "a": "Answer."},
    {"q": "Question?", "a": "Answer."}
  ],
  "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"],
  "readiness_score": 85,
  "readiness_notes": "Brief note on what would improve the agent"
}"""


# ── Agent 2: Reviewer ─────────────────────────────────────────────
REVIEWER_SYSTEM = """You are a senior AI agent quality reviewer for EasyBuilda.

Your job: review an AI agent build and either APPROVE it or provide SPECIFIC fixes.

Rules:
- If the agent is good quality (system_prompt > 200 words, knowledge_base > 300 words, 5 FAQs), APPROVE it.
- If there are issues, fix them and return the improved version.
- ALWAYS return the complete JSON — never partial.
- Return ONLY valid JSON, no markdown.

Return:
{
  "approved": true/false,
  "reason": "why approved or what was fixed",
  "agent": { ...complete agent JSON same structure as input... }
}"""


# ── Pipeline ───────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:32].strip("-") or "agent"


async def run_pipeline(
    answers: dict,
    *,
    api_key: str,
    plan: str = "trial",
) -> AsyncGenerator[str, None]:
    """
    Takes answers dict, yields SSE strings.
    2-agent pipeline: Builder → Reviewer → Done.
    """

    # Format answers for the agents
    answers_text = "\n".join(
        f"{k.replace('_', ' ').title()}: {v}"
        for k, v in answers.items() if v
    )

    # ── PHASE 1: Builder ──────────────────────────────────────────
    yield _sse("phase", {"phase": "building", "label": "Building your AI agent…", "pct": 20})

    build_result = await _llm_json(
        [
            {"role": "system", "content": BUILDER_SYSTEM},
            {"role": "user",   "content": f"Business information:\n{answers_text}\n\nBuild the complete AI agent now."},
        ],
        model=SMART,
        max_tokens=4000,
        api_key=api_key,
    )

    if not build_result:
        log.error("Builder returned no result")
        yield _sse("error", {"message": "Build failed — please try again."})
        return

    yield _sse("phase", {"phase": "reviewing", "label": "Reviewing and improving quality…", "pct": 60})

    # ── PHASE 2: Reviewer ─────────────────────────────────────────
    review_result = await _llm_json(
        [
            {"role": "system", "content": REVIEWER_SYSTEM},
            {"role": "user",   "content": f"Business info:\n{answers_text}\n\nAgent to review:\n{json.dumps(build_result, ensure_ascii=False, indent=2)}"},
        ],
        model=SMART,
        max_tokens=4000,
        api_key=api_key,
    )

    # Use reviewed version if available, else use builder output
    if review_result and review_result.get("agent"):
        final_agent = review_result["agent"]
        log.info("Pipeline: reviewer %s — %s",
                 "approved" if review_result.get("approved") else "improved",
                 review_result.get("reason", "")[:80])
    else:
        final_agent = build_result
        log.info("Pipeline: using builder output directly (reviewer failed)")

    yield _sse("phase", {"phase": "finalizing", "label": "Finalizing…", "pct": 90})

    # Ensure required fields
    final_agent.setdefault("agent_name",        answers.get("agent_name") or answers.get("business_name", "Aria") + " AI")
    final_agent.setdefault("tagline",           "Your AI assistant")
    final_agent.setdefault("welcome_message",   "Hi! How can I help you today?")
    final_agent.setdefault("tone",              "friendly")
    final_agent.setdefault("primary_color",     "#7c3aed")
    final_agent.setdefault("business_summary",  answers_text[:400])
    final_agent.setdefault("system_prompt",     f"You are an AI assistant for {answers.get('business_name', 'this business')}. {answers_text[:600]}")
    final_agent.setdefault("knowledge_base",    answers_text)
    final_agent.setdefault("faq",               [])
    final_agent.setdefault("suggested_questions", ["What services do you offer?", "How can I book?", "What are your hours?"])
    final_agent.setdefault("readiness_score",   80)
    final_agent.setdefault("readiness_notes",   "")
    final_agent["editable_fields"] = {
        "agent_name":     final_agent.get("agent_name", ""),
        "tagline":        final_agent.get("tagline", ""),
        "welcome_message":final_agent.get("welcome_message", ""),
        "tone":           final_agent.get("tone", "friendly"),
        "primary_color":  final_agent.get("primary_color", "#7c3aed"),
        "services":       answers.get("services", ""),
        "hours":          answers.get("hours", ""),
        "location":       answers.get("location", ""),
        "policies":       answers.get("policies", ""),
        "contact":        answers.get("contact", ""),
    }

    yield _sse("complete", {"agent": final_agent})
    log.info("Pipeline complete for business: %s", answers.get("business_name", "unknown"))
