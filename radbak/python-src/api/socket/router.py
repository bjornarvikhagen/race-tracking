import asyncio
from datetime import datetime
from typing import Literal

import asyncpg_listen
import sqlalchemy as sa
from api import deps
from api.settings import get_settings
from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from . import service

router = APIRouter(tags=["WebSocket"])

lock = asyncio.Lock()
manager = service.TimeoutSocketManager()
LISTENER_TASK = None


async def pg_notify(conn: deps.GetDb, channel: Literal["all", "dm"], message: str):
    await conn.execute(
        sa.text(f"SELECT pg_notify('{channel}', :msg)"), {"msg": message}
    )


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


class CheckpointPassing(BaseModel):
    rfid: int
    device_id: int
    passingtime: datetime

@router.post("/add_checkpoint_passing")
async def add_checkpoint_passing(cp: CheckpointPassing, conn: deps.GetDb):
    # Find the RunnerID associated with the provided RFID
    runner_query = """
        SELECT RunnerID
        FROM RunnerInRace
        WHERE TagID = $1
    """
    runner_id = await conn.fetchval(runner_query, cp.rfid)

    if not runner_id:
        raise HTTPException(status_code=404, detail="Runner not found for the provided RFID")

    # Find the ID of the last checkpoint checked in by the runner, if any
    last_checkpoint_query = """
        SELECT MAX(cp.CheckpointID)
        FROM CheckpointPassing cp
        WHERE cp.RunnerID = $1
    """
    last_checkpoint_id = await conn.fetchval(last_checkpoint_query, runner_id)

    # Check if the last checkpoint was less than 30 minutes ago
    if last_checkpoint_id:
        last_checkpoint_time_query = """
            SELECT MAX(cp.PassingTime)
            FROM CheckpointPassing cp
            WHERE cp.RunnerID = $1 AND cp.CheckpointID = $2
        """
        last_checkpoint_time = await conn.fetchval(last_checkpoint_time_query, runner_id, last_checkpoint_id)

        if last_checkpoint_time:
            current_time = datetime.now()
            time_difference = current_time - last_checkpoint_time
            if time_difference.total_seconds() / 60 < 30:
                # If the time difference is less than 30 minutes, abandon the operation
                raise HTTPException(status_code=400, detail="Less than 30 minutes since last check-in")

    # Get the ID of the next checkpoint
    next_checkpoint_id = last_checkpoint_id + 1 if last_checkpoint_id else 1

    # Verify that the next checkpoint has the correct device ID
    checkpoint_device_query = """
        SELECT 1
        FROM CheckpointInRace
        WHERE RaceID IN (SELECT RaceID FROM RunnerInRace WHERE RunnerID = $1)
        AND Position = $2
        AND DeviceID = $3
    """
    valid_device = await conn.fetchval(checkpoint_device_query, runner_id, next_checkpoint_id, cp.device_id)

    if not valid_device:
        raise HTTPException(status_code=400, detail="Device ID does not match the expected device for the next checkpoint")

    # Insert the new checkpoint passing into the database
    insert_query = """
        INSERT INTO CheckpointPassing (RunnerID, CheckpointID, PassingTime)
        VALUES ($1, $2, $3)
    """
    await conn.execute(insert_query, runner_id, next_checkpoint_id, cp.passingtime)



@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await start_task()

    async with manager.open(websocket) as client_id:

        async with deps.get_db_ctx_ws(websocket) as conn:
            await pg_notify(conn, "all", f"Client #{client_id} joined")
        await websocket.send_text(f"Client ID: {client_id}")

        async for message in manager.iter_text(websocket):

            async with deps.get_db_ctx_ws(websocket) as conn:
                await pg_notify(conn, "all", f"{client_id}:{message}")

    async with deps.get_db_ctx_ws(websocket) as conn:
        await pg_notify(conn, "all", f"Client #{client_id} left")


class Message(BaseModel):
    msg: str
    client_id: str | None = None


@router.post("/send")
async def send(m: Message, conn: deps.GetDb):

    channel, message = "all", m.msg

    if m.client_id:
        channel, message = "dm", f"{m.client_id}:{message}"
    await pg_notify(conn, channel, message)
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
