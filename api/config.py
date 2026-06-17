from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_key: str = ""

    # ---- OpenRouter (current model IDs — June 2026) ----
    openrouter_trial_key: str = ""                                  # shared key (set a strict limit)
    openrouter_model: str = "anthropic/claude-haiku-4.5"           # standard agents (Basic / Pro) + knowledge structuring
    openrouter_smart_model: str = "anthropic/claude-sonnet-4.6"    # smartest (Trial=Max, Max, Singularity) + the agent "brain"
    openrouter_fast_model: str = "anthropic/claude-haiku-4.5"      # cheap model for background lead extraction
    openrouter_fallback_model: str = "openrouter/auto"             # auto-fallback on error / limit

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()