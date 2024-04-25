from datetime import datetime, timezone
from typing import List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api import deps
from api.socket.router import pg_notify

router = APIRouter()


class Race(BaseModel):
    name: str
    start_time: datetime


class Runner(BaseModel):
    username: str


class RunnerInRace(BaseModel):
    RunnerID: int
    RaceID: int
    TagID: str


class Checkpoint(BaseModel):
    DeviceID: int
    Location: str


class RaceOut(BaseModel):
    RaceID: int = Field(..., alias="raceid")
    Name: str = Field(..., alias="name")
    startTime: datetime = Field(..., alias="starttime")

    class Config:
        populate_by_name = True


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
            "CREATE TABLE IF NOT EXISTS Runner (RunnerID SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE);",
            "CREATE TABLE IF NOT EXISTS Race (RaceID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL, startTime TIMESTAMP NOT NULL);",
            "CREATE TABLE IF NOT EXISTS RunnerInRace (RunnerID INT NOT NULL, RaceID INT NOT NULL, TagID VARCHAR(255) NOT NULL, PRIMARY KEY (RunnerID, RaceID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID) ON DELETE CASCADE, FOREIGN KEY (RaceID) REFERENCES Race (RaceID) ON DELETE CASCADE);",
            "CREATE TABLE IF NOT EXISTS Organizer (OrganizerID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS CheckpointInRace (CheckpointID INT NOT NULL, RaceID INT NOT NULL, Position INT NOT NULL, TimeLimit TIMESTAMP, PRIMARY KEY (CheckpointID, RaceID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID) ON DELETE CASCADE, FOREIGN KEY (RaceID) REFERENCES Race (RaceID) ON DELETE CASCADE);",
            "CREATE TABLE IF NOT EXISTS CheckpointPassing (RunnerID INT NOT NULL, CheckpointID INT NOT NULL, PassingTime TIMESTAMP NOT NULL, PRIMARY KEY (RunnerID, CheckpointID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID) ON DELETE CASCADE, FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID) ON DELETE CASCADE);",
            "CREATE TABLE IF NOT EXISTS OrganizedBy (OrganizerID INT NOT NULL, RaceID INT NOT NULL, PRIMARY KEY (OrganizerID, RaceID), FOREIGN KEY (OrganizerID) REFERENCES Organizer (OrganizerID), FOREIGN KEY (RaceID) REFERENCES Race (RaceID));",
        ]
        for query in creation_queries:
            await conn.execute(sa.text(query))
        # Test POST /race
        race_data = {
            "name": "Krukes Ultra Trail Challenge",
            "start_time": "2024-04-25T12:40:40",
        }
        await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race_data['name']}', '{race_data['start_time']}')"
            )
        )

        # Test POST /runner
        runner_data = {"username": "bjørnar"}
        await conn.execute(
            sa.text(f"INSERT INTO Runner (name) VALUES ('{runner_data['username']}')")
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
        # Test POST /checkpoint
        checkpoint2_data = {
            "CheckpointID": 2,
            "DeviceID": 2,
            "Location": "Finishline",
        }
        await conn.execute(
            sa.text(
                f"INSERT INTO checkpoint VALUES ({checkpoint2_data['CheckpointID']}, {checkpoint2_data['DeviceID']}, '{checkpoint2_data['Location']}')"
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
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointInRace (RaceID, CheckpointID, Position, TimeLimit) VALUES (1, 1, 1, '2024-04-25 12:40:40')"
            )
        )
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointInRace (RaceID, CheckpointID, Position, TimeLimit) VALUES (1, 2, 2, '2024-04-25 12:50:40')"
            )
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
            "CREATE TABLE IF NOT EXISTS Runner (RunnerID SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE);",
            "CREATE TABLE IF NOT EXISTS Race (RaceID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL, startTime TIMESTAMP NOT NULL);",
            "CREATE TABLE IF NOT EXISTS RunnerInRace (RunnerID INT NOT NULL, RaceID INT NOT NULL, TagID VARCHAR(255) NOT NULL, PRIMARY KEY (RunnerID, RaceID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID) ON DELETE CASCADE, FOREIGN KEY (RaceID) REFERENCES Race (RaceID) ON DELETE CASCADE);",
            "CREATE TABLE IF NOT EXISTS Organizer (OrganizerID SERIAL PRIMARY KEY, Name VARCHAR(255) NOT NULL);",
            "CREATE TABLE IF NOT EXISTS CheckpointInRace (CheckpointID INT NOT NULL, RaceID INT NOT NULL, Position INT NOT NULL, TimeLimit TIMESTAMP, PRIMARY KEY (CheckpointID, RaceID), FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID) ON DELETE CASCADE, FOREIGN KEY (RaceID) REFERENCES Race (RaceID) ON DELETE CASCADE);",
            "CREATE TABLE IF NOT EXISTS CheckpointPassing (RunnerID INT NOT NULL, CheckpointID INT NOT NULL, PassingTime TIMESTAMP NOT NULL, PRIMARY KEY (RunnerID, CheckpointID), FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID) ON DELETE CASCADE, FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID) ON DELETE CASCADE);",
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
        try:
            await conn.execute(
                sa.text(f"INSERT INTO Runner (name) VALUES ('{runner.username}')")
            )
            return {"message": "Runner added"}
        except sa.exc.IntegrityError:
            raise HTTPException(status_code=400, detail="Username taken")


