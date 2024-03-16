import { useState, useEffect } from "react";
import DataTable from "../components/DataTable";

export default function RunnerOverview() {
  // Dummy data
  const [runners, setRunners] = useState([
    {
      id: "1",
      name: "Knut",
      times: {
        1: "13:10",
        2: "13:28",
        3: "13:49",
        4: "15:56",
      },
    },
    {
      id: "2",
      name: "Erik",
      times: { 1: "12:10" },
    },
  ]);

  const checkpoints = [
    { id: "1", position: 1 },
    { id: "2", position: 2 },
    { id: "3", position: 3 },
    { id: "4", position: 4 },
    { id: "5", position: 5 },
  ];

  useEffect(() => {
    const updateErikProgress = () => {
      const erikIndex = runners.findIndex((runner) => runner.id === "2");
      if (erikIndex !== -1) {
        const erik = runners[erikIndex];
        let lastPassedCheckpoint = Object.keys(erik.times).length;
        if (lastPassedCheckpoint < checkpoints.length) {
          lastPassedCheckpoint++;
          const updatedRunners = [...runners];
          let currentTime = new Date(
            `2000-01-01T${
              erik.times[(lastPassedCheckpoint - 1) as keyof typeof erik.times]
            }:00Z`
          );
          const randomTime = Math.floor(Math.random() * (60 - 1 + 1)) + 1; // Random time in minutes
          currentTime.setMinutes(currentTime.getMinutes() + randomTime);
          updatedRunners[erikIndex].times[
            lastPassedCheckpoint as keyof typeof erik.times
          ] = `${currentTime.getHours()}:${
            currentTime.getMinutes() < 10
              ? "0" + currentTime.getMinutes()
              : currentTime.getMinutes()
          }`;
          setRunners(updatedRunners);
        }
      }
    };

    const intervalId = setInterval(updateErikProgress, 5000); // Update every 5 seconds
    return () => clearInterval(intervalId);
  }, [runners, checkpoints]);

  return (
    <>
      <DataTable runners={runners} checkpoints={checkpoints} />
    </>
  );
}
