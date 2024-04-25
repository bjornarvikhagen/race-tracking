export const ADMIN_PASSWORD = "torgeir_er_kul"  // Admin password
// export const BASEURL = "http://localhost:80"  // Current local host URL and Port

interface Window {
  Cypress?: any;
} // Boilerplate to make typescript happy

// This is a hacky solution, but it works for now.
// Set baseURL based on whether it is accessed through docker-services (cypress container) or browser
export const BASEURL = !!(window as Window).Cypress
  ? "http://python-api"
  : "http://localhost:64683"; // Current local host URL and Port