@router.post("/race")
async def create_race(race: Race, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                f"INSERT INTO Race (Name, startTime) VALUES ('{race.name}', '{race.start_time}') RETURNING RaceID"
            )
        )
        race_id = result.scalar()  # Fetch the returned race ID
    return {"message": "Race created", "race_id": race_id}


@router.post("/checkpoint")
async def post_checkpoint(checkpoint: Checkpoint, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text(
                f"INSERT INTO Checkpoint (DeviceID, Location) VALUES ({checkpoint.DeviceID}, '{checkpoint.Location}') RETURNING CheckpointID"
            )
        )
        checkpoint_id = result.scalar()  # Fetch the returned checkpoint ID
    return {"message": "Checkpoint added", "checkpoint_id": checkpoint_id}


@router.post("/add_runner_to_race")
async def add_runner_to_race(runner_in_race: RunnerInRace, dbc: deps.GetDbCtx):
    async with dbc as conn:
        # Directly use the RunnerID provided in the request
        runner_id = runner_in_race.RunnerID

        # Check if the runner exists
        runner_exists = await conn.execute(
            sa.text("SELECT 1 FROM Runner WHERE runnerid = :RunnerID"),
            {"RunnerID": runner_id},
        )
        if runner_exists.scalar() is None:
            raise HTTPException(status_code=404, detail="Runner not found")

        # Insert the runner into the race
        await conn.execute(
            sa.text(
                "INSERT INTO RunnerInRace (RunnerID, RaceID, TagID) VALUES (:RunnerID, :RaceID, :TagID)"
            ),
            {
                "RunnerID": runner_id,
                "RaceID": runner_in_race.RaceID,
                "TagID": runner_in_race.TagID,
            },
        )
        return {"message": "Runner added to the race"}


