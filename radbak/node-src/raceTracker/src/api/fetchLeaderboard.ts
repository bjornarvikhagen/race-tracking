import { BASEURL } from "../Constants";
import { Checkpoint, Runner } from "../pages/RaceOverview";


interface Race {
    runners: Runner[];
    checkpoints: Checkpoint[];
}

const fetchLeaderboard = async (raceId: number): Promise<Race | undefined> => {
    try {
        // URLs to initial fetch from
        const checkpointinraceURL = `${BASEURL}/checkpointinrace/${raceId}`;
        const runnerURL = `${BASEURL}/runner/${raceId}`;

        // Query to fetch from the URL
        const [checkpointsResponse, runnersResponse] = await Promise.all([
            fetch(checkpointinraceURL),
            fetch(runnerURL)
        ]);

        // Check if the fetch was successful
        if (!checkpointsResponse.ok || !runnersResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        // Convert the response to JSON
        const [checkpointsData, runnersData] = await Promise.all([
            checkpointsResponse.json(),
            runnersResponse.json()
        ]);

        // Process data to correct format
        // First format checkpoints
        const checkpoints: Checkpoint[] = checkpointsData.map((checkpoint: any) => ({
            id: checkpoint.checkpointid,
            position: checkpoint.position,
            timeLimit: checkpoint.timelimit
        }));

        // Then format runners
        const runners: Runner[] = runnersData.map((runner: any) => ({
            id: runner.runnerid,
            name: runner.name,
            times: {}
        }));

        // Add times to runners
        // To do this, we need to fetch the times for each runner. We can do this by fetching from the URL
        await Promise.all(runners.map(async (runner) => {
            const checkpointPassingsURL = `${BASEURL}/checkpointpassing/${runner.id}`;
            const response = await fetch(checkpointPassingsURL);
            if (!response.ok) {
                throw new Error('Failed to fetch checkpoint passings');
            }
            const checkpointPassings = await response.json();
            checkpointPassings.forEach((passing: any) => { // passing is an object with checkpointid and passingtime
                const checkpointId = passing.checkpointid;
                const time = passing.passingtime;
                // Add passing time to runner's times
                runner.times[checkpointId] = time;
            });
        }));

        // Finally, combine the data into Race object and return it
        // Combine data into Race object
        const race: Race = {
            runners: runners,
            checkpoints: checkpoints
        };

        return race;
        
    } catch (error) {
        console.error("Failed to fetch leaderboard data", error);
        return undefined
    }
};

export default fetchLeaderboard;

// GOAL: get data in following format
//
//         runners: [
//             {
//                 id: 1,
//                 name: "Knut",
//                 times: {
//                     1: "12:59",
//                     2: "14:01",
//                     3: "13:49",
//                     4: "15:56",
//                 },
//             },
//             {
//                 id: 2,
//                 name: "Erik",
//                 times: { 1: "12:10" },
//             },
//         ],
//         checkpoints: [
//             { id: 1, position: 1, timeLimit: "13:00" },
//             { id: 2, position: 2, timeLimit: "13:45" },
//             { id: 3, position: 3, timeLimit: "14:30" },
//             { id: 4, position: 4, timeLimit: "15:15" },
//             { id: 5, position: 5, timeLimit: "16:00" },
//         ],
//



    // OLD CODE FOR DUMMY DATA, SHOULD BE REMOVED AFTER TESTING
    //
    // mocking getting data from an API
    // const races: { [id: string]: Race } = {
    //     10987265: {
    //         // id: 10987265,
    //         // name: "Krukes Challenge 2019",
    //         // startTime: "2019-06-01T12:00:00Z",
    //         runners: [
    //             {
    //                 id: 1,
    //                 name: "Knut",
    //                 times: {
    //                     1: "12:59",
    //                     2: "14:01",
    //                     3: "13:49",
    //                     4: "15:56",
    //                 },
    //             },
    //             {
    //                 id: 2,
    //                 name: "Erik",
    //                 times: { 1: "12:10" },
    //             },
    //         ],
    //         checkpoints: [
    //             { id: 1, position: 1, timeLimit: "13:00" },
    //             { id: 2, position: 2, timeLimit: "13:45" },
    //             { id: 3, position: 3, timeLimit: "14:30" },
    //             { id: 4, position: 4, timeLimit: "15:15" },
    //             { id: 5, position: 5, timeLimit: "16:00" },
    //         ],
    //     },
    //     10987266: {
    //         // id: 10987266,
    //         // name: "Krukes Challenge 2020",
    //         // startTime: "2020-06-01T12:00:00Z",
    //         runners: [
    //             {
    //                 id: 1,
    //                 name: "Knut",
    //                 times: {
    //                     1: "13:15",
    //                     2: "13:29",
    //                     3: "14:49",
    //                     4: "16:56",
    //                 },
    //             },
    //             {
    //                 id: 2,
    //                 name: "Erik",
    //                 times: { 1: "14:10" },
    //             },
    //         ],
    //         checkpoints: [
    //             { id: 1, position: 1, timeLimit: "13:00" },
    //             { id: 2, position: 2, timeLimit: null },
    //             { id: 3, position: 3, timeLimit: "15:00" },
    //             { id: 4, position: 4, timeLimit: null },
    //             { id: 5, position: 5, timeLimit: "17:00" },
    //         ],
    //     },
    //     10987267: {
    //         // id: 10987267,
    //         // name: "Krukes Challenge 2021",
    //         // startTime: "2021-06-01T12:00:00Z",
    //         runners: [
    //             {
    //                 id: 1,
    //                 name: "Knut",
    //                 times: {
    //                     1: "13:20",
    //                     2: "13:35",
    //                     3: "14:55",
    //                     4: "16:45"
    //                 }
    //             },
    //             {
    //                 id: 2,
    //                 name: "Erik",
    //                 times: {
    //                     "1": "12:45",
    //                     "2": "13:50",
    //                     "3": "15:20",
    //                     "4": "17:10"
    //                 }
    //             }
    //         ],
    //         checkpoints: [
    //             { id: 1, position: 1, timeLimit: "13:00" },
    //             { id: 2, position: 2, timeLimit: null },
    //             { id: 3, position: 3, timeLimit: "15:30" },
    //             { id: 4, position: 4, timeLimit: null },
    //             { id: 5, position: 5, timeLimit: "17:30" }
    //         ]
    //     },
    //     10987268: {
    //         // id: 10987268,
    //         // name: "Krukes Challenge 2022",
    //         // startTime: "2022-06-01T12:00:00Z",
    //         runners: [
    //             {
    //                 id: 1,
    //                 name: "Knut",
    //                 times: {
    //                     1: "13:30",
    //                     2: "13:40",
    //                     3: "14:50",
    //                     4: "16:55"
    //                 }
    //             },
    //             {
    //                 id: 2,
    //                 name: "Erik",
    //                 times: {
    //                     1: "12:55",
    //                     2: "13:45",
    //                     3: "15:10",
    //                     4: "17:20"
    //                 }
    //             }
    //         ],
    //         checkpoints: [
    //             { id: 1, position: 1, timeLimit: "13:15" },
    //             { id: 2, position: 2, timeLimit: null },
    //             { id: 3, position: 3, timeLimit: "15:45" },
    //             { id: 4, position: 4, timeLimit: null },
    //             { id: 5, position: 5, timeLimit: "18:00" }
    //         ]
    //     }
    // };
    //
    // return races[raceId];
    //
    // END OF OLD CODE