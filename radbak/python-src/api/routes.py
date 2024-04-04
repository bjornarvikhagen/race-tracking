

from fastapi import APIRouter

from api import deps

from pydantic import BaseModel
import sqlalchemy as sa


    
router = APIRouter()


@router.get("/checkpoints")
async def get_checkpoints(
    dbc: deps.GetDbCtx,
):
    import sqlalchemy as sa

    async with dbc as conn:
        result = await conn.execute(sa.text("SELECT * FROM checkpoint"))
    blabla = result.fetchall()
    print(blabla)
    return {"stuff": str(blabla)}


class Checkpoint(BaseModel):
    CheckpointID: int
    DeviceID: int
    Location: int
    
@router.post("/checkpoint")
async def post_checkpoints(
    checkpoint: Checkpoint,
    dbc: deps.GetDbCtx
):
    import sqlalchemy as sa

    async with dbc as conn:
        result = await conn.execute(sa.text(f"INSERT INTO checkpoint VALUES ({checkpoint.CheckpointID}, {checkpoint.DeviceID}, {checkpoint.Location})"))
    #blabla = result.fetchall()
    #print(blabla)
    return result


@router.get("/checkpointinrace/{race_id}")
async def get_checkpoints_in_race(
    race_id: int,
    dbc: deps.GetDbCtx
):
    import sqlalchemy as sa

    async with dbc as conn:
        result = await conn.execute(sa.text(f"""
                    SELECT checkpointid, position, timelimit
                    FROM checkpointinrace WHERE raceid = {race_id}
                """))
    return {"result:": str(result.fetchall())}



@router.get("/runners/{race_id}")
async def get_runners_in_race(
    race_id: int,
    dbc: deps.GetDbCtx
):

    async with dbc as conn:
        result = await conn.execute(sa.text(f"""
                SELECT runnerid, name
                FROM runnersinrace NATURAL JOIN runner WHERE raceid = {race_id}
            """))
    return result


    
@router.get("/checkpointpassins/{runner_id}")
async def get_checkpoint_passings(
    runner_id: int,
    dbc: deps.GetDbCtx
):

    async with dbc as conn:
        result = await conn.execute(sa.text(f"""
                    SELECT checkpointid, passingtime
                    FROM checkpointpassing
                    WHERE runnerid = {runner_id}
                """))
    return {"result:": str(result.fetchall())}


class CheckpointPassing(BaseModel):
    DeviceID: int
    RFID: int
    
@router.post("/checkpoint_passing")
async def post_checkpoint_passing(
    passing: CheckpointPassing,
    dbc: deps.GetDbCtx
):

    async with dbc as conn:
        result = await conn.execute(sa.text(""""""))
        
    return result

    

@router.post("/setup_db")
async def setup_db(
    dbc: deps.GetDbCtx
):

    async with dbc as conn:
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS Checkpoint (
                CheckpointID SERIAL PRIMARY KEY,
                DeviceID VARCHAR(255) NOT NULL,
                Location VARCHAR(255) NOT NULL
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS Runner (
                RunnerID SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS Race (
                RaceID SERIAL PRIMARY KEY,
                Name VARCHAR(255) NOT NULL,
                startTime TIMESTAMP NOT NULL
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS RunnerInRace (
                RunnerID INT NOT NULL,
                RaceID INT NOT NULL,
                TagID VARCHAR(255) NOT NULL,
                PRIMARY KEY (RunnerID, RaceID),
                FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID),
                FOREIGN KEY (RaceID) REFERENCES Race (RaceID)
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS Organizer (
                OrganizerID SERIAL PRIMARY KEY,
                Name VARCHAR(255) NOT NULL
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS CheckpointInRace (
                CheckpointID INT NOT NULL,
                RaceID INT NOT NULL,
                Position INT NOT NULL,
                Timelimit TIMESTAMP,
                PRIMARY KEY (CheckpointID, RaceID),
                FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID),
                FOREIGN KEY (RaceID) REFERENCES Race (RaceID)
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS CheckpointPassing (
                RunnerID INT NOT NULL,
                CheckpointID INT NOT NULL,
                PassingTime TIMESTAMP NOT NULL,
                PRIMARY KEY (RunnerID, CheckpointID),
                FOREIGN KEY (RunnerID) REFERENCES Runner (RunnerID),
                FOREIGN KEY (CheckpointID) REFERENCES Checkpoint (CheckpointID)
            );
        """))
        await conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS OrganizedBy (
                OrganizerID INT NOT NULL,
                RaceID INT NOT NULL,
                PRIMARY KEY (OrganizerID, RaceID),
                FOREIGN KEY (OrganizerID) REFERENCES Organizer (OrganizerID),
                FOREIGN KEY (RaceID) REFERENCES Race (RaceID)
            );
        """))
        await conn.execute(sa.text("""
            INSERT INTO race VALUES (0, 'THE GRAND TEST RACE', TIMESTAMP '2025-01-01 16:00:00' );
        """))
        await conn.execute(sa.text("""
            INSERT INTO runner VALUES (0, 'Ole');
        """))
        await conn.execute(sa.text("""
            INSERT INTO runner VALUES (1, 'Dole');
        """))
        await conn.execute(sa.text("""
            INSERT INTO runner VALUES (2, 'Doffen');
        """))
        
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (0, 0, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (0, 0, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (1, 1, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (1, 0, 1);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (2, 0, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (2, 0, 2);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (3, 1, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (3, 0, 3);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (4, 0, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (4, 0, 4);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpoint VALUES (5, 1, 0);
        """))
        await conn.execute(sa.text("""
            INSERT INTO checkpointinrace VALUES (5, 0, 5);
        """))
        
        
@router.post("/delete_db")
async def delete_db(
    dbc: deps.GetDbCtx
):

    async with dbc as conn:
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS Checkpoint CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS Runner CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS RunnerInRace CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS Race CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS Organizer CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS CheckpointInRace CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS CheckpointPassing CASCADE;
        """))
        await conn.execute(sa.text("""
            DROP TABLE IF EXISTS OrganizedBy CASCADE;
        """))
        
        
@router.get("/tables")
async def tables(
    dbc: deps.GetDbCtx,
):

    async with dbc as conn:
        result = await conn.execute(sa.text("""
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE='BASE TABLE'"""))
    blabla = [a[0] for a in result.fetchall() if not (a[0].startswith('pg') or a[0].startswith('sql'))]
    return {"stuff": str(blabla)}