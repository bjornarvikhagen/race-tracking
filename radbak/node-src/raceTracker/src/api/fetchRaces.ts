// for the time being just mock the data


const fetchRaces = async () => {
    const races = [
        { id: 10987265, name: "Krukes Challenge 2019", startTime: "2019-06-01T12:00:00Z" },
        { id: 10987266, name: "Krukes Challenge 2020", startTime: "2020-06-01T12:00:00Z" },
        { id: 10987267, name: "Krukes Challenge 2021", startTime: "2021-06-01T12:00:00Z" },
        { id: 10987268, name: "Krukes Challenge 2022", startTime: "2022-06-01T12:00:00Z" },
    ];

    return races;
};

export default fetchRaces;