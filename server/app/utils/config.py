from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    GROQ_API_KEY: SecretStr
    GEMINI_API_KEY: SecretStr
    # Gemini is the fallback when Groq rate-limits; defaults are free-tier caps
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GEMINI_RPM: int = 10
    GEMINI_RPD: int = 250
    DB_POSTGRES_URL: str
    PINECONE_API_KEY: str
    VOYAGE_API_KEY: str
    TINYFISH_API_KEY: str
    REDIS_URL: str
    CHAT_STREAM_REQUESTS_PER_MINUTE: int
    CHAT_STREAM_REQUESTS_PER_HOUR: int
    GROQ_ORG_ID: str
    GROQ_OPENAI_RPM: int
    GROQ_META_RPM: int
    GROQ_OPENAI_TPM: int
    GROQ_META_TPM: int
    TINYFISH_SEARCH_RPM: int = 30
    PAPERTRAIL_ENDPOINT: str
    PAPERTRAIL_TOKEN: str
    LANGFUSE_SECRET_KEY: str
    LANGFUSE_PUBLIC_KEY: str
    LANGFUSE_BASE_URL: str
    CONNECTOR_SECRET: str
    MONTHLY_TOKEN_CAP: int
    FINANCE_MCP_URL: str
    FINANCE_MCP_TOKEN: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: SecretStr
    JWT_SECRET: str
    JWT_ALGORITHM: str

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore",
    )


settings = Settings()  # type: ignore
