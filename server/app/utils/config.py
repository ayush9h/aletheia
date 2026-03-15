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

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore",
    )


settings = Settings()  # type: ignore
