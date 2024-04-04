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

  // Dummy data
  // const {
  //   data: raceOverview,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: [raceId],
  //   queryFn: () => fetchLeaderboard(intRaceId),
  // });

  // Fetch leaderboard data using useQuery

  // Test data, should be removed
  // useEffect(() => {
  //   const updateErikProgress = () => {
  //     const erikIndex = runners.findIndex((runner) => runner.id === 2);
  //     if (erikIndex !== -1) {
  //       const erik = runners[erikIndex];
  //       let lastPassedCheckpoint = Object.keys(erik.times).length;
  //       if (lastPassedCheckpoint < checkpoints.length) {
  //         lastPassedCheckpoint++;
  //         const updatedRunners = [...runners];
  //         let currentTime = new Date(
  //           `2000-01-01T${
  //             erik.times[(lastPassedCheckpoint - 1) as keyof typeof erik.times]
  //           }:00Z`
  //         );
  //         const randomTime = Math.floor(Math.random() * (60 - 1 + 1)) + 1; // Random time in minutes
  //         currentTime.setMinutes(currentTime.getMinutes() + randomTime);
  //         updatedRunners[erikIndex].times[
  //           lastPassedCheckpoint as keyof typeof erik.times
  //         ] = `${currentTime.getHours()}:${
  //           currentTime.getMinutes() < 10
  //             ? "0" + currentTime.getMinutes()
  //             : currentTime.getMinutes()
  //         }`;
  //         setRunners(updatedRunners);
  //       }
  //     }
  //   };

  //   const intervalId = setInterval(updateErikProgress, 5000); // Update every 5 seconds
  //   return () => clearInterval(intervalId);
  // }, [runners, checkpoints]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching</p>;

  return (
    <>
      {raceOverview && (
        <DataTable runners={runners} checkpoints={checkpoints} />
      )}
    </>
  );
};

export default RaceOverview;
