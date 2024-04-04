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
    runnerid: int
    checkpointid: int
    passingtime: datetime


@router.post("/add_checkpoint_passing")
async def add_checkpoint_passing(cp: CheckpointPassing, conn: deps.GetDb):
    query = """
        SELECT MAX(passingtime) 
        FROM checkpointpassing 
        WHERE runnerid = $1 AND checkpointid = $2
    """
    last_checkin_time = await conn.fetchval(query, cp.runnerid, cp.checkpointid)

    # Check if there was a last check-in time and calculate the difference
    if last_checkin_time:
        current_time = datetime.now()
        time_difference = current_time - last_checkin_time
        if time_difference.total_seconds() / 60 < 30:
            # If the time difference is less than 30 minutes, raise an exception
            raise HTTPException(status_code=400, detail="Less than 30 minutes since last check-in")
    
    # Insert the new checkpoint passing into the database
    insert_query = """
        INSERT INTO checkpointpassing (runnerid, checkpointid, passingtime)
        VALUES ($1, $2, $3)
    """
    await conn.execute(insert_query, cp.runnerid, cp.checkpointid, cp.passingtime)



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

# want a getter for checkpointinrace, which returns all checkpoints, their positions, and their time limits for a given race
@router.get("/checkpointinrace/{race_id}")
async def get_checkpointinrace(race_id: int, conn: deps.GetDb):
    query = """
        SELECT checkpointid, position, timelimit
        FROM checkpointinrace WHERE raceid = $1
    """
    return await conn.fetch(query, race_id)

# want a getter for all runners in a race, based on runnersinrace
@router.get("/runner/{race_id}")
async def get_runners(race_id: int, conn: deps.GetDb):
    query = """
        SELECT runnerid, name
        FROM runnersinrace NATURAL JOIN runner WHERE raceid = $1
    """
    return await conn.fetch(query, race_id)

# should return all checkpoint passings for a given runner, i.e.,
# the checkpoint number and the time the runner passed that checkpoint
@router.get("/checkpointpassing/{runner_id}")
async def get_checkpoint_passings(runner_id: int, conn: deps.GetDb):
    query = """
        SELECT checkpointid, passingtime
        FROM checkpointpassing
        WHERE runnerid = $1
    """
    return await conn.fetch(query, runner_id)
