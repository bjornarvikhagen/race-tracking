import { useEffect, useState } from "react";

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

const FinaliseCheckpoints = ({
  deviceData,
  laps,
  isAutoTime,
  autoTime,
}: FinaliseCheckpointsProps) => {
  const [checkPoints, setCheckPoints] = useState<{ [key: string]: string[] }>(
    {}
  );
  useEffect(() => {
    let tempCheckPoints: { [key: string]: string[] } = {};
    deviceData.forEach((device) => {
      tempCheckPoints[device.ID] = [];
      let lap = 0;
      let iterateLaps = laps !== "" ? laps : 24;
      for (lap; lap < iterateLaps!; lap++) {
        let tempCheckpointData = "";

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

          tempCheckpointData += `Timelimit: ${hours}:${remainingMinutes}`;
        } else {
          tempCheckpointData += "Timelimit: -";
        }

        let position = device.position + deviceData.length * lap;
        tempCheckpointData += ` | Position: ${position}`;

        tempCheckPoints[device.ID].push(tempCheckpointData);
      }
    });
    setCheckPoints(tempCheckPoints);
  }, [deviceData, laps, autoTime]); // update when deviceData, laps, or autoTime change

  return (
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
        {Object.keys(checkPoints)
          .reverse()
          .map((deviceID, index) => (
            <tr key={index}>
              <td>Device {deviceID}</td>
              {checkPoints[deviceID].map((timeLimit, idx) => (
                <td key={idx}>{timeLimit}</td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  );
};
export default FinaliseCheckpoints;
