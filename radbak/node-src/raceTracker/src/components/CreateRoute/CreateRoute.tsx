import DeviceTable from "../CheckpointTable/CheckpointTable";
import { ChangeEvent, useEffect, useState } from "react";
import "./CreateRoute.css";
import FinaliseCheckpoints from "./FinaliseCheckpoints";

const CreateRoute = () => {
  const [deviceData, setDeviceData] = useState([
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
  const [laps, setLaps] = useState<number | "">();
  const [isAutoTime, setIsAutoTime] = useState(false);
  const [autoTime, setAutoTime] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    setApplySuccess(false);
  }, [deviceData, laps, isAutoTime, autoTime]);

  const handleDeviceDataUpdate = (newData: any) => {
    console.log(newData);
    setDeviceData(newData);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow input if it's a number
    if (/^\d*$/.test(inputValue) || inputValue === "") {
      setLaps(inputValue === "" ? "" : parseInt(inputValue, 10));
      console.log(inputValue);
    }
  };

  const handleAutoTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAutoTime(e.target.value);
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

  const apply = () => {
    let failed = false;
    deviceData.forEach((device) => {
      // check if ID is empty or not a number
      if (device.ID === "" || !/^\d*$/.test(device.ID)) {
        failed = true;
        return;
      }
      // check if any timelimit is not a time in hh:mm format
      if (
        device.timeLimit !== "" &&
        !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(device.timeLimit)
      ) {
        failed = true;
        return;
      }

      // check if first time limit is empty
      if (isAutoTime && device.position === 1 && device.timeLimit === "") {
        failed = true;
        return;
      }

      // check if timeLimit is within valid bounds
      if (isAutoTime && device.timeLimit !== "") {
        const [hours, minutes] = device.timeLimit.split(":");
        if (parseInt(hours, 10) > 23 || parseInt(minutes, 10) > 59) {
          failed = true;
          return;
        }
      }
    });

    if (failed) return;

    // check if laps has been specified and is less than 25
    if (laps !== "" && laps! > 24) {
      return;
    }

    // check if auto time is checked, then auto time should be filled in hh:mm format
    if (isAutoTime && !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(autoTime)) {
      return;
    }

    // check if auto time is within valid bounds
    if (isAutoTime) {
      const [hours, minutes] = autoTime.split(":");
      if (parseInt(hours, 10) > 23 || parseInt(minutes, 10) > 59) {
        return;
      }
    }

    if (!isAutoTime) {
    }

    setApplySuccess(true);
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

        <div className="create-route-container">
          <div className="create-route-member">
            <input
              type="text"
              placeholder="Specify laps (none for 24)"
              value={laps}
              onChange={handleInputChange}
              className="create-route-input"
            />
          </div>

          <div className="create-route-member">
            <label htmlFor="manualTime">Automatic time addition: </label>
            <input
              type="checkbox"
              checked={isAutoTime}
              onChange={() => setIsAutoTime(!isAutoTime)}
            />
          </div>

          {isAutoTime ? (
            <div className="create-route-member">
              <input
                type="text"
                placeholder="Time in hh:mm"
                onChange={handleAutoTimeChange}
                className="create-route-input"
              />
            </div>
          ) : null}

          <button onClick={apply} className="create-route-button">
            Apply
          </button>
        </div>
      </div>

      {applySuccess ? (
        <FinaliseCheckpoints
          deviceData={deviceData}
          laps={laps}
          isAutoTime={isAutoTime}
          autoTime={autoTime}
        />
      ) : null}
    </>
  );
};

export default CreateRoute;
