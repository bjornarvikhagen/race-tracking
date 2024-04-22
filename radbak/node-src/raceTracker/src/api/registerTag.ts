import { BASEURL } from "../Constants";

interface RunnerInRace {
  RunnerID: number;
  RaceID: number;
  TagID: string;
}

const registerTag = async (runnerInRace: RunnerInRace) => {
  try {
    const endpoint = `${BASEURL}/add_runner_to_race`; // Updated to match the server-side route
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(runnerInRace),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error ${response.status}: ${response.statusText} - ${errorData.detail}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Failed to register runner in race:", error);
    throw error; // Rethrowing the error for further handling
  }
};

export default registerTag;
