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
        console.log("CheckpointRaw data: ", checkpointsData)
        console.log("RUnnersRawData data: ", runnersData)
        
        // const extractCheckpoints = (data: string) => {
        //     const tupleRegexCheckpoints = /\((\d+),\s*(\d+),\s*(datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)|None)\)/g;
        //     const checkpointsDataArray: Checkpoint[] = [];
        //     let match;
        
        //     while ((match = tupleRegexCheckpoints.exec(data)) !== null) {
        //         const [, id, value, timeMatch] = match;
        //         let timeLimit: Date | null = null;
        //         if (timeMatch !== 'None') {
        //             const [, year, month, day, hour, minute] = timeMatch.match(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)!.map(Number);
        //             timeLimit = new Date(year, month - 1, day, hour, minute);
        //         } else { 
        //             timeLimit = null; 
        //         }
        //         checkpointsDataArray.push({ id: parseInt(id), position: parseInt(value), timeLimit });
        //     }
        //     return checkpointsDataArray;
        // };

        // const extractRunners = (data: string) => {
        //     const tupleRegexRunners = /\((\d+),\s*'([^']+)'\)/g;
        //     const runnersDataArray: Runner[] = [];

        //     let match;
        //     while ((match = tupleRegexRunners.exec(data)) !== null) {
        //         const [, id, name] = match;
        //         runnersDataArray.push({ id: parseInt(id), name: name, times: {} });
        //     }
        //     return runnersDataArray;
        // };

        // const extractCheckpointPassings = (data: string) => {
        //     const tupleRegexPassings = /\((\d+),\s*(datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\))\)/g;
        //     const passings: { checkpointId: number; passingTime: Date | null }[] = [];
        //     let match;
        //     while ((match = tupleRegexPassings.exec(data)) !== null) {
        //         const [, checkpointId, timeMatch] = match;
        //         let passingTime: Date | null = null;
        //         if (timeMatch !== 'None') {
        //             const [, year, month, day, hour, minute] = timeMatch.match(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)!.map(Number);
        //             passingTime = new Date(year, month - 1, day, hour, minute);
        //         }
        //         passings.push({ checkpointId: parseInt(checkpointId), passingTime });
        //     }
        //     return passings;
        // };
        

        // First format checkpoints
        // TODO: Keep same format on front and backend so we can avoid this.
        const checkpoints: Checkpoint[] = checkpointsData.map((checkpoint: any) => ({
            id: checkpoint.checkpointid,
            position: checkpoint.position,
            timeLimit: checkpoint.timelimit !== null ? checkpoint.timelimit : undefined
        }));

        console.log("RunnersData: ", runnersData)
        console.log("ExtracedRunners: ", checkpoints)

        // Then format runners
        const runners: Runner[] = runnersData.map((runner: any) => ({
            id: runner.runnerid,
            name: runner.name,
            tagid: runner.tagid,
            times: {}
        }));

        // Add times to runners
        await Promise.all(runners.map(async (runner) => {
            const checkpointPassingsURL = `${BASEURL}/checkpointpassings/${runner.id}`;
            const response = await fetch(checkpointPassingsURL);
            if (!response.ok) {
                throw new Error('Failed to fetch checkpoint passings');
            }
            const passings = await response.json();
            console.log("Passings data: ", passings) // PAssings should be: [{checkpointId: 1, passingTime: Mon May 01 2023 11:00:00 GMT+0200 (sentraleuropeisk sommertid)}]
            // const passings = extractCheckpointPassings(checkpointPassingsData);

            // TODO: Harald. Format passings so that they work.

            console.log("Passings data: ", passings) // PAssings should be: [{checkpointId: 1, passingTime: Mon May 01 2023 11:00:00 GMT+0200 (sentraleuropeisk sommertid)}]
            passings.forEach((passing) => {
                if (passing.passingTime !== null) {
                    runner.times[passing.checkpointId] = passing.passingTime;
                }
            });
        }));

        console.log("Checkpoints to be fetched:", checkpoints);
        console.log("Runners to be fetched:", runners);
        


        return { runners: runners, checkpoints: checkpoints };
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return undefined;
    }
};

export default fetchLeaderboard;
