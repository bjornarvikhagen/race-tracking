import { useNavigate } from "react-router-dom";
import "./Navbar.css"; // Import your CSS file for styling

const Navbar = () => {
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="navbar">
      <div className="nav-item" onClick={() => navigateTo("/")}>
        Home
      </div>
      <div className="nav-item" onClick={() => navigateTo("/races")}>
        Current Races
      </div>
      <div className="nav-item" onClick={() => navigateTo("/registerChip")}>
        Register Chip
      </div>
    </div>
  );
};

export default Navbar;
