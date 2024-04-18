import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import fetchRaces from "../api/fetchRaces";
import fetchRunners from "../api/fetchRunners";
import RegisterTagForm from "../components/RegisterTag/RegisterTagForm";
import registerTag from '../api/registerTag';

export default function RegisterTag() {
  const [selectedRace, setSelectedRace] = useState<number | null>(null);
  const [selectedRunner, setSelectedRunner] = useState<number | null>(null);
  const [tagId, setTagId] = useState<string>('');

  const racesQuery = useQuery({
    queryKey: ['races'],
    queryFn: fetchRaces
  });

  const runnersQuery = useQuery({
    queryKey: ['runners'],
    queryFn: fetchRunners
  });

  const handleSubmit = async () => {
    if (!selectedRunner || !selectedRace || !tagId) {
      alert("All fields must be filled.");
      return;
    }

    const data = {
      RunnerID: selectedRunner,
      RaceID: selectedRace,
      TagID: tagId,
    };

    try {
      const result = await registerTag(data);
      console.log('Submission successful:', result);
      alert('User registered successfully!');
    } catch (error) {
      alert('Failed to submit username.');
      console.error(error);
    }
  };

  if (racesQuery.isLoading || runnersQuery.isLoading) {
    return <p>Loading...</p>;
  }

  if (racesQuery.isError || runnersQuery.isError) {
    return <p>Error fetching data</p>;
  }

  if (racesQuery.data && runnersQuery.data) {
    return (
      <>
        <h2>Register to a race</h2>
        <RegisterTagForm
          races={racesQuery.data}
          runners={runnersQuery.data}
          selectedRace={selectedRace}
          setSelectedRace={setSelectedRace}
          selectedRunner={selectedRunner}
          setSelectedRunner={setSelectedRunner}
          setTagId={setTagId}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return null;
}
