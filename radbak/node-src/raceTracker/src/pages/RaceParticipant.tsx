import { useQuery } from "@tanstack/react-query";
import fetchRaces from "../api/fetchRaces";
import fetchRunners from "../api/fetchRunners";
import RegisterChip from "../components/RegisterChip/RegisterChip";

export default function ChipRegistration() {
  const racesQuery = useQuery({
    queryKey: ['races'],
    queryFn: fetchRaces
  });

  const runnersQuery = useQuery({
    queryKey: ['runners'],
    queryFn: fetchRunners
  });

  if (racesQuery.isLoading || runnersQuery.isLoading) {
    return <p>Loading...</p>;
  }

  if (racesQuery.isError || runnersQuery.isError) {
    return <p>Error fetching data</p>;
  }

  if (racesQuery.data && runnersQuery.data) {
    return (
      <RegisterChip races={racesQuery.data} runners={runnersQuery.data} />
    );
  }

  return null; // In case there's no data yet (fallback)
}
