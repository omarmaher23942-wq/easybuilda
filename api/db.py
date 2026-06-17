"""Supabase client (service role — backend only, bypasses RLS by design)."""
from functools import lru_cache

from supabase import create_client, Client

from config import settings


@lru_cache
def get_db() -> Client:
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env")
    return create_client(settings.supabase_url, settings.supabase_service_key)