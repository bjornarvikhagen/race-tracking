import { BASEURL } from "../Constants";


const fetchRunners = async () => {
  try {
    const runnersURL = `${BASEURL}/runners`;
    const response = await fetch(runnersURL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

export default fetchRunners;

