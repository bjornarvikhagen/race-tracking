from datetime import datetime, timezone
from typing import List

import sqlalchemy as sa
from api import deps
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class Race(BaseModel):
    name: str
    start_time: datetime


class Runner(BaseModel):
    name: str


class Checkpoint(BaseModel):
    CheckpointID: int
    DeviceID: int
    Location: str


class RaceOut(BaseModel):
    RaceID: int = Field(..., alias="raceid")
    Name: str = Field(..., alias="name")
    startTime: datetime = Field(..., alias="starttime")

    class Config:
        allow_population_by_field_name = True


@router.get("/checkpoints")
async def get_checkpoints(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(sa.text("SELECT * FROM checkpoint"))
    checkpoints = result.fetchall()
    return {"checkpoints": str(checkpoints)}


@router.post("/checkpoint")
async def post_checkpoint(checkpoint: Checkpoint, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(
                f"INSERT INTO checkpoint VALUES ({checkpoint.CheckpointID}, {checkpoint.DeviceID}, '{checkpoint.Location}')"
            )
        )
    return {"message": "Checkpoint added"}


@router.post("/setup_db")
async def setup_db(dbc: deps.GetDbCtx):
    async with dbc as conn:
        # Create tables
        tables = [
            "CREATE TABLE IF NOT EXISTS Checkpoint (CheckpointID SERIAL PRIMARY KEY, DeviceID VARCHAR(255) NOT NULL, Location VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Runner (RunnerID SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Race (RaceID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL, startTime TIMESTAMP NOT NULL);",
            "CREATE TABLE IF NOT EXISTS RunnerInRace (RunnerID INT NOT NULL, RaceID INT NOT NULL, TagID VARCHAR(255) NOT NULL, PRIMARY KEY (RunnerID, RaceID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS Organizer (OrganizerID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS CheckpointInRace (CheckpointID INT NOT NULL, RaceID INT NOT NULL, Position INT NOT NULL, PRIMARY KEY (CheckpointID, RaceID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS CheckpointPassing (RunnerID INT NOT NULL, CheckpointID INT NOT NULL, PassingTime TIMESTAMP NOT NULL, PRIMARY KEY (RunnerID, CheckpointID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID));",
            "CREATE TABLE IF NOT EXISTS OrganizedBy (OrganizerID INT NOT NULL, RaceID INT NOT NULL, PRIMARY KEY (OrganizerID, RaceID), FOREIGN KEY (OrganizerID) REFERENCES Organizer (OrganizerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
        ]
        for table_creation_query in tables:
            await conn.execute(sa.text(table_creation_query))


@router.post("/delete_db")
async def delete_db(dbc: deps.GetDbCtx):
    async with dbc as conn:
        tables = [
            "Checkpoint",
            "Runner",
            "RunnerInRace",
            "Race",
            "Organizer",
            "CheckpointInRace",
            "CheckpointPassing",
            "OrganizedBy",
        ]
        for table in tables:
            await conn.execute(sa.text(f"DROP TABLE IF EXISTS {table} CASCADE;"))


@router.get("/tables")
async def tables(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
            )
        )
    tables_list = [
        a[0]
        for a in result.fetchall()
        if not (a[0].startswith("pg") or a[0].startswith("sql"))
    ]
    return {"tables": str(tables_list)}


@router.get("/races", response_model=List[RaceOut])
async def get_races(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                "SELECT RaceID as raceid, Name as name, startTime as starttime FROM Race"
            )
        )
        races = result.mappings().all()
    return races


@router.post("/race")
async def create_race(race: Race, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race.name}', '{race.start_time}')"
            )
        )
    return {"message": "Race created"}


@router.get("/runners")
async def get_runners(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(sa.text("SELECT * FROM Runner"))
        runners = result.mappings().all()
    return {"runners": runners}


@router.post("/runner")
async def create_runner(runner: Runner, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(f"INSERT INTO Runner (name) VALUES ('{runner.name}')")
        )
    return {"message": "Runner added"}


@router.post("/seed_db")
async def seed_db(dbc: deps.GetDbCtx):
    async with dbc as conn:
        # Insert sample races
        await conn.execute(
            sa.text(
                "INSERT INTO Race (Name, startTime) VALUES ('Race 1', '2024-04-04 10:00:00'), ('Race 2', '2024-04-03 12:00:00')"
            )
        )

        # Insert sample runners
        await conn.execute(
            sa.text("INSERT INTO Runner (name) VALUES ('Bjørnar'), ('Sondre')")
        )

        # Insert a sample checkpoint
        await conn.execute(
            sa.text(
                "INSERT INTO Checkpoint (CheckpointID, DeviceID, Location) VALUES (1, 10, 'Start Line')"
            )
        )

    return {"message": "Database seeded with sample data"}


@router.get("/checkpointinrace/{race_id}")
async def get_checkpoints_in_race(race_id: int, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                f"""
                    SELECT checkpointid, position, timelimit
                    FROM checkpointinrace WHERE raceid = {race_id}
                """
            )
        )
    return {"result:": str(result.fetchall())}


