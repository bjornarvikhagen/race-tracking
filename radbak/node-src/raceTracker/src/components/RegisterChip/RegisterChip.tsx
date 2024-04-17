import React, { useState } from 'react';

interface Race {
  raceid: number;
  name: string;
  starttime: string;
}

interface Runner {
  runnerid: number;
  name: string;
}

interface RegisterChipProps {
  races: Race[];
  runners: { runners: Runner[] };
}

const RegisterChip: React.FC<RegisterChipProps> = ({
  races,
  runners: { runners },
}) => {
  const [selectedRace, setSelectedRace] = useState<number>(races[0]?.raceid);
  const [selectedRunner, setSelectedRunner] = useState<number>(runners[0]?.runnerid);
  const [tagId, setTagId] = useState<string>('');

  const handleRaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRace(parseInt(event.target.value, 10));
  };

  const handleRunnerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRunner(parseInt(event.target.value, 10));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tagInput = prompt("Please scan the tag on the thing, or enter tag number:");
    console.log(typeof (tagInput));

    setTagId(tagInput || '');  // Set tag ID, fallback to empty string if null

    if (!tagInput) {
      alert("Tag ID is required to register.");
      return;
    }

    // Prepare the data payload
    const data = {
      RunnerID: selectedRunner,
      RaceID: selectedRace,
      TagID: tagInput,
    };

    // Post request to server
    try {
      const response = await fetch('/register_tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (response.ok) {
        alert('Tag registered successfully!');
        console.log(responseData);
      } else {
        throw new Error(responseData.message || 'Failed to register tag');
      }
    } catch (error) {
      console.error('Error registering tag:', error);
      alert(error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Race
          <select value={selectedRace} onChange={handleRaceChange}>
            {races.map((race) => (
              <option key={race.raceid} value={race.raceid}>
                {race.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Participant:
          <select value={selectedRunner} onChange={handleRunnerChange}>
            {runners.map((runner) => (
              <option key={runner.runnerid} value={runner.runnerid}>
                {runner.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <button type='submit'>Register Runner</button>
      </form>
    </>
  );
};

export default RegisterChip;
