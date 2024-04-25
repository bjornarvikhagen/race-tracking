import { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import { json, useParams } from "react-router-dom";
import fetchLeaderboard from "../api/fetchLeaderboard";
import { useQuery } from "@tanstack/react-query";
import useWebSocket from "react-use-websocket";
import { BASEURL } from "../Constants";

export interface Runner {
  id: number;
  name: string;
  tagid: string;
  times: { [checkpoint: string]: Date }; // TODO: Get consisten naming
}

export interface Checkpoint {
  id: number;
  position: number;
  timeLimit: Date | null;
}

const RaceOverview = () => {
  // Websocket connection code
  const WS_URL = "ws://" + "localhost" + "/ws"; // TODO: Make this more robust. And does it work on MAC? // And localhost // Or 127.0.0.1
  useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true,
    onMessage: (event) => {
      // Run when a new WebSocket alert is received to update the results
      console.log(`Got a new message!: ${event.data}`);
      refetch();
    },
  });

  // Non-websocket-code:
  const { raceId } = useParams();
  const intRaceId = parseInt(raceId!);

  // Fetch data
  const {
    data: raceOverview,
    isLoading,
    isError,
    refetch,
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
