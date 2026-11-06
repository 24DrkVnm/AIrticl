"""
Application settings loaded from environment variables and .env file.
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    # LiteLLM Model Configuration
    model_name: str = "gemini/gemini-2.5-flash"

    # API Keys
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")

    # Application Security
    api_key: str = "dev-local-key"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Ingestion Guardrails
    max_files: int = 5
    max_total_bytes: int = 10 * 1024 * 1024  # 10MB
    max_text_chars: int = 120_000

    # Extraction LLM Settings
    extraction_temperature: float = 0.1
    extraction_max_tokens: int = 8192

    # Synthesis LLM Settings
    synthesis_temperature: float = 0.5
    synthesis_max_tokens: int = 16384

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    class Config:
        env_file = (str(ENV_PATH), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
