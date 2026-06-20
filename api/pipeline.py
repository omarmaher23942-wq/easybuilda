"""
EasyBuilda — Agent Pipeline (6 cooperative AI agents)
Streams progress via Server-Sent Events (SSE)

Flow:
  Agent 1 (Interviewer)   ←→ User  (conversational, up to 30 messages)
  Agent 2 (Validator)          ← checks if data is sufficient, asks follow-ups
  Agent 3 (Planner)            ← distributes tasks
  Agent 4 (Analyzer)           ← writes final description + code plan
  Agent 5 (Code Writer)        ← writes all files
  Agent 6 (Reviewer) ↔ Agent 5 ← review/fix loop until approved
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import AsyncGenerator

import httpx

log = logging.getLogger("easybuilda.pipeline")

# ── OpenRouter helpers ──────────────────────────────────────────────────────

OR_URL = "https://openrouter.ai/api/v1/chat/completions"
SMART  = "anthropic/claude-sonnet-4-6"
FAST   = "anthropic/claude-haiku-4.5"
CHEAP  = "openrouter/auto"


async def _llm(messages: list[dict], *, model=FAST, max_tokens=1500, temperature=0.7, api_key: str) -> str:
    """
    Call OpenRouter. Returns the assistant text, or "" on any HTTP/network error.
    Never raises — a transient provider hiccup must not kill the SSE build stream.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://easybuilda.com",
        "X-Title": "EasyBuilda",
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(OR_URL, headers=headers, json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            })
            if r.status_code != 200:
                log.warning("LLM HTTP %s (model=%s): %s", r.status_code, model, r.text[:300])
                return ""
            return r.json()["choices"][0]["message"]["content"] or ""
    except Exception as e:
        log.warning("LLM call failed (model=%s): %s", model, e)
        return ""


async def _llm_json(messages: list[dict], *, model=FAST, max_tokens=1500, temperature=0.4, api_key: str) -> dict:
    """
    Call _llm and parse the result as JSON. If parsing fails, retry once with an
    explicit "JSON only" nudge and a larger token budget (oversized outputs on some
    providers get truncated mid-JSON). Returns {} only if both attempts fail.
    """
    raw = await _llm(messages, model=model, max_tokens=max_tokens, temperature=temperature, api_key=api_key)
    parsed = _loads(raw)
    if parsed:
        return parsed

    log.warning(
        "JSON parse failed (model=%s, len=%d). Retrying. head=%r tail=%r",
        model, len(raw or ""), (raw or "")[:120], (raw or "")[-120:],
    )

    retry_messages = list(messages)
    if retry_messages and retry_messages[-1].get("role") == "user":
        retry_messages[-1] = {
            "role": "user",
            "content": retry_messages[-1]["content"]
            + "\n\nReturn ONLY valid minified JSON. No markdown, no code fences, no prose.",
        }
    raw2 = await _llm(
        retry_messages,
        model=model,
        max_tokens=max(max_tokens, 4000),
        temperature=0.2,
        api_key=api_key,
    )
    parsed2 = _loads(raw2)
    if not parsed2:
        log.warning("JSON retry also failed (model=%s, len=%d).", model, len(raw2 or ""))
    return parsed2


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _loads(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text).rstrip("`").strip()
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e > s:
        text = text[s:e+1]
    try:
        return json.loads(text)
    except Exception:
        return {}


# ── Agent System Prompts ─────────────────────────────────────────────────────

