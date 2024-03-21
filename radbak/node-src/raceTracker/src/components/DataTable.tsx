import React from "react";
import "./DataTable.css";

type DataTableProps = {
  runners: {
    id: number;
    name: string;
    times: {
      [key: string]: string | undefined;
    };
  }[];
  checkpoints: {
    id: number;
    position: number;
    timeLimit: string | null;
  }[];
};

const DataTable: React.FC<DataTableProps> = ({ runners, checkpoints }) => {
  const filteredCheckpoints = getFilteredCheckpoints(runners, checkpoints);
  const runnerFellOutMap = getRunnerFellOutMap(runners, filteredCheckpoints);

  // Filter out checkpoints that no runner has passed
  function getFilteredCheckpoints(
    runners: DataTableProps["runners"],
    checkpoints: DataTableProps["checkpoints"]
  ) {
    return checkpoints.filter((checkpoint) => {
      return runners.some(
        (runner) => runner.times[checkpoint.position] !== undefined
      );
    });
  }

  // hashmap displaying each runners id and the checkpoint they fell out of the race
  // i.e., if runner 1 couldnt reach checkpoint 3 in time, the map would have an entry {1: 3}
  // if the runner is still in the race, the map will not have an entry for that runner
  function getRunnerFellOutMap(
    runners: DataTableProps["runners"],
    filteredCheckpoints: DataTableProps["checkpoints"]
  ) {
    const runnerFellOutMap: { [key: number]: number } = {};

    runners.forEach((runner) => {
      for (let i = 0; i < filteredCheckpoints.length; i++) {
        const checkpoint = filteredCheckpoints[i];
        // see if the time is after the time limit
        if (
          checkpoint.timeLimit &&
          new Date(
            `2000-01-01T${runner.times[checkpoint.position] || ""}:00Z`
          ) > new Date(`2000-01-01T${checkpoint.timeLimit}:00Z`)
        ) {
          runnerFellOutMap[runner.id] = checkpoint.position;
          break;
        }
      }
    });

    return runnerFellOutMap;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Names</th>
          <th>IsInRace</th>
          {filteredCheckpoints.map((checkpoint, index) => (
            <th key={index}>
              {checkpoint.timeLimit ? (
                <>
                  Checkpoint{index + 1} <br />
                  Time Limit: {checkpoint.timeLimit}
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
              <td>{runner.name}</td>
              <td>
                {isRunnerOut ? (
                  <span style={{ color: "red" }}>Out</span>
                ) : (
                  <span style={{ color: "green" }}>In</span>
                )}
              </td>
              {filteredCheckpoints.map((checkpoint, columnIndex) => {
                if (runnerFellOutMap[runner.id] === undefined) {
                  return (
                    <td key={columnIndex}>
                      {runner.times[checkpoint.position] || "-"}
                    </td>
                  );
                }
                const runnerFellOutDirection =
                  checkpoint.id - runnerFellOutMap[runner.id];
                if (runnerFellOutDirection === 0) {
                  return (
                    <td key={columnIndex}>
                      Out: [{runner.times[checkpoint.id]}]
                    </td>
                  );
                } else if (runnerFellOutDirection > 0) {
                  return <td key={columnIndex}> - </td>;
                } else {
                  return (
                    <td key={columnIndex}>
                      {runner.times[checkpoint.id] || "-"}
                    </td>
                  );
                }
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
export default DataTable;
