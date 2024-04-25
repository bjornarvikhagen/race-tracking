import { BASEURL } from "../Constants";

const fetchRaces = async () => {
  try {
    const racesURL = `${BASEURL}/races`;
    const response = await fetch(racesURL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

export default fetchRaces;
