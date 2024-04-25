import { BASEURL } from "../Constants";

interface Race {
  name: string;
  start_time: Date;
}

const createRace = async (race: Race) => {
  try {
    const endpoint = `${BASEURL}/race`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(race),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error ${response.status}: ${response.statusText} - ${errorData.detail}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to create race:", error);
    throw error;
  }
};

export { createRace }




interface Checkpoint {
  DeviceID: number;
  Location: string;
}

const createCheckpoint = async (checkpoint: Checkpoint) => {
  try {
    const endpoint = `${BASEURL}/checkpoint`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkpoint),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error ${response.status}: ${response.statusText} - ${errorData.detail}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to create checkpoint:", error);
    throw error;
  }
};

export { createCheckpoint }




interface CheckpointInRace {
  race_id: number;
  checkpoint_id: number;
  position: number;
  time_limit: string;
}

const addCheckpointToRace = async ({ race_id, checkpoint_id, position, time_limit }: CheckpointInRace) => {
  try {
    const endpoint = `${BASEURL}/race/${race_id}/checkpoint/${checkpoint_id}/${position}`;
    console.log("Sending to endpoint:", endpoint);
    console.log("Data being sent:", { time_limit });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ time_limit: time_limit }) // Ensure this key matches the backend expectation
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Response error:", errorData);
      throw new Error(`Error ${response.status}: ${response.statusText} - ${errorData.detail}`);
    }
    const responseData = await response.json();
    console.log("Response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Failed to add checkpoint to race:", error);
    throw error;
  }
};


export { addCheckpointToRace };

