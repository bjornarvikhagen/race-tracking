import { useState } from "react";

const RunnerForm = ({ onAddRunner }: { onAddRunner: Function }) => {
  const [runnerName, setRunnerName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!runnerName.trim()) return;
    onAddRunner(runnerName.trim());
    setRunnerName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Runner name"
        value={runnerName}
        onChange={(e) => setRunnerName(e.target.value)}
      />
      <button type="submit">Add Runner</button>
    </form>
  );
};

export default RunnerForm;
