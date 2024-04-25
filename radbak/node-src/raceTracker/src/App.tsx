import "./App.css";
import Races from "./pages/Races";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RaceOverview from "./pages/RaceOverview";
import Login from "./pages/Login";
import Navbar from "./components/Navbar/Navbar";
import AdminPage from "./pages/CreateRace/CreateRace";
import RegisterUser from "./pages/RegisterUser";
import RegisterTag from "./pages/RegisterTag"
import Home from "./pages/Home/Home";

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/races" element={<Races />} />
            <Route path="/race/:raceId" element={<RaceOverview />} />
            <Route path="/register-tag" element={<RegisterTag />} />
            <Route path="/register-user" element={<RegisterUser />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
