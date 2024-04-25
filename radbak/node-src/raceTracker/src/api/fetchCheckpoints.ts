import { BASEURL } from "../Constants";

const fetchCheckpoints = async () => {
    try {
        const checkpointsURL = `${BASEURL}/checkpoints`;
        const response = await fetch(checkpointsURL);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
    }
};

export default fetchCheckpoints;
