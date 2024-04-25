import DeviceTable from "../CheckpointTable/CheckpointTable";
import { useState } from "react";
import "./CreateRoute.css";

type DeviceData = {
  position: number;
  ID: string;
  isEditingID: boolean;
  tempID: string;
  timeLimit: string;
  isEditingTimeLimit: boolean;
  tempTimeLimit: string;
};

interface CreateRouteProps {
  onCreateRace: (deviceData: DeviceData[]) => void;
}

const CreateRoute = ({ onCreateRace }: CreateRouteProps) => {
  const [deviceData, setDeviceData] = useState<DeviceData[]>([
    {
      position: 1,
      ID: "",
      isEditingID: false,
      tempID: "",
      timeLimit: "",
      isEditingTimeLimit: false,
      tempTimeLimit: "",
    },
  ]);

  const handleDeviceDataUpdate = (newData: any) => {
    setDeviceData(newData);
  };

  const addRow = () => {
    const newData = [
      ...deviceData,
      {
        position: deviceData.length + 1,
        ID: "",
        isEditingID: false,
        tempID: "",
        timeLimit: "",
        isEditingTimeLimit: false,
        tempTimeLimit: "",
      },
    ];
    setDeviceData(newData);
  };

  const validateTimeLimitFormat = (timeLimit: string) => {
    const regexWithoutSeconds = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    return regexWithoutSeconds.test(timeLimit);
  };

  const apply = () => {
    let failed = false;
    const updatedDeviceData = deviceData.map(device => {
      if (device.ID === "" || !/^\d*$/.test(device.ID)) {
        console.error("Each device must have a numeric ID.");
        failed = true;
      }
      if (device.timeLimit === "") {
        // Allow empty time limit
      } else if (validateTimeLimitFormat(device.timeLimit)) {
        device.timeLimit += ":00";
        console.log(device.timeLimit);
      } else {
        console.error("Time limit must be in yyyy-mm-dd hh:mm format.");
        console.log(device.timeLimit);
        failed = true;
      }
      return device;
    });

    if (!failed) {
      onCreateRace(updatedDeviceData);
    }

  };

  return (
    <>
      <div className="create-route">
        <div className="device-table-container">
          <DeviceTable
            onDataUpdate={handleDeviceDataUpdate}
            deviceData={deviceData}
          />
          <button onClick={addRow}>Add Row</button>
        </div>

        <div className="create-route-action">
          <button onClick={apply} className="create-route-button">
            Apply Checkpoints
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateRoute;
