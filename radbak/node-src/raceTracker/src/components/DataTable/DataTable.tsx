import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from React Router
import "./DataTable.css";
import { Checkpoint, Runner } from "../../pages/RaceOverview";

type DataTableProps = {
  runners: Runner[];
  checkpoints: Checkpoint[];
};

const formatTime = (time: string | Date | undefined) => {
  if (!time) return "-";

  const date = new Date(time);
  if (isNaN(date.getTime())) return "Invalid time";

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23", // Use 24-hour clock
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const formatTimeLimit = (time: string | Date | undefined | null) => {
  if (!time) return "-";

  const date = new Date(time);
  if (isNaN(date.getTime())) return "Invalid time";

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23", // Use 24-hour clock
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const DataTable: React.FC<DataTableProps> = ({ runners, checkpoints }) => {
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.position - b.position);
  const runnerFellOutMap = getRunnerFellOutMap(runners, checkpoints);
  const navigate = useNavigate(); // Initialize useNavigate

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
          const runnerDate = new Date(runnerTime);
          const limitDate = new Date(checkpointTimeLimit);

          if (runnerDate > limitDate) {
            runnerFellOutMap[runner.id] = checkpoint.position;
            return; // Exit the loop once the runner is marked
          }
        }
      });
    });

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
              <th className="inRace">Status</th>
            </tr>
          </thead>
          <tbody>
            {runners.map((runner, index) => (
              <tr key={`runner-${index}`}>
                <td>{runner.name}</td>
                <td
                  className="inRace"
                  style={{
                    color: runnerFellOutMap[runner.id] ? "red" : "green",
                  }}
                >
                  {runnerFellOutMap[runner.id] ? "Out" : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Scrollable Table for Checkpoints */}
        <div className="scrollable-section">
          <table className="data-table">
            <thead>
              <tr>
                {sortedCheckpoints.map((checkpoint, index) => (
                  <th key={index}>
                    CP {index + 1}
                    {checkpoint.timeLimit && (
                      <>
                        <br />
                        Limit: {formatTimeLimit(checkpoint.timeLimit)}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runners.map((runner, rowIndex) => (
                <tr key={`checkpoint-row-${rowIndex}`}>
                  {sortedCheckpoints.map((checkpoint, cpIndex) => {
                    const runnerTime = runner.times[checkpoint.position];
                    const hasTimeLimit = checkpoint.timeLimit !== null && checkpoint.timeLimit !== undefined;
                    const isTimeBefore = runnerTime && (runnerTime <= (checkpoint.timeLimit as unknown as Date));

                    const timeClass = !hasTimeLimit
                      ? ""
                      : isTimeBefore
                      ? "time-before"
                      : "time-after";

                    return (
                      <td key={cpIndex} className={timeClass}>
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