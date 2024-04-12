import { BASEURL } from "../Constants";
import { Checkpoint, Runner } from "../pages/RaceOverview";

interface Race {
    runners: Runner[];
    checkpoints: Checkpoint[];
}

interface Passing {
    checkpointId: string;
    passingTime: Date | null; 
}


const addTimesToRunners = async (runners: Runner[]) => {
     // Add times to runners
     const updatedRunners: Runner[] = JSON.parse(JSON.stringify(runners)) // Deep copy
     await Promise.all(updatedRunners.map(async (runner: Runner) => {
        const checkpointPassingsURL = `${BASEURL}/checkpointpassings/${runner.id}`;
        const response = await fetch(checkpointPassingsURL);
        if (!response.ok) {
            throw new Error('Failed to fetch checkpoint passings');
        }
        const passingsresponse = await response.json();

        // Format passings to correct format // TODO: get consistent naming.
        const passings = passingsresponse.map((passing: { passingtime: Date | null; checkpointid: string; }) => ({
            checkpointId: passing.checkpointid,
            passingTime: passing.passingtime
        }));

        passings.forEach((passing: Passing) => {
            if (passing.passingTime !== null) {
                runner.times[passing.checkpointId] = passing.passingTime;
            }
        });

    }));
    return updatedRunners;
}

const fetchLeaderboard = async (raceId: number): Promise<Race | undefined> => {
    try {
        const checkpointinraceURL = `${BASEURL}/checkpointinrace/${raceId}`;
        const runnerURL = `${BASEURL}/runners/${raceId}`;

        // Fetch from APIs
        const [checkpointsResponse, runnersResponse] = await Promise.all([
            fetch(checkpointinraceURL),
            fetch(runnerURL)
        ]);

        if (!checkpointsResponse.ok || !runnersResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const [checkpointsData, runnersData] = await Promise.all([
            checkpointsResponse.json(),
            runnersResponse.json()
        ]);
        

        // First format checkpoints
        // TODO: Keep same format on front and backend so we can avoid this.
        const checkpoints: Checkpoint[] = checkpointsData.map((checkpoint: any) => ({
            id: checkpoint.checkpointid,
            position: checkpoint.position,
            timeLimit: checkpoint.timelimit !== null ? checkpoint.timelimit : undefined
        }));

        // Then format runners
        const runners: Runner[] = runnersData.map((runner: any) => ({
            id: runner.runnerid,
            name: runner.name,
            tagid: runner.tagid,
            times: {}
        }));

       
        const runnersWithTime = await addTimesToRunners(runners)

        return { runners: runnersWithTime, checkpoints: checkpoints };
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return undefined;
    }
};

export default fetchLeaderboard;
