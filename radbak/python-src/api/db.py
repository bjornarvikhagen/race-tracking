import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from .settings import Settings, get_settings


def get_engine(settings: Settings | None = None) -> AsyncEngine:
    if settings is None:
        settings = get_settings()
    return create_async_engine(
        settings.SQLALCHEMY_URI,
        echo=settings.SQLALCHEMY_ECHO,
        pool_size=settings.SQLALCHEMY_POOL_SIZE,
    )


@asynccontextmanager
async def get_connection(
    engine: AsyncEngine,
) -> AsyncGenerator[AsyncConnection, None]:
    async with engine.connect() as conn:
        try:
            yield conn
            await conn.commit()
        except SQLAlchemyError as sql_ex:
            logging.exception("SQLAlchemy error")
            await conn.rollback()
            raise sql_ex


@asynccontextmanager
async def get_single_connection(
    settings: Settings | None = None,
) -> AsyncGenerator[AsyncConnection, None]:
    engine = get_engine(settings)
    try:
        async with get_connection(engine) as conn:
            yield conn
    except Exception:
        pass
    finally:
        await engine.dispose()
