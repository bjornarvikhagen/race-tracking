import asyncio
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

lock = asyncio.Lock()


class SocketManager:
    def __init__(self) -> None:
        self.connections: dict[str, WebSocket] = {}

    def connect(self, websocket: WebSocket) -> str:
        client_id = uuid4().hex
        self.connections[client_id] = websocket
        return client_id

    def diconnect(self, client_id: str) -> None:
        self.connections.pop(client_id, None)

    async def broadcast(self, message: str):
        async with lock:
            for _, websocket in self.connections.items():
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(message)

    async def send_to(self, client_id: str, message: str):
        async with lock:
            if client_id in self.connections:
                await self.connections[client_id].send_text(message)


class TimeoutSocketManager(SocketManager):
    def __init__(
        self,
        heartbeat: float | None = None,
        lifespan: float | None = None,
    ) -> None:
        super().__init__()
        self.heartbeat = heartbeat
        self.lifespan = lifespan

    @asynccontextmanager
    async def open(self, websocket: WebSocket):
        client_id = self.connect(websocket)

        await websocket.accept()
        try:
            async with asyncio.timeout(self.lifespan):
                yield client_id
        except asyncio.TimeoutError:
            await websocket.close()
        except WebSocketDisconnect:
            await websocket.close()
        finally:
            self.diconnect(client_id)

    async def iter_text(self, websocket: WebSocket):
        try:
            async with asyncio.timeout(self.heartbeat) as heartbeat_cm:
                async for message in websocket.iter_text():
                    if self.heartbeat:
                        heartbeat_cm.reschedule(
                            asyncio.get_running_loop().time() + self.heartbeat
                        )
                    yield message
        except asyncio.TimeoutError:
            await websocket.close()
