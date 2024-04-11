import DeviceTable from "./DeviceTable";
import { useState } from "react";

const CreateRoute = () => {
  const [deviceData, setDeviceData] = useState([]);

  const handleDeviceDataUpdate = (newData) => {
    console.log(newData);
    setDeviceData(newData);
  };

  return <DeviceTable onDataUpdate={handleDeviceDataUpdate} />;
};

export default CreateRoute;
