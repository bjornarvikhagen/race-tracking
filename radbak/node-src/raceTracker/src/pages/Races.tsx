import { useQuery } from "@tanstack/react-query";
import fetchRaces from "../api/fetchRaces";
import RacesList from "../components/RacesList";

export default function Races() {
  const {
    data: races,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["races"],
    queryFn: () => fetchRaces(),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching</p>;

  return <>{races && <RacesList races={races} />}</>;
}
