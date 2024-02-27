import asyncio

import asyncpg_listen
import sqlalchemy as sa
from fastapi import APIRouter, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from api import deps
from api.settings import get_settings

from . import service

router = APIRouter(tags=["WebSocket"])

lock = asyncio.Lock()
manager = service.TimeoutSocketManager()
LISTENER_TASK = None


async def handle_notifications(
    notification: asyncpg_listen.NotificationOrTimeout,
) -> None:
    if isinstance(notification, asyncpg_listen.Timeout):
        return
    if notification.channel == "dm" and notification.payload:
        client_id, payload = notification.payload.split(":", 1)
        await manager.send_to(client_id, payload)
    if notification.channel == "all" and notification.payload:
        await manager.broadcast(notification.payload)


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
                {
                    "all": handle_notifications,
                    "dm": handle_notifications,
                },
                policy=asyncpg_listen.ListenPolicy.LAST,
                notification_timeout=5,
            )
        )
        print(f"Listener started {LISTENER_TASK.done()=} {LISTENER_TASK.cancelled()=}")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await start_task()

    async with manager.open(websocket) as client_id:
        await websocket.send_text(f"Client ID: {client_id}")

        async for message in manager.iter_text(websocket):

            async with deps.get_db_ctx_ws(websocket) as conn:
                await conn.execute(
                    sa.text("SELECT pg_notify('all', :msg)"),
                    {"msg": f"{client_id}: {message}"},
                )


class Message(BaseModel):
    msg: str
    client_id: str | None = None


@router.post("/send")
async def send(m: Message, conn: deps.GetDb):

    channel, message = "all", m.msg

    if m.client_id:
        channel, message = "dm", f"{m.client_id}:{message}"

    await conn.execute(
        sa.text(f"SELECT pg_notify('{channel}', :msg)"), {"msg": message}
    )
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
            <a href="/ws">Open new tab</a>
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
