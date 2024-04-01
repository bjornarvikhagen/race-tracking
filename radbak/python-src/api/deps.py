from collections.abc import AsyncGenerator
from typing import Annotated, AsyncContextManager

from fastapi import Depends, Request, WebSocket, status
from fastapi.exceptions import HTTPException, WebSocketException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncConnection

from . import db
from .settings import Settings, get_settings


async def get_db(request: Request) -> AsyncGenerator[AsyncConnection, None]:
    try:
        async with db.get_connection(request.app.state.sqlalchemy_engine) as conn:
            yield conn
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="could not perform transaction",
        )


def get_db_ctx(request: Request) -> AsyncContextManager[AsyncConnection]:
    return db.get_connection(request.app.state.sqlalchemy_engine)


async def get_db_ws(ws: WebSocket) -> AsyncGenerator[AsyncConnection, None]:
    try:
        async with db.get_connection(ws.app.state.sqlalchemy_engine) as conn:
            yield conn
    except SQLAlchemyError:
        raise WebSocketException(code=status.WS_1011_INTERNAL_ERROR)


def get_db_ctx_ws(ws: WebSocket) -> AsyncContextManager[AsyncConnection]:
    return db.get_connection(ws.app.state.sqlalchemy_engine)


GetSettings = Annotated[Settings, Depends(get_settings)]

GetDb = Annotated[AsyncConnection, Depends(get_db)]
GetDbCtx = Annotated[AsyncContextManager[AsyncConnection], Depends(get_db_ctx)]

GetDbWs = Annotated[AsyncConnection, Depends(get_db_ws)]
GetDbCtxWs = Annotated[AsyncContextManager[AsyncConnection], Depends(get_db_ctx_ws)]
