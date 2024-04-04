// for the time being just mock the data

import { BASEURL } from "../Constants";


const fetchRaces = async () => {
    try {
        const racesURL = `${BASEURL}/races`;
        const response = await fetch(racesURL);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
    }
};

export default fetchRaces;



    const races = [
        { id: 10987265, name: "Krukes Challenge 2019", startTime: "2019-06-01T12:00:00Z" },
        { id: 10987266, name: "Krukes Challenge 2020", startTime: "2020-06-01T12:00:00Z" },
        { id: 10987267, name: "Krukes Challenge 2021", startTime: "2021-06-01T12:00:00Z" },
        { id: 10987268, name: "Krukes Challenge 2022", startTime: "2022-06-01T12:00:00Z" },
    ];