INTERVIEWER_SYSTEM = """You are the first contact for EasyBuilda — a platform that builds AI customer agents for businesses.

Your job: have a warm, professional conversation to collect everything needed to build a world-class AI agent for this business.

You need to gather (in natural conversation order):
1. Business name & what it does
2. Target customers (who, where, demographics)  
3. Products/services in detail (names, prices, options, availability)
4. Business hours & location/service area
5. Unique selling points & what sets them apart
6. Common customer questions they get
7. Tone & personality (formal/friendly/luxury/energetic)
8. Contact process (how do customers book/order/reach them)
9. Any policies (returns, cancellations, guarantees)
10. Website URL (optional)

Rules:
- ONE focused question at a time
- Acknowledge what they said before asking next
- If answer is vague, gently ask for specifics
- Be warm and professional
- Max 30 exchanges total
- When you have enough for ALL 10 areas, reply ONLY with:
  COLLECTION_DONE
  (nothing else)

Start with a warm greeting and ask the first question."""

VALIDATOR_SYSTEM = """You are a Data Quality Validator for AI agent building.

You receive business information collected from an owner and you must decide:
1. Is this data sufficient to build a high-quality AI customer agent?
2. What critical information is missing?

A good AI agent needs: business description, services/prices, target customers, tone, hours, contact process, and at least 5 common Q&As.

You reply ONLY with valid JSON:
{
  "sufficient": true/false,
  "missing": ["list of what's missing"],
  "next_question": "if not sufficient: the MOST IMPORTANT single question to ask next, phrased naturally for the customer. null if sufficient."
}

Be strict. If prices are missing for a service business, that's critical. If hours are missing, that's critical."""

PLANNER_SYSTEM = """You are the Build Planner for EasyBuilda. You receive collected business data and produce a structured build plan.

Reply ONLY with valid JSON:
{
  "agent_name": "A natural first name for the AI agent (e.g. Aria, Nova, Max)",
  "tagline": "6 words max describing the agent",
  "tone": "professional|friendly|energetic|luxury|casual",
  "primary_color": "#hexcode that fits the brand",
  "welcome_message": "Warm opening message the agent will use",
  "business_summary": "2-3 sentence summary of the business for the agent",
  "knowledge_sections": {
    "services": "Structured list of services/products with details and prices",
    "hours": "Business hours and availability",
    "location": "Location/service area information",
    "policies": "Return/cancellation/guarantee policies",
    "contact": "How customers can reach or book",
    "faq": "10-15 likely Q&A pairs formatted as Q: ... A: ..."
  },
  "suggested_questions": ["5 example questions visitors might ask"],
  "lead_capture_trigger": "Description of when/how to capture lead info"
}"""

ANALYZER_SYSTEM = """You are a Senior AI Agent Architect. You receive a build plan and produce the final agent specification.

Your job: think deeply about this business, anticipate edge cases, and write a comprehensive system prompt that will make this agent exceptional.

Reply ONLY with valid JSON:
{
  "system_prompt": "A detailed, comprehensive system prompt for the AI agent (400-800 words). Include: identity, scope, knowledge base, conversation style, how to handle common questions, when/how to capture leads naturally, what to do when uncertain, how to handle complaints, upselling opportunities. Make it specific to this exact business.",
  "knowledge_base": "Full organized knowledge base in Markdown. Include all services, prices, policies, hours, FAQ, contact info.",
  "faq": [{"q": "question", "a": "answer"}],
  "readiness_score": 0-100,
  "readiness_notes": "Brief strengths and gaps"
}"""


# ── Main Pipeline ─────────────────────────────────────────────────────────────

