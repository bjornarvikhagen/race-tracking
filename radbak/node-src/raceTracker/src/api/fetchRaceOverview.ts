interface Race {
    id: number;
    name: string;
    startTime: string;
    runners: {
        id: number;
        name: string;
        times: { [checkpoint: number]: string };
    }[];
    checkpoints: {
        id: number;
        position: number;
        timeLimit: string | null;
    }[];
}

const fetchRaceOverview = async (raceId: number): Promise<Race | undefined> => {
    // mocking getting data from an API
    const races: { [id: string]: Race } = {
        10987265: {
            id: 10987265,
            name: "Krukes Challenge 2019",
            startTime: "2019-06-01T12:00:00Z",
            runners: [
                {
                    id: 1,
                    name: "Knut",
                    times: {
                        1: "12:59",
                        2: "14:01",
                        3: "13:49",
                        4: "15:56",
                    },
                },
                {
                    id: 2,
                    name: "Erik",
                    times: { 1: "12:10" },
                },
            ],
            checkpoints: [
                { id: 1, position: 1, timeLimit: "13:00" },
                { id: 2, position: 2, timeLimit: "13:45" },
                { id: 3, position: 3, timeLimit: "14:30" },
                { id: 4, position: 4, timeLimit: "15:15" },
                { id: 5, position: 5, timeLimit: "16:00" },
            ],
        },
        10987266: {
            id: 10987266,
            name: "Krukes Challenge 2020",
            startTime: "2020-06-01T12:00:00Z",
            runners: [
                {
                    id: 1,
                    name: "Knut",
                    times: {
                        1: "13:15",
                        2: "13:29",
                        3: "14:49",
                        4: "16:56",
                    },
                },
                {
                    id: 2,
                    name: "Erik",
                    times: { 1: "14:10" },
                },
            ],
            checkpoints: [
                { id: 1, position: 1, timeLimit: "13:00" },
                { id: 2, position: 2, timeLimit: null },
                { id: 3, position: 3, timeLimit: "15:00" },
                { id: 4, position: 4, timeLimit: null },
                { id: 5, position: 5, timeLimit: "17:00" },
            ],
        },
        10987267: {
            id: 10987267,
            name: "Krukes Challenge 2021",
            startTime: "2021-06-01T12:00:00Z",
            runners: [
                {
                    id: 1,
                    name: "Knut",
                    times: {
                        1: "13:20",
                        2: "13:35",
                        3: "14:55",
                        4: "16:45"
                    }
                },
                {
                    id: 2,
                    name: "Erik",
                    times: {
                        "1": "12:45",
                        "2": "13:50",
                        "3": "15:20",
                        "4": "17:10"
                    }
                }
            ],
            checkpoints: [
                { id: 1, position: 1, timeLimit: "13:00" },
                { id: 2, position: 2, timeLimit: null },
                { id: 3, position: 3, timeLimit: "15:30" },
                { id: 4, position: 4, timeLimit: null },
                { id: 5, position: 5, timeLimit: "17:30" }
            ]
        },
        10987268: {
            id: 10987268,
            name: "Krukes Challenge 2022",
            startTime: "2022-06-01T12:00:00Z",
            runners: [
                {
                    id: 1,
                    name: "Knut",
                    times: {
                        1: "13:30",
                        2: "13:40",
                        3: "14:50",
                        4: "16:55"
                    }
                },
                {
                    id: 2,
                    name: "Erik",
                    times: {
                        1: "12:55",
                        2: "13:45",
                        3: "15:10",
                        4: "17:20"
                    }
                }
            ],
            checkpoints: [
                { id: 1, position: 1, timeLimit: "13:15" },
                { id: 2, position: 2, timeLimit: null },
                { id: 3, position: 3, timeLimit: "15:45" },
                { id: 4, position: 4, timeLimit: null },
                { id: 5, position: 5, timeLimit: "18:00" }
            ]
        }
    };

    return races[raceId];
};

export default fetchRaceOverview;
