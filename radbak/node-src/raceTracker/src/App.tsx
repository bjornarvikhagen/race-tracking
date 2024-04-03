import "./App.css";
import Races from "./pages/Races";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RaceOverview from "./pages/RaceOverview";
import Navbar from "./components/NavBar";

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <>
          <Navbar />
          <Routes>
            <Route path="/races" element={<Races />} />
            <Route path="/race/:raceId" element={<RaceOverview />} />
          </Routes>
        </>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
