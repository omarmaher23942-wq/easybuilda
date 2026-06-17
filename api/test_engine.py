"""
EasyBuilda — End-to-end engine self-test.

Run it from the api folder with the venv active:
    python test_engine.py

It spins the app up in-process (no separate server needed), builds a test agent,
chats with it twice, and reads the captured leads — printing PASS / FAIL for each step.
Requires .env to be filled: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENROUTER_TRIAL_KEY.
"""
from __future__ import annotations

import sys


def ok(label: str, passed: bool, resp) -> bool:
    mark = "PASS \u2705" if passed else "FAIL \u274c"
    print(f"[{mark}] {label}  (HTTP {resp.status_code})")
    if not passed:
        try:
            print("        response:", resp.text[:400])
        except Exception:
            pass
    return passed


def main() -> None:
    print("=" * 64)
    print(" EasyBuilda \u2014 Engine self-test")
    print("=" * 64)

    try:
        from fastapi.testclient import TestClient

        from main import app
    except Exception as exc:  # noqa: BLE001
        print("FAIL \u274c  Could not import the app:", exc)
        sys.exit(1)

    client = TestClient(app)

    # 0) health
    r = client.get("/health")
    ok("Health check", r.status_code == 200, r)

    # 1) build agent (calls the AI \u2014 may take ~10\u201340s)
    print("\n-> Building agent (this calls the AI; may take 10\u201340s)...")
    build_body = {
        "business_name": "Sparkle Home",
        "business_description": "A home cleaning service in Cairo offering deep cleaning, weekly plans, and move-out cleaning.",
        "services": (
            "Deep clean for a 2-bedroom: $180, about 3 hours. Weekly plan from $120/visit. "
            "Move-out cleaning available. We serve Cairo and Giza. Open Sat-Thu 9am-6pm."
        ),
        "plan": "trial",
    }
    r = client.post("/api/agents/build", json=build_body)
    passed = r.status_code == 200 and bool(r.json().get("agent", {}).get("id"))
    if not ok("Build agent", passed, r):
        print("\nStopped: build failed. Check .env keys (OPENROUTER_TRIAL_KEY / SUPABASE_*) and model names.")
        sys.exit(1)

    agent = r.json()["agent"]
    agent_id = agent["id"]
    print(f"   name: {agent.get('name')}   @{agent.get('username')}   readiness: {agent.get('readiness_score')}")
    print(f"   welcome: {agent.get('welcome_message')}")
    print(f"   questions: {agent.get('suggested_questions')}")
    if agent.get("readiness_notes"):
        print(f"   notes: {agent.get('readiness_notes')}")

    # 2) chat turn 1
    print("\n-> Chat turn 1...")
    r = client.post(
        "/api/chat",
        json={
            "agent_id": agent_id,
            "message": "How much is a deep clean for a 2-bedroom? I need it this week.",
            "page_url": "https://sparklehome.com/pricing",
            "visitor_id": "tester-1",
        },
    )
    passed = r.status_code == 200 and bool(r.json().get("reply"))
    if not ok("Chat turn 1", passed, r):
        sys.exit(1)
    data = r.json()
    conv_id = data["conversation_id"]
    print(f"   model: {data.get('model_used')}")
    print(f"   reply: {data['reply'][:220]}")

    # 3) chat turn 2 \u2014 share contact, should create/enrich a lead
    print("\n-> Chat turn 2 (sharing contact)...")
    r = client.post(
        "/api/chat",
        json={
            "agent_id": agent_id,
            "conversation_id": conv_id,
            "message": "Yes please book me this week. I'm Ahmed, ahmed@example.com.",
        },
    )
    passed = r.status_code == 200 and bool(r.json().get("reply"))
    ok("Chat turn 2", passed, r)
    data = r.json()
    print(f"   reply: {data['reply'][:220]}")
    lead = data.get("lead")
    if lead:
        print(
            "   LEAD captured -> "
            f"name={lead.get('name')} email={lead.get('email')} "
            f"intent={lead.get('intent')} interest={lead.get('interest')}"
        )

    # 4) read leads
    print("\n-> Reading leads page data...")
    r = client.get(f"/api/agents/{agent_id}/leads")
    passed = r.status_code == 200
    ok("List leads", passed, r)
    if passed:
        leads = r.json().get("leads", [])
        print(f"   total leads: {len(leads)}")
        for L in leads[:3]:
            print(f"     - {L.get('name')} | {L.get('intent')} | {L.get('interest')} | {L.get('summary')}")

    print("\n" + "=" * 64)
    print(" Done. If every row says PASS, the engine works end-to-end. \U0001f389")
    print(" (The test agent stays in your DB \u2014 you can ignore or delete it.)")
    print("=" * 64)


if __name__ == "__main__":
    main()