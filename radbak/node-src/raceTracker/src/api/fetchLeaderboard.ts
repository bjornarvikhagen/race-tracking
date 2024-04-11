import { BASEURL } from "../Constants";
import { Checkpoint, Runner } from "../pages/RaceOverview";

interface Race {
    runners: Runner[];
    checkpoints: Checkpoint[];
}

const fetchLeaderboard = async (raceId: number): Promise<Race | undefined> => {
    try {
        const checkpointinraceURL = `${BASEURL}/checkpointinrace/${raceId}`;
        const runnerURL = `${BASEURL}/runners/${raceId}`;

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
        
        const extractCheckpoints = (data: string) => {
            const tupleRegexCheckpoints = /\((\d+),\s*(\d+),\s*(datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)|None)\)/g;
            const checkpointsDataArray: Checkpoint[] = [];
            let match;
        
            while ((match = tupleRegexCheckpoints.exec(data)) !== null) {
                const [, id, value, timeMatch] = match;
                let timeLimit: Date | null = null;
                if (timeMatch !== 'None') {
                    const [, year, month, day, hour, minute] = timeMatch.match(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)!.map(Number);
                    timeLimit = new Date(year, month - 1, day, hour, minute);
                } else { 
                    timeLimit = null; 
                }
                checkpointsDataArray.push({ id: parseInt(id), position: parseInt(value), timeLimit });
            }
            return checkpointsDataArray;
        };

        const extractRunners = (data: string) => {
            const tupleRegexRunners = /\((\d+),\s*'([^']+)'\)/g;
            const runnersDataArray: Runner[] = [];

            let match;
            while ((match = tupleRegexRunners.exec(data)) !== null) {
                const [, id, name] = match;
                runnersDataArray.push({ id: parseInt(id), name: name, times: {} });
            }
            return runnersDataArray;
        };

        const extractCheckpointPassings = (data: string) => {
            const tupleRegexPassings = /\((\d+),\s*(datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\))\)/g;
            const passings: { checkpointId: number; passingTime: Date | null }[] = [];
            let match;
            while ((match = tupleRegexPassings.exec(data)) !== null) {
                const [, checkpointId, timeMatch] = match;
                let passingTime: Date | null = null;
                if (timeMatch !== 'None') {
                    const [, year, month, day, hour, minute] = timeMatch.match(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)!.map(Number);
                    passingTime = new Date(year, month - 1, day, hour, minute);
                }
                passings.push({ checkpointId: parseInt(checkpointId), passingTime });
            }
            return passings;
        };
        

        // Process data to correct format
        // First format checkpoints
        const checkpoints: Checkpoint[] = extractCheckpoints(checkpointsData).map((checkpoint: any) => ({
            id: checkpoint.id,
            position: checkpoint.position,
            timeLimit: checkpoint.timeLimit !== null ? checkpoint.timeLimit : undefined
        }));

        // Then format runners
        const runners: Runner[] = extractRunners(runnersData).map((runner: any) => ({
            id: runner.id,
            name: runner.name,
            times: {}
        }));

        // Add times to runners
        await Promise.all(runners.map(async (runner) => {
            const checkpointPassingsURL = `${BASEURL}/checkpointpassings/${runner.id}`;
            const response = await fetch(checkpointPassingsURL);
            if (!response.ok) {
                throw new Error('Failed to fetch checkpoint passings');
            }
            const checkpointPassingsData = await response.json();
            const passings = extractCheckpointPassings(checkpointPassingsData);
            passings.forEach((passing) => {
                if (passing.passingTime !== null) {
                    runner.times[passing.checkpointId] = passing.passingTime;
                }
            });
        }));

        console.log(checkpoints);
        console.log(runners);
    
        return { runners: runners, checkpoints: checkpoints };
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return undefined;
    }
};

export default fetchLeaderboard;
