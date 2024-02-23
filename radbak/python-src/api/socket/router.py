import asyncio
from uuid import uuid4

import asyncpg_listen
import sqlalchemy as sa
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocketState
from pydantic import BaseModel

from api.deps import GetDb
from api.settings import get_settings

router = APIRouter(tags=["WebSocket"])

lock = asyncio.Lock()
clients: dict[str, WebSocket] = {}
LISTENER_TASK = None


async def handle_notifications(
    notification: asyncpg_listen.NotificationOrTimeout,
) -> None:
    if isinstance(notification, asyncpg_listen.Timeout):
        return
    async with lock:
        for _, websocket in clients.items():
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(
                    f"{notification.channel}: {notification.payload}"
                )


async def start_task():
    global LISTENER_TASK
    async with lock:
        if LISTENER_TASK is not None:
            return

        listener = asyncpg_listen.NotificationListener(
            asyncpg_listen.connect_func(dsn=get_settings().POSTGRES_URL)
        )
        LISTENER_TASK = asyncio.create_task(
            listener.run(
                {"all": handle_notifications},
                policy=asyncpg_listen.ListenPolicy.LAST,
                notification_timeout=5,
            )
        )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await start_task()

    client_id = uuid4().hex
    async with lock:
        clients[client_id] = websocket

    await websocket.accept()
    try:
        await websocket.send_text(f"Client ID: {client_id}")
        async with asyncio.timeout(60) as heartbeat_cm:
            async for message in websocket.iter_text():
                heartbeat_cm.reschedule(asyncio.get_running_loop().time() + 60)
                await websocket.send_text(message)
    except WebSocketDisconnect:
        await websocket.close()

    async with lock:
        del clients[client_id]
        if not clients and LISTENER_TASK is not None:
            LISTENER_TASK.cancel()


class Message(BaseModel):
    msg: str


@router.post("/send")
async def send_to_all(m: Message, conn: GetDb):
    await conn.execute(sa.text("SELECT pg_notify('all', :msg)"), {"msg": m.msg})
    return m


@router.get("/ws")
def get_ws_page() -> HTMLResponse:
    return HTMLResponse(
        """
    <html>
        <head>
            <title>WebSocket Example</title>
        </head>
        <body>
            <h1>WebSocket Example</h1>
            <form action="" onsubmit="sendMessage(event)">
                <input type="text" id="message" autocomplete="off" required/>
                <button type="submit">Send</button>
            </form>
            <ul id="messages"></ul>
            
            <script>
                var socket = new WebSocket("ws://" + location.host + "/ws");

                socket.onmessage = function(event) {
                    var messages = document.getElementById("messages");
                    var message = document.createElement("li");
                    var content = document.createTextNode(event.data);
                    message.appendChild(content);
                    messages.appendChild(message);
                };

                socket.onclose = function(event) {
                    var messages = document.getElementById("messages");
                    var message = document.createElement("li");
                    var content = document.createTextNode("Connection closed");
                    message.appendChild(content);
                    messages.appendChild(message);
                };

                function sendMessage(event) {
                    event.preventDefault();
                    var inputElement = document.getElementById("message");
                    var message = inputElement.value;
                    socket.send(message);
                    inputElement.value = "";
                }
            </script>
        </body>
    </html>
    """
    )
