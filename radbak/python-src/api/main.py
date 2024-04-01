import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import db, deps, settings, socket


@asynccontextmanager
async def lifespan(
    app: FastAPI,
    settings: settings.Settings | None = None,
):
    app.state.sqlalchemy_engine = db.get_engine(settings)

    yield

    await app.state.sqlalchemy_engine.dispose()


app = FastAPI(title="Radbak", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_settings().CORS_ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(socket.router.router)


@app.get("/health", tags=["Status"])
async def health_check(
    dbc: deps.GetDbCtx,
):
    import sqlalchemy as sa

    async with dbc as conn:
        await conn.execute(sa.text("SELECT 1"))

    return {
        "msg": "Hello World",
        "sys": sys.version,
        "date": datetime.utcnow(),
    }
