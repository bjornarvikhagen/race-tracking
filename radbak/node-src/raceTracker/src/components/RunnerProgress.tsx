type RunnerProgressProps = {
  runner: {
    id: string;
    name: string;
    checkpoints: {
      id: string;
      position: number;
      time: string;
    }[];
  };
};

const RunnerProgress: React.FC<RunnerProgressProps> = ({ runner }) => {
  return (
    <div>
      <h3>{runner.name}</h3>
      <ul>
        {runner.checkpoints.map((checkpoint, index) => (
          <li key={index}>
            Checkpoint {index + 1}: {checkpoint.time}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunnerProgress;
