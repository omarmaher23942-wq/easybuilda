"""Request / response models for the agent engine."""
from __future__ import annotations

from pydantic import BaseModel, Field


class BuildAgentRequest(BaseModel):
    business_name: str = Field(min_length=1, max_length=120)
    business_description: str = Field(min_length=1, max_length=4000)
    services: str | None = Field(default=None, max_length=8000)
    website_url: str | None = Field(default=None, max_length=300)
    tone: str | None = Field(default=None, max_length=120)
    plan: str = "trial"
    username: str | None = Field(default=None, max_length=24)
    owner_id: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    agent_id: str | None = None
    username: str | None = None
    conversation_id: str | None = None
    visitor_id: str | None = None
    page_url: str | None = None