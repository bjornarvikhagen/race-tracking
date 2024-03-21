import { useNavigate } from "react-router-dom";

const RacesList = ({
  races,
}: {
  races: { id: number; name: string; startTime: string }[];
}) => {
  const navigate = useNavigate();

  const handleRaceClick = (raceId: number) => {
    navigate(`/race/${raceId}`);
  };

  // return list of races with links to view
  return (
    <>
      <h2>List of Races</h2>
      <ul>
        {races.map((race) => (
          <li
            key={race.id}
            onClick={() => handleRaceClick(race.id)}
            style={{ cursor: "pointer" }}
          >
            {race.name}
          </li>
        ))}
      </ul>
    </>
  );
};

export default RacesList;
