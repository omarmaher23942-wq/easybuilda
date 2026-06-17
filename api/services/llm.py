"""OpenRouter client — chat + JSON helpers with automatic fallback to openrouter/auto."""
from __future__ import annotations

import json
import logging

import httpx

from config import settings

log = logging.getLogger("easybuilda.llm")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _key(api_key: str | None) -> str:
    return api_key or settings.openrouter_trial_key


async def _post(model, messages, api_key, temperature, max_tokens, response_format=None) -> str:
    headers = {
        "Authorization": f"Bearer {_key(api_key)}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://easybuilda.com",
        "X-Title": "EasyBuilda",
    }
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if response_format:
        payload["response_format"] = response_format
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"] or ""


async def chat(messages, *, model=None, api_key=None, temperature=0.6, max_tokens=900):
    """Return (reply, model_used). Falls back to openrouter/auto on any error."""
    primary = model or settings.openrouter_model
    try:
        return (await _post(primary, messages, api_key, temperature, max_tokens), primary)
    except Exception as exc:  # noqa: BLE001
        log.warning("Model '%s' failed (%s) — falling back to '%s'.", primary, exc, settings.openrouter_fallback_model)
        content = await _post(settings.openrouter_fallback_model, messages, api_key, temperature, max_tokens)
        return (content, settings.openrouter_fallback_model)


async def chat_json(messages, *, model=None, api_key=None, temperature=0.2, max_tokens=900) -> dict:
    """Ask the model for JSON and parse it robustly. Returns {} on failure."""
    primary = model or settings.openrouter_model
    raw = ""
    try:
        raw = await _post(primary, messages, api_key, temperature, max_tokens, {"type": "json_object"})
    except Exception:  # noqa: BLE001
        try:
            raw = await _post(primary, messages, api_key, temperature, max_tokens)
        except Exception as exc:  # noqa: BLE001
            log.warning("JSON model '%s' failed (%s) — falling back.", primary, exc)
            try:
                raw = await _post(settings.openrouter_fallback_model, messages, api_key, temperature, max_tokens)
            except Exception as exc2:  # noqa: BLE001
                log.error("JSON fallback also failed: %s", exc2)
                return {}
    return _loads(raw)


def _loads(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text[:4].lower() == "json":
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    try:
        out = json.loads(text)
        return out if isinstance(out, dict) else {}
    except Exception:  # noqa: BLE001
        return {}