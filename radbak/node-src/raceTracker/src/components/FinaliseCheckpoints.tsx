import React, { useEffect, useState } from "react";

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
  const [checkPoints, setCheckPoints] = useState<CheckPoints>({});

  useEffect(() => {
    let tempCheckPoints: CheckPoints = {};
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
            <th>Devices</th>
            {[...Array(laps !== "" ? laps : 24)].map((_, index) => (
              <th key={index}>Lap {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.keys(checkPoints).map((deviceID, index) => (
            <tr key={index}>
              <td>Device {deviceID}</td>
              {Object.keys(checkPoints[deviceID]).map((lap, index) => (
                <td key={index}>
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
                          )}
                          {isAutoTime && (
                            <span>{checkPoints[deviceID][lap].time}</span>
                          )}
                        </td>
                        <td>{checkPoints[deviceID][lap].position}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePost}>Post</button>
    </>
  );
};
export default FinaliseCheckpoints;
