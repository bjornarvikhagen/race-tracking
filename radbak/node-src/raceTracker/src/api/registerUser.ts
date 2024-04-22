import { BASEURL } from "../Constants";

const registerUser = async (username: string) => {
  try {
    const endpoint = `${BASEURL}/runner`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      // Parsing response to get server-side error message
      const errorData = await response.json();
      throw new Error(
        `Network response was not ok: ${response.statusText} - ${errorData.detail}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Failed to register user:", error);
    throw error; // Rethrowing the error for handling it further up in the call stack
  }
};

export default registerUser;