async def run_pipeline(
    conversation: list[dict],
    *,
    api_key: str,
    plan: str = "trial",
) -> AsyncGenerator[str, None]:
    """
    Yields SSE strings. conversation = list of {role, content} from the interview.
    """

    # ── PHASE 1: Validate data ──────────────────────────────────────────────
    yield _sse("phase", {"phase": "validating", "label": "Analyzing your information…", "pct": 10})

    conversation_text = "\n".join(
        f"{'Business Owner' if m['role'] == 'user' else 'Agent'}: {m['content']}"
        for m in conversation
    )

    val = await _llm_json(
        [
            {"role": "system", "content": VALIDATOR_SYSTEM},
            {"role": "user", "content": f"Business information collected:\n\n{conversation_text}"},
        ],
        model=FAST,
        max_tokens=600,
        temperature=0.2,
        api_key=api_key,
    )

    # If the validator itself errored/couldn't be parsed, don't dead-end the build —
    # assume we have enough and proceed. Only ask for more when it explicitly says so.
    if val and not val.get("sufficient"):
        # Not enough data — tell caller to ask more
        yield _sse("need_more", {
            "question": val.get("next_question", "Could you tell me more about your services and pricing?"),
            "missing": val.get("missing", []),
        })
        return

    yield _sse("phase", {"phase": "planning", "label": "Planning your agent…", "pct": 25})

    # ── PHASE 2: Plan ──────────────────────────────────────────────────────
    build_plan = await _llm_json(
        [
            {"role": "system", "content": PLANNER_SYSTEM},
            {"role": "user", "content": f"Build a plan for this business based on:\n\n{conversation_text}"},
        ],
        model=FAST,
        max_tokens=3500,
        temperature=0.4,
        api_key=api_key,
    )
    if not build_plan:
        # Don't dead-end the build — synthesize a usable plan from the conversation.
        log.warning("Planner returned no JSON; using fallback plan.")
        build_plan = {
            "agent_name": "Aria",
            "tagline": "Your AI assistant",
            "tone": "friendly",
            "primary_color": "#7c3aed",
            "welcome_message": "Hi! How can I help you today?",
            "business_summary": conversation_text[:600],
            "knowledge_sections": {
                "services": conversation_text,
                "hours": "",
                "location": "",
                "policies": "",
                "contact": "",
                "faq": "",
            },
            "suggested_questions": [],
            "lead_capture_trigger": "When the visitor shows buying intent or asks to be contacted.",
        }

    yield _sse("phase", {"phase": "analyzing", "label": "Crafting agent personality…", "pct": 45})

    # ── PHASE 3: Analyze + write system prompt ─────────────────────────────
    use_smart = plan in ("pro", "max", "singularity", "trial")
    model_for_build = SMART if use_smart else FAST

    analysis = await _llm_json(
        [
            {"role": "system", "content": ANALYZER_SYSTEM},
            {"role": "user", "content": (
                f"Build plan:\n{json.dumps(build_plan, ensure_ascii=False)}\n\n"
                f"Original conversation:\n{conversation_text}"
            )},
        ],
        model=model_for_build,
        max_tokens=6000,
        temperature=0.3,
        api_key=api_key,
    )
    if not analysis:
        # Synthesize a basic spec from the plan rather than failing the build.
        log.warning("Analyzer returned no JSON; using fallback analysis from plan.")
        ks = build_plan.get("knowledge_sections", {}) or {}
        kb_parts = [f"## {k.title()}\n{v}" for k, v in ks.items() if v]
        analysis = {
            "system_prompt": (
                f"You are {build_plan.get('agent_name', 'Aria')}, the AI assistant for "
                f"{_extract_business_name(conversation)}. "
                f"{build_plan.get('business_summary', '')}\n\n"
                f"Be {build_plan.get('tone', 'friendly')} and helpful. Answer customer questions "
                f"using the knowledge below, capture leads when visitors show buying intent, and be "
                f"honest when you don't know something.\n\nKnowledge:\n" + "\n\n".join(kb_parts)
            ),
            "knowledge_base": "\n\n".join(kb_parts),
            "faq": [],
            "readiness_score": 70,
            "readiness_notes": "Built with fallback analysis.",
        }

    yield _sse("phase", {"phase": "building", "label": "Building your agent…", "pct": 70})

    # ── PHASE 4: Review loop (simplified — 1 review pass) ─────────────────
    review_prompt = f"""Review this AI agent system prompt for quality. Is it:
1. Specific to the business (not generic)?
2. Complete (covers all key topics)?
3. Natural in tone?
4. Clear about lead capture?

System prompt to review:
{analysis.get('system_prompt', '')}

Reply with JSON: {{"approved": true/false, "improvements": "what to fix if not approved"}}"""

    review = await _llm_json(
        [
            {"role": "system", "content": "You are a strict AI agent quality reviewer. Reply only with JSON."},
            {"role": "user", "content": review_prompt},
        ],
        model=FAST,
        max_tokens=400,
        temperature=0.2,
        api_key=api_key,
    )

    # If not approved, do one improvement pass
    if not review.get("approved") and review.get("improvements"):
        yield _sse("phase", {"phase": "refining", "label": "Refining agent quality…", "pct": 82})
        improved = await _llm_json(
            [
                {"role": "system", "content": ANALYZER_SYSTEM},
                {"role": "user", "content": (
                    f"Improve this system prompt based on feedback.\n\n"
                    f"Current prompt:\n{analysis.get('system_prompt', '')}\n\n"
                    f"Feedback:\n{review.get('improvements', '')}\n\n"
                    f"Build plan:\n{json.dumps(build_plan, ensure_ascii=False)}\n\n"
                    "Reply with the same JSON format."
                )},
            ],
            model=model_for_build,
            max_tokens=6000,
            temperature=0.3,
            api_key=api_key,
        )
        if improved.get("system_prompt"):
            analysis["system_prompt"] = improved["system_prompt"]
        if improved.get("knowledge_base"):
            analysis["knowledge_base"] = improved["knowledge_base"]

    yield _sse("phase", {"phase": "finalizing", "label": "Almost ready…", "pct": 92})

    # ── Build final agent payload ──────────────────────────────────────────
    import secrets

    def gen_pin():
        return str(secrets.randbelow(900000) + 100000)

    # Merge plan + analysis
    agent_payload = {
        "name": build_plan.get("agent_name", "Aria"),
        "business_name": _extract_business_name(conversation),
        "business_description": build_plan.get("business_summary", ""),
        "tone": build_plan.get("tone", "friendly"),
        "persona": analysis.get("system_prompt", ""),
        "knowledge": analysis.get("knowledge_base", ""),
        "faq": analysis.get("faq", build_plan.get("knowledge_sections", {}).get("faq", [])),
        "welcome_message": build_plan.get("welcome_message", "Hi! How can I help you today?"),
        "tagline": build_plan.get("tagline", "AI Assistant"),
        "suggested_questions": build_plan.get("suggested_questions", []),
        "primary_color": build_plan.get("primary_color", "#7c3aed"),
        "readiness_score": analysis.get("readiness_score", 75),
        "readiness_notes": analysis.get("readiness_notes", ""),
        "leads_pin": gen_pin(),
        # Editable fields for dashboard
        "editable_fields": {
            "agent_name": build_plan.get("agent_name", "Aria"),
            "tagline": build_plan.get("tagline", ""),
            "welcome_message": build_plan.get("welcome_message", ""),
            "tone": build_plan.get("tone", "friendly"),
            "primary_color": build_plan.get("primary_color", "#7c3aed"),
            "services": build_plan.get("knowledge_sections", {}).get("services", ""),
            "hours": build_plan.get("knowledge_sections", {}).get("hours", ""),
            "location": build_plan.get("knowledge_sections", {}).get("location", ""),
            "policies": build_plan.get("knowledge_sections", {}).get("policies", ""),
            "contact": build_plan.get("knowledge_sections", {}).get("contact", ""),
        },
    }

    yield _sse("complete", {"agent": agent_payload})


def _extract_business_name(conversation: list[dict]) -> str:
    """Try to extract business name from first few messages."""
    for msg in conversation[:6]:
        if msg.get("role") == "user":
            text = msg.get("content", "")
            # Simple heuristic — first capitalized phrase
            match = re.search(r'\b([A-Z][a-zA-Z\s&\'-]{2,30})\b', text)
            if match:
                return match.group(1).strip()
    return "Your Business"