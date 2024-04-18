import { BASEURL } from "../Constants";

interface RunnerInRace {
  RunnerID: number;
  RaceID: number;
  TagID: string;
}

const registerTag = async (runnerInRace: RunnerInRace) => {
  try {
    const endpoint = `${BASEURL}/register_tag`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runnerInRace),
    });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Failed to register runner in race:', error);
    throw error;
  }
};

export default registerTag;
