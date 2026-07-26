from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    GROQ_API_KEY: SecretStr
    DB_POSTGRES_URL: str
    PINECONE_API_KEY: str
    VOYAGE_API_KEY: str
    TAVILY_API_KEY: str
    REDIS_URL: str
    CHAT_STREAM_REQUESTS_PER_MINUTE: int
    CHAT_STREAM_REQUESTS_PER_HOUR: int
    GROQ_ORG_ID: str
    GROQ_OPENAI_RPM: int
    GROQ_META_RPM: int
    GROQ_OPENAI_TPM: int
    GROQ_META_TPM: int
    TAVILY_SEARCH_RPM: int
    PAPERTRAIL_ENDPOINT: str
    PAPERTRAIL_TOKEN: str

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore",
    )


settings = Settings()  # type: ignore