@router.post("/race/{race_id}/checkpoint/{checkpoint_id}/{position}")
async def add_checkpoint_to_race(
    race_id: int,
    checkpoint_id: int,
    position: int,
    dbc: deps.GetDbCtx,
    time_limit: Optional[str] = None,
):
    async with dbc as conn:
        # Check if the race and checkpoint exist
        race_check = await conn.execute(
            sa.text("SELECT * FROM Race WHERE RaceID = :race_id"), {"race_id": race_id}
        )
        if race_check.rowcount == 0:
            raise HTTPException(status_code=404, detail="Race not found")

        checkpoint_check = await conn.execute(
            sa.text("SELECT * FROM Checkpoint WHERE CheckpointID = :checkpoint_id"),
            {"checkpoint_id": checkpoint_id},
        )
        if checkpoint_check.rowcount == 0:
            raise HTTPException(status_code=404, detail="Checkpoint not found")

        # Convert time_limit from string to datetime.datetime object if provided
        parsed_time_limit = None
        if time_limit:
            try:
                parsed_time_limit = datetime.strptime(time_limit, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid time_limit format. Use 'YYYY-MM-DD HH:MM:SS'.",
                )

        # Add the checkpoint to the race with the specified position and optional time limit
        await conn.execute(
            sa.text(
                "INSERT INTO CheckpointInRace (RaceID, CheckpointID, Position, TimeLimit) VALUES (:race_id, :checkpoint_id, :position, :parsed_time_limit)"
            ),
            {
                "race_id": race_id,
                "checkpoint_id": checkpoint_id,
                "position": position,
                "parsed_time_limit": parsed_time_limit,  # Corrected key here
            },
        )
    return {"message": "Checkpoint added to race", "status_code": 200}


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
            await pg_notify(conn, "all", "New checkpoint passing added")  # Notify the websocket that a new passing was added to update the live feed.
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


@router.delete("/race/{race_id}")
async def delete_race(race_id: int, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text("DELETE FROM Race WHERE RaceID = :race_id"),
            {"race_id": race_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Race not found")
        return {"message": "Race deleted successfully"}


@router.delete("/runner/{runner_id}")
async def delete_runner(runner_id: int, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text("DELETE FROM Runner WHERE RunnerID = :runner_id"),
            {"runner_id": runner_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Runner not found")
        return {"message": "Runner deleted successfully"}


@router.delete("/checkpoint/{checkpoint_id}")
async def delete_checkpoint(checkpoint_id: int, dbc: deps.GetDbCtx):
    async with dbc as conn:
        result = await conn.execute(
            sa.text("DELETE FROM Checkpoint WHERE CheckpointID = :checkpoint_id"),
            {"checkpoint_id": checkpoint_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
        return {"message": "Checkpoint deleted successfully"}


@router.get("/race/{race_id}/details")
async def get_race_details(race_id: int, dbc: deps.GetDbCtx):
    async with dbc as conn:
        race_details = await conn.execute(
            sa.text("SELECT RaceID, Name, startTime FROM Race WHERE RaceID = :race_id"),
            {"race_id": race_id},
        )
        race = race_details.mappings().first()
        if not race:
            raise HTTPException(status_code=404, detail="Race not found")

        # Fetch racers in this race
        racers = await conn.execute(
            sa.text(
                """
                SELECT r.RunnerID, r.name
                FROM Runner r
                JOIN RunnerInRace rir ON r.RunnerID = rir.RunnerID
                WHERE rir.RaceID = :race_id
                """
            ),
            {"race_id": race_id},
        )
        racers_list = racers.mappings().all()

        # Fetch checkpoints in this race with time limits
        checkpoints = await conn.execute(
            sa.text(
                """
                SELECT c.CheckpointID, c.Location, cir.TimeLimit
                FROM Checkpoint c
                JOIN CheckpointInRace cir ON c.CheckpointID = cir.CheckpointID
                WHERE cir.RaceID = :race_id
                """
            ),
            {"race_id": race_id},
        )
        checkpoints_list = checkpoints.mappings().all()

        # Fetch checkpoint passings for this race, including checkpoint locations
        checkpoint_passings = await conn.execute(
            sa.text(
                """
                SELECT cp.CheckpointID, cp.PassingTime, r.name AS RunnerName, c.Location AS CheckpointLocation
                FROM CheckpointPassing cp
                JOIN RunnerInRace rir ON cp.RunnerID = rir.RunnerID
                JOIN Runner r ON r.RunnerID = rir.RunnerID
                JOIN Checkpoint c ON cp.CheckpointID = c.CheckpointID
                WHERE rir.RaceID = :race_id
                """
            ),
            {"race_id": race_id},
        )
        passings_list = checkpoint_passings.mappings().all()

        return {
            "race": race,
            "racers": racers_list,
            "checkpoints": checkpoints_list,
            "checkpoint_passings": passings_list,
        }
