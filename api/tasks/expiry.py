"""
EasyBuilda — Expiry background task
Run via: python -m tasks.expiry
Or import and call run_expiry_check() from lifespan/scheduler
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta

from db import get_db
from services import repo

log = logging.getLogger("easybuilda.expiry")

GRACE_PERIOD_DAYS = 3
WARNING_DAYS_BEFORE = 7  # notify when X days left


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _deactivate_agents(user_id: str, reason: str) -> int:
    """Pause all active agents. Returns count paused."""
    try:
        agents = repo.list_agents_by_user(user_id)
        count  = 0
        for agent in agents:
            if agent.get("status") == "active":
                repo.update_agent(agent["id"], {"status": "inactive"})
                count += 1
        if count > 0:
            log.info("Paused %d agents for user %s (%s)", count, user_id, reason)
        return count
    except Exception as e:
        log.warning("Failed to deactivate agents for %s: %s", user_id, e)
        return 0


def check_trial_expirations() -> None:
    """Pause agents for users whose trial has expired."""
    db  = get_db()
    now = _now()
    try:
        res = (
            db.table("profiles")
            .select("id, email, trial_ends_at")
            .eq("plan", "trial")
            .lt("trial_ends_at", now.isoformat())
            .execute()
        )
        for user in (res.data or []):
            count = _deactivate_agents(user["id"], "trial expired")
            if count > 0:
                repo.create_notification({
                    "user_id":      user["id"],
                    "type":         "warning",
                    "title":        "⏰ Your free trial has ended",
                    "body":         "Your AI agent is paused. Upgrade to keep it running.",
                    "action_url":   "/pricing",
                    "action_label": "See plans",
                })
    except Exception as e:
        log.error("Trial expiry check failed: %s", e)


def check_subscription_expirations() -> None:
    """Pause agents for subscriptions past grace period."""
    db  = get_db()
    now = _now()
    grace_cutoff = (now - timedelta(days=GRACE_PERIOD_DAYS)).isoformat()

    try:
        res = (
            db.table("profiles")
            .select("id, email, plan, billing_end")
            .in_("plan", ["basic", "pro"])
            .lt("billing_end", grace_cutoff)
            .execute()
        )
        for user in (res.data or []):
            # Update plan to expired
            repo.update_profile(user["id"], {"plan": "expired"})
            count = _deactivate_agents(user["id"], "subscription expired")
            if count > 0:
                repo.create_notification({
                    "user_id":      user["id"],
                    "type":         "error",
                    "title":        "📅 Subscription expired",
                    "body":         "Your AI agent is paused. Top up your wallet and renew to resume.",
                    "action_url":   "/wallet/topup",
                    "action_label": "Add funds",
                })
    except Exception as e:
        log.error("Subscription expiry check failed: %s", e)


def send_expiry_warnings() -> None:
    """Send warnings when subscription is about to expire."""
    db  = get_db()
    now = _now()
    warn_after = (now + timedelta(days=WARNING_DAYS_BEFORE)).isoformat()

    try:
        res = (
            db.table("profiles")
            .select("id, plan, billing_end")
            .in_("plan", ["basic", "pro"])
            .lt("billing_end", warn_after)
            .gt("billing_end", now.isoformat())
            .execute()
        )
        for user in (res.data or []):
            try:
                end_dt    = datetime.fromisoformat(user["billing_end"].replace("Z", "+00:00"))
                days_left = (end_dt - now).days
                repo.create_notification({
                    "user_id":      user["id"],
                    "type":         "warning",
                    "title":        f"⚠️ Subscription expires in {days_left} day{'s' if days_left != 1 else ''}",
                    "body":         "Make sure your wallet has enough balance for renewal.",
                    "action_url":   "/wallet",
                    "action_label": "Check wallet",
                })
            except Exception:
                pass
    except Exception as e:
        log.error("Expiry warning check failed: %s", e)


def run_expiry_check() -> None:
    """Main function — run all checks."""
    log.info("Running expiry check…")
    check_trial_expirations()
    check_subscription_expirations()
    send_expiry_warnings()
    log.info("Expiry check complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    run_expiry_check()