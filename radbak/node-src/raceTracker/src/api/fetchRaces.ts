// for the time being just mock the data

import { BASEURL } from "../Constants";

const fetchRaces = async () => {
  try {
    const racesURL = `${BASEURL}/races`;
    console.log("Trying to fetch races from ", racesURL);
    console.log("Window.locaiton ", window.location);
    console.log("Window.locaiton.host ", window.location.host);
    console.log("Window.locaiton.hostname ", window.location.hostname);
    const response = await fetch(racesURL);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
  }
};

export default fetchRaces;
