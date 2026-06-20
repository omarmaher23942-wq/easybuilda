"""
EasyBuilda — Billing Service
Wallet-based billing: deduct cold/hot leads, subscriptions, setup fees.
All money flows through this file.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from services import repo

log = logging.getLogger("easybuilda.billing")

# ── Pricing ────────────────────────────────────────────────────────
COLD_LEAD_COST  = 0.50   # any new conversation
HOT_LEAD_COST   = 2.00   # lead with name/email/phone captured
SETUP_FEE       = 9.00   # one-time per user
WARNING_BALANCE = 5.00   # send warning when balance drops below this

PLAN_PRICES = {
    "basic": 29.00,
    "pro":   69.00,
}

# ── Core wallet operations ─────────────────────────────────────────

def _get_wallet(user_id: str) -> dict:
    """Get or auto-create wallet for user."""
    wallet = repo.get_wallet(user_id)
    if not wallet:
        wallet = repo.create_wallet(user_id)
    return wallet

def get_balance(user_id: str) -> float:
    """Return current wallet balance."""
    wallet = _get_wallet(user_id)
    return float(wallet.get("balance", 0))

def check_balance(user_id: str, amount: float) -> bool:
    """Return True if wallet has enough balance."""
    return get_balance(user_id) >= amount

def add_balance(user_id: str, amount: float, topup_ref: str | None = None, description: str = "Top-up") -> dict:
    """Credit wallet and log transaction. Called by admin on topup approval."""
    wallet  = _get_wallet(user_id)
    current = float(wallet.get("balance", 0))
    new_bal = round(current + amount, 2)

    repo.update_wallet_balance(user_id, new_bal)
    repo.log_wallet_transaction({
        "user_id":       user_id,
        "type":          "topup",
        "amount":        amount,
        "balance_after": new_bal,
        "description":   description,
        "topup_ref":     topup_ref,
    })

    log.info("Wallet top-up: user=%s +$%.2f → $%.2f", user_id, amount, new_bal)
    return {"balance": new_bal, "credited": amount}

def _deduct(user_id: str, amount: float, tx_type: str, description: str,
            agent_id: str | None = None, conversation_id: str | None = None) -> dict | None:
    """Deduct from wallet. Returns None if insufficient balance."""
    wallet  = _get_wallet(user_id)
    current = float(wallet.get("balance", 0))

    if current < amount:
        log.warning("Insufficient balance: user=%s balance=%.2f needed=%.2f", user_id, current, amount)
        return None

    new_bal = round(current - amount, 2)
    repo.update_wallet_balance(user_id, new_bal)
    repo.log_wallet_transaction({
        "user_id":         user_id,
        "type":            tx_type,
        "amount":          -amount,
        "balance_after":   new_bal,
        "description":     description,
        "agent_id":        agent_id,
        "conversation_id": conversation_id,
    })

    # Low balance warning
    if new_bal < WARNING_BALANCE and current >= WARNING_BALANCE:
        _send_low_balance_warning(user_id, new_bal)

    # Pause agents if balance hits zero
    if new_bal <= 0:
        _pause_agents_on_empty(user_id)

    log.info("Wallet deduct: user=%s -$%.2f [%s] → $%.2f", user_id, amount, tx_type, new_bal)
    return {"balance": new_bal, "deducted": amount}

# ── Billing events ─────────────────────────────────────────────────

async def charge_cold_lead(user_id: str, agent_id: str, conversation_id: str) -> dict | None:
    """Charge $0.50 for a new conversation (cold lead)."""
    result = _deduct(
        user_id, COLD_LEAD_COST, "cold_lead",
        f"Cold lead — conversation {conversation_id[:8]}",
        agent_id=agent_id, conversation_id=conversation_id,
    )
    if result is None:
        await _handle_zero_balance(user_id, agent_id)
    return result

async def charge_hot_lead(user_id: str, agent_id: str, conversation_id: str) -> dict | None:
    """Charge $1.50 extra when lead submits contact info (total $2.00 = cold + hot)."""
    hot_extra = HOT_LEAD_COST - COLD_LEAD_COST  # $1.50 extra
    result = _deduct(
        user_id, hot_extra, "hot_lead",
        f"Hot lead upgrade — {conversation_id[:8]}",
        agent_id=agent_id, conversation_id=conversation_id,
    )
    if result is None:
        await _handle_zero_balance(user_id, agent_id)
    return result

async def charge_subscription(user_id: str, plan: str) -> dict | None:
    """Deduct monthly subscription from wallet."""
    price = PLAN_PRICES.get(plan)
    if not price:
        return None
    result = _deduct(
        user_id, price, "subscription",
        f"{plan.capitalize()} plan — monthly",
    )
    if result is None:
        await _handle_zero_balance(user_id, agent_id=None)
    return result

async def charge_setup_fee(user_id: str) -> dict | None:
    """Charge one-time $9 setup fee (pay-per-lead users)."""
    # Check if already charged
    txns = repo.get_wallet_transactions(user_id, tx_type="setup_fee")
    if txns:
        return {"skipped": True, "reason": "Already charged"}
    return _deduct(user_id, SETUP_FEE, "setup_fee", "Agent setup fee (one-time)")

# ── Helpers ────────────────────────────────────────────────────────

def _send_low_balance_warning(user_id: str, balance: float) -> None:
    """Send in-app notification when balance is low."""
    try:
        repo.create_notification({
            "user_id":      user_id,
            "type":         "warning",
            "title":        f"⚠️ Low wallet balance — ${balance:.2f} remaining",
            "body":         "Your wallet balance is low. Add funds to keep your AI agent running.",
            "action_url":   "/wallet",
            "action_label": "Add funds",
        })
    except Exception as e:
        log.warning("Failed to send low balance warning to %s: %s", user_id, e)

def _pause_agents_on_empty(user_id: str) -> None:
    """Pause all agents when balance hits zero."""
    try:
        agents = repo.list_agents_by_user(user_id)
        count = 0
        for agent in agents:
            if agent.get("status") == "active":
                repo.update_agent(agent["id"], {"status": "inactive"})
                count += 1

        if count > 0:
            repo.create_notification({
                "user_id":      user_id,
                "type":         "error",
                "title":        "🔴 AI agent paused — wallet empty",
                "body":         f"{count} agent{'s' if count > 1 else ''} paused. Recharge your wallet to resume instantly.",
                "action_url":   "/wallet",
                "action_label": "Add funds now",
            })
            log.info("Paused %d agents for user %s (zero balance)", count, user_id)
    except Exception as e:
        log.warning("Failed to pause agents for %s: %s", user_id, e)

async def _handle_zero_balance(user_id: str, agent_id: str | None) -> None:
    """Called when a charge fails due to insufficient balance."""
    _pause_agents_on_empty(user_id)
    # In future: send email via Resend

def reactivate_after_topup(user_id: str) -> None:
    """Reactivate paused agents after wallet is topped up."""
    try:
        agents = repo.list_agents_by_user(user_id)
        count = 0
        for agent in agents:
            if agent.get("status") == "inactive":
                repo.update_agent(agent["id"], {"status": "active"})
                count += 1
        if count > 0:
            repo.create_notification({
                "user_id":      user_id,
                "type":         "success",
                "title":        "✅ Your AI agent is back online!",
                "body":         f"{count} agent{'s' if count > 1 else ''} reactivated. Wallet recharged successfully.",
                "action_url":   "/dashboard",
                "action_label": "View dashboard",
            })
            log.info("Reactivated %d agents for user %s after top-up", count, user_id)
    except Exception as e:
        log.warning("Failed to reactivate agents for %s: %s", user_id, e)