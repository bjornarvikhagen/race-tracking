import { useQuery } from "@tanstack/react-query";
import fetchRaces from "../api/fetchRaces";
import RacesList from "../components/RacesList/RacesList";

export default function Races() {
  const {
    data: races,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: () => fetchRaces(),
  });

  return (
    <div id="racelist-page">
      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p>Error fetching</p>
      ) : (
        <>{races && <RacesList races={races} />}</>
      )}
    </div>
  );
}
