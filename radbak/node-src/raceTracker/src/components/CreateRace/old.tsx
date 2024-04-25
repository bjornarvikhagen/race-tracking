const AdminPage = () => {
  useAdminAuth();

  return <CreateRoute />;
};

export default AdminPage;



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
      <div className="create-route" >
        <div className="device-table-container" >
          <DeviceTable
            onDataUpdate={handleDeviceDataUpdate}
            deviceData={deviceData}
          />
          <button onClick={addRow}> Add Row < /button>
            < /div>

            < div className="create-route-container" >
              <div className="create-route-member" >
                <input
                  type="text"
                  placeholder="Specify laps (none for 24)"
                  value={laps}
                  onChange={handleInputChange}
                  className="create-route-input"
                />
              </div>

              < div className="create-route-member" >
                <label htmlFor="manualTime" > Automatic time addition: </label>
                < input
                  type="checkbox"
                  checked={isAutoTime}
                  onChange={() => setIsAutoTime(!isAutoTime)}
                />
                < /div>

                {
                  isAutoTime ? (
                    <div className="create-route-member" >
                      <input
                        type="text"
                        placeholder="Time in hh:mm"
                        onChange={handleAutoTimeChange}
                        className="create-route-input"
                      />
                    </div>
                  ) : null
                }

                <button onClick={apply} className="create-route-button" >
                  Apply
                  < /button>
                  < /div>
                  < /div>

                  {
                    applySuccess ? (
                      <FinaliseCheckpoints
                        deviceData={deviceData}
                        laps={laps}
                        isAutoTime={isAutoTime}
                        autoTime={autoTime}
                      />
                    ) : null
                  }
                </>
                );
};

                export default CreateRoute;


                import React, {useEffect, useState} from "react";

                interface FinaliseCheckpointsProps {
                  deviceData: DeviceData[];
                laps: number | "" | undefined;
                isAutoTime: boolean;
                autoTime: string;
}

                type DeviceData = {
                  position: number;
                ID: string;
                isEditingID: boolean;
                tempID: string;
                timeLimit: string;
                isEditingTimeLimit: boolean;
                tempTimeLimit: string;
};

                interface CheckPoints {
                  [deviceID: string]: {
                  [lap: string]: {
                  time: string;
                position: string;
                isEditingTime?: boolean;
    };
  };
}

                const FinaliseCheckpoints = ({
                  deviceData,
                  laps,
                  isAutoTime,
                  autoTime,
}: FinaliseCheckpointsProps) => {
  const [checkPoints, setCheckPoints] = useState<CheckPoints>({ });

  useEffect(() => {
                    let tempCheckPoints: CheckPoints = { };
    deviceData.forEach((device) => {
                    tempCheckPoints[device.ID] = {};
                  let lap = 0;
                  let iterateLaps = laps !== "" ? laps : 24;
                  for (lap; lap < iterateLaps!; lap++) {
                    tempCheckPoints[device.ID][lap] = {
                      time: "",
                      position: "",
                      isEditingTime: false,
                    };
                  if (autoTime) {
          if (device.timeLimit !== "") {
            const time1 = new Date(`2000-01-01T${device.timeLimit}:00`);
                  const time2 = new Date(`2000-01-01T${autoTime}:00`);

                  const minutes = time1.getMinutes() + lap * time2.getMinutes();
                  const hours =
                  time1.getHours() +
                  lap * time2.getHours() +
                  Math.floor(minutes / 60);
                  const tempRemainingMinutes = minutes % 60;
                  let remainingMinutes = tempRemainingMinutes.toString();
                  if (tempRemainingMinutes < 10) {
                    remainingMinutes = `0${tempRemainingMinutes}`;
            }

                  tempCheckPoints[device.ID][lap][
                  "time"
                  ] = `Timelimit: ${hours}:${remainingMinutes}`;
          } else {
                    tempCheckPoints[device.ID][lap]["time"] = "Timelimit: -";
          }
        } else {
                    tempCheckPoints[device.ID][lap]["time"] =
                    device.timeLimit !== "" ? `Timelimit: ${device.timeLimit}` : "";
        }

                  let position = device.position + deviceData.length * lap;
                  tempCheckPoints[device.ID][lap]["position"] = `Position: ${position}`;
      }
    });
                  setCheckPoints(tempCheckPoints);
  }, [deviceData, laps, autoTime]);

  const handlePost = () => {
                    // Post checkPoints to database
                    // First we need to fetch checkpoints to see which id's are available
                    // Then we need to post the new checkpoints with available id's and device id's
                    // Then we need to post to CheckPointInRace with the new checkpoints, and their timelimits and positions
                    // Then it should be done:)

                    // So step 1.
                    // Fetch checkpoints
                    // Step 2.
                    // make new checkpoints based on the fetched checkpoints and adding device id's
                    // here im thinking that the one who has the lowest position should have the lowest id, and so on
                    // and that the id's should just be the largest id + 1 (if anyone else has a better idea, please implement it)
                    // we should then get multiple checkpoints for each device, one for each lap
                    // Step 3.
                    // Post the new checkpoints to the database
                    // Step 4.
                    // Post to CheckPointInRace with the new checkpoints, and their timelimits and positions
                    // This is relatively simple, however we need to somehow track which race we are posting to
                    console.log(checkPoints);
  };

                  return (
    <>
                    <table>
                      <thead>
                        <tr>
                          <th>Devices < /th>
                            {
                              [...Array(laps !== "" ? laps : 24)].map((_, index) => (
                                <th key={index} > Lap {index + 1} </th>
                              ))}
                        </tr>
                        < /thead>
                        <tbody>
                          {
                            Object.keys(checkPoints).map((deviceID, index) => (
                              <tr key={index} >
                                <td>Device {deviceID} < /td>
                                  {
                                    Object.keys(checkPoints[deviceID]).map((lap, index) => (
                                      <td key={index} >
                                        <table>
                                          <tbody>
                                            <tr>
                                              <td>
                                                {!isAutoTime && (
                                                  <textarea
                                                    placeholder="Enter Time"
                                                    value={checkPoints[deviceID][lap].time}
                                                    onChange={(e) => {
                                                      const tempCheckPoints = { ...checkPoints };
                                                      tempCheckPoints[deviceID][lap]["time"] =
                                                        e.target.value;
                                                      setCheckPoints(tempCheckPoints);
                                                    }}
                                                  />
                                                )
                                                }
                                                {
                                                  isAutoTime && (
    <span>{ checkPoints[deviceID][lap].time } < /span>
  )
}
</td>
  < td > { checkPoints[deviceID][lap].position } < /td>
  < /tr>
  < /tbody>
  < /table>
  < /td>
              ))}
</tr>
                                                  ))}
                                              </tbody>
                                              < /table>
                                              < button onClick={handlePost} > Post < /button>
                                                < />
                                                );
};
                                                export default FinaliseCheckpoints;



                                                import {useEffect, useState} from "react";
                                                import "./CheckpointTable.css";
                                                import TrashCanSVG from "../../assets/trashcan.svg";

                                                interface DeviceTableProps {
                                                  onDataUpdate: (newData: any) => void;
                                                deviceData: DeviceData[];
}

                                                type DeviceData = {
                                                  position: number;
                                                ID: string;
                                                isEditingID: boolean;
                                                tempID: string;
                                                timeLimit: string;
                                                isEditingTimeLimit: boolean;
                                                tempTimeLimit: string;
};

                                                function DeviceTable({onDataUpdate, deviceData}: DeviceTableProps) {
  const [data, setData] = useState<DeviceData[]>(deviceData);

  useEffect(() => {
                                                  setData(deviceData);
  }, [deviceData]);

  // Function to handle starting editing mode
  const handleEditID = (index: number) => {
    const newData = [...data];
                                                newData[index].isEditingID = true;
                                                newData[index].tempID = newData[index].ID; // Store the original ID
                                                setData(newData);
  };

  const handleEditTimeLimit = (index: number) => {
    const newData = [...data];
                                                newData[index].isEditingTimeLimit = true;
                                                newData[index].tempTimeLimit = newData[index].timeLimit; // Store the original timeLimit
                                                setData(newData);
  };

  // Function to handle finishing editing mode
  const handleFinishEditID = (index: number, newID: string) => {
    const newData = [...data];
                                                newData[index].ID = newID;
                                                newData[index].isEditingID = false;
                                                setData(newData);
                                                onDataUpdate(newData);
  };

  const handleFinishEditTimeLimit = (index: number, newTimeLimit: string) => {
    const newData = [...data];
                                                newData[index].timeLimit = newTimeLimit;
                                                newData[index].isEditingTimeLimit = false;
                                                setData(newData);
                                                onDataUpdate(newData);
  };

  // Function to handle canceling editing mode
  const handleCancelEditID = (index: number) => {
    const newData = [...data];
                                                newData[index].ID = newData[index].tempID; // Restore the original ID
                                                newData[index].isEditingID = false;
                                                setData(newData);
  };

  const handleCancelEditTimeLimit = (index: number) => {
    const newData = [...data];
                                                newData[index].timeLimit = newData[index].tempTimeLimit; // Restore the original timeLimit
                                                newData[index].isEditingTimeLimit = false;
                                                setData(newData);
  };

                                                // Function to handle dragging and rearranging rows
                                                const handleDragStart = (
                                                event: React.DragEvent<HTMLTableCellElement>,
                                                  index: number
  ) => {
                                                    event.dataTransfer.setData("index", index.toString());
                                                  event.dataTransfer.setData("ID", data[index].ID);
                                                  event.dataTransfer.setData("timeLimit", data[index].timeLimit);
  };

                                                  const handleDrop = (
                                                  event: React.DragEvent<HTMLTableRowElement>,
                                                    dropIndex: number
  ) => {
    const draggedIndex = parseInt(event.dataTransfer.getData("index"));
                                                    const draggedID = event.dataTransfer.getData("ID");
                                                    const draggedTimeLimit = event.dataTransfer.getData("timeLimit");

                                                    // Swap the IDs of dragged and dropped cells
                                                    const newData = [...data];
                                                    newData[draggedIndex].ID = data[dropIndex].ID;
                                                    newData[dropIndex].ID = draggedID;
                                                    newData[draggedIndex].timeLimit = data[dropIndex].timeLimit;
                                                    newData[dropIndex].timeLimit = draggedTimeLimit;

                                                    setData(newData);
                                                    onDataUpdate(newData);
  };

  // Function to remove a row
  const removeRow = (index: number) => {
    // if only one row left, don't remove it
    if (data.length === 1) return;

    const newData = data.filter((_, i) => i !== index);
    // Update positions for the remaining rows
    const updatedData = newData.map((item, i) => ({
                                                      ...item,
                                                      position: i + 1,
    }));
                                                    setData(updatedData);
                                                    onDataUpdate(updatedData);
  };

                                                    return (
                                                    <div className="App" >
                                                      <table>
                                                        <thead>
                                                          <tr>
                                                            <th>Position < /th>
                                                              < th > DeviceID < /th>
                                                                < th > TimeLimit < /th>
                                                                  < th > </th>
                                                                  < /tr>
                                                                  < /thead>
                                                                  <tbody>
                                                                    {
                                                                      data.map((item, index) => (
                                                                        <tr
                                                                          key={index}
                                                                          onDragOver={(e) => e.preventDefault()}
                                                                          onDrop={(e) => handleDrop(e, index)
                                                                          }
                                                                        >
                                                                          <td>{item.position} < /td>
                                                                            < td
                                                                              className={`editable-cell`}
                                                                              onDoubleClick={() => handleEditID(index)}
                                                                              draggable
                                                                              onDragStart={(e) => handleDragStart(e, index)}
                                                                            >
                                                                              {
                                                                                item.isEditingID ? (
                                                                                  <textarea
                                                                                    placeholder="Enter DeviceID"
                                                                                    value={item.ID}
                                                                                    onChange={(e) =>
                                                                                      setData(
                                                                                        data.map((row, i) =>
                                                                                          i === index ? { ...row, ID: e.target.value } : row
                                                                                        )
                                                                                      )
                                                                                    }
                                                                                    autoFocus
                                                                                    onBlur={() => handleFinishEditID(index, data[index].ID)}
                                                                                    onKeyDown={(e) => {
                                                                                      if (e.key === "Escape") handleCancelEditID(index);
                                                                                      if (e.key === "Enter")
                                                                                        handleFinishEditID(index, data[index].ID);
                                                                                    }}
                                                                                  />
                                                                                ) : item.ID ? (
                                                                                  item.ID
                                                                                ) : (
  <span className= "empty-cell" > Double click to edit < /span>
                )}
</td>
  < td
className = {`editable-cell`}
onDoubleClick = {() => handleEditTimeLimit(index)}
draggable
onDragStart = {(e) => handleDragStart(e, index)}
              >
{
  item.isEditingTimeLimit ? (
    <textarea
                    placeholder= "Enter TimeLimit"
                    value={ item.timeLimit }
                    onChange={(e) =>
  setData(
    data.map((row, i) =>
      i === index
        ? { ...row, timeLimit: e.target.value }
        : row
    )
                      )
}
autoFocus
onBlur = {() =>
handleFinishEditTimeLimit(index, data[index].timeLimit)
                    }
onKeyDown = {(e) => {
  if (e.key === "Escape") handleCancelEditTimeLimit(index);
  if (e.key === "Enter")
    handleFinishEditTimeLimit(index, data[index].timeLimit);
}}
/>
                ) : item.timeLimit ? (
  item.timeLimit
) : (
  <span className= "empty-cell" > Double click to edit < /span>
                )}
</td>
  < td >
  <img
                  src={ TrashCanSVG }
alt = "Remove"
onClick = {() => removeRow(index)}
style = {{ cursor: "pointer" }}
/>
  < /td>
  < /tr>
          ))}
</tbody>
  < /table>
  < /div>
  );
}

export default DeviceTable;