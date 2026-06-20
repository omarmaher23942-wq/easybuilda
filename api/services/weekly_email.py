"""
EasyBuilda — Weekly Growth Email (#60)
Sends personalized weekly digest to all active users with lead stats + tips.
Run: python -m services.weekly_email
Cron: 0 9 * * 1  (every Monday 9am)
"""
from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone, timedelta

import httpx

from config import settings
from db import get_db
from services import repo

log = logging.getLogger("easybuilda.weekly_email")

RESEND_API = "https://api.resend.com/emails"

TIPS = [
    "Add more details to your Knowledge Base — agents with complete info get 3× more hot leads.",
    "Share your agent URL on your WhatsApp status, Instagram bio, and Google Business profile.",
    "Update your business hours and prices — the #1 thing customers ask about.",
    "Add your booking link or phone number so the agent can convert conversations to appointments.",
    "Tell your agent about your most common objections so it can handle them automatically.",
    "Businesses that add policies (refund, cancellation) to their agent see 40% fewer drop-offs.",
]


def _build_html(user_name: str, agents: list[dict], stats: dict) -> str:
    name       = (user_name or "there").split()[0]
    hot        = stats.get("hot_leads", 0)
    cold       = stats.get("cold_leads", 0)
    total      = hot + cold
    agent_name = agents[0]["name"] if agents else "your AI agent"
    tip        = random.choice(TIPS)
    active     = sum(1 for a in agents if a.get("status") == "active")

    performance_html = ""
    if total > 0:
        performance_html = f"""
        <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
          <p style="margin:0 0 16px;font-size:14px;color:#8891a8;">This week, <strong style="color:#edf0f7;">{agent_name}</strong> captured:</p>
          <div style="display:flex;justify-content:center;gap:40px;">
            <div><div style="font-size:40px;font-weight:700;color:#f87171;line-height:1;">{hot}</div><div style="font-size:12px;color:#8891a8;margin-top:6px;">🔥 Hot leads</div></div>
            <div style="width:1px;background:rgba(255,255,255,0.08);"></div>
            <div><div style="font-size:40px;font-weight:700;color:#38bdf8;line-height:1;">{cold}</div><div style="font-size:12px;color:#8891a8;margin-top:6px;">❄️ Cold leads</div></div>
          </div>
        </div>"""
    else:
        performance_html = f"""
        <div style="background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
          <p style="margin:0 0 8px;font-size:15px;color:#edf0f7;">Your agent is live — leads are coming.</p>
          <p style="margin:0;font-size:13px;color:#8891a8;">Share your agent link to start capturing leads today.</p>
        </div>"""

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05070f;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#edf0f7;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#22d3ee);font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;">E</div>
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">Weekly Growth Report</h1>
      <p style="margin:0;font-size:14px;color:#8891a8;">Hi {name} — here's how {agent_name} performed</p>
    </div>

    {performance_html}

    <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);border-radius:16px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:11px;color:#a78bfa;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">💡 This week's tip</p>
      <p style="margin:0;font-size:14px;color:#edf0f7;line-height:1.65;">{tip}</p>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:11px;color:#8891a8;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Agent status</p>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:8px;height:8px;border-radius:50%;background:{'#34d399' if active > 0 else '#f87171'};box-shadow:0 0 6px {'#34d399' if active > 0 else '#f87171'};flex-shrink:0;"></div>
        <p style="margin:0;font-size:14px;color:#edf0f7;">{active} of {len(agents)} agent{'s' if len(agents) != 1 else ''} active</p>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://easybuilda.com/dashboard" style="display:inline-block;padding:14px 32px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#2563eb,#0ea5e9);color:#fff;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 0 28px rgba(124,58,237,0.3);">
        Open dashboard →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#8891a8;">EasyBuilda · AI Agents for Every Business</p>
      <a href="https://easybuilda.com" style="font-size:12px;color:#38bdf8;">easybuilda.com</a>
    </div>
  </div>
</body>
</html>"""


async def send_weekly_emails() -> dict:
    db  = get_db()
    log.info("Starting weekly growth email send…")

    try:
        users_res = (
            db.table("profiles")
            .select("id,email,full_name,plan")
            .in_("plan", ["basic", "pro", "max", "trial", "admin"])
            .execute()
        )
        users = [u for u in (users_res.data or []) if u.get("email")]
        sent  = 0
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        async with httpx.AsyncClient(timeout=30) as client:
            for user in users:
                try:
                    agents_res = (
                        db.table("agents")
                        .select("id,name,status")
                        .eq("user_id", user["id"])
                        .execute()
                    )
                    agents = agents_res.data or []
                    if not agents:
                        continue

                    tx_res = (
                        db.table("wallet_transactions")
                        .select("type")
                        .eq("user_id", user["id"])
                        .gte("created_at", week_ago)
                        .execute()
                    )
                    txns  = tx_res.data or []
                    stats = {
                        "hot_leads":  sum(1 for t in txns if t["type"] == "hot_lead"),
                        "cold_leads": sum(1 for t in txns if t["type"] == "cold_lead"),
                    }

                    html = _build_html(user.get("full_name", ""), agents, stats)

                    resp = await client.post(
                        RESEND_API,
                        headers={
                            "Authorization": f"Bearer {settings.resend_api_key}",
                            "Content-Type":  "application/json",
                        },
                        json={
                            "from":    "EasyBuilda <omar@easybuilda.com>",
                            "to":      [user["email"]],
                            "subject": "📊 Your AI agent results this week",
                            "html":    html,
                        },
                    )
                    if resp.status_code < 300:
                        sent += 1
                    else:
                        log.warning("Resend error for %s: %s", user["email"], resp.text)

                except Exception as e:
                    log.warning("Failed for %s: %s", user.get("email"), e)

        log.info("Weekly emails: %d sent / %d total", sent, len(users))
        return {"sent": sent, "total": len(users)}

    except Exception as e:
        log.error("Weekly email batch failed: %s", e)
        return {"sent": 0, "error": str(e)}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    asyncio.run(send_weekly_emails())