import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from React Router
import "./DataTable.css";
import { Checkpoint, Runner } from "../pages/RaceOverview";

type DataTableProps = {
  runners: Runner[];
  checkpoints: Checkpoint[];
};

const formatTime = (timeString: Date | undefined) => {
  if (!timeString) return "-";

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  };
  const time: Date = new Date(timeString);
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
            console.log("runner ", runner.name, " fell out")
            return; // Exit the loop once the runner is marked
          }
        }
      });
    });
    return runnerFellOutMap;
  }

  // handle navigation back to "/races"
  const handleGoBack = () => {
    navigate("/races");
  };

  return (
    <>
      <button onClick={handleGoBack} className="go-back-button">
        Go back
      </button>
      <table className="data-table">
        <thead>
          <tr>
            {/* Display the names of the columns */}
            <th>Names</th>
            <th>Still in race</th>
            {checkpoints.map((checkpoint, index) => (
              // Display the checkpoint number and time limit (if it exists)
              <th key={index}>
                {checkpoint.timeLimit ? (
                  <>
                    Checkpoint{index + 1} <br />
                    Time Limit: {formatTime(checkpoint.timeLimit)}
                  </>
                ) : (
                  `Checkpoint${index + 1}`
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {runners.map((runner, rowIndex) => {
            const isRunnerOut = runnerFellOutMap[runner.id] !== undefined;
            return (
              <tr key={rowIndex}>
                {/* Display the runner's name and whether they are still in the*/}
                <td>{runner.name}</td>
                <td>
                  {isRunnerOut ? (
                    <span style={{ color: "red" }}>Out</span> // Change color to red if the runner fell out
                  ) : (
                    <span style={{ color: "green" }}>In</span> // Change color to green if the runner is still in
                  )}
                </td>

                {/* Display the runner's times at each checkpoint */}
                {/* For each checkpoint, we check the runner's status */}
                {checkpoints.map((checkpoint, columnIndex) => {
                  // Check if the runner is still in the race
                  if (runnerFellOutMap[runner.id] === undefined) {
                    // Check if the time for this checkpoint is undefined
                    if (runner.times[checkpoint.position] !== undefined) {
                      return (
                        <td key={columnIndex}>
                          {formatTime(runner.times[checkpoint.position])}
                        </td>
                      );
                    } else {
                      return <td key={columnIndex}> - </td>;
                    }
                  }

                  // Runner fell out; find where they fell out by comparing the checkpoint position
                  const runnerFellOutDirection =
                    checkpoint.position - runnerFellOutMap[runner.id];

                  // If the runner fell out at this checkpoint, display the time they fell out in brackets
                  if (runnerFellOutDirection === 0) {
                    console.log(
                      checkpoint.id + ": " + runner.times[checkpoint.id]
                    );
                    return (
                      <td key={columnIndex}>
                        Out: [{formatTime(runner.times[checkpoint.position])}]
                      </td>
                    );
                  }

                  // If the runner fell out before this checkpoint, display a dash
                  else if (runnerFellOutDirection > 0) {
                    return <td key={columnIndex}> - </td>;
                  }

                  // If not, the runner fell out after this checkpoint; display the time they passed the checkpoint
                  else {
                    return (
                      <td key={columnIndex}>
                        {formatTime(runner.times[checkpoint.position])}
                      </td>
                    );
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
export default DataTable;