@router.get("/runners/{race_id}")
async def get_runners_in_race(race_id: int, dbc: deps.GetDbCtx):

    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                f"""
                SELECT runnerid, name
                FROM runnerinrace NATURAL JOIN runner WHERE raceid = {race_id}
            """
            )
        )
    return str(result.fetchall())


@router.get("/checkpointpassings/{runner_id}")
async def get_checkpoint_passings(runner_id: int, dbc: deps.GetDbCtx):

    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                f"""
                    SELECT checkpointid, passingtime
                    FROM checkpointpassing
                   WHERE runnerid = {runner_id}
               """
            )
        )
    return {"result:": str(result.fetchall())}


class CheckpointPassing(BaseModel):
    RunnerID: int
    CheckpointID: int
    PassingTime: datetime


@router.post("/checkpoint_passing")
async def post_checkpoint_passing(passing: CheckpointPassing, dbc: deps.GetDbCtx):
    # Convert PassingTime to offset-naive UTC datetime
    passing_time_naive = (
        passing.PassingTime.replace(tzinfo=timezone.utc)
        .astimezone(tz=None)
        .replace(tzinfo=None)
    )

    async with dbc as conn:
        parameters = {
            "RunnerID": passing.RunnerID,
            "CheckpointID": passing.CheckpointID,
            "PassingTime": passing_time_naive,
        }
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointPassing (RunnerID, CheckpointID, PassingTime) VALUES (:RunnerID, :CheckpointID, :PassingTime)"
            ),
            parameters,
        )
    return {"message": "Checkpoint passing added"}


class CheckpointPassingRFID(BaseModel):
    rfid: int
    device_id: int
    passingtime: str

@router.post("/checkpoint_passing_from_rfid")
async def post_checkpoint_passing(passing: CheckpointPassingRFID, dbc: deps.GetDbCtx):
    # Parse the passing time
    try:
        passing_time_naive = datetime.strptime(passing.passingtime, "%Y-%m-%dT%H:%M:%S")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid passingtime format: {str(e)}")

    async with dbc as conn:
        # Query to get RunnerID using RFID
        runner_id_result = await conn.execute(
            sa.text("SELECT RunnerID FROM RunnerInRace WHERE TagID = :rfid"),
            {"rfid": passing.rfid}
        )
        runner_id = runner_id_result.scalar_one_or_none()
        if not runner_id:
            raise HTTPException(status_code=404, detail="Runner not found for the provided RFID")

        # Query to get the most recent checkpoint passing time for this runner
        last_passing_result = await conn.execute(
            sa.text(
                "SELECT PassingTime FROM CheckpointPassing "
                "WHERE RunnerID = :runner_id "
                "ORDER BY PassingTime DESC LIMIT 1"
            ),
            {"runner_id": runner_id}
        )
        last_passing_time = last_passing_result.scalar_one_or_none()

        # Check if the last checkpoint was less than 30 minutes ago
        if last_passing_time and (datetime.utcnow() - last_passing_time) < timedelta(minutes=30):
            raise HTTPException(status_code=400, detail="Less than 30 minutes since last check-in")

        # Query to get CheckpointID using DeviceID
        checkpoint_id_result = await conn.execute(
            sa.text("SELECT CheckpointID FROM Checkpoint WHERE DeviceID = :device_id"),
            {"device_id": passing.device_id}
        )
        checkpoint_id = checkpoint_id_result.scalar_one_or_none()
        if not checkpoint_id:
            raise HTTPException(status_code=404, detail="Checkpoint not found for the provided Device ID")

        # Now we have the RunnerID and CheckpointID, insert the checkpoint passing
        parameters = {
            "RunnerID": runner_id,
            "CheckpointID": checkpoint_id,
            "PassingTime": passing_time_naive,
        }
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointPassing (RunnerID, CheckpointID, PassingTime) VALUES (:RunnerID, :CheckpointID, :PassingTime)"
            ),
            parameters
        )
        await conn.commit()

    return {"message": "Checkpoint passing added"}
