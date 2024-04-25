import { SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoute from "../../components/CreateRoute/CreateRoute";
import FinaliseCheckpoints from "../../components/CreateRoute/FinaliseCheckpoints";
import useAdminAuth from '../../hooks/useAdminAuth';
import { createRace, createCheckpoint, addCheckpointToRace } from '../../api/registerRace';
import "./CreateRace.css"

type DeviceData = {
  position: number;
  ID: string;
  isEditingID: boolean;
  tempID: string;
  timeLimit: string;
  isEditingTimeLimit: boolean;
  tempTimeLimit: string;
};

const CreateRace = () => {
  const [raceName, setRaceName] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const navigate = useNavigate();
  useAdminAuth();


  const handleRaceNameChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setRaceName(e.target.value);
  };

  const handleStartDateTimeChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setStartDateTime(e.target.value);
  };


  const handleCreateRace = async () => {
    console.log("Attempting to create race and add checkpoints");
    if (!raceName) {
      alert("Race name is required.");
      return;
    }
    if (!startDateTime) {
      alert("start time required.");
      return;
    }

    try {
      // Creating the race
      const raceResponse = await createRace({ name: raceName, start_time: new Date(startDateTime) });
      const raceId = parseInt(raceResponse.race_id);
      console.log('Race created with ID:', raceId);

      // Create checkpoints
      const checkpointPromises = deviceData.map(async device => {
        const checkpoint = {
          DeviceID: parseInt(device.ID),
          Location: "Some location"
        };

        const checkpointResponse = await createCheckpoint(checkpoint);
        const checkpointId = parseInt(checkpointResponse.checkpoint_id);

        console.log(device.timeLimit);


        // add checkpoint to the race
        return addCheckpointToRace({
          race_id: raceId,
          checkpoint_id: checkpointId,
          position: device.position,
          time_limit: device.timeLimit
        });
      });

      await Promise.all(checkpointPromises);

      console.log(`Race Created: ${raceName} with ID ${raceId}`);
      navigate("/races");
    } catch (error) {
      console.error("Failed to create race or add checkpoints:", error);
    }
  };

  return (
    <div>
      <div className='raceName'>
        <div className='name'>
          <h3>Enter Race Name: </h3>
          <input
            type="text"
            placeholder="Enter Race Name"
            value={raceName}
            onChange={handleRaceNameChange}
          />
        </div>
        <div className='time'>
          <h4>Enter Race Start Time: </h4>
          <input
            type="datetime-local" // Use datetime-local input type
            value={startDateTime}
            onChange={handleStartDateTimeChange}
          />
        </div>
      </div>
      {deviceData.length == 0 ? (
        <CreateRoute onCreateRace={setDeviceData} />
      ) : (
        <FinaliseCheckpoints deviceData={deviceData} onCreateRaceFinalised={handleCreateRace} />
      )}
    </div>
  );
};

export default CreateRace;
