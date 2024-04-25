

type DeviceData = {
  position: number;
  ID: string;
  isEditingID?: boolean;
  tempID?: string;
  timeLimit: string;
  isEditingTimeLimit?: boolean;
  tempTimeLimit?: string;
};

interface FinaliseCheckpointsProps {
  deviceData: DeviceData[];
  onCreateRaceFinalised: () => void; // Callback when race creation is finalized
}

const FinaliseCheckpoints = ({ deviceData, onCreateRaceFinalised }: FinaliseCheckpointsProps) => {

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Device Position</th>
            <th>Device ID</th>
            <th>Time Limit</th>
          </tr>
        </thead>
        <tbody>
          {deviceData.map((device, index) => (
            <tr key={index}>
              <td>{device.position}</td>
              <td>Device {device.ID}</td>
              <td>{device.timeLimit || 'No limit set'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onCreateRaceFinalised}>Create Race</button>
    </>
  );
};

export default FinaliseCheckpoints;
