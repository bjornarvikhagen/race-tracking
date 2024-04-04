import { useState, useEffect } from "react";
import DataTable from "../components/DataTable";
import { useParams } from "react-router-dom";
import fetchLeaderboard from "../api/fetchLeaderboard";
import { useQuery } from "@tanstack/react-query";

export interface Runner {
  id: number;
  name: string;
  times: { [checkpoint: number]: Date };
}

export interface Checkpoint {
  id: number;
  position: number;
  timeLimit: Date | null;
}

const RaceOverview = () => {
  const { raceId } = useParams();
  const intRaceId = parseInt(raceId!);

  const {
    data: raceOverview,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leaderboard", intRaceId],
    queryFn: () => fetchLeaderboard(intRaceId),
  });

  const [runners, setRunners] = useState<Runner[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  useEffect(() => {
    if (raceOverview) {
      setRunners(raceOverview.runners);
      setCheckpoints(raceOverview.checkpoints);
    }
  }, [raceOverview]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching</p>;

  // Check if runners and checkpoints arrays are empty or not
  if (runners.length === 0 || checkpoints.length === 0) {
    // If arrays are empty, render loading message or any other indication
    return <p>Loading data...</p>;
  }

  return (
    <>
      {raceOverview && (
        <DataTable runners={runners} checkpoints={checkpoints} />
      )}
    </>
  );
};

export default RaceOverview;
