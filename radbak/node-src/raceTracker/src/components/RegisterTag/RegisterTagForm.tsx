import React from 'react';
import './RegisterTagForm.css';

interface Race {
  raceid: number;
  name: string;
  starttime: string;
}

interface Runner {
  runnerid: number;
  name: string;
}

interface RegisterTagProps {
  races: Race[];
  runners: { runners: Runner[] };
  selectedRace: number | null;
  setSelectedRace: (raceId: number) => void;
  selectedRunner: number | null;
  setSelectedRunner: (runnerId: number) => void;
  setTagId: (tagId: string) => void;
  onSubmit: () => void;
}

const RegisterTagForm: React.FC<RegisterTagProps> = ({
  races,
  runners: { runners },
  selectedRace,
  setSelectedRace,
  selectedRunner,
  setSelectedRunner,
  setTagId,
  onSubmit,
}) => {

  //add a useffect that listens to the scannning dvice, when signal is recieved
  // the id oups up in the input field and you dont have to enter anything.


  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="register-tag-form">
      <label>
        Race:
        <select value={selectedRace ?? ''} onChange={e => setSelectedRace(parseInt(e.target.value, 10))}>
          <option value="" disabled>Select race</option>
          {races.map(race => (
            <option key={race.raceid} value={race.raceid}>{race.name}</option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Participant:
        <select value={selectedRunner ?? ''} onChange={e => setSelectedRunner(parseInt(e.target.value, 10))}>
          <option value="" disabled>Select user</option>
          {runners.map(runner => (
            <option key={runner.runnerid} value={runner.runnerid}>{runner.name}</option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Tag ID:
        <input type="text" onChange={e => setTagId(e.target.value)} required />
      </label>
      <br />
      <button type="submit">Register to race</button>
    </form>
  );
};

export default RegisterTagForm;
