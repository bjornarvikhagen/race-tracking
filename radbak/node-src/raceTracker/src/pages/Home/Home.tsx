import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("admin") === "true";

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home">
      <h1>Ultra Race Tracking System</h1>
      <div className="button-container">
        <button onClick={() => navigateTo("/races")}>Current Races</button>
        <button onClick={() => navigateTo("/register-tag")}>Register Race Participant</button>
        <button onClick={() => navigateTo("/register-user")}>Register User</button>


        {isAdmin ? (
          <button onClick={() => navigateTo("/admin")}>Create Race</button>
        ) : (
          <div style={{ width: '300px', height: '0px' }} /> // Invisible placeholder
        )}
        <button onClick={() => navigateTo("/login")}>Login</button>
      </div>
    </div>
  );
};

export default Home;
