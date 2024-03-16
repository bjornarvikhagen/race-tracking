import "./DataTable.css";

type DataTableProps = {
  runners: {
    id: string;
    name: string;
    times: {
      [key: string]: string | undefined;
    };
  }[];
  checkpoints: {
    id: string;
    position: number;
  }[];
};

const DataTable: React.FC<DataTableProps> = ({ runners, checkpoints }) => {
  // Filter out checkpoints that no runner has passed
  const filteredCheckpoints = checkpoints.filter((checkpoint) => {
    return runners.some(
      (runner) => runner.times[checkpoint.position] !== undefined
    );
  });

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Names</th>
          {filteredCheckpoints.map((_, index) => (
            <th key={index}>Checkpoint{index + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {runners.map((runner, rowIndex) => (
          <tr key={rowIndex}>
            <td>{runner.name}</td>
            {filteredCheckpoints.map((checkpoint, checkpointIndex) => (
              <td key={checkpointIndex}>
                {runner.times[checkpoint.position] || "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
