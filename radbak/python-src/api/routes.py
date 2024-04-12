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


@router.get("/Test_flow")
async def test_routes(dbc: deps.GetDbCtx):
    async with dbc as conn:
        # Run delete_db
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

        # Run setup_db
        creation_queries = [
            "CREATE TABLE IF NOT EXISTS Checkpoint (CheckpointID SERIAL PRIMARY KEY, DeviceID INT NOT NULL, Location VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Runner (RunnerID SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS Race (RaceID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL, startTime TIMESTAMP NOT NULL);",
            "CREATE TABLE IF NOT EXISTS RunnerInRace (RunnerID INT NOT NULL, RaceID INT NOT NULL, TagID VARCHAR(255) NOT NULL, PRIMARY KEY (RunnerID, RaceID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS Organizer (OrganizerID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS CheckpointInRace (CheckpointID INT NOT NULL, RaceID INT NOT NULL, Position INT NOT NULL, TimeLimit TIMESTAMP, PRIMARY KEY (CheckpointID, RaceID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
            "CREATE TABLE IF NOT EXISTS CheckpointPassing (RunnerID INT NOT NULL, CheckpointID INT NOT NULL, PassingTime TIMESTAMP NOT NULL, PRIMARY KEY (RunnerID, CheckpointID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID));",
            "CREATE TABLE IF NOT EXISTS OrganizedBy (OrganizerID INT NOT NULL, RaceID INT NOT NULL, PRIMARY KEY (OrganizerID, RaceID), FOREIGN KEY (OrganizerID) REFERENCES Organizer (OrganizerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
        ]
        for query in creation_queries:
            await conn.execute(sa.text(query))
        # Test POST /race
        race_data = {
            "name": "Krukes Ultra Trail Challenge",
            "start_time": "2024-04-12T12:40:40",
        }
        await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race_data['name']}', '{race_data['start_time']}')"
            )
        )

        # Test POST /runner
        runner_data = {"name": "Sample Runner"}
        await conn.execute(
            sa.text(f"INSERT INTO Runner (name) VALUES ('{runner_data['name']}')")
        )

        # Test POST /checkpoint
        checkpoint_data = {
            "CheckpointID": 1,
            "DeviceID": 1,
            "Location": "Startline",
        }
        await conn.execute(
            sa.text(
                f"INSERT INTO checkpoint VALUES ({checkpoint_data['CheckpointID']}, {checkpoint_data['DeviceID']}, '{checkpoint_data['Location']}')"
            )
        )

        # Test POST /register_tag
        runner_id = await conn.execute(
            sa.text("SELECT RunnerID FROM Runner ORDER BY RunnerID DESC LIMIT 1")
        )
        race_id = await conn.execute(
            sa.text("SELECT RaceID FROM Race ORDER BY RaceID DESC LIMIT 1")
        )
        tag_data = {
            "RunnerID": runner_id.scalar(),
            "RaceID": race_id.scalar(),
            "TagID": "Visakort",
        }
        await conn.execute(
            sa.text(
                "INSERT INTO RunnerInRace (RunnerID, RaceID, TagID) VALUES (:RunnerID, :RaceID, :TagID)"
            ),
            tag_data,
        )

        passing_data = {
            "TagID": tag_data["TagID"],
            "CheckpointID": checkpoint_data["CheckpointID"],
            "PassingTime": datetime.now(),
        }
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointPassing (RunnerID, CheckpointID, PassingTime) VALUES (:RunnerID, :CheckpointID, :PassingTime)"
            ),
            {
                "RunnerID": tag_data["RunnerID"],
                "CheckpointID": passing_data["CheckpointID"],
                "PassingTime": passing_data["PassingTime"],
            },
        )

        # Retrieve the name of the runner who passed the checkpoint
        checkpoint_passings_query = """
        SELECT r.name AS runner_name, cp.CheckpointID, cp.PassingTime
        FROM CheckpointPassing cp
        JOIN Runner r ON cp.RunnerID = r.RunnerID
        WHERE cp.CheckpointID = :CheckpointID
        """
        checkpoint_passings_result = await conn.execute(
            sa.text(checkpoint_passings_query),
            {"CheckpointID": checkpoint_data["CheckpointID"]},
        )
        checkpoint_passings = checkpoint_passings_result.mappings().all()
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
        "race_post_test": race_data,
        "runner_post_test": runner_data,
        "checkpoint_post_test": checkpoint_data,
        "races": races,
        "runners": runners,
        "checkpoints": checkpoints,
        "tag_post_test": tag_data,
        "passing_post_test": passing_data,
        "checkpoint_passings": checkpoint_passings,  # Include the checkpoint passing details with runner names
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
                "INSERT INTO Race (RaceID, Name, startTime) VALUES (1, 'Race 1', '2023-05-01 10:00:00'), (2, 'Race 2', '2023-06-01 12:00:00')"
            )
        )

        # Insert sample runners
        await conn.execute(
            sa.text(
                "INSERT INTO Runner (RunnerID, name) VALUES (1, 'John Doe'), (2, 'Jane Smith'), (3, 'Alice Johnson')"
            )
        )

        # Insert sample runnerinrace
        await conn.execute(
            sa.text(
                "INSERT INTO RunnerInRace (RunnerID, RaceID, TagID) VALUES (1, 1, '123456'), (2, 1, '654321'), (3, 1, '111111'), (1, 2, '222222'), (2, 2, '333333'), (3, 2, '444444')"
            )
        )

        # Insert sample checkpoint
        await conn.execute(
            sa.text(
                "INSERT INTO Checkpoint (CheckpointID, DeviceID, Location) VALUES (1, 1, 'Checkpoint 1'), (2, 2, 'Checkpoint 2'), (3, 3, 'Checkpoint 3'), (4, 4, 'Checkpoint 4'), (5, 5, 'Checkpoint 5'), (6, 6, 'Checkpoint 6'), (7, 7, 'Checkpoint 7'), (8, 8, 'Checkpoint 8'), (9, 9, 'Checkpoint 9'), (10, 10, 'Checkpoint 10')"
            )
        )

        # Insert sample checkpointinrace
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointInRace (CheckpointID, RaceID, Position, TimeLimit) VALUES (1, 1, 1, '2023-05-01 10:30:00'), (2, 1, 2, NULL), (3, 1, 3, '2023-05-01 11:30:00'), (4, 1, 4, '2023-05-01 12:00:00'), (5, 1, 5, '2023-05-01 12:30:00'), (6, 1, 6, '2023-05-01 13:00:00'), (7, 1, 7, '2023-05-01 13:30:00'), (8, 1, 8, '2023-05-01 14:00:00'), (9, 1, 9, '2023-05-01 14:30:00'), (10, 1, 10, '2023-05-01 15:00:00')"
            )
        )

        # Insert sample checkpointpassing
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointPassing (RunnerID, CheckpointID, PassingTime) VALUES (1,1,'2023-05-01 10:00:00'), (1,2,'2023-05-01 10:45:00'), (1,3,'2023-05-01 11:15:00'), (1,4,'2023-05-01 12:00:00'), (1,5,'2023-05-01 12:45:00'), (1,6,'2023-05-01 13:30:00'), (1,7,'2023-05-01 14:00:00'), (1,8,'2023-05-01 14:30:00'), (1,9,'2023-05-01 15:00:00'), (1,10,'2023-05-01 15:30:00'), (2,1,'2023-05-01 11:00:00'), (2,2,'2023-05-01 11:30:00'), (2,3,'2023-05-01 12:00:00'), (2,4,'2023-05-01 12:30:00'), (2,5,'2023-05-01 13:00:00'), (2,6,'2023-05-01 13:30:00'), (2,7,'2023-05-01 14:00:00'), (2,8,'2023-05-01 14:30:00'), (2,9,'2023-05-01 15:00:00'), (2,10,'2023-05-01 15:30:00')"
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
        json_result = result.mappings().all()
    return json_result


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
        json_result = result.mappings().all()
    return json_result


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
        json_result = result.mappings().all()
    return json_result


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
