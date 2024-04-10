import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from React Router
import "./DataTable.css";
import { Checkpoint, Runner } from "../../pages/RaceOverview";

type DataTableProps = {
  runners: Runner[];
  checkpoints: Checkpoint[];
};

const formatTime = (time: Date | undefined) => {
  if (!time) return "-";

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: 'h23', // Use 24-hour clock
  };
  return new Intl.DateTimeFormat("en-US", options).format(time);
};

const formatTimeLimit = (time: Date | undefined | null) => {
  if (!time) return "-";

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: 'h23', // Use 24-hour clock
  };
  return new Intl.DateTimeFormat("en-US", options).format(time);
};



const DataTable: React.FC<DataTableProps> = ({ runners, checkpoints }) => {
  const runnerFellOutMap = getRunnerFellOutMap(runners, checkpoints);
  const navigate = useNavigate(); // Initialize useNavigate


  // hashmap displaying each runners id and the checkpoint they fell out of the race
  // i.e., if runner 1 couldnt reach checkpoint with position 3 in time, the map would have an entry {1: 3}
  // if the runner is still in the race, the map will not have an entry for that runner
  function getRunnerFellOutMap(
    runners: DataTableProps["runners"],
    filteredCheckpoints: DataTableProps["checkpoints"]
  ) {
    const runnerFellOutMap: { [key: number]: number } = {};

    runners.forEach((runner) => {
      filteredCheckpoints.forEach((checkpoint) => {
        if (runnerFellOutMap[runner.id] !== undefined) {
          return; // Skip iterating through checkpoints for this runner
        }
        const runnerTime = runner.times[checkpoint.position];
        const checkpointTimeLimit = checkpoint.timeLimit;

        if (runnerTime !== undefined && checkpointTimeLimit !== null) {
          if (runnerTime > checkpointTimeLimit) {
            // console.log(
            //   "Runner " +
            //     runner.id +
            //     " fell out at checkpoint " +
            //     checkpoint.position +
            //     " because their time was " +
            //     runnerTime +
            //     " and the time limit was " +
            //     checkpointTimeLimit
            // );
            runnerFellOutMap[runner.id] = checkpoint.position;
            return; // Exit the loop once the runner is marked
          }
        }
      });
    });

    console.log(runnerFellOutMap);
    return runnerFellOutMap;
  }

  const getLastCheckpoint = (times: { [key: number]: Date }): string => {
    let lastCheckpoint = "-";
    let maxPosition = -1;
    // Find the checkpoint with the highest position that the runner has a time for
    Object.entries(times).forEach(([position, time]) => {
      const posNum = Number(position);
      if (posNum > maxPosition) {
        maxPosition = posNum;
        lastCheckpoint = `${posNum}: ${formatTime(time)}`;
      }
    });
    return lastCheckpoint;
  };



  return (
    <>
      <button onClick={() => navigate("/races")} className="go-back-button">
        Go back
      </button>
      <div className="container">
        {/* Left Fixed Table for Names and Still in race */}
        <table className="data-table fixed">
          <thead>
            <tr>
              <th className="names">Names</th>
              <th className="inRace">Still in race</th>
            </tr>
          </thead>
          <tbody>
            {runners.map((runner, index) => (
              <tr key={`runner-${index}`}>
                <td>{runner.name}</td>
                <td className="inRace">{runnerFellOutMap[runner.id] ? "No" : "Yes"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Scrollable Table for Checkpoints */}
        <div className="scrollable-section">
          <table className="data-table">
            <thead>
              <tr>
                {checkpoints.map((checkpoint, index) => (
                  <th key={index}>
                    CP {index + 1} deadline: {formatTimeLimit(checkpoint.timeLimit)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runners.map((runner, rowIndex) => (
                <tr key={`checkpoint-row-${rowIndex}`}>
                  {checkpoints.map((checkpoint, cpIndex) => {
                    const runnerTime = runner.times[checkpoint.position];
                    const isTimeBefore = runnerTime && checkpoint.timeLimit && runnerTime <= checkpoint.timeLimit;
                    const timeClass = isTimeBefore ? 'time-before' : 'time-after';

                    return (
                      <td key={cpIndex} className={runnerTime ? timeClass : ''}>
                        {runnerTime ? formatTime(runnerTime) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Fixed Table for Last Checkpoint */}
        <table className="data-table fixed">
          <thead>
            <tr>
              <th>Last CP</th>
            </tr>
          </thead>
          <tbody>
            {runners.map((runner, index) => (
              <tr key={`last-${index}`}>
                <td>{getLastCheckpoint(runner.times)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
export default DataTable;
