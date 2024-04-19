import { useNavigate } from "react-router-dom";
import "./RacesList.css";

const RacesList = ({
  races,
}: {
  races: { raceid: number; name: string; startTime: string }[];
}) => {
  const navigate = useNavigate();

  const handleRaceClick = (raceId: number) => {
    navigate(`/race/${raceId}`);
  };

  // return list of races with links to view
  return (
    <div className="race-list-container">
      <h2>List of Races</h2>
      <ul className="race-list" id="race-list">
        {races.map((race) => (
          <li
            key={race.raceid}
            className="race-list-item"
            onClick={() => handleRaceClick(race.raceid)}
          >
            {race.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RacesList;
