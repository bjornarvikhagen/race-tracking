from datetime import datetime, timezone
from typing import List

import sqlalchemy as sa
from api import deps
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class Race(BaseModel):
    name: str
    start_time: datetime


class Runner(BaseModel):
    name: str


class RunnerInRace(BaseModel):
    RunnerID: int
    RaceID: int
    TagID: str


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


class CheckpointPassing(BaseModel):
    TagID: str
    CheckpointID: int
    PassingTime: datetime


@router.get("/test_routes")
async def test_routes(dbc: deps.GetDbCtx):
    async with dbc as conn:

        # Test POST /race
        race_data = {"name": "Test Race", "start_time": "2023-01-01T00:00:00"}
        await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race_data['name']}', '{race_data['start_time']}')"
            )
        )

        # Test POST /runner
        runner_data = {"name": "Test Runner"}
        await conn.execute(
            sa.text(f"INSERT INTO Runner (name) VALUES ('{runner_data['name']}')")
        )

        # Test POST /checkpoint
        checkpoint_data = {
            "CheckpointID": 100,
            "DeviceID": 200,
            "Location": "Test Location",
        }
        await conn.execute(
            sa.text(
                f"INSERT INTO checkpoint VALUES ({checkpoint_data['CheckpointID']}, {checkpoint_data['DeviceID']}, '{checkpoint_data['Location']}')"
            )
        )
        # Test GET /races
        races_result = await conn.execute(sa.text("SELECT * FROM Race"))
        races = races_result.mappings().all()

        # Test GET /runners
        runners_result = await conn.execute(sa.text("SELECT * FROM Runner"))
        runners = runners_result.mappings().all()

        # Test GET /checkpoints
        checkpoints_result = await conn.execute(sa.text("SELECT * FROM Checkpoint"))
        checkpoints = checkpoints_result.mappings().all()

    return {
        "races": races,
        "runners": runners,
        "checkpoints": checkpoints,
        "race_post_test": race_data,
        "runner_post_test": runner_data,
        "checkpoint_post_test": checkpoint_data,
    }


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
        return {"message": "Database deletion completed successfully"}


@router.post("/setup_db")
async def setup_db(dbc: deps.GetDbCtx):
    async with dbc as conn:
        tables = [
            "CREATE TABLE IF NOT EXISTS Checkpoint (CheckpointID SERIAL PRIMARY KEY, DeviceID VARCHAR(255) NOT NULL, Location VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Runner (RunnerID SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Race (RaceID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL, startTime TIMESTAMP NOT NULL);",
            "CREATE TABLE IF NOT EXISTS RunnerInRace (RunnerID INT NOT NULL, RaceID INT NOT NULL, TagID VARCHAR(255) NOT NULL, PRIMARY KEY (RunnerID, RaceID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS Organizer (OrganizerID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS CheckpointInRace (CheckpointID INT NOT NULL, RaceID INT NOT NULL, Position INT NOT NULL, TimeLimit INT, PRIMARY KEY (CheckpointID, RaceID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS CheckpointPassing (RunnerID INT NOT NULL, CheckpointID INT NOT NULL, PassingTime TIMESTAMP NOT NULL, PRIMARY KEY (RunnerID, CheckpointID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID));",
            "CREATE TABLE IF NOT EXISTS OrganizedBy (OrganizerID INT NOT NULL, RaceID INT NOT NULL, PRIMARY KEY (OrganizerID, RaceID), FOREIGN KEY (OrganizerID) REFERENCES Organizer (OrganizerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
        ]
        for table_creation_query in tables:
            await conn.execute(sa.text(table_creation_query))
        return {"message": "Database setup completed successfully"}


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

        # Insert sample runners in races
        await conn.execute(
            sa.text(
                "INSERT INTO RunnerInRace (RunnerID, RaceID, TagID) VALUES (1, 1, 'tag1'), (2, 1, 'tag2')"
            )
        )

    return {"message": "Database seeded with sample data"}


@router.post("/runner")
async def create_runner(runner: Runner, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(f"INSERT INTO Runner (name) VALUES ('{runner.name}')")
        )
    return {"message": "Runner added"}


@router.post("/race")
async def create_race(race: Race, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race.name}', '{race.start_time}')"
            )
        )
    return {"message": "Race created"}


@router.post("/checkpoint")
async def post_checkpoint(checkpoint: Checkpoint, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(
                f"INSERT INTO checkpoint VALUES ({checkpoint.CheckpointID}, {checkpoint.DeviceID}, '{checkpoint.Location}')"
            )
        )
    return {"message": "Checkpoint added"}


@router.post("/register_tag")
async def register_tag(runner_in_race: RunnerInRace, dbc: deps.GetDbCtx):
    async with dbc as conn:
        await conn.execute(
            sa.text(
                "INSERT INTO RunnerInRace (RunnerID, RaceID, TagID) VALUES (:RunnerID, :RaceID, :TagID)"
            ),
            runner_in_race.dict(),
        )
    return {"message": "Tag registered for runner in race"}


@router.post("/checkpoint_passing")
async def post_checkpoint_passing(passing: CheckpointPassing, dbc: deps.GetDbCtx):
    # Convert PassingTime to offset-naive UTC datetime
    passing_time_naive = (
        passing.PassingTime.replace(tzinfo=timezone.utc)
        .astimezone(tz=None)
        .replace(tzinfo=None)
    )

    async with dbc as conn:
        # Retrieve the RunnerID based on the TagID
        result = await conn.execute(
            sa.text("SELECT RunnerID FROM RunnerInRace WHERE TagID = :TagID"),
            {"TagID": passing.TagID},
        )
        runner_id = result.scalar()

        if runner_id:
            parameters = {
                "RunnerID": runner_id,
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
        else:
            raise HTTPException(
                status_code=400, detail="Invalid TagID: No runner found with this TagID"
            )


@router.get("/runners")
async def get_runners(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(sa.text("SELECT * FROM Runner"))
        runners = result.mappings().all()
    return {"runners": runners}


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


@router.get("/checkpoints")
async def get_checkpoints(dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(sa.text("SELECT * FROM checkpoint"))
    checkpoints = result.fetchall()
    return {"checkpoints": str(checkpoints)}


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
                SELECT runnerid, name, TagID
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
