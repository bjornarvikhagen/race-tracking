import logging
from functools import lru_cache
from typing import Annotated

from pydantic import Field, computed_field
from pydantic_core import Url
from pydantic_settings import BaseSettings, SettingsConfigDict


class Postgres(BaseSettings):
    SCHEME: str = "postgresql+asyncpg"
    POSTGRES_DB: Annotated[str, Field(validation_alias="POSTGRES_DB")] = "test_db"
    POSTGRES_HOST: Annotated[str, Field(validation_alias="POSTGRES_HOST")] = "localhost"
    POSTGRES_PORT: Annotated[int, Field(validation_alias="POSTGRES_PORT")] = 5432
    POSTGRES_USER: Annotated[str, Field(validation_alias="POSTGRES_USER")] = "haraldpaaske"
    POSTGRES_PASSWORD: Annotated[str, Field(validation_alias="POSTGRES_PASSWORD")] = (
        "hushhush"
    )

    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_POOL_SIZE: int = 5

    @computed_field
    @property
    def POSTGRES_URL(self) -> str:
        return str(
            Url.build(
                scheme="postgresql",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field
    @property
    def SQLALCHEMY_URI(self) -> str:
        return str(
            Url.build(
                scheme=self.SCHEME,
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )


class Settings(
    Postgres,
    BaseSettings,
):
    ENVIRONMENT: str = "production"
    LOG_LEVEL: int = logging.INFO

    CORS_ALLOWED_ORIGINS: list[str] = []

    HASHING_SECRET: bytes = b"hushhushhush"
    JWT_ACCESS_TOKEN_KEY: str = "hush"
    JWT_REFRESH_TOKEN_KEY: str = "hushhush"

    @computed_field
    @property
    def IS_DEV(self) -> bool:
        if self.ENVIRONMENT == "development" or self.ENVIRONMENT == "dev":
            return True
        return False

    model_config = SettingsConfigDict(case_sensitive=True)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
