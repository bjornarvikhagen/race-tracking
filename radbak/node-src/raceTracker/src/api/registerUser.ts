import { BASEURL } from "../Constants";

const registerUser = async (name: string) => {
  try {
    const endpoint = `${BASEURL}/runner`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Failed to send username:', error);
    throw error;
  }
};

export default registerUser;
