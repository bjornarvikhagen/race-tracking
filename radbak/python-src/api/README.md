# Race Tracking API Documentation

The Race Tracking API is designed for managing and tracking participants and events in races. This API lets you interact with a database managing races, runners, checkpoints, and more. Below is the detailed documentation of every endpoint, including their parameters and expected responses.

## Testing the whole flow
### GET `/Test_flow`
This endpoint is used to test the whole flow of the application. It will create a race, a runner, a checkpoint, and a checkpoint passing. It will then return the checkpoint passing details with the runner name.

## Setup and Teardown Endpoints

### POST `/setup_db`
Initializes the database with necessary tables.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Database setup completed successfully"}`

### POST `/delete_db`
Drops all database tables related to the application, effectively cleaning the database.
- **Method**: POST
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Database deletion completed successfully"}`
- **Error Response**:
  - **Code**: 500 Internal Server Error
  - **Content**: `{"message": "Error deleting database"}`

## Race Management

### GET `/races`
Retrieves a list of all races.
- **Response Model**: List of `RaceOut`
  - Each `RaceOut` contains:
    - `RaceID`: The unique identifier of the race.
    - `Name`: The name of the race.
    - `startTime`: The start time of the race.

### POST `/race`
Creates a new race with the provided details.
- **Request Body**: `Race`
  - `name`: The name of the race.
  - `start_time`: The start time of the race.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Race created"}`

## Runner Management

### GET `/runners`
Fetches a list of all runners.
- **Response**:
  - **Code**: 200 OK
  - **Content**: List of runners, each containing their unique identifiers and names.

### POST `/runner`
Registers a new runner in the database.
- **Request Body**: `Runner`
  - `name`: The name of the runner.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Runner added"}`

## Checkpoint Management

### GET `/checkpoints`
Retrieves all checkpoints from the database.
- **Response**:
  - **Code**: 200 OK
  - **Content**: A list of checkpoints with their IDs, device IDs, and locations.

### POST `/checkpoint`
Adds a new checkpoint to the database.
- **Request Body**: `Checkpoint`
  - `CheckpointID`: The unique identifier for the checkpoint.
  - `DeviceID`: The device identifier associated with the checkpoint.
  - `Location`: The location of the checkpoint.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Checkpoint added"}`

## Race Participation

### POST `/register_tag`
Registers a runner's tag for participation in a race.
- **Request Body**: `RunnerInRace`
  - `RunnerID`: The unique identifier of the runner.
  - `RaceID`: The unique identifier of the race.
  - `TagID`: The tag assigned to the runner for this race.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Tag registered for runner in race"}`

### GET `/runners/{race_id}`
Fetches all runners participating in a specified race.
- **Parameters**:
  - `race_id`: The unique identifier of the race.
- **Response**:
  - **Code**: 200 OK
  - **Content**: A list of runners in the specified race, including their names and tag IDs.

## Checkpoint Passings

### POST `/checkpoint_passing`
Records a runner's passing through a checkpoint.
- **Request Body**: `CheckpointPassing`
  - `TagID`: The tag ID of the runner.
  - `CheckpointID`: The ID of the checkpoint.
  - `PassingTime`: The timestamp when the runner passed through the checkpoint.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Checkpoint passing added"}`

### GET `/checkpointpassings/{runner_id}`
Retrieves all checkpoint passings for a specific runner.
- **Parameters**:
  - `runner_id`: The unique identifier of the runner.
- **Response**:
  - **Code**: 200 OK
  - **Content**: A list of checkpoint passings, including checkpoint IDs and passing times.

## Miscellaneous

### POST `/seed_db`
Seeds the database with sample data for demonstration or testing purposes.
- **Response**:
  - **Code**: 200 OK
  - **Content**: `{"message": "Database seeded with sample data"}`

### GET `/tables`
Lists all tables in the database.
- **Response**:
  - **Code**: 200 OK
  - **Content**: A list of user-defined table names in the database.

## Using and testing the API
- **Running backend**
  - poetry run dev
  - will run on port 80
  - run delete_db endpoint if used before
  - run setup_db endpoint to create tables
  - run seed_db endpoint to populate tables with data, or:
    - run post_race endpoint to create a race
    - run post_runner endpoint to create a runner
    - run post_checkpoint endpoint to create a checkpoint
    - run register_tag endpoint to register a tag for a runner in a race
  - run post_checkpoint_passing endpoint to create a checkpoint passing
    